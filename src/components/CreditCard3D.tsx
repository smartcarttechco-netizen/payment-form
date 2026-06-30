import React, { useMemo, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { CardType, getSaudiBankByNumber } from '../lib/validation';
import { Wifi, CreditCard as CardIcon } from 'lucide-react';

interface CreditCard3DProps {
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  cardType: CardType | 'mada' | 'applepay';
  isFlipped: boolean;
  className?: string;
}

export const CreditCard3D: React.FC<CreditCard3DProps> = ({
  cardNumber,
  cardholderName,
  expiry,
  cvv,
  cardType,
  isFlipped,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for interactive mouse parallax tracking
  const mouseX = useMotionValue(0.5); // 0 to 1
  const mouseY = useMotionValue(0.5); // 0 to 1

  // Springs for silky smooth transitions
  const springConfig = { damping: 25, stiffness: 120, mass: 1 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  // States to track if the mouse is hovering over the card
  const [isHovered, setIsHovered] = useState(false);

  // Base flat perspective values (completely flat/straight, no initial tilt)
  const baseRotateX = 0;
  const baseRotateY = isFlipped ? 180 : 0;
  const baseRotateZ = 0;

  // Map mouse positions to rotational offsets (gentle premium hover interaction)
  const hoverRotateX = useTransform(mouseYSpring, [0, 1], [5, -5]);
  // When flipped, mouse motion should rotate inverted on Y-axis for standard coordinate space
  const hoverRotateY = useTransform(mouseXSpring, [0, 1], isFlipped ? [5, -5] : [-5, 5]);

  // Glare overlay offset maps
  const glareX = useTransform(mouseXSpring, [0, 1], ['0%', '100%']);
  const glareY = useTransform(mouseYSpring, [0, 1], ['0%', '100%']);
  const glareOpacity = useSpring(isHovered ? 0.35 : 0.1, springConfig);

  // Handle pointer coordinate updates
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    // Smoothly spring back to center
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  // Format card number with spacing for visual display
  const displayCardNumber = useMemo(() => {
    if (!cardNumber) {
      return cardType === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••';
    }
    return cardNumber;
  }, [cardNumber, cardType]);

  const displayHolderName = useMemo(() => {
    return cardholderName ? cardholderName.toUpperCase() : 'CARDHOLDER NAME';
  }, [cardholderName]);

  const displayExpiry = useMemo(() => {
    return expiry || 'MM/YY';
  }, [expiry]);

  // Find Saudi bank based on card number
  const saudiBank = useMemo(() => {
    return getSaudiBankByNumber(cardNumber);
  }, [cardNumber]);

  // Choose styling depending on Card Type (Deep metallic aesthetics)
  const cardDesign = useMemo(() => {
    let design: {
      gradient: string;
      logo: React.ReactNode;
      accent: string;
      edgeColor: string;
      shimmer: string;
    };

    switch (cardType) {
      case 'mada':
        design = {
          gradient: 'from-[#005f73] via-[#0a9396] to-[#001219]', // Deep Saudi petrol teal
          logo: (
            <div className="flex flex-col items-center select-none bg-white/10 backdrop-blur-md px-2 py-0.5 rounded border border-white/15">
              <span className="text-white font-extrabold italic text-xs min-[360px]:text-sm tracking-tighter leading-none">mada</span>
              <span className="text-white font-bold text-[8px] min-[360px]:text-[9px] leading-none mt-0.5">مدى</span>
            </div>
          ),
          accent: 'border-emerald-400/30 bg-emerald-500/10',
          edgeColor: 'bg-emerald-900 border-emerald-700/50',
          shimmer: 'bg-emerald-400/10',
        };
        break;
      case 'applepay':
        design = {
          gradient: 'from-[#1c1c1e] via-[#2c2c2e] to-[#000000]', // Matte Apple Space Gray
          logo: (
            <div className="flex items-center space-x-1 select-none text-white font-bold text-xs bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
              <span className="text-sm"></span>
              <span>Pay</span>
            </div>
          ),
          accent: 'border-zinc-700/30 bg-zinc-800/10',
          edgeColor: 'bg-zinc-900 border-zinc-800/50',
          shimmer: 'bg-white/5',
        };
        break;
      case 'visa':
        design = {
          gradient: 'from-[#0a192f] via-[#172a45] to-[#020c1b]', // Classic Premium Navy Blue
          logo: (
            <span className="text-white font-black italic text-lg min-[360px]:text-xl sm:text-2xl tracking-widest select-none drop-shadow-md">
              VISA
            </span>
          ),
          accent: 'border-sky-400/30 bg-sky-500/10',
          edgeColor: 'bg-indigo-950 border-indigo-900/50',
          shimmer: 'bg-sky-400/10',
        };
        break;
      case 'mastercard':
        design = {
          gradient: 'from-[#1e1e24] via-[#2a2d34] to-[#111115]', // Premium Carbon/Sleek Gray
          logo: (
            <div className="flex items-center space-x-[-10px] select-none">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#eb001b] opacity-95 shadow-md" />
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#ff5f00] opacity-90 mix-blend-screen shadow-md" />
            </div>
          ),
          accent: 'border-amber-400/35 bg-amber-500/10',
          edgeColor: 'bg-stone-900 border-stone-800/50',
          shimmer: 'bg-amber-400/10',
        };
        break;
      case 'amex':
        design = {
          gradient: 'from-[#112233] via-[#223344] to-[#05111a]',
          logo: (
            <div className="border border-sky-200/40 bg-sky-950/60 px-2 py-0.5 rounded text-[10px] sm:text-[12px] font-black tracking-widest text-sky-100 select-none shadow-sm">
              AMEX
            </div>
          ),
          accent: 'border-sky-400/30 bg-sky-500/10',
          edgeColor: 'bg-slate-900 border-slate-800/50',
          shimmer: 'bg-sky-400/10',
        };
        break;
      case 'discover':
        design = {
          gradient: 'from-[#3a1c02] via-[#5c3c15] to-[#1f0d01]', // Bronze gold
          logo: (
            <span className="text-white font-black italic text-sm sm:text-lg tracking-wider select-none drop-shadow-sm">
              DISCOVER
            </span>
          ),
          accent: 'border-orange-400/30 bg-orange-500/10',
          edgeColor: 'bg-orange-950 border-orange-900/50',
          shimmer: 'bg-orange-400/10',
        };
        break;
      default:
        design = {
          // Beautiful default Visa/Mastercard dual card style
          gradient: 'from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          logo: (
            <div className="flex items-center gap-2 select-none bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
              <span className="text-[10px] min-[360px]:text-xs font-black italic text-sky-400 tracking-tighter">VISA</span>
              <div className="h-3.5 w-px bg-white/20" />
              <div className="flex items-center -space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500/90" />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500/95 mix-blend-screen" />
              </div>
            </div>
          ),
          accent: 'border-slate-500/20 bg-slate-500/10',
          edgeColor: 'bg-slate-800 border-slate-700/50',
          shimmer: 'bg-slate-400/10',
        };
    }

    if (saudiBank) {
      return {
        ...design,
        gradient: saudiBank.gradient,
        accent: saudiBank.accent,
        edgeColor: saudiBank.edgeColor,
        shimmer: saudiBank.shimmer,
      };
    }

    return design;
  }, [cardType, saudiBank]);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      className={`perspective-1000 w-[280px] h-[176px] min-[360px]:w-[310px] min-[360px]:h-[195px] min-[400px]:w-[340px] min-[400px]:h-[215px] sm:w-[380px] sm:h-[235px] cursor-pointer relative select-none ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Dynamic 3D Transform Motion Wrapper */}
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{
          rotateX: isHovered ? baseRotateX + hoverRotateX.get() : baseRotateX,
          rotateY: isHovered ? baseRotateY + hoverRotateY.get() : baseRotateY,
          rotateZ: baseRotateZ,
        }}
        transition={{
          type: 'spring',
          stiffness: 90,
          damping: 18,
          mass: 1.1,
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* PHYSICAL THICKNESS SIMULATOR EDGES */}
        {/* We place small layers translated slightly on the Z-axis to create a solid 3D profile edge. */}
        {/* Layer -2px */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-slate-950/45 border border-slate-900/50 pointer-events-none"
          style={{
            transform: 'translateZ(-1.5px)',
            backfaceVisibility: 'hidden',
          }}
        />
        {/* Layer -1px */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-slate-950/60 pointer-events-none"
          style={{
            transform: 'translateZ(-0.75px)',
            backfaceVisibility: 'hidden',
          }}
        />
        {/* Layer +1px */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-slate-900/50 pointer-events-none"
          style={{
            transform: 'translateZ(0.75px)',
            backfaceVisibility: 'hidden',
          }}
        />
        {/* Layer +2px */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-slate-800/30 pointer-events-none"
          style={{
            transform: 'translateZ(1.5px)',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* --- FRONT OF CARD --- */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl p-4 min-[360px]:p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/15 backface-hidden bg-gradient-to-br ${cardDesign.gradient}`}
          style={{
            transform: 'translateZ(3px)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Custom Glare effect tied to mouse positions */}
          <motion.div
            className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/15 to-transparent z-10"
            style={{
              background: `radial-gradient(circle 180px at ${glareX.get()} ${glareY.get()}, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 80%)`,
              opacity: glareOpacity,
            }}
          />

          {/* Glowing Mesh Overlay */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:10px_10px]" />

          {/* Saudi Emblem Watermark for Mada cards */}
          {cardType === 'mada' && (
            <svg className="absolute right-6 bottom-8 w-20 h-20 text-amber-400/20 pointer-events-none z-0" viewBox="0 0 100 100" fill="currentColor">
              <path d="M48 58 h4 v14 h-4 z" />
              <path d="M47 54 h6 v3 h-6 z" />
              <path d="M46 49 h8 v4 h-8 z" />
              <path d="M48 35 c-3-3-9-2-12 1 c-3 3-2 7 1 9 c4 2 9-1 11-4 z" />
              <path d="M52 35 c3-3 9-2 12 1 c3 3 2 7-1 9 c-4 2-9-1-11-4 z" />
              <path d="M48 42 c-4-2-10 1-11 5 c-2 4 1 8 5 8 c4 0 7-5 6-13 z" />
              <path d="M52 42 c4-2 10 1 11 5 c2 4-1 8-5 8 c-4 0-7-5-6-13 z" />
              <path d="M49 28 c-1-4-6-6-10-5 c-4 1-5 6-3 9 c3 3 8 1 13-4 z" />
              <path d="M51 28 c1-4 6-6 10-5 c4 1 5 6 3 9 c-3 3-8 1-13-4 z" />
              <path d="M50 20 c0-5-4-8-8-7 c-4 1-5 5-3 8 c3 3 8 1 11-1 z" />
              <path d="M50 20 c0-5 4-8 8-7 c4 1 5 5 3 8 c-3 3-8 1-11-1 z" />
              <path d="M25 78 l50-18 M75 78 l-50-18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M28 78 c-2-2-2-6 1-8 M72 78 c2-2 2-6-1-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          )}

          {/* Front Header */}
          <div className="flex justify-between items-start z-10">
            {/* Hologram contact chip & Wireless indicator / Bank Logo if present */}
            <div className="flex flex-col items-start gap-1 sm:gap-1.5">
              {saudiBank && (
                <div className="flex flex-col select-none bg-white/10 backdrop-blur-md px-2 py-0.5 rounded border border-white/15 text-right font-sans">
                  <span className="text-white font-extrabold text-[8px] min-[360px]:text-[10px] leading-none">
                    {saudiBank.nameAr}
                  </span>
                  <span className="text-white/80 font-bold text-[6px] min-[360px]:text-[7px] uppercase tracking-wider leading-none mt-0.5">
                    {saudiBank.name}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-9 h-6.5 min-[360px]:w-10 min-[360px]:h-7.5 sm:w-12 sm:h-9 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-md sm:rounded-lg relative overflow-hidden border border-amber-300/30 shadow-inner flex items-center justify-center">
                  {/* Chip circuit designs */}
                  <div className="absolute inset-x-1.5 inset-y-0.5 sm:inset-x-2 sm:inset-y-1 border border-amber-900/15 rounded-[2px]" />
                  <div className="absolute inset-x-3 inset-y-0.5 border-l border-r border-amber-900/15" />
                  <div className="absolute inset-y-2 inset-x-1 border-t border-b border-amber-900/15" />
                </div>
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 rotate-90" />
              </div>
            </div>

            {/* Network Brand */}
            <div className="h-7 sm:h-9 flex items-center">
              {cardDesign.logo}
            </div>
          </div>

          {/* Card Number Container */}
          <div className="z-10 mt-3 sm:mt-7">
            <p className="font-mono text-sm min-[360px]:text-base min-[400px]:text-lg sm:text-2xl font-bold tracking-[0.08em] min-[360px]:tracking-[0.12em] sm:tracking-[0.16em] text-white text-shadow drop-shadow-md select-all" dir="ltr">
              {displayCardNumber}
            </p>
          </div>

          {/* Front Footer */}
          <div className="flex justify-between items-end z-10">
            {/* Cardholder */}
            <div className="max-w-[70%]">
              <p className="text-[7px] sm:text-[8px] font-mono tracking-widest text-white/40 mb-0.5">CARDHOLDER</p>
              <p className="text-[10px] min-[360px]:text-xs sm:text-sm font-sans font-semibold text-white tracking-wide truncate">
                {displayHolderName}
              </p>
            </div>

            {/* Expiry */}
            <div className="text-right">
              <p className="text-[7px] sm:text-[8px] font-mono tracking-widest text-white/40 mb-0.5">EXPIRES</p>
              <p className="text-[10px] min-[360px]:text-xs sm:text-sm font-mono font-bold text-white tracking-wider" dir="ltr">
                {displayExpiry}
              </p>
            </div>
          </div>
        </div>

        {/* --- BACK OF CARD --- */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl flex flex-col justify-between py-4 sm:py-5 overflow-hidden shadow-2xl border border-white/15 backface-hidden bg-gradient-to-br ${cardDesign.gradient}`}
          style={{
            transform: 'translateZ(-3px) rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Magnetic Stripe */}
          <div className="w-full h-8 sm:h-11 bg-zinc-950/95 z-10 mt-1" />

          {/* Signature Zone and CVV */}
          <div className="px-4 min-[360px]:px-5 sm:px-6 z-10 flex flex-col space-y-0.5 sm:space-y-1">
            <span className="text-[7px] sm:text-[8px] font-mono tracking-widest text-white/40 self-end">AUTHORIZED SIGNATURE</span>
            <div className="flex items-center w-full">
              {/* White Signature panel */}
              <div className="flex-1 h-7 sm:h-9 bg-neutral-200 rounded-l flex items-center px-2 sm:px-3 italic font-serif text-xs sm:text-sm text-neutral-600 select-none bg-[repeating-linear-gradient(45deg,#ccc,#ccc_10px,#ddd_10px,#ddd_20px)]">
                {cardholderName ? cardholderName : 'Smart Cart Secure'}
              </div>
              {/* Highlighted CVV Panel */}
              <div className="bg-amber-400 text-neutral-900 font-mono font-black text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3 rounded-r flex items-center justify-center shadow-lg min-w-[45px] sm:min-w-[55px] border-l border-amber-500">
                {cvv ? cvv : (cardType === 'amex' ? '••••' : '•••')}
              </div>
            </div>
          </div>

          {/* Legal Disclaimer & Network Logo */}
          <div className="px-5 sm:px-6 z-10 flex justify-between items-center text-[6px] sm:text-[7px] font-mono text-white/45 leading-relaxed">
            <p className="max-w-[75%] leading-normal">
              This card is properties of issuer and governed by terms of authorization.
              3D Secure authentication sandbox mode active.
            </p>
            <div className="opacity-40 scale-75 sm:scale-100 origin-right">
              {cardDesign.logo}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
