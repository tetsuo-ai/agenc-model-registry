export interface ModelMetadata {
  name: string;
  description: string;
  framework: string;
  license: string;
  weights: {
    sha256: string;
    size: number;
    urls: string[];
  };
  training?: {
    dataset?: string;
    epochs?: number;
    hyperparameters?: Record<string, any>;
  };
  readme?: string;
}

// For devnet, we'll use data URIs instead of actual Arweave uploads
export async function uploadMetadata(metadata: ModelMetadata): Promise<string> {
  // Convert metadata to JSON and create a data URI
  const jsonStr = JSON.stringify(metadata, null, 2);
  const base64 = btoa(jsonStr);
  return `data:application/json;base64,${base64}`;
}

export async function fetchMetadata(uri: string): Promise<ModelMetadata> {
  if (uri.startsWith('data:')) {
    // Handle data URI
    const base64 = uri.split(',')[1];
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } else if (uri.startsWith('https://arweave.net/') || uri.startsWith('ar://')) {
    // Handle Arweave URL
    const arweaveUrl = uri.startsWith('ar://') ? uri.replace('ar://', 'https://arweave.net/') : uri;
    const response = await fetch(arweaveUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    return await response.json();
  } else {
    // Handle generic URL
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    return await response.json();
  }
}

// Production Arweave/Irys implementation (commented out for devnet)
/*
import { Irys } from '@irys/sdk';

async function uploadToIrys(metadata: ModelMetadata, wallet: any): Promise<string> {
  const irys = new Irys({
    url: 'https://node2.irys.xyz',
    token: 'solana',
    wallet: { rpcUrl: 'https://api.devnet.solana.com', name: 'wallet-adapter', provider: wallet },
  });

  const jsonStr = JSON.stringify(metadata, null, 2);
  const tags = [
    { name: 'Content-Type', value: 'application/json' },
    { name: 'App-Name', value: 'AgenC-Model-Registry' },
    { name: 'Model-Name', value: metadata.name },
  ];

  const receipt = await irys.upload(jsonStr, { tags });
  return `https://arweave.net/${receipt.id}`;
}
*/
