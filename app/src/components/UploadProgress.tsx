interface Props {
  step: number;
  steps: string[];
  error?: string;
}

export default function UploadProgress({ step, steps, error }: Props) {
  return (
    <div className="space-y-2">
      {steps.map((label, i) => {
        const isActive = i === step;
        const isDone = i < step;
        const isFuture = i > step;

        return (
          <div
            key={i}
            className={`flex items-center gap-3 text-sm ${
              isActive
                ? "text-emerald-400"
                : isDone
                ? "text-gray-500"
                : "text-gray-700"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                isActive
                  ? "border-emerald-400 bg-emerald-400/10 animate-pulse"
                  : isDone
                  ? "border-gray-600 bg-gray-800"
                  : "border-gray-800"
              }`}
            >
              {isDone ? "\u2713" : i + 1}
            </div>
            <span>{label}</span>
            {isActive && (
              <span className="text-emerald-400 animate-pulse">...</span>
            )}
          </div>
        );
      })}
      {error && (
        <div className="mt-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
}
