import React, { useState, useMemo } from 'react'
import * as Icons from 'lucide-react';

const {
  TrendingUp,
  Mail,
  MessageSquare,
  Bell,
  Link,
  Eye,
  MousePointer
} = Icons as any;
import type { NotificationAnalytics, ChannelMetrics } from '@/features/notifications/types-notification'

// ============================================================================
// NOTIFICATION ANALYTICS OVERVIEW
// ============================================================================

export interface NotificationAnalyticsProps {
  analytics?: NotificationAnalytics[]
  period?: 'week' | 'month' | 'quarter'
  selectedTemplate?: string
  onPeriodChange?: (period: 'week' | 'month' | 'quarter') => void
}

export const NotificationAnalyticsOverview: React.FC<NotificationAnalyticsProps> = ({
  analytics = [],
  period = 'month',
  selectedTemplate,
  onPeriodChange,
}) => {
  const selectedData = selectedTemplate
    ? analytics.find((a) => a.templateId === selectedTemplate)
    : analytics[0]

  const aggregatedMetrics = useMemo(() => {
    const totalSent = analytics.reduce((sum, a) => sum + a.totalSent, 0)
    const totalOpened = analytics.reduce((sum, a) => sum + a.totalOpened, 0)
    const totalClicked = analytics.reduce((sum, a) => sum + a.totalClicked, 0)
    const totalFailed = analytics.reduce((sum, a) => sum + a.totalFailed, 0)

    return {
      totalSent,
      totalOpened,
      openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      totalClicked,
      clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
      failureRate: totalSent > 0 ? Math.round((totalFailed / totalSent) * 100) : 0,
    }
  }, [analytics])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Analytics</h2>
          <p className="text-gray-600 mt-1">Performance metrics and engagement tracking</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange?.(p)}
              className={`
                px-3 py-1 text-sm rounded-lg font-medium uppercase transition-all
                ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Sent"
          value={aggregatedMetrics.totalSent.toLocaleString()}
          icon={<Mail size={24} />}
          trend="up"
          trendValue={5}
        />
        <MetricCard
          label="Open Rate"
          value={`${aggregatedMetrics.openRate}%`}
          icon={<Eye size={24} />}
          trend="up"
          trendValue={2}
        />
        <MetricCard
          label="Click Rate"
          value={`${aggregatedMetrics.clickRate}%`}
          icon={<MousePointer size={24} />}
          trend="stable"
          trendValue={0}
        />
        <MetricCard
          label="Failure Rate"
          value={`${aggregatedMetrics.failureRate}%`}
          icon={<TrendingUp size={24} />}
          trend="down"
          trendValue={-1}
        />
      </div>

      {/* Selected Template Analytics */}
      {selectedData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">{selectedData.templateName} - Detailed Metrics</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Delivery Performance</h4>
              <div className="space-y-2">
                <MetricRow label="Sent" value={selectedData.totalSent} />
                <MetricRow label="Failed" value={selectedData.totalFailed} />
                <MetricRow label="Bounced" value={selectedData.totalBounced} />
                <div className="pt-2 border-t">
                  <MetricRow
                    label="Delivery Rate"
                    value={`${Math.round(selectedData.deliveryRate)}%`}
                  />
                </div>
              </div>
            </div>

            {/* Engagement Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Engagement Metrics</h4>
              <div className="space-y-2">
                <MetricRow label="Opened" value={selectedData.totalOpened} />
                <MetricRow label="Clicked" value={selectedData.totalClicked} />
                <div className="pt-2 border-t">
                  <MetricRow label="Open Rate" value={`${Math.round(selectedData.openRate)}%`} />
                  <MetricRow label="Click Rate" value={`${Math.round(selectedData.clickRate)}%`} />
                </div>
              </div>
            </div>
          </div>

          {/* Channel Breakdown */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-gray-900 mb-4">Channel Performance</h4>
            <div className="space-y-3">
              {Object.entries(selectedData.channelMetrics).map(([channel, metrics]) => (
                <ChannelMetricRow key={channel} channel={channel} metrics={metrics} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timing Metrics */}
      {selectedData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Delivery Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(selectedData.averageDeliveryTime)}s
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Time to Open</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(selectedData.averageTimeToOpen / 60)}m
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// METRIC CARD SUB-COMPONENT
// ============================================================================

interface MetricCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend = 'stable',
  trendValue = 0,
}) => {
  const trendColor =
    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      {trendValue !== 0 && (
        <p className={`text-sm font-medium ${trendColor}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(trendValue)}% vs last period
        </p>
      )}
    </div>
  )
}

// ============================================================================
// METRIC ROW SUB-COMPONENT
// ============================================================================

interface MetricRowProps {
  label: string
  value: string | number
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="font-medium text-gray-900">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </span>
  </div>
)

// ============================================================================
// CHANNEL METRIC ROW SUB-COMPONENT
// ============================================================================

interface ChannelMetricRowProps {
  channel: string
  metrics: ChannelMetrics
}

const ChannelMetricRow: React.FC<ChannelMetricRowProps> = ({ channel, metrics }) => (
  <div className="p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <p className="font-medium text-gray-900 capitalize">{channel}</p>
      <span className="text-sm text-gray-600">{metrics.sent} sent</span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div>
        <p className="text-gray-600">Sent</p>
        <p className="font-medium text-gray-900">{metrics.sent}</p>
      </div>
      <div>
        <p className="text-gray-600">Open Rate</p>
        <p className="font-medium text-gray-900">{Math.round(metrics.openRate)}%</p>
      </div>
      <div>
        <p className="text-gray-600">Click Rate</p>
        <p className="font-medium text-gray-900">{Math.round(metrics.clickRate)}%</p>
      </div>
    </div>
  </div>
)

export default NotificationAnalyticsOverview
