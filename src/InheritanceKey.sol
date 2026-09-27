// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title InheritanceKey
 * @notice Programmable Digital Ownership Succession Protocol
 * @dev Single unified contract managing inheritance plans, beneficiary allocations, inactivity timers,
 * challenge windows, owner recovery, asset custody (BOT & ERC-20), and non-custodial document commitments.
 *
 * Security Invariant: Protocol administrators have NO authority or functions to withdraw or redirect
 * user inheritance assets. Owner controls the plan while active. Beneficiaries claim according to on-chain rules.
 */
contract InheritanceKey is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    enum PlanStatus {
        ACTIVE, // 0: Owner active, deposits/withdrawals/updates allowed
        TRIGGERED, // 1: Inactivity elapsed, succession triggered, challenge timer active
        READY_FOR_CLAIM, // 2: Challenge period ended without recovery, claims open
        COMPLETED, // 3: All beneficiary allocations claimed
        CANCELLED // 4: Owner cancelled plan, remaining assets returned
    }

    struct Beneficiary {
        address account;
        uint256 percentageBps; // Basis points (10000 = 100%)
    }

    struct PlanAsset {
        address tokenAddress; // address(0) for native BOT
        uint256 totalDeposited;
        uint256 totalClaimed;
    }

    struct DocumentReference {
        bytes32 docHash;
        string uri;
        string title;
        address beneficiary;
        uint256 createdAt;
    }

    struct Plan {
        uint256 id;
        address owner;
        string name;
        uint256 inactivityPeriod; // Seconds of inactivity required to trigger
        uint256 challengePeriod; // Seconds of challenge window after trigger
        uint256 lastActivity; // Timestamp of last owner check-in or interaction
        uint256 triggerTimestamp; // Timestamp when succession was triggered (0 if not triggered)
        PlanStatus status;
    }

    // Protocol Constants & Configurable Limits
    uint256 public minInactivityPeriod = 1 hours; // Default min inactivity
    uint256 public maxInactivityPeriod = 3650 days; // ~10 years
    uint256 public minChallengePeriod = 0; // Allowed 0 for testing flexibility
    uint256 public maxChallengePeriod = 365 days; // 1 year max challenge

    uint256 public nextPlanId = 1;

    // Plan Storage
    mapping(uint256 => Plan) public plans;
    mapping(uint256 => Beneficiary[]) internal _planBeneficiaries;
    mapping(uint256 => address[]) internal _planAssetTokens;
    mapping(uint256 => mapping(address => bool)) internal _isTokenInPlan;

    // Asset Accounting: planId => tokenAddress => amount
    mapping(uint256 => mapping(address => uint256)) public planDeposits;
    mapping(uint256 => mapping(address => uint256)) public planClaimedAmounts;

    // Claim Tracking: planId => beneficiary => tokenAddress => claimed?
    mapping(uint256 => mapping(address => mapping(address => bool)))
        public hasClaimed;

    // Document References: planId => DocumentReference[]
    mapping(uint256 => DocumentReference[]) internal _planDocuments;

    // User Indexing: owner => planIds
    mapping(address => uint256[]) internal _ownerPlans;
    // Beneficiary Indexing: beneficiary => planIds
    mapping(address => uint256[]) internal _beneficiaryPlans;
    mapping(address => mapping(uint256 => bool)) internal _isBeneficiaryIndexed;

    // Events
    event PlanCreated(
        uint256 indexed planId,
        address indexed owner,
        string name,
        uint256 inactivityPeriod,
        uint256 challengePeriod
    );
    event PlanUpdated(
        uint256 indexed planId,
        string name,
        uint256 inactivityPeriod,
        uint256 challengePeriod
    );
    event BeneficiaryAdded(
        uint256 indexed planId,
        address indexed beneficiary,
        uint256 percentageBps
    );
    event BeneficiariesUpdated(uint256 indexed planId, uint256 count);
    event AssetDeposited(
        uint256 indexed planId,
        address indexed token,
        uint256 amount,
        address indexed depositor
    );
    event AssetWithdrawn(
        uint256 indexed planId,
        address indexed token,
        uint256 amount,
        address indexed owner
    );
    event CheckIn(
        uint256 indexed planId,
        address indexed owner,
        uint256 timestamp
    );
    event SuccessionTriggered(
        uint256 indexed planId,
        address indexed triggerer,
        uint256 triggerTimestamp,
        uint256 challengeExpiry
    );
    event PlanRecovered(
        uint256 indexed planId,
        address indexed owner,
        uint256 timestamp
    );
    event InheritanceClaimed(
        uint256 indexed planId,
        address indexed beneficiary,
        address indexed token,
        uint256 amount
    );
    event PlanCompleted(uint256 indexed planId);
    event PlanCancelled(uint256 indexed planId, address indexed owner);
    event DocumentAdded(
        uint256 indexed planId,
        bytes32 docHash,
        string title,
        address indexed beneficiary
    );
    event ProtocolLimitsUpdated(
        uint256 minInactivityPeriod,
        uint256 maxInactivityPeriod,
        uint256 minChallengePeriod,
        uint256 maxChallengePeriod
    );

    // Modifiers
    modifier onlyPlanOwner(uint256 planId) {
        require(
            plans[planId].owner == msg.sender,
            "InheritanceKey: caller is not plan owner"
        );
        _;
    }

    modifier planExists(uint256 planId) {
        require(plans[planId].id != 0, "InheritanceKey: plan does not exist");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @notice Create a new Inheritance Plan
     */
    function createPlan(
        string memory name,
        uint256 inactivityPeriod,
        uint256 challengePeriod,
        address[] memory beneficiaryAddrs,
        uint256[] memory beneficiaryBps
    ) external whenNotPaused returns (uint256 planId) {
        require(bytes(name).length > 0, "InheritanceKey: empty plan name");
        require(
            inactivityPeriod >= minInactivityPeriod &&
                inactivityPeriod <= maxInactivityPeriod,
            "InheritanceKey: invalid inactivity period"
        );
        require(
            challengePeriod >= minChallengePeriod &&
                challengePeriod <= maxChallengePeriod,
            "InheritanceKey: invalid challenge period"
        );
        require(
            beneficiaryAddrs.length == beneficiaryBps.length,
            "InheritanceKey: beneficiary array mismatch"
        );

        planId = nextPlanId++;

        plans[planId] = Plan({
            id: planId,
            owner: msg.sender,
            name: name,
            inactivityPeriod: inactivityPeriod,
            challengePeriod: challengePeriod,
            lastActivity: block.timestamp,
            triggerTimestamp: 0,
            status: PlanStatus.ACTIVE
        });

        _ownerPlans[msg.sender].push(planId);

        if (beneficiaryAddrs.length > 0) {
            _setBeneficiaries(planId, beneficiaryAddrs, beneficiaryBps);
        }

        emit PlanCreated(
            planId,
            msg.sender,
            name,
            inactivityPeriod,
            challengePeriod
        );
    }

    function _setBeneficiaries(
        uint256 planId,
        address[] memory beneficiaryAddrs,
        uint256[] memory beneficiaryBps
    ) internal {
        delete _planBeneficiaries[planId];
        uint256 totalBps = 0;

        for (uint256 i = 0; i < beneficiaryAddrs.length; i++) {
            address bAddr = beneficiaryAddrs[i];
            uint256 bps = beneficiaryBps[i];

            require(
                bAddr != address(0),
                "InheritanceKey: zero address beneficiary"
            );
            require(
                bAddr != plans[planId].owner,
                "InheritanceKey: owner cannot be beneficiary"
            );
            require(
                bps > 0 && bps <= 10000,
                "InheritanceKey: invalid percentage BPS"
            );

            for (uint256 j = 0; j < i; j++) {
                require(
                    beneficiaryAddrs[j] != bAddr,
                    "InheritanceKey: duplicate beneficiary"
                );
            }

            _planBeneficiaries[planId].push(
                Beneficiary({account: bAddr, percentageBps: bps})
            );
            totalBps += bps;

            if (!_isBeneficiaryIndexed[bAddr][planId]) {
                _beneficiaryPlans[bAddr].push(planId);
                _isBeneficiaryIndexed[bAddr][planId] = true;
            }
        }

        require(
            totalBps == 10000,
            "InheritanceKey: beneficiary allocations must total 100%"
        );
        emit BeneficiariesUpdated(planId, beneficiaryAddrs.length);
    }

    function updatePlanSettings(
        uint256 planId,
        string memory name,
        uint256 inactivityPeriod,
        uint256 challengePeriod
    ) external planExists(planId) onlyPlanOwner(planId) whenNotPaused {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.ACTIVE,
            "InheritanceKey: plan not active"
        );
        require(bytes(name).length > 0, "InheritanceKey: empty plan name");
        require(
            inactivityPeriod >= minInactivityPeriod &&
                inactivityPeriod <= maxInactivityPeriod,
            "InheritanceKey: invalid inactivity period"
        );
        require(
            challengePeriod >= minChallengePeriod &&
                challengePeriod <= maxChallengePeriod,
            "InheritanceKey: invalid challenge period"
        );

        plan.name = name;
        plan.inactivityPeriod = inactivityPeriod;
        plan.challengePeriod = challengePeriod;
        plan.lastActivity = block.timestamp;

        emit PlanUpdated(planId, name, inactivityPeriod, challengePeriod);
        emit CheckIn(planId, msg.sender, block.timestamp);
    }

    function updateBeneficiaries(
        uint256 planId,
        address[] memory beneficiaryAddrs,
        uint256[] memory beneficiaryBps
    ) external planExists(planId) onlyPlanOwner(planId) whenNotPaused {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.ACTIVE,
            "InheritanceKey: plan not active"
        );
        require(
            beneficiaryAddrs.length == beneficiaryBps.length,
            "InheritanceKey: array mismatch"
        );

        _setBeneficiaries(planId, beneficiaryAddrs, beneficiaryBps);
        plan.lastActivity = block.timestamp;
        emit CheckIn(planId, msg.sender, block.timestamp);
    }

    function depositBOT(
        uint256 planId
    ) external payable nonReentrant planExists(planId) whenNotPaused {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.ACTIVE,
            "InheritanceKey: plan not active"
        );
        require(msg.value > 0, "InheritanceKey: zero deposit amount");

        address token = address(0);
        if (!_isTokenInPlan[planId][token]) {
            _planAssetTokens[planId].push(token);
            _isTokenInPlan[planId][token] = true;
        }

        planDeposits[planId][token] += msg.value;

        if (msg.sender == plan.owner) {
            plan.lastActivity = block.timestamp;
            emit CheckIn(planId, msg.sender, block.timestamp);
        }

        emit AssetDeposited(planId, token, msg.value, msg.sender);
    }

    function depositERC20(
        uint256 planId,
        address token,
        uint256 amount
    ) external nonReentrant planExists(planId) whenNotPaused {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.ACTIVE,
            "InheritanceKey: plan not active"
        );
        require(
            token != address(0),
            "InheritanceKey: invalid ERC20 token address"
        );
        require(amount > 0, "InheritanceKey: zero deposit amount");

        uint256 balBefore = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 actualReceived = IERC20(token).balanceOf(address(this)) -
            balBefore;
        require(actualReceived > 0, "InheritanceKey: no tokens received");

        if (!_isTokenInPlan[planId][token]) {
            _planAssetTokens[planId].push(token);
            _isTokenInPlan[planId][token] = true;
        }

        planDeposits[planId][token] += actualReceived;

        if (msg.sender == plan.owner) {
            plan.lastActivity = block.timestamp;
            emit CheckIn(planId, msg.sender, block.timestamp);
        }

        emit AssetDeposited(planId, token, actualReceived, msg.sender);
    }

    function withdrawAsset(
        uint256 planId,
        address token,
        uint256 amount
    )
        external
        nonReentrant
        planExists(planId)
        onlyPlanOwner(planId)
        whenNotPaused
    {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.ACTIVE,
            "InheritanceKey: plan not active"
        );
        require(amount > 0, "InheritanceKey: zero amount");
        require(
            planDeposits[planId][token] >= amount,
            "InheritanceKey: insufficient plan balance"
        );

        planDeposits[planId][token] -= amount;
        plan.lastActivity = block.timestamp;

        emit AssetWithdrawn(planId, token, amount, msg.sender);
        emit CheckIn(planId, msg.sender, block.timestamp);

        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "InheritanceKey: BOT transfer failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }

    function checkIn(
        uint256 planId
    ) external planExists(planId) onlyPlanOwner(planId) {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.ACTIVE ||
                plan.status == PlanStatus.TRIGGERED,
            "InheritanceKey: plan cannot check-in from current status"
        );

        if (plan.status == PlanStatus.TRIGGERED) {
            plan.status = PlanStatus.ACTIVE;
            plan.triggerTimestamp = 0;
            emit PlanRecovered(planId, msg.sender, block.timestamp);
        }

        plan.lastActivity = block.timestamp;
        emit CheckIn(planId, msg.sender, block.timestamp);
    }

    function triggerSuccession(
        uint256 planId
    ) external planExists(planId) whenNotPaused {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.ACTIVE,
            "InheritanceKey: plan is not active"
        );
        require(
            block.timestamp >= plan.lastActivity + plan.inactivityPeriod,
            "InheritanceKey: inactivity period has not elapsed"
        );

        plan.status = PlanStatus.TRIGGERED;
        plan.triggerTimestamp = block.timestamp;

        emit SuccessionTriggered(
            planId,
            msg.sender,
            block.timestamp,
            block.timestamp + plan.challengePeriod
        );
    }

    function recoverPlan(
        uint256 planId
    ) external planExists(planId) onlyPlanOwner(planId) {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.TRIGGERED,
            "InheritanceKey: plan is not under challenge"
        );

        plan.status = PlanStatus.ACTIVE;
        plan.triggerTimestamp = 0;
        plan.lastActivity = block.timestamp;

        emit PlanRecovered(planId, msg.sender, block.timestamp);
        emit CheckIn(planId, msg.sender, block.timestamp);
    }

    function claimInheritance(
        uint256 planId,
        address token
    ) external nonReentrant planExists(planId) whenNotPaused {
        Plan storage plan = plans[planId];

        if (plan.status == PlanStatus.TRIGGERED) {
            require(
                block.timestamp >= plan.triggerTimestamp + plan.challengePeriod,
                "InheritanceKey: challenge period is still active"
            );
            plan.status = PlanStatus.READY_FOR_CLAIM;
        }

        require(
            plan.status == PlanStatus.READY_FOR_CLAIM,
            "InheritanceKey: plan is not ready for claim"
        );

        require(
            !hasClaimed[planId][msg.sender][token],
            "InheritanceKey: asset already claimed by caller"
        );

        uint256 beneficiaryBps = _getBeneficiaryBps(planId, msg.sender);
        require(
            beneficiaryBps > 0,
            "InheritanceKey: caller is not a designated beneficiary"
        );

        uint256 totalDeposited = planDeposits[planId][token];
        require(
            totalDeposited > 0,
            "InheritanceKey: no deposited balance for token"
        );

        uint256 claimAmount = (totalDeposited * beneficiaryBps) / 10000;
        require(claimAmount > 0, "InheritanceKey: zero claimable amount");

        hasClaimed[planId][msg.sender][token] = true;
        planClaimedAmounts[planId][token] += claimAmount;

        emit InheritanceClaimed(planId, msg.sender, token, claimAmount);
        _checkPlanCompletion(planId);

        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: claimAmount}("");
            require(success, "InheritanceKey: BOT claim transfer failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, claimAmount);
        }
    }

    function cancelPlan(
        uint256 planId
    )
        external
        nonReentrant
        planExists(planId)
        onlyPlanOwner(planId)
        whenNotPaused
    {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.ACTIVE,
            "InheritanceKey: plan not active"
        );

        plan.status = PlanStatus.CANCELLED;
        emit PlanCancelled(planId, msg.sender);

        address[] memory tokens = _planAssetTokens[planId];
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 totalDep = planDeposits[planId][token];
            uint256 totalCl = planClaimedAmounts[planId][token];
            uint256 remaining = totalDep > totalCl ? totalDep - totalCl : 0;

            if (remaining > 0) {
                planDeposits[planId][token] = totalCl;
                emit AssetWithdrawn(planId, token, remaining, msg.sender);
                if (token == address(0)) {
                    (bool success, ) = payable(msg.sender).call{
                        value: remaining
                    }("");
                    require(success, "InheritanceKey: refund transfer failed");
                } else {
                    IERC20(token).safeTransfer(msg.sender, remaining);
                }
            }
        }
    }

    function addDocumentReference(
        uint256 planId,
        bytes32 docHash,
        string memory uri,
        string memory title,
        address beneficiary
    ) external planExists(planId) onlyPlanOwner(planId) whenNotPaused {
        Plan storage plan = plans[planId];
        require(
            plan.status == PlanStatus.ACTIVE,
            "InheritanceKey: plan not active"
        );
        require(docHash != bytes32(0), "InheritanceKey: invalid doc hash");
        require(bytes(title).length > 0, "InheritanceKey: empty title");

        _planDocuments[planId].push(
            DocumentReference({
                docHash: docHash,
                uri: uri,
                title: title,
                beneficiary: beneficiary,
                createdAt: block.timestamp
            })
        );

        emit DocumentAdded(planId, docHash, title, beneficiary);
    }

    // Protocol Admin Functions
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function setProtocolLimits(
        uint256 _minInactivity,
        uint256 _maxInactivity,
        uint256 _minChallenge,
        uint256 _maxChallenge
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            _minInactivity <= _maxInactivity,
            "InheritanceKey: invalid inactivity bounds"
        );
        require(
            _minChallenge <= _maxChallenge,
            "InheritanceKey: invalid challenge bounds"
        );

        minInactivityPeriod = _minInactivity;
        maxInactivityPeriod = _maxInactivity;
        minChallengePeriod = _minChallenge;
        maxChallengePeriod = _maxChallenge;

        emit ProtocolLimitsUpdated(
            _minInactivity,
            _maxInactivity,
            _minChallenge,
            _maxChallenge
        );
    }

    // Internal Helpers
    function _getBeneficiaryBps(
        uint256 planId,
        address account
    ) internal view returns (uint256) {
        Beneficiary[] memory bList = _planBeneficiaries[planId];
        for (uint256 i = 0; i < bList.length; i++) {
            if (bList[i].account == account) {
                return bList[i].percentageBps;
            }
        }
        return 0;
    }

    function _checkPlanCompletion(uint256 planId) internal {
        Beneficiary[] memory bList = _planBeneficiaries[planId];
        address[] memory tokens = _planAssetTokens[planId];

        if (bList.length == 0 || tokens.length == 0) return;

        bool allClaimed = true;
        for (uint256 i = 0; i < bList.length; i++) {
            for (uint256 j = 0; j < tokens.length; j++) {
                if (!hasClaimed[planId][bList[i].account][tokens[j]]) {
                    allClaimed = false;
                    break;
                }
            }
            if (!allClaimed) break;
        }

        if (allClaimed) {
            plans[planId].status = PlanStatus.COMPLETED;
            emit PlanCompleted(planId);
        }
    }

    // View Functions
    function getPlan(
        uint256 planId
    ) external view planExists(planId) returns (Plan memory) {
        return plans[planId];
    }

    function getBeneficiaries(
        uint256 planId
    ) external view planExists(planId) returns (Beneficiary[] memory) {
        return _planBeneficiaries[planId];
    }

    function getPlanAssetTokens(
        uint256 planId
    ) external view planExists(planId) returns (address[] memory) {
        return _planAssetTokens[planId];
    }

    function getPlanDocuments(
        uint256 planId
    ) external view planExists(planId) returns (DocumentReference[] memory) {
        return _planDocuments[planId];
    }

    function getUserPlans(
        address user
    ) external view returns (uint256[] memory) {
        return _ownerPlans[user];
    }

    function getUserBeneficiaryPlans(
        address user
    ) external view returns (uint256[] memory) {
        return _beneficiaryPlans[user];
    }

    function getClaimableAmount(
        uint256 planId,
        address beneficiary,
        address token
    ) external view planExists(planId) returns (uint256) {
        if (hasClaimed[planId][beneficiary][token]) return 0;
        uint256 bps = _getBeneficiaryBps(planId, beneficiary);
        if (bps == 0) return 0;
        uint256 totalDep = planDeposits[planId][token];
        return (totalDep * bps) / 10000;
    }

    function isSuccessionTriggerable(
        uint256 planId
    ) external view planExists(planId) returns (bool) {
        Plan memory plan = plans[planId];
        return (plan.status == PlanStatus.ACTIVE &&
            block.timestamp >= plan.lastActivity + plan.inactivityPeriod);
    }

    function isChallengeActive(
        uint256 planId
    ) external view planExists(planId) returns (bool) {
        Plan memory plan = plans[planId];
        return (plan.status == PlanStatus.TRIGGERED &&
            block.timestamp < plan.triggerTimestamp + plan.challengePeriod);
    }

    function isClaimable(
        uint256 planId,
        address beneficiary
    ) external view planExists(planId) returns (bool) {
        Plan memory plan = plans[planId];
        if (_getBeneficiaryBps(planId, beneficiary) == 0) return false;

        if (plan.status == PlanStatus.READY_FOR_CLAIM) return true;
        if (
            plan.status == PlanStatus.TRIGGERED &&
            block.timestamp >= plan.triggerTimestamp + plan.challengePeriod
        ) {
            return true;
        }
        return false;
    }

    receive() external payable {
        revert("InheritanceKey: use depositBOT(planId)");
    }
}
