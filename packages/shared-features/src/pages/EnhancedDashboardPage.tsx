import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Activity, BarChart3, Clock, Users, Plane, Hotel, CheckCircle2, ShieldAlert, ArrowUpRight, ArrowDownRight, Zap, AlertTriangle, DollarSign, Percent, Award, Target, Wallet, Calendar, Layout as LayoutIcon, Eye, EyeOff, Settings, X } from 'lucide-react';
import { apiManager } from '../services/apiManager';
import { cn } from '../lib/utils';
import { Layout } from '../components/Layout';
import { SkeletonCard } from '../index';

const FinancialWidget = ({ title, value, trend, isPositive, icon: Icon }: any) => (
  <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm p-10 relative overflow-hidden group hover:shadow-xl transition-all">
    <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
      <Icon size={120} />
    </div>
    <div className="flex justify-between items-start mb-8">
      <div className="w-12 h-12 bg-black text-apple-blue rounded-xl flex items-center justify-center shadow-lg">
        <Icon size={20} />
      </div>
      <div className={cn("px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest", isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
        {trend}%
      </div>
    </div>
    <div>
      <h4 className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-1">{title}</h4>
      <span className="text-3xl font-bold text-black">{value}</span>
    </div>
  </div>
);

export default function EnhancedDashboardPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiManager.getDashboardStats(),
    refetchInterval: autoRefresh ? 60000 : false
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-black/5 pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-black leading-tight flex items-center gap-6">
               <div className="w-16 h-16 bg-black text-apple-blue rounded-2xl flex items-center justify-center shadow-lg">
                <Target size={32} />
              </div>
              Enterprise Dashboard
            </h1>
            <p className="text-sm font-medium text-black/40 flex items-center gap-2 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Operational Metrics
            </p>
          </div>
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={cn("px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", autoRefresh ? "bg-black text-apple-blue shadow-2xl" : "bg-black/5 text-black/40")}>
            {autoRefresh ? 'Live Sync Active' : 'Sync Paused'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 my-12">
          <FinancialWidget title="Gross Volume" value="$142,500" trend="+12.4" isPositive icon={TrendingUp} />
          <FinancialWidget title="Yield Recon" value="$24,100" trend="+8.2" isPositive icon={BarChart3} />
          <FinancialWidget title="Outstanding" value="$5,450" trend="-2.1" isPositive={false} icon={Clock} />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 shadow-sm overflow-hidden">
           <div className="flex items-center gap-4 mb-12">
             <div className="w-12 h-12 bg-black text-apple-blue rounded-xl flex items-center justify-center shadow-lg">
               <Activity size={20} />
             </div>
             <h3 className="text-xl font-bold text-black">Volumetric Analysis</h3>
           </div>
           <div className="h-64 flex items-end gap-6">
              {[30, 45, 35, 60, 80, 70, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-black rounded-t-xl transition-all hover:bg-apple-blue" style={{ height: `${h}%` }} />
              ))}
           </div>
        </div>
      </div>
    </Layout>
  );
}
