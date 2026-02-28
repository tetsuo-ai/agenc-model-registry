import { BN } from '@coral-xyz/anchor';
import { AgentStatus, TaskStatus, TaskType, Capability, CapabilityName, CAPABILITY_NAMES } from './constants';

export function toNumber(val: any): number {
  if (val instanceof BN) return val.toNumber();
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'number') return val;
  return Number(val);
}

export function toBigInt(val: any): bigint {
  if (typeof val === 'bigint') return val;
  if (val instanceof BN) return BigInt(val.toString());
  return BigInt(val);
}

export function parseAgentStatus(status: any): AgentStatus {
  if (typeof status === 'object' && status !== null) {
    const key = Object.keys(status)[0];
    if (key === 'inactive') return AgentStatus.Inactive;
    if (key === 'active') return AgentStatus.Active;
    if (key === 'busy') return AgentStatus.Busy;
    if (key === 'suspended') return AgentStatus.Suspended;
  }
  return AgentStatus.Inactive;
}

export function agentStatusLabel(status: AgentStatus): string {
  switch (status) {
    case AgentStatus.Inactive: return 'Inactive';
    case AgentStatus.Active: return 'Active';
    case AgentStatus.Busy: return 'Busy';
    case AgentStatus.Suspended: return 'Suspended';
    default: return 'Unknown';
  }
}

export function parseTaskStatus(status: any): TaskStatus {
  if (typeof status === 'object' && status !== null) {
    const key = Object.keys(status)[0];
    if (key === 'open') return TaskStatus.Open;
    if (key === 'inProgress') return TaskStatus.InProgress;
    if (key === 'pendingValidation') return TaskStatus.PendingValidation;
    if (key === 'completed') return TaskStatus.Completed;
    if (key === 'cancelled') return TaskStatus.Cancelled;
    if (key === 'disputed') return TaskStatus.Disputed;
  }
  return TaskStatus.Open;
}

export function taskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.Open: return 'Open';
    case TaskStatus.InProgress: return 'In Progress';
    case TaskStatus.PendingValidation: return 'Pending Validation';
    case TaskStatus.Completed: return 'Completed';
    case TaskStatus.Cancelled: return 'Cancelled';
    case TaskStatus.Disputed: return 'Disputed';
    default: return 'Unknown';
  }
}

export function parseTaskType(taskType: any): TaskType {
  if (typeof taskType === 'object' && taskType !== null) {
    const key = Object.keys(taskType)[0];
    if (key === 'exclusive') return TaskType.Exclusive;
    if (key === 'collaborative') return TaskType.Collaborative;
    if (key === 'competitive') return TaskType.Competitive;
  }
  return TaskType.Exclusive;
}

export function taskTypeLabel(taskType: TaskType): string {
  switch (taskType) {
    case TaskType.Exclusive: return 'Exclusive';
    case TaskType.Collaborative: return 'Collaborative';
    case TaskType.Competitive: return 'Competitive';
    default: return 'Unknown';
  }
}

export function getCapabilityNames(caps: bigint): CapabilityName[] {
  const names: CapabilityName[] = [];
  for (const [name, value] of Object.entries(Capability)) {
    if ((caps & value) === value) {
      names.push(name as CapabilityName);
    }
  }
  return names;
}

export function formatCapabilities(caps: bigint): string[] {
  return getCapabilityNames(caps).map((name) => CAPABILITY_NAMES[name]);
}

export function formatSol(lamports: bigint | number): string {
  const val = typeof lamports === 'bigint' ? lamports : BigInt(lamports);
  const sol = Number(val) / 1e9;
  return sol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function formatAgentId(agentId: number[]): string {
  return agentId
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60);
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(diff / 86400);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
