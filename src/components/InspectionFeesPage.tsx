import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getNextPagePath } from '../lib/flow';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  ChevronDown, 
  Calendar,
  Check,
  Truck,
  Bike
} from 'lucide-react';

interface VehicleFeeInfo {
  id: string;
  name: string;
  icon: 'car' | 'truck' | 'bike' | 'bus';
  baseInspection: string;
  vatInspection: string;
  totalInspection: string;
  baseReinspection: string;
  vatReinspection: string;
  totalReinspection: string;
}

const VEHICLE_FEES: VehicleFeeInfo[] = [
  {
    id: 'private_car',
    name: 'سيارة خاصة',
    icon: 'car',
    baseInspection: '100.00',
    vatInspection: '15.00',
    totalInspection: '115.00',
    baseReinspection: '33.00',
    vatReinspection: '04.95',
    totalReinspection: '37.95'
  },
  {
    id: 'light_transport',
    name: 'نقل خاص خفيف',
    icon: 'truck',
    baseInspection: '140.00',
    vatInspection: '21.00',
    totalInspection: '161.00',
    baseReinspection: '44.00',
    vatReinspection: '06.60',
    totalReinspection: '50.60'
  },
  {
    id: 'medium_bus',
    name: 'حافلة متوسطة',
    icon: 'bus',
    baseInspection: '210.00',
    vatInspection: '31.50',
    totalInspection: '241.50',
    baseReinspection: '65.00',
    vatReinspection: '09.75',
    totalReinspection: '74.75'
  },
  {
    id: 'heavy_truck',
    name: 'نقل ثقيل',
    icon: 'truck',
    baseInspection: '210.00',
    vatInspection: '31.50',
    totalInspection: '241.50',
    baseReinspection: '65.00',
    vatReinspection: '09.75',
    totalReinspection: '74.75'
  },
  {
    id: 'motorcycle',
    name: 'دراجة نارية',
    icon: 'bike',
    baseInspection: '50.00',
    vatInspection: '07.50',
    totalInspection: '57.50',
    baseReinspection: '15.00',
    vatReinspection: '02.25',
    totalReinspection: '17.25'
  }
];

export const InspectionFeesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedVehicleId, setSelectedVehicleId] = useState('private_car');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedFee = VEHICLE_FEES.find(v => v.id === selectedVehicleId) || VEHICLE_FEES[0];

  const handleSelect = (id: string) => {
    setSelectedVehicleId(id);
    setDropdownOpen(false);
  };

  const handleBookingClick = async () => {
    const dynamicNext = await getNextPagePath('/InspectionFees');
    const targetPath = dynamicNext || '/';
    if (targetPath === '/') {
      navigate('/', { state: { autoScrollToBooking: true } });
    } else {
      navigate(targetPath, { state: location.state });
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfcfa] flex flex-col dir-rtl text-right font-sans antialiased pb-24">
      
      {/* 1. Breadcrumbs Path (الصفحة الرئيسية > المقابل المالي للفحص) */}
      <div className="bg-white border-b border-slate-100/80 py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-start text-xs font-semibold text-slate-400 gap-2">
          <span className="text-slate-400">الصفحة الرئيسية</span>
          <span className="text-slate-300 font-normal">/</span>
          <span className="text-[#01936c] font-bold">المقابل المالي للفحص</span>
        </div>
      </div>

      {/* 2. Page Header & Intro */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full pt-12 pb-8">
        <div className="text-right space-y-2">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">الصفحة الرئيسية &gt; المقابل المالي للفحص</span>
          <h2 className="text-3xl sm:text-4.5xl font-black text-[#00301e] leading-tight">
            المقابل المالي للفحص
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-bold mt-1.5">
            قائمة برسوم الفحص لكل انواع المركبات
          </p>
        </div>
      </div>

      {/* 3. Main Interactive Container */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 space-y-6 relative z-10">
        
        {/* Dropdown Selector Card mimicking the screenshot exactly */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 relative z-30">
          <div className="flex flex-col gap-3">
            
            {/* Label Row */}
            <div className="flex items-center gap-2 text-slate-700 font-extrabold text-xs sm:text-sm">
              <svg className="w-5 h-5 text-[#01936c]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>اختر نوع المركبة</span>
            </div>

            {/* Selector Field */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between bg-white border border-slate-200/90 hover:border-[#01936c] rounded-xl px-5 py-4 text-xs sm:text-sm font-black text-slate-700 focus:outline-none transition-all shadow-sm cursor-pointer"
              >
                {/* Left Side: Change Vehicle text + Downward Chevron */}
                <div className="flex items-center gap-2.5 text-[#01936c] font-black">
                  <span className="text-xs sm:text-sm">تغيير المركبة</span>
                  <ChevronDown className={`w-4.5 h-4.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Right Side: Selected Option & Car Icon */}
                <div className="flex items-center gap-3">
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold">{selectedFee.name}</span>
                  <div className="p-1.5 bg-slate-50 rounded-lg text-[#01936c]">
                    <Car className="w-5 h-5" />
                  </div>
                </div>
              </button>

              {/* Dropdown Options List */}
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    {/* Overlay to close on outside click */}
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 left-0 mt-2 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto"
                    >
                      <ul className="py-1">
                        {VEHICLE_FEES.map((fee) => (
                          <li key={fee.id}>
                            <button
                              type="button"
                              onClick={() => handleSelect(fee.id)}
                              className={`w-full flex items-center justify-between px-5 py-3.5 text-right text-xs sm:text-sm font-bold transition-colors ${
                                fee.id === selectedVehicleId
                                  ? 'bg-emerald-50/70 text-[#004d33] font-black'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {fee.id === selectedVehicleId && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />}
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span>{fee.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">({fee.totalInspection} ﷼)</span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* 4. Two detailed price cards side-by-side matching screenshot exactly */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          
          {/* Right Card: مبلغ الفحص شامل الضريبة */}
          <motion.div 
            key={`inspection-${selectedVehicleId}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] border border-slate-100/80 shadow-md shadow-slate-100/40 p-6 sm:p-8 flex flex-col justify-between"
          >
            {/* Header Area */}
            <div className="flex justify-between items-center pb-5 border-b border-slate-100">
              
              {/* Left Side: Big Price in Green */}
              <div className="flex items-baseline font-sans text-[#01936c]">
                <span className="text-[18px] sm:text-[20px] font-black mr-1 align-middle self-start">﷼</span>
                <span className="text-4xl sm:text-[42px] font-extrabold tracking-tight font-mono">
                  {selectedFee.totalInspection}
                </span>
              </div>
              
              {/* Right Side: Labels */}
              <div className="text-right space-y-1">
                <h3 className="text-base sm:text-[17px] font-black text-[#00301e]">مبلغ الفحص شامل الضريبة</h3>
                <p className="text-[11px] text-slate-400 font-bold">نوع المركبة: {selectedFee.name}</p>
              </div>

            </div>

            {/* Price Details Breakdown */}
            <div className="pt-6 space-y-4">
              
              {/* Line 1: المقابل المالي للفحص */}
              <div className="flex justify-between items-center text-xs sm:text-sm">
                {/* Price Left */}
                <div className="flex items-center gap-1 font-mono text-slate-800 font-extrabold">
                  <span className="text-[10px] text-slate-400 font-bold">﷼</span>
                  <span>{selectedFee.baseInspection}</span>
                </div>
                {/* Text Right */}
                <span className="text-slate-500 font-black">المقابل المالي للفحص الفني الدوري</span>
              </div>

              {/* Line 2: ضريبة القيمة المضافة 15% */}
              <div className="flex justify-between items-center text-xs sm:text-sm">
                {/* Price Left */}
                <div className="flex items-center gap-1 font-mono text-slate-800 font-extrabold">
                  <span className="text-[10px] text-slate-400 font-bold">﷼</span>
                  <span>{selectedFee.vatInspection}</span>
                </div>
                {/* Text Right */}
                <span className="text-slate-500 font-black">ضريبة القيمة المضافة 15%</span>
              </div>

            </div>
          </motion.div>

          {/* Left Card: مبلغ إعادة الفحص شامل الضريبة */}
          <motion.div 
            key={`reinspection-${selectedVehicleId}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] border border-slate-100/80 shadow-md shadow-slate-100/40 p-6 sm:p-8 flex flex-col justify-between"
          >
            {/* Header Area */}
            <div className="flex justify-between items-center pb-5 border-b border-slate-100">
              
              {/* Left Side: Big Price in Green */}
              <div className="flex items-baseline font-sans text-[#01936c]">
                <span className="text-[18px] sm:text-[20px] font-black mr-1 align-middle self-start">﷼</span>
                <span className="text-4xl sm:text-[42px] font-extrabold tracking-tight font-mono">
                  {selectedFee.totalReinspection}
                </span>
              </div>
              
              {/* Right Side: Labels */}
              <div className="text-right space-y-1">
                <h3 className="text-base sm:text-[17px] font-black text-[#00301e]">مبلغ إعادة الفحص شامل الضريبة</h3>
                <p className="text-[11px] text-slate-400 font-bold">نوع المركبة: {selectedFee.name}</p>
              </div>

            </div>

            {/* Price Details Breakdown */}
            <div className="pt-6 space-y-4">
              
              {/* Line 1: المقابل المالي لإعادة الفحص */}
              <div className="flex justify-between items-center text-xs sm:text-sm">
                {/* Price Left */}
                <div className="flex items-center gap-1 font-mono text-slate-800 font-extrabold">
                  <span className="text-[10px] text-slate-400 font-bold">﷼</span>
                  <span>{selectedFee.baseReinspection}</span>
                </div>
                {/* Text Right */}
                <span className="text-slate-500 font-black">المقابل المالي لإعادة الفحص الفني الدوري</span>
              </div>

              {/* Line 2: ضريبة القيمة المضافة 15% */}
              <div className="flex justify-between items-center text-xs sm:text-sm">
                {/* Price Left */}
                <div className="flex items-center gap-1 font-mono text-slate-800 font-extrabold">
                  <span className="text-[10px] text-slate-400 font-bold">﷼</span>
                  <span>{selectedFee.vatReinspection}</span>
                </div>
                {/* Text Right */}
                <span className="text-slate-500 font-black">ضريبة القيمة المضافة 15%</span>
              </div>

            </div>
          </motion.div>

        </div>

        {/* 5. Book Appointment Button */}
        <div className="flex justify-center pt-10">
          <button
            type="button"
            onClick={handleBookingClick}
            className="px-10 py-4 bg-[#01936c] hover:bg-[#007a53] text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Calendar className="w-5 h-5" />
            <span>حجز موعد</span>
          </button>
        </div>

      </div>

    </div>
  );
};
