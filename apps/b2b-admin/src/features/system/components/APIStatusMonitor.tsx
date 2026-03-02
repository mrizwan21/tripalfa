/**
 * API Status Monitor
 * Real-time monitoring of API health and performance
 */

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Button } from "@tripalfa/ui-components";
import { Label } from "@tripalfa/ui-components";

const {
  Activity,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Clock,
  Server,
  GitBranch,
  RefreshCw,
  ExternalLink,
  Copy,
  BarChart3,
} = Icons as any;

interface Endpoint {
  path: string;
  method: string;
  status: "healthy" | "warning" | "error";
  responseTime: number;
  uptime: number;
  requests24h: number;
  errorRate: number;
  lastChecked: string;
}

interface APIStatusMonitorProps {
  endpoints?: Endpoint[];
}

export const APIStatusMonitor: React.FC<APIStatusMonitorProps> = ({
  endpoints = [
    {
      path: "/api/rules/markup",
      method: "GET",
      status: "healthy",
      responseTime: 45,
      uptime: 99.99,
      requests24h: 12450,
      errorRate: 0.01,
      lastChecked: "2 seconds ago",
    },
    {
      path: "/api/pricing/engine",
      method: "POST",
      status: "healthy",
      responseTime: 78,
      uptime: 99.98,
      requests24h: 8234,
      errorRate: 0.02,
      lastChecked: "5 seconds ago",
    },
    {
      path: "/api/deals/matching",
      method: "POST",
      status: "warning",
      responseTime: 156,
      uptime: 99.85,
      requests24h: 7823,
      errorRate: 0.15,
      lastChecked: "1 second ago",
    },
    {
      path: "/api/analytics",
      method: "GET",
      status: "healthy",
      responseTime: 32,
      uptime: 100.0,
      requests24h: 15234,
      errorRate: 0.0,
      lastChecked: "3 seconds ago",
    },
    {
      path: "/api/commissions",
      method: "POST",
      status: "error",
      responseTime: 2500,
      uptime: 98.5,
      requests24h: 3421,
      errorRate: 1.5,
      lastChecked: "Just now",
    },
    {
      path: "/api/plb",
      method: "GET",
      status: "healthy",
      responseTime: 64,
      uptime: 99.97,
      requests24h: 9123,
      errorRate: 0.03,
      lastChecked: "4 seconds ago",
    },
  ],
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
    null,
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/10 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400";
      case "warning":
        return "bg-yellow-500/10 border-yellow-200 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400";
      case "error":
        return "bg-red-500/10 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  const healthyCount = endpoints.filter((e) => e.status === "healthy").length;
  const warningCount = endpoints.filter((e) => e.status === "warning").length;
  const errorCount = endpoints.filter((e) => e.status === "error").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            API Status Monitor
          </h1>
          <p className="text-muted-foreground">
            Real-time health and performance metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="default"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-200 dark:border-green-800 rounded-xl p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Healthy
            </span>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-700 dark:text-green-400">
            {healthyCount}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Endpoints operating normally
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Warning
            </span>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
            {warningCount}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Degraded performance
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-200 dark:border-red-800 rounded-xl p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Error
            </span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-700 dark:text-red-400">
            {errorCount}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Endpoints down</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200 dark:border-blue-800 rounded-xl p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Total
            </span>
            <Server className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
            {endpoints.length}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Monitored endpoints
          </p>
        </div>
      </div>

      {/* Auto Refresh Toggle */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <Label className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4 rounded border-input text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-muted-foreground">
            Auto-refresh enabled (every 30s)
          </span>
        </Label>
      </div>

      {/* Endpoints List */}
      <div className="space-y-3">
        {endpoints.map((endpoint) => (
          <Button
            variant="outline"
            size="default"
            key={`${endpoint.method}-${endpoint.path}`}
            onClick={() => setSelectedEndpoint(endpoint)}
            className={`w-full group text-left bg-card border border-border rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-border/80 ${
              selectedEndpoint === endpoint ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Status */}
              <div className="flex-shrink-0 pt-1 gap-4">
                {getStatusIcon(endpoint.status)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm font-semibold text-foreground">
                    {endpoint.method}
                  </code>
                  <code className="text-sm text-muted-foreground truncate">
                    {endpoint.path}
                  </code>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(endpoint.status)}`}
                  >
                    {endpoint.status}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Response
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {endpoint.responseTime}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Uptime
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {endpoint.uptime.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      24h Req
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {endpoint.requests24h.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Error Rate
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {endpoint.errorRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Last Check
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {endpoint.lastChecked}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="default"
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </Button>
        ))}
      </div>

      {/* Detailed View */}
      {selectedEndpoint && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-3">
            <BarChart3 className="w-5 h-5" />
            Detailed Metrics: {selectedEndpoint.method} {selectedEndpoint.path}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Response Time Chart */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">
                Response Time Trend
              </h4>
              <div className="h-32 flex items-end gap-1 bg-gradient-to-t from-blue-500/10 to-transparent rounded-lg p-4">
                {Array.from({ length: 12 }).map((_, i) => {
                  const height = 30 + Math.random() * 60;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t opacity-70 hover:opacity-100 transition-all gap-4"
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Error Rate Chart */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">
                Error Rate Trend
              </h4>
              <div className="h-32 flex items-end gap-1 bg-gradient-to-t from-red-500/10 to-transparent rounded-lg p-4">
                {Array.from({ length: 12 }).map((_, i) => {
                  const height = 5 + Math.random() * 15;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded-t opacity-70 hover:opacity-100 transition-all gap-4"
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Min Response
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {Math.max(1, selectedEndpoint.responseTime - 20)}ms
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Avg Response
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {selectedEndpoint.responseTime}ms
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Max Response
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {selectedEndpoint.responseTime + 50}ms
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIStatusMonitor;
