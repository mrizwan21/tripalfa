import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Check,
  Ban,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { apiManager, cn } from '@tripalfa/shared-features';

// ─── Types ─────────────────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  email: string;
  extension?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK' | 'OFFLINE' | 'ARCHIVED';
  role: string;
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 10;
const STATUS_OPTIONS: Agent['status'][] = ['ACTIVE', 'INACTIVE', 'ON_BREAK', 'OFFLINE'];
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_BREAK: 'On Break',
  OFFLINE: 'Offline',
  ARCHIVED: 'Archived',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500',
  INACTIVE: 'bg-gray-400',
  ON_BREAK: 'bg-amber-500',
  OFFLINE: 'bg-red-500',
  ARCHIVED: 'bg-gray-400',
};

// ─── Components ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Agent['status'] }) {
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState<Agent | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [archivedFilter, setArchivedFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  const [form, setForm] = useState({ name: '', email: '', extension: '', role: '' });

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = (await apiManager.getCallCenterAgents(params)) as unknown as {
        data: Agent[];
        total: number;
      };
      setAgents(res.data || []);
      setTotal(res.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
      setAgents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const openCreate = () => {
    setEditingAgent(null);
    setForm({ name: '', email: '', extension: '', role: '' });
    setIsModalOpen(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      email: agent.email,
      extension: agent.extension || '',
      role: agent.role,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingAgent) {
        await apiManager.updateCallCenterAgent(editingAgent.id, { ...form });
      } else {
        await apiManager.createCallCenterAgent({ ...form, status: 'ACTIVE' });
      }
      setIsModalOpen(false);
      await fetchAgents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiManager.deleteCallCenterAgent(deleteTarget.id);
      setDeleteTarget(null);
      await fetchAgents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await apiManager.updateCallCenterAgent(restoreTarget.id, { status: 'ACTIVE' });
      setRestoreTarget(null);
      await fetchAgents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to restore agent');
    } finally {
      setRestoring(false);
    }
  };

  const filteredAgents = agents.filter((a) => {
    const matchesSearch = [a.name, a.email, a.extension, a.role].some((field) =>
      (field || '').toLowerCase().includes(search.toLowerCase())
    );
    if (!matchesSearch) return false;
    if (archivedFilter === 'ACTIVE') {
      return a.status !== 'ARCHIVED';
    } else if (archivedFilter === 'ARCHIVED') {
      return a.status === 'ARCHIVED';
    }
    return true;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="max-w-[1700px] mx-auto pb-20 px-6 pt-8 space-y-6 animate-fade">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-[#1d1d1f] leading-tight">
            Call Center <span className="font-bold">Agents</span>
          </h1>
          <p className="text-sm text-black/40 mt-2 font-medium">Manage agent accounts, roles, and availability.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white rounded-xl text-sm font-bold hover:bg-[#0077ed] transition-colors shadow-sm">
          <Plus size={16} />
          New Agent
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white rounded-2xl border border-black/5 p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, extension..."
            className="w-full pl-9 pr-4 py-2.5 bg-black/5 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0071e3]/30 focus:shadow-sm transition-all"
          />
        </div>
        <div className="flex gap-2">
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
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f5f7] border-b border-black/5">
              <tr>
                {['Name', 'Email', 'Extension', 'Role', 'Status', 'Actions'].map((h) => (
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
                      <span className="text-sm font-medium">Loading agents...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-black/30 text-sm">
                    No agents found.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
                          <Users size={14} className="text-[#0071e3]" />
                        </div>
                        <span className="font-semibold text-[#1d1d1f]">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-black/50 font-mono text-xs">{agent.email}</td>
                    <td className="px-6 py-4 text-black/50 font-mono text-xs">{agent.extension || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-black/60 bg-black/5 px-3 py-1 rounded-lg">{agent.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {agent.status === 'ARCHIVED' ? (
                          <button
                            onClick={() => setRestoreTarget(agent)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium border border-green-200"
                          >
                            <RotateCcw size={14} />
                            Restore
                          </button>
                        ) : (
                          <>
                            <button onClick={() => openEdit(agent)} className="p-2 rounded-lg hover:bg-black/5 transition-colors" title="Edit">
                              <Pencil size={14} className="text-black/40 hover:text-[#0071e3]" />
                            </button>
                            <button onClick={() => setDeleteTarget(agent)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 size={14} className="text-black/40 hover:text-red-500" />
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
            Showing {agents.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total}
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

      {/* Create / Edit Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAgent ? 'Edit Agent' : 'New Agent'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-black/30 uppercase tracking-widest">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 bg-black/5 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0071e3]/30 transition-all" placeholder="e.g. Sarah Johnson" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-black/30 uppercase tracking-widest">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 bg-black/5 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0071e3]/30 transition-all" placeholder="sarah@tripalfa.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black/30 uppercase tracking-widest">Extension</label>
              <input value={form.extension} onChange={(e) => setForm((f) => ({ ...f, extension: e.target.value }))} className="w-full px-4 py-2.5 bg-black/5 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0071e3]/30 transition-all" placeholder="1234" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black/30 uppercase tracking-widest">Role</label>
              <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-4 py-2.5 bg-black/5 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0071e3]/30 transition-all" placeholder="e.g. Supervisor" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black/40 hover:bg-black/5 transition-colors border border-transparent">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white rounded-xl text-sm font-bold hover:bg-[#0077ed] disabled:opacity-60 transition-colors shadow-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editingAgent ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-sm text-black/60">
            Are you sure you want to remove <span className="font-bold text-[#1d1d1f]">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black/40 hover:bg-black/5 transition-colors border border-transparent">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-60 transition-colors shadow-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Restore Confirmation */}
      <Modal open={!!restoreTarget} onClose={() => setRestoreTarget(null)} title="Restore Agent">
        <div className="space-y-4">
          <p className="text-sm text-black/60">
            Are you sure you want to restore <span className="font-bold text-[#1d1d1f]">{restoreTarget?.name}</span>?
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
