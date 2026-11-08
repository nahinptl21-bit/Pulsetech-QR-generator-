import React from 'react';
import {
  QrCode,
  Barcode,
  Hash,
  Printer,
  Scan,
  Bookmark,
  ShieldCheck,
} from 'lucide-react';

export type AppTab = 'qr' | 'barcode' | 'unique_id' | 'labels' | 'scanner' | 'saved';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, savedCount }) => {
  const tabs = [
    { id: 'qr' as AppTab, label: 'QR Code Studio', icon: QrCode },
    { id: 'barcode' as AppTab, label: 'Barcode Studio', icon: Barcode },
    { id: 'unique_id' as AppTab, label: 'Unique ID & Codes', icon: Hash },
    { id: 'labels' as AppTab, label: 'Printable Label Sheets', icon: Printer },
    { id: 'scanner' as AppTab, label: 'Scanner & Validator', icon: Scan },
    { id: 'saved' as AppTab, label: 'Saved Library', icon: Bookmark, badge: savedCount },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">OmniCode</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden md:inline-flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  Zero 3rd-Party • 100% Client-Side
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Professional QR Code, Barcode & Unique ID Suite
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2" aria-label="Main Navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-700 text-slate-300'
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
