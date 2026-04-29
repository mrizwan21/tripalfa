import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { apiManager, cn } from '../index';
import {
  Activity, BarChart3, AlertTriangle, DollarSign, Shield, Clock,
  CheckCircle2, AlertCircle, TrendingUp, TrendingDown, XCircle,
  AlertOctagon, FileText, Zap
} from 'lucide-react';

function getLatencyTrend(latency: number): 'good' | 'warning' | 'critical' {
  if (latency < 150) return 'good';
  if (latency < 300) return 'warning';
  return 'critical';
}

function getSuccessRateTrend(rate: number): 'good' | 'warning' | 'critical' {
  if (rate >= 95) return 'good';
  if (rate >= 90) return 'warning';
  return 'critical';
}

function getIssuesTrend(issues: number): 'good' | 'warning' | 'critical' {
  if (issues === 0) return 'good';
  if (issues <= 2) return 'warning';
  return 'critical';
}

function getScoreTrend(score: number): 'good' | 'warning' | 'critical' {
  if (score >= 95) return 'good';
  if (score >= 90) return 'warning';
  return 'critical';
}

function getUtilizationTrend(percent: string): 'good' | 'warning' | 'critical' {
  const value = Number.parseFloat(percent);
  if (value > 80) return 'warning';
  return 'good';
}

const TREND_BG_CLASSES: Record<'good' | 'warning' | 'critical', string> = {
  good: 'bg-apple-blue/10 text-apple-blue',
  warning: 'bg-amber-100 text-amber-600',
  critical: 'bg-red-100 text-red-600',
};

const TEXT_COLOR_CLASSES: Record<'good' | 'warning' | 'critical', string> = {
  good: 'text-apple-blue',
  warning: 'text-amber-600',
  critical: 'text-red-600',
};

const BG_COLOR_CLASSES: Record<'good' | 'warning' | 'critical', string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

const ALERT_DOT_COLORS: Record<string, string> = {
  TRIGGERED: 'bg-red-500',
  ACTIVE: 'bg-amber-500',
  DEFAULT: 'bg-emerald-500',
};

const ALERT_BADGE_CLASSES: Record<string, string> = {
  TRIGGERED: 'bg-red-50 text-red-600',
  ACTIVE: 'bg-amber-50 text-amber-600',
  DEFAULT: 'bg-apple-blue/10 text-apple-blue',
};

const ALERT_ICON_CLASSES: Record<string, string> = {
  TRIGGERED: 'bg-red-100 text-red-600',
  ACTIVE: 'bg-amber-100 text-amber-600',
  DEFAULT: 'bg-apple-blue/10 text-apple-blue',
};

const ALERT_ICON_MAP: Record<string, React.ElementType> = {
  TRIGGERED: AlertOctagon,
  ACTIVE: AlertTriangle,
};

const KpiCard = ({ title, value, icon: Icon, subtitle, trend }: any) => (
  <div className="bg-white rounded-2xl border border-navy/5 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all", trend ? TREND_BG_CLASSES[trend as keyof typeof TREND_BG_CLASSES] : 'bg-black text-white')}>
        <Icon size={20} />
      </div>
      {trend && (
        <span className={cn("px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest", TREND_BG_CLASSES[trend as keyof typeof TREND_BG_CLASSES])}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <h4 className="text-[10px] font-bold text-pure-black/30 uppercase tracking-widest mb-1">{title}</h4>
      <div className="text-2xl font-bold text-pure-black tabular-nums">{value}</div>
      {subtitle && <p className="text-[10px] font-medium text-pure-black/40 mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default function SupplierDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'alerts' | 'financial'>('overview');

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['supplier-dashboard'],
    queryFn: () => apiManager.getSupplierDashboard(),
    refetchInterval: 30000
  });

  const { data: matrixData, isLoading: matrixLoading } = useQuery({
    queryKey: ['supplier-matrix'],
    queryFn: () => apiManager.getSupplierPerformanceMatrix(),
    refetchInterval: 30000
  });

  const overview = dashboardData?.overview;
  const financial = dashboardData?.financial;
  const performance = dashboardData?.performance;
  const alerts = dashboardData?.alerts;
  const contracts = dashboardData?.contracts;

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6">
        {/* Header */}
        <div className="mb-8 border-b border-navy/10 pb-6 pt-8">
          <h1 className="text-4xl font-light tracking-tight mb-2 text-pure-black">
            Supplier <span className="font-semibold">Dashboard</span>
          </h1>
          <p className="text-sm text-pure-black/50">
            Comprehensive stakeholder overview of all supplier operations, performance, and financial status.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: 'overview' as const, label: 'Overview', icon: Activity },
            { key: 'matrix' as const, label: 'Performance Matrix', icon: BarChart3 },
            { key: 'alerts' as const, label: 'Alerts & Issues', icon: AlertTriangle },
            { key: 'financial' as const, label: 'Financial Overview', icon: DollarSign }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold tracking-tight transition-all",
                activeTab === tab.key
                  ? "bg-black text-white"
                  : "bg-light-gray text-pure-black/40 hover:bg-slate-200"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {(dashboardLoading || matrixLoading) && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-apple-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-pure-black/50">Loading supplier data...</p>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && overview && performance && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard
                title="Total Suppliers"
                value={overview.totalSuppliers}
                icon={Shield}
                subtitle={`${overview.activeSuppliers} active, ${overview.pendingSuppliers} pending`}
              />
              <KpiCard
                title="Avg Latency"
                value={`${performance.avgLatency}ms`}
                icon={Clock}
                subtitle="Response time"
                trend={getLatencyTrend(performance.avgLatency)}
              />
              <KpiCard
                title="Success Rate"
                value={`${performance.avgSuccessRate}%`}
                icon={CheckCircle2}
                subtitle="Last 7 days"
                trend={getSuccessRateTrend(performance.avgSuccessRate)}
              />
              <KpiCard
                title="Issues"
                value={performance.suppliersWithIssues}
                icon={AlertTriangle}
                subtitle="Suppliers degraded"
                trend={getIssuesTrend(performance.suppliersWithIssues)}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-navy/5">
                  <h3 className="text-sm font-bold text-pure-black tracking-tight flex items-center gap-2">
                    <TrendingUp size={16} className="text-apple-blue" />
                    Top Performers
                  </h3>
                </div>
                <div className="divide-y divide-navy/5">
                  {dashboardData?.topPerformers.map((supplier: any, idx: number) => (
                    <div key={supplier.code} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-apple-blue/10 text-apple-blue">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-pure-black">{supplier.name}</p>
                          <p className="text-[10px] text-pure-black/40">{supplier.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-apple-blue">{supplier.successRate}%</p>
                        <p className="text-[10px] text-pure-black/40">{supplier.latency}ms</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Needs Attention */}
              <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-navy/5">
                  <h3 className="text-sm font-bold text-pure-black tracking-tight flex items-center gap-2">
                    <TrendingDown size={16} className="text-red-600" />
                    Needs Attention
                  </h3>
                </div>
                <div className="divide-y divide-navy/5">
                  {dashboardData?.worstPerformers.map((supplier: any, idx: number) => (
                    <div key={supplier.code} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-red-50 text-red-600">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-pure-black">{supplier.name}</p>
                          <p className="text-[10px] text-pure-black/40">{supplier.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">{supplier.successRate}%</p>
                        <p className="text-[10px] text-pure-black/40">{supplier.latency}ms</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE MATRIX TAB */}
        {activeTab === 'matrix' && matrixData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <KpiCard title="Healthy" value={matrixData.summary.healthySuppliers} icon={CheckCircle2} trend="good" />
              <KpiCard title="Degraded" value={matrixData.summary.degradedSuppliers} icon={AlertTriangle} trend="warning" />
              <KpiCard title="Critical" value={matrixData.summary.criticalSuppliers} icon={XCircle} trend="critical" />
              <KpiCard title="Avg Score" value={`${matrixData.summary.overallSuccessRate}%`} icon={BarChart3} trend={getScoreTrend(matrixData.summary.overallSuccessRate)} />
            </div>

            <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-light-gray">
                    <tr>
                      <th className="text-left py-4 px-6 text-[9px] font-bold text-pure-black/40 tracking-tight">Supplier</th>
                      <th className="text-left py-4 px-6 text-[9px] font-bold text-pure-black/40 tracking-tight">Type</th>
                      <th className="text-center py-4 px-6 text-[9px] font-bold text-pure-black/40 tracking-tight">Score</th>
                      <th className="text-center py-4 px-6 text-[9px] font-bold text-pure-black/40 tracking-tight">Latency</th>
                      <th className="text-center py-4 px-6 text-[9px] font-bold text-pure-black/40 tracking-tight">Success Rate</th>
                      <th className="text-center py-4 px-6 text-[9px] font-bold text-pure-black/40 tracking-tight">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {matrixData.matrix.map((supplier: any) => (
                      <tr key={supplier.id} className="hover:bg-light-gray/50 transition-all">
                        <td className="py-4 px-6">
                          <p className="text-xs font-semibold text-pure-black">{supplier.name}</p>
                          <p className="text-[10px] text-pure-black/40">{supplier.code}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 bg-light-gray rounded-full text-[9px] font-bold text-pure-black/60">
                            {supplier.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-light-gray rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", BG_COLOR_CLASSES[supplier.status as keyof typeof BG_COLOR_CLASSES] || 'bg-slate-400')}
                                style={{ width: `${supplier.performanceScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold">{supplier.performanceScore}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center text-xs font-semibold text-pure-black">
                          {supplier.metrics.avgLatency}ms
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={cn("text-xs font-bold", TEXT_COLOR_CLASSES[getSuccessRateTrend(supplier.metrics.avgSuccessRate)])}>
                            {supplier.metrics.avgSuccessRate}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[9px] font-bold",
                            ALERT_BADGE_CLASSES[supplier.status] || 'bg-slate-100 text-slate-600'
                          )}>
                            {supplier.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && alerts && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiCard title="Active Alerts" value={alerts.totalActiveAlerts} icon={AlertTriangle} trend={alerts.totalActiveAlerts === 0 ? 'good' : 'warning'} />
              <KpiCard title="Critical" value={alerts.criticalAlerts} icon={AlertOctagon} trend={alerts.criticalAlerts === 0 ? 'good' : 'critical'} />
              <KpiCard title="Active Contracts" value={contracts?.totalActiveContracts ?? 0} icon={FileText} trend="good" />
            </div>

            <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-navy/5">
                <h3 className="text-sm font-bold text-pure-black tracking-tight">Active Alerts</h3>
              </div>
              <div className="divide-y divide-navy/5">
                {alerts.recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        ALERT_ICON_CLASSES[alert.status] || ALERT_ICON_CLASSES.DEFAULT
                      )}>
                        {React.createElement(ALERT_ICON_MAP[alert.status] || CheckCircle2, { size: 20 })}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-pure-black">{alert.supplierName}</p>
                        <p className="text-[10px] text-pure-black/40">{alert.type} • {new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={cn("px-3 py-1 rounded-full text-[9px] font-bold", ALERT_BADGE_CLASSES[alert.status] || ALERT_BADGE_CLASSES.DEFAULT)}>
                      {alert.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FINANCIAL TAB */}
        {activeTab === 'financial' && financial && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <KpiCard title="Total Credit" value={`$${(financial.totalCreditLimit / 1000).toFixed(0)}k`} icon={DollarSign} />
              <KpiCard title="Available" value={`$${(financial.totalAvailableCredit / 1000).toFixed(0)}k`} icon={TrendingUp} trend="good" />
              <KpiCard title="Utilized" value={`$${(financial.totalUtilizedCredit / 1000).toFixed(0)}k`} icon={TrendingDown} trend={getUtilizationTrend(financial.utilizationPercent)} />
              <KpiCard title="Utilization" value={`${financial.utilizationPercent}%`} icon={Zap} trend={getUtilizationTrend(financial.utilizationPercent)} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
