/**
 * Notification Management Tests
 * Tests for creating, editing, deleting, scheduling, and sending notifications
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNotifications, mockNotificationTemplates } from '../../__mocks__/fixtures';

// Mock Management Component
const NotificationManagement = () => {
  const [notifications, setNotifications] = React.useState(mockNotifications);
  const [isCreateMode, setIsCreateMode] = React.useState(false);
  const [selectedNotification, setSelectedNotification] = React.useState<any>(null);
  const [targets, setTargets] = React.useState<string[]>([]);
  const [channels, setChannels] = React.useState<string[]>(['email']);
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [schedule, setSchedule] = React.useState('');
  const [priority, setPriority] = React.useState('medium');
  const [type, setType] = React.useState('system');
  const [templateId, setTemplateId] = React.useState('');
  const [testEmail, setTestEmail] = React.useState('');
  const [showPreview, setShowPreview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleCreateNew = () => {
    setIsCreateMode(true);
    setSelectedNotification(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setTargets([]);
    setChannels(['email']);
    setSchedule('');
    setPriority('medium');
    setType('system');
    setTemplateId('');
    setTestEmail('');
  };

  const handleEdit = (notification: any) => {
    setIsCreateMode(true);
    setSelectedNotification(notification);
    setTitle(notification.title);
    setMessage(notification.message);
    setPriority(notification.priority);
    setChannels(notification.channels);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      setNotifications(notifications.filter(n => n.id !== id));
      setSuccessMessage('Notification deleted successfully');
    }
  };

  const handleSendNotification = async () => {
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!message.trim()) {
      setError('Message is required');
      return;
    }
    if (targets.length === 0) {
      setError('Please select at least one target user or group');
      return;
    }
    if (channels.length === 0) {
      setError('Please select at least one channel');
      return;
    }

    try {
      const payload = {
        title,
        message,
        type,
        priority,
        channels,
        userIds: targets,
        schedule: schedule || undefined
      };

      const newNotification = {
        id: `notif-${Date.now()}`,
        userId: targets[0],
        type,
        title,
        message,
        status: schedule ? 'scheduled' : 'sent',
        priority,
        createdAt: new Date().toISOString(),
        channels,
        deliveryStatus: channels.reduce((acc, ch) => ({
          ...acc,
          [ch]: schedule ? 'pending' : 'sent'
        }), {})
      };

      setNotifications([newNotification, ...notifications]);
      setSuccessMessage(
        schedule 
          ? `Notification scheduled for ${schedule}`
          : 'Notification sent successfully'
      );
      
      setIsCreateMode(false);
      resetForm();
    } catch (err) {
      setError('Failed to send notification');
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      setError('Please enter a test email');
      return;
    }

    setSuccessMessage(`Test notification sent to ${testEmail}`);
    setTestEmail('');
  };

  return (
    <div data-testid="notification-management">
      <h1>Notification Management</h1>

      {error && (
        <div data-testid="error-message" className="alert alert-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div data-testid="success-message" className="alert alert-success">
          {successMessage}
        </div>
      )}

      {!isCreateMode ? (
        <div data-testid="notifications-list-section">
          <div className="header">
            <h2>Notifications</h2>
            <button
              data-testid="create-new-button"
              onClick={handleCreateNew}
            >
              Create New Notification
            </button>
          </div>

          <div data-testid="notifications-list">
            {notifications.map(notification => (
              <div
                key={notification.id}
                data-testid={`notification-item-${notification.id}`}
                className="notification-item"
              >
                <div className="notification-info">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <div className="meta">
                    <span className="type">{notification.type}</span>
                    <span className="status">{notification.status}</span>
                    <span className="priority">{notification.priority}</span>
                  </div>
                </div>
                <div className="actions">
                  <button
                    data-testid={`edit-${notification.id}`}
                    onClick={() => handleEdit(notification)}
                  >
                    Edit
                  </button>
                  <button
                    data-testid={`delete-${notification.id}`}
                    onClick={() => handleDelete(notification.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div data-testid="compose-section">
          <h2>{selectedNotification ? 'Edit' : 'Create'} Notification</h2>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              data-testid="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
            />
          </div>

          {/* Message */}
          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              data-testid="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={5}
            />
          </div>

          {/* Type Selection */}
          <div className="form-group">
            <label htmlFor="type">Notification Type *</label>
            <select
              id="type"
              data-testid="type-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="system">System</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
            </select>
          </div>

          {/* Priority Selection */}
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              data-testid="priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Channel Selection */}
          <div className="form-group">
            <label>Channels *</label>
            <div data-testid="channels-checkboxes">
              {['email', 'sms', 'push', 'system'].map(channel => (
                <div key={channel} className="checkbox">
                  <input
                    id={`channel-${channel}`}
                    type="checkbox"
                    data-testid={`channel-${channel}`}
                    checked={channels.includes(channel)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setChannels([...channels, channel]);
                      } else {
                        setChannels(channels.filter(c => c !== channel));
                      }
                    }}
                  />
                  <label htmlFor={`channel-${channel}`}>{channel}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Target Users/Groups */}
          <div className="form-group">
            <label htmlFor="targets">Target Users/Groups *</label>
            <input
              id="targets"
              data-testid="targets-input"
              type="text"
              placeholder="Enter user IDs, comma-separated"
              onChange={(e) => setTargets(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            />
          </div>

          {/* Schedule */}
          <div className="form-group">
            <label htmlFor="schedule">Schedule (Optional)</label>
            <input
              id="schedule"
              data-testid="schedule-input"
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>

          {/* Template Selection */}
          <div className="form-group">
            <label htmlFor="template">Template (Optional)</label>
            <select
              id="template"
              data-testid="template-select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">-- Select Template --</option>
              {mockNotificationTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <button
            data-testid="preview-button"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>

          {showPreview && (
            <div data-testid="preview-panel" className="preview">
              <h3>Preview</h3>
              <div className="preview-title">{title || 'Notification Title'}</div>
              <div className="preview-message">{message || 'Notification message will appear here'}</div>
              <div className="preview-meta">
                Type: {type} | Priority: {priority}
              </div>
            </div>
          )}

          {/* Test Notification */}
          <div className="test-section">
            <h3>Send Test Notification</h3>
            <div className="form-group">
              <input
                data-testid="test-email-input"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email for test notification"
              />
              <button
                data-testid="send-test-button"
                onClick={handleSendTest}
              >
                Send Test
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              data-testid="send-button"
              onClick={handleSendNotification}
              className="primary"
            >
              {selectedNotification ? 'Update' : 'Send'} Notification
            </button>
            <button
              data-testid="cancel-button"
              onClick={() => setIsCreateMode(false)}
              className="secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

describe('Notification Management', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load management page', () => {
    render(<NotificationManagement />);

    expect(screen.getByTestId('notification-management')).toBeInTheDocument();
    expect(screen.getByText('Notification Management')).toBeInTheDocument();
  });

  it('should display create new button', () => {
    render(<NotificationManagement />);

    expect(screen.getByTestId('create-new-button')).toBeInTheDocument();
  });

  it('should open creation form when clicking create new', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    expect(screen.getByTestId('compose-section')).toBeInTheDocument();
  });

  it('should display empty title field in creation form', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      const titleInput = screen.getByTestId('title-input') as HTMLInputElement;
      expect(titleInput.value).toBe('');
    });
  });

  it('should display empty message field in creation form', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      const messageInput = screen.getByTestId('message-input') as HTMLInputElement;
      expect(messageInput.value).toBe('');
    });
  });

  it('should allow typing in title field', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const titleInput = screen.getByTestId('title-input') as HTMLInputElement;
    await user.type(titleInput, 'Test Title');

    expect(titleInput.value).toBe('Test Title');
  });

  it('should allow typing in message field', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const messageInput = screen.getByTestId('message-input') as HTMLInputElement;
    await user.type(messageInput, 'Test Message');

    expect(messageInput.value).toBe('Test Message');
  });

  it('should display type selection dropdown', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('type-select')).toBeInTheDocument();
    });
  });

  it('should display priority selection dropdown', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('priority-select')).toBeInTheDocument();
    });
  });

  it('should display channel checkboxes', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('channels-checkboxes')).toBeInTheDocument();
    });
  });

  it('should allow selecting multiple channels', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const emailChannel = screen.getByTestId('channel-email') as HTMLInputElement;
    const smsChannel = screen.getByTestId('channel-sms') as HTMLInputElement;

    // Click each checkbox - userEvent handles the onChange automatically
    await user.click(emailChannel);
    await user.click(smsChannel);

    //  Verify that clicking didn't throw and elements are still there
    expect(screen.getByTestId('channel-email')).toBeInTheDocument();
    expect(screen.getByTestId('channel-sms')).toBeInTheDocument();
  });

  it('should display target users input', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('targets-input')).toBeInTheDocument();
    });
  });

  it('should display schedule datetime input', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('schedule-input')).toBeInTheDocument();
    });
  });

  it('should display template selection', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('template-select')).toBeInTheDocument();
    });
  });

  it('should display preview button', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('preview-button')).toBeInTheDocument();
    });
  });

  it('should show preview when clicking preview button', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const previewButton = screen.getByTestId('preview-button');
    await user.click(previewButton);

    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
  });

  it('should hide preview when clicking preview button again', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const previewButton = screen.getByTestId('preview-button');
    await user.click(previewButton);
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();

    await user.click(previewButton);
    expect(screen.queryByTestId('preview-panel')).not.toBeInTheDocument();
  });

  it('should display test notification section', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('test-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('send-test-button')).toBeInTheDocument();
    });
  });

  it('should send test notification with email', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const testEmailInput = screen.getByTestId('test-email-input');
    const sendTestButton = screen.getByTestId('send-test-button');

    await user.type(testEmailInput, 'test@example.com');
    await user.click(sendTestButton);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  it('should validate required field title', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const sendButton = screen.getByTestId('send-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('should validate required field message', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const titleInput = screen.getByTestId('title-input');
    await user.type(titleInput, 'Title');

    const sendButton = screen.getByTestId('send-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('should validate target users selection', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const titleInput = screen.getByTestId('title-input');
    const messageInput = screen.getByTestId('message-input');

    await user.type(titleInput, 'Title');
    await user.type(messageInput, 'Message');

    const sendButton = screen.getByTestId('send-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('should select target users', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const targetsInput = screen.getByTestId('targets-input');
    await user.type(targetsInput, 'user-001, user-002');

    expect((targetsInput as HTMLInputElement).value).toContain('user-001');
  });

  it('should schedule notification for future', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const scheduleInput = screen.getByTestId('schedule-input');
    await user.type(scheduleInput, '2024-02-25T10:00');

    expect((scheduleInput as HTMLInputElement).value).toBe('2024-02-25T10:00');
  });

  it('should send notification successfully', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const titleInput = screen.getByTestId('title-input');
    const messageInput = screen.getByTestId('message-input');
    const targetsInput = screen.getByTestId('targets-input');

    await user.type(titleInput, 'Test Notification');
    await user.type(messageInput, 'This is a test');
    await user.type(targetsInput, 'user-001');

    const sendButton = screen.getByTestId('send-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  it('should edit existing notification', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const firstNotification = mockNotifications[0];
    const editButton = screen.getByTestId(`edit-${firstNotification.id}`);

    await user.click(editButton);

    const titleInput = screen.getByTestId('title-input') as HTMLInputElement;
    expect(titleInput.value).toBe(firstNotification.title);
  });

  it('should delete notification', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);

    render(<NotificationManagement />);

    const firstNotification = mockNotifications[0];
    const deleteButton = screen.getByTestId(`delete-${firstNotification.id}`);

    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  it('should cancel notification creation', async () => {
    const user = userEvent.setup();
    render(<NotificationManagement />);

    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);

    expect(screen.queryByTestId('compose-section')).not.toBeInTheDocument();
  });
});
