import { useState, useMemo } from 'react';
import { ProfileLayout } from './ProfilePage';
import { useQuery } from '@tanstack/react-query';
import { apiManager, cn } from '../index';
import type { SecurityEntry } from '../types';
import { 
  Download, 
  History, 
  XCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Shield, 
  Monitor, 
  MapPin, 
  Globe, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function LoginHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Success' | 'Failed' | 'Info'>('All');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['login-history'],
    queryFn: () => apiManager.getLoginHistory(),
  });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !searchTerm ||
        log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.device?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const successCount = logs.filter(l => l.status === 'Success').length;
  const failedCount = logs.filter(l => l.status === 'Failed').length;

  return (
    <ProfileLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-pure-black mb-1">
              Login <span className="font-semibold">History</span>
            </h1>
            <p className="text-sm text-pure-black/40">Security log of all authentication events</p>
          </div>
          <button className="px-5 py-2.5 bg-pure-black text-white text-[10px] font-bold rounded-xl flex items-center gap-2 hover:bg-black/80 transition-all">
            <Download size={14} /> Export Log
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-navy/5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-pure-black rounded-xl flex items-center justify-center text-white">
                <History size={16} />
              </div>
            </div>
            <p className="text-[9px] font-bold text-pure-black/40 tracking-tight mb-1">Total Events</p>
            <p className="text-2xl font-light text-pure-black">{logs.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-navy/5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-apple-blue/10 rounded-xl flex items-center justify-center text-apple-blue">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="text-[9px] font-bold text-pure-black/40 tracking-tight mb-1">Successful Logins</p>
            <p className="text-2xl font-light text-apple-blue">{successCount}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-navy/5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                <XCircle size={16} />
              </div>
            </div>
            <p className="text-[9px] font-bold text-pure-black/40 tracking-tight mb-1">Failed Attempts</p>
            <p className="text-2xl font-light text-red-500">{failedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-pure-black/30" />
            <input
              type="text"
              placeholder="Search events, IPs, locations, devices..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-light-gray border border-navy/5 rounded-xl text-sm text-pure-black outline-none focus:border-apple-blue transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-pure-black/30" />
            {(['All', 'Success', 'Failed', 'Info'] as const).map(status => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all",
                  statusFilter === status
                    ? "bg-pure-black text-white"
                    : "bg-light-gray text-pure-black/40 hover:bg-slate-200"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-navy/5 rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[11px] text-pure-black/30 font-semibold">Loading security log...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-pure-black text-white text-[10px] font-semibold tracking-tight">
                      <th className="py-5 px-6">Timestamp</th>
                      <th className="py-5 px-6">Event</th>
                      <th className="py-5 px-6">IP Address</th>
                      <th className="py-5 px-6">Device / Browser</th>
                      <th className="py-5 px-6">Location</th>
                      <th className="py-5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {paginatedLogs.map((log, idx) => (
                      <tr key={idx} className="group hover:bg-light-gray/50 transition-all">
                        <td className="py-4 px-6 text-[11px] font-semibold text-pure-black/70 whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-apple-blue" />
                            <span className="text-[11px] font-semibold text-pure-black">{log.event}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[11px] font-mono text-pure-black/60">{log.ipAddress || '—'}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Monitor size={12} className="text-pure-black/30" />
                            <span className="text-[11px] text-pure-black/60">{log.device || '—'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-pure-black/30" />
                            <span className="text-[11px] text-pure-black/60">{log.location || '—'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border",
                            log.status === 'Success' ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' :
                              log.status === 'Failed' ? 'bg-red-50 text-red-600 border-red-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                          )}>
                            {log.status === 'Success' ? <CheckCircle2 size={10} /> :
                              log.status === 'Failed' ? <XCircle size={10} /> :
                                <Globe size={10} />}
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {paginatedLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[11px] text-pure-black/30 font-semibold">
                          No matching events found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-navy/5 flex items-center justify-between">
                  <p className="text-[10px] text-pure-black/40 font-semibold">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-light-gray text-pure-black/40 disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-[10px] font-bold transition-all",
                          page === currentPage ? "bg-pure-black text-white" : "text-pure-black/40 hover:bg-light-gray"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-light-gray text-pure-black/40 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
}
