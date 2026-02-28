import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRegistry } from '../hooks/useRegistry';
import ModelCard from '../components/ModelCard';

export default function Browse() {
  const { connected } = useWallet();
  const { models, loading } = useRegistry();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModels = models.filter((model) =>
    model.modelName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-slate-400">
            Please connect your wallet to browse models in the registry
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Browse Models</h1>
        <input
          type="text"
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading models...</p>
          </div>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">No Models Found</h2>
            <p className="text-slate-400 mb-6">
              {searchTerm
                ? 'No models match your search'
                : 'Be the first to publish a model to the registry!'}
            </p>
            {!searchTerm && (
              <a
                href="/publish"
                className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Publish a Model
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModelCard key={model.address.toString()} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}
