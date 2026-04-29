import React, { useState, useEffect } from "react";
import { Card, Badge, Button } from "@tripalfa/ui-components";
import { Activity, Server, Zap, Cpu, Database, Globe, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { gatewayApi, type GatewayHealthResponse, type ServiceHealth } from "../lib/api";

const SystemHealthPage = () => {
  const [healthData, setHealthData] = useState<GatewayHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await gatewayApi.getHealth();
      setHealthData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Failed to load health status:", err);
      setError("Failed to connect to API Gateway Health Monitor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (state: string) => {
    switch (state) {
      case "up": return <CheckCircle2 className="h-5 w-5 text-apple-blue" />;
      case "down": return <AlertCircle className="h-5 w-5 text-near-black" />;
      default: return <Clock className="h-5 w-5 text-near-black" />;
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case "up": return <Badge variant="success">Operational</Badge>;
      case "down": return <Badge variant="destructive">Service Down</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-near-black">System Infrastructure Health</h2>
          <p className="text-near-black mt-0.5">Real-time status of all microservices and downstream GDS suppliers</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-near-black">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={loadHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-near-black/5 border border-near-black/20 rounded-xl p-4 flex items-center gap-3 text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-light-gray rounded-lg">
              <Zap className="h-6 w-6 text-apple-blue" />
            </div>
            <Badge variant="outline">Global Gateway</Badge>
          </div>
          <p className="text-2xl font-bold text-near-black">Active</p>
          <p className="text-sm text-near-black mt-1">Request Routing & Security Layer</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-apple-blue/5 rounded-lg">
              <Database className="h-6 w-6 text-apple-blue" />
            </div>
            <Badge variant="success">Healthy</Badge>
          </div>
          <p className="text-2xl font-bold text-near-black">
            {healthData ? Object.values(healthData.services).filter(s => s.state === "up").length : 0} /
            {healthData ? Object.keys(healthData.services).length : 0}
          </p>
          <p className="text-sm text-near-black mt-1">Internal Microservices Online</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-apple-blue rounded-lg">
              <Globe className="h-6 w-6 text-apple-blue" />
            </div>
            <Badge variant="outline">Supplier Connectivity</Badge>
          </div>
          <p className="text-2xl font-bold text-near-black">Stable</p>
          <p className="text-sm text-near-black mt-1">GDS & Supplier API Status</p>
        </Card>
      </div>

      {/* Detailed Service List */}
      <Card className="overflow-hidden">
        <div className="bg-near-black px-6 py-4 border-b border-near-black flex items-center justify-between">
          <h3 className="font-bold text-near-black">Microservice Registry</h3>
          <div className="flex items-center gap-4 text-xs font-semibold text-near-black">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-apple-blue" /> Operational</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-apple-error" /> Outage</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-near-black" /> Unknown</span>
          </div>
        </div>
        <div className="divide-y divide-black/5">
          {!healthData ? (
            <div className="p-12 text-center text-near-black">
              {loading ? "Discovering services..." : "No health data available."}
            </div>
          ) : (
            Object.entries(healthData.services).map(([id, service]) => (
              <div key={id} className="px-6 py-4 flex items-center justify-between hover:bg-light-gray/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${service.state === 'up' ? 'bg-apple-blue/5' : service.state === 'down' ? 'bg-near-black/5' : 'bg-near-black'}`}>
                    {service.state === 'up' ? <Server className="h-5 w-5 text-apple-blue" /> : <Cpu className="h-5 w-5 text-near-black" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-near-black">{service.name}</h4>
                    <p className="text-xs text-near-black font-mono">Port: {service.port} • ID: {id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-near-black">Last Checked</p>
                    <p className="text-xs text-near-black">{new Date(service.lastCheck).toLocaleTimeString()}</p>
                  </div>
                  <div className="w-32 flex justify-end">
                    {getStatusBadge(service.state)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Infrastructure Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-apple-blue" /> Active Alerts
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-near-black/5 border border-near-black/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-near-black mt-0.5" />
              <div>
                <p className="text-sm font-bold text-apple-blue">Sabre GDS Latency Spike</p>
                <p className="text-xs text-near-black">Inbound flight searches are experiencing {'>'}2s latency.</p>
                <p className="text-[10px] text-near-black mt-1 uppercase font-bold">Detected 12m ago</p>
              </div>
            </div>
            <div className="p-3 bg-near-black border border-near-black rounded-lg flex items-center justify-center py-8">
              <p className="text-xs text-near-black">No other active infrastructure alerts.</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Maintenance Schedule</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-near-black flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-near-black uppercase">May</span>
                <span className="text-sm font-bold text-near-black">12</span>
              </div>
              <div>
                <p className="text-sm font-bold text-near-black">Database Engine Update</p>
                <p className="text-xs text-near-black">Expected 5min downtime for booking service.</p>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs" size="sm">
              View Full Calendar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealthPage;
