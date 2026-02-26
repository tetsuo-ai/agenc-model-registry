import { Link } from "react-router-dom";
import { OnChainModel } from "../hooks/useRegistry";

const LICENSE_LABELS = ["MIT", "Apache-2.0", "GPL-3.0", "CC", "Custom"];

export default function ModelCard({ model }: { model: OnChainModel }) {
  const publisherShort = `${model.publisher.toBase58().slice(0, 4)}...${model.publisher.toBase58().slice(-4)}`;
  const timeAgo = formatTimeAgo(model.createdAt);

  return (
    <Link
      to={`/model/${model.address.toBase58()}`}
      className="block border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors bg-gray-900/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-white truncate">
            {model.modelName}
          </h3>
          <p className="text-sm text-gray-500 font-mono">{publisherShort}</p>
        </div>
        {model.isDeprecated && (
          <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full shrink-0">
            deprecated
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span className="bg-gray-800 px-2 py-0.5 rounded">
          {LICENSE_LABELS[model.license] || "Custom"}
        </span>
        <span>v{model.versionCount}</span>
        <span>{timeAgo}</span>
      </div>

      <div className="mt-2 text-xs text-gray-600 font-mono truncate">
        SHA-256: {model.weightsHash.slice(0, 16)}...
      </div>
    </Link>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
