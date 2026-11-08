/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { QRCodeStudio } from './components/qr/QRCodeStudio';
import { BarcodeStudio } from './components/barcode/BarcodeStudio';
import { UniqueIdStudio } from './components/unique-id/UniqueIdStudio';
import { LabelSheetStudio } from './components/labels/LabelSheetStudio';
import { ScannerStudio } from './components/scanner/ScannerStudio';
import { SavedStudio } from './components/saved/SavedStudio';
import { getSavedItems } from './lib/storage';
import { SheetItem } from './lib/label-sheet';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('qr');
  const [savedCount, setSavedCount] = useState<number>(() => getSavedItems().length);

  // Cross-tab transfer states
  const [qrPrefill, setQrPrefill] = useState<{ payload?: string; title?: string }>({});
  const [barcodePrefill, setBarcodePrefill] = useState<{
    payload?: string;
    symbology?: any;
    title?: string;
  }>({});
  const [labelSheetItems, setLabelSheetItems] = useState<SheetItem[]>([]);

  const handleRefreshSavedCount = () => {
    setSavedCount(getSavedItems().length);
  };

  const handleSendToQr = (payload: string, title?: string) => {
    setQrPrefill({ payload, title });
    setActiveTab('qr');
  };

  const handleSendToBarcode = (payload: string, symbology?: any, title?: string) => {
    setBarcodePrefill({ payload, symbology, title });
    setActiveTab('barcode');
  };

  const handleSendSingleToLabels = (code: string, title?: string, price?: string) => {
    setLabelSheetItems([{ id: 'single_1', code, title, price }]);
    setActiveTab('labels');
  };

  const handleSendBatchToLabels = (batch: { code: string; title?: string }[]) => {
    const formatted: SheetItem[] = batch.map((item, idx) => ({
      id: `batch_${Date.now()}_${idx}`,
      code: item.code,
      title: item.title || `Item #${idx + 1}`,
      price: '$19.99',
    }));
    setLabelSheetItems(formatted);
    setActiveTab('labels');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">


        {/* Studio Content by Tab */}
        {activeTab === 'qr' && (
          <QRCodeStudio
            key={qrPrefill.payload || 'default_qr'}
            initialPayload={qrPrefill.payload}
            initialTitle={qrPrefill.title}
            onSaveSuccess={handleRefreshSavedCount}
            onSendToLabels={handleSendSingleToLabels}
          />
        )}

        {activeTab === 'barcode' && (
          <BarcodeStudio
            key={barcodePrefill.payload || 'default_bar'}
            initialPayload={barcodePrefill.payload}
            initialSymbology={barcodePrefill.symbology}
            initialTitle={barcodePrefill.title}
            onSaveSuccess={handleRefreshSavedCount}
            onSendToLabels={handleSendSingleToLabels}
          />
        )}

        {activeTab === 'unique_id' && (
          <UniqueIdStudio
            onSendToQr={handleSendToQr}
            onSendToBarcode={handleSendToBarcode}
            onSendBatchToLabels={handleSendBatchToLabels}
          />
        )}

        {activeTab === 'labels' && (
          <LabelSheetStudio initialItems={labelSheetItems} />
        )}

        {activeTab === 'scanner' && (
          <ScannerStudio
            onSendToQr={handleSendToQr}
            onSendToBarcode={handleSendToBarcode}
          />
        )}

        {activeTab === 'saved' && (
          <SavedStudio
            onLoadQr={handleSendToQr}
            onLoadBarcode={handleSendToBarcode}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            OmniCode Studio — Self-Contained QR Code, Barcode & Unique ID Suite
          </span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>ISO/IEC 18004 Standard QR</span>
            <span>•</span>
            <span>GS1 Standard Barcodes</span>
            <span>•</span>
            <span>RFC 4122 / 9562 UUIDs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
