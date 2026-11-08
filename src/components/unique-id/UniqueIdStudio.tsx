import React, { useState, useMemo } from 'react';
import {
  Hash,
  Sparkles,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  QrCode,
  Barcode,
  Layers,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Clock,
  KeyRound,
  FileText,
  Sliders,
} from 'lucide-react';
import {
  IdType,
  generateBatch,
  GeneratedIdItem,
  SkuOptions,
  MaskOptions,
  NanoIdOptions,
  VoucherOptions,
} from '../../lib/unique-id/generator';

interface UniqueIdStudioProps {
  onSendToQr?: (code: string) => void;
  onSendToBarcode?: (code: string) => void;
  onSendBatchToLabels?: (items: { code: string; title?: string }[]) => void;
}

export const UniqueIdStudio: React.FC<UniqueIdStudioProps> = ({
  onSendToQr,
  onSendToBarcode,
  onSendBatchToLabels,
}) => {
  const [selectedType, setSelectedType] = useState<IdType>('SKU');
  const [count, setCount] = useState<number>(10);

  // SKU Options
  const [skuPrefix, setSkuPrefix] = useState('PRD');
  const [skuCategory, setSkuCategory] = useState('ELEC');
  const [skuIncludeDate, setSkuIncludeDate] = useState(true);
  const [skuCounterType, setSkuCounterType] = useState<'sequential' | 'random'>('sequential');
  const [skuStartCounter, setSkuStartCounter] = useState(1);
  const [skuSuffix, setSkuSuffix] = useState('US');

  // Mask Options
  const [serialMask, setSerialMask] = useState('SN-####-@@@@-????');

  // NanoID Options
  const [nanoidLength, setNanoidLength] = useState(16);
  const [nanoidAlphabet, setNanoidAlphabet] = useState<'url-safe' | 'alphanumeric' | 'human-safe' | 'numeric' | 'hex'>('human-safe');

  // Voucher Options
  const [voucherChunks, setVoucherChunks] = useState(3);
  const [voucherChunkLen, setVoucherChunkLen] = useState(4);
  const [voucherCharset, setVoucherCharset] = useState<'numeric' | 'alphanumeric' | 'human-safe'>('human-safe');

  // Generated Items
  const [generatedItems, setGeneratedItems] = useState<GeneratedIdItem[]>(() => {
    return generateBatch({
      type: 'SKU',
      count: 10,
      skuOptions: {
        prefix: 'PRD',
        category: 'ELEC',
        includeDate: true,
        counterType: 'sequential',
        startCounter: 1,
        suffix: 'US',
      },
    });
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyAllStatus, setCopyAllStatus] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Handle generation
  const handleGenerate = () => {
    const skuOpts: SkuOptions = {
      prefix: skuPrefix,
      category: skuCategory,
      includeDate: skuIncludeDate,
      counterType: skuCounterType,
      startCounter: skuStartCounter,
      suffix: skuSuffix,
    };

    const maskOpts: MaskOptions = {
      mask: serialMask,
      uppercase: true,
    };

    const nanoOpts: NanoIdOptions = {
      length: nanoidLength,
      alphabetType: nanoidAlphabet,
    };

    const voucherOpts: VoucherOptions = {
      chunks: voucherChunks,
      chunkLength: voucherChunkLen,
      charset: voucherCharset,
    };

    const items = generateBatch({
      type: selectedType,
      count,
      skuOptions: skuOpts,
      maskOptions: maskOpts,
      nanoidOptions: nanoOpts,
      voucherOptions: voucherOpts,
    });

    setGeneratedItems(items);
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return generatedItems;
    const q = searchFilter.toLowerCase();
    return generatedItems.filter((item) => item.id.toLowerCase().includes(q));
  }, [generatedItems, searchFilter]);

  // Copy single
  const handleCopySingle = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Copy all
  const handleCopyAll = () => {
    const all = generatedItems.map((i) => i.id).join('\n');
    navigator.clipboard.writeText(all);
    setCopyAllStatus(true);
    setTimeout(() => setCopyAllStatus(false), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = 'Index,Unique_Code_ID,Type,Created_At\n';
    const rows = generatedItems
      .map(
        (item, idx) =>
          `${idx + 1},"${item.id}","${item.type}","${new Date(item.createdAt).toISOString()}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unique-ids-${selectedType.toLowerCase()}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(generatedItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unique-ids-${selectedType.toLowerCase()}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Send batch to printable label sheet
  const handleSendBatch = () => {
    if (!onSendBatchToLabels) return;
    const items = generatedItems.map((item, idx) => ({
      code: item.id,
      title: `${selectedType} #${idx + 1}`,
    }));
    onSendBatchToLabels(items);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Generator Form & Parameters */}
      <div className="lg:col-span-5 space-y-6">
        {/* Generator Type Selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Select ID / Code Generator Algorithm
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: 'SKU' as IdType,
                label: 'SKU & Inventory Tag',
                desc: 'Prefix-Category-Date-Counter',
                icon: FileText,
              },
              {
                id: 'SERIAL_MASK' as IdType,
                label: 'Serial Pattern Mask',
                desc: 'Custom format SN-####-@@@@',
                icon: Sliders,
              },
              {
                id: 'UUID_V7' as IdType,
                label: 'UUID v7 (Time-Ordered)',
                desc: 'RFC 9562 Chronological',
                icon: Clock,
              },
              {
                id: 'UUID_V4' as IdType,
                label: 'UUID v4 (Random)',
                desc: 'RFC 4122 Cryptographic',
                icon: ShieldCheck,
              },
              {
                id: 'NANOID' as IdType,
                label: 'NanoID / Secure Token',
                desc: 'Safe compact string',
                icon: KeyRound,
              },
              {
                id: 'VOUCHER_PIN' as IdType,
                label: 'Voucher / Redeem PIN',
                desc: 'XXXX-XXXX-XXXX blocks',
                icon: Hash,
              },
              {
                id: 'EAN13_VALID' as IdType,
                label: 'Valid EAN-13 Barcodes',
                desc: '13-digit with check digit',
                icon: Barcode,
              },
              {
                id: 'SHORT_UUID' as IdType,
                label: 'Short UUID (Base58)',
                desc: 'Compact Bitcoin alphabet',
                icon: Sparkles,
              },
            ].map((t) => {
              const Icon = t.icon;
              const isSel = selectedType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSel
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-slate-900">{t.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Algorithm Specific Parameters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            Algorithm Parameters
          </h3>

          {selectedType === 'SKU' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={skuPrefix}
                    onChange={(e) => setSkuPrefix(e.target.value)}
                    placeholder="PRD"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category Code</label>
                  <input
                    type="text"
                    value={skuCategory}
                    onChange={(e) => setSkuCategory(e.target.value)}
                    placeholder="ELEC"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Counter Type</label>
                  <select
                    value={skuCounterType}
                    onChange={(e) => setSkuCounterType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="sequential">Sequential (0001, 0002...)</option>
                    <option value="random">Random Alphanumeric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Suffix</label>
                  <input
                    type="text"
                    value={skuSuffix}
                    onChange={(e) => setSkuSuffix(e.target.value)}
                    placeholder="US"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg uppercase"
                  />
                </div>
              </div>

              {skuCounterType === 'sequential' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Counter Number</label>
                  <input
                    type="number"
                    min="1"
                    value={skuStartCounter}
                    onChange={(e) => setSkuStartCounter(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={skuIncludeDate}
                  onChange={(e) => setSkuIncludeDate(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Include YYYYMMDD Date Stamp
              </label>
            </div>
          )}

          {selectedType === 'SERIAL_MASK' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pattern Mask Template
                </label>
                <input
                  type="text"
                  value={serialMask}
                  onChange={(e) => setSerialMask(e.target.value)}
                  placeholder="SN-####-@@@@-????"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600 border border-slate-200">
                <div className="font-semibold text-slate-800 mb-1">Mask Syntax Tokens:</div>
                <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                  <div><span className="text-blue-600 font-bold">#</span> = Digit (0-9)</div>
                  <div><span className="text-indigo-600 font-bold">@</span> = Letter (A-Z)</div>
                  <div><span className="text-emerald-600 font-bold">?</span> = Alphanumeric</div>
                  <div><span className="text-amber-600 font-bold">*</span> = Ambiguity-Free</div>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'NANOID' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Length</label>
                  <input
                    type="number"
                    min="6"
                    max="64"
                    value={nanoidLength}
                    onChange={(e) => setNanoidLength(parseInt(e.target.value, 10) || 16)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Character Set</label>
                  <select
                    value={nanoidAlphabet}
                    onChange={(e) => setNanoidAlphabet(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="human-safe">Human-Safe (No 0, O, 1, I, l)</option>
                    <option value="alphanumeric">Alphanumeric (A-Z, a-z, 0-9)</option>
                    <option value="url-safe">URL-Safe (Base64 standard)</option>
                    <option value="numeric">Numbers Only (0-9)</option>
                    <option value="hex">Hexadecimal (0-9, a-f)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'VOUCHER_PIN' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Chunks</label>
                  <input
                    type="number"
                    min="2"
                    max="6"
                    value={voucherChunks}
                    onChange={(e) => setVoucherChunks(parseInt(e.target.value, 10) || 3)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Chunk Length</label>
                  <input
                    type="number"
                    min="3"
                    max="8"
                    value={voucherChunkLen}
                    onChange={(e) => setVoucherChunkLen(parseInt(e.target.value, 10) || 4)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Characters</label>
                  <select
                    value={voucherCharset}
                    onChange={(e) => setVoucherCharset(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="human-safe">Human Safe</option>
                    <option value="numeric">Numbers</option>
                    <option value="alphanumeric">Alphanumeric</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Batch Count & Generate Button */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Quantity to Generate</label>
              <div className="flex items-center gap-1.5">
                {[5, 10, 25, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      count === n ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="500"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1)))}
                className="w-24 px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <button
                onClick={handleGenerate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Generate {count} Unique IDs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Generated Results & Batch Hub */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {/* Header & Batch Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Generated Unique Codes & IDs</span>
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold">
                  {generatedItems.length} Unique
                </span>
              </h3>
              <p className="text-xs text-slate-500">100% Guaranteed unique distinct items in this batch</p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700"
              >
                {copyAllStatus ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copyAllStatus ? 'Copied All!' : 'Copy All'}
              </button>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                CSV
              </button>

              <button
                onClick={handleExportJson}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                JSON
              </button>

              {onSendBatchToLabels && (
                <button
                  onClick={handleSendBatch}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Print Label Sheet
                </button>
              )}
            </div>
          </div>

          {/* Search Filter */}
          <div className="py-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search generated codes..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table of Generated IDs */}
          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[460px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 sticky top-0 z-10 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">#</th>
                  <th className="px-3 py-2.5">Unique Code / ID Value</th>
                  <th className="px-3 py-2.5 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs font-mono">
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2 text-center text-slate-400 text-[11px] font-sans">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900 select-all">
                      {item.id}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1 font-sans">
                        <button
                          onClick={() => handleCopySingle(item.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Copy ID"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {onSendToQr && (
                          <button
                            onClick={() => onSendToQr(item.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Generate QR code for this ID"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onSendToBarcode && (
                          <button
                            onClick={() => onSendToBarcode(item.id)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Generate Barcode for this ID"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
