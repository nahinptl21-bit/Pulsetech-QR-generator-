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
import { ShieldCheck, Sparkles, Lock, Cpu, Globe2 } from 'lucide-react';

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
        {/* Banner Pill - Zero 3rd Party Guarantee */}
        <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">
                  100% Client-Side Engine
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Air-Gapped & Private
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Zero external APIs, zero tracking, zero cloud dependencies. All QR matrices, barcode bars, and cryptographic IDs are synthesized locally.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 sm:border-l sm:border-slate-800 sm:pl-4">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Offline Support</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero 3rd Party</span>
            </div>
          </div>
        </div>

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
