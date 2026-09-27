import React, { useState, useEffect } from 'react';
import { useInheritanceContract } from '../../hooks/useInheritanceContract';
import { Plan, PlanStatus } from '../../types';
import { KeyRound, Clock, ShieldCheck, Plus, RefreshCw, AlertTriangle, ArrowUpRight, CheckCircle, ExternalLink, Coins } from 'lucide-react';
import { formatEther } from 'viem';
import { BOHR_EXPLORER_URL } from '../../config/contract';

interface OwnerDashboardProps {
  onCreatePlanClick: () => void;
  onSelectPlan: (planId: bigint) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onCreatePlanClick, onSelectPlan }) => {
  const { isConnected, fetchOwnerPlans, checkIn, recoverPlan, depositBOT, cancelPlan, loading } = useInheritanceContract();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fetching, setFetching] = useState(false);
  const [depositModalPlanId, setDepositModalPlanId] = useState<bigint | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadPlans = async () => {
    setFetching(true);
    const data = await fetchOwnerPlans();
    setPlans(data);
    setFetching(false);
  };

  useEffect(() => {
    if (isConnected) {
      loadPlans();
    }
  }, [isConnected]);

  const handleCheckIn = async (planId: bigint) => {
    try {
      await checkIn(planId);
      setActionSuccessMsg(`Check-in confirmed on-chain for Plan #${planId.toString()}! Inactivity timer reset.`);
      loadPlans();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRecover = async (planId: bigint) => {
    try {
      await recoverPlan(planId);
      setActionSuccessMsg(`Plan #${planId.toString()} recovered successfully! Succession cancelled.`);
      loadPlans();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCancelPlan = async (planId: bigint) => {
    if (!confirm('Are you sure you want to cancel this plan? Remaining deposited assets will be returned to your wallet.')) return;
    try {
      await cancelPlan(planId);
      setActionSuccessMsg(`Plan #${planId.toString()} cancelled and remaining assets refunded.`);
      loadPlans();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDepositBOTSubmit = async () => {
    if (!depositModalPlanId || !depositAmount) return;
    try {
      await depositBOT(depositModalPlanId, depositAmount);
      setActionSuccessMsg(`Successfully deposited ${depositAmount} BOT into Plan #${depositModalPlanId.toString()}!`);
      setDepositModalPlanId(null);
      setDepositAmount('');
      loadPlans();
    } catch (err: any) {
      console.error(err);
    }
  };

  const formatDuration = (seconds: bigint) => {
    const s = Number(seconds);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    if (days > 0) return `${days} days ${hours > 0 ? `${hours}h` : ''}`;
    return `${hours} hours`;
  };

  const getStatusBadge = (status: PlanStatus) => {
    switch (status) {
      case PlanStatus.ACTIVE:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>;
      case PlanStatus.TRIGGERED:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">UNDER CHALLENGE</span>;
      case PlanStatus.READY_FOR_CLAIM:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">READY FOR CLAIM</span>;
      case PlanStatus.COMPLETED:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">COMPLETED</span>;
      case PlanStatus.CANCELLED:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">CANCELLED</span>;
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-6 max-w-xl mx-auto my-12 border border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <KeyRound className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-sm text-slate-400">Connect your Web3 wallet to manage your inheritance plans on Bohr Testnet.</p>
        </div>
        <appkit-button />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <KeyRound className="w-7 h-7 text-indigo-400" />
            My Inheritance Plans
          </h1>
          <p className="text-xs text-slate-400">Manage your active plans, perform on-chain check-ins, deposit assets, and monitor succession timers.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPlans}
            disabled={fetching}
            className="p-2.5 rounded-xl glass-card hover:bg-slate-800 text-slate-300 transition-all border border-slate-700/60"
            title="Refresh Plans"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={onCreatePlanClick}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Plan
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}

      {/* Plans List */}
      {plans.length === 0 && !fetching ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-slate-800">
          <p className="text-slate-400 text-sm">No inheritance plans found for your connected wallet.</p>
          <button
            onClick={onCreatePlanClick}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const nextDeadline = Number(plan.lastActivity) + Number(plan.inactivityPeriod);
            const isDeadlinePassed = Date.now() / 1000 >= nextDeadline;

            return (
              <div key={plan.id.toString()} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 hover:border-slate-700/80 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-indigo-400">PLAN #{plan.id.toString()}</span>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>
                  {getStatusBadge(plan.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/60 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Inactivity Period</span>
                    <span className="text-slate-200 font-medium">{formatDuration(plan.inactivityPeriod)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Challenge Window</span>
                    <span className="text-slate-200 font-medium">{formatDuration(plan.challengePeriod)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Last Check-In</span>
                    <span className="text-slate-200 font-medium">
                      {new Date(Number(plan.lastActivity) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Next Deadline</span>
                    <span className={`font-medium ${isDeadlinePassed ? 'text-amber-400' : 'text-slate-200'}`}>
                      {new Date(nextDeadline * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status-dependent Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {plan.status === PlanStatus.ACTIVE && (
                    <>
                      <button
                        onClick={() => handleCheckIn(plan.id)}
                        disabled={loading}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/30"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Check In Now
                      </button>

                      <button
                        onClick={() => setDepositModalPlanId(plan.id)}
                        className="px-3.5 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-xs transition-all flex items-center gap-1.5"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        Deposit Assets
                      </button>

                      <button
                        onClick={() => handleCancelPlan(plan.id)}
                        disabled={loading}
                        className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 font-medium text-xs transition-all"
                      >
                        Cancel Plan
                      </button>
                    </>
                  )}

                  {plan.status === PlanStatus.TRIGGERED && (
                    <button
                      onClick={() => handleRecover(plan.id)}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/30 animate-pulse"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Recover Plan (Cancel Succession)
                    </button>
                  )}

                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className="px-3.5 py-2 rounded-lg glass-card hover:bg-slate-800 text-slate-300 font-medium text-xs transition-all ml-auto flex items-center gap-1"
                  >
                    View Details
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deposit BOT Modal */}
      {depositModalPlanId !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-white">Deposit BOT to Plan #{depositModalPlanId.toString()}</h3>
            <p className="text-xs text-slate-400">Deposit native BOT into your plan custody on Bohr Testnet.</p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">Amount (BOT)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1.5"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDepositModalPlanId(null)}
                className="px-4 py-2 rounded-lg glass-card text-slate-300 text-xs hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDepositBOTSubmit}
                disabled={loading || !depositAmount}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
              >
                {loading ? 'Confirming...' : 'Confirm Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
