import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Phone, Upload, Bell, Search, LogOut, Settings, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { cn } from '@tripalfa/shared-features';

export default function ConsultantLayout() {
  const location = useLocation();
  const { notifications, removeNotification, channel, posTag } = useCustomer();
  const [searchFocused, setSearchFocused] = useState(false);

  const navItems = [
    { path: '/', label: 'Terminal', icon: LayoutDashboard, exact: true },
    { path: '/queues', label: 'Booking Queues', icon: FileText },
    { path: '/support/new', label: 'Support', icon: Phone },
    { path: '/import-pnr', label: 'Import PNR', icon: Upload },
  ];

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const getNotifIcon = (type: string) => {
    if (type === 'success') return <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />;
    if (type === 'error') return <AlertCircle size={14} className="text-red-400 shrink-0" />;
    return <Info size={14} className="text-apple-blue shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex font-sans">
      {/* Premium Sidebar */}
      <aside className="w-64 bg-[#1c1c1e] flex flex-col shadow-2xl shrink-0">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-apple-blue/20 border border-apple-blue/30 rounded-xl flex items-center justify-center">
              <Phone size={16} className="text-apple-blue" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white tracking-widest uppercase">Call Center</p>
              <p className="text-[9px] text-white/30 font-medium tracking-wider uppercase mt-0.5">Agent Terminal</p>
            </div>
          </div>
        </div>

        {/* Channel & POS pill */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 bg-apple-blue/10 border border-apple-blue/20 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse" />
            <span className="text-[10px] font-bold text-apple-blue tracking-widest uppercase">{channel}</span>
            <span className="ml-auto text-[9px] font-bold text-white/20 tracking-wider">{posTag}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                  active
                    ? 'bg-apple-blue/15 border border-apple-blue/25 text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
                )}
              >
                <item.icon
                  size={16}
                  className={cn(
                    'transition-colors',
                    active ? 'text-apple-blue' : 'text-white/30 group-hover:text-white/60'
                  )}
                />
                <span className="text-[12px] font-semibold tracking-tight">{item.label}</span>
                {active && <span className="ml-auto w-1 h-4 bg-apple-blue rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* Agent Identity Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-3 py-3 bg-white/5 rounded-xl border border-white/5">
            <div className="w-8 h-8 bg-apple-blue/20 border border-apple-blue/30 rounded-xl flex items-center justify-center">
              <span className="text-[10px] font-bold text-apple-blue">CC</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white truncate">Consultant Agent</p>
              <p className="text-[9px] text-white/30 tracking-wider uppercase mt-0.5">{posTag}</p>
            </div>
          </div>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-[20px] border-b border-black/5 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="relative">
            <Search
              size={15}
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 transition-colors',
                searchFocused ? 'text-apple-blue' : 'text-black/30'
              )}
            />
            <input
              type="text"
              placeholder="Search customers, bookings, PNRs..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'pl-9 pr-4 py-2 bg-black/5 border-2 text-[12px] font-medium rounded-xl outline-none transition-all w-72',
                searchFocused ? 'border-apple-blue/40 bg-white shadow-sm' : 'border-transparent'
              )}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Live status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase">Live</span>
            </div>

            {/* Notification bell */}
            <button className="relative p-2 text-black/30 hover:text-black transition-colors rounded-xl hover:bg-black/5">
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-apple-blue text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <button className="p-2 text-black/30 hover:text-black transition-colors rounded-xl hover:bg-black/5">
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Notification Toasts */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 bg-white border-b border-black/5 space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border text-[12px] font-medium',
                  notif.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  notif.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' :
                  'bg-apple-blue/5 border-apple-blue/20 text-black'
                )}
              >
                {getNotifIcon(notif.type)}
                <div className="flex-1">
                  <span className="font-bold">{notif.title}</span>
                  {notif.message && <span className="ml-2 font-normal opacity-70">{notif.message}</span>}
                </div>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}