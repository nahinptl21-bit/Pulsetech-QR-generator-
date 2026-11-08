/**
 * Universal Barcode Renderer (Zero 3rd party).
 * Dispatches to individual symbology encoders and renders to crisp SVG and Canvas.
 * Supports standalone barcodes and complete retail/inventory product label cards.
 */

import { encodeCode128 } from './barcode128';
import { encodeCode39 } from './barcode39';
import { encodeCodabar } from './codabar';
import { encodeEan13, encodeUpcA } from './ean';
import { encodeITF } from './itf';
import { BarcodeDesignOptions, BarcodeSymbology, EncodedBarcode } from './types';

export function encodeBarcode(text: string, symbology: BarcodeSymbology): EncodedBarcode {
  switch (symbology) {
    case 'CODE128':
      return encodeCode128(text);
    case 'CODE39':
      return encodeCode39(text, false);
    case 'EAN13':
      return encodeEan13(text);
    case 'UPCA':
      return encodeUpcA(text);
    case 'ITF':
      return encodeITF(text);
    case 'CODABAR':
      return encodeCodabar(text);
    default:
      return encodeCode128(text);
  }
}

export function renderBarcodeToSVG(
  text: string,
  symbology: BarcodeSymbology,
  options: BarcodeDesignOptions = {}
): { svg: string; encoded: EncodedBarcode } {
  const encoded = encodeBarcode(text, symbology);

  const {
    barWidth = 2,
    barHeight = 70,
    margin = 20,
    color = '#0f172a',
    backgroundColor = '#ffffff',
    showText = true,
    fontSize = 14,
    textMargin = 8,
    includeProductCard = false,
    productTitle = '',
    productSubtitle = '',
    productPrice = '',
    companyName = '',
  } = options;

  if (!encoded.isValid || !encoded.binaryString) {
    const errorMsg = encoded.error || 'Failed to encode barcode';
    const errSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120">
        <rect width="400" height="120" fill="#fef2f2" stroke="#f87171" stroke-width="1.5" rx="8" />
        <text x="200" y="55" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="#991b1b">
          Barcode Encoding Error (${symbology})
        </text>
        <text x="200" y="75" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#b91c1c">
          ${escapeXml(errorMsg)}
        </text>
      </svg>
    `;
    return { svg: errSvg.trim(), encoded };
  }

  const binary = encoded.binaryString;
  const barcodeCoreWidth = binary.length * barWidth;
  const barcodeCoreHeight = barHeight;

  // Calculate card header and footer heights
  let headerHeight = 0;
  if (includeProductCard) {
    if (productTitle.trim() || productPrice.trim()) headerHeight += 28;
    if (productSubtitle.trim()) headerHeight += 18;
    if (headerHeight > 0) headerHeight += 8; // spacing
  }

  const textHeight = showText ? fontSize + textMargin : 0;
  let footerHeight = 0;
  if (includeProductCard && companyName.trim()) {
    footerHeight = 22;
  }

  const minCardWidth = includeProductCard ? 280 : 0;
  const totalWidth = Math.max(minCardWidth, barcodeCoreWidth + margin * 2);
  const totalHeight = margin * 2 + headerHeight + barcodeCoreHeight + textHeight + footerHeight;

  // Center barcode horizontally in totalWidth
  const barcodeStartX = (totalWidth - barcodeCoreWidth) / 2;
  const barcodeStartY = margin + headerHeight;

  let barsPath = '';
  let inBar = false;
  let barStart = 0;

  for (let i = 0; i <= binary.length; i++) {
    const bit = i < binary.length ? binary[i] : '0';
    if (bit === '1') {
      if (!inBar) {
        inBar = true;
        barStart = i;
      }
    } else {
      if (inBar) {
        inBar = false;
        const width = (i - barStart) * barWidth;
        const x = barcodeStartX + barStart * barWidth;
        barsPath += ` M ${x} ${barcodeStartY} h ${width} v ${barcodeCoreHeight} h -${width} Z`;
      }
    }
  }

  let content = `<rect width="${totalWidth}" height="${totalHeight}" fill="${backgroundColor}" rx="8" />`;

  // Draw Card Header if enabled
  if (includeProductCard && headerHeight > 0) {
    let curY = margin + 14;
    if (productTitle.trim() || productPrice.trim()) {
      content += `
        <g>
          ${
            productTitle.trim()
              ? `<text x="${margin}" y="${curY}" text-anchor="start" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="${color}">
                  ${escapeXml(productTitle)}
                </text>`
              : ''
          }
          ${
            productPrice.trim()
              ? `<text x="${totalWidth - margin}" y="${curY}" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="16" fill="#059669">
                  ${escapeXml(productPrice)}
                </text>`
              : ''
          }
        </g>
      `;
      curY += 18;
    }
    if (productSubtitle.trim()) {
      content += `
        <text x="${margin}" y="${curY}" text-anchor="start" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="11" fill="#64748b">
          ${escapeXml(productSubtitle)}
        </text>
      `;
    }
  }

  // Draw bars
  content += `<path d="${barsPath}" fill="${color}" />`;

  // Draw human-readable text below barcode
  if (showText) {
    const textY = barcodeStartY + barcodeCoreHeight + textMargin + fontSize * 0.8;
    // Format text nicely for EAN/UPC
    let formattedText = encoded.displayText;
    if (symbology === 'EAN13' && formattedText.length === 13) {
      formattedText = `${formattedText[0]}  ${formattedText.substring(1, 7)}  ${formattedText.substring(7, 13)}`;
    } else if (symbology === 'UPCA' && formattedText.length === 12) {
      formattedText = `${formattedText[0]}  ${formattedText.substring(1, 6)}  ${formattedText.substring(6, 11)}  ${formattedText[11]}`;
    }

    content += `
      <text x="${totalWidth / 2}" y="${textY}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-weight="600" font-size="${fontSize}" fill="${color}" letter-spacing="1.2">
        ${escapeXml(formattedText)}
      </text>
    `;
  }

  // Draw company name footer if product card enabled
  if (includeProductCard && companyName.trim()) {
    const footerY = totalHeight - margin / 2;
    content += `
      <text x="${totalWidth / 2}" y="${footerY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="10" fill="#94a3b8" letter-spacing="0.5">
        ${escapeXml(companyName)}
      </text>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
      ${content}
    </svg>
  `.trim();

  return { svg, encoded };
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
