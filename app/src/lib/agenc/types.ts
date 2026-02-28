import { PublicKey } from '@solana/web3.js';

export interface OnChainAgent {
  address: PublicKey;
  agentId: number[];
  authority: PublicKey;
  capabilities: bigint;
  status: any;
  endpoint: string;
  metadataUri: string;
  registeredAt: number;
  lastActive: number;
  tasksCompleted: number;
  totalEarned: bigint;
  reputation: number;
  activeTasks: number;
  stake: bigint;
  bump: number;
}

export interface OnChainTask {
  address: PublicKey;
  taskId: number[];
  creator: PublicKey;
  requiredCapabilities: bigint;
  description: number[];
  constraintHash: number[];
  rewardAmount: bigint;
  maxWorkers: number;
  currentWorkers: number;
  status: any;
  taskType: any;
  createdAt: number;
  deadline: number;
  completedAt: number;
  escrow: PublicKey;
  result: number[];
  completions: number;
  requiredCompletions: number;
  bump: number;
  protocolFeeBps: number;
  dependsOn: PublicKey | null;
  minReputation: number;
  rewardMint: PublicKey | null;
}
