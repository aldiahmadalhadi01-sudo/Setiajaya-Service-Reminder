import React from 'react';
import { RefreshCw, Calendar, Menu } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface TopNavbarProps {
  activeTab: ActiveTab;
  refreshing: boolean;
  onRefresh: () => void;
  isConnected: boolean;
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  refreshing,
  onRefresh,
  isConnected,
  onOpenMobileMenu
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Service Analytics';
      case 'reminder':
        return 'Reminder Service Berkala';
      case 'history':
        return 'Riwayat Unit & Timeline';
      case 'dec':
        return 'Input & Manajemen DEC';
      case 'service_call':
        return 'Input & Manajemen Service Call';
      default:
        return 'Dashboard';
    }
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const driveLogoUrl = "https://lh3.googleusercontent.com/d/1hFjw0SOG2Y32pO6H3PkLnHJxBbLrnP7p";

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Brand Logo */}
        <div className="md:hidden flex items-center gap-2 flex-shrink-0 pr-1">
          <img
            src={driveLogoUrl}
            alt="Toyota Logo"
            referrerPolicy="no-referrer"
            className="w-6 h-6 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <h1 className="text-sm sm:text-lg md:text-xl font-bold text-slate-800 tracking-tight truncate">
          {getTabTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg font-medium">
          <Calendar size={14} className="text-slate-500" />
          <span>{formattedDate}</span>
        </div>



        {/* Manual Data Refresh Trigger */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#001E50] text-white hover:bg-blue-900 text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          title="Refresh Data Spreadsheet Realtime"
        >
          <RefreshCw size={14} className={`flex-shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Memuat...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
};

