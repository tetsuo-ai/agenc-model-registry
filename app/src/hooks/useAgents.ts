import { useState, useEffect } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getAgencProgram, deriveAgentPda, deriveProtocolPda } from '../lib/agenc/program';
import { OnChainAgent } from '../lib/agenc/types';
import { toNumber, toBigInt } from '../lib/agenc/utils';

export function useAgents() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [agents, setAgents] = useState<OnChainAgent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllAgents = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const program = getAgencProgram(connection, wallet);
      const accounts = await (program.account as any).agentRegistration.all();

      const agentData: OnChainAgent[] = accounts.map((account: any) => ({
        address: account.publicKey,
        agentId: Array.from(account.account.agentId),
        authority: account.account.authority,
        capabilities: toBigInt(account.account.capabilities),
        status: account.account.status,
        endpoint: account.account.endpoint,
        metadataUri: account.account.metadataUri,
        registeredAt: toNumber(account.account.registeredAt),
        lastActive: toNumber(account.account.lastActive),
        tasksCompleted: toNumber(account.account.tasksCompleted),
        totalEarned: toBigInt(account.account.totalEarned),
        reputation: account.account.reputation,
        activeTasks: account.account.activeTasks,
        stake: toBigInt(account.account.stake),
        bump: account.account.bump,
      }));

      setAgents(agentData);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAgents();
  }, [wallet?.publicKey]);

  const getAgent = async (agentPda: PublicKey): Promise<any> => {
    if (!wallet) throw new Error('Wallet not connected');

    const program = getAgencProgram(connection, wallet);
    return await (program.account as any).agentRegistration.fetch(agentPda);
  };

  const registerAgent = async (
    agentId: Uint8Array,
    capabilities: bigint,
    endpoint: string,
    metadataUri: string | null,
    stakeAmount: bigint
  ) => {
    if (!wallet) throw new Error('Wallet not connected');

    const program = getAgencProgram(connection, wallet);
    const [protocolPda] = deriveProtocolPda();
    const [agentPda] = deriveAgentPda(agentId);

    const tx = await (program.methods as any)
      .registerAgent(
        Array.from(agentId),
        capabilities,
        endpoint,
        metadataUri,
        stakeAmount
      )
      .accounts({
        agent: agentPda,
        protocolConfig: protocolPda,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await fetchAllAgents();
    return { tx, agentPda };
  };

  return {
    agents,
    loading,
    fetchAllAgents,
    getAgent,
    registerAgent,
  };
}
