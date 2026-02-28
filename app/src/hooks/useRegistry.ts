import { useState, useEffect } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  getProgram,
  deriveConfigPda,
  deriveModelPda,
  deriveVersionPda,
  hashFile,
} from '../lib/program';

export interface OnChainModel {
  address: PublicKey;
  publisher: PublicKey;
  modelName: string;
  weightsHash: number[];
  metadataUri: string;
  license: any;
  versionCount: number;
  createdAt: number;
  updatedAt: number;
  isDeprecated: boolean;
}

export function useRegistry() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [models, setModels] = useState<OnChainModel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllModels = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const program = getProgram(connection, wallet);
      const accounts = await (program.account as any).model.all();

      const modelData: OnChainModel[] = accounts.map((account: any) => ({
        address: account.publicKey,
        publisher: account.account.publisher,
        modelName: account.account.modelName,
        weightsHash: Array.from(account.account.weightsHash),
        metadataUri: account.account.metadataUri,
        license: account.account.license,
        versionCount: account.account.versionCount,
        createdAt: account.account.createdAt.toNumber(),
        updatedAt: account.account.updatedAt.toNumber(),
        isDeprecated: account.account.isDeprecated,
      }));

      setModels(modelData);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllModels();
  }, [wallet?.publicKey]);

  const publishModel = async (
    modelName: string,
    weightsHash: Uint8Array,
    metadataUri: string,
    license: number
  ) => {
    if (!wallet) throw new Error('Wallet not connected');

    const program = getProgram(connection, wallet);
    const [configPda] = deriveConfigPda();
    const [modelPda] = deriveModelPda(wallet.publicKey, modelName);
    const [firstVersionPda] = deriveVersionPda(modelPda, 1);

    const tx = await (program.methods as any)
      .publishModel(modelName, Array.from(weightsHash), metadataUri, license)
      .accounts({
        model: modelPda,
        firstVersion: firstVersionPda,
        config: configPda,
        publisher: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await fetchAllModels();
    return { tx, modelPda };
  };

  const addVersion = async (modelPda: PublicKey, weightsHash: Uint8Array, metadataUri: string) => {
    if (!wallet) throw new Error('Wallet not connected');

    const program = getProgram(connection, wallet);
    const modelAccount = await (program.account as any).model.fetch(modelPda);
    const newVersion = modelAccount.versionCount + 1;

    const [configPda] = deriveConfigPda();
    const [newVersionPda] = deriveVersionPda(modelPda, newVersion);

    const tx = await (program.methods as any)
      .addVersion(Array.from(weightsHash), metadataUri)
      .accounts({
        model: modelPda,
        newVersion: newVersionPda,
        config: configPda,
        publisher: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await fetchAllModels();
    return { tx, versionPda: newVersionPda };
  };

  return {
    models,
    loading,
    fetchAllModels,
    publishModel,
    addVersion,
    hashFile,
  };
}
