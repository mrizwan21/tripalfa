import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminBookingCards,
  getAdminBookingCard,
  getBookingStatistics,
  deleteAdminBookingCard,
  AdminBookingCard,
  BookingStatistics,
} from '../api/adminBookingCardApi';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/ui/StatusBadge';
import PageHeader from '../components/layout/PageHeader';
import {
  Plane,
  Bed,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  BarChart3,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@tripalfa/ui-components';

type FilterType = 'all' | 'flight' | 'hotel';
type StatusFilter = 'all' | 'On hold' | 'In process' | 'Ticketed' | 'Issued' | 'Canceled' | 'Refunded';

export default function AdminBookingCards() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<AdminBookingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  
  // Filters
  const [productFilter, setProductFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Statistics
  const [stats, setStats] = useState<BookingStatistics | null>(null);
  const [showStats, setShowStats] = useState(false);
  
  // Selected booking for detail view
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingCard | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminBookingCards({ page, limit });
      if (response.success && response.data) {
        let filteredBookings = response.data.bookings;
        
        // Apply client-side filters
        if (productFilter !== 'all') {
          filteredBookings = filteredBookings.filter(b => b.product === productFilter);
        }
        if (statusFilter !== 'all') {
          filteredBookings = filteredBookings.filter(b => b.status === statusFilter);
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredBookings = filteredBookings.filter(
            b =>
              b.id.toLowerCase().includes(query) ||
              b.reference?.toLowerCase().includes(query) ||
              b.user?.email?.toLowerCase().includes(query) ||
              b.user?.name?.toLowerCase().includes(query)
          );
        }
        
        setBookings(filteredBookings);
        setTotal(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await getBookingStatistics();
      if (response.success) {
        setStats(response);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [page, limit]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      await deleteAdminBookingCard(id);
      setBookings(bookings.filter(b => b.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete booking:', err);
      alert('Failed to delete booking');
    }
  };

  // Handle view detail
  const handleViewDetail = async (id: string) => {
    try {
      const response = await getAdminBookingCard(id);
      if (response.success && response.data) {
        setSelectedBooking(response.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch booking detail:', err);
    }
  };

  // Navigate to booking card page
  const handleNavigateToBooking = (booking: AdminBookingCard) => {
    if (booking.product === 'hotel') {
      navigate(`/hotel-booking-card/${booking.id}`);
    } else {
      navigate(`/booking-card/${booking.id}`);
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPage(1);
    fetchBookings();
  };

  // Clear filters
  const handleClearFilters = () => {
    setProductFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setPage(1);
    fetchBookings();
  };

  return (
    <div className="p-6 container mx-auto">
      <PageHeader
        title="Admin Booking Cards"
        subtitle="Manage and monitor all booking cards"
        actions={
          <>
            <Button variant="outline" onClick={() => setShowStats(!showStats)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </Button>
            <Button variant="outline" onClick={fetchBookings}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      {/* Statistics Panel */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Total Bookings</div>
                <div className="text-2xl font-bold">{stats.data.totalBookings}</div>
              </div>
              <Calendar className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Total Revenue</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.data.totalRevenue || 0)}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-xs text-slate-500 mb-2">Status Distribution</div>
            <div className="space-y-1">
              {stats.data.statusDistribution.slice(0, 3).map(s => (
                <div key={s.status} className="flex justify-between text-xs">
                  <span>{s.status}</span>
                  <span className="font-medium">{s._count}</span>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-xs text-slate-500 mb-2">Type Distribution</div>
            <div className="space-y-1">
              {stats.data.typeDistribution.map(t => (
                <div key={t.serviceType} className="flex justify-between text-xs">
                  <span className="capitalize">{t.serviceType || 'Unknown'}</span>
                  <span className="font-medium">{t._count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, reference, or user..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value as FilterType)}
              className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Products</option>
              <option value="flight">Flights</option>
              <option value="hotel">Hotels</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="On hold">On Hold</option>
              <option value="In process">In Process</option>
              <option value="Ticketed">Ticketed</option>
              <option value="Issued">Issued</option>
              <option value="Canceled">Canceled</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear
          </Button>
          
          <div className="ml-auto text-sm text-slate-500">
            {total} booking{total !== 1 ? 's' : ''} found
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={fetchBookings}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading bookings...</p>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      {!loading && bookings.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map(booking => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => handleNavigateToBooking(booking)}
                  >
                    <td className="p-4">
                      <div className="font-medium text-sm">{booking.reference || booking.bookingId || booking.id.substring(0, 8)}</div>
                      <div className="text-xs text-slate-500">{booking.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{booking.user?.name || 'Guest User'}</div>
                      <div className="text-xs text-slate-500">{booking.user?.email || '-'}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {booking.product === 'flight' ? (
                          <Plane className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Bed className="w-4 h-4 text-purple-500" />
                        )}
                        <span className="text-sm capitalize">{booking.product}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge
                        status={booking.status}
                        type={booking.status === 'Issued' || booking.status === 'Ticketed' ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="p-4">
                      <StatusBadge
                        status={booking.paymentStatus || 'Unknown'}
                        type={booking.paymentStatus === 'Paid' ? 'success' : booking.paymentStatus === 'Pending' ? 'warning' : 'neutral'}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-semibold">
                        {booking.total?.currency} {booking.total?.amount?.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM yyyy') : '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {booking.createdAt ? format(new Date(booking.createdAt), 'HH:mm') : ''}
                      </div>
                    </td>
                    <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(booking.id)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(booking.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && bookings.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No bookings found</h3>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || productFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Bookings will appear here once created'}
              </p>
            </div>
            {(searchQuery || productFilter !== 'all' || statusFilter !== 'all') && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Booking Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Booking ID</div>
                    <div className="font-medium">{selectedBooking.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Reference</div>
                    <div className="font-medium">{selectedBooking.reference || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Product</div>
                    <div className="font-medium capitalize">{selectedBooking.product}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Status</div>
                    <StatusBadge status={selectedBooking.status} type="neutral" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Payment Status</div>
                    <StatusBadge
                      status={selectedBooking.paymentStatus || 'Unknown'}
                      type={selectedBooking.paymentStatus === 'Paid' ? 'success' : 'warning'}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="font-semibold">
                      {selectedBooking.total?.currency} {selectedBooking.total?.amount?.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Created</div>
                    <div className="font-medium">
                      {selectedBooking.createdAt
                        ? format(new Date(selectedBooking.createdAt), 'dd MMM yyyy, HH:mm')
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">User</div>
                    <div className="font-medium">
                      {selectedBooking.user?.name || selectedBooking.user?.email || 'Guest'}
                    </div>
                  </div>
                </div>
                
                {selectedBooking.details && (
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Details</div>
                    <pre className="bg-slate-50 p-3 rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(selectedBooking.details, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    Close
                  </Button>
                  <Button onClick={() => handleNavigateToBooking(selectedBooking)}>
                    View Full Card
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
