import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { AGENC_PROGRAM_ID, SEEDS } from './constants';
import IDL from './agenc_coordination.json';

export function getAgencProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {});
  return new Program(IDL as any, provider);
}

export function deriveProtocolPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.PROTOCOL)],
    AGENC_PROGRAM_ID
  );
}

export function deriveAgentPda(agentId: Uint8Array | number[]): [PublicKey, number] {
  const idBuffer = agentId instanceof Uint8Array ? agentId : Buffer.from(agentId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.AGENT), idBuffer],
    AGENC_PROGRAM_ID
  );
}

export function deriveTaskPda(creator: PublicKey, taskId: Uint8Array | number[]): [PublicKey, number] {
  const idBuffer = taskId instanceof Uint8Array ? taskId : Buffer.from(taskId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.TASK), creator.toBuffer(), idBuffer],
    AGENC_PROGRAM_ID
  );
}

export function deriveEscrowPda(taskPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.ESCROW), taskPda.toBuffer()],
    AGENC_PROGRAM_ID
  );
}
