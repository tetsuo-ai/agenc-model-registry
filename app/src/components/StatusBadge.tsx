import { AgentStatus, TaskStatus } from '../lib/agenc/constants';
import { agentStatusLabel, taskStatusLabel } from '../lib/agenc/utils';

const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  [AgentStatus.Inactive]: 'bg-slate-500/20 text-slate-400',
  [AgentStatus.Active]: 'bg-green-500/20 text-green-400',
  [AgentStatus.Busy]: 'bg-yellow-500/20 text-yellow-400',
  [AgentStatus.Suspended]: 'bg-red-500/20 text-red-400',
};

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.Open]: 'bg-blue-500/20 text-blue-400',
  [TaskStatus.InProgress]: 'bg-yellow-500/20 text-yellow-400',
  [TaskStatus.PendingValidation]: 'bg-purple-500/20 text-purple-400',
  [TaskStatus.Completed]: 'bg-green-500/20 text-green-400',
  [TaskStatus.Cancelled]: 'bg-slate-500/20 text-slate-400',
  [TaskStatus.Disputed]: 'bg-red-500/20 text-red-400',
};

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${AGENT_STATUS_COLORS[status]}`}>
      {agentStatusLabel(status)}
    </span>
  );
}

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${TASK_STATUS_COLORS[status]}`}>
      {taskStatusLabel(status)}
    </span>
  );
}
