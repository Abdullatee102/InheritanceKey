export const INHERITANCE_KEY_ADDRESS: `0x${string}` =
  (import.meta.env.VITE_INHERITANCE_KEY_CONTRACT_ADDRESS as `0x${string}`) ||
  '0x825d966777D71b1E4987284c1551fd928dE27ff4';

export const BOHR_RPC_URL = import.meta.env.VITE_BOHR_RPC_URL || 'https://rpc.bohr.life';
export const BOHR_EXPLORER_URL = import.meta.env.VITE_BOHR_EXPLORER_URL || 'https://scan.bohr.life';

export const INHERITANCE_KEY_ABI = [
  {
    type: 'constructor',
    inputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createPlan',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'inactivityPeriod', type: 'uint256', internalType: 'uint256' },
      { name: 'challengePeriod', type: 'uint256', internalType: 'uint256' },
      { name: 'beneficiaryAddrs', type: 'address[]', internalType: 'address[]' },
      { name: 'beneficiaryBps', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'depositBOT',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'depositERC20',
    inputs: [
      { name: 'planId', type: 'uint256', internalType: 'uint256' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawAsset',
    inputs: [
      { name: 'planId', type: 'uint256', internalType: 'uint256' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'checkIn',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'triggerSuccession',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'recoverPlan',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimInheritance',
    inputs: [
      { name: 'planId', type: 'uint256', internalType: 'uint256' },
      { name: 'token', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelPlan',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPlan',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct InheritanceKey.Plan',
        components: [
          { name: 'id', type: 'uint256', internalType: 'uint256' },
          { name: 'owner', type: 'address', internalType: 'address' },
          { name: 'name', type: 'string', internalType: 'string' },
          { name: 'inactivityPeriod', type: 'uint256', internalType: 'uint256' },
          { name: 'challengePeriod', type: 'uint256', internalType: 'uint256' },
          { name: 'lastActivity', type: 'uint256', internalType: 'uint256' },
          { name: 'triggerTimestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'status', type: 'uint8', internalType: 'enum InheritanceKey.PlanStatus' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBeneficiaries',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct InheritanceKey.Beneficiary[]',
        components: [
          { name: 'account', type: 'address', internalType: 'address' },
          { name: 'percentageBps', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlanAssetTokens',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlanDocuments',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct InheritanceKey.DocumentReference[]',
        components: [
          { name: 'docHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'uri', type: 'string', internalType: 'string' },
          { name: 'title', type: 'string', internalType: 'string' },
          { name: 'beneficiary', type: 'address', internalType: 'address' },
          { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserPlans',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserBeneficiaryPlans',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'planDeposits',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'planClaimedAmounts',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'PAUSER_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
] as const;

