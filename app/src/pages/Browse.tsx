import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRegistry, OnChainModel } from "../hooks/useRegistry";
import ModelCard from "../components/ModelCard";

export default function Browse() {
  const { connected } = useWallet();
  const { models, loading, fetchAllModels } = useRegistry();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (connected) {
      fetchAllModels();
    }
  }, [connected, fetchAllModels]);

  const filtered = models.filter(
    (m) =>
      m.modelName.toLowerCase().includes(search.toLowerCase()) ||
      m.publisher.toBase58().includes(search)
  );

  if (!connected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4">
          Decentralized Model Registry
        </h1>
        <p className="text-gray-400 mb-2 max-w-lg mx-auto">
          Permanent, uncensorable AI model registry on Solana. No single entity
          can remove a model once published. The on-chain record persists
          forever.
        </p>
        <p className="text-gray-500 text-sm mt-8">
          Connect your wallet to browse models
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Models</h1>
        <div className="text-sm text-gray-500">
          {models.length} model{models.length !== 1 ? "s" : ""} registered
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by name or publisher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm mb-6 focus:outline-none focus:border-gray-600 placeholder-gray-600"
      />

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading models...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p>No models found.</p>
          <p className="text-sm mt-2">
            Be the first to{" "}
            <a href="/publish" className="text-emerald-400 hover:underline">
              publish a model
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((model) => (
            <ModelCard key={model.address.toBase58()} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}
