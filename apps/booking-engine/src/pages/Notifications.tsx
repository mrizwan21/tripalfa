import React, { useEffect, useState, useRef, useMemo } from 'react';
import { listNotifications, markNotificationRead } from '../lib/api';
import { format } from 'date-fns';
import {
  Bell,
  Check,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  AlertCircle,
  Search,
} from 'lucide-react';
import { cn } from '@tripalfa/ui-components';
import { NotificationDetailsPopup } from '../components/NotificationDetailsPopup';
import { Toaster } from '../components/ui/toast';
import {
  mapApiNotificationToItem,
  type NotificationItem,
  type NotificationType,
  type NotificationStatus,
} from '../lib/notification-types';

const POLLING_INTERVAL = 30000;

function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastTotalNotificationCountRef = useRef(0);
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      type: 'success' | 'error' | 'info' | 'warning';
      title: string;
      message?: string;
      notification?: NotificationItem;
    }>
  >([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications();
      const mappedNotifications = Array.isArray(res)
        ? (res.map(mapApiNotificationToItem) as NotificationItem[])
        : [];
      const currentTotalCount = mappedNotifications.length;
      const previousTotalCount = lastTotalNotificationCountRef.current;

      setItems(mappedNotifications);
      lastTotalNotificationCountRef.current = currentTotalCount;

      if (previousTotalCount > 0 && currentTotalCount > previousTotalCount) {
        const newNotifications = mappedNotifications.slice(previousTotalCount);
        newNotifications.forEach(notification => {
          const toastType =
            notification.type === 'SUCCESS'
              ? 'success'
              : notification.type === 'ERROR'
                ? 'error'
                : notification.type === 'WARNING'
                  ? 'warning'
                  : 'info';
          setToasts(prev => [
            ...prev,
            {
              id: `toast-${notification.id}-${Date.now()}`,
              type: toastType,
              title: notification.title,
              message: notification.message,
              notification,
            },
          ]);
        });
      }
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      load();
    }, POLLING_INTERVAL);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      } else {
        load();
        pollingIntervalRef.current = setInterval(() => {
          load();
        }, POLLING_INTERVAL);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  async function markRead(id: string) {
    const updatedItems = items.map(i => (i.id === id ? { ...i, read: true } : i));
    setItems(updatedItems);
    lastTotalNotificationCountRef.current = updatedItems.length;
    await markNotificationRead(id);
  }

  const handleViewDetails = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setIsPopupOpen(true);
    if (!notification.read) markRead(notification.id);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedNotification(null);
  };

  const handleRemoveToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const filteredAndPaginatedItems = useMemo(() => {
    let filtered = items;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.passengerName && item.passengerName.toLowerCase().includes(query))
      );
    }
    if (typeFilter !== 'ALL') filtered = filtered.filter(item => item.type === typeFilter);
    if (statusFilter !== 'ALL') filtered = filtered.filter(item => item.status === statusFilter);
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [items, searchQuery, typeFilter, statusFilter, currentPage, pageSize]);

  const totalFilteredCount = useMemo(() => {
    let filtered = items;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.passengerName && item.passengerName.toLowerCase().includes(query))
      );
    }
    if (typeFilter !== 'ALL') filtered = filtered.filter(item => item.type === typeFilter);
    if (statusFilter !== 'ALL') filtered = filtered.filter(item => item.status === statusFilter);
    return filtered.length;
  }, [items, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  const unreadCount = items.filter(i => !i.read).length;

  const handleMarkAllAsRead = async () => {
    const unreadItems = items.filter(item => !item.read);
    if (unreadItems.length === 0) return;
    const updatedItems = items.map(item => ({ ...item, read: true }));
    setItems(updatedItems);
    lastTotalNotificationCountRef.current = updatedItems.length;
    await Promise.all(unreadItems.map(item => markNotificationRead(item.id)));
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#003b95] text-white text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Personalized alerts about your trips and account.
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark all as read
        </button>
      </div>

      {!loading && items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as NotificationType | 'ALL')}
              className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10"
            >
              <option value="ALL">All Types</option>
              <option value="SUCCESS">Success</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as NotificationStatus | 'ALL')}
              className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#003b95] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <AlertCircle size={32} className="text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Error loading notifications</h3>
          <button
            onClick={load}
            className="mt-3 bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      ) : totalFilteredCount === 0 ? (
        <div className="text-center py-16">
          <Inbox size={32} className="text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No notifications found</h3>
          <p className="text-sm text-gray-500 mt-1">Check back later for new updates.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filteredAndPaginatedItems.map(n => (
              <div
                key={n.id}
                className={cn(
                  'bg-white rounded-xl border transition-all duration-300',
                  n.read
                    ? 'border-gray-100 opacity-75'
                    : 'border-gray-100 shadow-sm hover:shadow-md'
                )}
              >
                <div className="p-4 flex items-start gap-4">
                  {/* Unread indicator */}
                  <div className="mt-1.5 shrink-0">
                    {!n.read ? (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#003b95]" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h4
                        className={cn(
                          'text-sm',
                          n.read ? 'text-gray-600 font-normal' : 'text-gray-900 font-semibold'
                        )}
                      >
                        {n.title}
                      </h4>
                      <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                        {format(new Date(n.when), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'mt-1 text-sm',
                        n.read ? 'text-gray-500' : 'text-gray-700'
                      )}
                    >
                      {n.message}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="border border-gray-200 text-gray-700 rounded-lg px-4 py-1.5 font-semibold text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(n)}
                        className="border border-gray-200 text-gray-700 rounded-lg px-4 py-1.5 font-semibold text-xs hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {}}
                        className="border border-red-200 text-red-600 rounded-lg px-4 py-1.5 font-semibold text-xs hover:bg-red-50 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 gap-2">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}

          {selectedNotification && (
            <NotificationDetailsPopup
              isOpen={isPopupOpen}
              onClose={handleClosePopup}
              notification={selectedNotification}
            />
          )}
          <Toaster toasts={toasts} onRemove={handleRemoveToast} />
        </>
      )}
    </div>
  );
}

export default Notifications;
