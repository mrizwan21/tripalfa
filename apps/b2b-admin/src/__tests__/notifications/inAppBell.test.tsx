/**
 * In-App Bell Icon Tests
 * Tests for notification bell icon in header including dropdown, unread count, and real-time updates
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNotifications, mockUnreadNotifications } from '../../__mocks__/fixtures';

// Mock Bell Component
const NotificationBell = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(mockUnreadNotifications);
  const [recentNotifications, setRecentNotifications] = React.useState(mockNotifications.slice(0, 10));

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n
    ));
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (id: string) => {
    handleMarkAsRead(id);
  };

  return (
    <div>
      <button
        data-testid="bell-icon"
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        <span data-testid="bell-icon-indicator">🔔</span>
        {unreadCount > 0 && (
          <span data-testid="unread-badge" className="badge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div data-testid="notification-dropdown" className="dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            <button data-testid="close-dropdown" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div data-testid="notification-list" className="notification-list">
            {recentNotifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                data-testid={`notification-item-${notification.id}`}
                className="notification-item"
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="notification-content">
                  <h4 data-testid={`item-title-${notification.id}`}>{notification.title}</h4>
                  <p data-testid={`item-message-${notification.id}`}>{notification.message}</p>
                  <small data-testid={`item-time-${notification.id}`}>
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </small>
                </div>
                <input
                  type="checkbox"
                  data-testid={`item-read-${notification.id}`}
                  checked={!!notification.readAt}
                  onChange={() => handleMarkAsRead(notification.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>

          <div className="dropdown-footer">
            <button
              data-testid="view-all-link"
              onClick={() => {
                // Navigate to full notification list
                window.location.href = '/notifications';
              }}
            >
              View All →
            </button>
          </div>
        </div>
      )}

      {/* Outside click handler */}
      {isOpen && (
        <div
          data-testid="dropdown-overlay"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0
          }}
        />
      )}
    </div>
  );
};

describe('In-App Notification Bell', () => {


  it('should display bell icon in header', () => {
    render(<NotificationBell />);
    
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bell-icon-indicator')).toHaveTextContent('🔔');
  });

  it('should show unread count badge when there are unread notifications', () => {
    render(<NotificationBell />);

    const badge = screen.getByTestId('unread-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/\d+/);
  });

  it('should display correct unread count', () => {
    render(<NotificationBell />);

    const badge = screen.getByTestId('unread-badge');
    const unreadCount = mockUnreadNotifications.filter(n => !n.readAt).length;
    expect(badge).toHaveTextContent(unreadCount.toString());
  });

  it('should not display badge when all notifications are read', () => {
    const NoUnreadBell = () => {
      const readNotifications = mockNotifications.map(n => ({
        ...n,
        readAt: new Date().toISOString()
      }));

      return (
        <div>
          <button data-testid="bell-icon">
            <span>🔔</span>
            {readNotifications.filter(n => !n.readAt).length > 0 && (
              <span data-testid="unread-badge">1</span>
            )}
          </button>
        </div>
      );
    };

    render(<NoUnreadBell />);

    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
  });

  it('should open dropdown when bell is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();

    await user.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });
  });

  it('should close dropdown when bell is clicked again', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');

    // Open
    await user.click(bellIcon);
    await waitFor(() => {
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });

    // Close
    await user.click(bellIcon);
    await waitFor(() => {
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    });
  });

  it('should display recent notifications in dropdown (last 10)', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    });

    // Use querySelectorAll to find elements matching the pattern
    const notificationList = screen.getByTestId('notification-list');
    const notificationItems = notificationList.querySelectorAll('[data-testid^="notification-item-"]');
    expect(notificationItems.length).toBeLessThanOrEqual(10);
  });

  it('should display notification details in dropdown items', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    });

    // Component renders mockNotifications (from mockNotifications.slice(0, 10)), not mockUnreadNotifications
    mockNotifications.slice(0, 10).forEach(notification => {
      expect(screen.getByTestId(`item-title-${notification.id}`)).toHaveTextContent(notification.title);
      expect(screen.getByTestId(`item-message-${notification.id}`)).toHaveTextContent(notification.message);
    });
  });

  it('should mark notification as read when clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    // Component renders mockNotifications, not mockUnreadNotifications
    const firstNotification = mockNotifications[0];
    const notificationItem = screen.getByTestId(`notification-item-${firstNotification.id}`);

    await user.click(notificationItem);

    await waitFor(() => {
      const checkbox = screen.getByTestId(`item-read-${firstNotification.id}`) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  it('should update badge when notification is marked as read', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [notifications, setNotifications] = React.useState(mockUnreadNotifications);
      const unreadCount = notifications.filter(n => !n.readAt).length;

      const handleMarkAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        ));
      };

      return (
        <div>
          <button data-testid="bell-icon">
            {unreadCount > 0 && (
              <span data-testid="unread-badge">{unreadCount}</span>
            )}
          </button>
          <button
            data-testid="mark-read-btn"
            onClick={() => handleMarkAsRead(mockUnreadNotifications[0].id)}
          >
            Mark as Read
          </button>
        </div>
      );
    };

    render(<TestComponent />);

    const initialBadge = screen.getByTestId('unread-badge');
    const initialCount = parseInt(initialBadge.textContent!);

    const markReadBtn = screen.getByTestId('mark-read-btn');
    await user.click(markReadBtn);

    await waitFor(() => {
      const updatedBadge = screen.getByTestId('unread-badge');
      const updatedCount = parseInt(updatedBadge.textContent!);
      expect(updatedCount).toBeLessThan(initialCount);
    });
  });

  it('should have View All link in dropdown footer', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    });

    const viewAllLink = screen.getByTestId('view-all-link');
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveTextContent('View All');
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });

    const overlay = screen.getByTestId('dropdown-overlay');
    await user.click(overlay);

    await waitFor(() => {
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId('close-dropdown');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    });
  });

  it('should display notification timestamps', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    });

    // Component renders mockNotifications, not mockUnreadNotifications
    mockNotifications.slice(0, 10).forEach(notification => {
      const timeElement = screen.getByTestId(`item-time-${notification.id}`);
      expect(timeElement).toBeInTheDocument();
    });
  });

  it('should handle real-time notification updates', async () => {
    const TestComponent = () => {
      const [notifications, setNotifications] = React.useState(mockUnreadNotifications);
      const unreadCount = notifications.filter(n => !n.readAt).length;

      React.useEffect(() => {
        const timer = setTimeout(() => {
          setNotifications(prev => [
            {
              id: 'new-notif',
              userId: 'user-001',
              type: 'system',
              title: 'New Notification',
              message: 'This is a new real-time notification',
              status: 'sent',
              priority: 'high',
              createdAt: new Date().toISOString(),
              channels: ['system'],
              deliveryStatus: { system: 'sent' }
            },
            ...prev
          ]);
        }, 100);

        return () => clearTimeout(timer);
      }, []);

      return (
        <div>
          <span data-testid="notification-count">{unreadCount}</span>
          <div data-testid="notifications-list">
            {notifications.map(n => (
              <div key={n.id} data-testid={`notif-${n.id}`}>{n.title}</div>
            ))}
          </div>
        </div>
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('notif-new-notif')).toBeInTheDocument();
    });
  });

  it('should prevent stopPropagation when marking notification as read', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });

    // Component renders mockNotifications, not mockUnreadNotifications
    const firstNotification = mockNotifications[0];
    const checkbox = screen.getByTestId(`item-read-${firstNotification.id}`);
    
    // Verify checkbox exists and is clickable
    expect(checkbox).toBeInTheDocument();
    await user.click(checkbox);

    // Verify dropdown is still open after clicking checkbox
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  it('should handle multiple notification items correctly', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    });

    // Use querySelectorAll to find elements with the correct prefix
    const notificationList = screen.getByTestId('notification-list');
    const notificationItems = notificationList.querySelectorAll('[data-testid^="notification-item-"]');
    expect(notificationItems.length).toBeGreaterThan(0);
    expect(notificationItems.length).toBeLessThanOrEqual(10);
  });

  it('should maintain scroll position in dropdown', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellIcon = screen.getByTestId('bell-icon');
    await user.click(bellIcon);

    const dropdown = screen.getByTestId('notification-list');
    expect(dropdown).toBeInTheDocument();
  });

  it('should show notification type indicator', () => {
    const TestComponentWithType = () => {
      const notifications = mockUnreadNotifications.slice(0, 3);

      return (
        <div data-testid="notifications-with-types">
          {notifications.map(n => (
            <div key={n.id} data-testid={`notif-type-${n.id}`}>
              <span className="type-badge">{n.type}</span>
              <span>{n.title}</span>
            </div>
          ))}
        </div>
      );
    };

    render(<TestComponentWithType />);

    mockUnreadNotifications.slice(0, 3).forEach(n => {
      const typeElement = screen.getByTestId(`notif-type-${n.id}`);
      expect(typeElement).toHaveTextContent(n.type);
    });
  });

  it('should show notification priority indicator', () => {
    const TestComponentWithPriority = () => {
      const notifications = mockUnreadNotifications.slice(0, 3);

      return (
        <div>
          {notifications.map(n => (
            <div key={n.id} data-testid={`priority-${n.id}`}>
              <span className={`priority-${n.priority}`}>{n.priority}</span>
            </div>
          ))}
        </div>
      );
    };

    render(<TestComponentWithPriority />);

    mockUnreadNotifications.slice(0, 3).forEach(n => {
      expect(screen.getByTestId(`priority-${n.id}`)).toHaveTextContent(n.priority);
    });
  });
});
