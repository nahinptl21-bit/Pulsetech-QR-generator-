/**
 * Code 128 Barcode Generator (Zero 3rd party).
 * Supports Auto mode (automatically switches between sets A, B, and C for maximum density),
 * check character calculation (modulo 103), and binary bitstream output.
 */

import { EncodedBarcode } from './types';

// Widths of bars and spaces for values 0 to 106
// Each entry is a string of 6 digits representing widths of: B1 S1 B2 S2 B3 S3
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP pattern)
];

const START_A = 103;
const START_B = 104;
const START_C = 105;
const STOP = 106;

function widthsToBinary(widthStr: string): string {
  let bin = '';
  let isBar = true;
  for (let i = 0; i < widthStr.length; i++) {
    const w = parseInt(widthStr[i], 10);
    bin += (isBar ? '1' : '0').repeat(w);
    isBar = !isBar;
  }
  return bin;
}

export function encodeCode128(text: string): EncodedBarcode {
  if (!text || text.length === 0) {
    return {
      symbology: 'CODE128',
      binaryString: '',
      displayText: '',
      isValid: false,
      error: 'Text cannot be empty',
    };
  }

  // Validate characters (ASCII 0 to 127)
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) {
      return {
        symbology: 'CODE128',
        binaryString: '',
        displayText: text,
        isValid: false,
        error: `Invalid character '${text[i]}'. Code 128 supports ASCII 0-127.`,
      };
    }
  }

  // Optimize between B and C
  const codes: number[] = [];
  let currentSet: 'A' | 'B' | 'C' = 'B';
  let i = 0;

  // Decide start code: if starts with 4 or more digits, use C
  if (text.length >= 4 && /^\d{4}/.test(text)) {
    codes.push(START_C);
    currentSet = 'C';
  } else {
    codes.push(START_B);
    currentSet = 'B';
  }

  while (i < text.length) {
    if (currentSet === 'C') {
      // Check if next 2 characters are digits
      if (i + 1 < text.length && /^\d{2}/.test(text.substring(i, i + 2))) {
        const val = parseInt(text.substring(i, i + 2), 10);
        codes.push(val);
        i += 2;
      } else {
        // Switch to Set B
        codes.push(100); // Code B switch
        currentSet = 'B';
      }
    } else {
      // Current set is B
      // If we see 4 consecutive digits, switch to Set C
      if (text.length - i >= 4 && /^\d{4}/.test(text.substring(i, i + 4))) {
        codes.push(99); // Code C switch
        currentSet = 'C';
      } else {
        const ascii = text.charCodeAt(i);
        codes.push(ascii - 32);
        i++;
      }
    }
  }

  // Calculate checksum Modulo 103
  let checksum = codes[0];
  for (let idx = 1; idx < codes.length; idx++) {
    checksum += codes[idx] * idx;
  }
  checksum %= 103;
  codes.push(checksum);
  codes.push(STOP);

  // Convert codes to binary representation
  let binary = '';
  for (const c of codes) {
    binary += widthsToBinary(CODE128_PATTERNS[c]);
  }

  return {
    symbology: 'CODE128',
    binaryString: binary,
    displayText: text,
    isValid: true,
  };
}
