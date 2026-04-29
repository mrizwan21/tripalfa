import * as React from 'react';
import { cn } from '../lib/utils';
import { 
  BarChart3, Users, TrendingUp, DollarSign, 
  Globe, Building, Activity, ArrowUpRight,
  ArrowDownRight, Calendar, Filter, Download
} from 'lucide-react';

export interface AnalyticsMetric {
  id: string;
  label: string;
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
}

export interface TenantAnalytics {
  tenantId: string;
  tenantName: string;
  type: 'MASTER_AGENCY' | 'SUB_AGENT' | 'INDIVIDUAL_AGENT';
  bookings: number;
  revenue: number;
  growth: number;
  activeUsers: number;
  conversionRate: number;
}

export interface CrossTenantAnalyticsProps {
  metrics?: AnalyticsMetric[];
  tenantData?: TenantAnalytics[];
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
  onExport?: (format: 'csv' | 'json') => void;
  className?: string;
}

const defaultMetrics: AnalyticsMetric[] = [
  {
    id: 'total-revenue',
    label: 'Total Revenue',
    value: 1254300,
    change: 12.5,
    changeType: 'increase',
    icon: <DollarSign className="h-5 w-5" />,
    format: 'currency'
  },
  {
    id: 'total-bookings',
    label: 'Total Bookings',
    value: 3245,
    change: 8.2,
    changeType: 'increase',
    icon: <BarChart3 className="h-5 w-5" />,
    format: 'number'
  },
  {
    id: 'active-tenants',
    label: 'Active Tenants',
    value: 42,
    change: 3,
    changeType: 'increase',
    icon: <Building className="h-5 w-5" />,
    format: 'number'
  },
  {
    id: 'conversion-rate',
    label: 'Avg Conversion',
    value: 4.2,
    change: -0.5,
    changeType: 'decrease',
    icon: <TrendingUp className="h-5 w-5" />,
    format: 'percentage'
  },
];

const defaultTenantData: TenantAnalytics[] = [
  {
    tenantId: '1',
    tenantName: 'Global Travel Agency',
    type: 'MASTER_AGENCY',
    bookings: 1245,
    revenue: 450000,
    growth: 15.2,
    activeUsers: 42,
    conversionRate: 5.1
  },
  {
    tenantId: '2',
    tenantName: 'Business Travel Corp',
    type: 'MASTER_AGENCY',
    bookings: 876,
    revenue: 320000,
    growth: 8.7,
    activeUsers: 28,
    conversionRate: 4.3
  },
  {
    tenantId: '3',
    tenantName: 'Luxury Vacations Ltd',
    type: 'SUB_AGENT',
    bookings: 543,
    revenue: 210000,
    growth: 22.1,
    activeUsers: 18,
    conversionRate: 6.2
  },
  {
    tenantId: '4',
    tenantName: 'Budget Travel Co',
    type: 'INDIVIDUAL_AGENT',
    bookings: 321,
    revenue: 98000,
    growth: -2.4,
    activeUsers: 12,
    conversionRate: 3.1
  },
];

export function CrossTenantAnalytics({
  metrics = defaultMetrics,
  tenantData = defaultTenantData,
  timeRange = '30d',
  onTimeRangeChange,
  onExport,
  className
}: CrossTenantAnalyticsProps) {
  const formatValue = (metric: AnalyticsMetric) => {
    if (metric.format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Number(metric.value));
    }
    if (metric.format === 'percentage') {
      return `${metric.value}%`;
    }
    return new Intl.NumberFormat('en-US').format(Number(metric.value));
  };

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-near-black">Cross-Tenant Analytics</h2>
          <p className="text-near-black">Performance metrics across all tenants</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-near-black rounded-lg p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange?.(option.value as any)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  timeRange === option.value
                    ? 'bg-white text-near-black shadow-sm'
                    : 'text-near-black hover:text-near-black'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => onExport?.('csv')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-near-black text-white rounded-lg hover:bg-near-black transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-white rounded-xl border border-near-black p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-near-black rounded-lg">
                {metric.icon}
              </div>
              <div className={cn(
                'inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
                metric.changeType === 'increase' && 'bg-apple-blue/5 text-apple-blue',
                metric.changeType === 'decrease' && 'bg-near-black/5 text-near-black',
                metric.changeType === 'neutral' && 'bg-near-black text-near-black'
              )}>
                {metric.changeType === 'increase' && <ArrowUpRight className="h-3 w-3" />}
                {metric.changeType === 'decrease' && <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(metric.change)}%
              </div>
            </div>
            <div>
              <p className="text-near-black text-sm mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-near-black">
                {formatValue(metric)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Performance Table */}
      <div className="bg-white rounded-xl border border-near-black overflow-hidden">
        <div className="p-6 border-b border-near-black">
          <h3 className="text-lg font-semibold text-near-black">Tenant Performance</h3>
          <p className="text-near-black text-sm">Detailed metrics by tenant</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-near-black border-b border-near-black">
                <th className="text-left py-3 px-6 text-sm font-medium text-near-black">Tenant</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-near-black">Type</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-near-black">Bookings</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-near-black">Revenue</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-near-black">Growth</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-near-black">Active Users</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-near-black">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {tenantData.map((tenant) => (
                <tr key={tenant.tenantId} className="border-b border-near-black hover:bg-near-black">
                  <td className="py-4 px-6">
                    <div className="font-medium text-near-black">{tenant.tenantName}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      tenant.type === 'MASTER_AGENCY' && 'bg-apple-blue/10 text-apple-blue',
                      tenant.type === 'SUB_AGENT' && 'bg-apple-blue/10 text-apple-blue',
                      tenant.type === 'INDIVIDUAL_AGENT' && 'bg-apple-blue/10 text-apple-blue'
                    )}>
                      {tenant.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-near-black">{tenant.bookings.toLocaleString()}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-near-black">
                      ${tenant.revenue.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={cn(
                      'inline-flex items-center gap-1 font-medium',
                      tenant.growth >= 0 ? 'text-apple-blue' : 'text-near-black'
                    )}>
                      {tenant.growth >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {Math.abs(tenant.growth)}%
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-near-black">{tenant.activeUsers}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-near-black">{tenant.conversionRate}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-near-black text-center">
          <button className="text-sm text-near-black hover:text-near-black font-medium">
            View all tenants →
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-near-black p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-near-black">Revenue Distribution</h3>
              <p className="text-near-black text-sm">By tenant type</p>
            </div>
            <Globe className="h-5 w-5 text-near-black" />
          </div>
          <div className="space-y-4">
            {['MASTER_AGENCY', 'SUB_AGENT', 'INDIVIDUAL_AGENT'].map((type) => {
              const tenantsOfType = tenantData.filter(t => t.type === type);
              const totalRevenue = tenantsOfType.reduce((sum, t) => sum + t.revenue, 0);
              const percentage = (totalRevenue / tenantData.reduce((sum, t) => sum + t.revenue, 0)) * 100;
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-near-black">
                      {type.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium text-near-black">
                      ${totalRevenue.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-near-black rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        'h-full rounded-full',
                        type === 'MASTER_AGENCY' && 'bg-apple-blue',
                        type === 'SUB_AGENT' && 'bg-apple-blue',
                        type === 'INDIVIDUAL_AGENT' && 'bg-apple-blue'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-near-black p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-near-black">Platform Health</h3>
              <p className="text-near-black text-sm">System status</p>
            </div>
            <Activity className="h-5 w-5 text-near-black" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-apple-blue/5 rounded-lg">
              <span className="text-sm font-medium text-apple-blue">All Systems Operational</span>
              <div className="h-2 w-2 bg-apple-blue rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-near-black">API Response Time</span>
                <span className="text-sm font-medium text-near-black">142ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-near-black">Uptime (30d)</span>
                <span className="text-sm font-medium text-near-black">99.97%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-near-black">Active Sessions</span>
                <span className="text-sm font-medium text-near-black">1,248</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}