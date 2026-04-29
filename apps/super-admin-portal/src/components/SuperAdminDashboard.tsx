import React from 'react';
import { Building2, Globe, DollarSign, ShieldCheck, Activity, Server, Cpu, CheckCircle2 } from 'lucide-react';

const KPI_CARDS = [
  { label: 'Active Tenants', value: '34', icon: Building2, trend: '+2', positive: true },
  { label: 'Global Bookings', value: '1,842', icon: Globe, trend: '+12%', positive: true },
  { label: 'Revenue (MTD)', value: '$284k', icon: DollarSign, trend: '+8.4%', positive: true },
  { label: 'System Health', value: '99.9%', icon: ShieldCheck, trend: 'Optimal', positive: true },
];

const SYSTEM_NODES = [
  { name: 'Air Engine', status: 'Operational', latency: '42ms' },
  { name: 'Hotel Engine', status: 'Operational', latency: '67ms' },
  { name: 'Payment Gateway', status: 'Operational', latency: '31ms' },
  { name: 'GDS Connector', status: 'Degraded', latency: '340ms' },
];

const RECENT_EVENTS = [
  { event: 'New tenant onboarded', detail: 'Saba Travel — BHD 5,000 credit limit', time: '5m ago' },
  { event: 'Tax rule updated', detail: 'VAT 15% applied to KSA region', time: '22m ago' },
  { event: 'Supplier contract renewed', detail: 'Amadeus GDS — 12-month term', time: '1h ago' },
  { event: 'Security audit passed', detail: 'PCI-DSS Level 1 compliance verified', time: '3h ago' },
];

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-8 animate-fade">
      {/* Header */}
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

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {KPI_CARDS.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <card.icon size={80} />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <card.icon size={18} className="text-apple-blue" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700">
                {card.trend}
              </span>
            </div>
            <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-black tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      {/* System Health + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Nodes */}
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
            {SYSTEM_NODES.map((node) => (
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

        {/* Recent Events */}
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
            {RECENT_EVENTS.map((evt, i) => (
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
      </div>
    </div>
  );
}
