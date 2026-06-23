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
