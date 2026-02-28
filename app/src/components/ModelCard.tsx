import { Link } from 'react-router-dom';
import { OnChainModel } from '../hooks/useRegistry';

interface ModelCardProps {
  model: OnChainModel;
}

const LICENSE_NAMES = ['MIT', 'Apache 2.0', 'GPL 3.0', 'Creative Commons', 'Custom'];

function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60);
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(diff / 86400);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatHash(hash: number[]): string {
  return hash
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function ModelCard({ model }: ModelCardProps) {
  const licenseIndex = typeof model.license === 'object' ? Object.keys(model.license)[0] : 0;
  const licenseNum = typeof licenseIndex === 'string' ? parseInt(licenseIndex) : licenseIndex;
  const licenseName = LICENSE_NAMES[licenseNum as number] || 'Unknown';

  return (
    <Link
      to={`/model/${model.address.toString()}`}
      className="block bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{model.modelName}</h3>
          <p className="text-sm text-slate-400">
            by {shortenAddress(model.publisher.toString())}
          </p>
        </div>
        {model.isDeprecated && (
          <span className="px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-400 rounded">
            Deprecated
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
          {licenseName}
        </span>
        <span>{model.versionCount} version{model.versionCount !== 1 ? 's' : ''}</span>
        <span>{formatTimeAgo(model.createdAt)}</span>
      </div>

      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <p className="text-xs text-slate-500 mb-1">Weights Hash</p>
        <p className="font-mono text-sm text-slate-300">{formatHash(model.weightsHash)}...</p>
      </div>
    </Link>
  );
}
