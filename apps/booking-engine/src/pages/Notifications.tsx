import React, { useEffect, useState, useRef } from 'react';
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
  Info
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { NotificationDetailsPopup } from '../components/NotificationDetailsPopup';
import type { NotificationItem } from '../lib/notification-types';
import { mapApiNotificationToItem } from '../lib/notification-types';

const POLLING_INTERVAL = 30000; // Poll every 30 seconds

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastNotificationCountRef = useRef(0);

  async function load() {
    setLoading(true);
    try {
      const res = await listNotifications();
      
      // Map API response to UI NotificationItem format
      const mappedNotifications = Array.isArray(res) 
        ? res.map(mapApiNotificationToItem) 
        : [];
      
      // Check for new notifications
      const newUnreadCount = mappedNotifications.filter(n => !n.read).length;
      const previousUnreadCount = lastNotificationCountRef.current;
      
      setItems(mappedNotifications);
      lastNotificationCountRef.current = newUnreadCount;

      // Show toast if new notifications arrived
      if (previousUnreadCount > 0 && newUnreadCount > previousUnreadCount) {
        // Toast logic would go here
        console.log('New notification received');
      }
    } catch {
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
    
    // Update unread count
    const newUnreadCount = updatedItems.filter(n => !n.read).length;
    lastNotificationCountRef.current = newUnreadCount;
    
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

  const unreadCount = items.filter(i => !i.read).length;

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
          <Button variant="outline" className="rounded-2xl font-bold border-slate-200">
            Mark all as read
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg shadow-primary/20" />
          <p className="mt-4 font-bold text-slate-400 animate-pulse">Fetching your alerts...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center px-6">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Inbox size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900">All caught up!</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">You don't have any notifications at the moment. We'll alert you when something happens.</p>
        </div>
      ) : (
        <div className="space-y-4" role="list">
          {items.map((n) => (
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
                      "bg-slate-50 text-slate-600"
                )}>
                  {n.type === 'SUCCESS' ? <CheckCircle2 size={28} /> :
                    n.type === 'INFO' ? <Info size={28} /> :
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

      {/* Notification Details Popup */}
      {selectedNotification && (
        <NotificationDetailsPopup
          isOpen={isPopupOpen}
          onClose={handleClosePopup}
          notification={selectedNotification}
        />
      )}
          </Button>
        </div>
      )}
    </div>
  );
}