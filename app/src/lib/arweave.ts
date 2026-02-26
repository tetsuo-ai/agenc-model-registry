export interface ModelMetadata {
  name: string;
  description: string;
  framework: string;
  architecture?: string;
  parameters?: number;
  license: string;
  readme?: string;
  weights: {
    sha256: string;
    size_bytes: number;
    download_urls: string[];
    arweave_tx?: string;
  };
  training?: {
    dataset?: string;
    hardware?: string;
  };
}

/**
 * Upload metadata JSON to Arweave via Irys.
 * For devnet, we simulate by returning a placeholder URI.
 * In production, this uses @irys/web-upload with Solana wallet.
 */
export async function uploadMetadata(
  metadata: ModelMetadata,
  _wallet?: any
): Promise<string> {
  // For devnet/development: encode metadata as a data URI
  // This keeps the metadata accessible without requiring Arweave funding
  // In production, replace with actual Irys upload
  const json = JSON.stringify(metadata, null, 2);
  const encoded = btoa(json);

  // Return a data URI that the frontend can decode
  // In production this would be: https://arweave.net/<tx-id>
  return `data:application/json;base64,${encoded}`;
}

/**
 * Production Irys upload (uncomment when ready for mainnet)
 */
/*
import { WebUploader } from "@irys/web-upload";
import { WebSolana } from "@irys/web-upload-solana";

export async function uploadMetadataToArweave(
  metadata: ModelMetadata,
  wallet: any
): Promise<string> {
  const irys = await WebUploader(WebSolana).withProvider(wallet);
  const data = JSON.stringify(metadata, null, 2);

  const tx = await irys.upload(data, {
    tags: [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "ModelRegistry" },
      { name: "Model-Name", value: metadata.name },
    ],
  });

  return `https://arweave.net/${tx.id}`;
}
*/

/**
 * Fetch metadata from a URI (supports both Arweave URLs and data URIs)
 */
export async function fetchMetadata(
  uri: string
): Promise<ModelMetadata | null> {
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const encoded = uri.replace("data:application/json;base64,", "");
      return JSON.parse(atob(encoded));
    }
    const res = await fetch(uri);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
