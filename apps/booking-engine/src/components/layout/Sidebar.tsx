import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  Calendar,
  CreditCard,
  Settings,
  FileText,
  BarChart,
  Bell,
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  Shield
} from "lucide-react";
import { cn } from "@tripalfa/ui-components";

const SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart },
  { href: "/bookings", label: "My Bookings", icon: Calendar },
  { href: "/profile", label: "Personal Info", icon: User },
  { href: "/wallet", label: "Wallet & Funds", icon: CreditCard },
  { href: "/loyalty", label: "Loyalty Hub", icon: Star },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/account-settings", label: "Security", icon: Settings },
];

// Admin links - shown only for admin users
const ADMIN_LINKS = [
  { href: "/admin/bookings", label: "Admin Bookings", icon: Shield },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Profile Card Mini */}
        <div className="bg-slate-900 rounded-3xl p-5 shadow-xl shadow-slate-900/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldCheck size={48} className="text-white" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Verify Status</p>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            Level 2 Account <Zap size={12} className="text-amber-400 fill-amber-400" />
          </h4>
          <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-emerald-500 rounded-full" />
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-3">
          <nav className="space-y-1">
            {SIDEBAR_LINKS.map((ln) => {
              const Icon = ln.icon;
              const active = pathname.startsWith(ln.href);

              return (
                <Link
                  key={ln.href}
                  to={ln.href}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-2xl transition-all duration-200",
                    active
                      ? "bg-slate-50 text-slate-900 shadow-inner"
                      : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-xl transition-colors",
                      active ? "bg-white shadow-sm text-primary" : "bg-slate-100 group-hover:bg-white text-slate-400"
                    )}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold tracking-tight">{ln.label}</span>
                  </div>
                  {active && <ChevronRight size={14} className="text-slate-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Section */}
        <div className="bg-purple-50 rounded-[2rem] border border-purple-100/50 p-3">
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2 px-3">Admin Tools</p>
          <nav className="space-y-1">
            {ADMIN_LINKS.map((ln) => {
              const Icon = ln.icon;
              const active = pathname.startsWith(ln.href);

              return (
                <Link
                  key={ln.href}
                  to={ln.href}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-2xl transition-all duration-200",
                    active
                      ? "bg-white text-purple-900 shadow-sm"
                      : "text-purple-600 hover:bg-white/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-xl transition-colors",
                      active ? "bg-purple-100 text-purple-600" : "bg-purple-100/50 group-hover:bg-purple-100 text-purple-500"
                    )}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold tracking-tight">{ln.label}</span>
                  </div>
                  {active && <ChevronRight size={14} className="text-purple-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Support Section */}
        <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100/50">
          <h5 className="text-xs font-bold text-emerald-900 mb-1">Need help?</h5>
          <p className="text-[10px] font-medium text-emerald-700/70 mb-4 leading-relaxed">
            Our support team is available 24/7 for your booking queries.
          </p>
          <Link to="/help" className="inline-flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all">
            Contact Support
          </Link>
        </div>
      </div>
    </aside>
  );
}
