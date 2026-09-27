import React, { useState } from 'react';
import { useInheritanceContract } from '../../hooks/useInheritanceContract';
import { ScrollText, UserPlus, Trash2, CheckCircle2, ShieldAlert, ArrowRight, ArrowLeft, KeyRound, Clock } from 'lucide-react';
import { isAddress } from 'viem';

interface CreatePlanWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreatePlanWizard: React.FC<CreatePlanWizardProps> = ({ onSuccess, onCancel }) => {
  const { createPlan, loading } = useInheritanceContract();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [inactivityDays, setInactivityDays] = useState(180);
  const [challengeDays, setChallengeDays] = useState(14);

  const [beneficiaries, setBeneficiaries] = useState<{ account: string; percentage: number }[]>([
    { account: '', percentage: 100 },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddBeneficiary = () => {
    setBeneficiaries([...beneficiaries, { account: '', percentage: 0 }]);
  };

  const handleRemoveBeneficiary = (index: number) => {
    setBeneficiaries(beneficiaries.filter((_, i) => i !== index));
  };

  const handleBeneficiaryChange = (index: number, field: 'account' | 'percentage', value: any) => {
    const updated = [...beneficiaries];
    if (field === 'percentage') {
      updated[index].percentage = Number(value);
    } else {
      updated[index].account = value;
    }
    setBeneficiaries(updated);
  };

  const totalPercentage = beneficiaries.reduce((sum, b) => sum + (Number(b.percentage) || 0), 0);

  const validateStep1 = () => {
    if (!name.trim()) {
      setErrorMsg('Please enter a plan name.');
      return false;
    }
    if (inactivityDays <= 0) {
      setErrorMsg('Inactivity period must be greater than 0.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if (beneficiaries.length === 0) {
      setErrorMsg('At least one beneficiary is required.');
      return false;
    }

    for (let i = 0; i < beneficiaries.length; i++) {
      if (!isAddress(beneficiaries[i].account)) {
        setErrorMsg(`Beneficiary #${i + 1} has an invalid wallet address.`);
        return false;
      }
    }

    if (totalPercentage !== 100) {
      setErrorMsg(`Total percentage allocation must equal 100% (Current total: ${totalPercentage}%).`);
      return false;
    }

    setErrorMsg(null);
    return true;
  };

  const handleSubmitOnChain = async () => {
    if (!validateStep1() || !validateStep2()) return;

    try {
      const inactivitySeconds = Math.round(inactivityDays * 86400);
      const challengeSeconds = Math.round(challengeDays * 86400);

      const addrs = beneficiaries.map((b) => b.account);
      const bps = beneficiaries.map((b) => Math.round(b.percentage * 100)); // convert % to BPS (60% = 6000 BPS)

      await createPlan(name, inactivitySeconds, challengeSeconds, addrs, bps);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transaction failed on Bohr Testnet.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Step Progress Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">1</span>
          <span className="text-xs">Plan Config</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-800"></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">2</span>
          <span className="text-xs">Beneficiaries</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-800"></div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">3</span>
          <span className="text-xs">Review & Confirm</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Config */}
      {step === 1 && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-indigo-400" />
            Step 1: Plan Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Plan Name</label>
              <input
                type="text"
                placeholder="e.g. Primary Estate Trust"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Inactivity Period (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={inactivityDays}
                  onChange={(e) => setInactivityDays(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Number of inactive days before triggerable (e.g. 180 days)</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Challenge Window (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={challengeDays}
                  onChange={(e) => setChallengeDays(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Safety window to recover plan after trigger (e.g. 14 days)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button onClick={onCancel} className="px-5 py-2.5 rounded-xl glass-card text-slate-300 text-xs hover:bg-slate-800">
              Cancel
            </button>

            <button
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2"
            >
              Next: Beneficiaries
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Beneficiaries */}
      {step === 2 && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-indigo-400" />
              Step 2: Add Beneficiaries
            </h2>

            <button
              onClick={handleAddBeneficiary}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Beneficiary
            </button>
          </div>

          <div className="space-y-4">
            {beneficiaries.map((b, idx) => (
              <div key={idx} className="p-4 rounded-xl glass-card border border-slate-700/60 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Beneficiary #{idx + 1} Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={b.account}
                    onChange={(e) => handleBeneficiaryChange(idx, 'account', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg glass-input text-xs font-mono"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Share (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={b.percentage}
                    onChange={(e) => handleBeneficiaryChange(idx, 'percentage', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg glass-input text-xs"
                  />
                </div>

                {beneficiaries.length > 1 && (
                  <button
                    onClick={() => handleRemoveBeneficiary(idx)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors sm:self-end"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 text-xs">
            <span className="text-slate-400">Total Allocation:</span>
            <span className={`font-bold ${totalPercentage === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {totalPercentage}% / 100%
            </span>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl glass-card text-slate-300 text-xs flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={() => {
                if (validateStep2()) setStep(3);
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2"
            >
              Review Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            Step 3: Review & Confirm On-Chain
          </h2>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-slate-500 block">Plan Overview</span>
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-300">Name:</span>
                <span className="text-white font-bold">{name}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-300">Inactivity Period:</span>
                <span className="text-white">{inactivityDays} Days</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-300">Challenge Window:</span>
                <span className="text-white">{challengeDays} Days</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-slate-500 block mb-2">Designated Beneficiaries ({beneficiaries.length})</span>
              {beneficiaries.map((b, i) => (
                <div key={i} className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-300">{b.account}</span>
                  <span className="text-indigo-400 font-bold">{b.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl glass-card text-slate-300 text-xs flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleSubmitOnChain}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              {loading ? 'Confirming Transaction...' : 'Confirm & Create On-Chain'}
              <KeyRound className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

