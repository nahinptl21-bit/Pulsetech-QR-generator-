import React, { useState, useMemo } from 'react';
import {
  Printer,
  Layers,
  Settings2,
  Trash2,
  Plus,
  QrCode,
  Barcode as BarcodeIcon,
  Tag,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { LABEL_TEMPLATES, LabelTemplate, SheetItem } from '../../lib/label-sheet';
import { renderQRCodeToSVG } from '../../lib/qr/render';
import { renderBarcodeToSVG } from '../../lib/barcode/render';
import { BarcodeSymbology } from '../../lib/barcode/types';

interface LabelSheetStudioProps {
  initialItems?: SheetItem[];
}

export const LabelSheetStudio: React.FC<LabelSheetStudioProps> = ({ initialItems }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('avery-5160');
  const [codeType, setCodeType] = useState<'barcode' | 'qr'>('barcode');
  const [symbology, setSymbology] = useState<BarcodeSymbology>('CODE128');
  const [repeatSingleCode, setRepeatSingleCode] = useState<boolean>(false);

  // Common label headers
  const [commonTitle, setCommonTitle] = useState('Standard Asset');
  const [commonPrice, setCommonPrice] = useState('$19.99');
  const [showPrice, setShowPrice] = useState(true);

  // Items list
  const [items, setItems] = useState<SheetItem[]>(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    return [
      { id: '1', code: 'PRD-ELEC-0001', title: 'Wireless Mouse', price: '$24.99' },
      { id: '2', code: 'PRD-ELEC-0002', title: 'Mechanical Keyboard', price: '$89.00' },
      { id: '3', code: 'PRD-ELEC-0003', title: 'USB-C Fast Hub', price: '$35.50' },
      { id: '4', code: 'PRD-ELEC-0004', title: 'HDMI 4K Cable', price: '$12.99' },
      { id: '5', code: 'PRD-ELEC-0005', title: 'Noise-Canceling Pods', price: '$129.00' },
      { id: '6', code: 'PRD-ELEC-0006', title: 'Desk Charging Pad', price: '$29.99' },
    ];
  });

  const [bulkInput, setBulkInput] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const activeTemplate = useMemo(() => {
    return LABEL_TEMPLATES.find((t) => t.id === selectedTemplateId) || LABEL_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Handle Bulk Paste of codes
  const handleBulkAdd = () => {
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const newItems: SheetItem[] = lines.map((line, idx) => ({
      id: `bulk_${Date.now()}_${idx}`,
      code: line,
      title: commonTitle ? `${commonTitle} #${items.length + idx + 1}` : undefined,
      price: showPrice ? commonPrice : undefined,
    }));

    setItems([...items, ...newItems]);
    setBulkInput('');
    setShowBulkModal(false);
  };

  const handleClearAll = () => {
    setItems([]);
  };

  // Generate labels to display for preview
  const displayLabels = useMemo(() => {
    const totalSlots = activeTemplate.labelsPerPage;
    if (repeatSingleCode && items.length > 0) {
      const single = items[0];
      return Array.from({ length: totalSlots }, (_, i) => ({
        ...single,
        id: `slot_${i}`,
      }));
    }

    const filled: SheetItem[] = [];
    for (let i = 0; i < totalSlots; i++) {
      if (i < items.length) {
        filled.push(items[i]);
      } else {
        // empty placeholder slot
        filled.push({ id: `empty_${i}`, code: '', title: '' });
      }
    }
    return filled;
  }, [activeTemplate, items, repeatSingleCode]);

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration Bar (Hidden in Print) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              Printable Label Sheet Studio
            </h2>
            <p className="text-xs text-slate-500">
              Print batch QR and Barcode adhesive stickers on standard Avery label sheets (Avery 5160, 5163, A4)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Batch Paste Codes
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Print Label Sheet
            </button>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Label Template Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Label Sheet Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {LABEL_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">{activeTemplate.description}</p>
          </div>

          {/* Code Symbology Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Code Format</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setCodeType('barcode')}
                className={`py-1.5 px-2 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 ${
                  codeType === 'barcode'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <BarcodeIcon className="w-3.5 h-3.5" />
                Barcode
              </button>
              <button
                onClick={() => setCodeType('qr')}
                className={`py-1.5 px-2 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 ${
                  codeType === 'qr'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Code
              </button>
            </div>
          </div>

          {/* Repeat Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Filling Mode</label>
            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatSingleCode}
                  onChange={(e) => setRepeatSingleCode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Repeat 1st Code across all labels
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {items.length} unique items in list ({items.length >= activeTemplate.labelsPerPage ? 'Full Page' : `${items.length}/${activeTemplate.labelsPerPage} slots`})
            </p>
          </div>

          {/* Display Details */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Show Price</label>
            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Display Price on Labels
              </label>
              {items.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-rose-600 hover:underline ml-auto flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Input Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Batch Paste Codes / Payloads</h3>
            <p className="text-xs text-slate-500">
              Paste one code or ID per line to populate the label sheet automatically.
            </p>
            <textarea
              rows={8}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="PRD-0001&#10;PRD-0002&#10;PRD-0003..."
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAdd}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                Import Codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Sheet Area */}
      <div className="bg-slate-100/70 p-4 sm:p-8 rounded-xl border border-slate-200 overflow-x-auto flex justify-center print:bg-white print:p-0 print:border-none">
        {/* Physical Sheet Container */}
        <div
          className="bg-white shadow-lg print:shadow-none p-4 rounded-sm border border-slate-200 print:border-none print:p-0"
          style={{
            width: activeTemplate.paperSize === 'letter' ? '8.5in' : '210mm',
            minHeight: activeTemplate.paperSize === 'letter' ? '11in' : '297mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Label Grid */}
          <div
            className="grid gap-2 print:gap-1"
            style={{
              gridTemplateColumns: `repeat(${activeTemplate.cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${activeTemplate.rows}, minmax(0, 1fr))`,
            }}
          >
            {displayLabels.map((item, idx) => {
              if (!item.code) {
                // Empty placeholder slot
                return (
                  <div
                    key={item.id}
                    className="border border-dashed border-slate-200 rounded p-2 flex items-center justify-center text-slate-300 text-[10px] print:border-transparent"
                    style={{ minHeight: `${activeTemplate.labelHeightMm}mm` }}
                  >
                    Slot #{idx + 1}
                  </div>
                );
              }

              // Render mini SVG for this label
              let miniSvg = '';
              try {
                if (codeType === 'qr') {
                  miniSvg = renderQRCodeToSVG(item.code, {
                    size: 80,
                    margin: 1,
                    foregroundColor: '#000000',
                    backgroundColor: '#ffffff',
                    dotStyle: 'square',
                  });
                } else {
                  miniSvg = renderBarcodeToSVG(item.code, symbology, {
                    barWidth: 1,
                    barHeight: 34,
                    margin: 4,
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    showText: true,
                    fontSize: 10,
                  }).svg;
                }
              } catch (e) {
                miniSvg = `<svg width="80" height="34"><text y="20" font-size="10">Error</text></svg>`;
              }

              return (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center text-center bg-white print:border-none relative overflow-hidden"
                  style={{
                    minHeight: `${activeTemplate.labelHeightMm}mm`,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Title & Price Header */}
                  {(item.title || (showPrice && item.price)) && (
                    <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-800 px-1 mb-0.5 truncate leading-tight">
                      <span className="truncate">{item.title || 'Product Item'}</span>
                      {showPrice && item.price && (
                        <span className="font-extrabold text-emerald-800 shrink-0 ml-1">
                          {item.price}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Code Graphics */}
                  <div
                    className="flex items-center justify-center my-auto max-w-full"
                    dangerouslySetInnerHTML={{ __html: miniSvg }}
                  />

                  {/* QR Raw text fallback if QR */}
                  {codeType === 'qr' && (
                    <div className="text-[9px] font-mono text-slate-600 truncate max-w-full mt-0.5">
                      {item.code}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
