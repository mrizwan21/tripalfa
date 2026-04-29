import { useState } from 'react';
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Calendar, Plus, Eye, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProfileLayout } from './ProfilePage';
import { NodalPageHeader } from '../index';

interface CreditApplication {
  id: string;
  clientName: string;
  requestedLimit: number;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  appliedBy: string;
}

interface PaymentRecord {
  id: string;
  clientName: string;
  amount: number;
  currency: string;
  date: string;
  method: string;
  referenceNo: string;
  status: string;
}

const MOCK_APPLICATIONS: CreditApplication[] = [
  {
    id: 'CFA-001',
    clientName: 'Corporate ABZ',
    requestedLimit: 50000,
    purpose: 'Working capital for group bookings',
    status: 'Pending',
    appliedDate: '2026-04-10',
    appliedBy: 'Ahmed Al-Zahrawi'
  }
];

export default function CreditFacilityPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'payments'>('overview');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  return (
    <ProfileLayout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8">
        <NodalPageHeader
          title="Credit"
          highlightedTitle="Facilities"
          nodeName="FISCAL_NODE"
          subtitle="Manage client credit limits, risk assessment, and algorithmic settlements."
          actions={
            <button
              onClick={() => setShowApplicationForm(true)}
              className="px-8 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl flex items-center gap-3"
            >
              <Plus size={16} /> New Application
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 my-12">
          <StatCard title="Total Credit Limit" value="BHD 250,000" icon={CreditCard} trend="+12%" positive />
          <StatCard title="Utilized Credit" value="BHD 142,500" icon={TrendingUp} trend="57%" positive={false} />
          <StatCard title="Pending Review" value="2" icon={Calendar} trend="HIGH" positive={false} />
          <StatCard title="Settlement Rate" value="98.5%" icon={CheckCircle2} trend="+2.1%" positive />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="flex border-b border-black/5 bg-black/[0.01]">
            {(['overview', 'applications', 'payments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-6 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                  activeTab === tab ? "border-black text-black bg-black/[0.02]" : "border-transparent text-black/20 hover:text-black/40"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10 min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-12">
                <div className="bg-black text-white rounded-3xl p-10 flex items-start gap-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 text-white">
                    <AlertTriangle size={120} />
                  </div>
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-apple-blue shrink-0">
                    <AlertTriangle size={32} />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-lg font-bold">Utilization Warning</h3>
                    <p className="text-xs text-white/40 leading-relaxed font-medium max-w-xl">Corporate ABZ has utilized 85% of their credit limit. Real-time booking locks will trigger at 95%.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold text-black/20 uppercase tracking-widest border-l-4 border-apple-blue pl-4">Priority Settlement Tiers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: 'Corporate ABZ', pct: 85, color: 'bg-red-500' },
                      { name: 'Gulf Holdings', pct: 60, color: 'bg-apple-blue' },
                    ].map(client => (
                      <div key={client.name} className="p-8 bg-black/[0.02] border border-black/5 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-bold text-black">{client.name}</span>
                          <span className="text-xs font-bold text-black/40">{client.pct}%</span>
                        </div>
                        <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", client.color)} style={{ width: `${client.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}

function StatCard({ title, value, icon: Icon, trend, positive }: { title: string; value: string; icon: any; trend: string; positive: boolean }) {
  return (
    <div className="bg-white p-10 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex items-start justify-between mb-8">
        <div className="w-14 h-14 bg-black text-apple-blue rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Icon size={24} />
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
          positive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        )}>
          {trend}
        </span>
      </div>
      <h4 className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-3xl font-bold text-black">{value}</p>
    </div>
  );
}
