import { useState, useEffect } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAgencProgram } from '../lib/agenc/program';
import { OnChainTask } from '../lib/agenc/types';
import { toNumber, toBigInt } from '../lib/agenc/utils';

export function useTasks() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [tasks, setTasks] = useState<OnChainTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllTasks = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const program = getAgencProgram(connection, wallet);
      const accounts = await (program.account as any).task.all();

      const taskData: OnChainTask[] = accounts.map((account: any) => ({
        address: account.publicKey,
        taskId: Array.from(account.account.taskId),
        creator: account.account.creator,
        requiredCapabilities: toBigInt(account.account.requiredCapabilities),
        description: Array.from(account.account.description),
        constraintHash: Array.from(account.account.constraintHash),
        rewardAmount: toBigInt(account.account.rewardAmount),
        maxWorkers: account.account.maxWorkers,
        currentWorkers: account.account.currentWorkers,
        status: account.account.status,
        taskType: account.account.taskType,
        createdAt: toNumber(account.account.createdAt),
        deadline: toNumber(account.account.deadline),
        completedAt: toNumber(account.account.completedAt),
        escrow: account.account.escrow,
        result: Array.from(account.account.result),
        completions: account.account.completions,
        requiredCompletions: account.account.requiredCompletions,
        bump: account.account.bump,
        protocolFeeBps: account.account.protocolFeeBps,
        dependsOn: account.account.dependsOn ?? null,
        minReputation: account.account.minReputation,
        rewardMint: account.account.rewardMint ?? null,
      }));

      setTasks(taskData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, [wallet?.publicKey]);

  const getTask = async (taskPda: PublicKey): Promise<any> => {
    if (!wallet) throw new Error('Wallet not connected');

    const program = getAgencProgram(connection, wallet);
    return await (program.account as any).task.fetch(taskPda);
  };

  return {
    tasks,
    loading,
    fetchAllTasks,
    getTask,
  };
}
