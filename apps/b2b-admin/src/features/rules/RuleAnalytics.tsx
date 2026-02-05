import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Users, Clock, AlertTriangle } from 'lucide-react';
import type { RuleCategory } from '../../types/ruleManagement';

interface RuleAnalyticsProps {
  category: RuleCategory;
}

export const RuleAnalytics: React.FC<RuleAnalyticsProps> = ({ category }) => {
  // Mock analytics data
  const mockAnalytics = {
    totalRules: 15,
    activeRules: 12,
    inactiveRules: 2,
    pendingRules: 1,
    totalRevenue: 45000,
    totalCommissions: 8500,
    totalMarkup: 12500,
    avgProcessingTime: 2.3,
    topPerformingRules: [
      { name: 'Weekend Markup', revenue: 12500, usage: 156 },
      { name: 'Corporate Commission', revenue: 8500, usage: 89 },
      { name: 'Early Bird Discount', revenue: 6200, usage: 234 }
    ],
    ruleUsageData: [
      { name: 'Jan', weekend: 120, corporate: 85, early: 200 },
      { name: 'Feb', weekend: 135, corporate: 92, early: 215 },
      { name: 'Mar', weekend: 145, corporate: 98, early: 240 },
      { name: 'Apr', weekend: 156, corporate: 89, early: 234 },
      { name: 'May', weekend: 162, corporate: 105, early: 267 },
      { name: 'Jun', weekend: 178, corporate: 112, early: 289 }
    ],
    rulePerformanceData: [
      { name: 'Weekend Markup', value: 35, color: '#3b82f6' },
      { name: 'Corporate Commission', value: 22, color: '#10b981' },
      { name: 'Early Bird Discount', value: 18, color: '#f59e0b' },
      { name: 'Last Minute Markup', value: 15, color: '#ef4444' },
      { name: 'Group Booking Discount', value: 10, color: '#8b5cf6' }
    ]
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rules</p>
                <p className="text-2xl font-bold">{mockAnalytics.totalRules}</p>
              </div>
              <Badge variant="outline" className="text-lg">
                {category.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold text-green-600">{mockAnalytics.activeRules}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Impact</p>
                <p className="text-2xl font-bold">${mockAnalytics.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                <p className="text-2xl font-bold">{mockAnalytics.avgProcessingTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rule Usage Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Rule Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockAnalytics.ruleUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weekend" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="corporate" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="early" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rule Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Rule Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockAnalytics.rulePerformanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockAnalytics.rulePerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockAnalytics.topPerformingRules.map((rule, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <Badge variant="outline">${rule.revenue.toLocaleString()}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Revenue Impact:</span>
                      <span className="font-medium">${rule.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usage Count:</span>
                      <span className="font-medium">{rule.usage} bookings</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Inactive Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{mockAnalytics.inactiveRules}</p>
            <p className="text-sm text-muted-foreground mt-2">Rules not currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Clock className="h-5 w-5" />
              Pending Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{mockAnalytics.pendingRules}</p>
            <p className="text-sm text-muted-foreground mt-2">Rules awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{mockAnalytics.activeRules}</p>
            <p className="text-sm text-muted-foreground mt-2">Rules currently in effect</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};