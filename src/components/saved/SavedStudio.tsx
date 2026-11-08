import React, { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  QrCode,
  Barcode as BarcodeIcon,
  Hash,
  Star,
  Trash2,
  Copy,
  Check,
  Search,
  Download,
  Upload,
  ArrowRight,
} from 'lucide-react';
import { SavedItem, getSavedItems, deleteSavedItem, toggleFavorite } from '../../lib/storage';

interface SavedStudioProps {
  onLoadQr?: (payload: string, title?: string) => void;
  onLoadBarcode?: (payload: string, symbology?: any, title?: string) => void;
}

export const SavedStudio: React.FC<SavedStudioProps> = ({
  onLoadQr,
  onLoadBarcode,
}) => {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'qr' | 'barcode' | 'unique_id'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setItems(getSavedItems());
  }, []);

  const handleToggleFav = (id: string) => {
    const updated = toggleFavorite(id);
    setItems(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteSavedItem(id);
    setItems(updated);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnicode-saved-library-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterType !== 'all' && item.kind !== filterType) return false;
      if (onlyFavorites && !item.favorite) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPayload = item.payload.toLowerCase().includes(q);
        if (!matchTitle && !matchPayload) return false;
      }
      return true;
    });
  }, [items, filterType, onlyFavorites, searchQuery]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600" />
            Saved Library & History
          </h2>
          <p className="text-xs text-slate-500">
            Locally stored QR codes, barcodes, and unique IDs ({items.length} items)
          </p>
        </div>

        <button
          onClick={handleExportBackup}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Export JSON Backup
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Kind Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'qr', label: 'QR Codes' },
            { id: 'barcode', label: 'Barcodes' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ml-2 ${
              onlyFavorites
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : ''}`} />
            Favorites Only
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved items..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 bg-slate-50/40 hover:bg-white transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {item.kind === 'qr' ? (
                      <span className="p-1 rounded bg-blue-100 text-blue-700">
                        <QrCode className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-indigo-100 text-indigo-700">
                        <BarcodeIcon className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                      {item.title}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleFav(item.id)}
                    className="text-slate-400 hover:text-amber-500"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        item.favorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200 text-xs font-mono text-slate-700 truncate select-all">
                  {item.payload}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {item.symbology ? `Symbology: ${item.symbology}` : 'QR Format'}
                  </span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopy(item.id, item.payload)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {item.kind === 'qr' && onLoadQr && (
                    <button
                      onClick={() => onLoadQr(item.payload, item.title)}
                      className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-1"
                    >
                      <span>Edit</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {item.kind === 'barcode' && onLoadBarcode && (
                    <button
                      onClick={() => onLoadBarcode(item.payload, item.symbology, item.title)}
                      className="px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded flex items-center gap-1"
                    >
                      <span>Edit</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Bookmark className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-medium">No saved items found.</p>
          <p className="text-xs text-slate-400">
            Generate and click "Save Item" in QR or Barcode studio to bookmark items here.
          </p>
        </div>
      )}
    </div>
  );
};
