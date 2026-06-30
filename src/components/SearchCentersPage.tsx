import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getNextPagePath } from '../lib/flow';
import { motion, AnimatePresence } from 'motion/react';
import { VehicleTypeDropdown, CalendarPicker, VEHICLE_TYPES } from './CustomDropdowns';
import { 
  ChevronDown, 
  Search, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  SlidersHorizontal,
  Calendar,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Award,
  X,
  CheckCircle2,
  Loader2,
  Locate
} from 'lucide-react';

interface InspectionCenter {
  id: string;
  name: string;
  region: string;
  authorizedEntity: string;
  workingHours: string;
  logoType: 'aman' | 'applus' | 'takamol' | 'massar';
}

const ALL_CENTERS: InspectionCenter[] = [
  {
    id: 'ctr-makkah-1',
    name: 'مكة المكرمة - الشرائع',
    region: 'makkah',
    authorizedEntity: 'الجهة المرخصة / أمان - الفحص الفني الدوري للسيارات',
    workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً',
    logoType: 'aman'
  },
  {
    id: 'ctr-khurmah',
    name: 'الخرمة',
    region: 'makkah',
    authorizedEntity: 'الجهة المرخصة / شركة مسار المتحدة (Massar United Co.)',
    workingHours: 'من 7:00 صباحاً إلى 8:00 مساءً',
    logoType: 'massar'
  },
  {
    id: 'ctr-jeddah-2',
    name: 'جدة - حي النزهة',
    region: 'makkah',
    authorizedEntity: 'الجهة المرخصة / تكامل لخدمات النقل (Takamol)',
    workingHours: 'من 12:05 صباحاً إلى 11:30 مساءً',
    logoType: 'takamol'
  },
  {
    id: 'ctr-jeddah-1',
    name: 'جدة - طريق مكة السريع',
    region: 'makkah',
    authorizedEntity: 'الجهة المرخصة / أمان - الفحص الفني الدوري للسيارات',
    workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً',
    logoType: 'aman'
  },
  {
    id: 'ctr-east-taif',
    name: 'شرق الطائف',
    region: 'makkah',
    authorizedEntity: 'الجهة المرخصة / تكامل لخدمات النقل (Takamol)',
    workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً',
    logoType: 'takamol'
  },
  {
    id: 'ctr-qunfudhah',
    name: 'القنفذة الموحد',
    region: 'makkah',
    authorizedEntity: 'الجهة المرخصة / Applus+ Vehicle Inspection (أبليس العربية)',
    workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً',
    logoType: 'applus'
  },
  {
    id: 'ctr-jeddah-asfan',
    name: 'جدة - عسفان الفرع الذكي',
    region: 'makkah',
    authorizedEntity: 'الجهة المرخصة / شركة مسار المتحدة (Massar United Co.)',
    workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً',
    logoType: 'massar'
  },
  {
    id: 'ctr-taif',
    name: 'الطائف - الحوية',
    region: 'makkah',
    authorizedEntity: 'الجهة المرخصة / Applus+ Vehicle Inspection (أبليس العربية)',
    workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً',
    logoType: 'applus'
  },
  // Additional simulated centers for filtering
  {
    id: 'ctr-riyadh-1',
    name: 'الرياض مخرج ١٨',
    region: 'riyadh',
    authorizedEntity: 'الجهة المرخصة / أمان - الفحص الفني الدوري للسيارات',
    workingHours: 'من 08:00 صباحاً إلى 11:00 مساءً',
    logoType: 'aman'
  },
  {
    id: 'ctr-riyadh-main',
    name: 'الرياض مخرج ١٧ الرئيسي',
    region: 'riyadh',
    authorizedEntity: 'الجهة المرخصة / تكامل لخدمات النقل (Takamol)',
    workingHours: 'من 24 ساعة خدمة مستمرة',
    logoType: 'takamol'
  },
  {
    id: 'ctr-riyadh-north',
    name: 'شمال الرياض الموحد',
    region: 'riyadh',
    authorizedEntity: 'الجهة المرخصة / شركة مسار المتحدة (Massar United Co.)',
    workingHours: 'من 08:00 صباحاً إلى 10:00 مساءً',
    logoType: 'massar'
  },
  {
    id: 'ctr-riyadh-west',
    name: 'غرب الرياض - الدائري',
    region: 'riyadh',
    authorizedEntity: 'الجهة المرخصة / Applus+ Vehicle Inspection (أبليس العربية)',
    workingHours: 'من 07:00 صباحاً إلى 09:00 مساءً',
    logoType: 'applus'
  },
  {
    id: 'ctr-dammam-1',
    name: 'الدمام طريق الجبيل',
    region: 'eastern',
    authorizedEntity: 'الجهة المرخصة / أمان - الفحص الفني الدوري للسيارات',
    workingHours: 'من 07:30 صباحاً إلى 09:30 مساءً',
    logoType: 'aman'
  },
  {
    id: 'ctr-khobar',
    name: 'الخبر الموحد',
    region: 'eastern',
    authorizedEntity: 'الجهة المرخصة / Applus+ Vehicle Inspection (أبليس العربية)',
    workingHours: 'من 08:00 صباحاً إلى 10:00 مساءً',
    logoType: 'applus'
  },
  {
    id: 'ctr-jubail',
    name: 'الجبيل الصناعية',
    region: 'eastern',
    authorizedEntity: 'الجهة المرخصة / شركة مسار المتحدة (Massar United Co.)',
    workingHours: 'من 08:00 صباحاً إلى 09:00 مساءً',
    logoType: 'massar'
  },
  {
    id: 'ctr-ahsa',
    name: 'الأحساء الهفوف',
    region: 'eastern',
    authorizedEntity: 'الجهة المرخصة / تكامل لخدمات النقل (Takamol)',
    workingHours: 'من 07:30 صباحاً إلى 08:30 مساءً',
    logoType: 'takamol'
  },
  {
    id: 'ctr-madinah-1',
    name: 'المدينة المنورة - الدائري الثاني',
    region: 'madinah',
    authorizedEntity: 'الجهة المرخصة / أمان - الفحص الفني الدوري للسيارات',
    workingHours: 'من 07:00 صباحاً إلى 11:00 مساءً',
    logoType: 'aman'
  },
  {
    id: 'ctr-buraidah-1',
    name: 'بريدة - طريق الملك عبدالعزيز',
    region: 'qassim',
    authorizedEntity: 'الجهة المرخصة / تكامل لخدمات النقل (Takamol)',
    workingHours: 'من 07:30 صباحاً إلى 10:30 مساءً',
    logoType: 'takamol'
  },
  {
    id: 'ctr-abha-1',
    name: 'أبها - طريق المحالة',
    region: 'asir',
    authorizedEntity: 'الجهة المرخصة / شركة مسار المتحدة (Massar United Co.)',
    workingHours: 'من 08:00 صباحاً إلى 09:00 مساءً',
    logoType: 'massar'
  },
  {
    id: 'ctr-tabuk-1',
    name: 'تبوك - المنطقة الصناعية',
    region: 'tabuk',
    authorizedEntity: 'الجهة المرخصة / Applus+ Vehicle Inspection (أبليس العربية)',
    workingHours: 'من 08:00 صباحاً إلى 08:00 مساءً',
    logoType: 'applus'
  },
  {
    id: 'ctr-hail-1',
    name: 'حائل - طريق المدينة المنورة',
    region: 'hail',
    authorizedEntity: 'الجهة المرخصة / أمان - الفحص الفني الدوري للسيارات',
    workingHours: 'من 07:30 صباحاً إلى 09:30 مساءً',
    logoType: 'aman'
  },
  {
    id: 'ctr-arar-1',
    name: 'عرعر - طريق طريف',
    region: 'northern_borders',
    authorizedEntity: 'الجهة المرخصة / شركة مسار المتحدة (Massar United Co.)',
    workingHours: 'من 08:00 صباحاً إلى 06:00 مساءً',
    logoType: 'massar'
  },
  {
    id: 'ctr-jazan-1',
    name: 'جازان - طريق الملك عبدالعزيز',
    region: 'jazan',
    authorizedEntity: 'الجهة المرخصة / تكامل لخدمات النقل (Takamol)',
    workingHours: 'من 07:00 صباحاً إلى 10:00 مساءً',
    logoType: 'takamol'
  },
  {
    id: 'ctr-najran-1',
    name: 'نجران - طريق الملك خالد',
    region: 'najran',
    authorizedEntity: 'الجهة المرخصة / Applus+ Vehicle Inspection (أبليس العربية)',
    workingHours: 'من 08:00 صباحاً إلى 08:00 مساءً',
    logoType: 'applus'
  },
  {
    id: 'ctr-baha-1',
    name: 'الباحة - طريق الملك فهد',
    region: 'baha',
    authorizedEntity: 'الجهة المرخصة / أمان - الفحص الفني الدوري للسيارات',
    workingHours: 'من 07:30 صباحاً إلى 09:30 مساءً',
    logoType: 'aman'
  },
  {
    id: 'ctr-sakaka-1',
    name: 'سكاكا - طريق الملك عبدالرحمن',
    region: 'jouf',
    authorizedEntity: 'الجهة المرخصة / شركة مسار المتحدة (Massar United Co.)',
    workingHours: 'من 08:00 صباحاً إلى 08:00 مساءً',
    logoType: 'massar'
  }
];

const REGIONS = [
  { id: 'makkah', name: 'منطقة مكة المكرمة', desc: 'المنطقة الغربية والمدن التابعة لها' },
  { id: 'riyadh', name: 'منطقة الرياض', desc: 'العاصمة والمنطقة الوسطى' },
  { id: 'eastern', name: 'المنطقة الشرقية', desc: 'الدمام، الخبر، والجبيل' },
  { id: 'madinah', name: 'منطقة المدينة المنورة', desc: 'المدينة المنورة وينبع' },
  { id: 'qassim', name: 'منطقة القصيم', desc: 'بريدة وعنيزة وضواحيها' },
  { id: 'asir', name: 'منطقة عسير', desc: 'أبها وخميس مشيط ومحايل' },
  { id: 'tabuk', name: 'منطقة تبوك', desc: 'تبوك وضواحيها والمحافظات' },
  { id: 'hail', name: 'منطقة حائل', desc: 'حائل والقرى المجاورة' },
  { id: 'northern_borders', name: 'منطقة الحدود الشمالية', desc: 'عرعر وطريف ورفحاء' },
  { id: 'jazan', name: 'منطقة جازان', desc: 'جازان ومحافظات القطاع الجنوبي' },
  { id: 'najran', name: 'منطقة نجران', desc: 'نجران وشرورة والأخدود' },
  { id: 'baha', name: 'منطقة الباحة', desc: 'الباحة والمخواة وبلجرشي' },
  { id: 'jouf', name: 'منطقة الجوف', desc: 'سكاكا ودومة الجندل والقريات' }
];

const RegionDropdown: React.FC<{
  value: string;
  onChange: (val: string) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = REGIONS.find(r => r.id === value);

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
        className="w-full flex items-center justify-between rounded-xl border border-gray-250 bg-gray-50 hover:bg-white px-4 py-3.5 text-xs font-black text-slate-800 focus:border-[#004d33] focus:outline-none transition-all cursor-pointer shadow-sm"
      >
        <MapPin className="w-4 h-4 text-slate-400" />
        <span className="flex-grow text-right mr-2">{selectedItem ? selectedItem.name : 'اختر المنطقة'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute z-50 mt-1 w-full bg-white rounded-2xl border border-gray-150 shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {REGIONS.map((region) => {
              const isSelected = region.id === value;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => {
                    onChange(region.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-right px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 border-b border-slate-50 last:border-b-0 ${
                    isSelected ? 'bg-emerald-50/50' : ''
                  }`}
                >
                  <span className={`text-xs ${isSelected ? 'font-black text-[#004d33]' : 'font-bold text-slate-800'}`}>
                    {region.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {region.desc}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EntityDropdown: React.FC<{
  value: string;
  onChange: (val: string) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const ENTITIES = [
    { id: 'all', name: 'الكل (جميع الجهات المرخصة)', desc: 'عرض كافة مراكز الفحص' },
    { id: 'aman', name: 'أمان - الفحص الدوري', desc: 'أمان - الفحص الفني الدوري للسيارات' },
    { id: 'takamol', name: 'تكامل لخدمات النقل', desc: 'تكامل لخدمات النقل (Takamol)' },
    { id: 'applus', name: 'أبليس العربية', desc: 'Applus+ Vehicle Inspection' },
    { id: 'massar', name: 'شركة مسار المتحدة', desc: 'شركة مسار المتحدة (Massar United Co.)' }
  ];

  const selectedItem = ENTITIES.find(e => e.id === value);

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
        className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 hover:bg-white px-4 py-3.5 text-xs font-black text-slate-800 focus:border-[#004d33] focus:outline-none transition-all cursor-pointer shadow-sm text-right"
      >
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-slate-800 font-extrabold">{selectedItem ? selectedItem.name : 'اختر الجهة المرخصة'}</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute z-50 mt-1 w-full bg-white rounded-2xl border border-gray-150 shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {ENTITIES.map((ent) => {
              const isSelected = ent.id === value;
              return (
                <button
                  key={ent.id}
                  type="button"
                  onClick={() => {
                    onChange(ent.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-right px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 border-b border-slate-50 last:border-b-0 ${
                    isSelected ? 'bg-emerald-50/50' : ''
                  }`}
                >
                  <span className={`text-xs ${isSelected ? 'font-black text-[#004d33]' : 'font-bold text-slate-800'}`}>
                    {ent.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {ent.desc}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SearchCentersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const passedState = location.state as { region?: string; vehicleType?: string; dateTime?: string } | null;

  // Filters state mapping exactly to Makkah in the screenshot, but empty by default
  const [selectedRegion, setSelectedRegion] = useState<string>(passedState?.region || '');
  const [vehicleType, setVehicleType] = useState<string>(passedState?.vehicleType || '');
  const [dateTimeStr, setDateTimeStr] = useState<string>(passedState?.dateTime || '');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [userSearched, setUserSearched] = useState<boolean>(!!(passedState?.region && passedState?.vehicleType && passedState?.dateTime));
  const [validationError, setValidationError] = useState<string>('');

  // Interactive Map additional state
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  // Custom unified card dropdown states
  const [cardRegionOpen, setCardRegionOpen] = useState(false);
  const [cardVehicleOpen, setCardVehicleOpen] = useState(false);
  const [cardEntityOpen, setCardEntityOpen] = useState(false);

  const cardRegionRef = useRef<HTMLDivElement>(null);
  const cardVehicleRef = useRef<HTMLDivElement>(null);
  const cardEntityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cardRegionRef.current && !cardRegionRef.current.contains(e.target as Node)) {
        setCardRegionOpen(false);
      }
      if (cardVehicleRef.current && !cardVehicleRef.current.contains(e.target as Node)) {
        setCardVehicleOpen(false);
      }
      if (cardEntityRef.current && !cardEntityRef.current.contains(e.target as Node)) {
        setCardEntityOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSimulateLocation = () => {
    setIsLocating(true);
    setLocationSuccess(null);
    setValidationError('');
    
    setTimeout(() => {
      setIsLocating(false);
      setSelectedRegion('riyadh');
      setLocationSuccess('تم تحديد موقعك بنجاح! تم تحديد منطقة الرياض كأقرب منطقة لموقعك الحالي.');
      setUserSearched(true);
      // clear success message after 5 seconds
      setTimeout(() => setLocationSuccess(null), 5000);
    }, 1200);
  };

  // Trigger loading animation on search query / filter changes
  const handleSearchTrigger = () => {
    if (!selectedRegion) {
      setValidationError('الرجاء اختيار منطقة فحص أولاً لتصفية المحطات المتاحة.');
      return;
    }
    setValidationError('');
    setIsSearching(true);
    setUserSearched(true);
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 450);
    return () => clearTimeout(timer);
  };

  // Run the loader when filters are updated
  useEffect(() => {
    if (userSearched && selectedRegion) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [selectedRegion, selectedEntity, vehicleType, dateTimeStr, userSearched]);

  // Handle filtering
  const filteredCenters = useMemo(() => {
    return ALL_CENTERS.filter(center => {
      const matchRegion = selectedRegion ? center.region === selectedRegion : true;
      const matchEntity = selectedEntity !== 'all' ? center.logoType === selectedEntity : true;
      const matchQuery = searchQuery 
        ? center.name.includes(searchQuery) || center.authorizedEntity.includes(searchQuery)
        : true;
      return matchRegion && matchEntity && matchQuery;
    });
  }, [selectedRegion, selectedEntity, searchQuery]);

  // Text Highlighting Helper
  const highlightText = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-amber-100 text-[#004d33] font-extrabold rounded-md px-1 py-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Navigate to booking summary with the selected center details
  const handleSelectCenter = async (center: InspectionCenter) => {
    const dynamicNext = await getNextPagePath('/search-centers');
    const targetPath = dynamicNext || '/booking-summary';

    navigate(targetPath, {
      state: {
        serviceId: (location.state as any)?.serviceId || localStorage.getItem('selected_service_id') || 'srv-1',
        selectedCenter: center,
        bookingMeta: {
          region: selectedRegion === 'makkah' ? 'المنطقة الغربية' : selectedRegion === 'riyadh' ? 'المنطقة الوسطى' : 'المنطقة الشرقية',
          city: center.name,
          center: center.name,
          vehicleType: vehicleType,
          dateTime: dateTimeStr
        }
      }
    });
  };

  // Standard Center Logo SVG
  const renderLogo = (type: 'aman' | 'applus' | 'takamol' | 'massar') => {
    if (type === 'takamol') {
      return (
        <div className="flex flex-col items-center justify-center p-1 select-none">
          <svg className="w-11 h-6 mb-1" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="10" width="6" height="30" rx="3" transform="rotate(-20 25 10)" fill="#1e3a8a" />
            <rect x="40" y="10" width="6" height="30" rx="3" transform="rotate(-20 40 10)" fill="#1e3a8a" />
            <rect x="30" y="22" width="22" height="6" rx="2" transform="rotate(-20 30 22)" fill="#1e3a8a" />
            <circle cx="68" cy="18" r="4.5" fill="#0d9488" />
          </svg>
          <span className="text-[8px] font-black text-[#1e3a8a] tracking-tight leading-none">تكامل لخدمات النقل</span>
          <span className="text-[5px] text-slate-400 font-bold leading-none uppercase tracking-wider mt-0.5">TAKAMOL MOBILITY</span>
        </div>
      );
    }

    if (type === 'applus') {
      return (
        <div className="flex flex-col items-center justify-center p-1 select-none">
          <div className="flex items-center justify-center font-black text-sm relative">
            <span className="text-[#e55a1c]">Ap</span>
            <span className="text-[#3a3b3d]">plus</span>
            <span className="absolute -top-1 -right-3 w-3 h-3 bg-[#e55a1c] text-white rounded-full flex items-center justify-center text-[8px] font-black pb-0.5">+</span>
          </div>
          <span className="text-[7px] text-slate-500 font-extrabold tracking-tight mt-1 leading-none uppercase whitespace-nowrap">Vehicle Inspection</span>
          <span className="text-[5px] text-slate-400 font-bold leading-none mt-0.5">أبليس العربية</span>
        </div>
      );
    }

    if (type === 'massar') {
      return (
        <div className="flex flex-col items-center justify-center p-1 select-none">
          <svg className="w-12 h-6" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15,48 C15,48 25,46 30,38 C35,28 43,15 60,15 C77,15 83,26 88,35 C93,44 100,46 105,48 M105,48 H93 M15,48 H27" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="45" cy="48" r="8" stroke="#0ea5e9" strokeWidth="2.5" />
            <line x1="51" y1="54" x2="57" y2="60" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="80" cy="48" r="8" stroke="#0ea5e9" strokeWidth="2.5" />
            <text x="63" y="38" textAnchor="middle" fill="#0ea5e9" className="font-sans font-black text-[13px]" style={{ fontFamily: 'system-ui, sans-serif' }}>مسار</text>
          </svg>
          <span className="text-[8px] font-black text-[#0ea5e9] tracking-tight leading-none mt-1">شركة مسار المتحدة</span>
          <span className="text-[5px] text-slate-400 font-bold leading-none uppercase tracking-wider mt-0.5">MASSAR UNITED CO.</span>
        </div>
      );
    }

    // Default 'aman' (أمان - الفحص الدوري للسيارات)
    return (
      <div className="flex flex-col items-center justify-center p-1 select-none">
        <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" stroke="#22c55e" strokeWidth="5.5" fill="white" />
          <polygon points="32,8 68,8 92,32 92,68 68,92 32,92 8,68 8,32" stroke="#a3e635" strokeWidth="2" fill="none" />
          <text x="50" y="47" textAnchor="middle" fill="#15803d" className="font-sans text-[22px] font-black" style={{ fontFamily: 'system-ui, sans-serif' }}>أمان</text>
          <path d="M35,66 h30 L59,55 H41 Z" fill="#15803d" />
          <circle cx="42" cy="70" r="3.5" fill="#a3e635" />
          <circle cx="58" cy="70" r="3.5" fill="#a3e635" />
        </svg>
        <span className="text-[8px] font-black text-[#15803d] tracking-tight leading-none mt-1">أمان - الفحص الدوري</span>
        <span className="text-[5px] text-slate-400 font-bold leading-none uppercase tracking-wider mt-0.5">AMAN INSPECTION</span>
      </div>
    );
  };

  return (
    <div id="search-centers-container" className="font-sans antialiased bg-[#eef3f1] min-h-screen text-right dir-rtl pb-20">
      
      {/* Hero Breadcrumbs section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <button onClick={() => navigate('/')} className="hover:text-[#004d33] transition-all">الرئيسية</button>
          <span>&gt;</span>
          <span className="text-slate-500">البحث عن مواقع الفحص الفني الدوري</span>
        </nav>
      </div>

      {/* NEW MAP & BOOKING SECTION MATCHING SCREENSHOT EXACTLY */}
      <div className="w-full bg-transparent py-4 px-4 sm:px-6 mb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* MAP WRAPPER (Left on RTL, column span 7) */}
          <div className="lg:col-span-7 flex flex-col justify-center relative select-none min-h-[460px] lg:min-h-[540px]">
            {/* SVG Interactive Map Area */}
            <div className="relative w-full flex items-center justify-center max-w-[580px] mx-auto select-none overflow-visible py-4">
              <svg 
                className="w-full h-auto drop-shadow-[0_15px_30px_rgba(16,106,67,0.06)] overflow-visible" 
                viewBox="0 0 650 500" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* 1. Al-Jouf */}
                <path 
                  d="M 110,90 L 180,50 L 210,100 L 160,180 L 140,150 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'jouf' || selectedRegion === 'jouf' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('jouf')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('jouf'); setUserSearched(true); }}
                />

                {/* 2. Northern Borders */}
                <path 
                  d="M 180,50 L 270,90 L 310,140 L 250,170 L 210,100 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'northern_borders' || selectedRegion === 'northern_borders' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('northern_borders')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('northern_borders'); setUserSearched(true); }}
                />

                {/* 3. Tabuk */}
                <path 
                  d="M 50,110 L 110,90 L 140,150 L 90,190 L 40,150 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'tabuk' || selectedRegion === 'tabuk' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('tabuk')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('tabuk'); setUserSearched(true); }}
                />

                {/* 4. Hail */}
                <path 
                  d="M 160,180 L 250,170 L 240,220 L 190,240 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'hail' || selectedRegion === 'hail' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('hail')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('hail'); setUserSearched(true); }}
                />

                {/* 5. Al-Qassim */}
                <path 
                  d="M 240,220 L 280,210 L 290,260 L 220,270 L 220,240 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'qassim' || selectedRegion === 'qassim' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('qassim')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('qassim'); setUserSearched(true); }}
                />

                {/* 6. Al-Madinah */}
                <path 
                  d="M 90,190 L 160,180 L 190,240 L 190,280 L 120,290 L 90,220 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'madinah' || selectedRegion === 'madinah' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('madinah')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('madinah'); setUserSearched(true); }}
                />

                {/* 7. Eastern Province */}
                <path 
                  d="M 380,240 L 450,180 L 520,200 L 560,250 L 590,280 L 610,320 L 580,390 L 500,420 L 410,400 L 380,340 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'eastern' || selectedRegion === 'eastern' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('eastern')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('eastern'); setUserSearched(true); }}
                />

                {/* 8. Riyadh */}
                <path 
                  d="M 280,260 L 380,240 L 380,340 L 410,400 L 340,430 L 290,360 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'riyadh' || selectedRegion === 'riyadh' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('riyadh')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('riyadh'); setUserSearched(true); }}
                />

                {/* 9. Makkah */}
                <path 
                  d="M 120,290 L 190,280 L 220,330 L 200,380 L 140,360 L 110,310 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'makkah' || selectedRegion === 'makkah' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('makkah')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('makkah'); setUserSearched(true); }}
                />

                {/* 10. Al-Baha */}
                <path 
                  d="M 160,375 L 185,370 L 185,390 L 160,395 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'baha' || selectedRegion === 'baha' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('baha')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('baha'); setUserSearched(true); }}
                />

                {/* 11. Asir */}
                <path 
                  d="M 170,395 L 210,380 L 230,410 L 190,440 L 165,410 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'asir' || selectedRegion === 'asir' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('asir')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('asir'); setUserSearched(true); }}
                />

                {/* 12. Najran */}
                <path 
                  d="M 210,380 L 290,360 L 340,430 L 260,440 L 230,410 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'najran' || selectedRegion === 'najran' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('najran')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('najran'); setUserSearched(true); }}
                />

                {/* 13. Jazan */}
                <path 
                  d="M 165,435 L 190,440 L 185,460 L 160,455 Z" 
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredRegion === 'jazan' || selectedRegion === 'jazan' 
                      ? 'fill-[#0c5032] drop-shadow-md' 
                      : 'fill-[#106a43] hover:fill-[#0c5032]'
                  }`}
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredRegion('jazan')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => { setSelectedRegion('jazan'); setUserSearched(true); }}
                />
              </svg>

              {/* Absolute Position Region Badges floating on top of the Map */}
              {/* 1. Al-Jouf */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('jouf')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('jouf'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[20%] left-[22%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'jouf' || selectedRegion === 'jouf' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة الجوف</span>
              </button>

              {/* 2. Northern Borders */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('northern_borders')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('northern_borders'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[25%] left-[45%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'northern_borders' || selectedRegion === 'northern_borders' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة الحدود الشمالية</span>
              </button>

              {/* 3. Tabuk */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('tabuk')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('tabuk'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[34%] left-[12%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'tabuk' || selectedRegion === 'tabuk' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة تبوك</span>
              </button>

              {/* 4. Hail */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('hail')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('hail'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[37%] left-[30%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'hail' || selectedRegion === 'hail' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة حائل</span>
              </button>

              {/* 5. Al-Qassim */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('qassim')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('qassim'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[46%] left-[38%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'qassim' || selectedRegion === 'qassim' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة القصيم</span>
              </button>

              {/* 6. Al-Madinah */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('madinah')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('madinah'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[52%] left-[20%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'madinah' || selectedRegion === 'madinah' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة المدينة المنورة</span>
              </button>

              {/* 7. Eastern Province */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('eastern')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('eastern'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[56%] left-[64%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'eastern' || selectedRegion === 'eastern' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>المنطقة الشرقية</span>
              </button>

              {/* 8. Riyadh */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('riyadh')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('riyadh'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[60%] left-[47%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'riyadh' || selectedRegion === 'riyadh' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة الرياض</span>
              </button>

              {/* 9. Makkah */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('makkah')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('makkah'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[66%] left-[26%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'makkah' || selectedRegion === 'makkah' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة مكة المكرمة</span>
              </button>

              {/* 10. Baha */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('baha')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('baha'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[75%] left-[24%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'baha' || selectedRegion === 'baha' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة الباحة</span>
              </button>

              {/* 11. Asir */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('asir')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('asir'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[80%] left-[28%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'asir' || selectedRegion === 'asir' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة عسير</span>
              </button>

              {/* 12. Najran */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('najran')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('najran'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[82%] left-[42%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'najran' || selectedRegion === 'najran' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة نجران</span>
              </button>

              {/* 13. Jazan */}
              <button 
                type="button"
                onMouseEnter={() => setHoveredRegion('jazan')}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => { setSelectedRegion('jazan'); setUserSearched(true); }}
                className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 top-[87%] left-[26%] flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] border text-[11px] font-black ${
                  hoveredRegion === 'jazan' || selectedRegion === 'jazan' 
                    ? 'border-[#106a43] bg-emerald-50 scale-105 z-30' 
                    : 'border-slate-100 text-slate-700 hover:border-emerald-500 hover:scale-105 z-10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#106a43] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span>منطقة جازان</span>
              </button>
            </div>

            {/* Bottom Left Statistics box exactly as screenshot */}
            <div className="absolute bottom-4 left-4 bg-white rounded-2xl border border-slate-100 shadow-md p-4 max-w-[240px] text-right z-10">
              <span className="block text-5xl font-black text-[#106a43] tracking-tight leading-none mb-1">
                75
              </span>
              <span className="block text-xs font-black text-slate-800 leading-tight">
                موقع للفحص الفني الدوري
              </span>
              <span className="block text-[10px] font-bold text-slate-400 mt-1">
                داخل المملكة العربية السعودية
              </span>
            </div>
          </div>

          {/* SEARCH & BOOKING CARD (Right on RTL, column span 5) - Overhauled to match screenshot EXACTLY */}
          <div className="lg:col-span-5 bg-white rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 flex flex-col gap-5 text-right relative">
            
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-50 pb-4">
              {/* Right side: Location Pin + Title & Subtitle */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-0.5 text-right">
                  <h2 className="text-base sm:text-[17px] font-black text-slate-900 leading-tight">مواقع الفحص الفني الدوري</h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold leading-relaxed">
                    ابحث عن أقرب موقع فحص لك، أو ابحث باسم المدينة أو نوع المركبة
                  </p>
                </div>
              </div>
              
              {/* Left side: GPS target link */}
              <button
                type="button"
                onClick={handleSimulateLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 text-xs font-black text-[#106a43] hover:text-[#0c5032] transition-colors shrink-0 bg-slate-50/50 hover:bg-emerald-50 px-3.5 py-1.5 rounded-full border border-slate-100 cursor-pointer self-start"
              >
                <Locate className="w-4 h-4" />
                <span>أقرب المواقع لموقعي</span>
              </button>
            </div>

            {/* GPS Simulation Toast inside Card */}
            <AnimatePresence>
              {locationSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-right text-[11px] font-bold text-emerald-800 flex items-start gap-2 overflow-hidden"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{locationSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Large full width search input with Search icon */}
            <div className="relative">
              <input
                type="text"
                placeholder="البحث عن مواقع الفحص الفني الدوري"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-250 bg-white pr-4 pl-10 py-3.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-[#106a43] focus:ring-1 focus:ring-[#106a43] transition-all shadow-inner text-right"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            </div>

            {/* Unified Filter Row - Perfectly side-by-side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr_1.3fr_auto] gap-2 items-center">
              
              {/* 1. Region Dropdown */}
              <div className="relative w-full" ref={cardRegionRef}>
                <button
                  type="button"
                  onClick={() => {
                    setCardRegionOpen(!cardRegionOpen);
                    setCardVehicleOpen(false);
                    setCardEntityOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-250 bg-white px-3 py-3 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-right min-h-[46px]"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {selectedRegion ? REGIONS.find(r => r.id === selectedRegion)?.name : 'المنطقة'}
                  </span>
                </button>

                <AnimatePresence>
                  {cardRegionOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 left-0 z-50 mt-1 bg-white rounded-xl border border-gray-150 shadow-2xl overflow-hidden max-h-60 overflow-y-auto w-64"
                    >
                      {REGIONS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setSelectedRegion(r.id);
                            setCardRegionOpen(false);
                            setValidationError('');
                          }}
                          className={`w-full text-right px-4 py-3 hover:bg-slate-50 text-xs font-bold border-b border-slate-50 last:border-b-0 block ${selectedRegion === r.id ? 'bg-emerald-50 text-[#106a43]' : 'text-slate-800'}`}
                        >
                          {r.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Vehicle Type Dropdown */}
              <div className="relative w-full" ref={cardVehicleRef}>
                <button
                  type="button"
                  onClick={() => {
                    setCardVehicleOpen(!cardVehicleOpen);
                    setCardRegionOpen(false);
                    setCardEntityOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-250 bg-white px-3 py-3 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-right min-h-[46px]"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {vehicleType ? VEHICLE_TYPES.find(v => v.id === vehicleType)?.name : 'نوع المركبة'}
                  </span>
                </button>

                <AnimatePresence>
                  {cardVehicleOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 left-0 z-50 mt-1 bg-white rounded-xl border border-gray-150 shadow-2xl overflow-hidden max-h-60 overflow-y-auto w-64"
                    >
                      {VEHICLE_TYPES.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setVehicleType(v.id);
                            setCardVehicleOpen(false);
                          }}
                          className={`w-full text-right px-4 py-3 hover:bg-slate-50 text-xs font-bold border-b border-slate-50 last:border-b-0 block ${vehicleType === v.id ? 'bg-emerald-50 text-[#106a43]' : 'text-slate-800'}`}
                        >
                          {v.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Licensed Entity Dropdown with Calendar/Sheet Icon */}
              <div className="relative w-full" ref={cardEntityRef}>
                <button
                  type="button"
                  onClick={() => {
                    setCardEntityOpen(!cardEntityOpen);
                    setCardRegionOpen(false);
                    setCardVehicleOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-250 bg-white px-3 py-3 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-right min-h-[46px]"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">
                      {selectedEntity !== 'all' ? (
                        selectedEntity === 'aman' ? 'أمان - الفحص الدوري' :
                        selectedEntity === 'takamol' ? 'تكامل لخدمات النقل' :
                        selectedEntity === 'applus' ? 'أبليس العربية' :
                        selectedEntity === 'massar' ? 'شركة مسار المتحدة' : 'الجهة المرخصة'
                      ) : 'الجهة المرخصة'}
                    </span>
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </button>

                <AnimatePresence>
                  {cardEntityOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 left-0 z-50 mt-1 bg-white rounded-xl border border-gray-150 shadow-2xl overflow-hidden max-h-60 overflow-y-auto w-72"
                    >
                      {[
                        { id: 'all', name: 'الكل (جميع الجهات المرخصة)' },
                        { id: 'aman', name: 'أمان - الفحص الدوري للسيارات' },
                        { id: 'takamol', name: 'تكامل لخدمات النقل (Takamol)' },
                        { id: 'applus', name: 'Applus+ Vehicle Inspection (أبليس)' },
                        { id: 'massar', name: 'شركة مسار المتحدة (Massar United)' }
                      ].map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setSelectedEntity(e.id);
                            setCardEntityOpen(false);
                          }}
                          className={`w-full text-right px-4 py-3 hover:bg-slate-50 text-xs font-bold border-b border-slate-50 last:border-b-0 block ${selectedEntity === e.id ? 'bg-emerald-50 text-[#106a43]' : 'text-slate-800'}`}
                        >
                          {e.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. solid green search button */}
              <button
                type="button"
                onClick={handleSearchTrigger}
                className="rounded-xl bg-[#106a43] hover:bg-[#0c5032] text-white font-black text-xs transition-all shadow-md cursor-pointer px-6 py-3 min-h-[46px] w-full md:w-auto"
              >
                بحث
              </button>

            </div>

            {validationError && (
              <div className="text-right text-[11px] text-rose-600 font-bold flex items-center gap-1.5 justify-start bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse shrink-0"></span>
                <span>{validationError}</span>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* FILTER HEADER & REAL-TIME INTERACTION CONTROLS */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-8">
        
        {/* Live Search bar for instant center filtering */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="بحث سريع باسم المركز، العنوان، أو المحطة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white pr-10 pl-10 py-3 text-xs font-bold text-slate-700 placeholder-slate-400 focus:border-[#004d33] focus:ring-1 focus:ring-[#004d33] transition-all shadow-sm"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dynamic badge with centers count */}
          <div className="flex items-center gap-2 bg-[#004d33]/5 text-[#004d33] px-4 py-2.5 rounded-xl border border-[#004d33]/10 text-xs font-black self-start sm:self-auto">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            <span>
              {userSearched 
                ? `تم العثور على ${filteredCenters.length} محطات فحص دوري معتمدة`
                : 'الرجاء إجراء البحث أو اختيار منطقة من الخريطة لعرض المحطات'}
            </span>
          </div>
        </div>
      </div>

      {/* CENTERS GRID matching the layout of 8 items */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-16">
        {!userSearched ? (
          <div className="py-16 px-6 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm max-w-xl mx-auto flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#004d33]">
              <Search className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-slate-800">ابدأ البحث عن محطات الفحص المعتمدة</h4>
              <p className="text-xs text-slate-400 font-extrabold max-w-sm leading-relaxed">
                الرجاء تحديد المنطقة، نوع المركبة، والتاريخ والوقت المناسبين من الحقول أعلاه، ثم اضغط على زر "بحث" لعرض كافة محطات الفحص والمواعيد المتاحة للحجز.
              </p>
            </div>
          </div>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 text-center w-full">
            <Loader2 className="w-10 h-10 text-[#004d33] animate-spin mb-4" />
            <p className="text-xs font-extrabold text-slate-400 animate-pulse">جاري تصفية وتحديث مراكز الفحص والمواعيد المتاحة...</p>
          </div>
        ) : (
          <motion.div 
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filteredCenters.map((center, idx) => (
              <motion.div
                key={center.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all flex flex-col items-center text-center justify-between relative overflow-hidden"
              >
                {/* Card top badge or subtle border decor */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-l from-emerald-500/10 via-emerald-500/20 to-emerald-500/10" />

                {/* Logo container */}
                <div className="my-4 flex items-center justify-center h-16 w-16 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                  {renderLogo(center.logoType)}
                </div>

                {/* Center Name */}
                <h3 className="text-base font-black text-slate-800 mb-1">
                  {highlightText(center.name, searchQuery)}
                </h3>

                {/* Authorized status text */}
                <p className="text-[10px] text-slate-400 font-extrabold leading-tight px-2 mb-3">
                  {highlightText(center.authorizedEntity, searchQuery)}
                </p>

                {/* Timing detail row */}
                <div className="w-full border-t border-gray-50 pt-3 pb-4 flex items-center justify-center gap-1.5 text-emerald-800 text-[10px] font-extrabold">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الجهة المرخصة / {center.workingHours}</span>
                </div>

                {/* Action Button exactly as the screen */}
                <button
                  onClick={() => handleSelectCenter(center)}
                  className="w-full py-3 rounded-xl bg-[#004d33] hover:bg-[#003422] text-white font-extrabold text-xs tracking-wide transition-all shadow-md hover:shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>حجز موعد</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </motion.div>
            ))}

            {filteredCenters.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-slate-400 font-bold text-sm">عذراً، لم يتم العثور على أي مراكز مطابقة لبحثك في هذه المنطقة حالياً.</p>
                <button
                  onClick={() => { setSelectedRegion('makkah'); setSearchQuery(''); }}
                  className="mt-3 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
                >
                  عرض كافة المراكز
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

    </div>
  );
};
