import React from 'react';
import { KeyRound, ShieldCheck, Clock, UserCheck, ArrowRight, Sparkles, AlertCircle, FileCheck, Lock, CheckCircle2, ScrollText } from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
  onCreatePlan: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp, onCreatePlan }) => {
  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 md:p-14 border border-slate-800/80">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Live on Bohr Testnet (Chain ID 968)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Programmable <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
              Digital Ownership Succession
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Standard wallets say <em className="text-indigo-300 font-serif">"Whoever holds the key controls the asset."</em> <br />
            <strong>InheritanceKey</strong> introduces a non-custodial smart-contract succession layer: defining trusted beneficiaries, inactivity timeouts, challenge windows, and trustless automated execution.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onCreatePlan}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Create Inheritance Plan
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onLaunchApp}
              className="px-6 py-3.5 rounded-xl glass-card hover:bg-slate-800/80 text-slate-200 font-semibold text-sm transition-all border border-slate-700/60"
            >
              Explore Active Plans
            </button>
          </div>
        </div>
      </section>

      {/* Problem & Solution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-2xl border border-red-500/10 bg-red-500/5 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">The Real Problem</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Digital assets have no native inheritance mechanism. If an owner becomes permanently unavailable, millions in tokens, rights, and cryptographic assets remain permanently locked forever — even when the intended beneficiary is known.
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">The InheritanceKey Solution</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            A single, unified smart contract holds assets under user-defined rules. The owner stays in full control through periodic check-ins. If inactivity occurs, a challenge period protects against accidental triggers before eligible beneficiaries can claim.
          </p>
        </div>
      </div>

      {/* Workflow Step-by-Step */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-white">How Succession Works</h2>
          <p className="text-sm text-slate-400">Six secure on-chain phases ensuring transparent, non-custodial digital succession.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative">
            <span className="text-xs font-bold text-indigo-400 font-mono">STEP 01</span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-indigo-400" />
              Create Plan
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define plan parameters on Bohr Testnet including custom inactivity periods (e.g. 180 days) and safety challenge windows.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative">
            <span className="text-xs font-bold text-indigo-400 font-mono">STEP 02</span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              Add Beneficiaries
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designate trusted beneficiary wallet addresses and set exact percentage allocations (totaling 100%).
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative">
            <span className="text-xs font-bold text-indigo-400 font-mono">STEP 03</span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              Deposit Assets
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deposit native BOT or supported ERC-20 tokens into contract custody under your plan rules. Withdraw anytime while active.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative">
            <span className="text-xs font-bold text-emerald-400 font-mono">STEP 04</span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Owner Check-In
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Periodically check in with 1-click on-chain transaction to prove wallet control and reset your inactivity countdown timer.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative">
            <span className="text-xs font-bold text-amber-400 font-mono">STEP 05</span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Challenge Window
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              If inactivity expires, anyone can trigger succession. The challenge window begins during which the owner can cancel/recover.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative">
            <span className="text-xs font-bold text-emerald-400 font-mono">STEP 06</span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Beneficiary Claim
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              After challenge window expires, designated beneficiaries claim their assigned allocations directly into their wallets.
            </p>
          </div>
        </div>
      </section>

      {/* Security Guarantees */}
      <section className="glass-panel p-8 md:p-10 rounded-3xl border border-indigo-500/20 space-y-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          Strict Security Invariants
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block text-sm mb-1">NO Admin Theft Function</strong>
              Protocol administrators cannot withdraw, redirect, or alter user inheritance funds under any circumstances.
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block text-sm mb-1">Single Smart Contract Architecture</strong>
              Unified <code className="text-indigo-300">InheritanceKey.sol</code> contract on Bohr Testnet. No fragmented contract dependencies.
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block text-sm mb-1">Owner Recovery Window</strong>
              If a succession request is triggered accidentally, the owner can cancel and recover the plan instantly during the challenge window.
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block text-sm mb-1">Strict Accounting Invariants</strong>
              Mathematical checks guarantee total claimed assets never exceed deposited balance (<code className="text-indigo-300">totalClaimed &lt;= totalDeposited</code>).
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

