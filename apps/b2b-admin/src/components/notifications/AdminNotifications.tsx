/**
 * Admin Notifications Dashboard
 * Dashboard for viewing and managing all notifications from all users
 * 
 * Features:
 * - View all notifications across users (admin view)
 * - Filter by type, status, user, date range
 * - Sort by date, priority, status
 * - Bulk operations: mark as read, delete
 * - Export to CSV
 * - Search functionality
 * - Pagination
 * 
 * @example
 * <AdminNotifications />
 */

import React, { useEffect, useState, useCallback } from 'react';

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

interface AdminNotificationsProps {
  onNotificationsLoad?: (count: number) => void;
}

const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };

export default function AdminNotifications({ onNotificationsLoad }: AdminNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
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
    },
    {
      id: 'notif-004',
      userId: 'user-001',
      type: 'system',
      title: 'Account Verification',
      message: 'Please verify your email address',
      status: 'failed',
      priority: 'high',
      createdAt: '2024-02-07T15:00:00Z',
      channels: ['email', 'system'],
      deliveryStatus: { email: 'failed', system: 'sent' }
    },
    {
      id: 'notif-005',
      userId: 'user-004',
      type: 'whatsapp',
      title: 'Booking Reminder',
      message: 'Your booking is coming up in 24 hours',
      status: 'sent',
      priority: 'medium',
      createdAt: '2024-02-08T07:00:00Z',
      readAt: '2024-02-08T07:30:00Z',
      channels: ['system'],
      deliveryStatus: { system: 'sent', whatsapp: 'sent' }
    }
  ]);

  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(notifications);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const itemsPerPage = 10;

  // Apply filters and sorting
  useEffect(() => {
    let result = notifications;

    // Apply filters
    if (filterType) {
      result = result.filter(n => n.type === filterType);
    }
    if (filterStatus) {
      result = result.filter(n => n.status === filterStatus);
    }
    if (filterUser) {
      result = result.filter(n => n.userId === filterUser);
    }
    if (searchTerm) {
      result = result.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (startDate) {
      result = result.filter(n => new Date(n.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      result = result.filter(n => new Date(n.createdAt) <= new Date(endDate));
    }

    // Apply sorting
    const sorted = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredNotifications(sorted);
    setPage(1); // Reset to first page when filters change
  }, [filterType, filterStatus, filterUser, searchTerm, startDate, endDate, sortBy, sortOrder, notifications]);

  // Notify parent of notifications count
  useEffect(() => {
    onNotificationsLoad?.(notifications.length);
  }, [notifications, onNotificationsLoad]);

  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const handleMarkAsRead = useCallback(async (ids: string[]) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    setSelectedIds([]);
  }, []);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(n => !ids.includes(n.id))
    );
    setSelectedIds([]);
  }, []);

  const handleExportCSV = useCallback(async () => {
    const csv = [
      'ID,User ID,Type,Title,Status,Priority,Created',
      ...filteredNotifications.map(n =>
        `${n.id},${n.userId},${n.type},"${n.title}",${n.status},${n.priority},${n.createdAt}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'notifications.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredNotifications]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedNotifications.map(n => n.id));
    } else {
      setSelectedIds([]);
    }
  }, [paginatedNotifications]);

  const handleSelectNotification = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(nid => nid !== id));
    }
  }, []);

  return (
    <div data-testid="admin-notifications-dashboard" className="admin-notifications">
      <h1>Notifications Dashboard</h1>

      {/* Filters and Search */}
      <div data-testid="filter-section" className="filter-section">
        <input
          data-testid="search-input"
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          data-testid="filter-type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="push">Push</option>
          <option value="system">System</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <select
          data-testid="filter-status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          data-testid="filter-user"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="filter-select"
        >
          <option value="">All Users</option>
          <option value="user-001">User 1</option>
          <option value="user-002">User 2</option>
          <option value="user-003">User 3</option>
          <option value="user-004">User 4</option>
        </select>

        <input
          data-testid="filter-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="filter-date"
        />

        <input
          data-testid="filter-end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="filter-date"
        />
      </div>

      {/* Sorting */}
      <div data-testid="sort-section" className="sort-section">
        <select
          data-testid="sort-by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'priority' | 'status')}
          className="sort-select"
        >
          <option value="date">By Date</option>
          <option value="priority">By Priority</option>
          <option value="status">By Status</option>
        </select>

        <button
          data-testid="sort-order-toggle"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="sort-button"
        >
          {sortOrder === 'desc' ? '↓ Descending' : '↑ Ascending'}
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div data-testid="bulk-actions" className="bulk-actions">
          <span className="selection-count">{selectedIds.length} selected</span>
          <button
            data-testid="bulk-mark-read"
            onClick={() => handleMarkAsRead(selectedIds)}
            className="action-button"
          >
            Mark as Read
          </button>
          <button
            data-testid="bulk-delete"
            onClick={() => handleBulkDelete(selectedIds)}
            className="action-button delete"
          >
            Delete
          </button>
          <button
            data-testid="export-csv"
            onClick={handleExportCSV}
            className="action-button export"
          >
            Export as CSV
          </button>
        </div>
      )}

      {/* Notifications Table */}
      <table data-testid="notifications-table" className="notifications-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                data-testid="select-all"
                checked={selectedIds.length === paginatedNotifications.length && paginatedNotifications.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label="Select all notifications on this page"
              />
            </th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Priority</th>
            <th>User</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedNotifications.map((notification) => (
            <tr key={notification.id} data-testid={`notification-row-${notification.id}`} className="notification-row">
              <td className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notification.id)}
                  onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                  aria-label={`Select ${notification.title}`}
                />
              </td>
              <td data-testid={`notification-title-${notification.id}`} className="title-cell">{notification.title}</td>
              <td data-testid={`notification-type-${notification.id}`} className="type-cell">{notification.type}</td>
              <td data-testid={`notification-status-${notification.id}`} className="status-cell">{notification.status}</td>
              <td data-testid={`notification-priority-${notification.id}`} className="priority-cell">{notification.priority}</td>
              <td className="user-cell">{notification.userId}</td>
              <td className="date-cell">{new Date(notification.createdAt).toLocaleDateString()}</td>
              <td className="actions-cell">
                <button data-testid={`view-${notification.id}`} className="action-link">View</button>
                <button data-testid={`edit-${notification.id}`} className="action-link">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {paginatedNotifications.length === 0 && (
        <div className="empty-state">
          <p>No notifications found</p>
        </div>
      )}

      {/* Pagination */}
      <div data-testid="pagination" className="pagination">
        <button
          data-testid="prev-page"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="pagination-button"
        >
          Previous
        </button>

        <div className="page-buttons">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = page > 3 ? page - 2 + i : i + 1;
            return pageNum <= totalPages ? (
              <button
                key={pageNum}
                data-testid={`page-${pageNum}`}
                onClick={() => setPage(pageNum)}
                className={`pagination-button ${page === pageNum ? 'active' : ''}`}
                style={{ fontWeight: page === pageNum ? 'bold' : 'normal' }}
              >
                {pageNum}
              </button>
            ) : null;
          })}
        </div>

        <button
          data-testid="next-page"
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          className="pagination-button"
        >
          Next
        </button>

        <span data-testid="page-info" className="page-info">
          Page {page} of {totalPages} ({filteredNotifications.length} total)
        </span>
      </div>
    </div>
  );
}
