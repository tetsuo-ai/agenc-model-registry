import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAgencProgram } from '../lib/agenc/program';
import { parseTaskStatus, parseTaskType, taskTypeLabel, formatSol, shortenAddress, toBigInt, toNumber } from '../lib/agenc/utils';
import { TaskStatusBadge } from '../components/StatusBadge';
import CapabilityBadges from '../components/CapabilityBadges';

function formatTimestamp(timestamp: number): string {
  if (timestamp === 0) return 'None';
  return new Date(timestamp * 1000).toLocaleString();
}

function formatDescription(desc: number[]): string {
  // Try to decode as UTF-8 text, otherwise show hex
  const nonZero = desc.filter((b) => b !== 0);
  if (nonZero.length === 0) return 'No description';
  try {
    const decoded = new TextDecoder().decode(new Uint8Array(nonZero));
    if (/^[\x20-\x7E]+$/.test(decoded)) return decoded;
  } catch {
    // fall through to hex
  }
  return nonZero.slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('') + '...';
}

export default function TaskDetail() {
  const { address } = useParams<{ address: string }>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      if (!address || !wallet) return;

      setLoading(true);
      setError('');

      try {
        const taskPda = new PublicKey(address);
        const program = getAgencProgram(connection, wallet);
        const taskAccount = await (program.account as any).task.fetch(taskPda);

        setTask({
          address: taskPda,
          taskId: Array.from(taskAccount.taskId),
          creator: taskAccount.creator,
          requiredCapabilities: toBigInt(taskAccount.requiredCapabilities),
          description: Array.from(taskAccount.description),
          rewardAmount: toBigInt(taskAccount.rewardAmount),
          maxWorkers: taskAccount.maxWorkers,
          currentWorkers: taskAccount.currentWorkers,
          status: taskAccount.status,
          taskType: taskAccount.taskType,
          createdAt: toNumber(taskAccount.createdAt),
          deadline: toNumber(taskAccount.deadline),
          completedAt: toNumber(taskAccount.completedAt),
          escrow: taskAccount.escrow,
          completions: taskAccount.completions,
          requiredCompletions: taskAccount.requiredCompletions,
          protocolFeeBps: taskAccount.protocolFeeBps,
          dependsOn: taskAccount.dependsOn ?? null,
          minReputation: taskAccount.minReputation,
          rewardMint: taskAccount.rewardMint ?? null,
        });
      } catch (err: any) {
        console.error('Error fetching task:', err);
        setError(err.message || 'Failed to fetch task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [address, wallet, connection]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading task...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Task Not Found</h2>
            <p className="text-slate-400 mb-6">{error || 'The requested task does not exist'}</p>
            <Link
              to="/tasks"
              className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Browse Tasks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = parseTaskStatus(task.status);
  const taskType = parseTaskType(task.taskType);
  const taskIdHex = task.taskId.map((b: number) => b.toString(16).padStart(2, '0')).join('');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/tasks" className="text-blue-400 hover:text-blue-300 text-sm">
          &larr; Back to Tasks
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TaskStatusBadge status={status} />
              <span className="text-sm text-slate-400">{taskTypeLabel(taskType)}</span>
            </div>
            <p className="text-slate-400">
              Created by{' '}
              <a
                href={`https://explorer.solana.com/address/${task.creator.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {shortenAddress(task.creator.toString())}
              </a>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400">{formatSol(task.rewardAmount)} SOL</p>
            {task.rewardMint && (
              <p className="text-xs text-slate-500 mt-1">Token: {shortenAddress(task.rewardMint.toString())}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Workers</p>
            <p className="text-white font-medium text-lg">{task.currentWorkers}/{task.maxWorkers}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Completions</p>
            <p className="text-white font-medium text-lg">{task.completions}/{task.requiredCompletions}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Deadline</p>
            <p className="text-white font-medium text-sm">{formatTimestamp(task.deadline)}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Min Reputation</p>
            <p className="text-white font-medium text-lg">{task.minReputation > 0 ? `${task.minReputation / 100}%` : 'None'}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Required Capabilities</h2>
        <CapabilityBadges capabilities={task.requiredCapabilities} />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Description</h2>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <p className="font-mono text-sm text-slate-300 break-all">{formatDescription(task.description)}</p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Timestamps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Created</p>
            <p className="text-white">{formatTimestamp(task.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Deadline</p>
            <p className="text-white">{formatTimestamp(task.deadline)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Completed</p>
            <p className="text-white">{formatTimestamp(task.completedAt)}</p>
          </div>
        </div>
      </div>

      {task.dependsOn && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Dependency</h2>
          <Link
            to={`/task/${task.dependsOn.toString()}`}
            className="text-blue-400 hover:text-blue-300 font-mono text-sm"
          >
            {shortenAddress(task.dependsOn.toString())}
          </Link>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">On-Chain Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Task PDA</span>
            <a
              href={`https://explorer.solana.com/address/${task.address.toString()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono"
            >
              {shortenAddress(task.address.toString())}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Task ID</span>
            <span className="text-slate-300 font-mono">{taskIdHex.slice(0, 16)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Escrow</span>
            <a
              href={`https://explorer.solana.com/address/${task.escrow.toString()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono"
            >
              {shortenAddress(task.escrow.toString())}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Protocol Fee</span>
            <span className="text-slate-300">{task.protocolFeeBps / 100}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
