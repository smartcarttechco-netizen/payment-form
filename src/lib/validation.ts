/**
 * Credit Card Validation & Formatting Utilities
 * Includes Luhn Algorithm, Card Type Detection, and Input Formatters.
 */

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

/**
 * Validates a card number using the Luhn Algorithm (Mod 10)
 */
export function validateLuhn(cardNumber: string): boolean {
  const digitsOnly = (cardNumber || '').replace(/\D/g, '');
  if (digitsOnly.length < 13 || digitsOnly.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  // Loop from right to left
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Detects the card network/type based on the starting digits
 */
export function getCardType(cardNumber: string): CardType {
  const clean = (cardNumber || '').replace(/\D/g, '');
  
  if (/^4/.test(clean)) return 'visa';
  if (/^5[1-5]/.test(clean) || /^2(22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[0-1][0-9]|720)/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^(6011|65|64[4-9]|622)/.test(clean)) return 'discover';
  
  return 'unknown';
}

/**
 * Formats the raw card number string to readable spaced blocks
 * - American Express uses 4-6-5 layout (e.g. 1234 567890 12345)
 * - Visa, Mastercard, Discover, etc. use 4-4-4-4 layout
 */
export function formatCardNumber(value: string, cardType: CardType): string {
  const clean = (value || '').replace(/\D/g, '');
  
  if (cardType === 'amex') {
    // 15 digits total, format: 4-6-5
    const match = clean.match(/^(\d{1,4})(\d{1,6})?(\d{1,5})?$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join(' ');
    }
  } else {
    // 16 digits total, format: 4-4-4-4
    const parts = [];
    for (let i = 0; i < clean.length; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    return parts.join(' ');
  }
  
  return clean;
}

/**
 * Validates expiration date (MM/YY) and ensures it is in the future
 */
export function validateExpiry(expiry: string): boolean {
  const clean = expiry || '';
  if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(clean)) {
    return false;
  }

  const [monthStr, yearStr] = clean.split('/');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10) + 2000; // Assuming 20XX

  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-indexed
  const currentYear = today.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

/**
 * Validates CVV length (4 for Amex, 3 for others)
 */
export function validateCVV(cvv: string, cardType: CardType): boolean {
  const clean = (cvv || '').replace(/\D/g, '');
  const requiredLength = cardType === 'amex' ? 4 : 3;
  return clean.length === requiredLength;
}

/**
 * Validates cardholder name (letters, spaces, dots, hyphens only, min 2 chars)
 */
export function validateName(name: string): boolean {
  const clean = (name || '').trim();
  if (clean.length < 2) return false;
  return /^[a-zA-Z\s.\-]+$/.test(clean);
}

export interface SaudiBank {
  name: string;
  nameAr: string;
  gradient: string;
  accent: string;
  edgeColor: string;
  shimmer: string;
}

const SAUDI_BINS: { [key: string]: SaudiBank } = {
  // Al Rajhi Bank
  '446672': { name: 'Al Rajhi Bank', nameAr: 'مصرف الراجحي', gradient: 'from-[#004B87] via-[#003366] to-[#001F3F]', accent: 'border-amber-400/35 bg-amber-500/10', edgeColor: 'bg-[#002D54] border-amber-600/30', shimmer: 'bg-amber-400/10' },
  '458837': { name: 'Al Rajhi Bank', nameAr: 'مصرف الراجحي', gradient: 'from-[#004B87] via-[#003366] to-[#001F3F]', accent: 'border-amber-400/35 bg-amber-500/10', edgeColor: 'bg-[#002D54] border-amber-600/30', shimmer: 'bg-amber-400/10' },
  '458838': { name: 'Al Rajhi Bank', nameAr: 'مصرف الراجحي', gradient: 'from-[#004B87] via-[#003366] to-[#001F3F]', accent: 'border-amber-400/35 bg-amber-500/10', edgeColor: 'bg-[#002D54] border-amber-600/30', shimmer: 'bg-amber-400/10' },
  '506968': { name: 'Al Rajhi Bank', nameAr: 'مصرف الراجحي', gradient: 'from-[#004B87] via-[#003366] to-[#001F3F]', accent: 'border-amber-400/35 bg-amber-500/10', edgeColor: 'bg-[#002D54] border-amber-600/30', shimmer: 'bg-amber-400/10' },
  '409201': { name: 'Al Rajhi Bank', nameAr: 'مصرف الراجحي', gradient: 'from-[#004B87] via-[#003366] to-[#001F3F]', accent: 'border-amber-400/35 bg-amber-500/10', edgeColor: 'bg-[#002D54] border-amber-600/30', shimmer: 'bg-amber-400/10' },
  
  // Urpay
  '465161': { name: 'Urpay', nameAr: 'يورباي', gradient: 'from-[#2c003e] via-[#1a0029] to-[#0f001b]', accent: 'border-[#caff33]/40 bg-[#caff33]/10', edgeColor: 'bg-[#1a0029] border-[#caff33]/20', shimmer: 'bg-[#caff33]/10' },
  
  // SNB (AlAhli)
  '403024': { name: 'SNB (AlAhli)', nameAr: 'البنك الأهلي السعودي', gradient: 'from-[#00522B] via-[#003B1E] to-[#001F0F]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#002B16] border-emerald-700/50', shimmer: 'bg-amber-400/10' },
  '430856': { name: 'SNB (AlAhli)', nameAr: 'البنك الأهلي السعودي', gradient: 'from-[#00522B] via-[#003B1E] to-[#001F0F]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#002B16] border-emerald-700/50', shimmer: 'bg-amber-400/10' },
  '432328': { name: 'SNB (AlAhli)', nameAr: 'البنك الأهلي السعودي', gradient: 'from-[#00522B] via-[#003B1E] to-[#001F0F]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#002B16] border-emerald-700/50', shimmer: 'bg-amber-400/10' },
  '588847': { name: 'SNB (AlAhli)', nameAr: 'البنك الأهلي السعودي', gradient: 'from-[#00522B] via-[#003B1E] to-[#001F0F]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#002B16] border-emerald-700/50', shimmer: 'bg-amber-400/10' },

  // Riyad Bank
  '440662': { name: 'Riyad Bank', nameAr: 'بنك الرياض', gradient: 'from-[#003A63] via-[#002040] to-[#e85a06]/80', accent: 'border-orange-400/35 bg-orange-500/10', edgeColor: 'bg-[#001F36] border-orange-600/30', shimmer: 'bg-orange-400/10' },
  '440733': { name: 'Riyad Bank', nameAr: 'بنك الرياض', gradient: 'from-[#003A63] via-[#002040] to-[#e85a06]/80', accent: 'border-orange-400/35 bg-orange-500/10', edgeColor: 'bg-[#001F36] border-orange-600/30', shimmer: 'bg-orange-400/10' },
  '403486': { name: 'Riyad Bank', nameAr: 'بنك الرياض', gradient: 'from-[#003A63] via-[#002040] to-[#e85a06]/80', accent: 'border-orange-400/35 bg-orange-500/10', edgeColor: 'bg-[#001F36] border-orange-600/30', shimmer: 'bg-orange-400/10' },

  // Alinma Bank
  '446393': { name: 'Alinma Bank', nameAr: 'مصرف الإنماء', gradient: 'from-[#78350f] via-[#451a03] to-[#92400e]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#451a03] border-amber-500/30', shimmer: 'bg-amber-400/10' },
  '405430': { name: 'Alinma Bank', nameAr: 'مصرف الإنماء', gradient: 'from-[#78350f] via-[#451a03] to-[#92400e]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#451a03] border-amber-500/30', shimmer: 'bg-amber-400/10' },
  '446394': { name: 'Alinma Bank', nameAr: 'مصرف الإنماء', gradient: 'from-[#78350f] via-[#451a03] to-[#92400e]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#451a03] border-amber-500/30', shimmer: 'bg-amber-400/10' },
  '462220': { name: 'Alinma Bank', nameAr: 'مصرف الإنماء', gradient: 'from-[#78350f] via-[#451a03] to-[#92400e]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#451a03] border-amber-500/30', shimmer: 'bg-amber-400/10' },

  // SAB
  '407520': { name: 'SAB', nameAr: 'البنك الأول SAB', gradient: 'from-[#001A1A] via-[#004D40] to-[#00261C]', accent: 'border-teal-400/30 bg-teal-500/10', edgeColor: 'bg-[#00261C] border-teal-500/30', shimmer: 'bg-teal-400/10' },
  '445564': { name: 'SAB', nameAr: 'البنك الأول SAB', gradient: 'from-[#001A1A] via-[#004D40] to-[#00261C]', accent: 'border-teal-400/30 bg-teal-500/10', edgeColor: 'bg-[#00261C] border-teal-500/30', shimmer: 'bg-teal-400/10' },
  '451271': { name: 'SAB', nameAr: 'البنك الأول SAB', gradient: 'from-[#001A1A] via-[#004D40] to-[#00261C]', accent: 'border-teal-400/30 bg-teal-500/10', edgeColor: 'bg-[#00261C] border-teal-500/30', shimmer: 'bg-teal-400/10' },

  // Bank Albilad
  '406996': { name: 'Bank Albilad', nameAr: 'بنك البلاد', gradient: 'from-[#0B3C5D] via-[#1D2731] to-[#328CC1]', accent: 'border-yellow-400/30 bg-yellow-500/10', edgeColor: 'bg-[#1D2731] border-yellow-500/30', shimmer: 'bg-yellow-400/10' },
  '446960': { name: 'Bank Albilad', nameAr: 'بنك البلاد', gradient: 'from-[#0B3C5D] via-[#1D2731] to-[#328CC1]', accent: 'border-yellow-400/30 bg-yellow-500/10', edgeColor: 'bg-[#1D2731] border-yellow-500/30', shimmer: 'bg-yellow-400/10' },
  '454441': { name: 'Bank Albilad', nameAr: 'بنك البلاد', gradient: 'from-[#0B3C5D] via-[#1D2731] to-[#328CC1]', accent: 'border-yellow-400/30 bg-yellow-500/10', edgeColor: 'bg-[#1D2731] border-yellow-500/30', shimmer: 'bg-yellow-400/10' },

  // ANB
  '401757': { name: 'ANB', nameAr: 'البنك العربي الوطني', gradient: 'from-[#0A3D2D] via-[#051E16] to-[#123024]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#051E16] border-[#0A3D2D]/30', shimmer: 'bg-amber-400/10' },
  '417633': { name: 'ANB', nameAr: 'البنك العربي الوطني', gradient: 'from-[#0A3D2D] via-[#051E16] to-[#123024]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#051E16] border-[#0A3D2D]/30', shimmer: 'bg-amber-400/10' },
  '410685': { name: 'ANB', nameAr: 'البنك العربي الوطني', gradient: 'from-[#0A3D2D] via-[#051E16] to-[#123024]', accent: 'border-amber-400/30 bg-amber-500/10', edgeColor: 'bg-[#051E16] border-[#0A3D2D]/30', shimmer: 'bg-amber-400/10' },

  // STC Pay
  '450817': { name: 'STC Pay', nameAr: 'stc pay', gradient: 'from-[#4f1061] via-[#751080] to-[#200024]', accent: 'border-pink-400/30 bg-pink-500/10', edgeColor: 'bg-[#200024] border-pink-500/30', shimmer: 'bg-pink-400/10' },
  '418331': { name: 'STC Pay', nameAr: 'stc pay', gradient: 'from-[#4f1061] via-[#751080] to-[#200024]', accent: 'border-pink-400/30 bg-pink-500/10', edgeColor: 'bg-[#200024] border-pink-500/30', shimmer: 'bg-pink-400/10' },

  // Mobily Pay
  '535825': { name: 'Mobily Pay', nameAr: 'mobily pay', gradient: 'from-[#005A9C] via-[#0087CD] to-[#002D54]', accent: 'border-sky-300/30 bg-sky-400/10', edgeColor: 'bg-[#002D54] border-[#005A9C]/30', shimmer: 'bg-sky-300/10' }
};

export function getSaudiBankByNumber(cardNumber: string): SaudiBank | null {
  const clean = (cardNumber || '').replace(/\D/g, '');
  if (clean.length < 6) return null;
  const bin = clean.substring(0, 6);
  return SAUDI_BINS[bin] || null;
}
