import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getNextPagePath } from '../lib/flow';
import { motion, AnimatePresence } from 'motion/react';
import { VehicleTypeDropdown, CalendarPicker } from './CustomDropdowns';
import {
  Calendar,
  Search,
  MapPin,
  Info,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Download,
  CheckCircle2,
  ArrowLeft,
  Clock,
  UserCheck,
  FileText,
  Check,
  Building2,
  AlertTriangle,
  Award
} from 'lucide-react';

interface CityData {
  name: string;
  centers: string[];
}

interface RegionData {
  [key: string]: CityData[];
}

const REGION_MAP: RegionData = {
  'المنطقة الوسطى': [
    { name: 'الرياض', centers: ['مركز الرياض الرئيسي - طريق الميناء', 'مركز الرياض الشمالي - حي الياسمين', 'مركز الرياض مخرج ١٨'] },
    { name: 'الخرج', centers: ['مركز الخرج الرئيسي - حي الأمل'] },
    { name: 'الدوادمي', centers: ['مركز الدوادمي الموحد'] }
  ],
  'المنطقة الغربية': [
    { name: 'جدة', centers: ['مركز جدة الرئيسي - طريق عسفان', 'مركز جنوب جدة - حي الأمير فواز'] },
    { name: 'مكة المكرمة', centers: ['مركز مكة المكرمة - حي الشرائع'] },
    { name: 'المدينة المنورة', centers: ['مركز المدينة المنورة الرئيسي'] },
    { name: 'الطائف', centers: ['مركز الطائف الموحد'] }
  ],
  'المنطقة الشرقية': [
    { name: 'الدمام', centers: ['مركز الدمام الرئيسي - طريق الجبيل', 'مركز غرب الدمام'] },
    { name: 'الخبر', centers: ['مركز الخبر الموحد'] },
    { name: 'الأحساء', centers: ['مركز الأحساء الرئيسي'] }
  ],
  'المنطقة الجنوبية': [
    { name: 'أبها', centers: ['مركز أبها الموحد - طريق آل يوسف'] },
    { name: 'خميس مشيط', centers: ['مركز خميس مشيط الرئيسي'] },
    { name: 'نجران', centers: ['مركز نجران الموحد'] }
  ],
  'المنطقة الشمالية': [
    { name: 'تبوك', centers: ['مركز تبوك الرئيسي - حي المصيف'] },
    { name: 'حائل', centers: ['مركز حائل الموحد'] },
    { name: 'عرعر', centers: ['مركز عرعر الرئيسي'] }
  ]
};

export const LandingPage: React.FC<{ defaultActiveTab?: 'booking' | 'inquiry' }> = ({ defaultActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeMainTab, setActiveMainTab] = useState<'booking' | 'inquiry'>(() => {
    if (defaultActiveTab) return defaultActiveTab;
    if (location.pathname === '/inquiry') return 'inquiry';
    return 'booking';
  });

  // Search State mimicking the screenshots exactly
  const [selectedRegion, setSelectedRegion] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    return localStorage.getItem('selected_service_id') || 'srv-1';
  });

  // Inquiry Form States
  const [inquiryType, setInquiryType] = useState<'plate' | 'serial'>('plate');
  const [inquiryPlateNum, setInquiryPlateNum] = useState('');
  const [inquiryPlateCharAr, setInquiryPlateCharAr] = useState('');
  const [inquiryPlateCharEn, setInquiryPlateCharEn] = useState('');
  const [inquiryChassis, setInquiryChassis] = useState('');
  const [inquirySerial, setInquirySerial] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<any | null>(null);
  const [inquiryError, setInquiryError] = useState('');
  const [inquiryNotFound, setInquiryNotFound] = useState(false);

  useEffect(() => {
    if (defaultActiveTab) {
      setActiveMainTab(defaultActiveTab);
    } else if (location.pathname === '/inquiry') {
      setActiveMainTab('inquiry');
    } else if (location.pathname === '/' || location.pathname === '/booking') {
      setActiveMainTab('booking');
    }

    if (location.state) {
      const state = location.state as any;
      if (state.activeTab === 'inquiry') {
        setActiveMainTab('inquiry');
      } else if (state.activeTab === 'booking') {
        setActiveMainTab('booking');
      }
      if (state.autoScrollToBooking) {
        const searchSection = document.getElementById('search-section');
        if (searchSection) {
          setTimeout(() => {
            searchSection.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
    }
  }, [location.state, location.pathname, defaultActiveTab]);

  // Available slots mockup
  const availableSlots = [
    { id: 'slot-1', time: '08:00 ص - 10:00 ص', date: 'اليوم', type: 'صباحي' },
    { id: 'slot-2', time: '10:00 ص - 12:00 م', date: 'اليوم', type: 'صباحي' },
    { id: 'slot-3', time: '01:00 م - 03:00 م', date: 'اليوم', type: 'مسائي' },
    { id: 'slot-4', time: '04:00 م - 06:00 م', date: 'اليوم', type: 'مسائي' }
  ];

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegion || !vehicleType || !dateTime) {
      setSearchError('الرجاء اختيار المنطقة، نوع المركبة، والتاريخ والوقت للمتابعة وبدء البحث.');
      return;
    }
    setSearchError('');
    // Resolve dynamic next route based on active flow configuration
    const dynamicNext = await getNextPagePath('/');
    const targetPath = dynamicNext || '/search-centers';

    navigate(targetPath, {
      state: {
        region: selectedRegion === 'المنطقة الغربية' ? 'makkah' : selectedRegion === 'المنطقة الوسطى' ? 'riyadh' : selectedRegion === 'المنطقة الشرقية' ? 'eastern' : '',
        vehicleType: vehicleType,
        dateTime: dateTime,
        serviceId: selectedServiceId
      }
    });
  };

  const handleBookSlot = (slot: string) => {
    // Scroll to search section to select center & fill out details in order
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    localStorage.setItem('selected_service_id', serviceId);
    // Scroll to search section to select center & fill out details in order
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError('');
    setInquiryResult(null);
    setInquiryNotFound(false);

    if (inquiryType === 'plate') {
      if (!inquiryPlateNum || !inquiryPlateCharAr || !inquiryPlateCharEn || !inquiryChassis) {
        setInquiryError('الرجاء إدخال كافة بيانات لوحة المركبة ورقم الهوية أو الهيكل للاستعلام.');
        return;
      }
    } else {
      if (!inquirySerial) {
        setInquiryError('الرجاء إدخال الرقم التسلسلي للمركبة للاستعلام.');
        return;
      }
    }

    setInquiryLoading(true);

    setTimeout(() => {
      setInquiryLoading(false);
      setInquiryNotFound(true);
    }, 1500);
  };

  return (
    <div className="font-sans antialiased bg-gray-50/50 min-h-screen text-right dir-rtl">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-white border-b border-gray-100 py-16 lg:py-24">
        {/* Subtle decorative background shapes */}
        <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[160px]" />
          <div className="absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[140px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Top Accent Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#004d33]/10 text-[#004d33] text-xs font-extrabold mb-4 border border-[#004d33]/20">
              <Award className="w-3.5 h-3.5" />
              <span>المنصة الموحدة لخدمات الفحص الفني الدوري</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              المنصة الموحدة لمواعيد الفحص الفني الدوري للمركبات
            </h1>

            <p className="text-sm sm:text-base text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              بوابة إلكترونية متكاملة تهدف إلى تسهيل حجز وإدارة مواعيد الفحص الفني للمركبات، والتحقق من سلامتها الفنية لرفع مستويات السلامة المرورية في كافة مناطق ومحافظات المملكة.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <button
                onClick={() => handleStartService('srv-1')}
                className="px-8 py-4 rounded-xl bg-[#004d33] hover:bg-[#003422] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                احجز موعداً الآن
              </button>
              <button
                onClick={() => {
                  const searchSection = document.getElementById('search-section');
                  if (searchSection) {
                    searchSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm sm:text-base transition-all border border-slate-200 cursor-pointer"
              >
                البحث عن مواعيد متاحة
              </button>
            </div>
          </div>

          {/* Custom Search Card Section */}
          <div id="search-section" className="mt-12 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl max-w-4xl mx-auto text-right">
            
            {/* Tab Selector */}
            <div className="flex border-b border-gray-100 mb-6 justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('booking');
                  setInquiryResult(null);
                  setInquiryError('');
                }}
                className={`pb-3 px-4 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeMainTab === 'booking'
                    ? 'border-[#004d33] text-[#004d33]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>حجز موعد فحص جديد</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('inquiry');
                  setSearchError('');
                }}
                className={`pb-3 px-4 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeMainTab === 'inquiry'
                    ? 'border-[#004d33] text-[#004d33]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>الاستعلام عن حالة الفحص</span>
              </button>
            </div>

            {activeMainTab === 'booking' ? (
              <div>
                <div className="text-right mb-6">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-start gap-2 flex-row-reverse">
                    <Calendar className="w-5 h-5 text-[#004d33]" />
                    <span>البحث السريع عن المواعيد المتاحة</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-bold">اختر المنطقة ونوع المركبة والتاريخ لعرض مراكز الفحص المعتمدة</p>
                </div>

                <form onSubmit={handleSearch} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Region Select */}
                    <div className="space-y-2 text-right">
                      <label className="block text-xs font-bold text-slate-700">المنطقة</label>
                      <div className="relative">
                        <select
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value)}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-xs font-black text-slate-800 focus:border-[#004d33] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004d33] appearance-none cursor-pointer shadow-sm"
                        >
                          <option value="">اختر المنطقة</option>
                          <option value="المنطقة الغربية">المنطقة الغربية (مكة/جدة)</option>
                          <option value="المنطقة الوسطى">المنطقة الوسطى (الرياض)</option>
                          <option value="المنطقة الشرقية">المنطقة الشرقية (الدمام)</option>
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Vehicle Type Custom Dropdown */}
                    <VehicleTypeDropdown
                      label="نوع المركبة"
                      placeholder="اختر نوع المركبة"
                      value={vehicleType}
                      onChange={setVehicleType}
                    />

                    {/* Date and Time Calendar Picker */}
                    <CalendarPicker
                      label="التاريخ والوقت"
                      placeholder="اختر التاريخ والوقت"
                      value={dateTime}
                      onChange={setDateTime}
                    />
                  </div>

                  {searchError && (
                    <p className="text-xs text-rose-600 font-bold flex items-center gap-1 justify-start">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{searchError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-[#004d33] hover:bg-[#003422] text-white font-extrabold text-sm sm:text-base transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>بحث عن المواعيد المتوفرة</span>
                  </button>
                </form>
              </div>
            ) : (
              // Inquiry Tab Form & Result Showcase
              <div className="space-y-6">
                <div className="text-right mb-4">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-start gap-2 flex-row-reverse">
                    <Search className="w-5 h-5 text-[#004d33]" />
                    <span>الاستعلام الرقمي عن صلاحية الفحص الفني</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-bold">استعلم فوراً عن سريان وصلاحية وثيقة فحص المركبة عبر قاعدة بيانات سلامة الموحدة</p>
                </div>

                {inquiryNotFound ? (
                  // No Registered Inspection Found Screen (Highly Professional and Aesthetic)
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-rose-50/30 rounded-2xl border border-rose-100 p-6 space-y-6 text-right relative overflow-hidden"
                  >
                    {/* Top warning line */}
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-600" />

                    <div className="flex flex-col sm:flex-row-reverse items-center justify-between gap-4 border-b border-rose-100/50 pb-5">
                      <div className="flex items-center gap-3.5 flex-row-reverse w-full">
                        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
                          <AlertTriangle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="text-sm font-black text-rose-950">لا يوجد فحص مسجل</h3>
                          <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                            عذراً، لم يتم العثور على أي شهادة أو وثيقة فحص فني دوري مسجلة لهذه المركبة في قاعدة بيانات سلامة الموحدة.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-rose-100/60 space-y-4">
                      <div className="flex items-start gap-3 flex-row-reverse text-right">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <p className="text-xs text-slate-600 leading-relaxed font-bold">
                          يرجى مراجعة رقم اللوحة، الحروف، الرقم التسلسلي، أو رقم الهيكل/الهوية والتحقق من كتابتهم بشكل صحيح.
                        </p>
                      </div>
                      <div className="flex items-start gap-3 flex-row-reverse text-right">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <p className="text-xs text-slate-600 leading-relaxed font-bold">
                          إذا كانت وثيقة الفحص قد انتهت صلاحيتها أو أن السيارة لم تُفحص بعد، فيتعين عليك حجز موعد جديد في أحد مراكز الفحص المعتمدة.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInquiryNotFound(false);
                          setInquiryResult(null);
                        }}
                        className="px-5 py-3 rounded-xl text-xs font-black border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>تعديل البيانات وإعادة البحث 🔄</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setInquiryNotFound(false);
                          setInquiryResult(null);
                          setActiveMainTab('booking');
                        }}
                        className="px-5 py-3 rounded-xl text-xs font-black bg-[#004d33] text-white hover:bg-[#003422] shadow-md shadow-[#004d33]/20 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>حجز موعد فحص فني جديد</span>
                      </button>
                    </div>
                  </motion.div>
                ) : !inquiryResult ? (
                  <form onSubmit={handleInquirySubmit} className="space-y-5 text-right">
                    {/* Inquiry Type Radio Buttons */}
                    <div className="flex gap-4 border-b border-slate-50 pb-3">
                      <button
                        type="button"
                        onClick={() => setInquiryType('plate')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                          inquiryType === 'plate' ? 'bg-[#004d33]/10 text-[#004d33]' : 'text-slate-500 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        بواسطة بيانات اللوحة وهيكل المركبة
                      </button>
                      <button
                        type="button"
                        onClick={() => setInquiryType('serial')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                          inquiryType === 'serial' ? 'bg-[#004d33]/10 text-[#004d33]' : 'text-slate-500 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        بواسطة الرقم التسلسلي للمركبة
                      </button>
                    </div>

                    {inquiryType === 'plate' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم اللوحة (أرقام)</label>
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="مثال: 9924"
                              value={inquiryPlateNum}
                              onChange={(e) => setInquiryPlateNum(e.target.value.replace(/\D/g, ''))}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-slate-900 focus:border-[#004d33] focus:bg-white focus:outline-none font-sans text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">حروف اللوحة (عربي)</label>
                            <input
                              type="text"
                              maxLength={5}
                              placeholder="مثال: أ ب ج"
                              value={inquiryPlateCharAr}
                              onChange={(e) => setInquiryPlateCharAr(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-slate-900 focus:border-[#004d33] focus:bg-white focus:outline-none text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">حروف اللوحة (إنجليزي)</label>
                            <input
                              type="text"
                              maxLength={5}
                              placeholder="مثال: A B C"
                              value={inquiryPlateCharEn}
                              onChange={(e) => setInquiryPlateCharEn(e.target.value.toUpperCase())}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-slate-900 focus:border-[#004d33] focus:bg-white focus:outline-none font-sans text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهيكل أو هوية المالك</label>
                            <input
                              type="text"
                              maxLength={10}
                              placeholder="رقم الهوية أو الهيكل"
                              value={inquiryChassis}
                              onChange={(e) => setInquiryChassis(e.target.value.replace(/\D/g, ''))}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-slate-900 focus:border-[#004d33] focus:bg-white focus:outline-none font-sans text-right"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم التسلسلي للمركبة</label>
                          <input
                            type="text"
                            maxLength={9}
                            placeholder="مثال: 123456789"
                            value={inquirySerial}
                            onChange={(e) => setInquirySerial(e.target.value.replace(/\D/g, ''))}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-slate-900 focus:border-[#004d33] focus:bg-white focus:outline-none font-sans text-right"
                          />
                        </div>
                      </div>
                    )}

                    {inquiryError && (
                      <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{inquiryError}</span>
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={inquiryLoading}
                      className="w-full py-4 rounded-xl bg-[#004d33] hover:bg-[#003422] text-white font-extrabold text-sm sm:text-base transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-55"
                    >
                      {inquiryLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>جاري الاستعلام والتحقق الرقمي...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>استعلام عن وثيقة الفحص الفني</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  // Digital Certificate Showcase Card
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-50 rounded-2xl border border-gray-200 p-6 space-y-6 text-right relative overflow-hidden"
                  >
                    {/* Glowing green indicator bar */}
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-emerald-500 animate-pulse" />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-250 pb-4 gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-150 text-emerald-850 text-[10px] font-black border border-emerald-300 shadow-sm animate-pulse">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          وثيقة فحص فني سارية ومعتمدة
                        </span>
                        <h3 className="text-sm font-black text-slate-800 mt-2">رقم الشهادة الرقمية: <span className="font-mono text-emerald-750">{inquiryResult.certificateNumber}</span></h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">الجهة المرخصة: {inquiryResult.entity}</p>
                      </div>

                      {/* QR Code Graphic matching official documents */}
                      <div className="flex items-center gap-2 border border-slate-200 bg-white p-2 rounded-xl shadow-inner">
                        <div className="text-left font-sans text-[8px] font-bold text-slate-400">
                          <p>SCAN TO</p>
                          <p>VERIFY</p>
                        </div>
                        <svg className="w-12 h-12 text-slate-900" viewBox="0 0 100 100">
                          {/* Simulated QR Code matrix */}
                          <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                          <rect x="10" y="10" width="15" height="15" fill="white" />
                          <rect x="13" y="13" width="9" height="9" fill="currentColor" />
                          
                          <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                          <rect x="75" y="10" width="15" height="15" fill="white" />
                          <rect x="78" y="13" width="9" height="9" fill="currentColor" />

                          <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                          <rect x="10" y="75" width="15" height="15" fill="white" />
                          <rect x="13" y="78" width="9" height="9" fill="currentColor" />

                          <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                          <rect x="45" y="45" width="10" height="10" fill="white" />

                          <rect x="40" y="10" width="10" height="15" fill="currentColor" />
                          <rect x="55" y="15" width="10" height="10" fill="currentColor" />
                          <rect x="15" y="45" width="15" height="10" fill="currentColor" />
                          <rect x="75" y="45" width="10" height="15" fill="currentColor" />
                          <rect x="45" y="75" width="15" height="15" fill="currentColor" />
                          <rect x="70" y="70" width="10" height="10" fill="currentColor" />
                        </svg>
                      </div>
                    </div>

                    {/* Metadata Specs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700 bg-white p-4 rounded-xl border border-gray-150">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">رقم اللوحة</span>
                        <span className="text-[#004d33] font-black text-sm">{inquiryResult.plateNum} {inquiryResult.plateCharAr}</span>
                        <span className="text-slate-400 font-mono text-[10px] block mt-0.5">{inquiryResult.plateNum} {inquiryResult.plateCharEn}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ الفحص الفني</span>
                        <span className="font-mono text-slate-800">{inquiryResult.issueDate} م</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ نهاية الوثيقة</span>
                        <span className="font-mono text-rose-600 font-black">{inquiryResult.expiryDate} م</span>
                      </div>
                      <div className="sm:col-span-3 border-t border-dashed border-slate-100 pt-3 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">المركبة والموديل</span>
                          <span className="text-slate-800 font-black">{inquiryResult.vehicleModel} ({inquiryResult.vehicleYear})</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">مركز وعنوان الفحص</span>
                          <span className="text-slate-800 font-black">{inquiryResult.center}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inspection Checklist Table */}
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-150 text-xs">
                      <h4 className="font-black text-slate-800 border-b border-slate-50 pb-2 mb-2">تقرير الفحص الفني التفصيلي</h4>
                      <div className="space-y-2.5">
                        {inquiryResult.tests.map((test: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-600">{test.name}</span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">مجتاز (PASS)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setInquiryResult(null);
                          setInquiryPlateNum('');
                          setInquiryPlateCharAr('');
                          setInquiryPlateCharEn('');
                          setInquiryChassis('');
                          setInquirySerial('');
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-lg transition-all border border-slate-200 cursor-pointer"
                      >
                        استعلام عن مركبة أخرى
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-[#004d33] hover:bg-[#003422] text-white text-xs font-black rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        طباعة مستند الفحص المعتمد
                      </button>
                    </div>

                  </motion.div>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 3. WHEN VEHICLE SHOULD BE INSPECTED */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-12">
          
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">متى يجب فحص المركبة؟</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">الحالات والاشتراطات التي تتطلب إخضاع المركبة للفحص الدوري للتأكد من سلامتها</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            
            {/* Box 1 */}
            <div className="flex flex-col items-center text-center p-6 space-y-4 bg-gray-50/50 rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 text-[#004d33]">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">المركبات الخاصة</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                خلال ١٥ يوماً من تاريخ شراء السيارة، أو في حال مضى ٣ سنوات من تاريخ أول رخصة سير، أو عند الرغبة في تجديد استمارة المركبة.
              </p>
            </div>

            {/* Box 2 */}
            <div className="flex flex-col items-center text-center p-6 space-y-4 bg-gray-50/50 rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 text-[#004d33]">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">عند نقل ملكية المركبة</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                في حال رغبة المستفيد في نقل ملكية المركبة لمالك آخر، يجب فحصها أولاً واعتماد فحصها الفني للتأكد من أمانها وسلامتها قبل النقل.
              </p>
            </div>

            {/* Box 3 */}
            <div className="flex flex-col items-center text-center p-6 space-y-4 bg-gray-50/50 rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 text-[#004d33]">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">بشكل دوري ومستمر</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                يجب فحص السيارة بصفة سنوية منتظمة للتأكد التام من خلوها من أي عيوب فنية طارئة قد تهدد حياة السائق ومستعملي الطريق.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. PLATFORM SERVICES GRID */}
      <section className="py-16 bg-gray-50/30 border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">خدمات منصة الفحص الفني الدوري</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">حزمة متكاملة من الخدمات الرقمية لتمكين ملاك المركبات من إتمام الفحص بسلاسة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            
            {/* Card 1 */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-right space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#004d33]/5 text-[#004d33] flex items-center justify-center border border-[#004d33]/10">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-800">تحصيل وثيقة الفحص</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تمكن الأفراد والشركات من الاستعلام الفوري والحصول على مستند وثيقة الفحص الفني الدوري الرقمية المعتمدة لتقديمها للجهات المعنية.
                </p>
              </div>
              <button
                onClick={() => handleStartService('srv-3')}
                className="w-full py-3 rounded-xl bg-[#004d33]/5 hover:bg-[#004d33] text-[#004d33] hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>بدء الخدمة</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-right space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#004d33]/5 text-[#004d33] flex items-center justify-center border border-[#004d33]/10">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-800">الاستعلام عن حالة الفحص</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  بوابة استعلامية مرنة تتيح لملاك المركبات معرفة حالة ومدة صلاحية الفحص الفني لمركباتهم باستخدام رقم اللوحة أو الرقم التسلسلي.
                </p>
              </div>
              <button
                onClick={() => handleStartService('srv-5')}
                className="w-full py-3 rounded-xl bg-[#004d33]/5 hover:bg-[#004d33] text-[#004d33] hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>بدء الخدمة</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-right space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#004d33]/5 text-[#004d33] flex items-center justify-center border border-[#004d33]/10">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-800">حجز موعد الفحص</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تسمح للمستفيد بحجز موعد وتاريخ محددين في أقرب مركز للفحص المعتمد لضمان إتمام الخدمة دون انتظار طويل وتفادي الازدحام.
                </p>
              </div>
              <button
                onClick={() => handleStartService('srv-1')}
                className="w-full py-3 rounded-xl bg-[#004d33] hover:bg-[#003422] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>حجز موعداً</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

          </div>

          {/* Bottom Action Section */}
          <div className="text-center pt-6">
            <button
              onClick={() => handleStartService('srv-1')}
              className="px-10 py-4 rounded-xl bg-[#004d33] hover:bg-[#003422] text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-950/25 transition-all cursor-pointer"
            >
              حجز موعد الفحص الفني
            </button>
          </div>

        </div>
      </section>

      {/* 5. STEPS BEFORE PERIODIC INSPECTION */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">خطوات ما قبل الفحص الفني الدوري</h2>
            <p className="text-sm text-slate-400">اتبع هذه الخطوات البسيطة لضمان مراجعة سريعة واعتماد فوري في مركز الفحص</p>
          </div>

          <div className="relative pt-4 text-right">
            {/* Timeline Vertical line */}
            <div className="absolute right-6 top-10 bottom-10 w-0.5 bg-[#004d33]/20" />

            <div className="space-y-10 relative">
              
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-[#004d33] text-white flex items-center justify-center shrink-0 z-10 font-bold text-lg font-mono">
                  ١
                </div>
                <div className="space-y-1 bg-gray-50/70 border border-gray-100 p-5 rounded-2xl flex-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-800">حجز موعد إلكتروني مسبق</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                    قم بزيارة المنصة وتحديد نوع الفحص وتفاصيل المركبة والمركز المناسب واختيار الوقت والتاريخ من الأوقات الشاغرة المعتمدة.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-[#004d33] text-white flex items-center justify-center shrink-0 z-10 font-bold text-lg font-mono">
                  ٢
                </div>
                <div className="space-y-1 bg-gray-50/70 border border-gray-100 p-5 rounded-2xl flex-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-800">سداد رسوم وتكاليف الخدمة</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                    تسديد قيمة الفحص من خلال بوابة السداد الإلكتروني الموحدة المرتبطة بالنفاذ الوطني لضمان سرعة إنجاز فحصك فور وصولك للمركز.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-[#004d33] text-white flex items-center justify-center shrink-0 z-10 font-bold text-lg font-mono">
                  ٣
                </div>
                <div className="space-y-1 bg-gray-50/70 border border-gray-100 p-5 rounded-2xl flex-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-800">فحص وتدقيق سلامة المركبة</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                    اصطحاب المركبة لمركز الفحص في الموعد المحدد ليقوم الفاحصون المعتمدون بالكشف عليها وإصدار وثيقة الفحص والاعتماد الفوري.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 6. APPROVED ENTITIES (LOGOS) */}
      <section className="py-12 bg-gray-50/50 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-8">
          <p className="text-xs sm:text-sm text-slate-400 font-extrabold tracking-wider uppercase">الجهات المرخصة والمؤسسات الشريكة للمنصة</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center justify-items-center opacity-60">
            <div className="flex items-center gap-2 font-black text-slate-700 font-sans text-xs sm:text-sm bg-white border border-gray-100 shadow-sm px-6 py-4 rounded-2xl w-full max-w-[200px] justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>وزارة الداخلية</span>
            </div>
            <div className="flex items-center gap-2 font-black text-slate-700 font-sans text-xs sm:text-sm bg-white border border-gray-100 shadow-sm px-6 py-4 rounded-2xl w-full max-w-[200px] justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>الأمن العام - المرور</span>
            </div>
            <div className="flex items-center gap-2 font-black text-slate-700 font-sans text-xs sm:text-sm bg-white border border-gray-100 shadow-sm px-6 py-4 rounded-2xl w-full max-w-[200px] justify-center">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>هيئة المواصفات</span>
            </div>
            <div className="flex items-center gap-2 font-black text-slate-700 font-sans text-xs sm:text-sm bg-white border border-gray-100 shadow-sm px-6 py-4 rounded-2xl w-full max-w-[200px] justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>مركز سلامة الموحد</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. APP DOWNLOAD PROMO SECTION */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="bg-[#004d33]/5 rounded-3xl border border-[#004d33]/10 p-8 lg:p-12 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Column: Text promo */}
              <div className="space-y-6 text-right">
                <span className="inline-block text-[10px] font-black bg-[#004d33]/10 text-[#004d33] px-3 py-1 rounded-full uppercase">تطبيق الأجهزة الذكية</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">احجز موعد الفحص الدوري لسيارتك من جوالك بكل سهولة</h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                  قم بتحميل تطبيق سلامة لخدمات المركبات لحجز فحص مركبتك بلمسات سريعة. تتبع صلاحية فحصك الفني، وتصفح مواقع وعناوين جميع مراكز الفحص المعتمدة الأقرب إليك، وتلقى تنبيهات دورية ذكية.
                </p>

                {/* Download links */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="#download"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-black hover:bg-zinc-900 text-white transition-all shadow-md cursor-pointer"
                  >
                    <Smartphone className="w-5 h-5" />
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-400 font-semibold leading-none">Download on the</p>
                      <p className="text-xs font-bold font-sans mt-0.5 leading-none">App Store</p>
                    </div>
                  </a>
                  <a
                    href="#download"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#004d33] hover:bg-[#003422] text-white transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <div className="text-right">
                      <p className="text-[9px] text-emerald-200 font-semibold leading-none">Get it on</p>
                      <p className="text-xs font-bold font-sans mt-0.5 leading-none">Google Play</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Right Column: Simulated Mobile Mockup from image */}
              <div className="flex justify-center relative">
                {/* Visual smartphone container styled beautifully to match image */}
                <div className="relative w-full max-w-[280px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-slate-800" />
                  </div>
                  
                  <div className="bg-white rounded-[32px] overflow-hidden border border-slate-950 text-right font-sans relative z-10 h-[460px] flex flex-col justify-between">
                    {/* Phone header */}
                    <div className="bg-[#004d33] text-white p-4 pt-8 text-center space-y-1">
                      <h4 className="text-[10px] font-black tracking-tight">المنصة الموحدة للفحص</h4>
                      <p className="text-[8px] text-emerald-100 font-medium">بوابة حجز ومتابعة وفحص المركبات</p>
                    </div>

                    {/* Phone Body with simulated checkout view */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="border border-emerald-100 bg-emerald-50/50 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] font-bold text-emerald-800">حجز موعد متاح فوري</p>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">الرياض - طريق الميناء الرئيسي</span>
                        </div>

                        <div className="space-y-2">
                          <div className="h-6 rounded bg-gray-100 w-full animate-pulse" />
                          <div className="h-6 rounded bg-gray-100 w-3/4 animate-pulse" />
                          <div className="h-6 rounded bg-gray-100 w-1/2 animate-pulse" />
                        </div>
                      </div>

                      {/* Phone checkout button */}
                      <div className="space-y-2">
                        <div className="py-2 rounded-lg bg-[#004d33] text-white text-[10px] font-extrabold text-center">
                          تأكيد الحجز ومطابقة نفاذ
                        </div>
                        <p className="text-[7px] text-slate-400 text-center">اتصال آمن ببروتوكولات التوثيق الموحد</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">الأسئلة الشائعة</h2>
            <p className="text-sm text-slate-400">الأسئلة والحلول الأكثر انتشاراً واستعلاماً بين مستخدمي منصة سلامة</p>
          </div>

          <div className="space-y-4 pt-4">
            
            {/* FAQ 1 */}
            <div className="border border-gray-200/80 rounded-2xl bg-gray-50/30 overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(0)}
                className="w-full flex items-center justify-between p-5 text-right font-bold text-slate-800 hover:bg-gray-50"
              >
                <span className="text-xs sm:text-sm">متى خدمة حجز مواعيد الفحص الفني الدوري؟</span>
                {openFaq === 0 ? <ChevronUp className="w-4 h-4 text-[#004d33]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {openFaq === 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 border-t border-gray-100 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                      تختلف رسوم الفحص حسب نوع وحجم المركبة والخدمة المرغوبة؛ تبلغ قيمة الفحص الدوري للمركبة الصغيرة العادية ١٥٠ ريالاً سعودياً، وتكلفة إعادة الفحص هي ٥٠ ريالاً، وهي شاملة لكافة الضرائب والرسوم الحكومية المقررة.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 2 */}
            <div className="border border-gray-200/80 rounded-2xl bg-gray-50/30 overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(1)}
                className="w-full flex items-center justify-between p-5 text-right font-bold text-slate-800 hover:bg-gray-50"
              >
                <span className="text-xs sm:text-sm">هل يمكن تعديل موعد حجز الفحص الفني الدوري؟</span>
                {openFaq === 1 ? <ChevronUp className="w-4 h-4 text-[#004d33]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {openFaq === 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 border-t border-gray-100 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                      نعم، بكل تأكيد. تتيح لك المنصة إمكانية تعديل تاريخ أو ساعة موعد الفحص أو إلغاء الموعد نهائياً بشكل مجاني بالكامل قبل الموعد الفعلي بـ ٢٤ ساعة على الأقل من خلال لوحة التحكم بالموعد.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 3 */}
            <div className="border border-gray-200/80 rounded-2xl bg-gray-50/30 overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(2)}
                className="w-full flex items-center justify-between p-5 text-right font-bold text-slate-800 hover:bg-gray-50"
              >
                <span className="text-xs sm:text-sm">نسيت وثيقة الفحص، كيف استعلم عن معلومات الفحص ورقم لوحة سيارتي؟</span>
                {openFaq === 2 ? <ChevronUp className="w-4 h-4 text-[#004d33]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {openFaq === 2 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 border-t border-gray-100 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                      يمكنك الاستعلام والتحقق الرقمي الفوري من سريان وصلاحية وثيقة فحص مركبتك باستخدام رقم اللوحة أو الرقم التسلسلي للمركبة عبر بوابة "الاستعلام عن حالة الفحص" وسيقوم النظام بسحب وعرض وثيقتك الرسمية.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 4 */}
            <div className="border border-gray-200/80 rounded-2xl bg-gray-50/30 overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(3)}
                className="w-full flex items-center justify-between p-5 text-right font-bold text-slate-800 hover:bg-gray-50"
              >
                <span className="text-xs sm:text-sm">ما هي الهيئات والجهات البرمجية الشريكة لمطابقة وثيقة الفحص الفني للمركبة؟</span>
                {openFaq === 3 ? <ChevronUp className="w-4 h-4 text-[#004d33]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {openFaq === 3 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 border-t border-gray-100 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                      جميع عمليات ومراكز الفحص الفني تعمل بترخيص وامتثال مباشر لاشتراطات ومعايير الهيئة السعودية للمواصفات والمقاييس والجودة (SASO)، وبالربط التقني المباشر مع المديرية العامة للمرور ونظام أبشر لضمان المطابقة الكاملة.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </section>

      {/* 9. DEEP GREEN FOOTER */}
      <footer className="bg-[#003422] text-white py-12 border-t border-emerald-950 text-right font-sans">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-emerald-900">
            
            {/* Column 1: Salamh Logo & desc */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-6 h-6 text-[#004d33]" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">سلامة لفحص المركبات</h3>
                  <p className="text-[10px] text-emerald-300 font-bold">بوابة الدفع الإلكتروني الموحدة</p>
                </div>
              </div>
              <p className="text-xs text-emerald-100/70 leading-relaxed font-medium">
                المنصة الرقمية الموحدة لتنظيم وإدارة وحجز مواعيد الفحص الفني الدوري للمركبات لرفع مستويات السلامة والحد من الحوادث المرورية بالمملكة.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">الخدمات الأساسية</h4>
              <ul className="space-y-2 text-xs text-emerald-100/70 font-semibold">
                <li><button onClick={() => handleStartService('srv-1')} className="hover:text-white transition">حجز موعد فحص فوري</button></li>
                <li><button onClick={() => handleStartService('srv-3')} className="hover:text-white transition">تحصيل وطباعة الوثائق</button></li>
                <li><button onClick={() => handleStartService('srv-5')} className="hover:text-white transition">الاستعلام الرقمي للمركبة</button></li>
                <li><button onClick={() => handleStartService('srv-2')} className="hover:text-white transition">إعادة الفحص المعتمد</button></li>
              </ul>
            </div>

            {/* Column 3: Contact & Support */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans">الدعم والتواصل</h4>
              <ul className="space-y-2 text-xs text-emerald-100/70 font-semibold font-sans">
                <li>الرقم الموحد للدعم: 920033033</li>
                <li>البريد الإلكتروني: support@salamah.gov.sa</li>
                <li>ساعات العمل: الأحد - الخميس من ٨ ص حتى ٥ م</li>
                <li>المركز الرئيسي: مدينة الرياض، طريق العليا</li>
              </ul>
            </div>

            {/* Column 4: App Store Promotion */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">تنزيل تطبيق سلامة</h4>
              <p className="text-xs text-emerald-100/70 font-medium">احجز موعدك وتابع حالة فحص سيارتك من أي مكان وفي أي وقت.</p>
              
              <div className="flex gap-2 shrink-0 scale-90 origin-right">
                <a href="#download" className="bg-black/40 border border-emerald-950 hover:bg-black/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-white" />
                  <div className="text-right">
                    <p className="text-[7px] text-zinc-400 font-semibold leading-none">App Store</p>
                    <p className="text-[10px] text-white font-bold font-sans mt-0.5 leading-none">Download</p>
                  </div>
                </a>
                <a href="#download" className="bg-[#004d33]/50 border border-emerald-900 hover:bg-[#004d33]/70 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-white" />
                  <div className="text-right">
                    <p className="text-[7px] text-emerald-200 font-semibold leading-none">Google Play</p>
                    <p className="text-[10px] text-white font-bold font-sans mt-0.5 leading-none">Get it now</p>
                  </div>
                </a>
              </div>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-emerald-200/50 font-sans">
            <p className="font-semibold">© 2026 سلامة لسلامة المركبات. جميع الحقوق والمواصفات محفوظة للمنصة.</p>
            <div className="flex space-x-4 space-x-reverse font-semibold">
              <span className="hover:text-white cursor-pointer">سياسة الخصوصية</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">شروط الاستخدام</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">اتفاقية مستوى الخدمة</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
