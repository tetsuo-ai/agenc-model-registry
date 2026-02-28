import { formatCapabilities } from '../lib/agenc/utils';

const CAPABILITY_COLORS: Record<string, string> = {
  Compute: 'bg-blue-500/20 text-blue-400',
  Inference: 'bg-purple-500/20 text-purple-400',
  Storage: 'bg-green-500/20 text-green-400',
  Network: 'bg-yellow-500/20 text-yellow-400',
  Sensor: 'bg-orange-500/20 text-orange-400',
  Actuator: 'bg-red-500/20 text-red-400',
  Coordinator: 'bg-cyan-500/20 text-cyan-400',
  Arbiter: 'bg-pink-500/20 text-pink-400',
  Validator: 'bg-indigo-500/20 text-indigo-400',
  Aggregator: 'bg-teal-500/20 text-teal-400',
};

interface CapabilityBadgesProps {
  capabilities: bigint;
}

export default function CapabilityBadges({ capabilities }: CapabilityBadgesProps) {
  const names = formatCapabilities(capabilities);

  if (names.length === 0) {
    return <span className="text-xs text-slate-500">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((name) => (
        <span
          key={name}
          className={`px-2 py-0.5 rounded text-xs font-medium ${CAPABILITY_COLORS[name] || 'bg-slate-500/20 text-slate-400'}`}
        >
          {name}
        </span>
      ))}
    </div>
  );
}
