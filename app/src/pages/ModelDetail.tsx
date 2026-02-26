import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import ReactMarkdown from "react-markdown";
import { getProgram, hashToHex } from "../lib/program";
import { fetchMetadata, ModelMetadata } from "../lib/arweave";

const LICENSE_LABELS = ["MIT", "Apache-2.0", "GPL-3.0", "CC", "Custom"];

export default function ModelDetail() {
  const { address } = useParams<{ address: string }>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [model, setModel] = useState<any>(null);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!address || !wallet) return;
      setLoading(true);
      try {
        const program = getProgram(connection, wallet);
        const modelPda = new PublicKey(address);
        const modelData = await program.account.model.fetch(modelPda);
        setModel(modelData);

        // Fetch metadata from Arweave/data URI
        const meta = await fetchMetadata(modelData.metadataUri);
        setMetadata(meta);
      } catch (err: any) {
        setError(err.message || "Failed to load model");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address, connection, wallet]);

  if (!wallet) {
    return (
      <div className="text-center py-20 text-gray-500">
        Connect your wallet to view model details
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (error || !model) {
    return (
      <div className="text-center py-12 text-red-400">
        {error || "Model not found"}
      </div>
    );
  }

  const licenseIdx = Object.keys(model.license)[0] === "mit" ? 0 :
                     Object.keys(model.license)[0] === "apache2" ? 1 :
                     Object.keys(model.license)[0] === "gpl3" ? 2 :
                     Object.keys(model.license)[0] === "creativeCommons" ? 3 : 4;

  const weightsHashHex = hashToHex(new Uint8Array(model.weightsHash as number[]));

  return (
    <div>
      <Link
        to="/"
        className="text-gray-500 hover:text-white text-sm mb-4 inline-block"
      >
        &larr; Back to Browse
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{model.modelName}</h1>
          <p className="text-gray-500 font-mono text-sm mt-1">
            by {model.publisher.toBase58().slice(0, 8)}...
            {model.publisher.toBase58().slice(-4)}
          </p>
        </div>
        {model.isDeprecated && (
          <span className="bg-red-900 text-red-300 px-3 py-1 rounded-full text-sm">
            Deprecated
          </span>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <InfoBox label="License" value={LICENSE_LABELS[licenseIdx]} />
        <InfoBox label="Versions" value={String(model.versionCount)} />
        <InfoBox
          label="Published"
          value={new Date(model.createdAt.toNumber() * 1000).toLocaleDateString()}
        />
        <InfoBox
          label="Updated"
          value={new Date(model.updatedAt.toNumber() * 1000).toLocaleDateString()}
        />
      </div>

      {/* Weights hash - the core of the system */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-2">
          Weights Hash (SHA-256)
        </h2>
        <code className="text-emerald-400 font-mono text-sm break-all">
          {weightsHashHex}
        </code>
        <p className="text-xs text-gray-600 mt-2">
          Download the model from any source and verify: sha256sum model.bin
          should match this hash.
        </p>
      </div>

      {/* Metadata URI */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-2">
          Metadata URI
        </h2>
        <code className="text-gray-300 font-mono text-xs break-all">
          {model.metadataUri.length > 100
            ? model.metadataUri.slice(0, 100) + "..."
            : model.metadataUri}
        </code>
      </div>

      {/* README from metadata */}
      {metadata?.readme && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-800">
            README
          </h2>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{metadata.readme}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Model details from metadata */}
      {metadata && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          {metadata.framework && (
            <InfoBox label="Framework" value={metadata.framework} />
          )}
          {metadata.parameters && (
            <InfoBox
              label="Parameters"
              value={`${(metadata.parameters / 1e6).toFixed(0)}M`}
            />
          )}
          {metadata.weights.size_bytes > 0 && (
            <InfoBox
              label="Size"
              value={`${(metadata.weights.size_bytes / 1024 / 1024).toFixed(1)} MB`}
            />
          )}
          {metadata.training?.dataset && (
            <InfoBox label="Dataset" value={metadata.training.dataset} />
          )}
        </div>
      )}

      {/* On-chain address */}
      <div className="mt-8 text-center text-xs text-gray-600">
        <p>
          On-chain address:{" "}
          <a
            href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-white font-mono"
          >
            {address}
          </a>
        </p>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-white mt-0.5">{value}</p>
    </div>
  );
}
