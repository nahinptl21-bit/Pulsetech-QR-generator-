/**
 * Interleaved 2 of 5 (ITF) Barcode Generator (Zero 3rd party).
 * Pairs two digits: one in bars, one in spaces.
 * Requires even number of digits (prepends '0' if odd).
 */

import { EncodedBarcode } from './types';

// 5 elements (2 wide '1', 3 narrow '0')
const ITF_PATTERNS: Record<string, string> = {
  '0': '00110',
  '1': '10001',
  '2': '01001',
  '3': '11000',
  '4': '00101',
  '5': '10100',
  '6': '01100',
  '7': '00011',
  '8': '10010',
  '9': '01010',
};

export function encodeITF(input: string): EncodedBarcode {
  let digits = input.replace(/\D/g, '');

  if (!digits || digits.length === 0) {
    return {
      symbology: 'ITF',
      binaryString: '',
      displayText: '',
      isValid: false,
      error: 'ITF requires numeric digits.',
    };
  }

  // ITF requires an even number of digits; pad with leading zero if odd
  if (digits.length % 2 !== 0) {
    digits = '0' + digits;
  }

  // Start pattern: narrow bar, narrow space, narrow bar, narrow space (1010)
  let binary = '1010';

  // Process pairs
  for (let i = 0; i < digits.length; i += 2) {
    const barDigit = digits[i];
    const spaceDigit = digits[i + 1];

    const barPattern = ITF_PATTERNS[barDigit];
    const spacePattern = ITF_PATTERNS[spaceDigit];

    for (let j = 0; j < 5; j++) {
      const barWidth = barPattern[j] === '1' ? 2 : 1;
      const spaceWidth = spacePattern[j] === '1' ? 2 : 1;
      binary += '1'.repeat(barWidth);
      binary += '0'.repeat(spaceWidth);
    }
  }

  // Stop pattern: wide bar, narrow space, narrow bar (1101)
  binary += '1101';

  return {
    symbology: 'ITF',
    binaryString: binary,
    displayText: digits,
    isValid: true,
  };
}
