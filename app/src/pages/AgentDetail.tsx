import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAgencProgram } from '../lib/agenc/program';
import { parseAgentStatus, formatSol, formatAgentId, shortenAddress, toBigInt, toNumber } from '../lib/agenc/utils';
import { AgentStatusBadge } from '../components/StatusBadge';
import CapabilityBadges from '../components/CapabilityBadges';

function formatTimestamp(timestamp: number): string {
  if (timestamp === 0) return 'Never';
  return new Date(timestamp * 1000).toLocaleString();
}

export default function AgentDetail() {
  const { address } = useParams<{ address: string }>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAgent = async () => {
      if (!address || !wallet) return;

      setLoading(true);
      setError('');

      try {
        const agentPda = new PublicKey(address);
        const program = getAgencProgram(connection, wallet);
        const agentAccount = await (program.account as any).agentRegistration.fetch(agentPda);

        setAgent({
          address: agentPda,
          agentId: Array.from(agentAccount.agentId),
          authority: agentAccount.authority,
          capabilities: toBigInt(agentAccount.capabilities),
          status: agentAccount.status,
          endpoint: agentAccount.endpoint,
          metadataUri: agentAccount.metadataUri,
          registeredAt: toNumber(agentAccount.registeredAt),
          lastActive: toNumber(agentAccount.lastActive),
          tasksCompleted: toNumber(agentAccount.tasksCompleted),
          totalEarned: toBigInt(agentAccount.totalEarned),
          reputation: agentAccount.reputation,
          activeTasks: agentAccount.activeTasks,
          stake: toBigInt(agentAccount.stake),
        });
      } catch (err: any) {
        console.error('Error fetching agent:', err);
        setError(err.message || 'Failed to fetch agent');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [address, wallet, connection]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading agent...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Agent Not Found</h2>
            <p className="text-slate-400 mb-6">{error || 'The requested agent does not exist'}</p>
            <Link
              to="/agents"
              className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Browse Agents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = parseAgentStatus(agent.status);
  const fullAgentId = agent.agentId.map((b: number) => b.toString(16).padStart(2, '0')).join('');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/agents" className="text-blue-400 hover:text-blue-300 text-sm">
          &larr; Back to Agents
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 font-mono">
              {formatAgentId(agent.agentId)}...
            </h1>
            <p className="text-slate-400">
              Authority{' '}
              <a
                href={`https://explorer.solana.com/address/${agent.authority.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {shortenAddress(agent.authority.toString())}
              </a>
            </p>
          </div>
          <AgentStatusBadge status={status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Reputation</p>
            <p className="text-white font-medium text-lg">{agent.reputation / 100}%</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Tasks Completed</p>
            <p className="text-white font-medium text-lg">{agent.tasksCompleted}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Total Earned</p>
            <p className="text-white font-medium text-lg">{formatSol(agent.totalEarned)} SOL</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Stake</p>
            <p className="text-white font-medium text-lg">{formatSol(agent.stake)} SOL</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Capabilities</h2>
        <CapabilityBadges capabilities={agent.capabilities} />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Agent ID</h2>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <p className="font-mono text-sm text-slate-300 break-all">{fullAgentId}</p>
        </div>
      </div>

      {agent.endpoint && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Endpoint</h2>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <p className="font-mono text-sm text-slate-300 break-all">{agent.endpoint}</p>
          </div>
        </div>
      )}

      {agent.metadataUri && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Metadata URI</h2>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <p className="font-mono text-sm text-slate-300 break-all">{agent.metadataUri}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Active Tasks</p>
            <p className="text-white">{agent.activeTasks}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Last Active</p>
            <p className="text-white">{formatTimestamp(agent.lastActive)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Registered</p>
            <p className="text-white">{formatTimestamp(agent.registeredAt)}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">On-Chain Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Agent PDA</span>
            <a
              href={`https://explorer.solana.com/address/${agent.address.toString()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono"
            >
              {shortenAddress(agent.address.toString())}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Authority</span>
            <a
              href={`https://explorer.solana.com/address/${agent.authority.toString()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono"
            >
              {shortenAddress(agent.authority.toString())}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
