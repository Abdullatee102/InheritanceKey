export enum PlanStatus {
  ACTIVE = 0,
  TRIGGERED = 1,
  READY_FOR_CLAIM = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export interface Beneficiary {
  account: string;
  percentageBps: number;
}

export interface PlanAsset {
  tokenAddress: string;
  totalDeposited: bigint;
  totalClaimed: bigint;
}

export interface DocumentReference {
  docHash: string;
  uri: string;
  title: string;
  beneficiary: string;
  createdAt: bigint;
}

export interface Plan {
  id: bigint;
  owner: string;
  name: string;
  inactivityPeriod: bigint;
  challengePeriod: bigint;
  lastActivity: bigint;
  triggerTimestamp: bigint;
  status: PlanStatus;
}

export interface ActivityItem {
  id: string;
  planId: bigint;
  type: 'CREATED' | 'CHECKIN' | 'DEPOSIT' | 'WITHDRAW' | 'TRIGGERED' | 'RECOVERED' | 'CLAIMED' | 'CANCELLED' | 'DOC_ADDED';
  title: string;
  description: string;
  timestamp: number;
  txHash?: string;
  userAddress?: string;
}

