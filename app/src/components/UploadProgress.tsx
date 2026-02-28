interface UploadProgressProps {
  step: 'idle' | 'hashing' | 'uploading' | 'registering' | 'done';
}

const STEPS = [
  { key: 'hashing', label: 'Hashing weights' },
  { key: 'uploading', label: 'Uploading metadata' },
  { key: 'registering', label: 'Registering on-chain' },
  { key: 'done', label: 'Complete' },
];

export default function UploadProgress({ step }: UploadProgressProps) {
  if (step === 'idle') return null;

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Publishing Model</h3>
      <div className="space-y-3">
        {STEPS.map((s, index) => {
          const isComplete = index < currentStepIndex || step === 'done';
          const isActive = s.key === step;

          return (
            <div key={s.key} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isComplete
                    ? 'bg-green-500'
                    : isActive
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-slate-700'
                }`}
              >
                {isComplete && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
              <span
                className={`text-sm ${
                  isComplete || isActive ? 'text-white font-medium' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
