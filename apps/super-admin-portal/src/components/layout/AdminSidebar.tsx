import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Plane, Hotel, DollarSign, Landmark,
  FileText, Settings, ShieldCheck, Users, Globe, LogOut, Cpu
} from 'lucide-react';
import { cn } from '@tripalfa/shared-features';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  section: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { path: '/agency', label: 'Agency Management', icon: Building2, section: 'management' },
  { path: '/content-supplier', label: 'Content Supplier', icon: Globe, section: 'management' },
  { path: '/tax', label: 'Tax Management', icon: Landmark, section: 'management' },
  { path: '/communications', label: 'Communications', icon: FileText, section: 'management' },
  { path: '/masters', label: 'Masters & Templates', icon: Users, section: 'management' },
  { path: '/air-engine', label: 'Air Engine', icon: Plane, section: 'config' },
  { path: '/non-air', label: 'Non-Air Config', icon: Hotel, section: 'config' },
  { path: '/revenue', label: 'Revenue', icon: DollarSign, section: 'config' },
  { path: '/configs', label: 'System Config', icon: Settings, section: 'config' },
  { path: '/payment', label: 'Payment Config', icon: DollarSign, section: 'config' },
  { path: '/security', label: 'Security & Logs', icon: ShieldCheck, section: 'config' },
];

export default function AdminSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path);
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group border',
          active
            ? 'bg-apple-blue/15 border-apple-blue/25 text-white'
            : 'text-white/40 hover:text-white/80 hover:bg-white/5 border-transparent'
        )}
      >
        <item.icon
          size={15}
          className={cn(
            'transition-colors shrink-0',
            active ? 'text-apple-blue' : 'text-white/30 group-hover:text-white/60'
          )}
        />
        <span className="text-[12px] font-semibold tracking-tight">{item.label}</span>
        {active && <span className="ml-auto w-1 h-4 bg-apple-blue rounded-full" />}
      </NavLink>
    );
  };

  const sectionLabel = (label: string) => (
    <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] px-4 mb-2 mt-4">
      {label}
    </p>
  );

  return (
    <aside className="w-64 bg-[#1c1c1e] flex flex-col h-screen sticky top-0 shadow-2xl">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-apple-blue/20 border border-apple-blue/30 rounded-xl flex items-center justify-center">
            <Cpu size={16} className="text-apple-blue" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white tracking-widest uppercase">Neural OTA</p>
            <p className="text-[9px] text-white/30 font-medium tracking-wider uppercase mt-0.5">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Live status */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">All Systems Nominal</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {/* Dashboard */}
        {renderNavItem(navItems[0])}

        {/* Management */}
        {sectionLabel('Management')}
        {navItems.filter(i => i.section === 'management').map(renderNavItem)}

        {/* Configuration */}
        {sectionLabel('Configuration')}
        {navItems.filter(i => i.section === 'config').map(renderNavItem)}
      </nav>

      {/* Admin identity footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-3 py-3 bg-white/5 rounded-xl border border-white/5">
          <div className="w-8 h-8 bg-apple-blue/20 border border-apple-blue/30 rounded-xl flex items-center justify-center">
            <span className="text-[10px] font-bold text-apple-blue">SA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-white">Super Admin</p>
            <p className="text-[9px] text-white/30 tracking-wider uppercase mt-0.5">Full Access</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}