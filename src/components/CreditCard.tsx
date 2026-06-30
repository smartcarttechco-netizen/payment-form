import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { CardType } from '../lib/validation';
import { CreditCard as CardIcon, Wifi } from 'lucide-react';

interface CreditCardProps {
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  cardType: CardType;
  isFlipped: boolean;
  className?: string;
}

export const CreditCard: React.FC<CreditCardProps> = ({
  cardNumber,
  cardholderName,
  expiry,
  cvv,
  cardType,
  isFlipped,
  className = '',
}) => {
  // Format card number with spaces for display
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

  // Choose styling depending on Card Type
  const cardDesign = useMemo(() => {
    switch (cardType) {
      case 'visa':
        return {
          gradient: 'from-blue-600 via-indigo-700 to-slate-950',
          logo: (
            <span className="text-white font-extrabold italic text-2xl tracking-wider select-none">
              VISA
            </span>
          ),
          accent: 'border-blue-400/30 bg-blue-500/10',
          gloss: 'bg-gradient-to-tr from-white/10 to-transparent',
        };
      case 'mastercard':
        return {
          gradient: 'from-[#1e1e1e] via-[#2a2121] to-[#c1372d]/40',
          logo: (
            <div className="flex items-center space-x-[-10px] select-none">
              <div className="w-7 h-7 rounded-full bg-[#eb001b] opacity-90" />
              <div className="w-7 h-7 rounded-full bg-[#ff5f00] opacity-90 mix-blend-screen" />
            </div>
          ),
          accent: 'border-red-500/20 bg-red-500/5',
          gloss: 'bg-gradient-to-tr from-orange-500/10 to-transparent',
        };
      case 'amex':
        return {
          gradient: 'from-emerald-600 via-teal-700 to-slate-900',
          logo: (
            <div className="border border-teal-200/50 bg-teal-900/60 px-2 py-0.5 rounded text-[11px] font-black tracking-widest text-teal-100 select-none">
              AMEX
            </div>
          ),
          accent: 'border-teal-400/30 bg-teal-500/10',
          gloss: 'bg-gradient-to-tr from-emerald-400/10 to-transparent',
        };
      case 'discover':
        return {
          gradient: 'from-orange-500 via-rose-600 to-indigo-950',
          logo: (
            <span className="text-white font-black italic text-lg tracking-wider select-none">
              DISCOVER
            </span>
          ),
          accent: 'border-orange-400/30 bg-orange-500/10',
          gloss: 'bg-gradient-to-tr from-rose-500/15 to-transparent',
        };
      default:
        return {
          gradient: 'from-slate-700 via-zinc-800 to-neutral-950',
          logo: <CardIcon className="w-8 h-8 text-slate-300" />,
          accent: 'border-slate-500/20 bg-slate-500/10',
          gloss: 'bg-gradient-to-tr from-white/5 to-transparent',
        };
    }
  }, [cardType]);

  return (
    <div className={`perspective-1000 w-full max-w-[390px] h-[220px] sm:h-[235px] cursor-pointer group ${className}`}>
      <motion.div
        className="w-full h-full relative preserve-3d duration-700 ease-out"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      >
        {/* --- CARD FRONT --- */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/10 backface-hidden bg-gradient-to-br ${cardDesign.gradient}`}
        >
          {/* Glass Glossy Reflections */}
          <div className={`absolute inset-0 z-0 opacity-60 ${cardDesign.gloss}`} />
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rotate-45 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-y-full group-hover:translate-y-full transition-all duration-[1200ms]" />

          {/* Front Header */}
          <div className="flex justify-between items-start z-10">
            {/* Hologram Chip & Wireless wave */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-8 sm:w-12 sm:h-9 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-lg relative overflow-hidden border border-amber-300/30 shadow-inner flex items-center justify-center">
                {/* Chip internal circuit lines */}
                <div className="absolute inset-x-2 inset-y-1 border border-amber-900/15 rounded" />
                <div className="absolute inset-x-4 inset-y-0.5 border-l border-r border-amber-900/15" />
                <div className="absolute inset-y-3 inset-x-1 border-t border-b border-amber-900/15" />
              </div>
              <Wifi className="w-5 h-5 text-white/70 rotate-90" />
            </div>

            {/* Card Logo */}
            <div className="h-9 flex items-center">
              {cardDesign.logo}
            </div>
          </div>

          {/* Card Number display */}
          <div className="z-10 mt-6 sm:mt-8">
            <p className="font-mono text-lg sm:text-2xl font-medium tracking-[0.18em] text-white text-shadow drop-shadow-md select-all" dir="ltr">
              {displayCardNumber}
            </p>
          </div>

          {/* Front Footer */}
          <div className="flex justify-between items-end z-10">
            {/* Cardholder */}
            <div className="max-w-[70%]">
              <p className="text-[9px] font-mono tracking-widest text-white/50 mb-0.5">CARDHOLDER</p>
              <p className="text-xs sm:text-sm font-sans font-medium text-white tracking-wide truncate">
                {displayHolderName}
              </p>
            </div>

            {/* Expiry */}
            <div className="text-right">
              <p className="text-[9px] font-mono tracking-widest text-white/50 mb-0.5">EXPIRES</p>
              <p className="text-xs sm:text-sm font-mono font-medium text-white tracking-wider" dir="ltr">
                {displayExpiry}
              </p>
            </div>
          </div>
        </div>

        {/* --- CARD BACK --- */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl flex flex-col justify-between py-6 overflow-hidden shadow-2xl border border-white/10 backface-hidden rotate-y-180 bg-gradient-to-br ${cardDesign.gradient}`}
        >
          {/* Back Magnetic Strip */}
          <div className="w-full h-11 bg-zinc-950/90 z-10" />

          {/* Signature Strip & CVV */}
          <div className="px-5 sm:px-6 z-10 flex flex-col space-y-1">
            <span className="text-[8px] font-mono tracking-widest text-white/40 self-end">AUTHORIZED SIGNATURE</span>
            <div className="flex items-center w-full">
              {/* White signature zone */}
              <div className="flex-1 h-9 bg-neutral-200 rounded-l flex items-center px-3 italic font-serif text-sm text-neutral-600 select-none">
                {cardholderName ? cardholderName : 'Smart Cart Payment'}
              </div>
              {/* Boxed CVV */}
              <div className="bg-amber-400 text-neutral-900 font-mono font-bold text-sm h-9 px-3 rounded-r flex items-center justify-center shadow-lg min-w-[50px] border-l border-amber-500">
                {cvv ? cvv : (cardType === 'amex' ? '••••' : '•••')}
              </div>
            </div>
          </div>

          {/* Disclaimer & Footer */}
          <div className="px-6 z-10 flex justify-between items-center text-[7px] font-mono text-white/40 leading-relaxed">
            <p className="max-w-[70%]">
              This card is property of issuer and governed by standard agreements.
              Mock 3D card for validation testing.
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
