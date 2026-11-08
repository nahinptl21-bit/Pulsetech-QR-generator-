/**
 * Barcode Symbology Types and Interfaces
 */

export type BarcodeSymbology =
  | 'CODE128'
  | 'CODE39'
  | 'EAN13'
  | 'UPCA'
  | 'ITF'
  | 'CODABAR';

export interface EncodedBarcode {
  symbology: BarcodeSymbology;
  binaryString: string; // '1' = bar, '0' = space
  displayText: string;
  isValid: boolean;
  error?: string;
}

export interface BarcodeDesignOptions {
  barWidth?: number; // width in pixels of 1 module bar (1 to 4)
  barHeight?: number; // height in pixels of bars (30 to 150)
  margin?: number; // quiet zone in pixels
  color?: string; // bar color
  backgroundColor?: string;
  showText?: boolean;
  fontSize?: number;
  textMargin?: number;
  // Product label card options
  includeProductCard?: boolean;
  productTitle?: string;
  productSubtitle?: string;
  productPrice?: string;
  companyName?: string;
}
