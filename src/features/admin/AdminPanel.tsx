import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { INHERITANCE_KEY_ADDRESS, INHERITANCE_KEY_ABI } from '../../config/contract';
import { Cpu, PauseCircle, PlayCircle, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [isPaused, setIsPaused] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPauser, setIsPauser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const checkRolesAndStatus = async () => {
    if (!publicClient || !userAddress || !INHERITANCE_KEY_ADDRESS) return;

    try {
      const paused = (await publicClient.readContract({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'paused',
      })) as boolean;

      const adminRole = (await publicClient.readContract({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'DEFAULT_ADMIN_ROLE',
      })) as `0x${string}`;

      const pauserRole = (await publicClient.readContract({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'PAUSER_ROLE',
      })) as `0x${string}`;

      const hasAdmin = (await publicClient.readContract({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'hasRole',
        args: [adminRole, userAddress],
      })) as boolean;

      const hasPauser = (await publicClient.readContract({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName: 'hasRole',
        args: [pauserRole, userAddress],
      })) as boolean;

      setIsPaused(paused);
      setIsAdmin(hasAdmin);
      setIsPauser(hasPauser);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isConnected) checkRolesAndStatus();
  }, [isConnected, userAddress]);

  const handleTogglePause = async () => {
    setLoading(true);
    try {
      const functionName = isPaused ? 'unpause' : 'pause';
      await writeContractAsync({
        address: INHERITANCE_KEY_ADDRESS,
        abi: INHERITANCE_KEY_ABI,
        functionName,
      });
      setStatusMsg(`Protocol successfully ${isPaused ? 'unpaused' : 'paused'}!`);
      checkRolesAndStatus();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12">
        <Cpu className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Connect Admin Wallet</h2>
        <appkit-button />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Cpu className="w-7 h-7 text-amber-400" />
            Protocol Admin Panel
          </h1>
          <p className="text-xs text-slate-400">Manage protocol emergency controls and global boundaries on Bohr Testnet.</p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">DEFAULT_ADMIN</span>}
          {isPauser && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">PAUSER</span>}
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)}>✕</button>
        </div>
      )}

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-400" />
          Protocol Emergency Pause State
        </h3>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block">Current Status</span>
            <span className={`font-bold text-sm ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isPaused ? 'PAUSED (Emergency Stop Active)' : 'NORMAL OPERATIONAL STATE'}
            </span>
          </div>

          {isPauser ? (
            <button
              onClick={handleTogglePause}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
              {loading ? 'Processing...' : isPaused ? 'Unpause Protocol' : 'Emergency Pause'}
            </button>
          ) : (
            <span className="text-xs text-slate-500 italic">PAUSER_ROLE required</span>
          )}
        </div>
      </div>
    </div>
  );
};

