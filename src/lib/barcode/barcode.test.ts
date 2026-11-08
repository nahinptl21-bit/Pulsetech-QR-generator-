import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeCode128 } from './barcode128';
import { encodeCode39 } from './barcode39';
import { encodeEan13, encodeUpcA, calculateEanCheckDigit } from './ean';
import { encodeITF } from './itf';
import { encodeCodabar } from './codabar';
import { renderBarcodeToSVG } from './render';

test('Code 128 encodes text and checksum correctly', () => {
  const res = encodeCode128('TEST1234');
  assert.equal(res.isValid, true);
  assert.ok(res.binaryString.length > 50);
  assert.equal(/^[01]+$/.test(res.binaryString), true);

  const empty = encodeCode128('');
  assert.equal(empty.isValid, false);
});

test('EAN-13 check digit calculation matches GS1 standard', () => {
  // Test known commercial barcodes
  // 4006381333931: 400638133393 -> 1
  assert.equal(calculateEanCheckDigit('400638133393'), 1);

  // 12-digit input auto-completes to 13-digit
  const encoded = encodeEan13('400638133393');
  assert.equal(encoded.isValid, true);
  assert.equal(encoded.displayText, '4006381333931');
  assert.equal(encoded.binaryString.length, 95); // 3 + 42 + 5 + 42 + 3 = 95 modules
});

test('UPC-A encodes 11 or 12 digits correctly', () => {
  const upc = encodeUpcA('01234567890');
  assert.equal(upc.isValid, true);
  assert.equal(upc.displayText.length, 12);
  assert.equal(upc.binaryString.length, 95);
});

test('Code 39 encodes characters with start/stop delimiter', () => {
  const c39 = encodeCode39('CODE-39');
  assert.equal(c39.isValid, true);
  assert.equal(c39.displayText, '*CODE-39*');
  assert.ok(c39.binaryString.startsWith('100101101101')); // '*' start guard in 2:1 ratio
});

test('ITF pairs digits into bars and spaces', () => {
  const itf = encodeITF('123456');
  assert.equal(itf.isValid, true);
  assert.ok(itf.binaryString.startsWith('1010')); // start guard
  assert.ok(itf.binaryString.endsWith('1101')); // stop guard
});

test('Codabar encodes with guard characters', () => {
  const codabar = encodeCodabar('12345');
  assert.equal(codabar.isValid, true);
  assert.ok(codabar.displayText.startsWith('A'));
  assert.ok(codabar.displayText.endsWith('A'));
});

test('renderBarcodeToSVG includes product label card elements', () => {
  const { svg, encoded } = renderBarcodeToSVG('SKU-99482', 'CODE128', {
    includeProductCard: true,
    productTitle: 'Premium Coffee 500g',
    productPrice: '$18.99',
    productSubtitle: 'Batch #2026-B',
    companyName: 'Omni Goods Co.',
  });

  assert.equal(encoded.isValid, true);
  assert.ok(svg.includes('Premium Coffee 500g'));
  assert.ok(svg.includes('$18.99'));
  assert.ok(svg.includes('Omni Goods Co.'));
});
