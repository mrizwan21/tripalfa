import { useNavigate, useLocation } from 'react-router-dom';
import { Plane, Hotel, Headphones, Server, Mail, Layers, Globe, Inbox, Megaphone, ShieldCheck, Upload, CreditCard, Building2, Shield, Users, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';
import { cn, NotificationDropdown } from '../index';

import type { LucideIcon } from 'lucide-react';
const NAV_ITEMS: { label: string; path: string; icon: LucideIcon; badge?: string; allowedRoles?: UserRole[] }[] = [
 { label: 'Flights', path: '/flight', icon: Plane },
 { label: 'Hotels', path: '/hotel', icon: Hotel },
 { label: 'Queues', path: '/queues', icon: Inbox },
 { label: 'Inventory', path: '/inventory', icon: Layers, allowedRoles: ['Admin', 'Ticketing Lead'] },
 { label: 'Itinerary Builder', path: '/itinerary-builder', icon: Globe },
 { label: 'Authorization Workspace', path: '/authorization', icon: ShieldCheck, allowedRoles: ['Admin', 'Sales Executive', 'Accountant'] },
 { label: 'Communication Hub', path: '/communication', icon: Megaphone, allowedRoles: ['Admin', 'Sales Executive'] },
 { label: 'Newsletter', path: '/newsletter', icon: Mail },
 { label: 'Support', path: '/support', icon: Headphones },
 { label: 'System Admin', path: '/system-admin', icon: Server, badge: 'MASTER', allowedRoles: ['Admin'] },
 // Critical v12 Features
 { label: 'PNR Import', path: '/pnr-import', icon: Upload, allowedRoles: ['Admin', 'Ticketing Lead'] },
 { label: 'Credit Facility', path: '/credit-facility', icon: CreditCard, allowedRoles: ['Admin', 'Accountant'] },
 { label: 'Company Profile', path: '/company-profile', icon: Building2, allowedRoles: ['Admin'] },
 { label: 'Sub-Agent Rights', path: '/sub-agent-permissions', icon: Users, allowedRoles: ['Admin'] },
 { label: 'Roles & Permissions', path: '/roles-permissions', icon: Shield, allowedRoles: ['Admin'] },
 { label: 'Supplier Dashboard', path: '/supplier-dashboard', icon: BarChart3, allowedRoles: ['Admin', 'Accountant'] },
];

export default function TopNav() {
 const navigate = useNavigate();
 const location = useLocation();
 const { hasPermission } = useApp();

  return (
<nav role="navigation" aria-label="Primary" className="bg-white/80 backdrop-blur-[20px] backdrop-saturate-[1.8] border-b border-black/5 sticky top-12 z-40 transition-all">
      <div className="flex items-center justify-between max-w-[1440px] w-full mx-auto px-6">
        <div className="flex items-center gap-10 overflow-x-auto no-scrollbar group/nav">
          {NAV_ITEMS.filter(item => !item.allowedRoles || hasPermission(item.allowedRoles)).map((item) => {
            const isActive = location.pathname.startsWith(item.path) || (item.path === '/' && location.pathname === '/');
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold transition-all rounded-pill my-1.5 whitespace-nowrap',
                  'hover:bg-black/5 group-hover/nav:opacity-50 hover:!opacity-100',
                  isActive
                    ? 'text-apple-blue bg-apple-blue/5'
                    : 'text-black/50'
                )}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={14} className={isActive ? 'opacity-100' : 'opacity-70'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 bg-apple-blue/10 text-apple-blue text-nano font-bold rounded-pill px-2 py-0.5">{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>
<div className="flex items-center pl-4 flex-shrink-0">
<NotificationDropdown />
</div>
</div>
</nav>
 );
}
