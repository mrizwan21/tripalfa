import React, { useState } from 'react';
import { mockNotifications } from '@/__mocks__/fixtures';
import {
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  channels: string[];
  status: 'sent' | 'pending' | 'failed' | 'scheduled';
  createdAt: string;
  sentAt?: string;
  deliveryStatus?: Record<string, 'sent' | 'pending' | 'failed'>;
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleEdit = (id: string) => {
    // Navigate to edit page or open edit modal
    console.log('Edit notification:', id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const handleRetry = async (id: string) => {
    // Update status to sent with retry
    setNotifications(notifications.map(n =>
      n.id === id
        ? {
            ...n,
            status: 'sent' as const,
            deliveryStatus: n.deliveryStatus
              ? Object.keys(n.deliveryStatus).reduce(
                  (acc, key) => ({ ...acc, [key]: 'sent' as const }),
                  {} as Record<string, 'sent' | 'pending' | 'failed'>
                )
              : undefined
          }
        : n
    ));
  };

  const handleResend = async (id: string) => {
    // Resend notification
    setNotifications(notifications.map(n =>
      n.id === id
        ? {
            ...n,
            status: 'sent' as const,
            sentAt: new Date().toISOString(),
            deliveryStatus: n.deliveryStatus
              ? Object.keys(n.deliveryStatus).reduce(
                  (acc, key) => ({ ...acc, [key]: 'sent' as const }),
                  {} as Record<string, 'sent' | 'pending' | 'failed'>
                )
              : undefined
          }
        : n
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'pending':
        return <Clock size={16} className="text-blue-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} className="text-yellow-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'scheduled':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel?.toUpperCase()) {
      case 'EMAIL':
        return <Mail size={14} />;
      case 'SMS':
        return <Smartphone size={14} />;
      case 'PUSH':
        return <Bell size={14} />;
      case 'WHATSAPP':
        return <MessageSquare size={14} />;
      default:
        return <Bell size={14} />;
    }
  };

  if (notifications.length === 0) {
    return (
      <div data-testid="notification-list-container" className="w-full max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div className="text-center p-8 text-gray-500">No notifications found</div>
      </div>
    );
  }

  return (
    <div data-testid="notification-list-container" className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <table data-testid="notifications-table" className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 font-bold text-sm">Title</th>
            <th className="text-left py-3 px-4 font-bold text-sm">Status</th>
            <th className="text-left py-3 px-4 font-bold text-sm">Priority</th>
            <th className="text-left py-3 px-4 font-bold text-sm">Created</th>
            <th className="text-left py-3 px-4 font-bold text-sm">Delivery</th>
            <th className="text-left py-3 px-4 font-bold text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((notification) => {
            const isExpanded = expandedIds.includes(notification.id);

            return (
              <React.Fragment key={notification.id}>
                {/* Main Row */}
                <tr data-testid={`row-${notification.id}`} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        data-testid={`expand-${notification.id}`}
                        onClick={() => toggleExpand(notification.id)}
                        className="focus:outline-none p-1"
                      >
                        {isExpanded ? (
                          <ChevronDown size={18} className="text-gray-600" />
                        ) : (
                          <ChevronRight size={18} className="text-gray-600" />
                        )}
                      </button>
                      <span data-testid={`title-${notification.id}`} className="font-semibold text-gray-900">
                        {notification.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div
                      data-testid={`status-${notification.id}`}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-semibold ${getStatusBadgeClass(
                        notification.status
                      )}`}
                    >
                      {getStatusIcon(notification.status)}
                      <span className="capitalize">{notification.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg border text-xs font-semibold ${getPriorityBadgeClass(
                        notification.priority
                      )}`}
                    >
                      {notification.priority}
                    </span>
                  </td>
                  <td data-testid={`created-${notification.id}`} className="py-4 px-4">
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      data-testid={`delivery-status-${notification.id}`}
                      onClick={() => toggleExpand(notification.id)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        data-testid={`edit-${notification.id}`}
                        onClick={() => handleEdit(notification.id)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        data-testid={`delete-${notification.id}`}
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Row */}
                {isExpanded && (
                  <tr data-testid={`expanded-row-${notification.id}`} className="border-b border-gray-200 bg-gray-50">
                    <td colSpan={6} className="py-4 px-4">
                      <div className="space-y-4">
                        {/* Message Section */}
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 mb-2">Message</h4>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                            {notification.message}
                          </p>
                        </div>

                        {/* Metadata Section */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 mb-1">Type</h4>
                            <p className="text-sm text-gray-700">{notification.type}</p>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 mb-1">Channels</h4>
                            <div className="flex gap-2">
                              {notification.channels?.map(channel => (
                                <span
                                  key={channel}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700"
                                >
                                  {getChannelIcon(channel)}
                                  {channel}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Delivery Status Section */}
                        {notification.deliveryStatus && (
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 mb-2">Delivery Status by Channel</h4>
                            <div className="space-y-2">
                              {Object.entries(notification.deliveryStatus).map(([channel, status]) => (
                                <div
                                  key={channel}
                                  data-testid={`channel-delivery-${notification.id}-${channel}`}
                                  className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
                                >
                                  <span className="text-sm font-semibold text-gray-700">{channel}</span>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(status)}
                                    <span className="text-xs font-semibold text-gray-600 capitalize">{status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timeline Section */}
                        {notification.sentAt && (
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 mb-2">Timeline</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p>Created: {new Date(notification.createdAt).toLocaleString()}</p>
                              <p>Sent: {new Date(notification.sentAt).toLocaleString()}</p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons for Failed Notifications */}
                        {notification.status === 'failed' && (
                          <button
                            data-testid={`retry-${notification.id}`}
                            onClick={() => handleRetry(notification.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <RotateCcw size={14} />
                            Retry
                          </button>
                        )}

                        {/* Resend Button for Sent Notifications */}
                        {notification.status === 'sent' && (
                          <button
                            data-testid={`resend-${notification.id}`}
                            onClick={() => handleResend(notification.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Mail size={14} />
                            Resend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
