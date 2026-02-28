import { Link } from 'react-router-dom';
import { OnChainAgent } from '../lib/agenc/types';
import { parseAgentStatus, formatAgentId, shortenAddress, formatTimeAgo, formatSol } from '../lib/agenc/utils';
import { AgentStatusBadge } from './StatusBadge';
import CapabilityBadges from './CapabilityBadges';

interface AgentCardProps {
  agent: OnChainAgent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const status = parseAgentStatus(agent.status);

  return (
    <Link
      to={`/agent/${agent.address.toString()}`}
      className="block bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white font-mono mb-1">
            {formatAgentId(agent.agentId)}...
          </h3>
          <p className="text-sm text-slate-400">
            by {shortenAddress(agent.authority.toString())}
          </p>
        </div>
        <AgentStatusBadge status={status} />
      </div>

      <div className="mb-4">
        <CapabilityBadges capabilities={agent.capabilities} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-slate-500 text-xs">Reputation</p>
          <p className="text-white font-medium">{agent.reputation / 100}%</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs">Tasks Done</p>
          <p className="text-white font-medium">{agent.tasksCompleted}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs">Stake</p>
          <p className="text-white font-medium">{formatSol(agent.stake)} SOL</p>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Registered {formatTimeAgo(agent.registeredAt)}
      </div>
    </Link>
  );
}
