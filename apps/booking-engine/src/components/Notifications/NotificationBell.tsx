import { useState, useRef, useEffect } from 'react';
import { Bell, Loader2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, useUnreadNotificationCount } from '@/hooks/useNotifications';

// Simple Badge component inline
const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

interface NotificationBellProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

// Helper function for relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export const NotificationBell = ({ size = 'md', showBadge = true }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useUnreadNotificationCount();
  const { notifications, isLoading, error, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications(10);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-300 bg-red-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'offline_request_update':
        return 'memo';
      case 'price_alert':
        return 'money';
      case 'booking_reminder':
        return 'airplane';
      case 'approval_pending':
        return 'hourglass';
      default:
        return 'envelope';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className={sizeClasses[size]} />
        {showBadge && unreadCount > 0 && (
          <Badge className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center p-0 text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs text-blue-600"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-0 divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${getNotificationColor(
                      notification.priority
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 line-clamp-1">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>

                            {notification.data?.bookingId && (
                              <p className="text-xs text-gray-500 mt-1">
                                Booking: {notification.data.bookingId}
                              </p>
                            )}

                            <p className="text-xs text-gray-400 mt-1">
                              {getRelativeTime(new Date(notification.createdAt))}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.readAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 h-auto"
                            title="Mark as read"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 h-auto"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {notification.actionUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full text-xs"
                        onClick={() => {
                          window.location.href = notification.actionUrl!;
                          setOpen(false);
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                // Navigate to notifications page if it exists
              }}
              className="text-blue-600 text-xs hover:text-blue-700"
            >
              View All Notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
