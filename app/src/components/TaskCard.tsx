import { Link } from 'react-router-dom';
import { OnChainTask } from '../lib/agenc/types';
import { parseTaskStatus, parseTaskType, taskTypeLabel, formatSol, formatTimeAgo } from '../lib/agenc/utils';
import { TaskStatusBadge } from './StatusBadge';
import CapabilityBadges from './CapabilityBadges';

interface TaskCardProps {
  task: OnChainTask;
}

function formatDeadline(deadline: number): string {
  if (deadline === 0) return 'No deadline';
  const now = Date.now() / 1000;
  if (deadline < now) return 'Expired';
  const diff = deadline - now;
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(diff / 86400);
  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  return 'Soon';
}

export default function TaskCard({ task }: TaskCardProps) {
  const status = parseTaskStatus(task.status);
  const taskType = parseTaskType(task.taskType);

  return (
    <Link
      to={`/task/${task.address.toString()}`}
      className="block bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <TaskStatusBadge status={status} />
            <span className="text-xs text-slate-500">{taskTypeLabel(taskType)}</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            by {task.creator.toString().slice(0, 4)}...{task.creator.toString().slice(-4)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-400">{formatSol(task.rewardAmount)} SOL</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-1">Required Capabilities</p>
        <CapabilityBadges capabilities={task.requiredCapabilities} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-slate-500 text-xs">Workers</p>
          <p className="text-white font-medium">{task.currentWorkers}/{task.maxWorkers}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs">Deadline</p>
          <p className="text-white font-medium">{formatDeadline(task.deadline)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs">Created</p>
          <p className="text-white font-medium">{formatTimeAgo(task.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}
