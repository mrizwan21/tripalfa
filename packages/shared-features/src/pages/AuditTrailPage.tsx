import { useState } from 'react';
import { History, Filter, Search, Download, Clock, Fingerprint, CheckCircle2, AlertTriangle, XCircle, MoreVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiManager } from '../services/apiManager';
import { cn } from '../lib/utils';
import { Layout } from '../components/Layout';
import { NodalPageHeader } from '../index';

export default function AuditTrailPage() {
  const [filter, setFilter] = useState<'All' | 'Success' | 'Warning' | 'Failed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiManager.getSystemicAudit()
  });

  const filteredAudits = audits.filter((log: any) => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         log.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filter === 'All' || log.status === filter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <NodalPageHeader
          icon={History}
          title="Audit"
          highlightedTitle="Ledger"
          nodeName="AUDIT_SYSLOG"
          subtitle="Immutable chronological record of system events and branch actions."
          actions={
            <div className="flex bg-black p-1 rounded-xl">
              {(['All', 'Success', 'Warning', 'Failed'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={cn("px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", filter === f ? "bg-white text-black shadow-sm" : "text-white/40")}>{f}</button>
              ))}
            </div>
          }
        />

        <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 my-12 shadow-sm">
          <div className="relative mb-12">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Ledger Action / Ref..." className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl pl-16 pr-8 py-4 text-sm font-bold outline-none transition-all" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black text-apple-blue text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-10 py-6">Timestamp</th>
                  <th className="px-6 py-6">Actor</th>
                  <th className="px-6 py-6">Action</th>
                  <th className="px-10 py-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {isLoading ? (
                  <tr><td colSpan={4} className="py-48 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">Hydrating audit nodes...</td></tr>
                ) : filteredAudits.length === 0 ? (
                  <tr><td colSpan={4} className="py-48 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">No entries found.</td></tr>
                ) : (
                  filteredAudits.map((log: any) => (
                    <tr key={log.id} className="hover:bg-black/[0.01] transition-all group">
                      <td className="px-10 py-8">
                        <div className="text-sm font-bold text-black">{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center text-black/40 font-bold text-[10px]">{log.agentName?.charAt(0)}</div>
                          <span className="text-sm font-bold text-black/60">{log.agentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-8">
                        <div className="text-sm font-bold text-black">{log.action}</div>
                        <div className="text-[9px] font-bold text-apple-blue uppercase tracking-widest">{log.reference}</div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                          log.status === 'Success' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
