import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Eye,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import { cn } from '@tripalfa/shared-utils/utils';
import { StatusBadge } from '@tripalfa/ui-components';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CRMMetrics {
  contacts: {
    total: number;
    active: number;
    leads: number;
    newThisMonth: number;
    newLastMonth: number;
    bySource: { source: string; count: number }[];
  };
  campaigns: {
    total: number;
    active: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  activities: {
    total: number;
    pending: number;
    completed: number;
  };
  engagement: {
    hotLeadsCount: number;
    avgEngagementScore: number;
  };
  chartData: {
    date: string;
    contacts: number;
    campaigns: number;
    activities: number;
  }[];
  topCampaigns: {
    id: string;
    name: string;
    type: string;
    status: string;
    totalContacts: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }[];
}

export default function CRMDashboard() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: metrics, isLoading } = useQuery<CRMMetrics>({
    queryKey: ['crm-metrics', dateRange],
    queryFn: async () => {
      const response = await api.get(`/crm/metrics?range=${dateRange}`);
      return response.data;
    },
  });

  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    changeType,
    unit,
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    change?: number;
    changeType?: 'positive' | 'negative';
    unit?: string;
  }) => (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-label">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-page-title">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {unit && <p className="text-caption">{unit}</p>}
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-sm font-medium',
                changeType === 'positive' ? 'text-success' : 'text-error'
              )}
            >
              {changeType === 'positive' ? (
                <ArrowUpRight size={16} />
              ) : (
                <ArrowDownRight size={16} />
              )}
              {change}% vs last period
            </div>
          )}
        </div>
        <div className="p-3 bg-muted rounded-lg">{Icon}</div>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="empty-state">
      <BarChart3 className="empty-state-icon" />
      <h3 className="empty-state-title">Loading dashboard...</h3>
    </div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">CRM Dashboard</h1>
          <p className="text-caption mt-1">Manage contacts, campaigns, and customer data</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={dateRange === range ? 'filter-chip-active capitalize' : 'filter-chip capitalize'}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="data-grid">
        <StatCard
          icon={<Users className="text-blue-600" size={24} />}
          title="Total Contacts"
          value={metrics?.contacts.total || 0}
          change={
            metrics
              ? Math.round(((metrics.contacts.newThisMonth - metrics.contacts.newLastMonth) / Math.max(metrics.contacts.newLastMonth, 1)) * 100)
              : 0
          }
          changeType={metrics && metrics.contacts.newThisMonth > metrics.contacts.newLastMonth ? 'positive' : 'negative'}
        />
        <StatCard
          icon={<Mail className="text-purple-600" size={24} />}
          title="Email Open Rate"
          value={`${metrics?.campaigns.openRate.toFixed(1) || 0}%`}
          change={5}
          changeType="positive"
        />
        <StatCard
          icon={<TrendingUp className="text-orange-600" size={24} />}
          title="Active Campaigns"
          value={metrics?.campaigns.active || 0}
          change={2}
          changeType="positive"
        />
        <StatCard
          icon={<Target className="text-green-600" size={24} />}
          title="Hot Leads"
          value={metrics?.engagement.hotLeadsCount || 0}
          change={8}
          changeType="positive"
        />
      </div>

      {/* Charts */}
      <div className="data-grid grid-cols-1 lg:grid-cols-2">
        {/* Activity Trend */}
        <div className="card-compact">
          <div className="p-4 border-b">
            <h2 className="text-subsection-title">Activity Trend</h2>
            <p className="text-caption">Contacts, campaigns, and visitor activity over time</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="contacts" stroke="#3b82f6" name="New Contacts" />
                <Line type="monotone" dataKey="campaigns" stroke="#a855f7" name="Campaign Activity" />
                <Line type="monotone" dataKey="activities" stroke="#f97316" name="Activities" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="card-compact">
          <div className="p-4 border-b">
            <h2 className="text-subsection-title">Top Performing Campaigns</h2>
            <p className="text-caption">Best performing email campaigns this period</p>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {metrics?.topCampaigns?.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                  <div className="w-[45%] truncate">
                    <p className="text-label">{campaign.name}</p>
                    <div className="flex gap-3 mt-1 text-caption">
                      <span>{campaign.totalContacts} contacts</span>
                      <span className="text-success">{campaign.openRate.toFixed(1)}% open</span>
                      <span className="text-primary">{campaign.clickRate.toFixed(1)}% click</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">{campaign.conversionRate.toFixed(1)}% conversion</p>
                    <p className="text-caption">{campaign.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-compact">
        <div className="p-4 border-b">
          <h2 className="text-subsection-title">Quick Actions</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="w-full" variant="outline" size="lg">
              <Users size={18} className="mr-2" />
              View all Contacts
            </Button>
            <Button className="w-full" variant="outline" size="lg">
              <Mail size={18} className="mr-2" />
              Create Campaign
            </Button>
            <Button className="w-full" variant="outline" size="lg">
              <BarChart3 size={18} className="mr-2" />
              View Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
