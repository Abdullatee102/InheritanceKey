import React, { useState, useEffect } from 'react';
import { useInheritanceContract } from '../../hooks/useInheritanceContract';
import { PlanStatus, Beneficiary } from '../../types';
import { KeyRound, Clock, ShieldCheck, ArrowLeft, RefreshCw, UserCheck, AlertTriangle, Coins, ExternalLink } from 'lucide-react';
import { formatEther } from 'viem';
import { BOHR_EXPLORER_URL } from '../../config/contract';

interface PlanDetailViewProps {
  planId: bigint;
  onBack: () => void;
}

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({ planId, onBack }) => {
  const { userAddress, getPlanDetails, checkIn, triggerSuccession, recoverPlan, loading } = useInheritanceContract();
  const [details, setDetails] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  const loadDetails = async () => {
    setFetching(true);
    const data = await getPlanDetails(planId);
    setDetails(data);
    setFetching(false);
  };

  useEffect(() => {
    loadDetails();
  }, [planId]);

  if (fetching || !details) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-slate-400 text-xs">Loading on-chain details for Plan #{planId.toString()}...</p>
      </div>
    );
  }

  const { plan, beneficiaries, assetBalances } = details;
  const isOwner = userAddress?.toLowerCase() === plan.owner.toLowerCase();
  const nextDeadline = Number(plan.lastActivity) + Number(plan.inactivityPeriod);
  const isDeadlinePassed = Date.now() / 1000 >= nextDeadline;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <button onClick={onBack} className="px-4 py-2 rounded-xl glass-card text-slate-300 text-xs flex items-center gap-2 hover:bg-slate-800">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Plan Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-indigo-400">PLAN #{plan.id.toString()}</span>
            <h1 className="text-3xl font-extrabold text-white">{plan.name}</h1>
            <p className="text-xs text-slate-400">Owner Address: {plan.owner}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              STATUS: {PlanStatus[plan.status]}
            </span>
          </div>
        </div>

        {/* State Machine Visualization */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-slate-400 block">State Machine Progression</span>
          <div className="flex items-center justify-between text-xs gap-2">
            <div className={`flex-1 p-2.5 rounded-xl border text-center ${plan.status === PlanStatus.ACTIVE ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              1. ACTIVE
            </div>
            <div className={`flex-1 p-2.5 rounded-xl border text-center ${plan.status === PlanStatus.TRIGGERED ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              2. CHALLENGE
            </div>
            <div className={`flex-1 p-2.5 rounded-xl border text-center ${plan.status === PlanStatus.READY_FOR_CLAIM ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              3. CLAIM READY
            </div>
            <div className={`flex-1 p-2.5 rounded-xl border text-center ${plan.status === PlanStatus.COMPLETED ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-bold' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              4. COMPLETED
            </div>
          </div>
        </div>

        {/* Beneficiaries & Asset Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Beneficiaries */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              Designated Beneficiaries
            </h3>
            <div className="space-y-2">
              {beneficiaries.map((b: Beneficiary, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{b.account.slice(0, 8)}...{b.account.slice(-6)}</span>
                  <span className="text-indigo-400 font-bold">{Number(b.percentageBps) / 100}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assets */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-400" />
              Custodied Assets
            </h3>
            <div className="space-y-2">
              {assetBalances.map((asset: any, i: number) => {
                const isBOT = asset.token === '0x0000000000000000000000000000000000000000';
                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{isBOT ? 'BOT (Native)' : 'ERC-20 Token'}</span>
                    <span className="text-slate-300 font-mono">{formatEther(asset.deposited)} {isBOT ? 'BOT' : 'Tokens'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contextual Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          {isOwner && plan.status === PlanStatus.ACTIVE && (
            <button
              onClick={() => checkIn(plan.id)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              Owner Check-In
            </button>
          )}

          {isOwner && plan.status === PlanStatus.TRIGGERED && (
            <button
              onClick={() => recoverPlan(plan.id)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-600/30 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Recover Plan (Cancel Succession)
            </button>
          )}

          {plan.status === PlanStatus.ACTIVE && isDeadlinePassed && (
            <button
              onClick={() => triggerSuccession(plan.id)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              Trigger Succession
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

