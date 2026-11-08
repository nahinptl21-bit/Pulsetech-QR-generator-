import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateUuidV4,
  generateUuidV7,
  generateShortUuid,
  generateNanoId,
  generateSku,
  generateFromMask,
  generateVoucherPin,
  generateValidEan13,
  generateBatch,
} from './generator';

test('UUID v4 matches standard 8-4-4-4-12 pattern and version 4 byte', () => {
  const uuid = generateUuidV4();
  assert.equal(uuid.length, 36);
  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('UUID v7 matches standard pattern with version 7 byte and chronological sortability', () => {
  const t1 = Date.now();
  const u1 = generateUuidV7(t1);
  const u2 = generateUuidV7(t1 + 100);

  assert.equal(u1.length, 36);
  assert.match(u1, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  // Lexicographical ordering matches chronological ordering in UUID v7
  assert.ok(u1 < u2);
});

test('NanoID respects length and character sets', () => {
  const nid1 = generateNanoId({ length: 12 });
  assert.equal(nid1.length, 12);

  const humanSafe = generateNanoId({ length: 16, alphabetType: 'human-safe' });
  assert.equal(humanSafe.length, 16);
  // Ensure no confusing 0, O, 1, I, l
  assert.equal(/[0O1Il]/.test(humanSafe), false);
});

test('SKU generator constructs standardized inventory codes', () => {
  const sku = generateSku(
    {
      prefix: 'WH',
      category: 'ELEC',
      includeDate: false,
      counterType: 'sequential',
      startCounter: 42,
      suffix: 'US',
    },
    1
  );
  assert.equal(sku, 'WH-ELEC-0042-US');
});

test('Pattern mask replaces symbols accurately', () => {
  const serial = generateFromMask('SN-####-@@@@');
  assert.match(serial, /^SN-\d{4}-[A-Z]{4}$/);
});

test('Voucher PIN creates formatted blocks with safe characters', () => {
  const pin = generateVoucherPin({ chunks: 3, chunkLength: 4, separator: '-' });
  assert.match(pin, /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
});

test('Valid EAN-13 generator creates legitimate 13-digit numbers', () => {
  const ean = generateValidEan13('200');
  assert.equal(ean.length, 13);
  assert.ok(ean.startsWith('200'));

  // Validate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(ean[i], 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const expectedCheck = (10 - (sum % 10)) % 10;
  assert.equal(parseInt(ean[12], 10), expectedCheck);
});

test('generateBatch produces unique distinct items', () => {
  const batch = generateBatch({ type: 'UUID_V4', count: 50 });
  assert.equal(batch.length, 50);

  const set = new Set(batch.map((b) => b.id));
  assert.equal(set.size, 50); // all unique
});
