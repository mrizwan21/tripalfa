import { useState } from 'react';
import { Bell, X, Loader2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, useUnreadNotificationCount } from '@/hooks/useNotifications';

interface NotificationBellProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export const NotificationBell = ({ size = 'md', showBadge = true }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useUnreadNotificationCount();
  const { notifications, isLoading, error, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications(10);

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
        return '📝';
      case 'price_alert':
        return '💰';
      case 'booking_reminder':
        return '🛫';
      case 'approval_pending':
        return '⏳';
      default:
        return '📬';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={sizeClasses[size]} />
          {showBadge && unreadCount > 0 && (
            <Badge className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
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

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

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
          <ScrollArea className="h-96">
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
                            {new Date(notification.createdAt).toRelativeTime?.() ||
                              new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.readAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 h-auto"
                          title="Mark as read"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
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
          </ScrollArea>
        )}

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
      </PopoverContent>
    </Popover>
  );
};
