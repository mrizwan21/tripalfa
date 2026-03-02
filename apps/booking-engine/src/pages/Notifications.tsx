import React, { useEffect, useState, useRef, useMemo } from "react";
import { listNotifications, markNotificationRead } from "../lib/api";
import { format } from "date-fns";
import {
  Bell,
  CheckCircle2,
  Clock,
  Trash2,
  Inbox,
  ChevronRight,
  Info,
  Search,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "@tripalfa/ui-components";
import { NotificationDetailsPopup } from "../components/NotificationDetailsPopup";
import { Toaster } from "../components/ui/toast";
import {
  mapApiNotificationToItem,
  type NotificationItem,
  type NotificationType,
  type NotificationStatus,
} from "../lib/notification-types";

const POLLING_INTERVAL = 30000;

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout>(undefined);
  const lastTotalNotificationCountRef = useRef(0);
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "info" | "warning";
      title: string;
      message?: string;
      notification?: NotificationItem;
    }>
  >([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "ALL">(
    "ALL",
  );
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
        newNotifications.forEach((notification) => {
          const toastType =
            notification.type === "SUCCESS"
              ? "success"
              : notification.type === "ERROR"
                ? "error"
                : notification.type === "WARNING"
                  ? "warning"
                  : "info";
          setToasts((prev) => [
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
      setError("Failed to load notifications. Please try again.");
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
        if (pollingIntervalRef.current)
          clearInterval(pollingIntervalRef.current);
      } else {
        load();
        pollingIntervalRef.current = setInterval(() => {
          load();
        }, POLLING_INTERVAL);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function markRead(id: string) {
    const updatedItems = items.map((i) =>
      i.id === id ? { ...i, read: true } : i,
    );
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
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const filteredAndPaginatedItems = useMemo(() => {
    let filtered = items;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.passengerName &&
            item.passengerName.toLowerCase().includes(query)),
      );
    }
    if (typeFilter !== "ALL")
      filtered = filtered.filter((item) => item.type === typeFilter);
    if (statusFilter !== "ALL")
      filtered = filtered.filter((item) => item.status === statusFilter);
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [items, searchQuery, typeFilter, statusFilter, currentPage, pageSize]);

  const totalFilteredCount = useMemo(() => {
    let filtered = items;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.passengerName &&
            item.passengerName.toLowerCase().includes(query)),
      );
    }
    if (typeFilter !== "ALL")
      filtered = filtered.filter((item) => item.type === typeFilter);
    if (statusFilter !== "ALL")
      filtered = filtered.filter((item) => item.status === statusFilter);
    return filtered.length;
  }, [items, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  const unreadCount = items.filter((i) => !i.read).length;

  const handleMarkAllAsRead = async () => {
    const unreadItems = items.filter((item) => !item.read);
    if (unreadItems.length === 0) return;
    const updatedItems = items.map((item) => ({ ...item, read: true }));
    setItems(updatedItems);
    lastTotalNotificationCountRef.current = updatedItems.length;
    await Promise.all(unreadItems.map((item) => markNotificationRead(item.id)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-background text-xs font-medium gap-4">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personalized alerts about your trips and account.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      </div>

      {!loading && items.length > 0 && (
        <div className="bg-card rounded-lg border border-border shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as NotificationType | "ALL")
              }
              className="px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="SUCCESS">Success</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as NotificationStatus | "ALL")
              }
              className="px-3 py-2 border border-border rounded-lg text-sm"
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium">Error loading notifications</h3>
          <Button onClick={load} className="mt-3">
            Try Again
          </Button>
        </div>
      ) : totalFilteredCount === 0 ? (
        <div className="text-center py-16">
          <Inbox size={32} className="text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium">No notifications found</h3>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filteredAndPaginatedItems.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group relative bg-card rounded-lg border transition-all",
                  n.read
                    ? "border-border opacity-75"
                    : "border-border shadow-sm",
                )}
              >
                <div className="p-4 flex items-start gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      n.type === "SUCCESS"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {n.type === "SUCCESS" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Bell size={18} />
                    )}
                  </div>
                  <div className="flex-1 gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <h4
                        className={cn(
                          "font-medium",
                          n.read ? "text-muted-foreground" : "text-foreground",
                        )}
                      >
                        {n.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(n.when), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 text-sm",
                        n.read ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      {!n.read && (
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => markRead(n.id)}
                          className="text-xs font-medium text-purple-600"
                        >
                          Mark as read
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => handleViewDetails(n)}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 gap-2">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
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
