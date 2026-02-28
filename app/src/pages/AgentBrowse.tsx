import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAgents } from '../hooks/useAgents';
import AgentCard from '../components/AgentCard';

export default function AgentBrowse() {
  const { connected } = useWallet();
  const { agents, loading } = useAgents();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = agents.filter((agent) => {
    const idHex = agent.agentId.map((b) => b.toString(16).padStart(2, '0')).join('');
    const authorityStr = agent.authority.toString();
    const term = searchTerm.toLowerCase();
    return idHex.includes(term) || authorityStr.toLowerCase().includes(term) || agent.endpoint.toLowerCase().includes(term);
  });

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-slate-400">
            Please connect your wallet to browse agents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">Browse Agents</h1>
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <Link
          to="/agents/register"
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          Register Agent
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading agents...</p>
          </div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">No Agents Found</h2>
            <p className="text-slate-400 mb-6">
              {searchTerm
                ? 'No agents match your search'
                : 'Be the first to register an agent!'}
            </p>
            {!searchTerm && (
              <Link
                to="/agents/register"
                className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Register Agent
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.address.toString()} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
