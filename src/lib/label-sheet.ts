/**
 * Printable Label Sheet Generator & Layouts
 * Supports Avery 5160, 5163, A4 L7160, and custom retail shelf sheets.
 */

export interface LabelTemplate {
  id: string;
  name: string;
  paperSize: 'letter' | 'a4';
  cols: number;
  rows: number;
  labelsPerPage: number;
  labelWidthMm: number;
  labelHeightMm: number;
  description: string;
}

export const LABEL_TEMPLATES: LabelTemplate[] = [
  {
    id: 'avery-5160',
    name: 'Avery 5160 (30-up Letter)',
    paperSize: 'letter',
    cols: 3,
    rows: 10,
    labelsPerPage: 30,
    labelWidthMm: 66.7,
    labelHeightMm: 25.4,
    description: 'Standard 1" x 2-5/8" address & barcode labels (30 per page)',
  },
  {
    id: 'avery-5163',
    name: 'Avery 5163 (10-up Shipping)',
    paperSize: 'letter',
    cols: 2,
    rows: 5,
    labelsPerPage: 10,
    labelWidthMm: 101.6,
    labelHeightMm: 50.8,
    description: 'Large 2" x 4" shipping & inventory package labels (10 per page)',
  },
  {
    id: 'avery-l7160',
    name: 'Avery L7160 (21-up A4)',
    paperSize: 'a4',
    cols: 3,
    rows: 7,
    labelsPerPage: 21,
    labelWidthMm: 63.5,
    labelHeightMm: 38.1,
    description: 'European standard 63.5mm x 38.1mm labels (21 per page)',
  },
  {
    id: 'shelf-tags-24',
    name: 'Retail Shelf Tags (24-up)',
    paperSize: 'letter',
    cols: 4,
    rows: 6,
    labelsPerPage: 24,
    labelWidthMm: 48,
    labelHeightMm: 35,
    description: 'Retail pricing shelf tags with SKU, price, and barcode',
  },
];

export interface SheetItem {
  id: string;
  code: string;
  title?: string;
  subtitle?: string;
  price?: string;
}
