import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { apiManager } from '../services/apiManager';
import { cn } from '../lib/utils';

interface Agreement {
  id: string;
  title: string;
  partnerName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending' | 'archived';
  createdAt: string;
}

type AgreementFormData = Omit<Agreement, 'id' | 'createdAt'>;

const PAGE_SIZE = 10;

const B2BAgreementsPage: React.FC = () => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AgreementFormData>({
    title: '',
    partnerName: '',
    startDate: '',
    endDate: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Agreement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState<Agreement | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  const fetchAgreements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiManager.getAgreements();
      setAgreements(data?.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch agreements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const filtered = useMemo(() => {
    let list = agreements;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.partnerName.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'ACTIVE') {
      list = list.filter((a) => a.status !== 'archived');
    } else if (statusFilter === 'ARCHIVED') {
      list = list.filter((a) => a.status === 'archived');
    }
    return list;
  }, [agreements, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ title: '', partnerName: '', startDate: '', endDate: '', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = async (id: string) => {
    try {
      const a = await apiManager.getAgreementById(id);
      setEditingId(id);
      setFormData({
        title: a.title || '',
        partnerName: a.partnerName || '',
        startDate: a.startDate ? a.startDate.slice(0, 10) : '',
        endDate: a.endDate ? a.endDate.slice(0, 10) : '',
        status: a.status || 'active',
      });
      setModalOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to load agreement details');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiManager.updateAgreement(editingId, formData);
      } else {
        await apiManager.createAgreement(formData);
      }
      setModalOpen(false);
      await fetchAgreements();
    } catch (err: any) {
      setError(err?.message || 'Failed to save agreement');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (agreement: Agreement) => {
    setDeleteTarget(agreement);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiManager.deleteAgreement(deleteTarget.id);
      setDeleteTarget(null);
      await fetchAgreements();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete agreement');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await apiManager.updateAgreement(restoreTarget.id, { status: 'active' });
      setRestoreTarget(null);
      await fetchAgreements();
    } catch (err: any) {
      setError(err?.message || 'Failed to restore agreement');
    } finally {
      setRestoring(false);
    }
  };

  const statusBadge = (status: Agreement['status']) => {
    const map: Record<string, string> = {
      active: 'bg-green-50 text-green-700 border-green-200',
      expired: 'bg-amber-50 text-amber-700 border-amber-200',
      pending: 'bg-blue-50 text-blue-700 border-blue-200',
      archived: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border', map[status] || 'bg-gray-100 text-gray-600 border-gray-200')}>
        {status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#0071e3]" />
            <h1 className="text-3xl font-semibold text-[#1d1d1f]">B2B Agreements</h1>
          </div>
          <p className="text-[#1d1d1f]/60">Manage B2B agreements, contracts, and terms.</p>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1d1d1f]/40" />
            <input
              type="text"
              placeholder="Search by title, partner, or status..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
            />
          </div>
          {/* Status Filter Tabs */}
          <div className="flex gap-2">
            {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatusFilter(tab); setPage(1); }}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border',
                  statusFilter === tab
                    ? 'bg-[#0071e3] text-white border-[#0071e3]'
                    : 'bg-white text-[#1d1d1f]/60 border-[#1d1d1f]/10 hover:border-[#0071e3]/30'
                )}
              >
                {tab === 'ALL' && 'All'}
                {tab === 'ACTIVE' && 'Active'}
                {tab === 'ARCHIVED' && 'Archived'}
              </button>
            ))}
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] text-white font-medium hover:bg-[#0071e3]/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Agreement
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-[#1d1d1f]/10 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5f5f7]">
                <tr>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Title</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Partner</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Start Date</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">End Date</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Status</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#1d1d1f]/50">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading agreements...</span>
                      </div>
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#1d1d1f]/40">
                      No agreements found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((a) => (
                    <tr key={a.id} className="border-t border-[#1d1d1f]/5 hover:bg-[#f5f5f7]/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1d1d1f]">{a.title}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70">{a.partnerName}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70">{a.startDate ? new Date(a.startDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70">{a.endDate ? new Date(a.endDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4">{statusBadge(a.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {a.status === 'archived' ? (
                            <button
                              onClick={() => setRestoreTarget(a)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium border border-green-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(a.id)}
                                className="p-2 rounded-lg hover:bg-[#0071e3]/10 text-[#0071e3] transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => confirmDelete(a)}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#1d1d1f]/60">
            Showing {filtered.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-[#1d1d1f]/10 bg-white hover:bg-[#f5f5f7] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[#1d1d1f]/70">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-[#1d1d1f]/10 bg-white hover:bg-[#f5f5f7] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#1d1d1f]">
                {editingId ? 'Edit Agreement' : 'Add Agreement'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[#f5f5f7]">
                <X className="w-5 h-5 text-[#1d1d1f]/60" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">Title</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">Partner Name</label>
                <input
                  required
                  value={formData.partnerName}
                  onChange={(e) => setFormData((d) => ({ ...d, partnerName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((d) => ({ ...d, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((d) => ({ ...d, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((d) => ({ ...d, status: e.target.value as Agreement['status'] }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#1d1d1f]/10 text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0071e3] text-white font-medium hover:bg-[#0071e3]/90 disabled:opacity-60 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Delete Agreement</h3>
            <p className="mt-1 text-sm text-[#1d1d1f]/60">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 rounded-xl border border-[#1d1d1f]/10 text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <RotateCcw className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Restore Agreement</h3>
            <p className="mt-1 text-sm text-[#1d1d1f]/60">
              Are you sure you want to restore <strong>{restoreTarget.title}</strong>?
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setRestoreTarget(null)}
                className="px-5 py-2 rounded-xl border border-[#1d1d1f]/10 text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {restoring && <Loader2 className="w-4 h-4 animate-spin" />}
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2BAgreementsPage;
