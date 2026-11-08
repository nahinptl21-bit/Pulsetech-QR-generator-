/**
 * EAN-13 and UPC-A Barcode Generators (Zero 3rd party).
 * Includes automatic Modulo-10 check digit computation and parity encoding.
 */

import { EncodedBarcode } from './types';

// L-code, G-code, R-code patterns (7 modules each)
const L_CODES = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];

const G_CODES = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111',
];

const R_CODES = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100',
];

// First digit parity selector for left 6 digits (L = 0, G = 1)
const PARITY_MAP = [
  '000000', // 0: LLLLLL
  '001011', // 1: LLGLGG
  '001101', // 2: LLGGLG
  '001110', // 3: LLGGGL
  '010011', // 4: LGLLGG
  '011001', // 5: LGGLLG
  '011100', // 6: LGGGLL
  '010101', // 7: LGLGLG
  '010110', // 8: LGLGGL
  '011010', // 9: LGGLGL
];

export function calculateEanCheckDigit(digits12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits12[i], 10);
    // 1-indexed odd: weight 1, even: weight 3
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

export function encodeEan13(input: string): EncodedBarcode {
  const digits = input.replace(/\D/g, '');

  if (digits.length !== 12 && digits.length !== 13) {
    return {
      symbology: 'EAN13',
      binaryString: '',
      displayText: input,
      isValid: false,
      error: 'EAN-13 requires exactly 12 or 13 numeric digits.',
    };
  }

  let full13 = digits;
  if (digits.length === 12) {
    const check = calculateEanCheckDigit(digits);
    full13 = digits + check;
  } else {
    // Validate existing check digit
    const calculatedCheck = calculateEanCheckDigit(digits.substring(0, 12));
    const actualCheck = parseInt(digits[12], 10);
    if (calculatedCheck !== actualCheck) {
      return {
        symbology: 'EAN13',
        binaryString: '',
        displayText: input,
        isValid: false,
        error: `Invalid check digit: expected ${calculatedCheck}, got ${actualCheck}.`,
      };
    }
  }

  const firstDigit = parseInt(full13[0], 10);
  const parity = PARITY_MAP[firstDigit];

  // Start Guard Pattern (101)
  let binary = '101';

  // Left 6 digits
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(full13[i + 1], 10);
    const useG = parity[i] === '1';
    binary += useG ? G_CODES[digit] : L_CODES[digit];
  }

  // Center Guard Pattern (01010)
  binary += '01010';

  // Right 6 digits
  for (let i = 7; i < 13; i++) {
    const digit = parseInt(full13[i], 10);
    binary += R_CODES[digit];
  }

  // End Guard Pattern (101)
  binary += '101';

  return {
    symbology: 'EAN13',
    binaryString: binary,
    displayText: full13,
    isValid: true,
  };
}

export function encodeUpcA(input: string): EncodedBarcode {
  const digits = input.replace(/\D/g, '');

  if (digits.length !== 11 && digits.length !== 12) {
    return {
      symbology: 'UPCA',
      binaryString: '',
      displayText: input,
      isValid: false,
      error: 'UPC-A requires exactly 11 or 12 numeric digits.',
    };
  }

  // UPC-A is equivalent to EAN-13 with a leading zero
  const eanEquivalent = '0' + (digits.length === 11 ? digits : digits.substring(0, 11));
  const eanRes = encodeEan13(eanEquivalent);

  if (!eanRes.isValid) {
    return {
      symbology: 'UPCA',
      binaryString: '',
      displayText: input,
      isValid: false,
      error: eanRes.error,
    };
  }

  const upc12 = eanRes.displayText.substring(1);
  return {
    symbology: 'UPCA',
    binaryString: eanRes.binaryString,
    displayText: upc12,
    isValid: true,
  };
}
