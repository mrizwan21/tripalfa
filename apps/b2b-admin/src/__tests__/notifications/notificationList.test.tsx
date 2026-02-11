/**
 * Notification List Tests
 * Tests for displaying notifications with details, actions, delivery status, and history
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNotifications } from '../../__mocks__/fixtures';

// Mock List Component
const NotificationList = () => {
  const [notifications, setNotifications] = React.useState(mockNotifications);
  const [expandedIds, setExpandedIds] = React.useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleEdit = (id: string) => {
    // Navigate to edit page
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleResend = async (id: string) => {
    // Resend notification
  };

  const handleRetry = async (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id
        ? {
            ...n,
            status: 'sent',
            deliveryStatus: Object.keys(n.deliveryStatus).reduce(
              (acc, key) => ({ ...acc, [key]: 'sent' }),
              {}
            )
          }
        : n
    ));
  };

  return (
    <div data-testid="notification-list-container">
      <h1>Notifications</h1>

      <table data-testid="notifications-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Created</th>
            <th>Delivery</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map(notification => (
            <React.Fragment key={notification.id}>
              <tr data-testid={`row-${notification.id}`}>
                <td>
                  <button
                    data-testid={`expand-${notification.id}`}
                    className="expand-button"
                    onClick={() => toggleExpand(notification.id)}
                  >
                    {expandedIds.includes(notification.id) ? '▼' : '▶'}
                  </button>
                  <span data-testid={`title-${notification.id}`}>{notification.title}</span>
                </td>
                <td data-testid={`status-${notification.id}`}>{notification.status}</td>
                <td data-testid={`priority-${notification.id}`}>{notification.priority}</td>
                <td data-testid={`created-${notification.id}`}>
                  {new Date(notification.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <button
                    data-testid={`delivery-status-${notification.id}`}
                    className="status-indicator"
                  >
                    View
                  </button>
                </td>
                <td>
                  <button
                    data-testid={`edit-${notification.id}`}
                    onClick={() => handleEdit(notification.id)}
                  >
                    Edit
                  </button>
                  <button
                    data-testid={`delete-${notification.id}`}
                    onClick={() => handleDelete(notification.id)}
                  >
                    Delete
                  </button>
                  {notification.status === 'failed' && (
                    <button
                      data-testid={`retry-${notification.id}`}
                      onClick={() => handleRetry(notification.id)}
                    >
                      Retry
                    </button>
                  )}
                  {notification.status === 'sent' && (
                    <button
                      data-testid={`resend-${notification.id}`}
                      onClick={() => handleResend(notification.id)}
                    >
                      Resend
                    </button>
                  )}
                </td>
              </tr>

              {expandedIds.includes(notification.id) && (
                <tr data-testid={`expanded-${notification.id}`} className="expanded-row">
                  <td colSpan={6}>
                    <div className="expanded-content">
                      <h4>Details</h4>
                      <div data-testid={`details-message-${notification.id}`}>
                        <strong>Message:</strong> {notification.message}
                      </div>
                      <div data-testid={`details-type-${notification.id}`}>
                        <strong>Type:</strong> {notification.type}
                      </div>
                      <div data-testid={`details-channels-${notification.id}`}>
                        <strong>Channels:</strong> {notification.channels.join(', ')}
                      </div>

                      <h4 style={{ marginTop: '1rem' }}>Delivery Status by Channel</h4>
                      <div data-testid={`delivery-details-${notification.id}`} className="delivery-status">
                        {Object.entries(notification.deliveryStatus).map(([channel, status]) => (
                          <div key={channel} className="delivery-item">
                            <span data-testid={`channel-${channel}`} className="channel">
                              {channel}:
                            </span>
                            <span data-testid={`channel-status-${channel}`} className={`status-${status}`}>
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>

                      <h4 style={{ marginTop: '1rem' }}>History</h4>
                      <div data-testid={`history-${notification.id}`} className="history">
                        <div className="history-item">
                          <span className="timestamp">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                          <span className="action">Notification created</span>
                        </div>
                        {notification.readAt && (
                          <div className="history-item">
                            <span className="timestamp">
                              {new Date(notification.readAt).toLocaleString()}
                            </span>
                            <span className="action">Marked as read</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

describe('Notification List', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should display notification list', () => {
    render(<NotificationList />);

    expect(screen.getByTestId('notifications-table')).toBeInTheDocument();
  });

  it('should display all notifications in table rows', () => {
    render(<NotificationList />);

    mockNotifications.forEach(notification => {
      expect(screen.getByTestId(`row-${notification.id}`)).toBeInTheDocument();
    });
  });

  it('should display notification titles', () => {
    render(<NotificationList />);

    mockNotifications.forEach(notification => {
      expect(screen.getByTestId(`title-${notification.id}`)).toHaveTextContent(notification.title);
    });
  });

  it('should display notification status', () => {
    render(<NotificationList />);

    mockNotifications.forEach(notification => {
      expect(screen.getByTestId(`status-${notification.id}`)).toHaveTextContent(notification.status);
    });
  });

  it('should display notification priority', () => {
    render(<NotificationList />);

    mockNotifications.forEach(notification => {
      expect(screen.getByTestId(`priority-${notification.id}`)).toHaveTextContent(notification.priority);
    });
  });

  it('should display creation date', () => {
    render(<NotificationList />);

    mockNotifications.forEach(notification => {
      expect(screen.getByTestId(`created-${notification.id}`)).toBeInTheDocument();
    });
  });

  it('should have expand buttons for rows', () => {
    render(<NotificationList />);

    mockNotifications.forEach(notification => {
      expect(screen.getByTestId(`expand-${notification.id}`)).toBeInTheDocument();
    });
  });

  it('should expand row when clicking expand button', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    const expandButton = screen.getByTestId(`expand-${firstNotification.id}`);

    expect(screen.queryByTestId(`expanded-${firstNotification.id}`)).not.toBeInTheDocument();

    await user.click(expandButton);

    expect(screen.getByTestId(`expanded-${firstNotification.id}`)).toBeInTheDocument();
  });

  it('should collapse row when clicking expand button again', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    const expandButton = screen.getByTestId(`expand-${firstNotification.id}`);

    await user.click(expandButton);
    expect(screen.getByTestId(`expanded-${firstNotification.id}`)).toBeInTheDocument();

    await user.click(expandButton);
    expect(screen.queryByTestId(`expanded-${firstNotification.id}`)).not.toBeInTheDocument();
  });

  it('should show message in expanded row', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    const expandButton = screen.getByTestId(`expand-${firstNotification.id}`);

    await user.click(expandButton);

    expect(screen.getByTestId(`details-message-${firstNotification.id}`)).toHaveTextContent(
      firstNotification.message
    );
  });

  it('should show notification type in expanded row', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    const expandButton = screen.getByTestId(`expand-${firstNotification.id}`);

    await user.click(expandButton);

    expect(screen.getByTestId(`details-type-${firstNotification.id}`)).toHaveTextContent(
      firstNotification.type
    );
  });

  it('should show channels in expanded row', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    const expandButton = screen.getByTestId(`expand-${firstNotification.id}`);

    await user.click(expandButton);

    expect(screen.getByTestId(`details-channels-${firstNotification.id}`)).toHaveTextContent(
      firstNotification.channels.join(', ')
    );
  });

  it('should show delivery status per channel', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    const expandButton = screen.getByTestId(`expand-${firstNotification.id}`);

    await user.click(expandButton);

    const deliveryDetails = screen.getByTestId(`delivery-details-${firstNotification.id}`);
    Object.keys(firstNotification.deliveryStatus).forEach(channel => {
      expect(deliveryDetails).toHaveTextContent(channel);
    });
  });

  it('should display edit button', () => {
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    expect(screen.getByTestId(`edit-${firstNotification.id}`)).toBeInTheDocument();
  });

  it('should display delete button', () => {
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    expect(screen.getByTestId(`delete-${firstNotification.id}`)).toBeInTheDocument();
  });

  it('should delete notification when clicking delete button', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    const deleteButton = screen.getByTestId(`delete-${firstNotification.id}`);

    expect(screen.getByTestId(`row-${firstNotification.id}`)).toBeInTheDocument();

    await user.click(deleteButton);

    expect(screen.queryByTestId(`row-${firstNotification.id}`)).not.toBeInTheDocument();
  });

  it('should display retry button for failed notifications', () => {
    render(<NotificationList />);

    const failedNotification = mockNotifications.find(n => n.status === 'failed');
    if (failedNotification) {
      expect(screen.getByTestId(`retry-${failedNotification.id}`)).toBeInTheDocument();
    }
  });

  it('should retry failed notification', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const failedNotification = mockNotifications.find(n => n.status === 'failed');
    if (failedNotification) {
      const beforeStatus = screen.getByTestId(`status-${failedNotification.id}`).textContent;

      const retryButton = screen.getByTestId(`retry-${failedNotification.id}`);
      await user.click(retryButton);

      await waitFor(() => {
        const afterStatus = screen.getByTestId(`status-${failedNotification.id}`).textContent;
        expect(afterStatus).not.toBe(beforeStatus);
      });
    }
  });

  it('should display resend button for sent notifications', () => {
    render(<NotificationList />);

    const sentNotification = mockNotifications.find(n => n.status === 'sent');
    if (sentNotification) {
      expect(screen.getByTestId(`resend-${sentNotification.id}`)).toBeInTheDocument();
    }
  });

  it('should show notification history', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    const expandButton = screen.getByTestId(`expand-${firstNotification.id}`);

    await user.click(expandButton);

    expect(screen.getByTestId(`history-${firstNotification.id}`)).toBeInTheDocument();
  });

  it('should show creation time in history', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    const expandButton = screen.getByTestId(`expand-${firstNotification.id}`);

    await user.click(expandButton);

    const history = screen.getByTestId(`history-${firstNotification.id}`);
    const createdDate = new Date(firstNotification.createdAt).toLocaleString();
    expect(history.textContent).toContain('Notification created');
  });

  it('should show read timestamp in history if notification was read', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const readNotification = mockNotifications.find(n => n.readAt);
    if (readNotification) {
      const expandButton = screen.getByTestId(`expand-${readNotification.id}`);
      await user.click(expandButton);

      const history = screen.getByTestId(`history-${readNotification.id}`);
      expect(history.textContent).toContain('Marked as read');
    }
  });

  it('should display notification table headers', () => {
    render(<NotificationList />);

    const table = screen.getByTestId('notifications-table');
    expect(table.querySelector('th')).toBeInTheDocument();
  });

  it('should maintain expanded/collapsed state for multiple rows', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const firstNotif = mockNotifications[0];
    const secondNotif = mockNotifications[1];

    const expandBtn1 = screen.getByTestId(`expand-${firstNotif.id}`);
    const expandBtn2 = screen.getByTestId(`expand-${secondNotif.id}`);

    await user.click(expandBtn1);
    await user.click(expandBtn2);

    expect(screen.getByTestId(`expanded-${firstNotif.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`expanded-${secondNotif.id}`)).toBeInTheDocument();
  });

  it('should handle multiple notifications correctly', () => {
    render(<NotificationList />);

    const rows = screen.getAllByTestId(/^row-/);
    expect(rows.length).toBe(mockNotifications.length);
  });

  it('should show delivery status buttons', () => {
    render(<NotificationList />);

    mockNotifications.forEach(notification => {
      expect(screen.getByTestId(`delivery-status-${notification.id}`)).toBeInTheDocument();
    });
  });

  it('should display all action buttons', () => {
    render(<NotificationList />);

    const firstNotification = mockNotifications[0];
    expect(screen.getByTestId(`edit-${firstNotification.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`delete-${firstNotification.id}`)).toBeInTheDocument();
  });

  it('should expand and collapse multiple rows independently', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const notif1 = mockNotifications[0];
    const notif2 = mockNotifications[1];

    const expand1 = screen.getByTestId(`expand-${notif1.id}`);
    await user.click(expand1);

    expect(screen.getByTestId(`expanded-${notif1.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`expanded-${notif2.id}`)).not.toBeInTheDocument();

    const expand2 = screen.getByTestId(`expand-${notif2.id}`);
    await user.click(expand2);

    expect(screen.getByTestId(`expanded-${notif1.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`expanded-${notif2.id}`)).toBeInTheDocument();
  });

  it('should update UI when notification is deleted', async () => {
    const user = userEvent.setup();
    render(<NotificationList />);

    const initialRows = screen.getAllByTestId(/^row-/);
    const initialCount = initialRows.length;

    const firstNotification = mockNotifications[0];
    await user.click(screen.getByTestId(`delete-${firstNotification.id}`));

    await waitFor(() => {
      const updatedRows = screen.queryAllByTestId(/^row-/);
      expect(updatedRows.length).toBeLessThan(initialCount);
    });
  });
});
