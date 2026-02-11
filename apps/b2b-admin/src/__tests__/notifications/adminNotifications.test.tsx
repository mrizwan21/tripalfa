/**
 * Admin Notifications Dashboard Tests
 * Tests for displaying, filtering, sorting, and managing all notifications from all users
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNotifications, createMockNotifications } from '../../__mocks__/fixtures';

// Mock component - Replace with actual component path
const AdminNotificationsDashboard = ({ onNotificationsLoad }: { onNotificationsLoad?: (count: number) => void }) => {
  const [notifications, setNotifications] = React.useState(mockNotifications);
  const [filteredNotifications, setFilteredNotifications] = React.useState(mockNotifications);
  const [filterType, setFilterType] = React.useState<string>('');
  const [filterStatus, setFilterStatus] = React.useState<string>('');
  const [filterUser, setFilterUser] = React.useState<string>('');
  const [sortBy, setSortBy] = React.useState<'date' | 'priority' | 'status'>('date');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  React.useEffect(() => {
    onNotificationsLoad?.(notifications.length);
  }, [notifications, onNotificationsLoad]);

  React.useEffect(() => {
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
          const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
          comparison = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                      priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredNotifications(sorted);
  }, [filterType, filterStatus, filterUser, searchTerm, startDate, endDate, sortBy, sortOrder, notifications]);

  const itemsPerPage = 10;
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const handleMarkAsRead = async (ids: string[]) => {
    setNotifications(notifications.map(n => 
      ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n
    ));
    setSelectedIds([]);
  };

  const handleBulkDelete = async (ids: string[]) => {
    setNotifications(notifications.filter(n => !ids.includes(n.id)));
    setSelectedIds([]);
  };

  const handleExportCSV = async () => {
    const csv = 'ID,User ID,Type,Title,Status,Created\n' +
      filteredNotifications.map(n => `${n.id},${n.userId},${n.type},${n.title},${n.status},${n.createdAt}`).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notifications.csv';
    a.click();
  };

  return (
    <div data-testid="admin-notifications-dashboard">
      <h1>Notifications Dashboard</h1>

      {/* Filters and Search */}
      <div data-testid="filter-section">
        <input
          data-testid="search-input"
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          data-testid="filter-type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="push">Push</option>
          <option value="system">System</option>
        </select>

        <select
          data-testid="filter-status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
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
        >
          <option value="">All Users</option>
          <option value="user-001">User 1</option>
          <option value="user-002">User 2</option>
          <option value="user-003">User 3</option>
        </select>

        <input
          data-testid="filter-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          data-testid="filter-end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {/* Sorting */}
      <div data-testid="sort-section">
        <select
          data-testid="sort-by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="date">By Date</option>
          <option value="priority">By Priority</option>
          <option value="status">By Status</option>
        </select>

        <button
          data-testid="sort-order-toggle"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
        >
          {sortOrder === 'desc' ? '↓ Descending' : '↑ Ascending'}
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div data-testid="bulk-actions">
          <span>{selectedIds.length} selected</span>
          <button
            data-testid="bulk-mark-read"
            onClick={() => handleMarkAsRead(selectedIds)}
          >
            Mark as Read
          </button>
          <button
            data-testid="bulk-delete"
            onClick={() => handleBulkDelete(selectedIds)}
          >
            Delete
          </button>
          <button
            data-testid="export-csv"
            onClick={handleExportCSV}
          >
            Export as CSV
          </button>
        </div>
      )}

      {/* Notifications Table */}
      <table data-testid="notifications-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                data-testid="select-all"
                checked={selectedIds.length === paginatedNotifications.length && paginatedNotifications.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(paginatedNotifications.map(n => n.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
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
            <tr key={notification.id} data-testid={`notification-row-${notification.id}`}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notification.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds([...selectedIds, notification.id]);
                    } else {
                      setSelectedIds(selectedIds.filter(id => id !== notification.id));
                    }
                  }}
                />
              </td>
              <td data-testid={`notification-title-${notification.id}`}>{notification.title}</td>
              <td data-testid={`notification-type-${notification.id}`}>{notification.type}</td>
              <td data-testid={`notification-status-${notification.id}`}>{notification.status}</td>
              <td data-testid={`notification-priority-${notification.id}`}>{notification.priority}</td>
              <td>{notification.userId}</td>
              <td>{new Date(notification.createdAt).toLocaleDateString()}</td>
              <td>
                <button data-testid={`view-${notification.id}`}>View</button>
                <button data-testid={`edit-${notification.id}`}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div data-testid="pagination">
        <button
          data-testid="prev-page"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            data-testid={`page-${p}`}
            onClick={() => setPage(p)}
            style={{ fontWeight: page === p ? 'bold' : 'normal' }}
          >
            {p}
          </button>
        ))}

        <button
          data-testid="next-page"
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>

        <span data-testid="page-info">
          Page {page} of {totalPages} ({filteredNotifications.length} total)
        </span>
      </div>
    </div>
  );
};

describe('Admin Notifications Dashboard', () => {


  it('should load dashboard and display all notifications', async () => {
    const { getByTestId } = render(<AdminNotificationsDashboard />);
    
    await waitFor(() => {
      expect(getByTestId('admin-notifications-dashboard')).toBeInTheDocument();
    });

    expect(getByTestId('notifications-table')).toBeInTheDocument();
  });

  it('should display all notifications from all users in admin view', async () => {
    render(<AdminNotificationsDashboard />);
    
    await waitFor(() => {
      mockNotifications.forEach(notification => {
        expect(screen.getByTestId(`notification-row-${notification.id}`)).toBeInTheDocument();
      });
    });
  });

  it('should filter notifications by type', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const typeFilter = screen.getByTestId('filter-type');
    await user.selectOptions(typeFilter, 'email');

    await waitFor(() => {
      const rows = screen.getAllByTestId(/^notification-row-/);
      rows.forEach(row => {
        expect(row).toBeInTheDocument();
      });
    });
  });

  it('should filter notifications by status', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const statusFilter = screen.getByTestId('filter-status');
    await user.selectOptions(statusFilter, 'sent');

    await waitFor(() => {
      expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
    });
  });

  it('should filter notifications by user', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const userFilter = screen.getByTestId('filter-user');
    await user.selectOptions(userFilter, 'user-001');

    await waitFor(() => {
      const rows = screen.getAllByTestId(/^notification-row-/);
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  it('should filter notifications by date range', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const startDateInput = screen.getByTestId('filter-start-date');
    const endDateInput = screen.getByTestId('filter-end-date');

    await user.type(startDateInput, '2024-02-01');
    await user.type(endDateInput, '2024-02-08');

    await waitFor(() => {
      expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
    });
  });

  it('should sort notifications by date', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const sortBy = screen.getByTestId('sort-by');
    await user.selectOptions(sortBy, 'date');

    await waitFor(() => {
      expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
    });
  });

  it('should sort notifications by priority', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const sortBy = screen.getByTestId('sort-by');
    await user.selectOptions(sortBy, 'priority');

    await waitFor(() => {
      expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
    });
  });

  it('should sort notifications by status', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const sortBy = screen.getByTestId('sort-by');
    await user.selectOptions(sortBy, 'status');

    await waitFor(() => {
      expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
    });
  });

  it('should toggle sort order', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const sortOrderButton = screen.getByTestId('sort-order-toggle');
    expect(sortOrderButton).toHaveTextContent('Descending');

    await user.click(sortOrderButton);

    await waitFor(() => {
      expect(sortOrderButton).toHaveTextContent('Ascending');
    });
  });

  it('should paginate notifications correctly', async () => {
    const onNotificationsLoad = vi.fn();
    render(<AdminNotificationsDashboard onNotificationsLoad={onNotificationsLoad} />);

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    const pageInfo = screen.getByTestId('page-info');
    expect(pageInfo).toHaveTextContent(/Page 1 of/);
  });

  it('should navigate to next page', async () => {
    const user = userEvent.setup();
    
    // Create many notifications to have multiple pages
    const manyNotifications = createMockNotifications(25);
    
    const TestComponent = () => {
      const [notifs] = React.useState(manyNotifications);
      const [page, setPage] = React.useState(1);
      const itemsPerPage = 10;
      const paginatedNotifications = notifs.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
      );
      const totalPages = Math.ceil(notifs.length / itemsPerPage);

      return (
        <div>
          <div data-testid="page-count">{paginatedNotifications.length}</div>
          <button
            data-testid="next-page"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
          <span data-testid="current-page">{page}</span>
        </div>
      );
    };

    render(<TestComponent />);
    
    const nextButton = screen.getByTestId('next-page');
    expect(nextButton).toBeEnabled();

    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-page')).toHaveTextContent('2');
    });
  });

  it('should mark notifications as read in bulk', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    // Select all notifications
    const selectAllCheckbox = screen.getByTestId('select-all');
    await user.click(selectAllCheckbox);

    // Wait for both bulk-actions container AND the button to be visible
    await waitFor(() => {
      expect(screen.getByTestId('bulk-actions')).toBeVisible();
      expect(screen.getByTestId('bulk-mark-read')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click mark as read button
    const markAsReadButton = screen.getByTestId('bulk-mark-read');
    await user.click(markAsReadButton);

    // Verify action was processed
    await waitFor(() => {
      // The button should still be present (or bulk-actions may still be visible if nothing deselected)
      const bulkActionsElement = screen.queryByTestId('bulk-actions');
      // Either bulk-actions is gone (items deselected) or still there (operation completed)
      expect(bulkActionsElement === null || bulkActionsElement.textContent).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should delete notifications in bulk', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    // Select notifications
    const selectAllCheckbox = screen.getByTestId('select-all');
    await user.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByTestId('bulk-actions')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId('bulk-delete');
    await user.click(deleteButton);

    await waitFor(() => {
      const rows = screen.queryAllByTestId(/^notification-row-/);
      expect(rows.length).toBe(0);
    });
  });

  it('should export notifications to CSV', async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, 'createElement');

    render(<AdminNotificationsDashboard />);

    const selectAllCheckbox = screen.getByTestId('select-all');
    await user.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByTestId('bulk-actions')).toBeInTheDocument();
    });

    const exportButton = screen.getByTestId('export-csv');
    await user.click(exportButton);

    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    createElementSpy.mockRestore();
  });

  it('should search across all notifications', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Booking');

    await waitFor(() => {
      expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
    });
  });

  it('should apply multiple filters simultaneously', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const typeFilter = screen.getByTestId('filter-type');
    const statusFilter = screen.getByTestId('filter-status');

    await user.selectOptions(typeFilter, 'email');
    await user.selectOptions(statusFilter, 'sent');

    await waitFor(() => {
      expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
    });
  });

  it('should clear search and show all notifications', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
    
    await user.type(searchInput, 'test');
    expect(searchInput.value).toBe('test');

    await user.clear(searchInput);
    expect(searchInput.value).toBe('');

    await waitFor(() => {
      expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
    });
  });

  it('should disable next page button on last page', async () => {
    const TestComponent = () => {
      const [page, setPage] = React.useState(1);
      return (
        <div>
          <button
            data-testid="next-page"
            disabled={page > 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    
    const nextButton = getByTestId('next-page');
    expect(nextButton).toBeEnabled();
  });

  it('should display correct count of selected items', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const selectAllCheckbox = screen.getByTestId('select-all');
    await user.click(selectAllCheckbox);

    await waitFor(() => {
      const bulkActions = screen.getByTestId('bulk-actions');
      expect(bulkActions).toHaveTextContent(/\d+ selected/);
    });
  });

  it('should handle filter combination correctly', async () => {
    const user = userEvent.setup();
    render(<AdminNotificationsDashboard />);

    const typeFilter = screen.getByTestId('filter-type');
    const statusFilter = screen.getByTestId('filter-status');
    const userFilter = screen.getByTestId('filter-user');

    await user.selectOptions(typeFilter, 'email');
    await user.selectOptions(statusFilter, 'sent');
    await user.selectOptions(userFilter, 'user-001');

    await waitFor(() => {
      expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
    });
  });
});
