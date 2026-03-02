import React, { useState, useEffect, useCallback } from "react";
import { useGatewayForm } from "@/features/suppliers/context/GatewayFormContext";

import { Button } from "@tripalfa/ui-components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

export interface HealthCheckResult {
  endpointId: string;
  endpointName: string;
  status: "healthy" | "degraded" | "offline";
  lastChecked: Date;
  responseTime?: number;
  errorMessage?: string;
  successRate: number;
  uptime: number;
}

export interface GatewayHealthStatusProps {
  /**
   * Gateway ID (required for health monitoring)
   */
  gatewayId: string;
  /**
   * Auto-refresh interval in milliseconds (default: 30000)
   */
  refreshInterval?: number;
  /**
   * Custom CSS class
   */
  className?: string;
  /**
   * Show detailed endpoint health
   */
  showDetails?: boolean;
  /**
   * Callback when health check completes
   */
  onHealthCheck?: (results: HealthCheckResult[]) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GatewayHealthStatus: React.FC<GatewayHealthStatusProps> = ({
  gatewayId,
  refreshInterval = 30000,
  className = "",
  showDetails = true,
  onHealthCheck,
}) => {
  const form = useGatewayForm();
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Calculate overall gateway health
  const overallHealth = useCallback(() => {
    if (healthStatus.length === 0) return "unknown";
    const healthy = healthStatus.filter((h) => h.status === "healthy").length;
    const total = healthStatus.length;

    if (healthy === total) return "healthy";
    if (healthy > total * 0.5) return "degraded";
    return "offline";
  }, [healthStatus]);

  // Average response time
  const avgResponseTime = useCallback(() => {
    if (healthStatus.length === 0) return 0;
    const times = healthStatus.filter((h) => h.responseTime !== undefined);
    if (times.length === 0) return 0;
    return Math.round(
      times.reduce((sum, h) => sum + (h.responseTime || 0), 0) / times.length,
    );
  }, [healthStatus]);

  // Average uptime
  const avgUptime = useCallback(() => {
    if (healthStatus.length === 0) return 0;
    return Math.round(
      healthStatus.reduce((sum, h) => sum + h.uptime, 0) / healthStatus.length,
    );
  }, [healthStatus]);

  // Average success rate
  const avgSuccessRate = useCallback(() => {
    if (healthStatus.length === 0) return 0;
    return Math.round(
      healthStatus.reduce((sum, h) => sum + h.successRate, 0) /
        healthStatus.length,
    );
  }, [healthStatus]);

  // Perform health check
  const performHealthCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      // Mock health check results based on endpoints
      // In production, this would call: useGatewayTest().testGatewayHealth(gatewayId)
      const endpoints = form.formData.endpoints || [];
      const mockResults: HealthCheckResult[] = endpoints.map(
        (endpoint: { id?: string; name: string }) => ({
          endpointId: endpoint.id || "unknown",
          endpointName: endpoint.name,
          status: Math.random() > 0.1 ? "healthy" : "degraded",
          lastChecked: new Date(),
          responseTime: Math.random() * 500,
          successRate: 95 + Math.random() * 5,
          uptime: 99 + Math.random(),
        }),
      );

      setHealthStatus(mockResults);
      setLastCheckTime(new Date());
      onHealthCheck?.(mockResults);
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsChecking(false);
    }
  }, [form.formData.endpoints, gatewayId, onHealthCheck]);

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    // Initial check
    performHealthCheck();

    // Set up interval
    const interval = setInterval(performHealthCheck, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, performHealthCheck]);

  const overall = overallHealth();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-foreground">
          Gateway Health Status
        </h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-muted-foreground">Auto-refresh</span>
          </label>
          <Button
            onClick={performHealthCheck}
            disabled={isChecking}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            {isChecking ? "⟳ Checking..." : "↻ Check Now"}
          </Button>
        </div>
      </div>

      {/* Overall Status Card */}
      <OverallStatusCard
        status={overall}
        avgResponseTime={avgResponseTime()}
        avgUptime={avgUptime()}
        successRate={avgSuccessRate()}
        endpointCount={healthStatus.length}
        lastCheck={lastCheckTime}
      />

      {/* Status Indicators Summary */}
      <StatusIndicatorsSummary healthStatus={healthStatus} />

      {/* Detailed Health Metrics */}
      {showDetails && healthStatus.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">
            Endpoint Health Details
          </h4>
          <div className="space-y-2">
            {healthStatus.map((result) => (
              <EndpointHealthCard key={result.endpointId} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {healthStatus.length === 0 && !isChecking && (
        <div className="p-6 text-center border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-3">No endpoints configured</p>
          <p className="text-sm text-muted-foreground">
            Configure endpoints to view health status
          </p>
        </div>
      )}

      {/* Testing Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p>
          💡 Health checks run every {refreshInterval / 1000}s. Data is
          simulated for demo purposes.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// OVERALL STATUS CARD
// ============================================================================

interface OverallStatusCardProps {
  status: "healthy" | "degraded" | "offline" | "unknown";
  avgResponseTime: number;
  avgUptime: number;
  successRate: number;
  endpointCount: number;
  lastCheck: Date | null;
}

const OverallStatusCard: React.FC<OverallStatusCardProps> = ({
  status,
  avgResponseTime,
  avgUptime,
  successRate,
  endpointCount,
  lastCheck,
}) => {
  const statusConfig = {
    healthy: {
      icon: "✅",
      label: "Healthy",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
    },
    degraded: {
      icon: "⚠️",
      label: "Degraded",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
    },
    offline: {
      icon: "❌",
      label: "Offline",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
    },
    unknown: {
      icon: "❓",
      label: "Unknown",
      bgColor: "bg-muted",
      borderColor: "border-border",
      textColor: "text-foreground",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`p-6 rounded-lg border ${config.bgColor} ${config.borderColor}`}
    >
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className={`text-2xl font-bold ${config.textColor}`}>
              {config.label}
            </p>
            {lastCheck && (
              <p className="text-sm text-muted-foreground">
                Last checked: {lastCheck.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Response Time" value={`${avgResponseTime}ms`} />
        <MetricBox label="Average Uptime" value={`${avgUptime.toFixed(2)}%`} />
        <MetricBox label="Success Rate" value={`${successRate.toFixed(1)}%`} />
        <MetricBox label="Endpoints" value={endpointCount.toString()} />
      </div>
    </div>
  );
};

// ============================================================================
// METRIC BOX
// ============================================================================

interface MetricBoxProps {
  label: string;
  value: string;
}

const MetricBox: React.FC<MetricBoxProps> = ({ label, value }) => (
  <div className="text-center">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-lg font-bold text-foreground mt-1">{value}</p>
  </div>
);

// ============================================================================
// STATUS INDICATORS SUMMARY
// ============================================================================

interface StatusIndicatorsSummaryProps {
  healthStatus: HealthCheckResult[];
}

const StatusIndicatorsSummary: React.FC<StatusIndicatorsSummaryProps> = ({
  healthStatus,
}) => {
  const healthy = healthStatus.filter((h) => h.status === "healthy").length;
  const degraded = healthStatus.filter((h) => h.status === "degraded").length;
  const offline = healthStatus.filter((h) => h.status === "offline").length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatusIndicator
        icon="✅"
        label="Healthy"
        value={healthy}
        color="bg-green-100 text-green-800 border-green-200"
      />
      <StatusIndicator
        icon="⚠️"
        label="Degraded"
        value={degraded}
        color="bg-yellow-100 text-yellow-800 border-yellow-200"
      />
      <StatusIndicator
        icon="❌"
        label="Offline"
        value={offline}
        color="bg-red-100 text-red-800 border-red-200"
      />
    </div>
  );
};

interface StatusIndicatorProps {
  icon: string;
  label: string;
  value: number;
  color: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  icon,
  label,
  value,
  color,
}) => (
  <div className={`p-3 rounded-lg border ${color}`}>
    <p className="text-sm font-medium">{label}</p>
    <p className="text-2xl font-bold">
      {icon} {value}
    </p>
  </div>
);

// ============================================================================
// ENDPOINT HEALTH CARD
// ============================================================================

interface EndpointHealthCardProps {
  result: HealthCheckResult;
}

const EndpointHealthCard: React.FC<EndpointHealthCardProps> = ({ result }) => {
  const statusIcon = {
    healthy: "✅",
    degraded: "⚠️",
    offline: "❌",
  }[result.status];

  const statusColor = {
    healthy: "border-green-200 bg-green-50",
    degraded: "border-yellow-200 bg-yellow-50",
    offline: "border-red-200 bg-red-50",
  }[result.status];

  return (
    <div className={`p-4 rounded-lg border ${statusColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-foreground">
            <span className="text-lg mr-2">{statusIcon}</span>
            {result.endpointName}
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {result.endpointId}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        {result.responseTime !== undefined && (
          <HealthMetric
            label="Response"
            value={`${Math.round(result.responseTime)}ms`}
          />
        )}
        <HealthMetric
          label="Success Rate"
          value={`${result.successRate.toFixed(1)}%`}
        />
        <HealthMetric label="Uptime" value={`${result.uptime.toFixed(2)}%`} />
        <HealthMetric
          label="Last Check"
          value={result.lastChecked.toLocaleTimeString()}
        />
      </div>

      {result.errorMessage && (
        <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-800">
          Error: {result.errorMessage}
        </div>
      )}
    </div>
  );
};

interface HealthMetricProps {
  label: string;
  value: string;
}

const HealthMetric: React.FC<HealthMetricProps> = ({ label, value }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-mono font-medium text-foreground text-sm">{value}</p>
  </div>
);
