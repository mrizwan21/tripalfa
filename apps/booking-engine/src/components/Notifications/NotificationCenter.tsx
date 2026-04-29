import { useState, useMemo } from 'react';
import { Search, Filter, Trash2, Eye, Settings, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useNotifications } from '@/hooks/useNotifications';

// Simple Badge component inline
const Badge = ({
  children,
  className = '',
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: string;
}) => {
  const variantClasses: Record<string, string> = {
    default: 'bg-muted text-foreground',
    outline: 'border border-border bg-transparent text-muted-foreground',
    secondary: 'bg-muted text-foreground',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {children}
    </span>
  );
};

export const NotificationCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [filterPriority, setFilterPriority] = useState<string | 'all'>('all');
  const { notifications, isLoading, error, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications(50);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Search filter
      if (
        searchQuery &&
        !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (filterType !== 'all' && notification.type !== filterType) {
        return false;
      }

      // Status filter
      if (filterStatus === 'read' && !notification.readAt) {
        return false;
      }
      if (filterStatus === 'unread' && notification.readAt) {
        return false;
      }

      // Priority filter
      if (filterPriority !== 'all' && notification.priority !== filterPriority) {
        return false;
      }

      return true;
    });
  }, [notifications, searchQuery, filterType, filterStatus, filterPriority]);

  const notificationTypes = [
    { value: 'offline_request_update', label: 'Offline Request Updates' },
    { value: 'price_alert', label: 'Price Alerts' },
    { value: 'booking_reminder', label: 'Booking Reminders' },
    { value: 'approval_pending', label: 'Approvals Pending' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'medium':
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-muted text-foreground border-border';
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

  const getTypeBadge = (type: string) => {
    const typeData = notificationTypes.find(t => t.value === type);
    return typeData?.label || type;
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            /* Navigate to preferences */
          }}
        >
          <Settings className="w-4 h-4 mr-2" />
          Preferences
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-neutral-200 bg-neutral-50">
          <CardContent className="pt-6">
            <p className="text-sm text-neutral-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {notificationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
              <Select
                value={filterStatus}
                onValueChange={value => setFilterStatus(value as 'all' | 'read' | 'unread')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Priority
              </label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <div className="flex items-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => markAllAsRead()}
                  className="w-full text-sm"
                >
                  Mark All Read
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
            <Filter className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No notifications found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <Card
              key={notification.id}
              className={`border-l-4 transition-all ${
                !notification.readAt
                  ? 'border-l-blue-500 bg-blue-50 shadow-sm'
                  : 'border-l-border bg-background'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 gap-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>

                      <div className="flex-1 min-w-0 gap-4">
                        <h3 className="font-semibold text-foreground line-clamp-1 text-xl font-semibold tracking-tight">
                          {notification.title}
                        </h3>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getTypeBadge(notification.type)}
                          </Badge>

                          <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            {notification.priority?.charAt(0).toUpperCase() +
                              notification.priority?.slice(1) || 'Normal'}
                          </Badge>

                          {!notification.readAt && (
                            <Badge className="text-xs bg-blue-600 text-white">Unread</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {notification.message}
                    </p>

                    {notification.data?.bookingId && (
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="font-medium">Booking ID:</span>{' '}
                        {notification.data.bookingId}
                      </p>
                    )}

                    {notification.data?.requestId && (
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="font-medium">Request ID:</span>{' '}
                        {notification.data.requestId}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!notification.readAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}

                    {notification.actionUrl && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          window.location.href = notification.actionUrl!;
                        }}
                        className="w-full"
                      >
                        View
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete"
                      className="w-full text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredNotifications.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </p>
      )}
    </div>
  );
};
