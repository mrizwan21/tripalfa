/**
 * In-App Notification Bell
 * Displays notification bell icon in header with dropdown for recent notifications
 * 
 * Features:
 * - Bell icon with unread count badge
 * - Dropdown showing recent 10 notifications
 * - Mark notifications as read from dropdown
 * - View all link to full notification list
 * - Click outside to close dropdown
 * - Real-time unread count updates
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { notificationsApi } from './notificationsApi';

interface Notification {
  id: string;
  userId: string;
  type: 'email' | 'sms' | 'push' | 'system' | 'whatsapp';
  title: string;
  message: string;
  status: 'sent' | 'pending' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  channels: string[];
  deliveryStatus: Record<string, string>;
}

interface InAppBellProps {
  userId: string;
  pollInterval?: number; // milliseconds
  onNotificationClick?: (notificationId: string) => void;
}

const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    userId: 'user-001',
    type: 'email',
    title: 'Booking Confirmation',
    message: 'Your booking has been confirmed',
    status: 'sent',
    priority: 'high',
    createdAt: '2024-02-08T10:00:00Z',
    readAt: '2024-02-08T10:15:00Z',
    channels: ['email', 'system'],
    deliveryStatus: { email: 'sent', system: 'sent' }
  },
  {
    id: 'notif-002',
    userId: 'user-002',
    type: 'sms',
    title: 'Flight Alert',
    message: 'Your flight has been delayed',
    status: 'sent',
    priority: 'urgent',
    createdAt: '2024-02-08T09:30:00Z',
    channels: ['sms', 'push'],
    deliveryStatus: { sms: 'sent', push: 'sent' }
  },
  {
    id: 'notif-003',
    userId: 'user-003',
    type: 'push',
    title: 'New Promotion',
    message: 'Check out our latest deals',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-02-08T08:00:00Z',
    channels: ['push'],
    deliveryStatus: { push: 'pending' }
  }
];

export default function InAppBell({ userId, pollInterval = 30000, onNotificationClick }: InAppBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount(userId);
      setUnreadCount(response.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [userId]);

  // Fetch recent notifications
  const fetchRecentNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsApi.getRecentNotifications(10);
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error('Failed to fetch recent notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      onNotificationClick?.(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [onNotificationClick]);

  // Toggle dropdown open/close
  const handleBellClick = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Notification item click handler
  const handleNotificationClick = useCallback((id: string) => {
    handleMarkAsRead(id);
  }, [handleMarkAsRead]);

  // Fetch data on mount
  useEffect(() => {
    fetchUnreadCount();
    fetchRecentNotifications();
  }, [fetchUnreadCount, fetchRecentNotifications]);

  // Update recent notifications when notifications change
  useEffect(() => {
    setRecentNotifications(notifications.slice(0, 10));
  }, [notifications]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Polling for real-time updates
  useEffect(() => {
    const pollInterval_ms = pollInterval || 30000;
    const timer = setInterval(() => {
      fetchUnreadCount();
      fetchRecentNotifications();
    }, pollInterval_ms);

    return () => clearInterval(timer);
  }, [pollInterval, fetchUnreadCount, fetchRecentNotifications]);

  // Navigate to full notification list
  const handleViewAll = useCallback(() => {
    window.location.href = '/notifications';
  }, []);

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        data-testid="bell-icon"
        onClick={handleBellClick}
        ref={bellRef}
        className="bell-button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span data-testid="bell-icon-indicator" className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span data-testid="unread-badge" className="badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            data-testid="notification-dropdown"
            className="dropdown-panel"
            role="region"
            aria-label="Recent notifications"
          >
            <div className="dropdown-header">
              <h3>Notifications</h3>
              <button
                data-testid="close-dropdown"
                onClick={() => setIsOpen(false)}
                className="close-button"
                aria-label="Close notifications"
              >
                ✕
              </button>
            </div>

            <div data-testid="notification-list" className="notification-list">
              {loading ? (
                <div className="loading-notifications">
                  <p>Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="error-notifications">
                  <p>{error}</p>
                  <button onClick={fetchRecentNotifications} className="retry-button">
                    Retry
                  </button>
                </div>
              ) : recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    data-testid={`notification-item-${notification.id}`}
                    className={`notification-item ${notification.readAt ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNotificationClick(notification.id);
                      }
                    }}
                  >
                    <div className="notification-content">
                      <h4 data-testid={`item-title-${notification.id}`} className="notification-title">
                        {notification.title}
                      </h4>
                      <p data-testid={`item-message-${notification.id}`} className="notification-message">
                        {notification.message}
                      </p>
                      <small data-testid={`item-time-${notification.id}`} className="notification-time">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <input
                      type="checkbox"
                      data-testid={`item-read-${notification.id}`}
                      checked={!!notification.readAt}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="read-checkbox"
                      aria-label={`Mark ${notification.title} as read`}
                    />
                  </div>
                ))
              ) : (
                <div className="empty-notifications">
                  <p>No notifications</p>
                </div>
              )}
            </div>

            <div className="dropdown-footer">
              <button
                data-testid="view-all-link"
                onClick={handleViewAll}
                className="view-all-button"
              >
                View All →
              </button>
            </div>
          </div>

          {/* Click outside overlay */}
          <div
            data-testid="dropdown-overlay"
            onClick={() => setIsOpen(false)}
            className="dropdown-overlay"
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
