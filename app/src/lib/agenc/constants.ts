import { PublicKey } from '@solana/web3.js';

export const AGENC_PROGRAM_ID = new PublicKey('5j9ZbT3mnPX5QjWVMrDaWFuaGf8ddji6LW1HVJw6kUE7');

// PDA seed strings
export const SEEDS = {
  PROTOCOL: 'protocol',
  TASK: 'task',
  CLAIM: 'claim',
  AGENT: 'agent',
  ESCROW: 'escrow',
} as const;

// Agent status enum (matches on-chain AgentStatus)
export enum AgentStatus {
  Inactive = 0,
  Active = 1,
  Busy = 2,
  Suspended = 3,
}

// Task status enum (matches on-chain TaskStatus)
export enum TaskStatus {
  Open = 0,
  InProgress = 1,
  PendingValidation = 2,
  Completed = 3,
  Cancelled = 4,
  Disputed = 5,
}

// Task type enum (matches on-chain TaskType)
export enum TaskType {
  Exclusive = 0,
  Collaborative = 1,
  Competitive = 2,
}

// Capability bitmask constants (matches on-chain capability bits)
export const Capability = {
  COMPUTE: 1n << 0n,
  INFERENCE: 1n << 1n,
  STORAGE: 1n << 2n,
  NETWORK: 1n << 3n,
  SENSOR: 1n << 4n,
  ACTUATOR: 1n << 5n,
  COORDINATOR: 1n << 6n,
  ARBITER: 1n << 7n,
  VALIDATOR: 1n << 8n,
  AGGREGATOR: 1n << 9n,
} as const;

export type CapabilityName = keyof typeof Capability;

export const CAPABILITY_NAMES: Record<CapabilityName, string> = {
  COMPUTE: 'Compute',
  INFERENCE: 'Inference',
  STORAGE: 'Storage',
  NETWORK: 'Network',
  SENSOR: 'Sensor',
  ACTUATOR: 'Actuator',
  COORDINATOR: 'Coordinator',
  ARBITER: 'Arbiter',
  VALIDATOR: 'Validator',
  AGGREGATOR: 'Aggregator',
};
