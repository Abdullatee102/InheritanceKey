import React, { useState, useEffect } from 'react';
import { useInheritanceContract } from '../../hooks/useInheritanceContract';
import { Plan, PlanStatus } from '../../types';
import { UserCheck, ShieldCheck, CheckCircle2, RefreshCw, KeyRound, ArrowUpRight, AlertCircle, Coins } from 'lucide-react';
import { formatEther } from 'viem';

export const BeneficiaryPortal: React.FC = () => {
  const { isConnected, userAddress, fetchBeneficiaryPlans, getPlanDetails, claimInheritance, loading } = useInheritanceContract();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planDetailsMap, setPlanDetailsMap] = useState<Record<string, any>>({});
  const [fetching, setFetching] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadBeneficiaryData = async () => {
    setFetching(true);
    const bPlans = await fetchBeneficiaryPlans();
    setPlans(bPlans);

    const details: Record<string, any> = {};
    for (const p of bPlans) {
      const d = await getPlanDetails(p.id);
      if (d) details[p.id.toString()] = d;
    }
    setPlanDetailsMap(details);
    setFetching(false);
  };

  useEffect(() => {
    if (isConnected) {
      loadBeneficiaryData();
    }
  }, [isConnected]);

  const handleClaim = async (planId: bigint, tokenAddress: string) => {
    try {
      await claimInheritance(planId, tokenAddress);
      setSuccessMsg(`Inheritance successfully claimed for Plan #${planId.toString()}!`);
      loadBeneficiaryData();
    } catch (err: any) {
      console.error(err);
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-6 max-w-xl mx-auto my-12 border border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <UserCheck className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-sm text-slate-400">Connect your wallet to check plans where you are designated as an inheritance beneficiary.</p>
        </div>
        <appkit-button />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <UserCheck className="w-7 h-7 text-indigo-400" />
            Beneficiary Portal
          </h1>
          <p className="text-xs text-slate-400">View inheritance plans where your wallet address is designated as a beneficiary.</p>
        </div>

        <button
          onClick={loadBeneficiaryData}
          disabled={fetching}
          className="p-2.5 rounded-xl glass-card hover:bg-slate-800 text-slate-300 transition-all border border-slate-700/60"
        >
          <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      {plans.length === 0 && !fetching ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-slate-800">
          <p className="text-slate-400 text-sm">No inheritance plans found designating your wallet as a beneficiary.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const detail = planDetailsMap[plan.id.toString()];
            const userBeneficiary = detail?.beneficiaries?.find(
              (b: any) => b.account.toLowerCase() === userAddress?.toLowerCase()
            );

            const userBps = userBeneficiary ? Number(userBeneficiary.percentageBps) : 0;
            const userPercent = userBps / 100;

            const isChallengeActive =
              plan.status === PlanStatus.TRIGGERED &&
              Date.now() / 1000 < Number(plan.triggerTimestamp) + Number(plan.challengePeriod);

            const isClaimReady =
              plan.status === PlanStatus.READY_FOR_CLAIM ||
              (plan.status === PlanStatus.TRIGGERED && !isChallengeActive);

            return (
              <div key={plan.id.toString()} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-indigo-400">PLAN #{plan.id.toString()}</span>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400">Owner: {plan.owner.slice(0, 6)}...{plan.owner.slice(-4)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Your Share: {userPercent}%
                    </span>
                  </div>
                </div>

                {/* Status Callout */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Status:</span>
                    {plan.status === PlanStatus.ACTIVE && <span className="text-emerald-400 font-semibold">Active (Locked)</span>}
                    {plan.status === PlanStatus.TRIGGERED && <span className="text-amber-400 font-semibold">Under Challenge</span>}
                    {isClaimReady && <span className="text-indigo-400 font-bold">Claim Ready</span>}
                    {plan.status === PlanStatus.COMPLETED && <span className="text-blue-400 font-semibold">Completed</span>}
                  </div>

                  {plan.status === PlanStatus.ACTIVE && (
                    <p className="text-[11px] text-slate-500">Plan is active. Owner is performing regular check-ins.</p>
                  )}

                  {plan.status === PlanStatus.TRIGGERED && (
                    <p className="text-[11px] text-amber-300/80">
                      Owner inactivity elapsed. Succession under challenge window. Claim opens when challenge expires.
                    </p>
                  )}

                  {isClaimReady && (
                    <p className="text-[11px] text-indigo-300">
                      Succession finalized! You can now claim your assigned inheritance tokens directly into your wallet.
                    </p>
                  )}
                </div>

                {/* Deposited Assets & Claim Actions */}
                {detail?.assetBalances && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Deposited Plan Assets</h4>

                    {detail.assetBalances.map((asset: any) => {
                      const totalDep = asset.deposited;
                      const userClaimable = (totalDep * BigInt(userBps)) / 10000n;
                      const isBOT = asset.token === '0x0000000000000000000000000000000000000000';

                      return (
                        <div key={asset.token} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{isBOT ? 'BOT (Native)' : 'ERC-20 Token'}</span>
                            <span className="text-[11px] text-slate-400">
                              Your Allocation: {formatEther(userClaimable)} {isBOT ? 'BOT' : 'Tokens'}
                            </span>
                          </div>

                          {isClaimReady && (
                            <button
                              onClick={() => handleClaim(plan.id, asset.token)}
                              disabled={loading}
                              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              Claim Asset
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

