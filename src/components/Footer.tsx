import React from 'react';
import { ExternalLink, ShieldAlert, KeyRound, Terminal } from 'lucide-react';
import { INHERITANCE_KEY_ADDRESS, BOHR_EXPLORER_URL } from '../config/contract';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#060911] text-slate-400 py-10 px-4 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <span>InheritanceKey</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Programmable digital ownership succession protocol deployed on Bohr Testnet. Enforces trustless, non-custodial asset succession rules encoded directly into immutable smart contract logic.
            </p>
          </div>

          {/* Network & Contract */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Deployment Info</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between gap-2">
                <span>Network:</span>
                <span className="text-slate-200 font-medium">Bohr Testnet (Chain ID 968)</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Native Asset:</span>
                <span className="text-slate-200 font-medium">BOT</span>
              </li>
              <li>
                <a
                  href={`${BOHR_EXPLORER_URL}/address/${INHERITANCE_KEY_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-mono text-[11px]"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  {INHERITANCE_KEY_ADDRESS.slice(0, 8)}...{INHERITANCE_KEY_ADDRESS.slice(-6)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Scope & Disclaimers */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Trust Model</h4>
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-300/80 leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                InheritanceKey is a programmable smart-contract logic layer. It is not a legal will, probate substitute, or court administrator.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} InheritanceKey Protocol. Built for Bohr Testnet.</p>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href={`${BOHR_EXPLORER_URL}/address/${INHERITANCE_KEY_ADDRESS}`} target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

