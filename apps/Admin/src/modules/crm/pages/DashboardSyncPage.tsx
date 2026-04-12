import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bell,
} from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/optics';
import { Badge } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components/optics';
import { cn } from '@tripalfa/shared-utils/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/theme/chart-colors';

interface KYCMetric {
  timestamp: string;
  verified: number;
  pending: number;
  rejected: number;
}

interface RecentActivity {
  id: string;
  type: 'KYC_VERIFIED' | 'KYC_REJECTED' | 'KYC_SUBMITTED' | 'CONTACT_ADDED' | 'BOOKING_CREATED';
  title: string;
  description: string;
  timestamp: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR';
}

interface DashboardMetrics {
  kycMetrics: {
    totalSubmissions: number;
    verifiedCount: number;
    rejectedCount: number;
    pendingCount: number;
    verificationRate: number;
  };
  systemMetrics: {
    apiLatency: number;
    syncStatus: 'SYNCED' | 'SYNCING' | 'ERROR';
    lastSyncTime: string;
    uptime: number;
  };
}

export function DashboardSyncPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['dashboard-sync'],
    queryFn: async () => {
      const response = await api.get('/crm/dashboard-sync');
      return response.data as DashboardMetrics;
    },
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds
  });

  const { data: kycHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['kyc-history'],
    queryFn: async () => {
      const response = await api.get('/crm/kyc-history');
      return response.data as KYCMetric[];
    },
    refetchInterval: autoRefresh ? 60000 : false, // 60 seconds
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const response = await api.get('/crm/recent-activities');
      return response.data as RecentActivity[];
    },
    refetchInterval: autoRefresh ? 45000 : false, // 45 seconds
  });

  const getSyncStatusForBadge = (
    status: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      SYNCED: 'success' as const,
      SYNCING: 'info' as const,
      ERROR: 'warning' as const,
    };
    return statusMap[status as keyof typeof statusMap] || 'default';
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      KYC_VERIFIED: <CheckCircle className="w-4 h-4" />,
      KYC_REJECTED: <AlertCircle className="w-4 h-4" />,
      KYC_SUBMITTED: <Bell className="w-4 h-4" />,
      CONTACT_ADDED: <Activity className="w-4 h-4" />,
      BOOKING_CREATED: <TrendingUp className="w-4 h-4" />,
    };
    return icons[type];
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      KYC_VERIFIED: 'bg-green-100 text-green-800',
      KYC_REJECTED: 'bg-red-100 text-red-800',
      KYC_SUBMITTED: 'bg-blue-100 text-blue-800',
      CONTACT_ADDED: 'bg-purple-100 text-purple-800',
      BOOKING_CREATED: 'bg-orange-100 text-orange-800',
    };
    return colors[type];
  };

  const getActivityTypeForBadge = (
    type: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const typeMap = {
      KYC_VERIFIED: 'success' as const,
      KYC_REJECTED: 'warning' as const,
      KYC_SUBMITTED: 'primary' as const,
      CONTACT_ADDED: 'info' as const,
      BOOKING_CREATED: 'default' as const,
    };
    return typeMap[type as keyof typeof typeMap] || 'default';
  };

  const getSeverityForBadge = (
    severity: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const severityMap = {
      INFO: 'info' as const,
      WARNING: 'warning' as const,
      ERROR: 'warning' as const,
    };
    return severityMap[severity as keyof typeof severityMap] || 'default';
  };

  return (
    <div className="space-y-5">
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Real-Time Dashboard</h1>
          <p className="text-caption mt-1">Live metrics and system synchronization status</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="auto-refresh-toggle"
              name="autoRefresh"
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
          <button
            onClick={() => refetchDashboard()}
            className="p-2 rounded-lg border hover:bg-gray-50"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {dashboard && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-green-900">Total KYC</p>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {dashboard.kycMetrics.totalSubmissions}
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-900">Verified</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {dashboard.kycMetrics.verifiedCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-sm text-yellow-900">Pending</p>
                <p className="text-2xl font-bold text-yellow-900 mt-2">
                  {dashboard.kycMetrics.pendingCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-red-900">Rejected</p>
                <p className="text-2xl font-bold text-red-900 mt-2">
                  {dashboard.kycMetrics.rejectedCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <p className="text-sm text-purple-900">Verification Rate</p>
                <p className="text-2xl font-bold text-purple-900 mt-2">
                  {(dashboard.kycMetrics.verificationRate * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>System Health</CardTitle>
                <StatusBadge
                  status={getSyncStatusForBadge(dashboard.systemMetrics.syncStatus)}
                  label={dashboard.systemMetrics.syncStatus}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">API Latency</p>
                  <p className="text-2xl font-bold mt-2">{dashboard.systemMetrics.apiLatency}ms</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold mt-2">
                    {(dashboard.systemMetrics.uptime * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Sync</p>
                  <p className="text-sm font-medium mt-2">
                    {new Date(dashboard.systemMetrics.lastSyncTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {kycHistory && (
            <Card>
              <CardHeader>
                <CardTitle>KYC Submissions Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={kycHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => [value, 'Count']}
                      labelFormatter={(label: any) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="verified"
                      stroke={CHART_COLORS.green}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke={CHART_COLORS.amber}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="rejected"
                      stroke={CHART_COLORS.red}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {activities && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 10).map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-b-0"
                    >
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.severity && (
                        <StatusBadge
                          status={getSeverityForBadge(activity.severity)}
                          label={activity.severity}
                          size="sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
