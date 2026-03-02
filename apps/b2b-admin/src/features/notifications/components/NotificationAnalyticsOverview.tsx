import React, { useMemo } from "react";
import * as Icons from "lucide-react";

import { Button } from "@tripalfa/ui-components/ui/button";

const { TrendingUp, Mail, Eye, MousePointer } = Icons as any;

type ChannelMetrics = {
  sent: number;
  openRate: number;
  clickRate: number;
};

type NotificationAnalytics = {
  templateId: string;
  templateName: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalFailed: number;
  totalBounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  averageDeliveryTime: number;
  averageTimeToOpen: number;
  channelMetrics: Record<string, ChannelMetrics>;
};

// ============================================================================
// NOTIFICATION ANALYTICS OVERVIEW
// ============================================================================

export interface NotificationAnalyticsProps {
  analytics?: NotificationAnalytics[];
  period?: "week" | "month" | "quarter";
  selectedTemplate?: string;
  onPeriodChange?: (period: "week" | "month" | "quarter") => void;
}

interface AnalyticsHeaderProps {
  period: "week" | "month" | "quarter";
  onPeriodChange?: (period: "week" | "month" | "quarter") => void;
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  period,
  onPeriodChange,
}) => (
  <div className="flex items-center justify-between gap-2">
    <div>
      <h2 className="text-2xl font-bold text-foreground">
        Notification Analytics
      </h2>
      <p className="text-muted-foreground mt-1">
        Performance metrics and engagement tracking
      </p>
    </div>
    <div className="flex gap-2">
      {(["week", "month", "quarter"] as const).map((p) => (
        <Button
          key={p}
          onClick={() => onPeriodChange?.(p)}
          className={`
            px-3 py-1 text-sm rounded-lg font-medium uppercase transition-all
            ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }
          `}
        >
          {p}
        </Button>
      ))}
    </div>
  </div>
);

interface SelectedTemplateDetailsProps {
  selectedData: NotificationAnalytics;
}

const SelectedTemplateDetails: React.FC<SelectedTemplateDetailsProps> = ({
  selectedData,
}) => (
  <div className="bg-card border border-border rounded-lg p-6 space-y-4">
    <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
      {selectedData.templateName} - Detailed Metrics
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Delivery Performance</h4>
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

      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Engagement Metrics</h4>
        <div className="space-y-2">
          <MetricRow label="Opened" value={selectedData.totalOpened} />
          <MetricRow label="Clicked" value={selectedData.totalClicked} />
          <div className="pt-2 border-t">
            <MetricRow
              label="Open Rate"
              value={`${Math.round(selectedData.openRate)}%`}
            />
            <MetricRow
              label="Click Rate"
              value={`${Math.round(selectedData.clickRate)}%`}
            />
          </div>
        </div>
      </div>
    </div>

    <div className="mt-6 pt-6 border-t">
      <h4 className="font-medium text-foreground mb-4">Channel Performance</h4>
      <div className="space-y-3">
        {Object.entries(selectedData.channelMetrics).map(
          ([channel, metrics]) => (
            <ChannelMetricRow
              key={channel}
              channel={channel}
              metrics={metrics}
            />
          ),
        )}
      </div>
    </div>
  </div>
);

interface TimingMetricsProps {
  averageDeliveryTime: number;
  averageTimeToOpen: number;
}

const TimingMetrics: React.FC<TimingMetricsProps> = ({
  averageDeliveryTime,
  averageTimeToOpen,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-1">
        Average Delivery Time
      </p>
      <p className="text-2xl font-bold text-foreground">
        {Math.round(averageDeliveryTime)}s
      </p>
    </div>
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-1">Average Time to Open</p>
      <p className="text-2xl font-bold text-foreground">
        {Math.round(averageTimeToOpen / 60)}m
      </p>
    </div>
  </div>
);

export const NotificationAnalyticsOverview: React.FC<
  NotificationAnalyticsProps
> = ({
  analytics = [],
  period = "month",
  selectedTemplate,
  onPeriodChange,
}) => {
  const selectedData = selectedTemplate
    ? analytics.find((a) => a.templateId === selectedTemplate)
    : analytics[0];

  const aggregatedMetrics = useMemo(() => {
    const totalSent = analytics.reduce((sum, a) => sum + a.totalSent, 0);
    const totalOpened = analytics.reduce((sum, a) => sum + a.totalOpened, 0);
    const totalClicked = analytics.reduce((sum, a) => sum + a.totalClicked, 0);
    const totalFailed = analytics.reduce((sum, a) => sum + a.totalFailed, 0);

    return {
      totalSent,
      totalOpened,
      openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      totalClicked,
      clickRate:
        totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
      failureRate:
        totalSent > 0 ? Math.round((totalFailed / totalSent) * 100) : 0,
    };
  }, [analytics]);

  return (
    <div className="space-y-6">
      <AnalyticsHeader period={period} onPeriodChange={onPeriodChange} />

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

      {selectedData ? (
        <SelectedTemplateDetails selectedData={selectedData} />
      ) : null}

      {selectedData ? (
        <TimingMetrics
          averageDeliveryTime={selectedData.averageDeliveryTime}
          averageTimeToOpen={selectedData.averageTimeToOpen}
        />
      ) : null}
    </div>
  );
};

// ============================================================================
// METRIC CARD SUB-COMPONENT
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend = "stable",
  trendValue = 0,
}) => {
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-foreground mb-2">{value}</p>
      {trendValue !== 0 && (
        <p className={`text-sm font-medium ${trendColor}`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}{" "}
          {Math.abs(trendValue)}% vs last period
        </p>
      )}
    </div>
  );
};

// ============================================================================
// METRIC ROW SUB-COMPONENT
// ============================================================================

interface MetricRowProps {
  label: string;
  value: string | number;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value }) => (
  <div className="flex justify-between items-center gap-4">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">
      {typeof value === "number" ? value.toLocaleString() : value}
    </span>
  </div>
);

// ============================================================================
// CHANNEL METRIC ROW SUB-COMPONENT
// ============================================================================

interface ChannelMetricRowProps {
  channel: string;
  metrics: ChannelMetrics;
}

const ChannelMetricRow: React.FC<ChannelMetricRowProps> = ({
  channel,
  metrics,
}) => (
  <div className="p-3 bg-muted/40 rounded-lg">
    <div className="flex items-center justify-between mb-2 gap-2">
      <p className="font-medium text-foreground capitalize">{channel}</p>
      <span className="text-sm text-muted-foreground">{metrics.sent} sent</span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div>
        <p className="text-muted-foreground">Sent</p>
        <p className="font-medium text-foreground">{metrics.sent}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Open Rate</p>
        <p className="font-medium text-foreground">
          {Math.round(metrics.openRate)}%
        </p>
      </div>
      <div>
        <p className="text-muted-foreground">Click Rate</p>
        <p className="font-medium text-foreground">
          {Math.round(metrics.clickRate)}%
        </p>
      </div>
    </div>
  </div>
);

export default NotificationAnalyticsOverview;
