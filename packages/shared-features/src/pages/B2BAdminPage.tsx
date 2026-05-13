import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Building2, Users, FileText, CalendarCheck, BarChart3, Settings, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiManager, cn } from '../index';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/b2b' },
  { label: 'Tenants', path: '/b2b/tenants' },
  { label: 'Partners', path: '/b2b/partners' },
  { label: 'Agreements', path: '/b2b/agreements' },
  { label: 'Bookings', path: '/b2b/bookings' },
];

const QUICK_LINKS = [
  { label: 'Tenants', path: '/b2b/tenants', icon: Building2, countKey: 'tenantsCount', desc: 'Manage tenant organisations' },
  { label: 'Partners', path: '/b2b/partners', icon: Users, countKey: 'partnersCount', desc: 'Partner relationships' },
  { label: 'Agreements', path: '/b2b/agreements', icon: FileText, countKey: 'agreementsCount', desc: 'Contract management' },
  { label: 'Bookings', path: '/b2b/bookings', icon: CalendarCheck, countKey: 'bookingsCount', desc: 'B2B booking overview' },
];

export function B2BAdminSidebar() {
  const location = useLocation();
  return (
    <aside className="w-64 shrink-0">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-black/5 sticky top-28">
        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.label}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-colors",
                  isActive ? "bg-pure-black text-white" : "text-black/60 hover:text-pure-black hover:bg-light-gray"
                )}
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <ChevronRight size={14} className={cn("opacity-0 transition-opacity", isActive && "opacity-100" )} />
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default function B2BAdminPage() {
const [stats, setStats] = useState<{
  tenantsCount: number;
  partnersCount: number;
  agreementsCount: number;
  bookingsCount: number;
} | null>({
  tenantsCount: 0,
  partnersCount: 0,
  agreementsCount: 0,
  bookingsCount: 0,
});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiManager.getB2BDashboardStats();
      setStats(res.data || { tenantsCount: 0, partnersCount: 0, agreementsCount: 0, bookingsCount: 0 });
    } catch (err: any) {
      setError(err?.message || 'Failed to load B2B stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8 mt-12 pb-32 max-w-[1440px] mx-auto px-6 lg:px-8">
        <B2BAdminSidebar />

        <main className="flex-1 min-w-0">
          <div className="mb-10">
            <h1 className="text-4xl font-light tracking-tight leading-tight mb-2">
              B2B <span className="font-bold">Admin</span>
            </h1>
            <p className="text-sm text-black/40 font-medium">Manage tenants, partners, agreements and B2B bookings.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-apple-blue" />
              <span className="ml-2 text-sm text-black/40">Loading stats...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm flex-1">{error}</p>
              <button onClick={() => setError(null)} className="shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Quick Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    className="group bg-white rounded-2xl p-6 border border-black/5 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                        <link.icon size={18} className="text-apple-blue" />
                      </div>
                      <ChevronRight size={14} className="text-black/10 group-hover:text-apple-blue group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-1">{link.label}</p>
                    <p className="text-2xl font-bold text-black tabular-nums">{stats?.[link.countKey as keyof typeof stats] ?? '—'}</p>
                    <p className="text-[11px] text-black/30 mt-2">{link.desc}</p>
                  </Link>
                ))}
              </div>

              {/* Placeholder for activity feed / more complex summary */}
              <div className="mt-10 bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 size={18} className="text-apple-blue" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black">B2B Overview</h3>
                    <p className="text-[10px] text-black/30 font-medium uppercase tracking-widest">Select a module to get started</p>
                  </div>
                </div>
                <p className="text-sm text-black/40 leading-relaxed max-w-2xl">
                  Use the sidebar to navigate between Tenant Management, Partner Management, Agreement Tracking and B2B Bookings.
                  Each module supports full CRUD, pagination, filtering, and status management.
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </Layout>
  );
}