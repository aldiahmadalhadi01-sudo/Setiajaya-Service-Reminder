import React from 'react';
import {
  LayoutDashboard,
  BellRing,
  History,
  FileSpreadsheet,
  Wrench,
  ChevronLeft,
  ChevronRight,
  X,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ActiveTab = 'dashboard' | 'reminder' | 'history' | 'dec' | 'service_call';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isConnected: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  isConnected,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'reminder' as ActiveTab,
      label: 'Reminder Service',
      icon: BellRing,
      badge: 'Realtime'
    },
    {
      id: 'history' as ActiveTab,
      label: 'Riwayat Unit Service',
      icon: History,
      badge: null
    },
    {
      id: 'dec' as ActiveTab,
      label: 'Input DEC',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'service_call' as ActiveTab,
      label: 'Input Service Call',
      icon: Wrench,
      badge: null
    }
  ];

  // Direct Google Drive Image Links with high-availability fallback
  const driveLogoUrl = "https://lh3.googleusercontent.com/d/1hFjw0SOG2Y32pO6H3PkLnHJxBbLrnP7p";
  const fallbackDriveUrl = "https://drive.google.com/uc?export=view&id=1hFjw0SOG2Y32pO6H3PkLnHJxBbLrnP7p";

  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR (hidden on mobile) */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex relative flex-col h-screen bg-[#001E50] text-white border-r border-blue-900/40 shadow-2xl z-30 select-none flex-shrink-0"
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-blue-900/50 h-16">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 flex-shrink-0 overflow-hidden shadow-inner">
              <img
                src={driveLogoUrl}
                alt="Setiajaya Toyota Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain mix-blend-screen bg-transparent"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== fallbackDriveUrl) {
                    target.src = fallbackDriveUrl;
                  } else {
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-xs font-black text-[#EB0A1E]">SJA</span>`;
                    }
                  }
                }}
              />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col"
              >
                <div className="font-extrabold tracking-tight text-base leading-none">
                  <span className="text-white">SETIAJAYA</span>{' '}
                  <span className="text-[#EB0A1E]">TOYOTA</span>
                </div>
                <span className="text-[10px] text-blue-200 tracking-wider uppercase font-semibold mt-1">
                  Service Analytics
                </span>
              </motion.div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-blue-900/40 text-blue-200 hover:text-white hover:bg-blue-800/60 transition-all cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Menu List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                    : 'text-blue-200 hover:bg-blue-900/40 hover:text-white'
                }`}
              >
                <Icon
                  size={20}
                  className={`${
                    isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'
                  } transition-colors flex-shrink-0`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between w-full overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-800/80 text-blue-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Connection & Footer Status */}
        <div className="p-3 border-t border-blue-900/50 bg-blue-950/40">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-blue-900/30 border border-blue-800/40">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div className="flex flex-col text-xs overflow-hidden">
                <span className="font-semibold text-white truncate">
                  {isConnected ? 'Google Sheet Active' : 'Local Data Mode'}
                </span>
                <span className="text-[10px] text-blue-300 truncate">
                  {isConnected ? 'Syncing with GAS REST API' : 'Direct Local Cache'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={isConnected ? 'Google Sheet Active' : 'Local Data Mode'}>
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>
          )}
        </div>
      </motion.aside>

      {/* MOBILE OVERLAY DRAWER (visible when mobileMenuOpen is true on < md screens) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-4/5 max-w-xs bg-[#001E50] text-white flex flex-col h-full shadow-2xl z-10 border-r border-blue-900/50"
            >
              {/* Mobile Drawer Header */}
              <div className="p-4 flex items-center justify-between border-b border-blue-900/50 h-16">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 flex-shrink-0 overflow-hidden">
                    <img
                      src={driveLogoUrl}
                      alt="Setiajaya Toyota Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain mix-blend-screen bg-transparent"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== fallbackDriveUrl) {
                          target.src = fallbackDriveUrl;
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="font-extrabold tracking-tight text-sm leading-none">
                      <span className="text-white">SETIAJAYA</span>{' '}
                      <span className="text-[#EB0A1E]">TOYOTA</span>
                    </div>
                    <span className="text-[9px] text-blue-200 tracking-wider uppercase font-semibold mt-0.5">
                      Service Analytics
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-200 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Menu Links */}
              <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                          : 'text-blue-100 hover:bg-blue-900/40'
                      }`}
                    >
                      <Icon
                        size={20}
                        className={`${
                          isActive ? 'text-white' : 'text-blue-300'
                        } flex-shrink-0`}
                      />
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-blue-800/80 text-blue-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Footer Connection Status */}
              <div className="p-4 border-t border-blue-900/50 bg-blue-950/60">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-900/40 border border-blue-800/50 text-xs">
                  <Database size={16} className="text-blue-300" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">
                      {isConnected ? 'Google Sheet Active' : 'Local Data Mode'}
                    </span>
                    <span className="text-[10px] text-blue-300">
                      {isConnected ? 'Realtime REST API' : 'Direct Local Cache'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

