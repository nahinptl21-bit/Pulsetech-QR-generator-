import React, { useState, useMemo } from 'react';
import {
  Barcode as BarcodeIcon,
  Tag,
  Download,
  Copy,
  Printer,
  Bookmark,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { BarcodeSymbology, BarcodeDesignOptions } from '../../lib/barcode/types';
import { renderBarcodeToSVG } from '../../lib/barcode/render';
import { generateValidEan13, generateSku } from '../../lib/unique-id/generator';
import { downloadSvg, downloadPng, copyPngToClipboard } from '../../lib/export';
import { saveItem } from '../../lib/storage';

interface BarcodeStudioProps {
  onSaveSuccess?: () => void;
  onSendToLabels?: (code: string, title?: string, price?: string) => void;
  initialPayload?: string;
  initialSymbology?: BarcodeSymbology;
  initialTitle?: string;
}

export const BarcodeStudio: React.FC<BarcodeStudioProps> = ({
  onSaveSuccess,
  onSendToLabels,
  initialPayload,
  initialSymbology = 'CODE128',
  initialTitle,
}) => {
  const [symbology, setSymbology] = useState<BarcodeSymbology>(initialSymbology);
  const [payload, setPayload] = useState<string>(initialPayload || 'OMNI-7829-PROD');

  // Product Card Details
  const [includeProductCard, setIncludeProductCard] = useState<boolean>(true);
  const [productTitle, setProductTitle] = useState<string>(initialTitle || 'Artisan Olive Oil 500ml');
  const [productSubtitle, setProductSubtitle] = useState<string>('SKU: OIL-EV-500 • Extra Virgin');
  const [productPrice, setProductPrice] = useState<string>('$18.50');
  const [companyName, setCompanyName] = useState<string>('Mediterranean Harvest Ltd.');

  // Dimensions & Styling
  const [barWidth, setBarWidth] = useState<number>(2);
  const [barHeight, setBarHeight] = useState<number>(75);
  const [margin, setMargin] = useState<number>(20);
  const [barColor, setBarColor] = useState<string>('#0f172a');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [showText, setShowText] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(14);

  // Status & Export
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [pngScale, setPngScale] = useState<number>(2);

  // Helper generators
  const handleGenerateValidEan = () => {
    const ean = generateValidEan13('200');
    setSymbology('EAN13');
    setPayload(ean);
  };

  const handleGenerateSku = () => {
    const sku = generateSku({ prefix: 'PRD', category: 'RET', includeDate: true });
    setSymbology('CODE128');
    setPayload(sku);
  };

  // Generate SVG & Encoded data
  const { svgOutput, encoded } = useMemo(() => {
    const options: BarcodeDesignOptions = {
      barWidth,
      barHeight,
      margin,
      color: barColor,
      backgroundColor: bgColor,
      showText,
      fontSize,
      includeProductCard,
      productTitle: includeProductCard ? productTitle : '',
      productSubtitle: includeProductCard ? productSubtitle : '',
      productPrice: includeProductCard ? productPrice : '',
      companyName: includeProductCard ? companyName : '',
    };

    const res = renderBarcodeToSVG(payload, symbology, options);
    return { svgOutput: res.svg, encoded: res.encoded };
  }, [
    payload,
    symbology,
    barWidth,
    barHeight,
    margin,
    barColor,
    bgColor,
    showText,
    fontSize,
    includeProductCard,
    productTitle,
    productSubtitle,
    productPrice,
    companyName,
  ]);

  const handleCopy = async () => {
    const success = await copyPngToClipboard(svgOutput);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    const title = productTitle || `${symbology} Barcode: ${payload}`;
    saveItem({
      kind: 'barcode',
      title,
      payload,
      symbology,
      config: {
        includeProductCard,
        productTitle,
        productSubtitle,
        productPrice,
        companyName,
        barHeight,
        barWidth,
      },
      favorite: false,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    if (onSaveSuccess) onSaveSuccess();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode Label</title>
          <style>
            @page { margin: 10mm; }
            body { display: flex; align-items: center; justify-content: center; min-height: 90vh; font-family: sans-serif; }
            .container { text-align: center; }
            svg { max-width: 420px; height: auto; }
          </style>
        </head>
        <body>
          <div class="container">${svgOutput}</div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Form & Design Options */}
      <div className="lg:col-span-7 space-y-6">
        {/* Symbology Select */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Select Barcode Symbology
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'CODE128', label: 'Code 128 (Auto)', desc: 'General & Logistics' },
              { id: 'EAN13', label: 'EAN-13 (Retail)', desc: '13-digit GS1 Global' },
              { id: 'UPCA', label: 'UPC-A (US Retail)', desc: '12-digit Commercial' },
              { id: 'CODE39', label: 'Code 39', desc: 'Alphanumeric & Defense' },
              { id: 'ITF', label: 'ITF (2 of 5)', desc: 'Master Cartons' },
              { id: 'CODABAR', label: 'Codabar', desc: 'Libraries & Blood Banks' },
            ].map((sym) => {
              const isSel = symbology === sym.id;
              return (
                <button
                  key={sym.id}
                  onClick={() => {
                    setSymbology(sym.id as BarcodeSymbology);
                    if (sym.id === 'EAN13' && !/^\d{12,13}$/.test(payload)) {
                      setPayload(generateValidEan13('200'));
                    } else if (sym.id === 'UPCA' && !/^\d{11,12}$/.test(payload)) {
                      setPayload(generateValidEan13('0').substring(1));
                    }
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSel
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{sym.label}</div>
                  <div className="text-[11px] text-slate-500">{sym.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Barcode Payload Input */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Barcode Payload / Encoded Value
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateValidEan}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Valid EAN-13
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto SKU
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder="Enter value to encode..."
                className={`w-full px-3.5 py-2.5 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  !encoded.isValid ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
            </div>

            {!encoded.isValid && encoded.error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{encoded.error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Label Card Details (Requested feature: "add details in QR code and bar code") */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                Product Label Card Details
              </h3>
              <p className="text-xs text-slate-500">
                Incorporate product name, SKU, price, and company details directly into the barcode label
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeProductCard}
                onChange={(e) => setIncludeProductCard(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {includeProductCard && (
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Product / Item Title
                  </label>
                  <input
                    type="text"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    placeholder="e.g. Organic Honey 500g"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Display Price
                  </label>
                  <input
                    type="text"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="e.g. $14.99"
                    className="w-full px-3 py-1.5 text-sm font-bold text-emerald-700 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subtitle / SKU / Lot #
                  </label>
                  <input
                    type="text"
                    value={productSubtitle}
                    onChange={(e) => setProductSubtitle(e.target.value)}
                    placeholder="e.g. SKU: HON-500 • Batch A"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Company / Brand Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Pure Farms Co."
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barcode Dimensions & Visual Styling */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            Barcode Dimensions & Styling
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Bar Width (Scale)</span>
                <span className="font-mono text-slate-500">{barWidth}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="0.5"
                value={barWidth}
                onChange={(e) => setBarWidth(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Bar Height</span>
                <span className="font-mono text-slate-500">{barHeight}px</span>
              </div>
              <input
                type="range"
                min="35"
                max="140"
                step="5"
                value={barHeight}
                onChange={(e) => setBarHeight(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Quiet Zone (Margin)</span>
                <span className="font-mono text-slate-500">{margin}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bar Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={barColor}
                  onChange={(e) => setBarColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={barColor}
                  onChange={(e) => setBarColor(e.target.value)}
                  className="w-20 px-1.5 py-1 text-xs font-mono border border-slate-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Background</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-20 px-1.5 py-1 text-xs font-mono border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={showText}
                  onChange={(e) => setShowText(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Human-Readable Text
              </label>
            </div>

            {showText && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value={11}>Small (11px)</option>
                  <option value={14}>Medium (14px)</option>
                  <option value={16}>Large (16px)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Live High-Def Preview & Export Hub */}
      <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Live Barcode Preview
            </span>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
              {symbology}
            </span>
          </div>

          {/* Rendered Output Display */}
          <div className="flex items-center justify-center p-4 bg-slate-50/80 rounded-xl border border-slate-100 min-h-[220px] overflow-x-auto">
            <div
              className="max-w-full drop-shadow-sm"
              dangerouslySetInnerHTML={{ __html: svgOutput }}
            />
          </div>

          {/* Quick Info */}
          <div className="mt-4 flex items-center justify-around py-2 border-y border-slate-100 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-700">Symbology: </span>
              {symbology}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Valid: </span>
              <span className={encoded.isValid ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                {encoded.isValid ? 'YES' : 'ERROR'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Engine: </span>
              Pure Client SVG
            </div>
          </div>

          {/* Export Actions */}
          <div className="mt-5 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!encoded.isValid}
                onClick={() => downloadSvg(svgOutput, `barcode-${symbology}-${payload}.svg`)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Download SVG
              </button>

              <button
                disabled={!encoded.isValid}
                onClick={() => downloadPng(svgOutput, `barcode-${symbology}-${payload}.png`, pngScale)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Download PNG ({pngScale}x)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={!encoded.isValid}
                onClick={handleCopy}
                className="flex items-center justify-center gap-1 px-2.5 py-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy PNG'}
              </button>

              <button
                disabled={!encoded.isValid}
                onClick={handlePrint}
                className="flex items-center justify-center gap-1 px-2.5 py-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Label
              </button>

              <button
                disabled={!encoded.isValid}
                onClick={handleSave}
                className="flex items-center justify-center gap-1 px-2.5 py-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                {savedSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                {savedSuccess ? 'Saved!' : 'Save Item'}
              </button>
            </div>

            {/* PNG Resolution Selector */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>PNG Resolution:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPngScale(s)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      pngScale === s ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {s}x {s === 4 ? '(Print 300DPI)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Send to Label Sheet button */}
            {onSendToLabels && (
              <button
                disabled={!encoded.isValid}
                onClick={() => onSendToLabels(payload, productTitle, productPrice)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Send to Printable Avery Label Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
