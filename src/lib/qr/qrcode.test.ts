import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQRMatrix, findMinimumVersion, stringToUtf8Bytes } from './qrcode';
import { renderQRCodeToSVG } from './render';

test('QR matrix generates correct dimensions for Version 1 and Version 2', () => {
  const qr1 = generateQRMatrix('HELLO', { version: 1, errorCorrectionLevel: 'L' });
  assert.equal(qr1.size, 21); // V1 is 21x21
  assert.equal(qr1.modules.length, 21);
  assert.equal(qr1.modules[0].length, 21);

  // Top-left finder pattern check
  assert.equal(qr1.modules[0][0], true);
  assert.equal(qr1.modules[0][6], true);
  assert.equal(qr1.modules[6][0], true);
  assert.equal(qr1.modules[6][6], true);
  assert.equal(qr1.modules[1][1], false);

  const qr2 = generateQRMatrix('HELLO WORLD 1234567890', { version: 2, errorCorrectionLevel: 'M' });
  assert.equal(qr2.size, 25); // V2 is 25x25
});

test('QR auto-selects minimum version to fit data without overflow', () => {
  const shortText = 'abc';
  const vShort = findMinimumVersion(shortText.length, 4, 'M');
  assert.equal(vShort, 1);

  const longText = 'A'.repeat(120);
  const vLong = findMinimumVersion(longText.length, 4, 'L');
  assert.ok(vLong > 1);
});

test('renderQRCodeToSVG produces valid SVG output with styling', () => {
  const svg = renderQRCodeToSVG('https://example.com/product/12345', {
    size: 300,
    foregroundColor: '#1e3a8a',
    backgroundColor: '#ffffff',
    dotStyle: 'dots',
    cornerFrameStyle: 'rounded',
    cornerDotStyle: 'circle',
    bannerText: 'SCAN ME',
    bannerPosition: 'bottom',
  });

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('SCAN ME'));
  assert.ok(svg.includes('#1e3a8a'));
  assert.ok(svg.endsWith('</svg>'));
});
