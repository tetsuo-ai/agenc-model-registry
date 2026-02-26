import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { useRegistry, hashFile } from "../hooks/useRegistry";
import { uploadMetadata, ModelMetadata } from "../lib/arweave";
import { hashToHex } from "../lib/program";
import UploadProgress from "../components/UploadProgress";

const STEPS = [
  "Fill model information",
  "Hash model weights",
  "Upload metadata to Arweave",
  "Register on Solana",
  "Done!",
];

const LICENSES = [
  { value: 0, label: "MIT" },
  { value: 1, label: "Apache-2.0" },
  { value: 2, label: "GPL-3.0" },
  { value: 3, label: "Creative Commons" },
  { value: 4, label: "Custom" },
];

export default function Publish() {
  const { connected } = useWallet();
  const navigate = useNavigate();
  const { publishModel } = useRegistry();

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [txSig, setTxSig] = useState("");

  // Form state
  const [modelName, setModelName] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState("pytorch");
  const [license, setLicense] = useState(0);
  const [readme, setReadme] = useState("");
  const [weightsFile, setWeightsFile] = useState<File | null>(null);
  const [weightsHash, setWeightsHash] = useState<Uint8Array | null>(null);

  const handlePublish = useCallback(async () => {
    if (!weightsFile || !modelName) return;
    setError("");

    try {
      // Step 1: Hash weights
      setStep(1);
      const hash = await hashFile(weightsFile);
      setWeightsHash(hash);

      // Step 2: Upload metadata to Arweave
      setStep(2);
      const metadata: ModelMetadata = {
        name: modelName,
        description,
        framework,
        license: LICENSES[license].label,
        readme,
        weights: {
          sha256: hashToHex(hash),
          size_bytes: weightsFile.size,
          download_urls: [],
        },
      };
      const metadataUri = await uploadMetadata(metadata);

      // Step 3: Register on Solana
      setStep(3);
      const { tx, modelPda } = await publishModel(
        modelName,
        hash,
        metadataUri,
        license
      );
      setTxSig(tx);

      // Step 4: Done
      setStep(4);

      // Navigate to model page after a moment
      setTimeout(() => {
        navigate(`/model/${modelPda.toBase58()}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to publish");
      console.error(err);
    }
  }, [
    weightsFile,
    modelName,
    description,
    framework,
    license,
    readme,
    publishModel,
    navigate,
  ]);

  if (!connected) {
    return (
      <div className="text-center py-20 text-gray-500">
        Connect your wallet to publish a model
      </div>
    );
  }

  // Publishing in progress
  if (step > 0) {
    return (
      <div className="max-w-md mx-auto py-12">
        <h1 className="text-2xl font-bold mb-6">Publishing Model</h1>
        <UploadProgress step={step} steps={STEPS} error={error} />
        {txSig && (
          <div className="mt-6 text-sm">
            <p className="text-gray-400">Transaction:</p>
            <a
              href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-mono text-xs break-all"
            >
              {txSig}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Publish a Model</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Model Name *
          </label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g. gpt2-small-finetuned"
            maxLength={64}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the model..."
            rows={2}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-600 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Framework
            </label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-600"
            >
              <option value="pytorch">PyTorch</option>
              <option value="tensorflow">TensorFlow</option>
              <option value="jax">JAX</option>
              <option value="onnx">ONNX</option>
              <option value="gguf">GGUF</option>
              <option value="safetensors">Safetensors</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">License</label>
            <select
              value={license}
              onChange={(e) => setLicense(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-600"
            >
              {LICENSES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            README (Markdown)
          </label>
          <textarea
            value={readme}
            onChange={(e) => setReadme(e.target.value)}
            placeholder="# My Model&#10;&#10;Describe your model, training process, usage..."
            rows={6}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-600 font-mono resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Model Weights File *
          </label>
          <div className="border-2 border-dashed border-gray-800 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
            <input
              type="file"
              onChange={(e) => setWeightsFile(e.target.files?.[0] || null)}
              className="hidden"
              id="weights-file"
            />
            <label htmlFor="weights-file" className="cursor-pointer">
              {weightsFile ? (
                <div>
                  <p className="text-white font-medium">{weightsFile.name}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {(weightsFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400">
                    Drop your model file or click to browse
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    .pt, .safetensors, .gguf, .onnx, etc.
                  </p>
                </div>
              )}
            </label>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            The file is hashed locally. Only the SHA-256 hash goes on-chain.
          </p>
        </div>

        <button
          onClick={handlePublish}
          disabled={!modelName || !weightsFile}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-3 rounded-lg transition-colors mt-4"
        >
          Publish to Solana
        </button>
      </div>
    </div>
  );
}
