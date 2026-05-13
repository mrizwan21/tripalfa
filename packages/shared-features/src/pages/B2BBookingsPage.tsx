import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  Search,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Ban,
  RefreshCw,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { apiManager } from '../services/apiManager';
import { cn } from '../lib/utils';

interface B2BBooking {
  id: string;
  reference: string;
  customerName: string;
  serviceType: string;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'refunded' | 'on_hold' | 'archived';
  createdAt: string;
}

type BookingStatus = B2BBooking['status'];

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'on_hold', label: 'On Hold' },
];

const PAGE_SIZE = 10;

const B2BBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<B2BBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const [statusModal, setStatusModal] = useState<{ id: string; newStatus: BookingStatus } | null>(null);
  const [updating, setUpdating] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<B2BBooking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState<B2BBooking | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [archivedFilter, setArchivedFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiManager.getB2BBookings();
      setBookings(data?.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = useMemo(() => {
    let list = bookings;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.reference.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.serviceType.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter);
    }
    if (archivedFilter === 'ACTIVE') {
      list = list.filter((b) => b.status !== 'archived');
    } else if (archivedFilter === 'ARCHIVED') {
      list = list.filter((b) => b.status === 'archived');
    }
    return list;
  }, [bookings, search, statusFilter, archivedFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const openStatusChange = (id: string, newStatus: BookingStatus) => {
    setStatusModal({ id, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!statusModal) return;
    setUpdating(true);
    try {
      await apiManager.updateB2BBookingStatus(statusModal.id, statusModal.newStatus);
      setStatusModal(null);
      await fetchBookings();
    } catch (err: any) {
      setError(err?.message || 'Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    try {
      const data = await apiManager.getBookingById(id);
      // Map the generic Booking to B2BBooking for display
      if (data) {
        const b2bData: B2BBooking = {
          id: data.id,
          reference: data.referenceNo || '',
          customerName: data.passengerName || '',
          serviceType: data.service || 'Flight',
          totalAmount: data.amount || 0,
          status: data.status as BookingStatus,
          createdAt: data.bookingDate || new Date().toISOString(),
        };
        setDetailItem(b2bData);
      } else {
        setDetailItem(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load booking details');
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await apiManager.updateB2BBookingStatus(restoreTarget.id, 'pending');
      setRestoreTarget(null);
      await fetchBookings();
    } catch (err: any) {
      setError(err?.message || 'Failed to restore booking');
    } finally {
      setRestoring(false);
    }
  };

  const statusBadge = (status: BookingStatus) => {
    const map: Record<string, string> = {
      confirmed: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-blue-50 text-blue-700 border-blue-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      refunded: 'bg-amber-50 text-amber-700 border-amber-200',
      on_hold: 'bg-gray-100 text-gray-600 border-gray-200',
      archived: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border', map[status] || 'bg-gray-100 text-gray-600 border-gray-200')}>
        {status === 'confirmed' && <CheckCircle2 className="w-3.5 h-3.5" />}
        {status === 'pending' && <Clock className="w-3.5 h-3.5" />}
        {status === 'cancelled' && <Ban className="w-3.5 h-3.5" />}
        {status === 'refunded' && <RefreshCw className="w-3.5 h-3.5" />}
        {status === 'archived' && <RotateCcw className="w-3.5 h-3.5" />}
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CalendarCheck className="w-8 h-8 text-[#0071e3]" />
            <h1 className="text-3xl font-semibold text-[#1d1d1f]">B2B Bookings</h1>
          </div>
          <p className="text-[#1d1d1f]/60">View and manage B2B booking records.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1d1d1f]/40" />
            <input
              type="text"
              placeholder="Search by reference, customer, or service..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-[#1d1d1f]/40" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as BookingStatus | 'all'); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-[#1d1d1f]/10 bg-white text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          {/* Archived Filter Tabs */}
          <div className="flex gap-2">
            {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setArchivedFilter(tab); setPage(1); }}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border',
                  archivedFilter === tab
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
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Reference</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Customer</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Service</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Amount</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Status</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70">Date</th>
                  <th className="px-6 py-3 font-medium text-[#1d1d1f]/70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#1d1d1f]/50">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading bookings...</span>
                      </div>
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#1d1d1f]/40">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((b) => (
                    <tr key={b.id} className="border-t border-[#1d1d1f]/5 hover:bg-[#f5f5f7]/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1d1d1f]">{b.reference}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70">{b.customerName}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70 capitalize">{b.serviceType}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70">${b.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4">{statusBadge(b.status)}</td>
                      <td className="px-6 py-4 text-[#1d1d1f]/70">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {b.status === 'archived' ? (
                            <button
                              onClick={() => setRestoreTarget(b)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium border border-green-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openDetail(b.id)}
                                className="p-2 rounded-lg hover:bg-[#0071e3]/10 text-[#0071e3] transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <select
                                value={b.status}
                                onChange={(e) => openStatusChange(b.id, e.target.value as BookingStatus)}
                                className="text-xs rounded-lg border border-[#1d1d1f]/10 bg-white px-2 py-1.5 text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                                title="Update Status"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
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

      {/* Status Update Confirmation */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">Update Status</h3>
            <p className="text-sm text-[#1d1d1f]/60 mb-6">
              Change booking status to <strong className="capitalize">{statusModal.newStatus.replace('_', ' ')}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 rounded-xl border border-[#1d1d1f]/10 text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={updating}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0071e3] text-white font-medium hover:bg-[#0071e3]/90 disabled:opacity-60 transition-colors"
              >
                {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
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
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Restore Booking</h3>
            <p className="mt-1 text-sm text-[#1d1d1f]/60">
              Are you sure you want to restore booking <strong>{restoreTarget.reference}</strong>?
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

      {/* Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1d1d1f]">Booking Details</h3>
              <button onClick={() => { setDetailId(null); setDetailItem(null); }} className="p-1 rounded-lg hover:bg-[#f5f5f7]">
                <X className="w-5 h-5 text-[#1d1d1f]/60" />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-[#1d1d1f]/50">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : !detailItem ? (
              <p className="text-sm text-[#1d1d1f]/60">Unable to load details.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#1d1d1f]/5 pb-2">
                  <span className="text-[#1d1d1f]/60">Reference</span>
                  <span className="font-medium text-[#1d1d1f]">{detailItem.reference}</span>
                </div>
                <div className="flex justify-between border-b border-[#1d1d1f]/5 pb-2">
                  <span className="text-[#1d1d1f]/60">Customer</span>
                  <span className="font-medium text-[#1d1d1f]">{detailItem.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-[#1d1d1f]/5 pb-2">
                  <span className="text-[#1d1d1f]/60">Service Type</span>
                  <span className="font-medium text-[#1d1d1f] capitalize">{detailItem.serviceType}</span>
                </div>
                <div className="flex justify-between border-b border-[#1d1d1f]/5 pb-2">
                  <span className="text-[#1d1d1f]/60">Total Amount</span>
                  <span className="font-medium text-[#1d1d1f]">${detailItem.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-[#1d1d1f]/5 pb-2">
                  <span className="text-[#1d1d1f]/60">Status</span>
                  <span>{statusBadge(detailItem.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1d1d1f]/60">Created</span>
                  <span className="font-medium text-[#1d1d1f]">{detailItem.createdAt ? new Date(detailItem.createdAt).toLocaleString() : '-'}</span>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setDetailId(null); setDetailItem(null); }}
                className="px-5 py-2 rounded-xl bg-[#0071e3] text-white font-medium hover:bg-[#0071e3]/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2BBookingsPage;
