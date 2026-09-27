import React from 'react';
import { ShieldCheck, Lock, Terminal, ExternalLink, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { INHERITANCE_KEY_ADDRESS, BOHR_EXPLORER_URL } from '../../config/contract';

export const SecurityPage: React.FC = () => {
  return (
    <div className="space-y-12 py-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Security & Trust Model</h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Complete transparency regarding smart contract permissions, security invariants, and protocol boundaries on Bohr Testnet.
        </p>
      </div>

      {/* Contract Verification Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold">
            0x
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Deployed Contract Address</span>
            <span className="font-mono text-sm text-white font-bold">{INHERITANCE_KEY_ADDRESS}</span>
          </div>
        </div>

        <a
          href={`${BOHR_EXPLORER_URL}/address/${INHERITANCE_KEY_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30"
        >
          <Terminal className="w-4 h-4" />
          View on Bohr Scan
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* CAN vs CANNOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            What the Contract CAN Do
          </h3>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              Enforce configured inactivity timers using EVM block timestamps.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              Enforce safety challenge windows allowing owner recovery.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              Safely hold deposited native BOT and ERC-20 tokens under plan rules.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              Transfer assigned shares exclusively to validated beneficiaries upon succession.
            </li>
          </ul>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            What the Contract CANNOT Do
          </h3>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              Administrators CANNOT withdraw or reassign user inheritance assets.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              Cannot access private keys or wallet funds stored outside the contract.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              Cannot determine medical death — it evaluates on-chain transaction inactivity.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              Cannot override real-world legal probate or jurisdictional estate laws.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

