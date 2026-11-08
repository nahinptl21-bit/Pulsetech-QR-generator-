/**
 * Code 39 Barcode Generator (Zero 3rd party).
 * Supports standard uppercase alphanumeric characters and symbols,
 * start/stop delimiter (*), and optional modulo 43 checksum.
 */

import { EncodedBarcode } from './types';

// Widths: 9 elements (B S B S B S B S B). '0' = narrow, '1' = wide.
const CODE39_MAP: Record<string, string> = {
  '0': '000110100',
  '1': '100100001',
  '2': '001100001',
  '3': '101100000',
  '4': '000110001',
  '5': '100110000',
  '6': '001110000',
  '7': '000100101',
  '8': '100100100',
  '9': '001100100',
  'A': '100001001',
  'B': '001001001',
  'C': '101001000',
  'D': '000011001',
  'E': '100011000',
  'F': '001011000',
  'G': '000001101',
  'H': '100001100',
  'I': '001001100',
  'J': '000011100',
  'K': '100000011',
  'L': '001000011',
  'M': '101000010',
  'N': '000010011',
  'O': '100010010',
  'P': '001010010',
  'Q': '000000111',
  'R': '100000110',
  'S': '001000110',
  'T': '000010110',
  'U': '110000001',
  'V': '011000001',
  'W': '111000000',
  'X': '010010001',
  'Y': '110010000',
  'Z': '011010000',
  '-': '010000101',
  '.': '110000100',
  ' ': '011000100',
  '$': '010101000',
  '/': '010100010',
  '+': '010001010',
  '%': '000101010',
  '*': '010010100',
};

const CODE39_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';

export function encodeCode39(rawText: string, includeChecksum = false): EncodedBarcode {
  const text = rawText.toUpperCase();

  if (!text || text.length === 0) {
    return {
      symbology: 'CODE39',
      binaryString: '',
      displayText: '',
      isValid: false,
      error: 'Text cannot be empty',
    };
  }

  // Validate characters
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char !== '*' && !CODE39_MAP[char]) {
      return {
        symbology: 'CODE39',
        binaryString: '',
        displayText: text,
        isValid: false,
        error: `Character '${char}' is not supported in Code 39. Only A-Z, 0-9, and - . $ / + % [space] allowed.`,
      };
    }
  }

  let processed = text.replace(/^\*|\*$/g, ''); // strip any manual start/stop

  if (includeChecksum) {
    let sum = 0;
    for (let i = 0; i < processed.length; i++) {
      sum += CODE39_CHARS.indexOf(processed[i]);
    }
    const checkChar = CODE39_CHARS[sum % 43];
    processed += checkChar;
  }

  // Build binary string: Start with '*'
  const fullSequence = '*' + processed + '*';
  let binary = '';

  for (let i = 0; i < fullSequence.length; i++) {
    const pattern = CODE39_MAP[fullSequence[i]];
    if (!pattern) continue;

    for (let el = 0; el < 9; el++) {
      const isBar = el % 2 === 0;
      const isWide = pattern[el] === '1';
      const width = isWide ? 2 : 1; // 2:1 ratio for compact scanability
      binary += (isBar ? '1' : '0').repeat(width);
    }

    // Inter-character gap: 1 narrow space between characters
    if (i < fullSequence.length - 1) {
      binary += '0';
    }
  }

  return {
    symbology: 'CODE39',
    binaryString: binary,
    displayText: '*' + processed + '*',
    isValid: true,
  };
}
