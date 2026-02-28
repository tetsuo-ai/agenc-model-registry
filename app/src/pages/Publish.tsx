import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRegistry } from '../hooks/useRegistry';
import { uploadMetadata } from '../lib/arweave';
import UploadProgress from '../components/UploadProgress';
import { hashFile } from '../lib/program';

const LICENSE_OPTIONS = [
  { value: 0, label: 'MIT' },
  { value: 1, label: 'Apache 2.0' },
  { value: 2, label: 'GPL 3.0' },
  { value: 3, label: 'Creative Commons' },
  { value: 4, label: 'Custom' },
];

export default function Publish() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { publishModel } = useRegistry();

  const [modelName, setModelName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('');
  const [license, setLicense] = useState(0);
  const [readme, setReadme] = useState('');
  const [weightsFile, setWeightsFile] = useState<File | null>(null);

  const [step, setStep] = useState<'idle' | 'hashing' | 'uploading' | 'registering' | 'done'>(
    'idle'
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightsFile || !connected) return;

    setError('');

    try {
      // Step 1: Hash weights file
      setStep('hashing');
      const weightsHash = await hashFile(weightsFile);

      // Step 2: Upload metadata
      setStep('uploading');
      const metadata = {
        name: modelName,
        description,
        framework,
        license: LICENSE_OPTIONS[license].label,
        weights: {
          sha256: Array.from(weightsHash)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(''),
          size: weightsFile.size,
          urls: [],
        },
        readme,
      };
      const metadataUri = await uploadMetadata(metadata);

      // Step 3: Register on-chain
      setStep('registering');
      const { modelPda } = await publishModel(modelName, weightsHash, metadataUri, license);

      // Step 4: Done
      setStep('done');
      setTimeout(() => {
        navigate(`/model/${modelPda.toString()}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error publishing model:', err);
      setError(err.message || 'Failed to publish model');
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
              Please connect your wallet to publish models to the registry
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Publish Model</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Model Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={64}
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="my-awesome-model"
                />
                <p className="text-xs text-slate-500 mt-1">Max 64 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Brief description of your model..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Framework *
                </label>
                <input
                  type="text"
                  required
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="PyTorch, TensorFlow, JAX, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">License *</label>
                <select
                  value={license}
                  onChange={(e) => setLicense(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {LICENSE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  README (Markdown)
                </label>
                <textarea
                  value={readme}
                  onChange={(e) => setReadme(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  placeholder="# Model Documentation&#10;&#10;Detailed information about your model..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Weights File *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setWeightsFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 focus:outline-none focus:border-blue-500"
                />
                {weightsFile && (
                  <p className="text-xs text-slate-500 mt-1">
                    {(weightsFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={step !== 'idle'}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {step === 'idle' ? 'Publish Model' : 'Publishing...'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <UploadProgress step={step} />
        </div>
      </div>
    </div>
  );
}
