import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import ReactMarkdown from 'react-markdown';
import { getProgram } from '../lib/program';
import { fetchMetadata, ModelMetadata } from '../lib/arweave';

const LICENSE_NAMES = ['MIT', 'Apache 2.0', 'GPL 3.0', 'Creative Commons', 'Custom'];

function formatHash(hash: number[]): string {
  return hash.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export default function ModelDetail() {
  const { address } = useParams<{ address: string }>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [model, setModel] = useState<any>(null);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchModel = async () => {
      if (!address || !wallet) return;

      setLoading(true);
      setError('');

      try {
        const modelPda = new PublicKey(address);
        const program = getProgram(connection, wallet);
        const modelAccount = await (program.account as any).model.fetch(modelPda);

        setModel({
          address: modelPda,
          ...modelAccount,
        });

        // Fetch metadata
        try {
          const meta = await fetchMetadata(modelAccount.metadataUri);
          setMetadata(meta);
        } catch (err) {
          console.error('Error fetching metadata:', err);
        }
      } catch (err: any) {
        console.error('Error fetching model:', err);
        setError(err.message || 'Failed to fetch model');
      } finally {
        setLoading(false);
      }
    };

    fetchModel();
  }, [address, wallet, connection]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading model...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Model Not Found</h2>
            <p className="text-slate-400 mb-6">{error || 'The requested model does not exist'}</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Browse Models
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const licenseIndex = typeof model.license === 'object' ? Object.keys(model.license)[0] : 0;
  const licenseNum = typeof licenseIndex === 'string' ? parseInt(licenseIndex) : licenseIndex;
  const licenseName = LICENSE_NAMES[licenseNum as number] || 'Unknown';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Back to Browse
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{model.modelName}</h1>
            <p className="text-slate-400">
              Published by{' '}
              <a
                href={`https://explorer.solana.com/address/${model.publisher.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {shortenAddress(model.publisher.toString())}
              </a>
            </p>
          </div>
          {model.isDeprecated && (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded font-semibold">
              Deprecated
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">License</p>
            <p className="text-white font-medium">{licenseName}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Versions</p>
            <p className="text-white font-medium">{model.versionCount}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Published</p>
            <p className="text-white font-medium text-sm">{formatTimestamp(model.createdAt.toNumber())}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Last Updated</p>
            <p className="text-white font-medium text-sm">{formatTimestamp(model.updatedAt.toNumber())}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Weights Hash</h2>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <p className="font-mono text-sm text-slate-300 break-all">
            {formatHash(Array.from(model.weightsHash))}
          </p>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          SHA-256 hash of the model weights file. Use this to verify file integrity.
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Metadata URI</h2>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <p className="font-mono text-sm text-slate-300 break-all">{model.metadataUri}</p>
        </div>
      </div>

      {metadata && (
        <>
          {metadata.readme && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">README</h2>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{metadata.readme}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Model Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Framework</p>
                <p className="text-white">{metadata.framework}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Description</p>
                <p className="text-white">{metadata.description}</p>
              </div>
              {metadata.weights && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Weights Size</p>
                  <p className="text-white">
                    {(metadata.weights.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">On-Chain Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Model Address</span>
            <a
              href={`https://explorer.solana.com/address/${model.address.toString()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono"
            >
              {shortenAddress(model.address.toString())}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
