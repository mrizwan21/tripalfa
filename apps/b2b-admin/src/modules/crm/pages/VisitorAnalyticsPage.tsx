import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/optics';
import { Button } from '@/components/optics';
import { Badge } from '@/components/optics';
import { Eye, Users, TrendingUp, Globe, Smartphone, Monitor } from '@tripalfa/ui-components/icons';
import { StatusBadge } from '@tripalfa/ui-components';
import { cn } from '@tripalfa/shared-utils/utils';
import { CHART_PALETTE, CHART_COLORS } from '@/theme/chart-colors';

interface VisitorAnalytics {
  totalVisitors: number;
  activeVisitors: number;
  totalPageViews: number;
  totalSearches: number;
  avgSessionDuration: number;
  conversionRate: number;
  topDevices: { name: string; value: number }[];
  topSources: { name: string; value: number }[];
  visitorTrend: { date: string; visitors: number; conversions: number }[];
  countryDistribution: { name: string; value: number }[];
}

export default function VisitorAnalytics() {
  const { data: analytics, isLoading } = useQuery<VisitorAnalytics>({
    queryKey: ['visitor-analytics'],
    queryFn: async () => {
      const response = await api.get('/crm/metrics?range=all');
      return response.data;
    },
  });

  const colors = CHART_PALETTE;

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading visitor analytics...</div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-page-title">Visitor Analytics</h1>
        <p className="text-caption mt-1">Track and analyze visitor behavior and engagement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="p-2 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
                <Eye className="text-blue-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Total Visitors</p>
              <p className="text-2xl font-bold mt-2">{analytics?.totalVisitors.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="p-2 bg-green-100 rounded-lg w-fit mx-auto mb-2">
                <Users className="text-green-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Active Now</p>
              <p className="text-2xl font-bold mt-2">{analytics?.activeVisitors}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="p-2 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Conversion Rate</p>
              <p className="text-2xl font-bold mt-2">{analytics?.conversionRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="p-2 bg-orange-100 rounded-lg w-fit mx-auto mb-2">
                <Globe className="text-orange-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Page Views</p>
              <p className="text-2xl font-bold mt-2">
                {analytics?.totalPageViews.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="p-2 bg-indigo-100 rounded-lg w-fit mx-auto mb-2">
                <TrendingUp className="text-indigo-600" size={20} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Avg Session</p>
              <p className="text-2xl font-bold mt-2">{analytics?.avgSessionDuration.toFixed(0)}s</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Visitor Trend (7 days)</CardTitle>
            <CardDescription>Daily visitors and conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.visitorTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="visitors"
                  stroke={CHART_COLORS.blue}
                  name="Visitors"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversions"
                  stroke={CHART_COLORS.green}
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Visitors by Device</CardTitle>
            <CardDescription>Device type breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.topDevices || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill={CHART_COLORS.violet}
                  dataKey="value"
                >
                  {analytics?.topDevices?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Top Traffic Sources</CardTitle>
            <CardDescription>Where visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.topSources || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={CHART_COLORS.violet} name="Visitors" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
            <CardDescription>Visitor distribution by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.countryDistribution?.slice(0, 8).map((country, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <p className="text-sm font-medium">{country.name}</p>
                  <div className="flex items-center gap-2 flex-1 ml-4">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                        style={{
                          width: `${(country.value / (analytics?.countryDistribution?.[0]?.value || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-right w-12">{country.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
