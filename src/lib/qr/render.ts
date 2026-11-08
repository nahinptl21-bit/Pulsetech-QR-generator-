/**
 * Zero 3rd-party QR Code Renderer.
 * Produces clean SVG strings and HTML5 Canvas drawing with customizable:
 * - Module dot shapes: square, rounded, dots (circles), diamond
 * - Corner eye frames and eye balls: square, rounded, circle
 * - Color palettes & Gradients
 * - Center logo / icon slot with automatic contrast background
 * - Label banner / frame: "SCAN ME", custom text, top/bottom badge
 */

import { generateQRMatrix, QRCodeOptions, QRMatrix } from './qrcode';

export type DotStyle = 'square' | 'rounded' | 'dots' | 'diamond' | 'classy';
export type CornerFrameStyle = 'square' | 'rounded' | 'circle';
export type CornerDotStyle = 'square' | 'circle' | 'diamond';

export interface QRDesignOptions {
  size?: number; // pixel width/height (default 400)
  margin?: number; // quiet zone in module count (default 4)
  foregroundColor?: string; // hex / rgb / css
  backgroundColor?: string; // hex / rgb / css
  gradientType?: 'none' | 'linear' | 'radial';
  gradientColorEnd?: string;
  gradientAngle?: number; // in degrees
  dotStyle?: DotStyle;
  cornerFrameStyle?: CornerFrameStyle;
  cornerDotStyle?: CornerDotStyle;
  cornerColor?: string; // custom color for corner eyes, optional
  cornerDotColor?: string; // custom color for corner eye center, optional
  logoSrc?: string; // data URL or image URL
  logoSizePercent?: number; // 10 to 25 (default 18)
  logoBackground?: string; // white or transparent
  bannerText?: string; // e.g. "SCAN ME"
  bannerPosition?: 'none' | 'top' | 'bottom';
  bannerBgColor?: string;
  bannerTextColor?: string;
  bannerSubtext?: string;
}

// Check if a coordinate is inside any of the 3 finder patterns (7x7 plus 1px margin = 8x8)
export function isFinderPattern(r: number, c: number, size: number): boolean {
  // Top-left
  if (r <= 7 && c <= 7) return true;
  // Top-right
  if (r <= 7 && c >= size - 8) return true;
  // Bottom-left
  if (r >= size - 8 && c <= 7) return true;
  return false;
}

// Check if coordinate is in the center logo area
export function isLogoArea(r: number, c: number, size: number, logoMarginCount: number): boolean {
  if (logoMarginCount <= 0) return false;
  const center = (size - 1) / 2;
  const radius = logoMarginCount;
  return Math.abs(r - center) <= radius && Math.abs(c - center) <= radius;
}

export function renderQRCodeToSVG(data: string, design: QRDesignOptions = {}, qrOpts: QRCodeOptions = {}): string {
  const matrix = generateQRMatrix(data, {
    errorCorrectionLevel: design.logoSrc ? 'H' : qrOpts.errorCorrectionLevel || 'M',
    version: qrOpts.version,
    maskPattern: qrOpts.maskPattern,
  });

  const {
    size = 400,
    margin = 4,
    foregroundColor = '#0f172a',
    backgroundColor = '#ffffff',
    gradientType = 'none',
    gradientColorEnd = '#3b82f6',
    gradientAngle = 45,
    dotStyle = 'square',
    cornerFrameStyle = 'square',
    cornerDotStyle = 'square',
    cornerColor = foregroundColor,
    cornerDotColor = cornerColor,
    logoSrc = '',
    logoSizePercent = 18,
    bannerText = '',
    bannerPosition = 'none',
    bannerBgColor = foregroundColor,
    bannerTextColor = '#ffffff',
    bannerSubtext = '',
  } = design;

  const qrModuleCount = matrix.size;
  const totalModuleCount = qrModuleCount + margin * 2;
  const moduleSize = size / totalModuleCount;

  // Calculate logo reserved area in module count
  const logoModules = logoSrc ? Math.max(3, Math.floor((qrModuleCount * (logoSizePercent / 100)) / 2)) : 0;

  // Banner layout calculation
  const hasBanner = bannerPosition !== 'none' && (bannerText.trim().length > 0 || bannerSubtext.trim().length > 0);
  const bannerHeight = hasBanner ? 56 : 0;
  const totalSvgHeight = size + bannerHeight;

  let defs = '';
  let fillAttr = foregroundColor;

  if (gradientType === 'linear') {
    const angleRad = (gradientAngle * Math.PI) / 180;
    const x1 = Math.round(50 - Math.cos(angleRad) * 50);
    const y1 = Math.round(50 - Math.sin(angleRad) * 50);
    const x2 = Math.round(50 + Math.cos(angleRad) * 50);
    const y2 = Math.round(50 + Math.sin(angleRad) * 50);

    defs += `
      <linearGradient id="qrGradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${foregroundColor}" />
        <stop offset="100%" stop-color="${gradientColorEnd}" />
      </linearGradient>
    `;
    fillAttr = 'url(#qrGradient)';
  } else if (gradientType === 'radial') {
    defs += `
      <radialGradient id="qrGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${foregroundColor}" />
        <stop offset="100%" stop-color="${gradientColorEnd}" />
      </radialGradient>
    `;
    fillAttr = 'url(#qrGradient)';
  }

  const qrOffsetY = bannerPosition === 'top' ? bannerHeight : 0;

  // Draw background
  let svgContent = `<rect width="${size}" height="${totalSvgHeight}" fill="${backgroundColor}" rx="8" />`;

  // Draw body modules
  let pathD = '';
  for (let r = 0; r < qrModuleCount; r++) {
    for (let c = 0; c < qrModuleCount; c++) {
      if (isFinderPattern(r, c, qrModuleCount)) continue; // Handled separately
      if (isLogoArea(r, c, qrModuleCount, logoModules)) continue; // Reserved for logo

      if (matrix.modules[r][c]) {
        const x = (c + margin) * moduleSize;
        const y = (r + margin) * moduleSize + qrOffsetY;

        if (dotStyle === 'dots') {
          const cx = x + moduleSize / 2;
          const cy = y + moduleSize / 2;
          const radius = moduleSize * 0.44;
          pathD += ` M ${cx} ${cy} m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`;
        } else if (dotStyle === 'rounded') {
          const rSize = moduleSize * 0.35;
          pathD += ` M ${x + rSize} ${y} h ${moduleSize - 2 * rSize} a ${rSize} ${rSize} 0 0 1 ${rSize} ${rSize} v ${moduleSize - 2 * rSize} a ${rSize} ${rSize} 0 0 1 -${rSize} ${rSize} h -${moduleSize - 2 * rSize} a ${rSize} ${rSize} 0 0 1 -${rSize} -${rSize} v -${moduleSize - 2 * rSize} a ${rSize} ${rSize} 0 0 1 ${rSize} -${rSize} Z`;
        } else if (dotStyle === 'diamond') {
          const cx = x + moduleSize / 2;
          const cy = y + moduleSize / 2;
          const half = moduleSize * 0.48;
          pathD += ` M ${cx} ${cy - half} L ${cx + half} ${cy} L ${cx} ${cy + half} L ${cx - half} ${cy} Z`;
        } else if (dotStyle === 'classy') {
          // rounded top-left and bottom-right
          const rSize = moduleSize * 0.45;
          pathD += ` M ${x + rSize} ${y} H ${x + moduleSize} V ${y + moduleSize - rSize} A ${rSize} ${rSize} 0 0 1 ${x + moduleSize - rSize} ${y + moduleSize} H ${x} V ${y + rSize} A ${rSize} ${rSize} 0 0 1 ${x + rSize} ${y} Z`;
        } else {
          // Classic crisp square
          pathD += ` M ${x} ${y} h ${moduleSize} v ${moduleSize} h -${moduleSize} Z`;
        }
      }
    }
  }

  if (pathD) {
    svgContent += `<path d="${pathD}" fill="${fillAttr}" />`;
  }

  // Draw 3 Corner Finder Patterns (Eyes)
  const drawCornerEye = (startRow: number, startCol: number) => {
    const ox = (startCol + margin) * moduleSize;
    const oy = (startRow + margin) * moduleSize + qrOffsetY;
    const outerSize = 7 * moduleSize;
    const innerSize = 3 * moduleSize;
    const innerOffset = 2 * moduleSize;

    let outerSvg = '';
    let innerSvg = '';

    if (cornerFrameStyle === 'circle') {
      const cx = ox + outerSize / 2;
      const cy = oy + outerSize / 2;
      const rOuter = outerSize / 2;
      const rInner = (5 * moduleSize) / 2;
      outerSvg = `
        <mask id="eyeMask_${startRow}_${startCol}">
          <rect width="${size}" height="${totalSvgHeight}" fill="white" />
          <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="black" />
        </mask>
        <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="${cornerColor}" mask="url(#eyeMask_${startRow}_${startCol})" />
      `;
    } else if (cornerFrameStyle === 'rounded') {
      const rx = moduleSize * 1.5;
      const innerW = 5 * moduleSize;
      const innerRx = moduleSize * 0.8;
      outerSvg = `
        <mask id="eyeMask_${startRow}_${startCol}">
          <rect width="${size}" height="${totalSvgHeight}" fill="white" />
          <rect x="${ox + moduleSize}" y="${oy + moduleSize}" width="${innerW}" height="${innerW}" rx="${innerRx}" fill="black" />
        </mask>
        <rect x="${ox}" y="${oy}" width="${outerSize}" height="${outerSize}" rx="${rx}" fill="${cornerColor}" mask="url(#eyeMask_${startRow}_${startCol})" />
      `;
    } else {
      // Square frame
      const innerW = 5 * moduleSize;
      outerSvg = `
        <mask id="eyeMask_${startRow}_${startCol}">
          <rect width="${size}" height="${totalSvgHeight}" fill="white" />
          <rect x="${ox + moduleSize}" y="${oy + moduleSize}" width="${innerW}" height="${innerW}" fill="black" />
        </mask>
        <rect x="${ox}" y="${oy}" width="${outerSize}" height="${outerSize}" fill="${cornerColor}" mask="url(#eyeMask_${startRow}_${startCol})" />
      `;
    }

    // Inner eye dot
    const inX = ox + innerOffset;
    const inY = oy + innerOffset;
    if (cornerDotStyle === 'circle') {
      const icx = inX + innerSize / 2;
      const icy = inY + innerSize / 2;
      innerSvg = `<circle cx="${icx}" cy="${icy}" r="${innerSize / 2}" fill="${cornerDotColor}" />`;
    } else if (cornerDotStyle === 'diamond') {
      const icx = inX + innerSize / 2;
      const icy = inY + innerSize / 2;
      const half = innerSize / 2;
      innerSvg = `<polygon points="${icx},${icy - half} ${icx + half},${icy} ${icx},${icy + half} ${icx - half},${icy}" fill="${cornerDotColor}" />`;
    } else {
      const rx = cornerFrameStyle === 'rounded' ? moduleSize * 0.6 : 0;
      innerSvg = `<rect x="${inX}" y="${inY}" width="${innerSize}" height="${innerSize}" rx="${rx}" fill="${cornerDotColor}" />`;
    }

    return outerSvg + innerSvg;
  };

  svgContent += drawCornerEye(0, 0); // Top-left
  svgContent += drawCornerEye(0, qrModuleCount - 7); // Top-right
  svgContent += drawCornerEye(qrModuleCount - 7, 0); // Bottom-left

  // Draw Center Logo / Icon if present
  if (logoSrc) {
    const centerMod = (qrModuleCount - 1) / 2;
    const logoPxSize = (logoModules * 2 + 1) * moduleSize;
    const logoX = (centerMod - logoModules + margin) * moduleSize;
    const logoY = (centerMod - logoModules + margin) * moduleSize + qrOffsetY;

    // Draw background badge behind logo
    svgContent += `
      <rect x="${logoX - 2}" y="${logoY - 2}" width="${logoPxSize + 4}" height="${logoPxSize + 4}" rx="${moduleSize}" fill="${backgroundColor}" />
      <image href="${logoSrc}" x="${logoX + 2}" y="${logoY + 2}" width="${logoPxSize - 4}" height="${logoPxSize - 4}" preserveAspectRatio="xMidYMid meet" />
    `;
  }

  // Draw Banner if present
  if (hasBanner) {
    const bY = bannerPosition === 'top' ? 0 : size;
    const textY = bannerPosition === 'top' ? (bannerSubtext ? 22 : 32) : size + (bannerSubtext ? 22 : 32);
    const subtextY = bannerPosition === 'top' ? 42 : size + 42;

    svgContent += `
      <g>
        <rect x="0" y="${bY}" width="${size}" height="${bannerHeight}" fill="${bannerBgColor}" />
        <text x="${size / 2}" y="${textY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="15" fill="${bannerTextColor}" letter-spacing="1.5">
          ${escapeXml(bannerText.toUpperCase())}
        </text>
        ${
          bannerSubtext
            ? `<text x="${size / 2}" y="${subtextY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="11" fill="${bannerTextColor}" opacity="0.85">
                ${escapeXml(bannerSubtext)}
              </text>`
            : ''
        }
      </g>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${totalSvgHeight}" width="${size}" height="${totalSvgHeight}">
      ${defs ? `<defs>${defs}</defs>` : ''}
      ${svgContent}
    </svg>
  `.trim();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
