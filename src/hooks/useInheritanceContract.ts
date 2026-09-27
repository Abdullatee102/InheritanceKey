import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { INHERITANCE_KEY_ADDRESS, INHERITANCE_KEY_ABI } from '../config/contract';
import { Plan, Beneficiary, DocumentReference, PlanStatus } from '../types';

export function useInheritanceContract() {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Fetch owner plans
  const fetchOwnerPlans = useCallback(async (): Promise<Plan[]> => {
    if (!publicClient || !userAddress || !INHERITANCE_KEY_ADDRESS) return [];

    try {
      const planIds = (await publicClient.readContract({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'getUserPlans',
        args: [userAddress],
      })) as bigint[];

      const plans: Plan[] = [];
      for (const id of planIds) {
        const rawPlan = (await publicClient.readContract({
          address: INHERITANCE_KEY_ADDRESS,
          abi: INHERITANCE_KEY_ABI,
          functionName: 'getPlan',
          args: [id],
        })) as any;

        plans.push({
          id: rawPlan.id,
          owner: rawPlan.owner,
          name: rawPlan.name,
          inactivityPeriod: rawPlan.inactivityPeriod,
          challengePeriod: rawPlan.challengePeriod,
          lastActivity: rawPlan.lastActivity,
          triggerTimestamp: rawPlan.triggerTimestamp,
          status: rawPlan.status as PlanStatus,
        });
      }
      return plans;
    } catch (err) {
      console.error('Error fetching owner plans:', err);
      return [];
    }
  }, [publicClient, userAddress]);

  // Fetch beneficiary plans
  const fetchBeneficiaryPlans = useCallback(async (): Promise<Plan[]> => {
    if (!publicClient || !userAddress || !INHERITANCE_KEY_ADDRESS) return [];

    try {
      const planIds = (await publicClient.readContract({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'getUserBeneficiaryPlans',
        args: [userAddress],
      })) as bigint[];

      const plans: Plan[] = [];
      for (const id of planIds) {
        const rawPlan = (await publicClient.readContract({
          address: INHERITANCE_KEY_ADDRESS,
          abi: INHERITANCE_KEY_ABI,
          functionName: 'getPlan',
          args: [id],
        })) as any;

        plans.push({
          id: rawPlan.id,
          owner: rawPlan.owner,
          name: rawPlan.name,
          inactivityPeriod: rawPlan.inactivityPeriod,
          challengePeriod: rawPlan.challengePeriod,
          lastActivity: rawPlan.lastActivity,
          triggerTimestamp: rawPlan.triggerTimestamp,
          status: rawPlan.status as PlanStatus,
        });
      }
      return plans;
    } catch (err) {
      console.error('Error fetching beneficiary plans:', err);
      return [];
    }
  }, [publicClient, userAddress]);

  // Fetch plan details (beneficiaries, assets, claimable amounts)
  const getPlanDetails = useCallback(
    async (planId: bigint) => {
      if (!publicClient || !INHERITANCE_KEY_ADDRESS) return null;

      try {
        const [plan, beneficiaries, tokens, documents] = await Promise.all([
          publicClient.readContract({
            address: INHERITANCE_KEY_ADDRESS,
            abi: INHERITANCE_KEY_ABI,
            functionName: 'getPlan',
            args: [planId],
          }) as Promise<any>,
          publicClient.readContract({
            address: INHERITANCE_KEY_ADDRESS,
            abi: INHERITANCE_KEY_ABI,
            functionName: 'getBeneficiaries',
            args: [planId],
          }) as unknown as Promise<Beneficiary[]>,
          publicClient.readContract({
            address: INHERITANCE_KEY_ADDRESS,
            abi: INHERITANCE_KEY_ABI,
            functionName: 'getPlanAssetTokens',
            args: [planId],
          }) as Promise<`0x${string}`[]>,
          publicClient.readContract({
            address: INHERITANCE_KEY_ADDRESS,
            abi: INHERITANCE_KEY_ABI,
            functionName: 'getPlanDocuments',
            args: [planId],
          }) as Promise<DocumentReference[]>,
        ]);

        const assetBalances: { token: string; deposited: bigint; claimed: bigint }[] = [];
        for (const token of tokens) {
          const deposited = (await publicClient.readContract({
            address: INHERITANCE_KEY_ADDRESS,
            abi: INHERITANCE_KEY_ABI,
            functionName: 'planDeposits',
            args: [planId, token],
          })) as bigint;

          const claimed = (await publicClient.readContract({
            address: INHERITANCE_KEY_ADDRESS,
            abi: INHERITANCE_KEY_ABI,
            functionName: 'planClaimedAmounts',
            args: [planId, token],
          })) as bigint;

          assetBalances.push({ token, deposited, claimed });
        }

        return {
          plan: {
            id: plan.id,
            owner: plan.owner,
            name: plan.name,
            inactivityPeriod: plan.inactivityPeriod,
            challengePeriod: plan.challengePeriod,
            lastActivity: plan.lastActivity,
            triggerTimestamp: plan.triggerTimestamp,
            status: plan.status as PlanStatus,
          },
          beneficiaries,
          assetBalances,
          documents,
        };
      } catch (err) {
        console.error('Error fetching plan details:', err);
        return null;
      }
    },
    [publicClient]
  );

  // Contract Write Actions
  const createPlan = async (
    name: string,
    inactivitySeconds: number,
    challengeSeconds: number,
    beneficiaryAddrs: string[],
    beneficiaryBps: number[]
  ) => {
    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'createPlan',
        args: [
          name,
          BigInt(inactivitySeconds),
          BigInt(challengeSeconds),
          beneficiaryAddrs as `0x${string}`[],
          beneficiaryBps.map((b) => BigInt(b)),
        ],
      });
      setTxHash(hash);
      return hash;
    } finally {
      setLoading(false);
    }
  };

  const depositBOT = async (planId: bigint, amountEther: string) => {
    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'depositBOT',
        args: [planId],
        value: parseEther(amountEther),
      });
      setTxHash(hash);
      return hash;
    } finally {
      setLoading(false);
    }
  };

  const depositERC20 = async (planId: bigint, tokenAddress: string, amount: string, decimals = 18) => {
    setLoading(true);
    try {
      const parsedAmount = parseUnits(amount, decimals);
      const hash = await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'depositERC20',
        args: [planId, tokenAddress as `0x${string}`, parsedAmount],
      });
      setTxHash(hash);
      return hash;
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async (planId: bigint) => {
    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'checkIn',
        args: [planId],
      });
      setTxHash(hash);
      return hash;
    } finally {
      setLoading(false);
    }
  };

  const triggerSuccession = async (planId: bigint) => {
    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'triggerSuccession',
        args: [planId],
      });
      setTxHash(hash);
      return hash;
    } finally {
      setLoading(false);
    }
  };

  const recoverPlan = async (planId: bigint) => {
    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'recoverPlan',
        args: [planId],
      });
      setTxHash(hash);
      return hash;
    } finally {
      setLoading(false);
    }
  };

  const claimInheritance = async (planId: bigint, tokenAddress: string) => {
    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'claimInheritance',
        args: [planId, tokenAddress as `0x${string}`],
      });
      setTxHash(hash);
      return hash;
    } finally {
      setLoading(false);
    }
  };

  const withdrawAsset = async (planId: bigint, tokenAddress: string, amount: bigint) => {
    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'withdrawAsset',
        args: [planId, tokenAddress as `0x${string}`, amount],
      });
      setTxHash(hash);
      return hash;
    } finally {
      setLoading(false);
    }
  };

  const cancelPlan = async (planId: bigint) => {
    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'cancelPlan',
        args: [planId],
      });
      setTxHash(hash);
      return hash;
    } finally {
      setLoading(false);
    }
  };

  return {
    userAddress,
    isConnected,
    loading,
    txHash,
    fetchOwnerPlans,
    fetchBeneficiaryPlans,
    getPlanDetails,
    createPlan,
    depositBOT,
    depositERC20,
    checkIn,
    triggerSuccession,
    recoverPlan,
    claimInheritance,
    withdrawAsset,
    cancelPlan,
  };
}
