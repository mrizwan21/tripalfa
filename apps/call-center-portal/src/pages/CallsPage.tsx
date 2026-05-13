import { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  MessageSquare,
  Clock,
  User,
  Headset,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import { apiManager, cn } from '@tripalfa/shared-features';

// ─── Types ─────────────────────────────────────────────────────────
interface CallRecord {
  id: string;
  callerNumber: string;
  callerName?: string;
  agentId?: string;
  agentName?: string;
  queueId?: string;
  queueName?: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'TRANSFERRED' | 'VOICEMAIL' | 'ARCHIVED';
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  createdAt: string;
}

interface CallInteraction {
  id: string;
  callId: string;
  type: string;
  notes?: string;
  createdAt: string;
  userId?: string;
  userName?: string;
}

const PAGE_SIZE = 10;
const STATUS_OPTIONS: CallRecord['status'][] = [
  'WAITING',
  'IN_PROGRESS',
  'COMPLETED',
  'MISSED',
  'TRANSFERRED',
  'VOICEMAIL',
];
const STATUS_LABELS: Record<string, string> = {
  WAITING: 'Waiting',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  MISSED: 'Missed',
  TRANSFERRED: 'Transferred',
  VOICEMAIL: 'Voicemail',
  ARCHIVED: 'Archived',
};
const STATUS_COLORS: Record<string, string> = {
  WAITING: 'bg-amber-500',
  IN_PROGRESS: 'bg-[#0071e3]',
  COMPLETED: 'bg-emerald-500',
  MISSED: 'bg-red-500',
  TRANSFERRED: 'bg-violet-500',
  VOICEMAIL: 'bg-gray-500',
  ARCHIVED: 'bg-gray-400',
};

// ─── Components ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CallRecord['status'] }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white border border-black/5">
      <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_COLORS[status])} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <h3 className="text-sm font-bold text-[#1d1d1f]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <X size={16} className="text-black/40" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────
export default function CallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [detailCall, setDetailCall] = useState<CallRecord | null>(null);
  const [interactions, setInteractions] = useState<CallInteraction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [interactionsOpen, setInteractionsOpen] = useState(false);

  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<CallRecord['status']>('COMPLETED');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState<CallRecord | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [archivedFilter, setArchivedFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (statusFilter !== 'ALL') (params as any).status = statusFilter;
      
      const res = (await apiManager.getCallCenterCalls(params)) as unknown as {
        data: CallRecord[];
        total: number;
      };
      setCalls(res.data || []);
      setTotal(res.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
      setCalls([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const openInteractions = async (call: CallRecord) => {
    setDetailCall(call);
    setInteractionsOpen(true);
    setInteractionsLoading(true);
    try {
      const data = (await apiManager.getCallInteractions(call.id)) as unknown as CallInteraction[];
      setInteractions(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load interactions');
      setInteractions([]);
    } finally {
      setInteractionsLoading(false);
    }
  };

  const openStatusUpdate = (call: CallRecord) => {
    setDetailCall(call);
    setNewStatus(call.status);
    setStatusNotes(call.notes || '');
    setStatusUpdateOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!detailCall) return;
    setUpdatingStatus(true);
    try {
      await apiManager.updateCallStatus(detailCall.id, newStatus, statusNotes);
      setStatusUpdateOpen(false);
      await fetchCalls();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update call status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await apiManager.updateCallStatus(restoreTarget.id, 'COMPLETED', 'Restored from archived');
      setRestoreTarget(null);
      await fetchCalls();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to restore call');
    } finally {
      setRestoring(false);
    }
  };

  const filteredCalls = calls.filter((c) => {
    const matchesSearch = [c.callerNumber, c.callerName, c.agentName, c.queueName].some((field) =>
      (field || '').toLowerCase().includes(search.toLowerCase())
    );
    if (!matchesSearch) return false;
    if (archivedFilter === 'ACTIVE') {
      return c.status !== 'ARCHIVED';
    } else if (archivedFilter === 'ARCHIVED') {
      return c.status === 'ARCHIVED';
    }
    return true;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-[1700px] mx-auto pb-20 px-6 pt-8 space-y-6 animate-fade">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light tracking-tight text-[#1d1d1f] leading-tight">
          Call <span className="font-bold">Recordings</span>
        </h1>
        <p className="text-sm text-black/40 mt-2 font-medium">
          Browse call logs, update statuses, and review interaction history.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white rounded-2xl border border-black/5 p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by caller, agent, queue..."
            className="w-full pl-9 pr-4 py-2.5 bg-black/5 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0071e3]/30 focus:shadow-sm transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ label: 'All', value: 'ALL' }, ...STATUS_OPTIONS.map((s) => ({ label: STATUS_LABELS[s], value: s }))].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                statusFilter === opt.value
                  ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-sm'
                  : 'bg-white text-black/40 border-black/5 hover:border-black/10'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* Archived Filter Tabs */}
        <div className="flex gap-2">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setArchivedFilter(tab); setPage(1); }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                archivedFilter === tab
                  ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-sm'
                  : 'bg-white text-black/40 border-black/5 hover:border-black/10'
              )}
            >
              {tab === 'ALL' && 'All'}
              {tab === 'ACTIVE' && 'Active'}
              {tab === 'ARCHIVED' && 'Archived'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f5f7] border-b border-black/5">
              <tr>
                {['Caller', 'Agent / Queue', 'Status', 'Start Time', 'Duration', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-6 py-3.5 text-[10px] font-bold text-black/30 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-black/30">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm font-medium">Loading calls...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-black/30 text-sm">
                    No calls found.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
                          <Phone size={13} className="text-[#0071e3]" />
                        </div>
                        <div>
                          <span className="font-semibold text-[#1d1d1f] text-xs">{call.callerName || call.callerNumber}</span>
                          <span className="block text-[10px] text-black/30 font-mono mt-0.5">{call.callerNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {call.agentName && (
                          <span className="flex items-center gap-1 text-xs text-black/50">
                            <User size={12} className="text-black/20" />
                            {call.agentName}
                          </span>
                        )}
                        {call.queueName && (
                          <span className="flex items-center gap-1 text-[10px] text-black/30 uppercase tracking-wider">
                            <Headset size={11} className="text-black/20" />
                            {call.queueName}
                          </span>
                        )}
                        {!call.agentName && !call.queueName && (
                          <span className="text-xs text-black/20 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={call.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-black/50">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-black/20" />
                        {formatDate(call.startTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-black/50 font-mono tabular-nums">{formatDuration(call.duration)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {call.status === 'ARCHIVED' ? (
                          <button
                            onClick={() => setRestoreTarget(call)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium border border-green-200"
                          >
                            <RotateCcw size={14} />
                            Restore
                          </button>
                        ) : (
                          <>
                            <button onClick={() => openStatusUpdate(call)} className="p-2 rounded-lg hover:bg-black/5 transition-colors" title="Update Status">
                              <ArrowUpRight size={14} className="text-black/40 hover:text-[#0071e3]" />
                            </button>
                            <button onClick={() => openInteractions(call)} className="p-2 rounded-lg hover:bg-black/5 transition-colors" title="View Interactions">
                              <MessageSquare size={14} className="text-black/40 hover:text-[#0071e3]" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/5 bg-[#f5f5f7]">
          <span className="text-xs text-black/30 font-medium">
            Showing {calls.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-black/5 bg-white hover:bg-black/5 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-bold text-black/50 px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-black/5 bg-white hover:bg-black/5 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactions Modal */}
      <Modal open={interactionsOpen} onClose={() => setInteractionsOpen(false)} title={`Interactions — ${detailCall?.callerName || detailCall?.callerNumber || 'Call'}`}>
        <div className="space-y-4">
          {interactionsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-black/30">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-medium">Loading interactions...</span>
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-8 text-black/30 text-sm">No interactions recorded for this call.</div>
          ) : (
            <div className="space-y-3">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="p-4 rounded-xl bg-[#f5f5f7] border border-black/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-black/50 uppercase tracking-widest">{interaction.type}</span>
                    <span className="text-[10px] text-black/30">{formatDate(interaction.createdAt)}</span>
                  </div>
                  {interaction.notes && <p className="text-sm text-black/70">{interaction.notes}</p>}
                  {interaction.userName && <p className="text-[10px] text-black/30 mt-1">by {interaction.userName}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal open={statusUpdateOpen} onClose={() => setStatusUpdateOpen(false)} title="Update Call Status">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-black/30 uppercase tracking-widest">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as CallRecord['status'])}
              className="w-full px-4 py-2.5 bg-black/5 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0071e3]/30 transition-all"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-black/30 uppercase tracking-widest">Notes</label>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/5 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0071e3]/30 transition-all min-h-[80px] resize-y"
              placeholder="Add any notes about this status change..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setStatusUpdateOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black/40 hover:bg-black/5 transition-colors border border-transparent">Cancel</button>
            <button onClick={handleStatusUpdate} disabled={updatingStatus} className="flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white rounded-xl text-sm font-bold hover:bg-[#0077ed] disabled:opacity-60 transition-colors shadow-sm">
              {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
              Update Status
            </button>
          </div>
        </div>
      </Modal>

      {/* Restore Confirmation */}
      <Modal open={!!restoreTarget} onClose={() => setRestoreTarget(null)} title="Restore Call">
        <div className="space-y-4">
          <p className="text-sm text-black/60">
            Are you sure you want to restore the call from <span className="font-bold text-[#1d1d1f]">{restoreTarget?.callerName || restoreTarget?.callerNumber}</span>?
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRestoreTarget(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black/40 hover:bg-black/5 transition-colors border border-transparent">Cancel</button>
            <button onClick={handleRestore} disabled={restoring} className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-60 transition-colors shadow-sm">
              {restoring ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Restore
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
