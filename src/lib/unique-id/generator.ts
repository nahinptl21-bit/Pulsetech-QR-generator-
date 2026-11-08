/**
 * Unique Code and ID Generator Engine (Zero 3rd party).
 * Pure client-side cryptographically secure generators:
 * - UUID v4 & UUID v7 (time-ordered sortable)
 * - NanoID & Secure Tokens with customizable alphabets (Human-safe / ambiguity-free)
 * - SKU & Asset Inventory Tags
 * - Pattern Mask Serial Numbers (e.g., SN-####-@@@@-????)
 * - Valid EAN-13 / UPC-A random commercial barcode numbers
 * - Batch generation with guaranteed uniqueness
 */

export type IdType =
  | 'UUID_V4'
  | 'UUID_V7'
  | 'NANOID'
  | 'SKU'
  | 'SERIAL_MASK'
  | 'VOUCHER_PIN'
  | 'EAN13_VALID'
  | 'SHORT_UUID';

export interface SkuOptions {
  prefix?: string; // e.g. "PRD"
  category?: string; // e.g. "ELEC"
  includeDate?: boolean; // YYYYMMDD
  separator?: string; // "-" or "_"
  counterType?: 'sequential' | 'random';
  startCounter?: number;
  randomLength?: number;
  suffix?: string;
}

export interface MaskOptions {
  mask: string; // e.g. "SN-####-@@@@-????"
  uppercase?: boolean;
}

export interface NanoIdOptions {
  length?: number;
  alphabetType?: 'url-safe' | 'alphanumeric' | 'human-safe' | 'numeric' | 'hex';
  customAlphabet?: string;
}

export interface VoucherOptions {
  chunks?: number; // e.g. 3 chunks
  chunkLength?: number; // e.g. 4 chars per chunk -> XXXX-XXXX-XXXX
  charset?: 'numeric' | 'alphanumeric' | 'human-safe';
  separator?: string;
}

export interface GeneratedIdItem {
  id: string;
  type: IdType;
  createdAt: number;
  metadata?: Record<string, any>;
}

// Ambiguity-free alphabet (removes 0, O, 1, I, l)
export const ALPHABETS = {
  urlSafe: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-',
  alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  humanSafe: '23456789ABCDEFGHJKLMNPQRSTUVWXYZ', // No 0, O, 1, I, l
  numeric: '0123456789',
  hex: '0123456789abcdef',
  base58: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
};

// Cryptographically secure random integer in range [0, max - 1]
function getRandomInt(max: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

// Generate secure random bytes
function getRandomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < count; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

// 1. UUID v4 (RFC 4122)
export function generateUuidV4(): string {
  const bytes = getRandomBytes(16);
  // Set version 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant 10xx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

// 2. UUID v7 (RFC 9562 - Time-Ordered Sortable UUID)
export function generateUuidV7(timestampMs = Date.now()): string {
  const bytes = getRandomBytes(16);

  // 48-bit timestamp
  const ts = BigInt(timestampMs);
  bytes[0] = Number((ts >> 40n) & 0xffn);
  bytes[1] = Number((ts >> 32n) & 0xffn);
  bytes[2] = Number((ts >> 24n) & 0xffn);
  bytes[3] = Number((ts >> 16n) & 0xffn);
  bytes[4] = Number((ts >> 8n) & 0xffn);
  bytes[5] = Number(ts & 0xffn);

  // Set version 7 (0111)
  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  // Set variant 10xx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

// 3. Short UUID (Base58 / Base62)
export function generateShortUuid(): string {
  const bytes = getRandomBytes(16);
  const alphabet = ALPHABETS.base58;
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += alphabet[bytes[i] % alphabet.length];
  }
  // Add 4 more chars for 20-char high entropy
  for (let i = 0; i < 4; i++) {
    str += alphabet[getRandomInt(alphabet.length)];
  }
  return str;
}

// 4. NanoID / Secure Token
export function generateNanoId(options: NanoIdOptions = {}): string {
  const { length = 16, alphabetType = 'url-safe', customAlphabet } = options;

  let alphabet = ALPHABETS.urlSafe;
  if (customAlphabet && customAlphabet.length > 0) {
    alphabet = customAlphabet;
  } else if (alphabetType === 'alphanumeric') {
    alphabet = ALPHABETS.alphanumeric;
  } else if (alphabetType === 'human-safe') {
    alphabet = ALPHABETS.humanSafe;
  } else if (alphabetType === 'numeric') {
    alphabet = ALPHABETS.numeric;
  } else if (alphabetType === 'hex') {
    alphabet = ALPHABETS.hex;
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[getRandomInt(alphabet.length)];
  }
  return result;
}

// 5. SKU & Asset Tag Generator
export function generateSku(options: SkuOptions = {}, sequenceIndex = 1): string {
  const {
    prefix = 'SKU',
    category = 'GEN',
    includeDate = true,
    separator = '-',
    counterType = 'sequential',
    startCounter = 1,
    randomLength = 4,
    suffix = '',
  } = options;

  const parts: string[] = [];

  if (prefix.trim()) parts.push(prefix.trim().toUpperCase());
  if (category.trim()) parts.push(category.trim().toUpperCase());

  if (includeDate) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    parts.push(`${yyyy}${mm}${dd}`);
  }

  if (counterType === 'sequential') {
    const num = (startCounter || 1) + sequenceIndex - 1;
    parts.push(String(num).padStart(4, '0'));
  } else {
    let rand = '';
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < randomLength; i++) {
      rand += chars[getRandomInt(chars.length)];
    }
    parts.push(rand);
  }

  if (suffix.trim()) parts.push(suffix.trim().toUpperCase());

  return parts.join(separator);
}

// 6. Pattern Mask Serial Number Generator
// # = digit, @ = uppercase letter, $ = lowercase letter, ? = alphanumeric, * = human-safe char
export function generateFromMask(mask: string, uppercase = true): string {
  let result = '';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerLetters = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const alphaNum = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const safeChars = ALPHABETS.humanSafe;

  for (let i = 0; i < mask.length; i++) {
    const ch = mask[i];
    if (ch === '\\' && i + 1 < mask.length) {
      // Escape next char
      result += mask[i + 1];
      i++;
    } else if (ch === '#') {
      result += digits[getRandomInt(digits.length)];
    } else if (ch === '@') {
      result += letters[getRandomInt(letters.length)];
    } else if (ch === '$') {
      result += lowerLetters[getRandomInt(lowerLetters.length)];
    } else if (ch === '?') {
      result += alphaNum[getRandomInt(alphaNum.length)];
    } else if (ch === '*') {
      result += safeChars[getRandomInt(safeChars.length)];
    } else {
      result += ch;
    }
  }

  return uppercase ? result.toUpperCase() : result;
}

// 7. Voucher / PIN Generator (e.g. 4920-8192-3301)
export function generateVoucherPin(options: VoucherOptions = {}): string {
  const { chunks = 3, chunkLength = 4, charset = 'human-safe', separator = '-' } = options;

  let alphabet = ALPHABETS.humanSafe;
  if (charset === 'numeric') alphabet = ALPHABETS.numeric;
  else if (charset === 'alphanumeric') alphabet = ALPHABETS.alphanumeric;

  const chunkList: string[] = [];
  for (let c = 0; c < chunks; c++) {
    let chunk = '';
    for (let i = 0; i < chunkLength; i++) {
      chunk += alphabet[getRandomInt(alphabet.length)];
    }
    chunkList.push(chunk);
  }

  return chunkList.join(separator);
}

// 8. Valid EAN-13 Commercial Barcode Generator
export function generateValidEan13(countryPrefix = '200'): string {
  let body = countryPrefix;
  while (body.length < 12) {
    body += getRandomInt(10).toString();
  }
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(body[i], 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return body + check.toString();
}

// 9. Batch Generator
export interface BatchGeneratorConfig {
  type: IdType;
  count: number; // 1 to 500
  skuOptions?: SkuOptions;
  maskOptions?: MaskOptions;
  nanoidOptions?: NanoIdOptions;
  voucherOptions?: VoucherOptions;
}

export function generateBatch(config: BatchGeneratorConfig): GeneratedIdItem[] {
  const { type, count = 10 } = config;
  const safeCount = Math.max(1, Math.min(500, count));
  const seen = new Set<string>();
  const items: GeneratedIdItem[] = [];

  let attempts = 0;
  const maxAttempts = safeCount * 10;

  while (items.length < safeCount && attempts < maxAttempts) {
    attempts++;
    let id = '';

    switch (type) {
      case 'UUID_V4':
        id = generateUuidV4();
        break;
      case 'UUID_V7':
        id = generateUuidV7();
        break;
      case 'SHORT_UUID':
        id = generateShortUuid();
        break;
      case 'NANOID':
        id = generateNanoId(config.nanoidOptions);
        break;
      case 'SKU':
        id = generateSku(config.skuOptions, items.length + 1);
        break;
      case 'SERIAL_MASK':
        id = generateFromMask(config.maskOptions?.mask || 'SN-####-@@@@-????', config.maskOptions?.uppercase ?? true);
        break;
      case 'VOUCHER_PIN':
        id = generateVoucherPin(config.voucherOptions);
        break;
      case 'EAN13_VALID':
        id = generateValidEan13('200');
        break;
      default:
        id = generateNanoId();
    }

    if (!seen.has(id)) {
      seen.add(id);
      items.push({
        id,
        type,
        createdAt: Date.now(),
      });
    }
  }

  return items;
}
