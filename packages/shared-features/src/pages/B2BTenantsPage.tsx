import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
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
  Archive,
  RotateCcw,
} from 'lucide-react';
import { apiManager } from '../services/apiManager';
import { cn } from '../lib/utils';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
}

type TenantFormData = Omit<Tenant, 'id' | 'createdAt'>;

const PAGE_SIZE = 10;

const B2BTenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState<Tenant | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiManager.getTenants();
      setTenants(data?.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filtered = useMemo(() => {
    let list = tenants;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          (t.email && t.email.toLowerCase().includes(q))
      );
    }
    if (statusFilter === 'ACTIVE') {
      list = list.filter((t) => t.status !== 'archived');
    } else if (statusFilter === 'ARCHIVED') {
      list = list.filter((t) => t.status === 'archived');
    }
    return list;
  }, [tenants, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', email: '', phone: '', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = async (id: string) => {
    try {
      const t = await apiManager.getB2BTenantById(id);
      setEditingId(id);
      setFormData({
        name: t.name || '',
        slug: t.slug || '',
        email: t.email || '',
        phone: t.phone || '',
        status: t.status || 'active',
      });
      setModalOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tenant details');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiManager.updateB2BTenant(editingId, formData);
      } else {
        await apiManager.createB2BTenant(formData);
      }
      setModalOpen(false);
      await fetchTenants();
    } catch (err: any) {
      setError(err?.message || 'Failed to save tenant');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (tenant: Tenant) => {
    setDeleteTarget(tenant);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiManager.deleteB2BTenant(deleteTarget.id);
      setDeleteTarget(null);
      await fetchTenants();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete tenant');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await apiManager.updateB2BTenant(restoreTarget.id, { status: 'active' });
      setRestoreTarget(null);
      await fetchTenants();
    } catch (err: any) {
      setError(err?.message || 'Failed to restore tenant');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-[#0071e3]" />
            <h1 className="text-3xl font-semibold text-[#1d1d1f]">B2B Tenants</h1>
          </div>
          <p className="text-[#1d1d1f]/60">Manage tenant organisations across the B2B portal.</p>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1d1d1f]/40" />
            <input
              type="text"
              placeholder="Search by name, slug, or email..."
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
            <Plus className="w-4 h-4" /> Add Tenant
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
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Name</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Slug</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Email</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Phone</th>
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
                        <span>Loading tenants...</span>
                      </div>
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#1d1d1f]/40">
                      No tenants found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((t) => (
                    <tr key={t.id} className="border-t border-[#1d1d1f]/5 hover:bg-[#f5f5f7]/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1d1d1f]">{t.name}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70">{t.slug}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70">{t.email || '-'}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70">{t.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            t.status === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          )}
                        >
                          {t.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {t.status === 'archived' ? (
                            <button
                              onClick={() => setRestoreTarget(t)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium border border-green-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(t.id)}
                                className="p-2 rounded-lg hover:bg-[#0071e3]/10 text-[#0071e3] transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => confirmDelete(t)}
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
                {editingId ? 'Edit Tenant' : 'Add Tenant'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[#f5f5f7]">
                <X className="w-5 h-5 text-[#1d1d1f]/60" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">Slug</label>
                <input
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData((d) => ({ ...d, slug: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">Phone</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f]/70 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((d) => ({ ...d, status: e.target.value as Tenant['status'] }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Delete Tenant</h3>
            <p className="mt-1 text-sm text-[#1d1d1f]/60">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
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
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Restore Tenant</h3>
            <p className="mt-1 text-sm text-[#1d1d1f]/60">
              Are you sure you want to restore <strong>{restoreTarget.name}</strong>?
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

export default B2BTenantsPage;
