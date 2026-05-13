import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Globe, DollarSign, ShieldCheck, Activity, Server, Cpu, CheckCircle2 } from 'lucide-react';

type KpiLabel = 'Active Tenants' | 'Global Bookings' | 'Revenue (MTD)' | 'System Health';

const kpiIconMap: Record<KpiLabel, React.ComponentType> = {
  'Active Tenants': Building2,
  'Global Bookings': Globe,
  'Revenue (MTD)': DollarSign,
  'System Health': ShieldCheck,
};

const fetchKpiData = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { label: 'Active Tenants', value: '34', trend: '+2', positive: true },
    { label: 'Global Bookings', value: '1,842', trend: '+12%', positive: true },
    { label: 'Revenue (MTD)', value: '$284k', trend: '+8.4%', positive: true },
    { label: 'System Health', value: '99.9%', trend: 'Optimal', positive: true },
  ];
};

const fetchSystemNodes = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { name: 'Air Engine', status: 'Operational', latency: '42ms' },
    { name: 'Hotel Engine', status: 'Operational', latency: '67ms' },
    { name: 'Payment Gateway', status: 'Operational', latency: '31ms' },
    { name: 'GDS Connector', status: 'Degraded', latency: '340ms' },
  ];
};

const fetchRecentEvents = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { event: 'New tenant onboarded', detail: 'Saba Travel — BHD 5,000 credit limit', time: '5m ago' },
    { event: 'Tax rule updated', detail: 'VAT 15% applied to KSA region', time: '22m ago' },
    { event: 'Supplier contract renewed', detail: 'Amadeus GDS — 12-month term', time: '1h ago' },
    { event: 'Security audit passed', detail: 'PCI-DSS Level 1 compliance verified', time: '3h ago' },
  ];
};

export default function SuperAdminDashboard() {
  const { data: kpiCards, isLoading: kpiLoading, error: kpiError } = useQuery({
    queryKey: ['superAdminKpi'],
    queryFn: fetchKpiData,
  });

  const { data: systemNodes, isLoading: nodesLoading, error: nodesError } = useQuery({
    queryKey: ['superAdminSystemNodes'],
    queryFn: fetchSystemNodes,
  });

  const { data: recentEvents, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['superAdminRecentEvents'],
    queryFn: fetchRecentEvents,
  });

  const renderSkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 animate-pulse">
      <div className="h-10 w-10 bg-gray-200 rounded-xl mb-4" />
      <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
      <div className="h-8 w-24 bg-gray-200 rounded" />
    </div>
  );

  const renderKpiSkeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>{renderSkeletonCard()}</div>
      ))}
    </div>
  );

  const renderNodesSkeleton = () => (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden animate-pulse">
      <div className="px-8 py-6 border-b border-black/5">
        <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="divide-y divide-black/5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between px-8 py-4">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-5 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderEventsSkeleton = () => (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden animate-pulse">
      <div className="px-8 py-6 border-b border-black/5">
        <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="divide-y divide-black/5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-8 py-4">
            <div className="h-5 w-full bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderError = (message: string) => (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm font-medium">
      {message}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade">
      <div className="flex items-start justify-between border-b border-black/5 pb-8">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-black">
            Platform <span className="font-bold">Control Center</span>
          </h1>
          <p className="text-sm text-black/40 font-medium mt-2">
            Real-time monitoring of cross-tenant health, inventory flows, and global operations.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-xl shadow-lg">
          <Activity size={14} className="text-apple-blue animate-pulse" />
          <span className="text-[11px] font-bold text-apple-blue tracking-widest uppercase">Live</span>
        </div>
      </div>

      {kpiLoading ? (
        renderKpiSkeleton()
      ) : kpiError ? (
        renderError('Failed to load KPI data. Please try again later.')
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiCards?.map((card) => {
            const Icon = kpiIconMap[card.label as KpiLabel] as React.ComponentType;
            return (
              <div key={card.label} className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                  <Icon size={80} />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                    <Icon size={18} className="text-apple-blue" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700">
                    {card.trend}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-black tabular-nums">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nodesLoading ? (
          renderNodesSkeleton()
        ) : nodesError ? (
          renderError('Failed to load system node status.')
        ) : (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-8 py-6 border-b border-black/5">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <Server size={18} className="text-apple-blue" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-black">System Nodes</h2>
                <p className="text-[10px] text-black/30 uppercase tracking-widest font-medium">Live status</p>
              </div>
            </div>
            <div className="divide-y divide-black/5">
              {systemNodes?.map((node) => (
                <div key={node.name} className="flex items-center justify-between px-8 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${node.status === 'Operational' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                    <p className="text-sm font-semibold text-black">{node.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-black/30">{node.latency}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                      node.status === 'Operational'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {node.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {eventsLoading ? (
          renderEventsSkeleton()
        ) : eventsError ? (
          renderError('Failed to load recent events.')
        ) : (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-8 py-6 border-b border-black/5">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <Cpu size={18} className="text-apple-blue" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-black">Recent Events</h2>
                <p className="text-[10px] text-black/30 uppercase tracking-widest font-medium">Last 24 hours</p>
              </div>
            </div>
            <div className="divide-y divide-black/5">
              {recentEvents?.map((evt, i) => (
                <div key={i} className="flex items-start justify-between px-8 py-4 hover:bg-black/[0.01] transition-colors">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={14} className="text-apple-blue mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-black">{evt.event}</p>
                      <p className="text-[11px] text-black/40 mt-0.5">{evt.detail}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest shrink-0 ml-4">{evt.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
