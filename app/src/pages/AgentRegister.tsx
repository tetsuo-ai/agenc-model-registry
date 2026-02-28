import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAgents } from '../hooks/useAgents';
import { Capability, CapabilityName, CAPABILITY_NAMES } from '../lib/agenc/constants';

const CAPABILITY_OPTIONS = Object.entries(CAPABILITY_NAMES) as [CapabilityName, string][];

export default function AgentRegister() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { registerAgent } = useAgents();

  const [selectedCaps, setSelectedCaps] = useState<Set<CapabilityName>>(new Set());
  const [endpoint, setEndpoint] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [stakeAmount, setStakeAmount] = useState('0');

  const [step, setStep] = useState<'idle' | 'registering' | 'done'>('idle');
  const [error, setError] = useState('');

  const toggleCapability = (cap: CapabilityName) => {
    setSelectedCaps((prev) => {
      const next = new Set(prev);
      if (next.has(cap)) next.delete(cap);
      else next.add(cap);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || selectedCaps.size === 0) return;

    setError('');

    try {
      setStep('registering');

      // Generate random 32-byte agent ID
      const agentId = new Uint8Array(32);
      crypto.getRandomValues(agentId);

      // Combine selected capabilities into bitmask
      let capabilities = 0n;
      for (const cap of selectedCaps) {
        capabilities |= Capability[cap];
      }

      const stakeLamports = BigInt(Math.floor(parseFloat(stakeAmount) * 1e9));

      const { agentPda } = await registerAgent(
        agentId,
        capabilities,
        endpoint,
        metadataUri || null,
        stakeLamports
      );

      setStep('done');
      setTimeout(() => {
        navigate(`/agent/${agentPda.toString()}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error registering agent:', err);
      setError(err.message || 'Failed to register agent');
      setStep('idle');
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-slate-400">
              Please connect your wallet to register an agent
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Register Agent</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Capabilities *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CAPABILITY_OPTIONS.map(([key, label]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedCaps.has(key)
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCaps.has(key)}
                        onChange={() => toggleCapability(key)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Select at least one capability</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Endpoint *
                </label>
                <input
                  type="text"
                  required
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="https://my-agent.example.com/api"
                />
                <p className="text-xs text-slate-500 mt-1">Network endpoint for off-chain communication (max 256 chars)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Metadata URI
                </label>
                <input
                  type="text"
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="https://arweave.net/... or ipfs://..."
                />
                <p className="text-xs text-slate-500 mt-1">Optional URI to extended metadata</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stake Amount (SOL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 mt-1">Amount to stake (required for arbiter role)</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={step !== 'idle' || selectedCaps.size === 0}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {step === 'idle' ? 'Register Agent' : step === 'registering' ? 'Registering...' : 'Done!'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Registration Info</h2>
            <div className="space-y-4 text-sm text-slate-400">
              <div>
                <p className="text-slate-300 font-medium mb-1">Agent ID</p>
                <p>A random 32-byte identifier will be generated automatically.</p>
              </div>
              <div>
                <p className="text-slate-300 font-medium mb-1">Capabilities</p>
                <p>Select what your agent can do. Tasks require specific capabilities.</p>
              </div>
              <div>
                <p className="text-slate-300 font-medium mb-1">Endpoint</p>
                <p>Your agent's API endpoint for receiving task assignments.</p>
              </div>
              <div>
                <p className="text-slate-300 font-medium mb-1">Stake</p>
                <p>Staking SOL increases trust. Required for arbiter roles.</p>
              </div>
            </div>

            {step === 'registering' && (
              <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <p className="text-slate-300 text-sm">Registering on-chain...</p>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="text-green-400 text-sm font-medium">Agent registered successfully! Redirecting...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
