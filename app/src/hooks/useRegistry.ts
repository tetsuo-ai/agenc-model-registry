import { useCallback, useEffect, useState } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getProgram,
  deriveConfigPda,
  deriveModelPda,
  deriveVersionPda,
  sha256Hash,
  hashToHex,
  PROGRAM_ID,
} from "../lib/program";

export interface OnChainModel {
  address: PublicKey;
  publisher: PublicKey;
  modelName: string;
  weightsHash: string;
  metadataUri: string;
  license: number;
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

  const fetchAllModels = useCallback(async () => {
    setLoading(true);
    try {
      if (!wallet) {
        // Fetch without wallet for browsing
        const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
          filters: [
            // Model discriminator (first 8 bytes) - we'll filter client-side
            { dataSize: 283 }, // Model::SIZE
          ],
        });

        // We can't decode without the program/IDL in read-only mode
        // For now, use program with a dummy provider
        setModels([]);
        return;
      }

      const program = getProgram(connection, wallet);
      const allModels = await program.account.model.all();

      setModels(
        allModels.map((m) => ({
          address: m.publicKey,
          publisher: m.account.publisher,
          modelName: m.account.modelName,
          weightsHash: hashToHex(
            new Uint8Array(m.account.weightsHash as number[])
          ),
          metadataUri: m.account.metadataUri,
          license: Object.keys(m.account.license)[0] === "mit" ? 0 :
                   Object.keys(m.account.license)[0] === "apache2" ? 1 :
                   Object.keys(m.account.license)[0] === "gpl3" ? 2 :
                   Object.keys(m.account.license)[0] === "creativeCommons" ? 3 : 4,
          versionCount: m.account.versionCount,
          createdAt: m.account.createdAt.toNumber(),
          updatedAt: m.account.updatedAt.toNumber(),
          isDeprecated: m.account.isDeprecated,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch models:", err);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  const publishModel = useCallback(
    async (
      modelName: string,
      weightsHash: Uint8Array,
      metadataUri: string,
      license: number
    ) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program = getProgram(connection, wallet);
      const [configPda] = deriveConfigPda();
      const [modelPda] = deriveModelPda(wallet.publicKey, modelName);
      const [versionPda] = deriveVersionPda(modelPda, 1);

      const tx = await program.methods
        .publishModel(modelName, Array.from(weightsHash), metadataUri, license)
        .accounts({
          config: configPda,
          model: modelPda,
          firstVersion: versionPda,
          publisher: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { tx, modelPda };
    },
    [connection, wallet]
  );

  const addVersion = useCallback(
    async (
      modelPda: PublicKey,
      weightsHash: Uint8Array,
      metadataUri: string
    ) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program = getProgram(connection, wallet);
      const [configPda] = deriveConfigPda();

      // Fetch current model to get next version number
      const model = await program.account.model.fetch(modelPda);
      const nextVersion = model.versionCount + 1;
      const [versionPda] = deriveVersionPda(modelPda, nextVersion);

      const tx = await program.methods
        .addVersion(Array.from(weightsHash), metadataUri)
        .accounts({
          config: configPda,
          model: modelPda,
          version: versionPda,
          publisher: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    [connection, wallet]
  );

  return {
    models,
    loading,
    fetchAllModels,
    publishModel,
    addVersion,
  };
}

// Hash a file in the browser
export async function hashFile(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return sha256Hash(buffer);
}
