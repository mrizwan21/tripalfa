import { useState, useMemo, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Download, Filter, Expand, Search, TrendingUp, TrendingDown, Layers, FileText, DollarSign, Activity, PieChart, Award, Users, User, Phone, Mail, Building2, MapPin, ShieldCheck } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { SkeletonCard, SkeletonTable } from '../index';
import { Layout } from '../components/Layout';

interface StatBoxProps {
  title: string;
  value: string | number;
  trend: string;
  isPositive: boolean;
  icon: LucideIcon;
  prefix?: string;
}

const StatBox = ({ title, value, trend, isPositive, icon: Icon, prefix }: StatBoxProps) => {
  const positive = trend.startsWith('+');
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-black/5 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
        <Icon size={120} />
      </div>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-black text-apple-blue rounded-xl flex items-center justify-center shadow-lg">
          <Icon size={20} />
        </div>
        <div className={cn("px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest", positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
          {trend}%
        </div>
      </div>
      <h4 className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-1">{title}</h4>
      <div className="flex items-baseline gap-2">
        {prefix && <span className="text-sm font-bold text-black/10 uppercase tracking-widest">{prefix}</span>}
        <span className="text-3xl font-bold text-black">{value}</span>
      </div>
    </div>
  );
};

type SalesTerm = 'MTD' | 'QTD' | 'YTD';
type TabKey = 'overview' | 'client-wise' | 'agent-wise' | 'client-directory';

const CLIENT_WISE_DATA = [
  { clientName: 'Global Travels Ltd', contact: 'James Wilson', email: 'james@globaltravels.com', phone: '+973 3333 1111', totalBookings: 156, totalRevenue: 124500, avgOrderValue: 798, status: 'Active' as const },
];

export default function SalesPage() {
  const { tenant } = useTenant();
  const { agent } = useApp();
  const [term, setTerm] = useState<SalesTerm>('MTD');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-black/5 pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-black leading-tight">Financial Analytics</h1>
            <p className="text-sm font-medium text-black/40">Revenue ledgers and performance metrics for {agent?.agencyName}.</p>
          </div>
          <div className="flex bg-black/5 p-1 rounded-xl">
            {(['MTD', 'QTD', 'YTD'] as const).map(t => (
              <button key={t} onClick={() => setTerm(t)} className={cn("px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", term === t ? "bg-white text-black shadow-sm" : "text-black/40")}>{t}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 my-12">
          <StatBox title="Gross Sales" value="1,245,000" trend="+5.4" isPositive icon={Activity} prefix={tenant.currency} />
          <StatBox title="Bookings" value="342" trend="+4.1" isPositive icon={Layers} />
          <StatBox title="AOV" value="3,640" trend="+1.2" isPositive icon={FileText} prefix={tenant.currency} />
          <StatBox title="Commission" value="62,250" trend="+5.4" isPositive icon={Award} prefix={tenant.currency} />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden shadow-sm">
          <div className="p-10 border-b border-black/5 bg-black/[0.01] flex justify-between items-center">
             <h3 className="text-xl font-bold text-black">Revenue Streams</h3>
             <button className="px-6 py-2.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Download CSV</button>
          </div>
          <div className="p-12">
            <div className="h-64 flex items-end gap-4">
              {[40, 60, 45, 90, 65, 80, 55, 75, 85, 100, 95, 110].map((h, i) => (
                <div key={i} className="flex-1 bg-black rounded-t-lg transition-all hover:bg-apple-blue" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
