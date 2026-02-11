import React, { useEffect, useState, useRef, useMemo } from 'react';
import { listNotifications, markNotificationRead } from '../lib/api';
import { format } from 'date-fns';
import {
  Bell,
  CheckCircle2,
  Clock,
  Trash2,
  Inbox,
  MoreVertical,
  ChevronRight,
  Info,
  Search,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { NotificationDetailsPopup } from '../components/NotificationDetailsPopup';
import { Toaster } from '../components/ui/Toast';
import type { NotificationItem, NotificationType, NotificationStatus } from '../lib/notification-types';
import { mapApiNotificationToItem } from '../lib/notification-types';

const POLLING_INTERVAL = 30000; // Poll every 30 seconds

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastTotalNotificationCountRef = useRef(0);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string; notification?: NotificationItem }>>([]);

  // Filtering and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'ALL'>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications();

      // Map API response to UI NotificationItem format
      const mappedNotifications = Array.isArray(res)
        ? res.map(mapApiNotificationToItem)
        : [];

      // Check for new notifications by comparing total count
      const currentTotalCount = mappedNotifications.length;
      const previousTotalCount = lastTotalNotificationCountRef.current;

      setItems(mappedNotifications);
      lastTotalNotificationCountRef.current = currentTotalCount;

      // Show toast if new notifications arrived
      if (previousTotalCount > 0 && currentTotalCount > previousTotalCount) {
        const newNotifications = mappedNotifications.slice(previousTotalCount);
        newNotifications.forEach(notification => {
          const toastType = notification.type === 'SUCCESS' ? 'success' :
                           notification.type === 'ERROR' ? 'error' :
                           notification.type === 'WARNING' ? 'warning' : 'info';
          setToasts(prev => [...prev, {
            id: `toast-${notification.id}-${Date.now()}`,
            type: toastType,
            title: notification.title,
            message: notification.message,
            onClick: () => handleToastClick(notification),
            notification
          }]);
        });
      }
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => { 
    load(); 
  }, []);

  // Setup polling for real-time updates
  useEffect(() => {
    // Start polling
    pollingIntervalRef.current = setInterval(() => {
      load();
    }, POLLING_INTERVAL);

    // Handle page visibility (pause polling when tab is inactive)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      } else {
        // Resume polling
        load();
        pollingIntervalRef.current = setInterval(() => {
          load();
        }, POLLING_INTERVAL);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  async function markRead(id: string) {
    // First update UI immediately
    const updatedItems = items.map(i => 
      i.id === id ? { ...i, read: true } : i
    );
    setItems(updatedItems);
    
    // Update total count (though it shouldn't change here)
    lastTotalNotificationCountRef.current = updatedItems.length;
    
    // Then call API to persist the change
    await markNotificationRead(id);
  }

  const handleViewDetails = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setIsPopupOpen(true);
    // Mark as read when opening details
    if (!notification.read) {
      markRead(notification.id);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedNotification(null);
  };

  const handleRemoveToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleToastClick = (notification: NotificationItem) => {
    handleViewDetails(notification);
  };

  // Filtered and paginated items
  const filteredAndPaginatedItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.passengerName && item.passengerName.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  }, [items, searchQuery, typeFilter, statusFilter, currentPage, pageSize]);

  // Total filtered count for pagination
  const totalFilteredCount = useMemo(() => {
    let filtered = items;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.passengerName && item.passengerName.toLowerCase().includes(query))
      );
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    return filtered.length;
  }, [items, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  const unreadCount = items.filter(i => !i.read).length;

  // Mark all as read functionality
  const handleMarkAllAsRead = async () => {
    const unreadItems = items.filter(item => !item.read);
    if (unreadItems.length === 0) return;

    // Update UI immediately
    const updatedItems = items.map(item => ({ ...item, read: true }));
    setItems(updatedItems);
    lastTotalNotificationCountRef.current = updatedItems.length;

    // Call API for each unread notification
    await Promise.all(unreadItems.map(item => markNotificationRead(item.id)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Personalized alerts about your trips and account.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-2xl font-bold border-slate-200"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      {!loading && items.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search notifications by title, description, or passenger name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'ALL')}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="SUCCESS">Success</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="SSR">SSR</option>
                <option value="ITINERARY_CHANGE">Itinerary Change</option>
                <option value="AMENDMENT">Amendment</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as NotificationStatus | 'ALL')}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="REJECTED">Rejected</option>
                <option value="INFO">Info</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="CONFIRMATION">Confirmation</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Show:</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-slate-600">
            Showing {filteredAndPaginatedItems.length} of {totalFilteredCount} notifications
            {searchQuery && ` for "${searchQuery}"`}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg shadow-primary/20" />
          <p className="mt-4 font-bold text-slate-400 animate-pulse">Fetching your alerts...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-red-200 shadow-sm text-center px-6">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Failed to load notifications</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">{error}</p>
          <Button
            onClick={load}
            className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl"
          >
            Try Again
          </Button>
        </div>
      ) : totalFilteredCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center px-6">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Inbox size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {items.length === 0 ? 'All caught up!' : 'No notifications match your filters'}
          </h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">
            {items.length === 0
              ? "You don't have any notifications at the moment. We'll alert you when something happens."
              : "Try adjusting your search or filter criteria to see more notifications."
            }
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4" role="list">
            {filteredAndPaginatedItems.map((n) => (
            <div
              key={n.id}
              role="listitem"
              className={cn(
                "group relative bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden",
                n.read
                  ? "border-slate-100 opacity-75"
                  : "border-primary/20 shadow-xl shadow-primary/5 ring-1 ring-primary/10"
              )}
            >
              {!n.read && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              )}

              <div className="p-6 md:p-8 flex items-start gap-6">
                <div className={cn(
                  "h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  n.type === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" :
                    n.type === 'INFO' ? "bg-blue-50 text-blue-600" :
                    n.type === 'SSR' ? "bg-blue-50 text-blue-600" :
                    n.type === 'ITINERARY_CHANGE' ? "bg-orange-50 text-orange-600" :
                    n.type === 'AMENDMENT' ? "bg-purple-50 text-purple-600" :
                    n.type === 'SYSTEM' ? "bg-gray-50 text-gray-600" :
                      "bg-slate-50 text-slate-600"
                )}>
                  {n.type === 'SUCCESS' ? <CheckCircle2 size={28} /> :
                    n.type === 'INFO' ? <Info size={28} /> :
                    n.type === 'SSR' ? <Info size={28} /> :
                    n.type === 'ITINERARY_CHANGE' ? <AlertCircle size={28} /> :
                    n.type === 'AMENDMENT' ? <Clock size={28} /> :
                    n.type === 'SYSTEM' ? <Bell size={28} /> :
                      <Bell size={28} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={cn(
                      "text-lg font-black tracking-tight",
                      n.read ? "text-slate-700" : "text-slate-900"
                    )}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap pt-1">
                      {format(new Date(n.when), 'MMM d, h:mm a')}
                    </span>
                  </div>

                  <p className={cn(
                    "mt-2 text-base leading-relaxed font-medium",
                    n.read ? "text-slate-500" : "text-slate-600"
                  )}>
                    {n.message}
                  </p>

                  {/* Status Badge */}
                  {n.status && (
                    <div className="mt-3">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        n.status === 'CONFIRMED' ? "bg-green-100 text-green-800" :
                        n.status === 'CONFIRMATION' ? "bg-green-100 text-green-800" :
                        n.status === 'PENDING' ? "bg-yellow-100 text-yellow-800" :
                        n.status === 'REJECTED' ? "bg-red-100 text-red-800" :
                        n.status === 'CANCELLED' ? "bg-gray-100 text-gray-800" :
                        "bg-blue-100 text-blue-800"
                      )}>
                        {n.status}
                      </span>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="text-xs font-black text-primary hover:text-primary/80 transition-colors"
                        >
                          MARK AS READ
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(n)}
                        className="text-xs font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                      >
                        View Details
                      </button>
                    </div>

                    <button className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2"
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="px-3 py-2 min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2"
              >
                Next
                <ChevronRightIcon size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2"
              >
                Last
              </Button>
            </div>
          </div>
        )}

        {/* Quick Tips or Perks Section */}
        {!loading && items.length > 0 && (
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors" />
            <h3 className="text-xl font-black mb-4 relative z-10">Notification Preferences</h3>
            <p className="text-slate-400 font-medium mb-8 relative z-10 max-w-md leading-relaxed">
              Want to receive these alerts via SMS or Email? You can customize your preferences in account settings.
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-6 rounded-2xl relative z-10 shadow-xl shadow-primary/20 active:scale-95">
              Update Settings
            </Button>
          </div>
        )}

        {/* Notification Details Popup */}
        {selectedNotification && (
          <NotificationDetailsPopup
            isOpen={isPopupOpen}
            onClose={handleClosePopup}
            notification={selectedNotification}
          />
        )}

        {/* Toaster */}
        <Toaster toasts={toasts} onRemove={handleRemoveToast} />
      </>
    );
  }
}
