/**
 * Codabar (NW-7) Barcode Generator (Zero 3rd party).
 * Supported characters: 0-9, -, $, :, /, ., +
 * Start/stop characters: A, B, C, D
 */

import { EncodedBarcode } from './types';

// Widths: 7 elements (B S B S B S B). '0' = narrow, '1' = wide.
const CODABAR_MAP: Record<string, string> = {
  '0': '0000011',
  '1': '0000110',
  '2': '0001001',
  '3': '1100000',
  '4': '0010010',
  '5': '1000010',
  '6': '0100001',
  '7': '0100100',
  '8': '0110000',
  '9': '1001000',
  '-': '0001100',
  '$': '0011000',
  ':': '1000101',
  '/': '1010001',
  '.': '1010100',
  '+': '0010101',
  'A': '0011010',
  'B': '0101001',
  'C': '0001011',
  'D': '0001110',
};

export function encodeCodabar(rawInput: string): EncodedBarcode {
  let text = rawInput.trim().toUpperCase();

  if (!text || text.length === 0) {
    return {
      symbology: 'CODABAR',
      binaryString: '',
      displayText: '',
      isValid: false,
      error: 'Text cannot be empty.',
    };
  }

  // Ensure start/stop characters exist (default to 'A' if missing)
  const startsWithGuard = ['A', 'B', 'C', 'D'].includes(text[0]);
  const endsWithGuard = ['A', 'B', 'C', 'D'].includes(text[text.length - 1]);

  if (!startsWithGuard) text = 'A' + text;
  if (!endsWithGuard) text = text + 'A';

  // Validate characters
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!CODABAR_MAP[ch]) {
      return {
        symbology: 'CODABAR',
        binaryString: '',
        displayText: text,
        isValid: false,
        error: `Character '${ch}' not supported in Codabar. Allowed: 0-9, -, $, :, /, ., + and start/stop A, B, C, D.`,
      };
    }
  }

  let binary = '';
  for (let i = 0; i < text.length; i++) {
    const pattern = CODABAR_MAP[text[i]];
    for (let j = 0; j < 7; j++) {
      const isBar = j % 2 === 0;
      const isWide = pattern[j] === '1';
      binary += (isBar ? '1' : '0').repeat(isWide ? 2 : 1);
    }
    // Inter-character gap: 1 narrow space
    if (i < text.length - 1) {
      binary += '0';
    }
  }

  return {
    symbology: 'CODABAR',
    binaryString: binary,
    displayText: text,
    isValid: true,
  };
}
