import React, { useState, useEffect } from "react";
import { Card, Badge, Button, FormField } from "@tripalfa/ui-components";
import {
  Activity,
  Search,
  Download,
  Filter,
  User,
  Settings,
  Trash2,
  Edit,
  Plus,
  Shield,
  FileText,
  Clock,
  Terminal,
  Eye,
  RefreshCw,
} from "lucide-react";
import { gatewayApi, type AuditLogFile, type AuditLogEntry } from "../lib/api";

interface AdminAuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  userName: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus className="h-4 w-4 text-apple-blue" />,
  UPDATE: <Edit className="h-4 w-4 text-apple-blue" />,
  DELETE: <Trash2 className="h-4 w-4 text-near-black" />,
  LOGIN: <User className="h-4 w-4 text-apple-blue" />,
  LOGOUT: <User className="h-4 w-4 text-near-black" />,
  CONFIG: <Settings className="h-4 w-4 text-near-black" />,
};

const resourceLabels: Record<string, string> = {
  TENANT: "Tenant",
  USER: "Staff",
  ROLE: "Role",
  SUPPLIER: "Supplier",
  TAX_RULE: "Tax Rule",
  MARKUP_RULE: "Markup Rule",
  COMMISSION_RULE: "Commission Rule",
  PAYMENT_GATEWAY: "Payment Gateway",
  EMAIL_TEMPLATE: "Email Template",
  THEME: "Theme",
};

const AuditTrailPage = () => {
  const [activeView, setActiveView] = useState<"admin" | "gateway">("admin");
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gateway Log State
  const [logFiles, setLogFiles] = useState<AuditLogFile[]>([]);
  const [selectedLogDate, setSelectedLogDate] = useState<string | null>(null);
  const [gatewayLogs, setGatewayLogs] = useState<AuditLogEntry[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    action: "",
    resource: "",
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (activeView === "admin") {
      loadAdminAuditLogs();
    } else {
      loadLogFiles();
    }
  }, [activeView, filters, page]);

  const loadAdminAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const ADMIN_URL =
        import.meta.env.VITE_SUPERADMIN_SERVICE_URL ||
        import.meta.env.VITE_API_GATEWAY_URL ||
        "http://localhost:3030";
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (filters.action) params.set("action", filters.action);
      if (filters.resource) params.set("resource", filters.resource);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      const res = await fetch(`${ADMIN_URL}/api/admin/audit-logs?${params}`, {
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": localStorage.getItem("adminId") || "superadmin",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLogFiles = async () => {
    setLoading(true);
    try {
      const files = await gatewayApi.listAuditLogs();
      setLogFiles(files);
      if (files.length > 0 && !selectedLogDate) {
        setSelectedLogDate(files[0].date);
        loadGatewayLogs(files[0].date);
      }
    } catch (err) {
      setError("Failed to connect to Gateway Audit API");
    } finally {
      setLoading(false);
    }
  };

  const loadGatewayLogs = async (date: string) => {
    setLoading(true);
    try {
      const data = await gatewayApi.getAuditLog(date);
      setGatewayLogs(data);
      setSelectedLogDate(date);
    } catch (err) {
      setError("Failed to load log content");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 500) return "text-near-black bg-near-black/5";
    if (status >= 400) return "text-near-black bg-near-black/5";
    if (status >= 300) return "text-apple-blue bg-apple-blue";
    return "text-apple-blue bg-apple-blue/5";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-near-black">Audit & Observability</h2>
          <p className="text-near-black mt-0.5">Track administrative actions and raw API traffic patterns</p>
        </div>
        <div className="flex bg-near-black p-1 rounded-lg border border-near-black">
          <button
            onClick={() => setActiveView("admin")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeView === "admin" ? "bg-white text-apple-blue shadow-sm" : "text-near-black hover:text-near-black"}`}
          >
            Admin Actions
          </button>
          <button
            onClick={() => setActiveView("gateway")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeView === "gateway" ? "bg-white text-apple-blue shadow-sm" : "text-near-black hover:text-near-black"}`}
          >
            Gateway Traffic
          </button>
        </div>
      </div>

      {activeView === "admin" ? (
        <>
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-near-black" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-near-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
              <FormField
                type="select"
                label=""
                value={filters.action}
                onChange={(value) => setFilters({ ...filters, action: value })}
                options={[
                  { value: "", label: "All Actions" },
                  { value: "CREATE", label: "Create" },
                  { value: "UPDATE", label: "Update" },
                  { value: "DELETE", label: "Delete" },
                  { value: "LOGIN", label: "Login" },
                  { value: "LOGOUT", label: "Logout" },
                  { value: "CONFIG", label: "Config" },
                ]}
                placeholder="Filter by action"
              />
              <FormField
                type="select"
                label=""
                value={filters.resource}
                onChange={(value) => setFilters({ ...filters, resource: value })}
                options={[
                  { value: "", label: "All Resources" },
                  { value: "TENANT", label: "Tenant" },
                  { value: "USER", label: "User" },
                  { value: "ROLE", label: "Role" },
                  { value: "SUPPLIER", label: "Supplier" },
                  { value: "TAX_RULE", label: "Tax Rule" },
                ]}
                placeholder="Filter by resource"
              />
              <FormField
                type="text"
                label=""
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                placeholder="From date"
              />
              <FormField
                type="text"
                label=""
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                placeholder="To date"
              />
            </div>
          </Card>
          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apple-blue" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-black/5">
                  <thead className="bg-near-black text-xs uppercase tracking-wider text-near-black">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Action</th>
                      <th className="px-6 py-3 text-left font-semibold">Resource</th>
                      <th className="px-6 py-3 text-left font-semibold">User</th>
                      <th className="px-6 py-3 text-left font-semibold">Details</th>
                      <th className="px-6 py-3 text-left font-semibold">IP</th>
                      <th className="px-6 py-3 text-left font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-black/5">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-near-black">
                          No admin audit logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-light-gray transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {actionIcons[log.action] || <Activity className="h-4 w-4" />}
                              <span className="font-semibold text-near-black">{log.action}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-near-black">
                            {resourceLabels[log.resource] || log.resource}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-near-black flex items-center justify-center text-[10px] font-bold text-near-black">
                                {log.userName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{log.userName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-near-black max-w-xs truncate">
                            {log.details || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-near-black">
                            {log.ipAddress || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-near-black">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        <div className="flex gap-6 h-[calc(100vh-280px)]">
          {/* Log File Sidebar */}
          <Card className="w-64 shrink-0 overflow-y-auto p-4 flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-near-black mb-2">Available Logs</h3>
            {logFiles.map((file) => (
              <button
                key={file.date}
                onClick={() => loadGatewayLogs(file.date)}
                className={`flex items-center justify-between p-2.5 rounded-lg text-sm text-left transition-all ${
                  selectedLogDate === file.date
                    ? "bg-light-gray text-apple-blue font-semibold ring-1 ring-apple-blue"
                    : "hover:bg-near-black text-near-black"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 opacity-50" />
                  {file.date}
                </div>
                <span className="text-[10px] opacity-40">{(file.size / 1024).toFixed(0)} KB</span>
              </button>
            ))}
          </Card>
          {/* Log Content Area */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="bg-near-black px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-apple-blue text-xs font-mono">
                <Terminal className="h-3 w-3" />
                <span>/var/log/api-gateway/audit-{selectedLogDate}.log</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-near-black">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-apple-blue" /> 2xx
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-apple-blue" /> 4xx
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-apple-error" /> 5xx
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-near-black">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 text-near-black animate-spin" />
                </div>
              ) : (
                <table className="min-w-full divide-y divide-black/5">
                  <thead className="bg-white text-[10px] uppercase tracking-widest text-near-black sticky top-0 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Method / Path</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Latency</th>
                      <th className="px-4 py-3 text-left">User/Tenant</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 bg-white font-mono text-[11px]">
                    {gatewayLogs.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-light-gray/30 transition-colors group">
                        <td className="px-4 py-2.5 whitespace-nowrap text-near-black">
                          {new Date(entry.ts).toLocaleTimeString([], {
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                entry.method === "GET"
                                  ? "bg-apple-blue/10 text-apple-blue"
                                  : "bg-apple-blue/10 text-apple-blue"
                              }`}
                            >
                              {entry.method}
                            </span>
                            <span className="text-near-black max-w-xs truncate">{entry.path}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-near-black">
                          {entry.latencyMs}ms
                        </td>
                        <td className="px-4 py-2.5 text-near-black italic">
                          {entry.userId ? `${entry.userId}@${entry.tenantId || "system"}` : "anonymous"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button className="p-1 text-near-black hover:text-apple-blue opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuditTrailPage;
