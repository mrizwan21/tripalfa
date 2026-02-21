/**
 * Modern Analytics Dashboard
 * Real-time metrics and KPI cards with beautiful visualizations
 */

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

const {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle,
  BarChart3,
  ChartLine,
  ChartPie: PieChartIcon,
  ArrowUpRight,
  ArrowLeft: ArrowLeft,
} = Icons as any;

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  color = 'blue',
  description,
}) => {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800',
    green: 'from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800',
    red: 'from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-200 dark:border-orange-800',
  };

  const iconColors = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 transition-all duration-300 hover:shadow-lg dark:shadow-none hover:translate-y-[-2px] group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconColors[color]} rounded-lg flex items-center justify-center transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            trend === 'up' ? 'text-green-600 dark:text-green-400' :
            trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-slate-600 dark:text-slate-400'
          }`}>
            {trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
            {trend === 'down' && <ArrowLeft className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        {value}
      </p>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
};

interface AnalyticsDashboardProps {
  metrics?: any;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  metrics = {
    totalRequests: '143,234',
    successRate: '98.5%',
    avgResponseTime: '124ms',
    errorCount: '2,145',
    activeRules: '847',
    deployments: '23',
  },
}) => {
  const [animateValues, setAnimateValues] = useState(false);

  useEffect(() => {
    setAnimateValues(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time metrics and performance insights
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            Last 24h
          </button>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm font-medium">
            Export
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests}
          change={12.5}
          trend="up"
          icon={<Activity className="w-6 h-6" />}
          color="blue"
          description="Last 24 hours"
        />
        <MetricCard
          title="Success Rate"
          value={metrics.successRate}
          change={2.3}
          trend="up"
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          description="Healthy API status"
        />
        <MetricCard
          title="Avg Response Time"
          value={metrics.avgResponseTime}
          change={-5.2}
          trend="down"
          icon={<Clock className="w-6 h-6" />}
          color="purple"
          description="Performance improved"
        />
        <MetricCard
          title="Error Count"
          value={metrics.errorCount}
          change={-8.1}
          trend="down"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          description="Error handling optimized"
        />
        <MetricCard
          title="Active Rules"
          value={metrics.activeRules}
          change={18.9}
          trend="up"
          icon={<Zap className="w-6 h-6" />}
          color="orange"
          description="Rules engine active"
        />
        <MetricCard
          title="Deployments"
          value={metrics.deployments}
          change={0}
          trend="neutral"
          icon={<TrendingUp className="w-6 h-6" />}
          color="blue"
          description="This month"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Trends */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Request Trends
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                API requests over time
              </p>
            </div>
            <ChartLine className="w-6 h-6 text-blue-500 opacity-20" />
          </div>

          {/* Simplified Chart Placeholder */}
          <div className="h-40 flex items-end gap-2 bg-gradient-to-t from-blue-500/10 to-transparent rounded-lg p-4">
            {[65, 78, 90, 81, 88, 95, 87, 92, 88, 94].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t opacity-70 hover:opacity-100 transition-all hover:from-blue-600 hover:to-blue-500"
                style={{ height: `${height}%`, animation: `slideUp 0.5s ease-out ${i * 0.05}s both` }}
              />
            ))}
          </div>
        </div>

        {/* Error Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Error Distribution
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Error types breakdown
              </p>
            </div>
            <PieChartIcon className="w-6 h-6 text-purple-500 opacity-20" />
          </div>

          <div className="space-y-4">
            {[
              { label: '4xx Errors', value: 45, color: 'bg-gradient-to-r from-orange-400 to-orange-600' },
              { label: '5xx Errors', value: 30, color: 'bg-gradient-to-r from-red-400 to-red-600' },
              { label: 'Timeouts', value: 15, color: 'bg-gradient-to-r from-yellow-400 to-yellow-600' },
              { label: 'Rate Limited', value: 10, color: 'bg-gradient-to-r from-blue-400 to-blue-600' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 overflow-hidden hover:shadow-lg transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
          Top Performing Endpoints
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Endpoint
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Requests
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Avg Response
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { endpoint: 'GET /api/rules/markup', requests: '12,450', time: '45ms', status: 'Optimal' },
                { endpoint: 'POST /api/deals/matching', requests: '9,823', time: '78ms', status: 'Good' },
                { endpoint: 'GET /api/metrics/summary', requests: '8,234', time: '32ms', status: 'Excellent' },
                { endpoint: 'POST /api/pricing/calculate', requests: '7,123', time: '156ms', status: 'Good' },
              ].map((item, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-4 text-sm font-medium text-slate-900 dark:text-white">
                    {item.endpoint}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                    {item.requests}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                    {item.time}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900">
                      ✓ {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            height: var(--height);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;
