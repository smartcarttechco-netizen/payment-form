import React, { useMemo, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { CardType } from '../lib/validation';
import { Wifi, CreditCard as CardIcon } from 'lucide-react';

interface CreditCard3DProps {
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  cardType: CardType;
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

  // Base tilted perspective values
  // rotateY default: -30 degrees for high-end tilted view. When flipped, it rotates +180 degrees to 150 degrees.
  const baseRotateX = 16;
  const baseRotateY = isFlipped ? 150 : -30;
  const baseRotateZ = -6;

  // Map mouse positions to rotational offsets (e.g. +/- 12 degrees max rotation adjustment)
  const hoverRotateX = useTransform(mouseYSpring, [0, 1], [8, -8]);
  // When flipped, mouse motion should rotate inverted on Y-axis for standard coordinate space
  const hoverRotateY = useTransform(mouseXSpring, [0, 1], isFlipped ? [8, -8] : [-10, 10]);

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

  // Choose styling depending on Card Type (Deep metallic aesthetics)
  const cardDesign = useMemo(() => {
    switch (cardType) {
      case 'visa':
        return {
          gradient: 'from-blue-600 via-indigo-800 to-slate-950',
          logo: (
            <span className="text-white font-extrabold italic text-2xl tracking-wider select-none drop-shadow-sm">
              VISA
            </span>
          ),
          accent: 'border-blue-400/30 bg-blue-500/10',
          edgeColor: 'bg-indigo-900 border-indigo-700/50',
          shimmer: 'bg-indigo-400/10',
        };
      case 'mastercard':
        return {
          gradient: 'from-zinc-900 via-neutral-800 to-amber-950',
          logo: (
            <div className="flex items-center space-x-[-10px] select-none">
              <div className="w-7 h-7 rounded-full bg-red-600 opacity-90 shadow" />
              <div className="w-7 h-7 rounded-full bg-amber-500 opacity-90 mix-blend-screen shadow" />
            </div>
          ),
          accent: 'border-red-500/20 bg-red-500/5',
          edgeColor: 'bg-zinc-800 border-zinc-700/50',
          shimmer: 'bg-amber-400/10',
        };
      case 'amex':
        return {
          gradient: 'from-emerald-600 via-teal-800 to-slate-950',
          logo: (
            <div className="border border-teal-200/50 bg-teal-900/60 px-2 py-0.5 rounded text-[11px] font-black tracking-widest text-teal-100 select-none shadow-sm">
              AMEX
            </div>
          ),
          accent: 'border-teal-400/30 bg-teal-500/10',
          edgeColor: 'bg-teal-900 border-teal-700/50',
          shimmer: 'bg-emerald-400/10',
        };
      case 'discover':
        return {
          gradient: 'from-orange-600 via-rose-700 to-indigo-950',
          logo: (
            <span className="text-white font-black italic text-lg tracking-wider select-none drop-shadow-sm">
              DISCOVER
            </span>
          ),
          accent: 'border-orange-400/30 bg-orange-500/10',
          edgeColor: 'bg-rose-900 border-rose-700/50',
          shimmer: 'bg-orange-400/10',
        };
      default:
        return {
          gradient: 'from-slate-800 via-slate-900 to-zinc-950',
          logo: <CardIcon className="w-8 h-8 text-indigo-300 drop-shadow-sm" />,
          accent: 'border-slate-500/20 bg-slate-500/10',
          edgeColor: 'bg-slate-800 border-slate-700/50',
          shimmer: 'bg-slate-400/10',
        };
    }
  }, [cardType]);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      className={`perspective-1000 w-[340px] h-[215px] sm:w-[380px] sm:h-[235px] cursor-pointer relative ${className}`}
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
          className={`absolute inset-0 w-full h-full rounded-2xl bg-slate-950/45 border border-slate-900/50 pointer-events-none`}
          style={{
            transform: 'translateZ(-1.5px)',
            backfaceVisibility: 'hidden',
          }}
        />
        {/* Layer -1px */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl bg-slate-950/60 pointer-events-none`}
          style={{
            transform: 'translateZ(-0.75px)',
            backfaceVisibility: 'hidden',
          }}
        />
        {/* Layer +1px */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl bg-slate-900/50 pointer-events-none`}
          style={{
            transform: 'translateZ(0.75px)',
            backfaceVisibility: 'hidden',
          }}
        />
        {/* Layer +2px */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl bg-slate-800/30 pointer-events-none`}
          style={{
            transform: 'translateZ(1.5px)',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* --- FRONT OF CARD --- */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/15 backface-hidden bg-gradient-to-br ${cardDesign.gradient}`}
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

          {/* Front Header */}
          <div className="flex justify-between items-start z-10">
            {/* Hologram contact chip & Wireless indicator */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-8 sm:w-12 sm:h-9 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-lg relative overflow-hidden border border-amber-300/30 shadow-inner flex items-center justify-center">
                {/* Chip circuit designs */}
                <div className="absolute inset-x-2 inset-y-1 border border-amber-900/15 rounded" />
                <div className="absolute inset-x-4 inset-y-0.5 border-l border-r border-amber-900/15" />
                <div className="absolute inset-y-3 inset-x-1 border-t border-b border-amber-900/15" />
              </div>
              <Wifi className="w-5 h-5 text-white/70 rotate-90" />
            </div>

            {/* Network Brand */}
            <div className="h-9 flex items-center">
              {cardDesign.logo}
            </div>
          </div>

          {/* Card Number Container */}
          <div className="z-10 mt-5 sm:mt-7">
            <p className="font-mono text-lg sm:text-2xl font-bold tracking-[0.16em] text-white text-shadow drop-shadow-md select-all">
              {displayCardNumber}
            </p>
          </div>

          {/* Front Footer */}
          <div className="flex justify-between items-end z-10">
            {/* Cardholder */}
            <div className="max-w-[70%]">
              <p className="text-[8px] font-mono tracking-widest text-white/40 mb-0.5">CARDHOLDER</p>
              <p className="text-xs sm:text-sm font-sans font-semibold text-white tracking-wide truncate">
                {displayHolderName}
              </p>
            </div>

            {/* Expiry */}
            <div className="text-right">
              <p className="text-[8px] font-mono tracking-widest text-white/40 mb-0.5">EXPIRES</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-white tracking-wider">
                {displayExpiry}
              </p>
            </div>
          </div>
        </div>

        {/* --- BACK OF CARD --- */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl flex flex-col justify-between py-5 overflow-hidden shadow-2xl border border-white/15 backface-hidden bg-gradient-to-br ${cardDesign.gradient}`}
          style={{
            transform: 'translateZ(-3px) rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Magnetic Stripe */}
          <div className="w-full h-11 bg-zinc-950/95 z-10 mt-1" />

          {/* Signature Zone and CVV */}
          <div className="px-5 sm:px-6 z-10 flex flex-col space-y-1">
            <span className="text-[8px] font-mono tracking-widest text-white/40 self-end">AUTHORIZED SIGNATURE</span>
            <div className="flex items-center w-full">
              {/* White Signature panel */}
              <div className="flex-1 h-9 bg-neutral-200 rounded-l flex items-center px-3 italic font-serif text-sm text-neutral-600 select-none bg-[repeating-linear-gradient(45deg,#ccc,#ccc_10px,#ddd_10px,#ddd_20px)]">
                {cardholderName ? cardholderName : 'Smart Cart Secure'}
              </div>
              {/* Highlighted CVV Panel */}
              <div className="bg-amber-400 text-neutral-900 font-mono font-black text-sm h-9 px-3 rounded-r flex items-center justify-center shadow-lg min-w-[55px] border-l border-amber-500">
                {cvv ? cvv : (cardType === 'amex' ? '••••' : '•••')}
              </div>
            </div>
          </div>

          {/* Legal Disclaimer & Network Logo */}
          <div className="px-6 z-10 flex justify-between items-center text-[7px] font-mono text-white/45 leading-relaxed">
            <p className="max-w-[75%] leading-normal">
              This card is properties of issuer and governed by terms of authorization.
              3D Secure authentication sandbox mode active.
            </p>
            <div className="opacity-40">
              {cardDesign.logo}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
