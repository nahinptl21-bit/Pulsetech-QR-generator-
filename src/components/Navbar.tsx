import React from 'react';
import {
  QrCode,
  Barcode,
  Hash,
  Printer,
  Scan,
  Bookmark,
} from 'lucide-react';

export type AppTab = 'qr' | 'barcode' | 'unique_id' | 'labels' | 'scanner' | 'saved';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, savedCount }) => {
  const tabs = [
    { id: 'qr' as AppTab, label: 'QR Code', icon: QrCode },
    { id: 'barcode' as AppTab, label: 'Barcode', icon: Barcode },
    { id: 'unique_id' as AppTab, label: 'Unique IDs & Codes', icon: Hash },
    { id: 'labels' as AppTab, label: 'Label Sheets', icon: Printer },
    { id: 'scanner' as AppTab, label: 'Scanner', icon: Scan },
    { id: 'saved' as AppTab, label: 'Saved Library', icon: Bookmark, badge: savedCount },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Clean Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block leading-none">
                OmniCode
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Studio
              </span>
            </div>
          </div>

          {/* Clean Modern Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none" aria-label="Main Navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${
                        isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
