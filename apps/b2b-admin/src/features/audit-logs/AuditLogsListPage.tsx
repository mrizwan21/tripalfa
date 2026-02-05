import React, { useState } from 'react';
import {
  Shield,
  Search,
  Filter,
  Clock,
  User,
  Globe,
  ChevronRight,
  Info,
  AlertTriangle,
  Activity,
  Calendar,
  ArrowLeftRight,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  ip: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
  before?: any;
  after?: any;
}

const mockLogs: AuditLog[] = [
  {
    id: 'LOG-1001',
    userId: 'USR-8812',
    userName: 'John Doe (Admin)',
    action: 'UPDATE_WALLET',
    resource: 'SUB-12003',
    timestamp: new Date().toISOString(),
    ip: '192.168.1.45',
    severity: 'HIGH',
    details: 'Manually credited $5,000 to subagent wallet',
    before: { balance: 1200, status: 'ACTIVE' },
    after: { balance: 6200, status: 'ACTIVE' }
  },
  {
    id: 'LOG-1002',
    userId: 'USR-9921',
    userName: 'System Bot',
    action: 'CONFIRM_BOOKING',
    resource: 'BK-99120',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    ip: '127.0.0.1',
    severity: 'LOW',
    details: 'Booking confirmed via API Provider (LiteAPI)',
    before: { status: 'PENDING' },
    after: { status: 'CONFIRMED' }
  },
  {
    id: 'LOG-1003',
    userId: 'USR-1102',
    userName: 'Sarah Wilson',
    action: 'DELETE_MARKUP',
    resource: 'RL-552',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    ip: '45.12.33.109',
    severity: 'MEDIUM',
    details: 'Removed seasonal markup for Dubai hotels',
    before: { name: 'Dubai Summer', value: 15, type: 'PERCENT' },
    after: null
  }
];

export function AuditLogsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'HIGH': return <Badge className="bg-rose-500/10 text-rose-600 border-none font-black text-[10px] uppercase tracking-widest">Critical</Badge>;
      case 'MEDIUM': return <Badge className="bg-amber-500/10 text-amber-600 border-none font-black text-[10px] uppercase tracking-widest">Warning</Badge>;
      default: return <Badge className="bg-indigo-500/10 text-indigo-600 border-none font-black text-[10px] uppercase tracking-widest">Info</Badge>;
    }
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Audit Trail
              <Shield className="h-6 w-6 text-primary" />
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Monitoring system-wide administrative and automated actions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl h-11 border-gray-100 bg-white font-bold text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Retention: 90 Days
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-xl rounded-3xl bg-white p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by User, Resource, or Action..."
                className="pl-12 h-12 bg-gray-50/50 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-100 font-bold text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
            <Button className="h-12 px-6 rounded-2xl bg-gray-900 text-white font-bold hover:bg-primary shadow-lg shadow-gray-200">
              Export Logs
            </Button>
          </div>
        </Card>

        {/* Timeline View */}
        <div className="relative space-y-4">
          <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-gray-100" />

          {mockLogs.map((log) => (
            <div key={log.id} className="relative pl-20 group">
              {/* Connector Icon */}
              <div className={`absolute left-0 top-6 h-20 w-20 rounded-full bg-white shadow-xl border-4 border-gray-50 flex items-center justify-center transition-transform group-hover:scale-110 duration-500 z-10 ${log.severity === 'HIGH' ? 'text-rose-600' : 'text-indigo-600'
                }`}>
                <Activity className="h-8 w-8" />
              </div>

              <Card className="border-none shadow-lg rounded-[2rem] bg-white transition-all hover:shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 md:w-3/4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{log.action}</span>
                          <div className="h-1 w-1 rounded-full bg-gray-300" />
                          <span className="text-xs font-black text-primary uppercase tracking-widest">{log.resource}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {getSeverityBadge(log.severity)}
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-gray-900">{log.details}</h3>

                      <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Initiated By</p>
                            <p className="text-sm font-bold text-gray-700">{log.userName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Source IP</p>
                            <p className="text-sm font-bold text-gray-700">{log.ip}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 md:w-1/4 p-6 flex flex-col items-center justify-center gap-4 text-center border-l border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Audit Meta</p>
                      <Badge variant="outline" className="bg-white border-gray-200 font-bold text-gray-500 rounded-lg">{log.id}</Badge>
                      <Button
                        variant="ghost"
                        className="w-full mt-2 rounded-xl h-12 font-black text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 group"
                        onClick={() => handleViewDetail(log)}
                      >
                        Inspection View
                        <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Footer Status */}
        <div className="py-10 text-center">
          <p className="text-gray-400 font-medium text-sm">Showing 3 of 15,290 historical events.</p>
          <Button variant="link" className="text-primary font-black mt-2">Load Previous Activity</Button>
        </div>
      </div>

      {/* Detail Overlay */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          {selectedLog && (
            <div className="flex flex-col h-full">
              <div className="bg-gray-900 p-8 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] uppercase tracking-widest mb-4">Event Evidence</Badge>
                    <h2 className="text-3xl font-black">{selectedLog.action}</h2>
                    <p className="text-gray-400 mt-2 font-medium">Trace ID: {selectedLog.id} • {new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Activity className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1.5 w-4 bg-rose-500 rounded-full" />
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">State Before</h4>
                    </div>
                    <pre className="bg-gray-50 border border-gray-100 p-6 rounded-2xl font-mono text-sm text-gray-600 overflow-x-auto">
                      {selectedLog.before ? JSON.stringify(selectedLog.before, null, 4) : '// NO PREVIOUS STATE'}
                    </pre>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1.5 w-4 bg-emerald-500 rounded-full" />
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">State After</h4>
                    </div>
                    <pre className="bg-gray-50 border border-gray-100 p-6 rounded-2xl font-mono text-sm text-gray-600 overflow-x-auto">
                      {selectedLog.after ? JSON.stringify(selectedLog.after, null, 4) : '// RECORD DELETED'}
                    </pre>
                  </div>
                </div>

                <Card className="border-none shadow-sm bg-indigo-50 p-6 rounded-2xl">
                  <div className="flex gap-4">
                    <Info className="h-6 w-6 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-bold text-indigo-900">Expert Context</p>
                      <p className="text-sm text-indigo-700/80 mt-1 leading-relaxed">This action was identified as {selectedLog.severity.toLowerCase()} risk. The change affected resource {selectedLog.resource} and was originated from {selectedLog.ip}. No security whitelisting anomalies were detected.</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsDetailOpen(false)} className="rounded-xl font-bold">Dismiss Archive</Button>
                <Button className="rounded-xl bg-gray-900 text-white font-bold px-8">Initiate Action Reversal</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AuditLogsListPage;
