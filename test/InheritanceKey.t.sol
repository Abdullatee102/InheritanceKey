// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/InheritanceKey.sol";
import "./mocks/MockERC20.sol";

contract InheritanceKeyTest is Test {
    InheritanceKey public inheritanceKey;
    MockERC20 public mockToken;

    address public owner = address(0x101);
    address public beneficiary1 = address(0x201);
    address public beneficiary2 = address(0x202);
    address public stranger = address(0x999);

    function setUp() public {
        inheritanceKey = new InheritanceKey();

        vm.prank(owner);
        mockToken = new MockERC20("Test Token", "TTK");
        vm.deal(owner, 100 ether);
        vm.deal(stranger, 10 ether);

        vm.prank(owner);
        mockToken.mint(owner, 100_000 * 10 ** 18);
    }

    function test_CreatePlan_Success() public {
        vm.startPrank(owner);

        address[] memory addrs = new address[](2);
        addrs[0] = beneficiary1;
        addrs[1] = beneficiary2;

        uint256[] memory bps = new uint256[](2);
        bps[0] = 6000; // 60%
        bps[1] = 4000; // 40%

        uint256 planId = inheritanceKey.createPlan(
            "Family Estate",
            30 days,
            7 days,
            addrs,
            bps
        );

        InheritanceKey.Plan memory plan = inheritanceKey.getPlan(planId);
        assertEq(plan.id, 1);
        assertEq(plan.owner, owner);
        assertEq(plan.name, "Family Estate");
        assertEq(plan.inactivityPeriod, 30 days);
        assertEq(plan.challengePeriod, 7 days);
        assertEq(uint8(plan.status), uint8(InheritanceKey.PlanStatus.ACTIVE));

        InheritanceKey.Beneficiary[] memory bList = inheritanceKey
            .getBeneficiaries(planId);
        assertEq(bList.length, 2);
        assertEq(bList[0].account, beneficiary1);
        assertEq(bList[0].percentageBps, 6000);
        assertEq(bList[1].account, beneficiary2);
        assertEq(bList[1].percentageBps, 4000);

        vm.stopPrank();
    }

    function test_CreatePlan_RevertInvalidBps() public {
        vm.startPrank(owner);

        address[] memory addrs = new address[](2);
        addrs[0] = beneficiary1;
        addrs[1] = beneficiary2;

        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000;
        bps[1] = 4000; // Sum = 9000 (90%) != 100%

        vm.expectRevert(
            "InheritanceKey: beneficiary allocations must total 100%"
        );
        inheritanceKey.createPlan(
            "Invalid BPS Plan",
            30 days,
            7 days,
            addrs,
            bps
        );

        vm.stopPrank();
    }

    function test_DepositAndWithdrawBOT() public {
        vm.startPrank(owner);
        address[] memory addrs = new address[](1);
        addrs[0] = beneficiary1;
        uint256[] memory bps = new uint256[](1);
        bps[0] = 10000;

        uint256 planId = inheritanceKey.createPlan(
            "BOT Plan",
            30 days,
            7 days,
            addrs,
            bps
        );

        // Deposit 5 BOT
        inheritanceKey.depositBOT{value: 5 ether}(planId);
        assertEq(inheritanceKey.planDeposits(planId, address(0)), 5 ether);
        assertEq(address(inheritanceKey).balance, 5 ether);

        // Withdraw 2 BOT
        uint256 balBefore = owner.balance;
        inheritanceKey.withdrawAsset(planId, address(0), 2 ether);
        assertEq(inheritanceKey.planDeposits(planId, address(0)), 3 ether);
        assertEq(owner.balance, balBefore + 2 ether);

        vm.stopPrank();
    }

    function test_DepositERC20() public {
        vm.startPrank(owner);
        address[] memory addrs = new address[](1);
        addrs[0] = beneficiary1;
        uint256[] memory bps = new uint256[](1);
        bps[0] = 10000;

        uint256 planId = inheritanceKey.createPlan(
            "Token Plan",
            30 days,
            7 days,
            addrs,
            bps
        );

        mockToken.approve(address(inheritanceKey), 1000 * 10 ** 18);
        inheritanceKey.depositERC20(
            planId,
            address(mockToken),
            1000 * 10 ** 18
        );

        assertEq(
            inheritanceKey.planDeposits(planId, address(mockToken)),
            1000 * 10 ** 18
        );
        assertEq(mockToken.balanceOf(address(inheritanceKey)), 1000 * 10 ** 18);

        vm.stopPrank();
    }

    function test_CheckIn_ResetsInactivityTimer() public {
        vm.startPrank(owner);
        address[] memory addrs = new address[](1);
        addrs[0] = beneficiary1;
        uint256[] memory bps = new uint256[](1);
        bps[0] = 10000;

        uint256 planId = inheritanceKey.createPlan(
            "Checkin Plan",
            30 days,
            7 days,
            addrs,
            bps
        );

        uint256 initialActivity = inheritanceKey.getPlan(planId).lastActivity;
        vm.warp(block.timestamp + 10 days);

        inheritanceKey.checkIn(planId);
        uint256 newActivity = inheritanceKey.getPlan(planId).lastActivity;

        assertEq(newActivity, initialActivity + 10 days);
        vm.stopPrank();
    }

    function test_TriggerSuccession_And_OwnerRecovery() public {
        vm.startPrank(owner);
        address[] memory addrs = new address[](1);
        addrs[0] = beneficiary1;
        uint256[] memory bps = new uint256[](1);
        bps[0] = 10000;

        uint256 planId = inheritanceKey.createPlan(
            "Recovery Plan",
            30 days,
            7 days,
            addrs,
            bps
        );
        inheritanceKey.depositBOT{value: 10 ether}(planId);
        vm.stopPrank();

        // Warp time past 30 days inactivity
        vm.warp(block.timestamp + 31 days);

        // Stranger triggers succession
        vm.prank(stranger);
        inheritanceKey.triggerSuccession(planId);

        InheritanceKey.Plan memory planAfterTrigger = inheritanceKey.getPlan(
            planId
        );
        assertEq(
            uint8(planAfterTrigger.status),
            uint8(InheritanceKey.PlanStatus.TRIGGERED)
        );
        assertTrue(inheritanceKey.isChallengeActive(planId));

        // Owner recovers within 7 days challenge period
        vm.prank(owner);
        inheritanceKey.recoverPlan(planId);

        InheritanceKey.Plan memory planAfterRecovery = inheritanceKey.getPlan(
            planId
        );
        assertEq(
            uint8(planAfterRecovery.status),
            uint8(InheritanceKey.PlanStatus.ACTIVE)
        );
        assertFalse(inheritanceKey.isChallengeActive(planId));
    }

    function test_FullSuccessionAndBeneficiaryClaim() public {
        vm.startPrank(owner);
        address[] memory addrs = new address[](2);
        addrs[0] = beneficiary1;
        addrs[1] = beneficiary2;

        uint256[] memory bps = new uint256[](2);
        bps[0] = 6000; // 60%
        bps[1] = 4000; // 40%

        uint256 planId = inheritanceKey.createPlan(
            "Claim Plan",
            30 days,
            7 days,
            addrs,
            bps
        );
        inheritanceKey.depositBOT{value: 10 ether}(planId);

        mockToken.approve(address(inheritanceKey), 1000 * 10 ** 18);
        inheritanceKey.depositERC20(
            planId,
            address(mockToken),
            1000 * 10 ** 18
        );
        vm.stopPrank();

        // Fast forward past inactivity period (30 days)
        vm.warp(block.timestamp + 31 days);

        // Trigger succession
        vm.prank(stranger);
        inheritanceKey.triggerSuccession(planId);

        // Try to claim during challenge period -> Reverts
        vm.prank(beneficiary1);
        vm.expectRevert("InheritanceKey: challenge period is still active");
        inheritanceKey.claimInheritance(planId, address(0));

        // Fast forward past challenge period (7 days)
        vm.warp(block.timestamp + 8 days);
        assertTrue(inheritanceKey.isClaimable(planId, beneficiary1));

        // Beneficiary 1 claims BOT (60% of 10 BOT = 6 BOT)
        uint256 b1BalBefore = beneficiary1.balance;
        vm.prank(beneficiary1);
        inheritanceKey.claimInheritance(planId, address(0));
        assertEq(beneficiary1.balance, b1BalBefore + 6 ether);

        // Beneficiary 2 claims BOT (40% of 10 BOT = 4 BOT)
        uint256 b2BalBefore = beneficiary2.balance;
        vm.prank(beneficiary2);
        inheritanceKey.claimInheritance(planId, address(0));
        assertEq(beneficiary2.balance, b2BalBefore + 4 ether);

        // Beneficiary 1 claims ERC-20 (60% of 1000 = 600 TTK)
        vm.prank(beneficiary1);
        inheritanceKey.claimInheritance(planId, address(mockToken));
        assertEq(mockToken.balanceOf(beneficiary1), 600 * 10 ** 18);

        // Beneficiary 2 claims ERC-20 (40% of 1000 = 400 TTK)
        vm.prank(beneficiary2);
        inheritanceKey.claimInheritance(planId, address(mockToken));
        assertEq(mockToken.balanceOf(beneficiary2), 400 * 10 ** 18);

        // Check plan status completed
        InheritanceKey.Plan memory finalPlan = inheritanceKey.getPlan(planId);
        assertEq(
            uint8(finalPlan.status),
            uint8(InheritanceKey.PlanStatus.COMPLETED)
        );
    }

    function test_DoubleClaim_Reverts() public {
        vm.startPrank(owner);
        address[] memory addrs = new address[](2);
        addrs[0] = beneficiary1;
        addrs[1] = beneficiary2;
        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000;
        bps[1] = 5000;

        uint256 planId = inheritanceKey.createPlan(
            "Multi Beneficiary Plan",
            30 days,
            7 days,
            addrs,
            bps
        );
        inheritanceKey.depositBOT{value: 10 ether}(planId);
        mockToken.approve(address(inheritanceKey), 1000 * 10 ** 18);
        inheritanceKey.depositERC20(
            planId,
            address(mockToken),
            1000 * 10 ** 18
        );
        vm.stopPrank();

        vm.warp(block.timestamp + 38 days);
        vm.prank(stranger);
        inheritanceKey.triggerSuccession(planId);
        vm.warp(block.timestamp + 8 days);

        // Beneficiary 1 claims BOT (Plan stays READY_FOR_CLAIM because ERC20 & B2 remain)
        vm.prank(beneficiary1);
        inheritanceKey.claimInheritance(planId, address(0));

        // Second claim attempt for same token fails with double claim revert
        vm.prank(beneficiary1);
        vm.expectRevert("InheritanceKey: asset already claimed by caller");
        inheritanceKey.claimInheritance(planId, address(0));
    }

    function test_DocumentReferenceCommitment() public {
        vm.startPrank(owner);
        address[] memory addrs = new address[](1);
        addrs[0] = beneficiary1;
        uint256[] memory bps = new uint256[](1);
        bps[0] = 10000;

        uint256 planId = inheritanceKey.createPlan(
            "Doc Plan",
            30 days,
            7 days,
            addrs,
            bps
        );

        bytes32 docHash = keccak256("Encrypted Estate Key");
        inheritanceKey.addDocumentReference(
            planId,
            docHash,
            "ipfs://Qm123...",
            "Secret Key Hash",
            beneficiary1
        );

        InheritanceKey.DocumentReference[] memory docs = inheritanceKey
            .getPlanDocuments(planId);
        assertEq(docs.length, 1);
        assertEq(docs[0].docHash, docHash);
        assertEq(docs[0].title, "Secret Key Hash");
        assertEq(docs[0].beneficiary, beneficiary1);

        vm.stopPrank();
    }

    function test_Fuzz_ClaimAccountingInvariant(
        uint96 amount,
        uint16 bps1
    ) public {
        vm.assume(amount > 10000 && amount < 1_000_000 ether);
        vm.assume(bps1 > 0 && bps1 < 10000);

        uint256 bps2 = 10000 - bps1;

        vm.deal(owner, amount);
        vm.startPrank(owner);

        address[] memory addrs = new address[](2);
        addrs[0] = beneficiary1;
        addrs[1] = beneficiary2;

        uint256[] memory bps = new uint256[](2);
        bps[0] = bps1;
        bps[1] = bps2;

        uint256 planId = inheritanceKey.createPlan(
            "Fuzz Plan",
            30 days,
            7 days,
            addrs,
            bps
        );
        inheritanceKey.depositBOT{value: amount}(planId);
        vm.stopPrank();

        vm.warp(block.timestamp + 38 days);
        vm.prank(stranger);
        inheritanceKey.triggerSuccession(planId);
        vm.warp(block.timestamp + 8 days);

        vm.prank(beneficiary1);
        inheritanceKey.claimInheritance(planId, address(0));

        vm.prank(beneficiary2);
        inheritanceKey.claimInheritance(planId, address(0));

        uint256 totalClaimed = inheritanceKey.planClaimedAmounts(
            planId,
            address(0)
        );
        uint256 totalDeposited = inheritanceKey.planDeposits(
            planId,
            address(0)
        );

        // Strict invariant: total claimed <= total deposited
        assertTrue(totalClaimed <= totalDeposited);
    }
}
