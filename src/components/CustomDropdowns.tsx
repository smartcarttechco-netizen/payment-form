import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Calendar as CalendarIcon, Check, MapPin } from 'lucide-react';

export interface VehicleTypeOption {
  id: string;
  name: string;
  svgIcon: React.ReactNode;
}

// Custom precise vector SVGs for all 19 vehicle types from the screenshot
export const VEHICLE_TYPES: VehicleTypeOption[] = [
  {
    id: 'private_car',
    name: 'سيارة خاصة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
        <path d="M13 17H9" />
      </svg>
    )
  },
  {
    id: 'private_light_transport',
    name: 'مركبة نقل خفيفة خاصة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 .5-.8l3-2A1 1 0 0 1 6 10h5a1 1 0 0 1 1 1v7" />
        <path d="M12 13h10v4a1 1 0 0 1-1 1h-9" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    )
  },
  {
    id: 'heavy_transport',
    name: 'نقل ثقيل',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 18H2V6h8v12z" />
        <path d="M10 10h10v8H10V10z" />
        <path d="M20 12h2a2 2 0 0 1 2 2v4h-4v-6z" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="14" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    )
  },
  {
    id: 'light_bus',
    name: 'حافلة خفيفة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 18v2" />
        <path d="M18 18v2" />
        <path d="M2 13h20" />
        <path d="M6 6v7" />
        <path d="M12 6v7" />
        <path d="M18 6v7" />
      </svg>
    )
  },
  {
    id: 'light_transport',
    name: 'مركبة نقل خفيفة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 18H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 .5-.8l3-2A1 1 0 0 1 6 10h4a1 1 0 0 1 1 1v7" />
        <path d="M11 14h11v3a1 1 0 0 1-1 1H11" />
        <circle cx="5" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    )
  },
  {
    id: 'large_bus',
    name: 'حافلة كبيرة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="5" width="22" height="13" rx="3" />
        <path d="M4 18v2" />
        <path d="M20 18v2" />
        <path d="M1 11h22" />
        <circle cx="6" cy="11" r="1" />
        <circle cx="12" cy="11" r="1" />
        <circle cx="18" cy="11" r="1" />
      </svg>
    )
  },
  {
    id: 'medium_transport',
    name: 'نقل متوسط',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18H2V8h12v10z" />
        <path d="M14 12h8v6h-8" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    )
  },
  {
    id: 'two_wheeler',
    name: 'الدراجات ثنائية العجلات',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="15" r="3" />
        <circle cx="19" cy="15" r="3" />
        <path d="M12 15V9" />
        <path d="M12 9H7" />
        <path d="M12 9l5-4" />
        <path d="M19 12v-3" />
      </svg>
    )
  },
  {
    id: 'public_works',
    name: 'مركبات أشغال عامة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
        <path d="M7 14v4" />
        <path d="M17 14v4" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 9V6" />
      </svg>
    )
  },
  {
    id: 'three_four_wheeler',
    name: 'دراجة ثلاثية او رباعية العجلات',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="16" r="2.5" />
        <circle cx="18" cy="16" r="2.5" />
        <circle cx="12" cy="10" r="2" />
        <path d="M6 16h12" />
        <path d="M12 10l-6 6" />
        <path d="M12 10l6 6" />
      </svg>
    )
  },
  {
    id: 'heavy_trailer',
    name: 'مقطورة ثقيلة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 14h14V6H2v8z" />
        <path d="M16 12h6" />
        <circle cx="6" cy="16" r="2" />
        <circle cx="12" cy="16" r="2" />
        <circle cx="18" cy="16" r="2" />
      </svg>
    )
  },
  {
    id: 'taxi',
    name: 'سيارات الأجرة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    )
  },
  {
    id: 'rental',
    name: 'سيارات التأجير',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <path d="M12 12a3 3 0 1 0-3-3" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    )
  },
  {
    id: 'medium_bus',
    name: 'حافلة متوسطة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="13" rx="2" />
        <path d="M5 18v2" />
        <path d="M19 18v2" />
        <circle cx="6" cy="10" r="1.5" />
        <circle cx="18" cy="10" r="1.5" />
      </svg>
    )
  },
  {
    id: 'heavy_semi_trailer',
    name: 'نصف مقطورة ثقيلة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13h12V6H2v7z" />
        <path d="M14 11h8" />
        <circle cx="6" cy="15" r="2" />
        <circle cx="12" cy="15" r="2" />
      </svg>
    )
  },
  {
    id: 'light_trailer',
    name: 'مقطورة خفيفة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13h10V7H3v6z" />
        <path d="M13 11h5" />
        <circle cx="5" cy="15" r="1.5" />
        <circle cx="11" cy="15" r="1.5" />
      </svg>
    )
  },
  {
    id: 'light_semi_trailer',
    name: 'نصف مقطورة خفيفة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h10V6H4v6z" />
        <path d="M14 10h6" />
        <circle cx="6" cy="14" r="1.5" />
        <circle cx="12" cy="14" r="1.5" />
      </svg>
    )
  },
  {
    id: 'private_light_semi_trailer',
    name: 'نصف مقطورة خفيفة خاصة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h10V6H4v6z" />
        <path d="M14 10h6" />
        <circle cx="9" cy="14" r="1.5" />
      </svg>
    )
  },
  {
    id: 'private_light_trailer',
    name: 'مقطورة خفيفة خاصة',
    svgIcon: (
      <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13h10V7H3v6z" />
        <path d="M13 11h5" />
        <circle cx="8" cy="15" r="1.5" />
      </svg>
    )
  }
];

interface CustomSelectProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}

// 1. Vehicle Type Dropdown mimicking the exact dropdown view
export const VehicleTypeDropdown: React.FC<CustomSelectProps> = ({ value, onChange, label, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = VEHICLE_TYPES.find(v => v.id === value || v.name === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative text-right ${isOpen ? 'z-40' : 'z-10'}`} ref={dropdownRef}>
      <label className="block text-xs font-bold text-slate-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white px-4 py-3.5 text-xs font-black text-slate-800 focus:border-[#004d33] focus:outline-none transition-all cursor-pointer shadow-sm"
      >
        <span className="text-slate-400">
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
        <div className="flex items-center gap-2">
          {selectedItem ? (
            <>
              <span className="text-slate-800 font-extrabold">{selectedItem.name}</span>
              <span className="opacity-80 shrink-0">{selectedItem.svgIcon}</span>
            </>
          ) : (
            <span className="text-slate-400 font-bold">{placeholder}</span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 mt-2 w-full max-w-sm left-0 right-0 md:left-auto bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 text-right">
              <span className="text-xs font-black text-slate-500">نوع المركبة</span>
            </div>

            {/* Scrollable list */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
              {VEHICLE_TYPES.map(type => {
                const isSel = value === type.id || value === type.name;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      onChange(type.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 text-right text-xs font-extrabold transition-all hover:bg-slate-50 ${isSel ? 'bg-emerald-50/40 text-[#004d33]' : 'text-slate-700'}`}
                  >
                    <div className="flex items-center gap-2">
                      {isSel && <Check className="w-4 h-4 text-[#004d33]" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{type.name}</span>
                      <div className="p-1 rounded bg-slate-50 border border-slate-100 shrink-0">
                        {type.svgIcon}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 2. Custom June 2026 Calendar Picker matching screenshot exactly
export const CalendarPicker: React.FC<CustomSelectProps> = ({ value, onChange, label, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [tempSelectedDate, setTempSelectedDate] = useState('2026-06-23');
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonthName, setCurrentMonthName] = useState('يونيو'); // June
  const dropdownRef = useRef<HTMLDivElement>(null);

  // June 2026 calendar days mapping exactly to the screenshot
  const daysInJune = [
    { day: null, date: '' },
    { day: null, date: '' },
    { day: 1, date: '2026-06-01' },
    { day: 2, date: '2026-06-02' },
    { day: 3, date: '2026-06-03' },
    { day: 4, date: '2026-06-04' },
    { day: 5, date: '2026-06-05' },
    { day: 6, date: '2026-06-06' },
    { day: 7, date: '2026-06-07' },
    { day: 8, date: '2026-06-08' },
    { day: 9, date: '2026-06-09' },
    { day: 10, date: '2026-06-10' },
    { day: 11, date: '2026-06-11' },
    { day: 12, date: '2026-06-12' },
    { day: 13, date: '2026-06-13' },
    { day: 14, date: '2026-06-14' },
    { day: 15, date: '2026-06-15' },
    { day: 16, date: '2026-06-16' },
    { day: 17, date: '2026-06-17' },
    { day: 18, date: '2026-06-18' },
    { day: 19, date: '2026-06-19' },
    { day: 20, date: '2026-06-20' },
    { day: 21, date: '2026-06-21' },
    { day: 22, date: '2026-06-22' },
    { day: 23, date: '2026-06-23' }, // Default selected in screenshot
    { day: 24, date: '2026-06-24' },
    { day: 25, date: '2026-06-25' },
    { day: 26, date: '2026-06-26' },
    { day: 27, date: '2026-06-27' },
    { day: 28, date: '2026-06-28' },
    { day: 29, date: '2026-06-29' },
    { day: 30, date: '2026-06-30' }
  ];

  const timeSlots = [
    '7:00 صباحاً', '7:30 صباحاً', '8:00 صباحاً', '8:30 صباحاً',
    '9:00 صباحاً', '9:30 صباحاً', '10:00 صباحاً', '10:30 صباحاً',
    '11:00 صباحاً', '11:30 صباحاً', '1:00 مساءً', '1:30 مساءً',
    '2:00 مساءً', '2:30 مساءً', '3:00 مساءً', '3:30 مساءً',
    '4:00 مساءً', '4:30 مساءً'
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When value changes from outside, parse date if possible
  useEffect(() => {
    if (value) {
      const parts = value.split(' ');
      if (parts[0]) {
        setTempSelectedDate(parts[0]);
      }
    }
  }, [value]);

  const handleSelectDate = (dateStr: string) => {
    setTempSelectedDate(dateStr);
    setStep('time');
  };

  const handleSelectTime = (timeStr: string) => {
    onChange(`${tempSelectedDate} ${timeStr}`);
    setIsOpen(false);
  };

  const formatArabicDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const day = parseInt(parts[2], 10);
    return `${day} يونيو ٢٠٢٦`;
  };

  const formattedDisplay = value ? value : placeholder;

  return (
    <div className={`relative text-right ${isOpen ? 'z-40' : 'z-10'}`} ref={dropdownRef}>
      <label className="block text-xs font-bold text-slate-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setStep('date'); // Always start with date step when reopened
        }}
        className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white px-4 py-3.5 text-xs font-black text-slate-800 focus:border-[#004d33] focus:outline-none transition-all cursor-pointer shadow-sm"
      >
        <CalendarIcon className="w-4 h-4 text-slate-400" />
        <span className="text-slate-800 font-extrabold">{formattedDisplay}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="absolute z-50 mt-2 w-80 right-0 left-auto bg-white rounded-3xl border border-gray-150 shadow-2xl p-4 text-center select-none"
          >
            {step === 'date' ? (
              <>
                {/* Header: Month and Year selection */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <button type="button" className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1">
                    &lt;
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-slate-800">{currentMonthName}</span>
                    <span className="text-xs font-black text-slate-800">{currentYear}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <button type="button" className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1">
                    &gt;
                  </button>
                </div>

                {/* Weekdays row: س ح ن ث ر خ ج */}
                <div className="grid grid-cols-7 gap-1 text-[11px] font-black text-slate-400 mb-2">
                  <span>س</span>
                  <span>ح</span>
                  <span>ن</span>
                  <span>ث</span>
                  <span>ر</span>
                  <span>خ</span>
                  <span>ج</span>
                </div>

                {/* Month days grid */}
                <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
                  {daysInJune.map((d, index) => {
                    if (d.day === null) {
                      return <div key={`empty-${index}`} className="w-8 h-8" />;
                    }

                    const isCurrentSel = tempSelectedDate === d.date;
                    // Default highlight day 23 if tempSelectedDate is not set
                    const isHighlighted = isCurrentSel || (!tempSelectedDate && d.day === 23);

                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => handleSelectDate(d.date)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isHighlighted 
                            ? 'bg-[#004d33] text-white shadow-md shadow-emerald-950/20 font-black' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {d.day}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-right">
                {/* Time picker header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <span className="text-xs font-black text-slate-800">
                    اختر الوقت ليوم: <span className="text-[#004d33]">{formatArabicDate(tempSelectedDate)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('date')}
                    className="text-xs font-extrabold text-[#004d33] hover:underline transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>تعديل التاريخ</span>
                    <span>←</span>
                  </button>
                </div>

                {/* Time slots grid */}
                <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
                  {timeSlots.map((time) => {
                    const isCurrentTimeSel = value && value.includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleSelectTime(time)}
                        className={`py-2 px-1 text-[11px] font-black rounded-xl border text-center transition-all cursor-pointer ${
                          isCurrentTimeSel
                            ? 'bg-[#004d33] border-[#004d33] text-white shadow-md'
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 text-slate-700'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
