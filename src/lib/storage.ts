/**
 * LocalStorage management for saved QR codes, Barcodes, and Unique IDs.
 * 100% private and client-side.
 */

export interface SavedItem {
  id: string;
  kind: 'qr' | 'barcode' | 'unique_id';
  title: string;
  payload: string;
  symbology?: string;
  config: Record<string, any>;
  createdAt: number;
  favorite?: boolean;
}

const STORAGE_KEY = 'omnicode_saved_items_v1';

export function getSavedItems(): SavedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultItems();
    return JSON.parse(raw);
  } catch {
    return getDefaultItems();
  }
}

export function saveItem(item: Omit<SavedItem, 'id' | 'createdAt'>): SavedItem {
  const items = getSavedItems();
  const newItem: SavedItem = {
    ...item,
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };
  const updated = [newItem, ...items.filter((i) => i.id !== newItem.id)].slice(0, 100);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save item:', e);
  }
  return newItem;
}

export function deleteSavedItem(id: string): SavedItem[] {
  const items = getSavedItems().filter((i) => i.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to delete item:', e);
  }
  return items;
}

export function toggleFavorite(id: string): SavedItem[] {
  const items = getSavedItems().map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to update item:', e);
  }
  return items;
}

function getDefaultItems(): SavedItem[] {
  return [
    {
      id: 'default_1',
      kind: 'qr',
      title: 'Store Website',
      payload: 'https://omnicode.local',
      config: {
        foregroundColor: '#0f172a',
        backgroundColor: '#ffffff',
        dotStyle: 'rounded',
        cornerFrameStyle: 'rounded',
        cornerDotStyle: 'circle',
        bannerPosition: 'none',
      },
      createdAt: Date.now() - 3600000,
      favorite: true,
    },
    {
      id: 'default_2',
      kind: 'barcode',
      title: 'Espresso Roast 1kg',
      payload: 'ESP-ROAST-9942',
      symbology: 'CODE128',
      config: {
        includeProductCard: true,
        productTitle: 'Espresso Roast 1kg',
        productPrice: '$28.50',
        productSubtitle: 'Artisan Batch A-12',
        companyName: 'Omni Coffee Roasters',
      },
      createdAt: Date.now() - 7200000,
      favorite: true,
    },
    {
      id: 'default_3',
      kind: 'barcode',
      title: 'Retail GTIN-13',
      payload: '200123456789',
      symbology: 'EAN13',
      config: {
        includeProductCard: false,
        barHeight: 70,
        showText: true,
      },
      createdAt: Date.now() - 10800000,
      favorite: false,
    },
  ];
}
