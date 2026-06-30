import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getNextPagePath } from '../lib/flow';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Car, 
  Clock, 
  User, 
  FileText, 
  Globe, 
  Phone, 
  Mail, 
  ChevronDown, 
  Info,
  Check,
  AlertCircle,
  Menu,
  ShieldCheck,
  Apple,
  Play,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube
} from 'lucide-react';

interface InspectionCenter {
  id: string;
  name: string;
  region: string;
  authorizedEntity: string;
  workingHours: string;
  logoType: 'aman' | 'applus' | 'takamol' | 'massar';
}

interface BookingMeta {
  region: string;
  city: string;
  center: string;
  vehicleType: string;
  dateTime: string;
}

const getVehicleTypeName = (id: string): string => {
  const mapping: Record<string, string> = {
    private_car: 'سيارة خاصة',
    private_light_transport: 'مركبة نقل خفيفة خاصة',
    heavy_transport: 'نقل ثقيل',
    light_bus: 'حافلة خفيفة',
    light_transport: 'مركبة نقل خفيفة',
    large_bus: 'حافلة كبيرة',
    medium_transport: 'نقل متوسط',
    two_wheeler: 'الدراجات ثنائية العجلات',
    public_works: 'مركبات أشغال عامة',
    three_four_wheeler: 'دراجة ثلاثية او رباعية العجلات',
    heavy_trailer: 'مقطورة ثقيلة',
    taxi: 'سيارات الأجرة',
    rental: 'سيارات التأجير',
    medium_bus: 'حافلة متوسطة',
    heavy_semi_trailer: 'نصف مقطورة ثقيلة',
    light_trailer: 'مقطورة خفيفة',
    light_semi_trailer: 'نصف مقطورة خفيفة',
    private_light_semi_trailer: 'نصف مقطورة خفيفة خاصة',
    private_light_trailer: 'مقطورة خفيفة خاصة'
  };
  return mapping[id] || id;
};

export const BookingSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const passedState = (() => {
    if (location.state) {
      localStorage.setItem('last_booking_state', JSON.stringify(location.state));
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
  })() as {
    serviceId?: string;
    selectedCenter?: InspectionCenter;
    bookingMeta?: BookingMeta;
  } | null;

  // Retrieve initial values from router state
  const center = passedState?.selectedCenter || {
    id: 'ctr-makkah-1',
    name: 'مكة المكرمة - الشرائع',
    region: 'makkah',
    authorizedEntity: 'الجهة المرخصة / أمان - الفحص الفني الدوري للسيارات',
    workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً',
    logoType: 'aman' as const
  };

  const bookingMeta = passedState?.bookingMeta || {
    region: 'makkah',
    city: 'مكة المكرمة - الشرائع',
    center: 'مكة المكرمة - الشرائع',
    vehicleType: 'private_car',
    dateTime: '2026-06-27 09:30 صباحاً'
  };

  // Form State
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  
  // Refined phone state
  const [phoneCountry, setPhoneCountry] = useState('+966');
  const [mobile, setMobile] = useState('');
  const [phoneTouch, setPhoneTouch] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneErrorMsg, setPhoneErrorMsg] = useState('');

  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [isDelegated, setIsDelegated] = useState(false);
  
  // Delegation Details
  const [delegatedType, setDelegatedType] = useState<'citizen' | 'resident'>('citizen');
  const [delegatedName, setDelegatedName] = useState('');
  const [delegatedMobile, setDelegatedMobile] = useState('');
  const [delegatedNationality, setDelegatedNationality] = useState('سعودي');
  const [delegatedId, setDelegatedId] = useState('');
  const [delegatedBirthDate, setDelegatedBirthDate] = useState('');
  const [delegateAgree, setDelegateAgree] = useState(false);

  const [vehicleStatus, setVehicleStatus] = useState<'istimara' | 'customs'>('istimara');
  
  // Plate Information State
  const [plateArabic, setPlateArabic] = useState('');
  const [plateEnglish, setPlateEnglish] = useState('');
  const [plateNumbers, setPlateNumbers] = useState('');

  // Dropdown States matched to URL/parameters
  const [vType, setVType] = useState(bookingMeta.vehicleType || 'private_car');
  const [regionVal, setRegionVal] = useState(center.region || 'makkah');
  const [centerVal, setCenterVal] = useState(center.id || 'ctr-makkah-1');
  const [serviceType, setServiceType] = useState('periodic_inspection');
  const [isHazardous, setIsHazardous] = useState(false);
  const [appDate, setAppDate] = useState(bookingMeta.dateTime || '2026-06-27 09:30 صباحاً');

  const [formError, setFormError] = useState('');

  // Phone validation logic
  useEffect(() => {
    if (!mobile) {
      setPhoneValid(false);
      setPhoneErrorMsg('');
      return;
    }

    if (phoneCountry === '+966') {
      const cleanNum = mobile.replace(/\s+/g, '');
      const isOnlyDigits = /^\d+$/.test(cleanNum);

      if (!isOnlyDigits) {
        setPhoneValid(false);
        setPhoneErrorMsg('يجب إدخال أرقام فقط');
        return;
      }

      if (cleanNum.startsWith('05')) {
        if (cleanNum.length === 10) {
          setPhoneValid(true);
          setPhoneErrorMsg('');
        } else {
          setPhoneValid(false);
          setPhoneErrorMsg('رقم الجوال الذي يبدأ بـ 05 يجب أن يتكون من 10 أرقام');
        }
      } else if (cleanNum.startsWith('5')) {
        if (cleanNum.length === 9) {
          setPhoneValid(true);
          setPhoneErrorMsg('');
        } else {
          setPhoneValid(false);
          setPhoneErrorMsg('رقم الجوال الذي يبدأ بـ 5 يجب أن يتكون من 9 أرقام');
        }
      } else {
        setPhoneValid(false);
        setPhoneErrorMsg('يجب أن يبدأ رقم الجوال بـ 05 أو 5');
      }
    } else {
      if (mobile.length >= 8 && mobile.length <= 15) {
        setPhoneValid(true);
        setPhoneErrorMsg('');
      } else {
        setPhoneValid(false);
        setPhoneErrorMsg('رقم الهاتف غير صالح للمنطقة المختارة');
      }
    }
  }, [mobile, phoneCountry]);

  const NATIONALITIES = [
    { code: '', name: 'اختر الجنسية' },
    { code: 'SA', name: 'سعودي' },
    { code: 'EG', name: 'مصري' },
    { code: 'SY', name: 'سوري' },
    { code: 'YE', name: 'يمني' },
    { code: 'JO', name: 'أردني' },
    { code: 'SD', name: 'سوداني' },
    { code: 'PK', name: 'باكستاني' },
    { code: 'IN', name: 'هندي' },
    { code: 'BD', name: 'بنجلاديشي' }
  ];

  const REGIONS = [
    { id: 'makkah', name: 'منطقة مكة المكرمة' },
    { id: 'riyadh', name: 'منطقة الرياض' },
    { id: 'eastern', name: 'المنطقة الشرقية' },
    { id: 'madinah', name: 'منطقة المدينة المنورة' },
    { id: 'qassim', name: 'منطقة القصيم' },
    { id: 'asir', name: 'منطقة عسير' },
    { id: 'tabuk', name: 'منطقة تبوك' },
    { id: 'hail', name: 'منطقة حائل' },
    { id: 'northern_borders', name: 'منطقة الحدود الشمالية' },
    { id: 'jazan', name: 'منطقة جازان' },
    { id: 'najran', name: 'منطقة نجران' },
    { id: 'baha', name: 'منطقة الباحة' },
    { id: 'jouf', name: 'منطقة الجوف' }
  ];

  const CENTERS: Record<string, { id: string; name: string }[]> = {
    makkah: [
      { id: 'ctr-makkah-1', name: 'مكة المكرمة - الشرائع' },
      { id: 'ctr-jeddah-1', name: 'جدة - حي المروة' },
      { id: 'ctr-taif-1', name: 'الطائف - حي السداد' }
    ],
    riyadh: [
      { id: 'ctr-riyadh-1', name: 'الرياض - مخرج 17' },
      { id: 'ctr-riyadh-2', name: 'الرياض - حي الرمال' },
      { id: 'ctr-alkharj-1', name: 'الخرج - المنطقة الصناعية' }
    ],
    eastern: [
      { id: 'ctr-dammam-1', name: 'الدمام - حي الأمانة' },
      { id: 'ctr-khobar-1', name: 'الخبر - حي الجسر' },
      { id: 'ctr-hufuf-1', name: 'الهفوف - محاسن' }
    ],
    madinah: [
      { id: 'ctr-madinah-1', name: 'المدينة المنورة - الدائري الثاني' }
    ],
    qassim: [
      { id: 'ctr-buraidah-1', name: 'بريدة - طريق الملك عبدالعزيز' }
    ],
    asir: [
      { id: 'ctr-abha-1', name: 'أبها - طريق المحالة' }
    ],
    tabuk: [
      { id: 'ctr-tabuk-1', name: 'تبوك - المنطقة الصناعية' }
    ],
    hail: [
      { id: 'ctr-hail-1', name: 'حائل - طريق المدينة المنورة' }
    ],
    northern_borders: [
      { id: 'ctr-arar-1', name: 'عرعر - طريق طريف' }
    ],
    jazan: [
      { id: 'ctr-jazan-1', name: 'جازان - طريق الملك عبدالعزيز' }
    ],
    najran: [
      { id: 'ctr-najran-1', name: 'نجران - طريق الملك خالد' }
    ],
    baha: [
      { id: 'ctr-baha-1', name: 'الباحة - طريق الملك فهد' }
    ],
    jouf: [
      { id: 'ctr-sakaka-1', name: 'سكاكا - طريق الملك عبدالرحمن' }
    ]
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setRegionVal(val);
    const firstCenter = CENTERS[val]?.[0];
    if (firstCenter) {
      setCenterVal(firstCenter.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouch(true);

    if (!fullName.trim()) {
      setFormError('يرجى إدخال الاسم الرباعي كما هو مدون في الهوية.');
      return;
    }
    if (!idNumber.trim() || idNumber.length < 10) {
      setFormError('يرجى إدخال رقم هوية وطنية أو إقامة صحيح مكون من 10 خانات.');
      return;
    }
    if (!phoneValid) {
      setFormError('يرجى إدخال رقم جوال صحيح متبعاً بالصيغة المطلوبة (مثال: 05xxxxxxxx)');
      return;
    }
    if (!nationality) {
      setFormError('يرجى اختيار الجنسية لمتابعة الطلب.');
      return;
    }
    if (isDelegated && (!delegatedName.trim() || !delegatedId.trim())) {
      setFormError('يرجى إدخال بيانات المفوض بشكل كامل وصحيح.');
      return;
    }
    if (vehicleStatus === 'istimara' && (!plateArabic.trim() || !plateEnglish.trim() || !plateNumbers.trim())) {
      setFormError('يرجى إدخال بيانات لوحة السيارة بالكامل للحصول على معلومات الفحص الفني.');
      return;
    }

    setFormError('');

    const currentRegionCenters = CENTERS[regionVal] || [];
    const selectedCenterObj = currentRegionCenters.find(c => c.id === centerVal) || { name: center.name };

    const dynamicNext = await getNextPagePath('/booking-summary');
    const targetPath = dynamicNext || '/checkout';

    const currentServiceId = serviceType === 'reinspection' ? 'srv-2' : (passedState?.serviceId || localStorage.getItem('selected_service_id') || 'srv-1');
    const serviceName = currentServiceId === 'srv-2' ? 'إعادة فحص المركبة' : 'فحص دوري للمركبة';
    
    // Calculate dynamic fee for the selected vehicle type
    const getFeeForVehicle = (type: string, serviceId: string): number => {
      if (serviceId === 'srv-2') {
        if (type === 'motorcycle' || type === 'two_wheeler' || type === 'three_four_wheeler') {
          return 17.25;
        }
        if (type === 'light_transport' || type === 'private_light_transport') {
          return 50.60;
        }
        if (
          type === 'heavy_transport' || 
          type === 'large_bus' || 
          type === 'medium_transport' || 
          type === 'public_works' || 
          type === 'heavy_trailer' || 
          type === 'medium_bus' || 
          type === 'heavy_semi_trailer'
        ) {
          return 74.75;
        }
        return 37.95;
      } else {
        if (type === 'motorcycle' || type === 'two_wheeler' || type === 'three_four_wheeler') {
          return 57.50;
        }
        if (type === 'light_transport' || type === 'private_light_transport') {
          return 161.00;
        }
        if (
          type === 'heavy_transport' || 
          type === 'large_bus' || 
          type === 'medium_transport' || 
          type === 'public_works' || 
          type === 'heavy_trailer' || 
          type === 'medium_bus' || 
          type === 'heavy_semi_trailer'
        ) {
          return 241.50;
        }
        if (
          type === 'taxi' || 
          type === 'rental' || 
          type === 'light_bus' || 
          type === 'light_trailer' || 
          type === 'light_semi_trailer' || 
          type === 'private_light_semi_trailer' || 
          type === 'private_light_trailer'
        ) {
          return 138.00;
        }
        return 115.00;
      }
    };

    const servicePrice = getFeeForVehicle(vType, currentServiceId);

    const statePayload: any = {
      serviceId: currentServiceId,
      selectedCenterName: selectedCenterObj.name,
      serviceName: serviceName,
      amount: servicePrice,
      bookingMeta: {
        region: REGIONS.find(r => r.id === regionVal)?.name || 'منطقة مكة المكرمة',
        city: selectedCenterObj.name,
        center: selectedCenterObj.name,
        vehicleType: getVehicleTypeName(vType),
        vehicleTypeId: vType,
        dateTime: appDate,
        amount: servicePrice,
        serviceName: serviceName
      },
      personalInfo: {
        fullName,
        idNumber,
        mobile: `${phoneCountry}${mobile}`,
        email,
        nationality,
        isDelegated,
        delegatedDetails: isDelegated ? {
          type: delegatedType,
          name: delegatedName,
          mobile: delegatedMobile,
          nationality: delegatedNationality,
          id: delegatedId,
          birthDate: delegatedBirthDate
        } : null
      },
      vehicleInfo: {
        status: vehicleStatus,
        plateArabic,
        plateEnglish,
        plateNumbers
      }
    };

    // Submit the booking details to the backend immediately so the Admin sees it instantly in the Admin Portal!
    let finalTxId: string | null = null;
    const existingTxId = localStorage.getItem('last_tx_id');
    try {
      const bRes = await fetch('/api/booking-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingTxId || undefined,
          bookingMeta: statePayload.bookingMeta,
          personalInfo: statePayload.personalInfo,
          vehicleInfo: statePayload.vehicleInfo,
          serviceName: serviceName,
          amount: servicePrice
        })
      });
      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData && bData.transaction) {
          finalTxId = bData.transaction.id;
          localStorage.setItem('last_tx_id', bData.transaction.id);
        }
      }
    } catch (bErr) {
      console.warn('Failed to pre-submit booking to admin:', bErr);
    }

    if (finalTxId) {
      statePayload.txId = finalTxId;
    }

    localStorage.setItem('last_booking_state', JSON.stringify(statePayload));

    navigate(targetPath, {
      state: statePayload
    });
  };

  return (
    <div className="min-h-screen bg-[#fbfcfa] flex flex-col dir-rtl text-right font-sans antialiased pb-20">
      
      {/* 1. Header with Safety Emblem Logo */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm px-4 py-4.5">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          
          {/* Right Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#01936c] to-[#004d33] flex items-center justify-center text-white shadow-sm shrink-0">
              <svg className="w-5.5 h-5.5 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,15 15,80 85,80" stroke="currentColor" strokeWidth="10" fill="none" />
                <circle cx="50" cy="55" r="10" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black text-[#004d33] leading-none">مركز سلامة المركبات</h1>
              <span className="text-[8px] text-slate-400 font-extrabold tracking-wide uppercase block mt-0.5">Vehicles Safety Center</span>
            </div>
          </Link>

          {/* Left Gray Hamburger */}
          <button type="button" className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400 border border-slate-100">
            <Menu className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* 2. Main Form Content */}
      <main className="flex-grow py-6 px-4">
        <div className="mx-auto max-w-lg space-y-8">
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {formError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-bold text-right"
              >
                <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{formError}</p>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 1. المعلومات الشخصية */}
            {/* ========================================================= */}
            <div className="space-y-5 bg-white rounded-2xl border border-slate-100/90 shadow-sm p-5 sm:p-7">
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-[#01936c] pr-3 py-0.5">
                المعلومات الشخصية
              </h3>

              {/* الاسم */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  الاسم <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أدخل الاسم"
                  className="w-full rounded-xl border border-slate-200/95 bg-white px-4 py-3.5 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none transition-all shadow-sm text-right"
                />
              </div>

              {/* رقم الهوية / الإقامة */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  رقم الهوية / الإقامة <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="رقم الهوية / الإقامة"
                  className="w-full rounded-xl border border-slate-200/95 bg-white px-4 py-3.5 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none transition-all shadow-sm text-right"
                />
              </div>

              {/* رقم الجوال */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  رقم الجوال <span className="text-rose-500 font-bold">*</span>
                </label>
                
                <div className="flex border border-slate-200 rounded-xl overflow-hidden shadow-sm items-stretch focus-within:border-[#01936c] transition-colors bg-white">
                  {/* Left Side Country Code Button */}
                  <div className="relative flex items-center bg-slate-50 border-l border-slate-200 px-3 shrink-0">
                    <select
                      value={phoneCountry}
                      onChange={(e) => {
                        setPhoneCountry(e.target.value);
                        setMobile('');
                      }}
                      className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer appearance-none pl-5 py-2.5 text-center"
                    >
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+973">🇧🇭 +973</option>
                    </select>
                    <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Input on the right */}
                  <input
                    type="tel"
                    maxLength={15}
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="05xxxxxxxx"
                    className="flex-grow px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none bg-white text-right"
                  />
                </div>
              </div>

              {/* البريد الإلكتروني */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="car@example.com"
                  className="w-full rounded-xl border border-slate-200/95 bg-white px-4 py-3.5 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none transition-all shadow-sm text-right"
                />
              </div>

              {/* الجنسية */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  الجنسية <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    dir="rtl"
                    className="w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 py-3.5 text-xs font-black text-slate-700 focus:border-[#01936c] focus:outline-none appearance-none cursor-pointer transition-all shadow-sm text-right"
                  >
                    {NATIONALITIES.map((nat) => (
                      <option key={nat.code} value={nat.code}>
                        {nat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* هل تريد تفويض شخص آخر يفحص المركبة؟ */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 mt-3">
                <span className="text-xs font-black text-slate-700">هل تريد تفويض شخص آخر يفحص المركبة؟</span>
                <button
                  type="button"
                  onClick={() => setIsDelegated(!isDelegated)}
                  className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDelegated ? 'bg-[#01936c]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isDelegated ? '-translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SUBSECTION: معلومات المفوض */}
              <AnimatePresence>
                {isDelegated && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden pt-4 space-y-4 border-t border-slate-100/80 mt-4"
                  >
                    <h4 className="text-xs font-black text-[#01936c]">معلومات المفوض</h4>
                    
                    {/* Segmented Control - Citizen / Resident */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setDelegatedType('citizen')}
                        className={`py-2 rounded-lg text-xs font-black text-center transition-all ${
                          delegatedType === 'citizen'
                            ? 'bg-[#01936c] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        مواطن
                      </button>
                      <button
                        type="button"
                        onClick={() => setDelegatedType('resident')}
                        className={`py-2 rounded-lg text-xs font-black text-center transition-all ${
                          delegatedType === 'resident'
                            ? 'bg-[#01936c] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        مقيم
                      </button>
                    </div>

                    {/* اسم المفوض */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] font-black text-slate-700">
                        اسم المفوض <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={delegatedName}
                        onChange={(e) => setDelegatedName(e.target.value)}
                        placeholder="أكتب اسم المفوض هنا..."
                        className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none text-right"
                      />
                    </div>

                    {/* رقم جوال المفوض */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] font-black text-slate-700">
                        رقم الجوال <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex border border-slate-200 rounded-xl overflow-hidden items-stretch focus-within:border-[#01936c] transition-colors bg-white">
                        <div className="relative flex items-center bg-slate-50 border-l border-slate-200 px-2.5 shrink-0">
                          <span className="text-xs font-black text-slate-600">966+ ▾</span>
                        </div>
                        <input
                          type="tel"
                          value={delegatedMobile}
                          onChange={(e) => setDelegatedMobile(e.target.value.replace(/\D/g, ''))}
                          placeholder="05xxxxxxxx"
                          className="flex-grow px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none text-right"
                        />
                      </div>
                    </div>

                    {/* جنسية المفوض */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] font-black text-slate-700">
                        جنسية المفوض <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={delegatedNationality}
                          onChange={(e) => setDelegatedNationality(e.target.value)}
                          dir="rtl"
                          className="w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 py-3 text-xs font-black text-slate-700 focus:border-[#01936c] focus:outline-none appearance-none text-right"
                        >
                          <option value="سعودي">سعودي</option>
                          <option value="مقيم">مقيم</option>
                        </select>
                        <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* رقم الهوية الوطنية / الإقامة للمفوض */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] font-black text-slate-700">
                        رقم الهوية الوطنية / الإقامة للمفوض <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={delegatedId}
                        onChange={(e) => setDelegatedId(e.target.value.replace(/\D/g, ''))}
                        placeholder="اكتب رقم الهوية الوطنية / الإقامة للمفوض هنا..."
                        className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none text-right"
                      />
                    </div>

                    {/* تاريخ ميلاد المفوض */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] font-black text-slate-700">
                        تاريخ ميلاد المفوض <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={delegatedBirthDate}
                        onChange={(e) => setDelegatedBirthDate(e.target.value)}
                        placeholder="التاريخ والوقت"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none text-right"
                      />
                    </div>

                    {/* موافقة التفويض switch */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-right gap-3">
                      <span className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                        أوافق على أن خدمة التفويض تقتصر على إعطاء المفوض الصلاحية بزيارة بوابة فحص الفني الدوري للمركبة المفوض عليها
                      </span>
                      <button
                        type="button"
                        onClick={() => setDelegateAgree(!delegateAgree)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          delegateAgree ? 'bg-[#01936c]' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            delegateAgree ? '-translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* ========================================================= */}
            {/* 2. معلومات المركبة */}
            {/* ========================================================= */}
            <div className="space-y-5 bg-white rounded-2xl border border-slate-100/90 shadow-sm p-5 sm:p-7">
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-[#01936c] pr-3 py-0.5">
                معلومات المركبة
              </h3>

              {/* اختيار حالة المركبة */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  اختر حالة المركبة <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVehicleStatus('istimara')}
                    className={`py-3.5 rounded-xl text-xs font-black text-center transition-all border cursor-pointer ${
                      vehicleStatus === 'istimara'
                        ? 'border-[#01936c] bg-[#01936c] text-white shadow-sm font-black'
                        : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    تحميل رخصة سير
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleStatus('customs')}
                    className={`py-3.5 rounded-xl text-xs font-black text-center transition-all border cursor-pointer ${
                      vehicleStatus === 'customs'
                        ? 'border-[#01936c] bg-[#01936c] text-white shadow-sm font-black'
                        : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    تحميل بطاقة جمركية
                  </button>
                </div>
              </div>

              {/* رقم اللوحة والتصميم التفاعلي */}
              {vehicleStatus === 'istimara' && (
                <div className="space-y-5 pt-1">
                  
                  <label className="block text-xs font-black text-slate-700">
                    رقم اللوحة <span className="text-rose-500">*</span>
                  </label>

                  {/* SAUDI LICENSE PLATE PREVIEW */}
                  <div className="w-full max-w-[320px] mx-auto bg-white rounded-2xl border-[3.5px] border-slate-950 shadow-sm p-2 flex items-stretch font-sans select-none h-24 relative overflow-hidden">
                    
                    {/* Left part: English letters & Numbers + Emblem */}
                    <div className="w-2/3 flex flex-col justify-between border-l-2 border-slate-950 pl-2">
                      {/* English Letters Area */}
                      <div className="text-xl font-bold text-slate-800 tracking-[0.3em] text-center mt-1 uppercase leading-none min-h-[24px]">
                        {plateEnglish ? plateEnglish.toUpperCase().split('').join(' ') : '• • •'}
                      </div>
                      {/* English Numbers Area */}
                      <div className="text-2xl font-bold text-slate-900 tracking-widest text-center mb-1 leading-none font-mono">
                        {plateNumbers ? plateNumbers.split('').join(' ') : '• • • •'}
                      </div>
                    </div>

                    {/* Right part: Arabic Letters & Numbers */}
                    <div className="w-1/3 flex flex-col justify-between text-right pr-2">
                      {/* Arabic Letters Area */}
                      <div className="text-lg font-bold text-slate-800 text-center mt-1 leading-none min-h-[22px]">
                        {plateArabic ? plateArabic.split('').join(' ') : '• • •'}
                      </div>
                      {/* Arabic Numbers Area */}
                      <div className="text-xl font-bold text-slate-900 text-center mb-1 leading-none">
                        {plateNumbers ? plateNumbers : '٠٠٠٠'}
                      </div>
                    </div>

                    {/* Blue strip representing KSA details (Side pillar) */}
                    <div className="absolute left-0 inset-y-0 w-8 bg-slate-100 border-r-2 border-slate-950 flex flex-col items-center justify-between py-1 px-0.5 shadow-inner">
                      {/* Saudi Circle Emblem */}
                      <svg className="w-4 h-4 text-emerald-800" viewBox="0 0 100 100" fill="currentColor">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" />
                        <path d="M50,15 l5,15 h15 l-12,10 l5,15 l-13-10 l-13,10 l5-15 l-12-10 h15 z" />
                      </svg>
                      <div className="text-[7px] font-black text-slate-800 leading-none tracking-tighter">KSA</div>
                      <div className="text-[5px] font-bold text-slate-400 leading-none scale-90">السعودية</div>
                    </div>

                  </div>

                  {/* INPUTS FOR THE LICENSE PLATE */}
                  <div className="space-y-3 pt-1">
                    
                    {/* حروف عربية */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] font-black text-slate-500">حروف عربية</label>
                      <input
                        type="text"
                        value={plateArabic}
                        onChange={(e) => setPlateArabic(e.target.value)}
                        placeholder="مثال : أ ب ج"
                        className="w-full text-right rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none"
                      />
                    </div>

                    {/* حروف إنجليزية */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] font-black text-slate-500">حروف إنجليزية</label>
                      <input
                        type="text"
                        value={plateEnglish}
                        onChange={(e) => setPlateEnglish(e.target.value)}
                        placeholder="e.g : A B C"
                        className="w-full text-right rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none uppercase"
                      />
                    </div>

                    {/* أرقام اللوحة */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] font-black text-slate-500">أرقام اللوحة</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={plateNumbers}
                        onChange={(e) => setPlateNumbers(e.target.value.replace(/\D/g, ''))}
                        placeholder="0000"
                        className="w-full text-right rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* بطاقة جمركية fields */}
              {vehicleStatus === 'customs' && (
                <div className="space-y-2.5 pt-1">
                  <label className="block text-xs font-black text-slate-700">رقم البطاقة الجمركية <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل رقم البطاقة الجمركية المعتمد"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none transition-all text-right"
                  />
                </div>
              )}

            </div>

            {/* ========================================================= */}
            {/* 3. مركز الخدمة */}
            {/* ========================================================= */}
            <div className="space-y-5 bg-white rounded-2xl border border-slate-100/90 shadow-sm p-5 sm:p-7">
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-[#01936c] pr-3 py-0.5">
                مركز الخدمة
              </h3>

              {/* نوع المركبة */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  نوع المركبة <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value)}
                    dir="rtl"
                    className="w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 py-3.5 text-xs font-black text-slate-700 focus:border-[#01936c] focus:outline-none appearance-none cursor-pointer transition-all shadow-sm text-right"
                  >
                    <option value="private_car">🚗 سيارة خاصة</option>
                    <option value="private_light_transport">🛻 مركبة نقل خفيفة خاصة</option>
                    <option value="heavy_transport">🚛 نقل ثقيل</option>
                    <option value="light_bus">🚌 حافلة خفيفة</option>
                    <option value="light_transport">🚚 مركبة نقل خفيفة</option>
                    <option value="large_bus">🚍 حافلة كبيرة</option>
                    <option value="medium_transport">🚛 نقل متوسط</option>
                    <option value="two_wheeler">🏍️ الدراجات ثنائية العجلات</option>
                    <option value="public_works">🚜 مركبات أشغال عامة</option>
                    <option value="three_four_wheeler">🛺 دراجة ثلاثية او رباعية العجلات</option>
                    <option value="heavy_trailer">🎴 مقطورة ثقيلة</option>
                    <option value="taxi">🚕 سيارات الأجرة</option>
                    <option value="rental">🚙 سيارات التأجير</option>
                    <option value="medium_bus">🚌 حافلة متوسطة</option>
                    <option value="heavy_semi_trailer">🚛 نصف مقطورة ثقيلة</option>
                    <option value="light_trailer">🛞 مقطورة خفيفة</option>
                    <option value="light_semi_trailer">🛞 نصف مقطورة خفيفة</option>
                    <option value="private_light_semi_trailer">🛞 نصف مقطورة خفيفة خاصة</option>
                    <option value="private_light_trailer">🛞 مقطورة خفيفة خاصة</option>
                  </select>
                  <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* المنطقة */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  المنطقة <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={regionVal}
                    onChange={handleRegionChange}
                    dir="rtl"
                    className="w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 py-3.5 text-xs font-black text-slate-700 focus:border-[#01936c] focus:outline-none appearance-none cursor-pointer transition-all shadow-sm text-right"
                  >
                    <option value="">اختر منطقة</option>
                    {REGIONS.map(reg => (
                      <option key={reg.id} value={reg.id}>
                        {reg.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* مركز الفحص */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  مركز الفحص <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={centerVal}
                    onChange={(e) => setCenterVal(e.target.value)}
                    dir="rtl"
                    className="w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 py-3.5 text-xs font-black text-slate-700 focus:border-[#01936c] focus:outline-none appearance-none cursor-pointer transition-all shadow-sm text-right"
                  >
                    <option value="">اختر مركز الفحص</option>
                    {(CENTERS[regionVal] || []).map(ctr => (
                      <option key={ctr.id} value={ctr.id}>
                        {ctr.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* نوع خدمة الفحص */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  نوع خدمة الفحص <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    dir="rtl"
                    className="w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 py-3.5 text-xs font-black text-slate-700 focus:border-[#01936c] focus:outline-none appearance-none cursor-pointer transition-all shadow-sm text-right"
                  >
                    <option value="periodic_inspection">الفحص الدوري</option>
                    <option value="reinspection">إعادة الفحص</option>
                  </select>
                  <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold mt-1">
                  هذه الخدمة مخصصة لمن قام بإجراء فحص مسبق خلال 14 يوم عمل الماضية ولم يستنفذ جميع محاولات إعادة الفحص.
                </p>
              </div>

              {/* المركبة تحمل مواد خطرة؟ */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 mt-2">
                <span className="text-xs font-black text-slate-700">المركبة تحمل مواد خطرة؟</span>
                <button
                  type="button"
                  onClick={() => setIsHazardous(!isHazardous)}
                  className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isHazardous ? 'bg-[#01936c]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isHazardous ? '-translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>

            {/* ========================================================= */}
            {/* 4. موعد الخدمة */}
            {/* ========================================================= */}
            <div className="space-y-5 bg-white rounded-2xl border border-slate-100/90 shadow-sm p-5 sm:p-7">
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-[#01936c] pr-3 py-0.5">
                موعد الخدمة
              </h3>

              {/* تاريخ الفحص */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-700">
                  تاريخ الفحص <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={appDate}
                  onChange={(e) => setAppDate(e.target.value)}
                  placeholder="التاريخ والوقت"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-bold text-slate-800 focus:border-[#01936c] focus:outline-none transition-all shadow-sm text-right"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold mt-1">
                  الحضور على الموعد يسهم في سرعة وجودة الخدمة وفي حالة عدم الحضور لن يسمح بحجز آخر إلا بعد 48 ساعة وحسب الأوقات المتاحة.
                </p>
              </div>

            </div>

            {/* SUBMIT BUTTON - MATCHES SCREENSHOT EXACTLY (-- التالي) */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="px-12 py-3.5 bg-[#00936c] hover:bg-[#007a53] text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>-- التالي</span>
              </button>
            </div>

          </form>

        </div>
      </main>

      {/* FOOTER: Matches Vehicles Safety Center (مركز سلامة المركبات) */}
      <footer className="bg-[#00301e] text-white pt-12 pb-6 mt-16 px-4">
        <div className="mx-auto max-w-lg space-y-10">
          
          <div className="grid grid-cols-2 gap-8 border-b border-white/10 pb-10">
            
            {/* Links Group 1 */}
            <div className="space-y-3.5 text-right">
              <h4 className="text-xs font-black text-emerald-400 border-r-2 border-[#01936c] pr-2">الفحص</h4>
              <ul className="space-y-2 text-[11px] font-bold text-emerald-100/80">
                <li><Link to="/" className="hover:text-white transition">الرئيسية</Link></li>
                <li><Link to="/search-centers" className="hover:text-white transition">مواقع الفحص</Link></li>
                <li><Link to="/InspectionFees" className="hover:text-white transition">المقابل المالي للفحص</Link></li>
              </ul>
            </div>

            {/* Links Group 2 */}
            <div className="space-y-3.5 text-right">
              <h4 className="text-xs font-black text-emerald-400 border-r-2 border-[#01936c] pr-2">الدعم والمساعدة</h4>
              <ul className="space-y-2 text-[11px] font-bold text-emerald-100/80">
                <li><a href="#" className="hover:text-white transition">الأسئلة الشائعة</a></li>
                <li><a href="#" className="hover:text-white transition">اتصل بنا</a></li>
                <li><a href="#" className="hover:text-white transition font-mono">English</a></li>
              </ul>
            </div>

          </div>

          <div className="col-span-2 space-y-4 text-right">
            <h4 className="text-xs font-black text-emerald-400 border-r-2 border-[#01936c] pr-2">حمل تطبيق: سلامة المركبات | Vehicles Safety</h4>
            <div className="flex flex-wrap gap-2.5 justify-start">
              
              <a href="#" className="flex items-center gap-2 px-3 py-2 bg-emerald-950/60 rounded-xl border border-white/10 hover:border-white/25 transition">
                <Apple className="w-5 h-5 text-white" />
                <div className="text-right">
                  <span className="block text-[7px] text-emerald-300 font-bold uppercase leading-none">Download on</span>
                  <span className="block text-[10px] font-black leading-none mt-1">App Store</span>
                </div>
              </a>

              <a href="#" className="flex items-center gap-2 px-3 py-2 bg-emerald-950/60 rounded-xl border border-white/10 hover:border-white/25 transition">
                <Play className="w-5 h-5 text-white" />
                <div className="text-right">
                  <span className="block text-[7px] text-emerald-300 font-bold uppercase leading-none">Get it on</span>
                  <span className="block text-[10px] font-black leading-none mt-1">Google Play</span>
                </div>
              </a>

            </div>
          </div>

          {/* Social Media & Bottom Legal */}
          <div className="flex flex-col items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-950/80 border border-white/10 hover:border-white/30 hover:bg-[#004d33] flex items-center justify-center text-white transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-950/80 border border-white/10 hover:border-white/30 hover:bg-[#004d33] flex items-center justify-center text-white transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-950/80 border border-white/10 hover:border-white/30 hover:bg-[#004d33] flex items-center justify-center text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>

            <div className="text-center space-y-1">
              <p className="text-[10px] text-emerald-200/80 font-bold leading-relaxed">
                جميع الحقوق محفوظة للهيئة السعودية للمواصفات والمقاييس والجودة © 2026
              </p>
              <p className="text-[9px] text-emerald-300/60 font-medium">
                تم تطويره وصيانته بواسطة شركة ثقة لخدمات الأعمال المحدودة.
              </p>
            </div>

          </div>

          {/* Partner & Authority Logos */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/5 opacity-80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-[9px] text-slate-300 font-black">هيئة المواصفات والمقاييس SASO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <Check className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <span className="text-[9px] text-slate-300 font-black">بوابة النفاذ الموحد الآمنة</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
