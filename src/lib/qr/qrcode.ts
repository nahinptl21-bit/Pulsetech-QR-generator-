/**
 * Zero 3rd-party, standard-compliant QR Code Generator (ISO/IEC 18004).
 * Completely self-contained TypeScript implementation.
 * Supports Byte (UTF-8), Numeric, Alphanumeric modes with Reed-Solomon error correction (L, M, Q, H).
 */

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QRCodeOptions {
  errorCorrectionLevel?: ErrorCorrectionLevel;
  version?: number; // 1-40 or 0 for auto
  maskPattern?: number; // 0-7 or -1 for auto
}

export interface QRMatrix {
  size: number;
  modules: boolean[][];
  isReserved: boolean[][];
  version: number;
  ecLevel: ErrorCorrectionLevel;
}

// Galois Field GF(256) tables with primitive polynomial 0x11D
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
  }
  LOG_TABLE[0] = 0; // undefined mathematically, 0 for safety
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

// Polynomial multiplication in GF(256)
function polyMultiply(p1: Uint8Array, p2: Uint8Array): Uint8Array {
  const result = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

// Compute generator polynomial for given degree
function getGeneratorPoly(degree: number): Uint8Array {
  let poly: Uint8Array<ArrayBufferLike> = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    poly = polyMultiply(poly, new Uint8Array([1, EXP_TABLE[i]]));
  }
  return poly as Uint8Array;
}

// Compute Reed-Solomon error correction codewords
function rsEncode(data: Uint8Array, numEcBytes: number): Uint8Array {
  const gen = getGeneratorPoly(numEcBytes);
  const remainder = new Uint8Array(numEcBytes);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < numEcBytes - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[numEcBytes - 1] = gfMul(gen[numEcBytes], factor);
  }

  return remainder;
}

// Alignment pattern center coordinates for QR versions 1 to 40
const ALIGNMENT_PATTERN_TABLE: number[][] = [
  [], // V1 has none
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

// EC specs: [totalDataCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataBytesPerBlockGroup1, numBlocksGroup2, dataBytesPerBlockGroup2]
type ECSpec = [number, number, number, number, number, number];

const EC_TABLE: Record<ErrorCorrectionLevel, ECSpec[]> = {
  L: [
    [19, 7, 1, 19, 0, 0],
    [34, 10, 1, 34, 0, 0],
    [55, 15, 1, 55, 0, 0],
    [80, 20, 1, 80, 0, 0],
    [108, 26, 1, 108, 0, 0],
    [136, 18, 2, 68, 0, 0],
    [156, 20, 2, 78, 0, 0],
    [194, 24, 2, 97, 0, 0],
    [232, 30, 2, 116, 0, 0],
    [274, 18, 2, 68, 2, 69],
    [324, 20, 4, 81, 0, 0],
    [370, 24, 2, 92, 2, 93],
    [428, 26, 4, 107, 0, 0],
    [461, 30, 3, 115, 1, 116],
    [523, 22, 5, 87, 1, 88],
    [589, 24, 5, 98, 1, 99],
    [647, 28, 1, 107, 5, 108],
    [721, 30, 5, 120, 1, 121],
    [795, 28, 3, 113, 4, 114],
    [861, 28, 3, 107, 5, 108],
    [932, 28, 4, 116, 4, 117],
    [1006, 28, 2, 111, 7, 112],
    [1094, 30, 4, 121, 5, 122],
    [1174, 30, 6, 117, 4, 118],
    [1276, 26, 8, 106, 4, 107],
    [1370, 28, 10, 114, 2, 115],
    [1468, 28, 8, 122, 4, 123],
    [1531, 30, 3, 117, 10, 118],
    [1631, 30, 7, 116, 7, 117],
    [1735, 30, 5, 115, 10, 116],
    [1843, 30, 13, 115, 3, 116],
    [1955, 30, 17, 115, 0, 0],
    [2071, 30, 17, 115, 1, 116],
    [2191, 30, 13, 115, 6, 116],
    [2306, 30, 12, 121, 7, 122],
    [2434, 30, 6, 121, 14, 122],
    [2566, 30, 17, 122, 4, 123],
    [2702, 30, 4, 122, 18, 123],
    [2812, 30, 20, 117, 4, 118],
    [2956, 30, 19, 118, 6, 119],
  ],
  M: [
    [16, 10, 1, 16, 0, 0],
    [28, 16, 1, 28, 0, 0],
    [44, 26, 1, 44, 0, 0],
    [64, 18, 2, 32, 0, 0],
    [86, 24, 2, 43, 0, 0],
    [108, 16, 4, 27, 0, 0],
    [124, 18, 4, 31, 0, 0],
    [154, 22, 2, 38, 2, 39],
    [182, 22, 3, 36, 2, 37],
    [216, 26, 4, 43, 1, 44],
    [254, 30, 1, 50, 4, 51],
    [290, 22, 6, 36, 2, 37],
    [334, 22, 8, 37, 1, 38],
    [365, 24, 4, 40, 5, 41],
    [415, 24, 5, 41, 5, 42],
    [453, 28, 7, 45, 3, 46],
    [507, 28, 10, 46, 1, 47],
    [563, 26, 9, 43, 4, 44],
    [627, 26, 3, 44, 11, 45],
    [669, 26, 3, 41, 13, 42],
    [714, 26, 17, 42, 0, 0],
    [782, 28, 17, 46, 0, 0],
    [860, 28, 4, 47, 14, 48],
    [914, 28, 6, 45, 14, 46],
    [1000, 28, 8, 47, 13, 48],
    [1062, 28, 19, 46, 4, 47],
    [1128, 28, 22, 45, 3, 46],
    [1193, 28, 3, 45, 23, 46],
    [1267, 28, 21, 45, 7, 46],
    [1370, 28, 19, 47, 10, 48],
    [1452, 28, 2, 46, 29, 47],
    [1538, 28, 10, 46, 23, 47],
    [1628, 28, 14, 46, 21, 47],
    [1722, 28, 14, 46, 23, 47],
    [1809, 28, 12, 47, 26, 48],
    [1911, 28, 6, 47, 34, 48],
    [1989, 28, 29, 46, 14, 47],
    [2099, 28, 13, 46, 32, 47],
    [2213, 28, 17, 47, 31, 48],
    [2331, 28, 20, 47, 30, 48],
  ],
  Q: [
    [13, 13, 1, 13, 0, 0],
    [22, 22, 1, 22, 0, 0],
    [34, 18, 2, 17, 0, 0],
    [48, 26, 2, 24, 0, 0],
    [62, 18, 2, 15, 2, 16],
    [76, 24, 4, 19, 0, 0],
    [88, 18, 4, 14, 3, 15],
    [110, 22, 4, 18, 2, 19],
    [132, 20, 4, 16, 4, 17],
    [154, 24, 6, 19, 2, 20],
    [180, 28, 4, 22, 4, 23],
    [206, 26, 4, 20, 6, 21],
    [244, 24, 8, 20, 4, 21],
    [261, 20, 11, 16, 5, 17],
    [295, 30, 5, 24, 7, 25],
    [325, 24, 15, 15, 2, 16],
    [367, 28, 3, 28, 11, 29],
    [397, 28, 17, 22, 2, 23],
    [445, 26, 17, 21, 4, 22],
    [485, 30, 7, 24, 16, 25],
    [512, 28, 4, 24, 18, 25],
    [568, 28, 6, 28, 14, 29],
    [614, 30, 6, 27, 16, 28],
    [664, 30, 18, 25, 8, 26],
    [718, 30, 20, 26, 8, 27],
    [754, 28, 19, 26, 10, 27],
    [808, 28, 22, 26, 9, 27],
    [871, 30, 6, 28, 26, 29],
    [911, 30, 21, 26, 13, 27],
    [986, 30, 19, 26, 17, 27],
    [1020, 30, 2, 28, 36, 29],
    [1080, 30, 10, 28, 31, 29],
    [1142, 30, 14, 28, 29, 29],
    [1206, 30, 14, 28, 31, 29],
    [1269, 30, 14, 29, 31, 30],
    [1337, 30, 26, 28, 22, 29],
    [1411, 30, 28, 28, 22, 29],
    [1477, 30, 8, 28, 45, 29],
    [1563, 30, 4, 28, 51, 29],
    [1637, 30, 23, 28, 34, 29],
  ],
  H: [
    [9, 17, 1, 9, 0, 0],
    [16, 28, 1, 16, 0, 0],
    [26, 22, 2, 13, 0, 0],
    [36, 16, 4, 9, 0, 0],
    [46, 22, 2, 11, 2, 12],
    [60, 28, 4, 15, 0, 0],
    [66, 26, 4, 13, 2, 14],
    [86, 26, 4, 14, 4, 15],
    [100, 24, 4, 12, 6, 13],
    [122, 28, 6, 15, 4, 16],
    [140, 24, 3, 19, 8, 20],
    [158, 28, 7, 14, 4, 15],
    [180, 22, 12, 12, 4, 13],
    [197, 24, 11, 12, 7, 13],
    [223, 24, 11, 12, 12, 13],
    [253, 30, 3, 21, 13, 22],
    [283, 24, 2, 20, 17, 21],
    [313, 28, 2, 23, 19, 24],
    [341, 28, 9, 23, 15, 24],
    [385, 28, 15, 23, 10, 24],
    [406, 28, 19, 18, 6, 19],
    [442, 28, 16, 20, 9, 21],
    [464, 30, 21, 18, 7, 19],
    [514, 30, 19, 20, 10, 21],
    [538, 30, 23, 18, 13, 19],
    [596, 30, 23, 20, 11, 21],
    [628, 30, 19, 21, 17, 22],
    [661, 30, 11, 20, 29, 21],
    [701, 30, 19, 20, 23, 21],
    [750, 30, 19, 21, 25, 22],
    [782, 30, 23, 20, 25, 21],
    [842, 30, 23, 21, 25, 22],
    [898, 30, 23, 23, 25, 24],
    [958, 30, 23, 23, 28, 24],
    [983, 30, 29, 21, 29, 22],
    [1063, 30, 19, 24, 46, 25],
    [1125, 30, 11, 24, 57, 25],
    [1190, 30, 11, 25, 65, 26],
    [1264, 30, 31, 24, 47, 25],
    [1370, 30, 22, 26, 61, 27],
  ],
};

// Mode indicators
const MODE_NUMERIC = 0b0001;
const MODE_ALPHANUMERIC = 0b0010;
const MODE_BYTE = 0b0100;

// Character count indicator bit lengths by version group
function getCharCountBits(mode: number, version: number): number {
  if (version <= 9) {
    if (mode === MODE_NUMERIC) return 10;
    if (mode === MODE_ALPHANUMERIC) return 9;
    return 8;
  } else if (version <= 26) {
    if (mode === MODE_NUMERIC) return 12;
    if (mode === MODE_ALPHANUMERIC) return 11;
    return 16;
  } else {
    if (mode === MODE_NUMERIC) return 14;
    if (mode === MODE_ALPHANUMERIC) return 13;
    return 16;
  }
}

// Simple bit buffer
class BitBuffer {
  buffer: number[] = [];
  length = 0;

  put(num: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      this.putBit(((num >> i) & 1) === 1);
    }
  }

  putBit(bit: boolean) {
    const byteIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= byteIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[byteIndex] |= 0x80 >> (this.length % 8);
    }
    this.length++;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// Convert string to UTF-8 byte array
export function stringToUtf8Bytes(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) bytes.push(charcode);
    else if (charcode < 0x800) {
      bytes.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      bytes.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      // surrogate pair
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

// Check mode capability
function isNumeric(str: string): boolean {
  return /^[0-9]+$/.test(str);
}

const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
function isAlphanumeric(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (!ALPHANUMERIC_CHARS.includes(str[i])) return false;
  }
  return true;
}

// Find minimum QR version that fits data
export function findMinimumVersion(
  dataBytesLen: number,
  mode: number,
  ecLevel: ErrorCorrectionLevel,
  requestedVersion = 0
): number {
  if (requestedVersion >= 1 && requestedVersion <= 40) return requestedVersion;

  for (let v = 1; v <= 40; v++) {
    const spec = EC_TABLE[ecLevel][v - 1];
    const totalDataCap = spec[0]; // in bytes
    const countBits = getCharCountBits(mode, v);
    // Mode bit length (4) + char count bits + data payload bits
    let payloadBits = 4 + countBits;
    if (mode === MODE_NUMERIC) {
      payloadBits += Math.floor(dataBytesLen / 3) * 10 + (dataBytesLen % 3 === 1 ? 4 : dataBytesLen % 3 === 2 ? 7 : 0);
    } else if (mode === MODE_ALPHANUMERIC) {
      payloadBits += Math.floor(dataBytesLen / 2) * 11 + (dataBytesLen % 2 === 1 ? 6 : 0);
    } else {
      payloadBits += dataBytesLen * 8;
    }
    const neededBytes = Math.ceil(payloadBits / 8);
    if (neededBytes <= totalDataCap) {
      return v;
    }
  }
  throw new Error(`Data is too large to fit in QR Code with EC level ${ecLevel}`);
}

// Encode data into bitstream and build interleaved blocks
function createDataCodewords(
  data: string,
  version: number,
  ecLevel: ErrorCorrectionLevel
): Uint8Array {
  let mode = MODE_BYTE;
  let rawBytes: Uint8Array;

  if (isNumeric(data)) {
    mode = MODE_NUMERIC;
    rawBytes = stringToUtf8Bytes(data);
  } else if (isAlphanumeric(data)) {
    mode = MODE_ALPHANUMERIC;
    rawBytes = stringToUtf8Bytes(data);
  } else {
    mode = MODE_BYTE;
    rawBytes = stringToUtf8Bytes(data);
  }

  const spec = EC_TABLE[ecLevel][version - 1];
  const totalDataBytes = spec[0];
  const buffer = new BitBuffer();

  // Mode indicator (4 bits)
  buffer.put(mode, 4);

  // Character count
  const countBits = getCharCountBits(mode, version);
  const charLength = mode === MODE_BYTE ? rawBytes.length : data.length;
  buffer.put(charLength, countBits);

  // Data payload
  if (mode === MODE_NUMERIC) {
    for (let i = 0; i < data.length; i += 3) {
      const chunk = data.substring(i, Math.min(i + 3, data.length));
      const val = parseInt(chunk, 10);
      const bits = chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4;
      buffer.put(val, bits);
    }
  } else if (mode === MODE_ALPHANUMERIC) {
    for (let i = 0; i < data.length; i += 2) {
      if (i + 1 < data.length) {
        const val = ALPHANUMERIC_CHARS.indexOf(data[i]) * 45 + ALPHANUMERIC_CHARS.indexOf(data[i + 1]);
        buffer.put(val, 11);
      } else {
        const val = ALPHANUMERIC_CHARS.indexOf(data[i]);
        buffer.put(val, 6);
      }
    }
  } else {
    for (let i = 0; i < rawBytes.length; i++) {
      buffer.put(rawBytes[i], 8);
    }
  }

  // Terminator (up to 4 zeroes)
  const remainingBits = totalDataBytes * 8 - buffer.length;
  if (remainingBits > 0) {
    buffer.put(0, Math.min(4, remainingBits));
  }

  // Byte align with zeroes
  while (buffer.length % 8 !== 0) {
    buffer.putBit(false);
  }

  // Pad bytes (0xEC, 0x11 alternating)
  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (buffer.length / 8 < totalDataBytes) {
    buffer.put(padBytes[padIndex], 8);
    padIndex = (padIndex + 1) % 2;
  }

  const dataBytes = buffer.getBytes();

  // Partition into blocks & calculate Reed-Solomon EC bytes
  const ecPerBlock = spec[1];
  const g1Blocks = spec[2];
  const g1Bytes = spec[3];
  const g2Blocks = spec[4];
  const g2Bytes = spec[5];
  const totalBlocks = g1Blocks + g2Blocks;

  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < totalBlocks; i++) {
    const isGroup2 = i >= g1Blocks;
    const blockSize = isGroup2 ? g2Bytes : g1Bytes;
    const blockData = dataBytes.slice(offset, offset + blockSize);
    offset += blockSize;
    dataBlocks.push(blockData);
    ecBlocks.push(rsEncode(blockData, ecPerBlock));
  }

  // Interleave data codewords, then EC codewords
  const interleaved: number[] = [];
  const maxDataBlockLen = Math.max(g1Bytes, g2Bytes);

  for (let col = 0; col < maxDataBlockLen; col++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (col < dataBlocks[b].length) {
        interleaved.push(dataBlocks[b][col]);
      }
    }
  }

  for (let col = 0; col < ecPerBlock; col++) {
    for (let b = 0; b < totalBlocks; b++) {
      interleaved.push(ecBlocks[b][col]);
    }
  }

  return new Uint8Array(interleaved);
}

// QR Format Info calculation BCH(15, 5)
const FORMAT_INFO_MASK = 0b101010000010010;
const FORMAT_INFO_POLY = 0b10100110111;

function getFormatInfo(ecLevel: ErrorCorrectionLevel, mask: number): number {
  let ecBits = 1; // L
  if (ecLevel === 'M') ecBits = 0;
  else if (ecLevel === 'Q') ecBits = 3;
  else if (ecLevel === 'H') ecBits = 2;

  let data = (ecBits << 3) | mask;
  let remainder = data << 10;
  for (let i = 4; i >= 0; i--) {
    if ((remainder & (1 << (i + 10))) !== 0) {
      remainder ^= FORMAT_INFO_POLY << i;
    }
  }
  return ((data << 10) | remainder) ^ FORMAT_INFO_MASK;
}

// Version info calculation BCH(18, 6) for version >= 7
const VERSION_INFO_POLY = 0b1111100100101;
function getVersionInfo(version: number): number {
  let rem = version << 12;
  for (let i = 5; i >= 0; i--) {
    if ((rem & (1 << (i + 12))) !== 0) {
      rem ^= VERSION_INFO_POLY << i;
    }
  }
  return (version << 12) | rem;
}

// Mask condition evaluations 0 to 7
function getMaskCondition(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default:
      return false;
  }
}

// Penalty score calculation for optimal mask pattern
function calculatePenalty(modules: boolean[][], size: number): number {
  let penalty = 0;

  // Rule 1: 5 or more consecutive modules of same color in row/col
  for (let r = 0; r < size; r++) {
    let runLen = 1;
    for (let c = 1; c < size; c++) {
      if (modules[r][c] === modules[r][c - 1]) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  for (let c = 0; c < size; c++) {
    let runLen = 1;
    for (let r = 1; r < size; r++) {
      if (modules[r][c] === modules[r - 1][c]) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  // Rule 2: 2x2 blocks of same color
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const bit = modules[r][c];
      if (bit === modules[r + 1][c] && bit === modules[r][c + 1] && bit === modules[r + 1][c + 1]) {
        penalty += 3;
      }
    }
  }

  // Rule 3: 1:1:3:1:1 pattern
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 10; c++) {
      if (
        modules[r][c] &&
        !modules[r][c + 1] &&
        modules[r][c + 2] &&
        modules[r][c + 3] &&
        modules[r][c + 4] &&
        !modules[r][c + 5] &&
        modules[r][c + 6]
      ) {
        if (
          (c >= 4 && !modules[r][c - 1] && !modules[r][c - 2] && !modules[r][c - 3] && !modules[r][c - 4]) ||
          (c + 10 < size && !modules[r][c + 7] && !modules[r][c + 8] && !modules[r][c + 9] && !modules[r][c + 10])
        ) {
          penalty += 40;
        }
      }
    }
  }

  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 10; r++) {
      if (
        modules[r][c] &&
        !modules[r + 1][c] &&
        modules[r + 2][c] &&
        modules[r + 3][c] &&
        modules[r + 4][c] &&
        !modules[r + 5][c] &&
        modules[r + 6][c]
      ) {
        if (
          (r >= 4 && !modules[r - 1][c] && !modules[r - 2][c] && !modules[r - 3][c] && !modules[r - 4][c]) ||
          (r + 10 < size && !modules[r + 7][c] && !modules[r + 8][c] && !modules[r + 9][c] && !modules[r + 10][c])
        ) {
          penalty += 40;
        }
      }
    }
  }

  // Rule 4: Proportion of dark modules
  let darkCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) darkCount++;
    }
  }
  const percentage = (darkCount * 100) / (size * size);
  const prevMultipleOf5 = Math.abs(Math.floor(percentage / 5) * 5 - 50) / 5;
  const nextMultipleOf5 = Math.abs(Math.ceil(percentage / 5) * 5 - 50) / 5;
  penalty += Math.min(prevMultipleOf5, nextMultipleOf5) * 10;

  return penalty;
}

// Generate the complete QR Code matrix
export function generateQRMatrix(data: string, options: QRCodeOptions = {}): QRMatrix {
  const ecLevel = options.errorCorrectionLevel || 'M';
  const utf8 = stringToUtf8Bytes(data);
  const version = findMinimumVersion(utf8.length, MODE_BYTE, ecLevel, options.version || 0);
  const size = version * 4 + 17;

  // Initialize matrix
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isReserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, reserved = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = val;
      if (reserved) isReserved[r][c] = true;
    }
  };

  // 1. Finder patterns (7x7 with 1px separator)
  const placeFinder = (startRow: number, startCol: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startRow + r;
        const col = startCol + c;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          const isBlack =
            r >= 0 &&
            r <= 6 &&
            c >= 0 &&
            c <= 6 &&
            (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          setModule(row, col, isBlack, true);
        }
      }
    }
  };

  placeFinder(0, 0); // Top-left
  placeFinder(0, size - 7); // Top-right
  placeFinder(size - 7, 0); // Bottom-left

  // 2. Alignment patterns for Version >= 2
  if (version >= 2) {
    const coords = ALIGNMENT_PATTERN_TABLE[version - 1];
    for (let i = 0; i < coords.length; i++) {
      for (let j = 0; j < coords.length; j++) {
        const r = coords[i];
        const c = coords[j];
        // Skip if overlaps finder
        if (isReserved[r][c]) continue;

        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            setModule(r + dr, c + dc, isBlack, true);
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isReserved[6][i]) setModule(6, i, i % 2 === 0, true);
    if (!isReserved[i][6]) setModule(i, 6, i % 2 === 0, true);
  }

  // 4. Dark module and reserved format/version info areas
  setModule(4 * version + 9, 8, true, true);

  // Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isReserved[8][i] = true;
      isReserved[i][8] = true;
    }
  }
  for (let i = 0; i <= 7; i++) {
    isReserved[8][size - 1 - i] = true;
    isReserved[size - 1 - i][8] = true;
  }

  // Reserve version info areas (Version >= 7)
  if (version >= 7) {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        isReserved[r][size - 11 + c] = true;
        isReserved[size - 11 + c][r] = true;
      }
    }
  }

  // 5. Data codewords
  const dataCodewords = createDataCodewords(data, version, ecLevel);

  // 6. Mask pattern selection
  let chosenMask = options.maskPattern !== undefined && options.maskPattern >= 0 ? options.maskPattern : -1;
  let bestScore = Infinity;
  let bestModules: boolean[][] = [];

  const masksToTest = chosenMask >= 0 ? [chosenMask] : [0, 1, 2, 3, 4, 5, 6, 7];

  for (const mask of masksToTest) {
    // Clone matrix
    const trialModules: boolean[][] = modules.map((row) => [...row]);

    // Place data bits in 2-column zig-zag from bottom-right to top-left
    let bitIndex = 0;
    const totalBits = dataCodewords.length * 8;
    let upward = true;

    for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
      if (rightCol === 6) rightCol--; // Skip vertical timing pattern column

      const rowIndices: number[] = [];
      if (upward) {
        for (let r = size - 1; r >= 0; r--) rowIndices.push(r);
      } else {
        for (let r = 0; r < size; r++) rowIndices.push(r);
      }
      upward = !upward;

      for (const r of rowIndices) {
        for (let c = rightCol; c >= rightCol - 1; c--) {
          if (!isReserved[r][c]) {
            let bit = false;
            if (bitIndex < totalBits) {
              const byteVal = dataCodewords[Math.floor(bitIndex / 8)];
              bit = ((byteVal >> (7 - (bitIndex % 8))) & 1) === 1;
              bitIndex++;
            }
            // Invert if mask condition holds
            if (getMaskCondition(mask, r, c)) {
              bit = !bit;
            }
            trialModules[r][c] = bit;
          }
        }
      }
    }

    // Place format info for this mask
    const fmt = getFormatInfo(ecLevel, mask);
    // Around top-left finder
    for (let i = 0; i <= 5; i++) trialModules[8][i] = ((fmt >> (14 - i)) & 1) === 1;
    trialModules[8][7] = ((fmt >> 8) & 1) === 1;
    trialModules[8][8] = ((fmt >> 7) & 1) === 1;
    trialModules[7][8] = ((fmt >> 6) & 1) === 1;
    for (let i = 0; i <= 5; i++) trialModules[5 - i][8] = ((fmt >> (5 - i)) & 1) === 1;

    // Around top-right and bottom-left finders
    for (let i = 0; i <= 7; i++) trialModules[8][size - 1 - i] = ((fmt >> i) & 1) === 1;
    for (let i = 0; i <= 6; i++) trialModules[size - 7 + i][8] = ((fmt >> (8 + i)) & 1) === 1;

    // Place version info if version >= 7
    if (version >= 7) {
      const vInfo = getVersionInfo(version);
      for (let i = 0; i < 18; i++) {
        const bit = ((vInfo >> i) & 1) === 1;
        const r = Math.floor(i / 3);
        const c = (i % 3) + size - 11;
        trialModules[r][c] = bit;
        trialModules[c][r] = bit;
      }
    }

    const score = calculatePenalty(trialModules, size);
    if (score < bestScore) {
      bestScore = score;
      chosenMask = mask;
      bestModules = trialModules;
    }
  }

  return {
    size,
    modules: bestModules,
    isReserved,
    version,
    ecLevel,
  };
}
