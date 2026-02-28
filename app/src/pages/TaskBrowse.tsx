import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTasks } from '../hooks/useTasks';
import { parseTaskStatus } from '../lib/agenc/utils';
import { TaskStatus } from '../lib/agenc/constants';
import TaskCard from '../components/TaskCard';

const FILTER_TABS = [
  { label: 'All', value: null },
  { label: 'Open', value: TaskStatus.Open },
  { label: 'In Progress', value: TaskStatus.InProgress },
  { label: 'Completed', value: TaskStatus.Completed },
  { label: 'Disputed', value: TaskStatus.Disputed },
] as const;

export default function TaskBrowse() {
  const { connected } = useWallet();
  const { tasks, loading } = useTasks();
  const [activeFilter, setActiveFilter] = useState<TaskStatus | null>(null);

  const filteredTasks = activeFilter === null
    ? tasks
    : tasks.filter((task) => parseTaskStatus(task.status) === activeFilter);

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-slate-400">
            Please connect your wallet to browse tasks
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Browse Tasks</h1>
        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === tab.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading tasks...</p>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">No Tasks Found</h2>
            <p className="text-slate-400">
              {activeFilter !== null ? 'No tasks match this filter' : 'No tasks have been created yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task.address.toString()} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
