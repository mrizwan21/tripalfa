/**
 * Notification Management Page
 * Dashboard for creating, editing, and managing notifications
 * 
 * Features:
 * - List view: display all notifications with edit/delete buttons
 * - Create new mode: show compose form
 * - Edit mode: populate form with notification data
 * - Delete with confirmation
 * - Compose notification inline
 */

import React, { useState, useCallback } from 'react';
import { mockNotifications } from '../../__mocks__/fixtures';

interface Notification {
  id: string;
  userId: string;
  type: 'email' | 'sms' | 'push' | 'system' | 'whatsapp';
  title: string;
  message: string;
  status: 'sent' | 'pending' | 'failed' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  channels: string[];
  deliveryStatus: Record<string, string>;
}

export function NotificationManagement() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>(['email']);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState('');
  const [priority, setPriority] = useState('medium');
  const [type, setType] = useState('system');
  const [templateId, setTemplateId] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setMessage('');
    setTargets([]);
    setChannels(['email']);
    setSchedule('');
    setPriority('medium');
    setType('system');
    setTemplateId('');
    setTestEmail('');
    setShowPreview(false);
  }, []);

  const handleCreateNew = useCallback(() => {
    setIsCreateMode(true);
    setSelectedNotification(null);
    resetForm();
    setError(null);
    setSuccessMessage(null);
  }, [resetForm]);

  const handleEdit = useCallback((notification: Notification) => {
    setIsCreateMode(true);
    setSelectedNotification(notification);
    setTitle(notification.title);
    setMessage(notification.message);
    setPriority(notification.priority);
    setChannels(notification.channels);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setSuccessMessage('Notification deleted successfully');
    }
  }, []);

  const handleSendNotification = useCallback(async () => {
    setError(null);

    // Validate form
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
    if (type !== 'system' && channels.length === 0) {
      setError('Please select at least one channel');
      return;
    }

    try {
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        userId: targets[0] || 'system',
        type: type as any,
        title,
        message,
        status: schedule ? 'pending' : 'sent',
        priority: priority as any,
        createdAt: new Date().toISOString(),
        channels: channels.length > 0 ? channels : ['system'],
        deliveryStatus: (channels.length > 0 ? channels : ['system']).reduce((acc: Record<string, string>, ch: string) => {
          acc[ch] = schedule ? 'pending' : 'sent';
          return acc;
        }, {})
      };

      setNotifications(prev => [newNotification, ...prev]);
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
  }, [title, message, targets, type, channels, priority, schedule, resetForm]);

  const handleSendTest = useCallback(async () => {
    if (!testEmail.trim()) {
      setError('Please enter a test email');
      return;
    }

    setSuccessMessage(`Test notification sent to ${testEmail}`);
    setTestEmail('');
  }, []);

  return (
    <div data-testid="notification-management" className="notification-management">
      <h1>Notification Management</h1>

      {error && (
        <div data-testid="error-message" className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div data-testid="success-message" className="alert alert-success" role="status">
          {successMessage}
        </div>
      )}

      {!isCreateMode ? (
        <div data-testid="notifications-list-section" className="list-section">
          <div className="header">
            <h2>All Notifications</h2>
            <button
              data-testid="create-new-button"
              onClick={handleCreateNew}
              className="btn btn-primary"
            >
              + Create New Notification
            </button>
          </div>

          <div data-testid="notifications-list" className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  data-testid={`notification-item-${notification.id}`}
                  className="notification-item"
                >
                  <div className="notification-info">
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                    <div className="meta">
                      <span className="type badge">{notification.type}</span>
                      <span className="status badge">{notification.status}</span>
                      <span className="priority badge">{notification.priority}</span>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      data-testid={`edit-${notification.id}`}
                      onClick={() => handleEdit(notification)}
                      className="btn btn-sm btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      data-testid={`delete-${notification.id}`}
                      onClick={() => handleDelete(notification.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div data-testid="compose-section" className="compose-section">
          <div className="compose-header">
            <h2>{selectedNotification ? 'Edit' : 'Create'} Notification</h2>
            <button
              data-testid="close-compose"
              onClick={() => {
                setIsCreateMode(false);
                resetForm();
              }}
              className="btn btn-sm"
            >
              ← Back
            </button>
          </div>

          <div className="compose-form">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                data-testid="title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                placeholder="Enter notification title"
                className="input"
              />
            </div>

            {/* Message */}
            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                data-testid="message-input"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError(null);
                }}
                placeholder="Enter notification message"
                rows={5}
                className="input textarea"
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
                className="select"
              >
                <option value="system">System</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
                <option value="whatsapp">WhatsApp</option>
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
                className="select"
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
              <div data-testid="channels-checkboxes" className="checkboxes">
                {['email', 'sms', 'push', 'system'].map(channel => (
                  <div key={channel} className="checkbox">
                    <input
                      id={`channel-${channel}`}
                      type="checkbox"
                      data-testid={`channel-${channel}`}
                      checked={channels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setChannels(prev => [...prev, channel]);
                        } else {
                          setChannels(prev => prev.filter(c => c !== channel));
                        }
                      }}
                      className="checkbox-input"
                    />
                    <label htmlFor={`channel-${channel}`} className="checkbox-label">{channel}</label>
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
                placeholder="Enter user IDs, comma-separated (e.g., user-001, user-002)"
                onChange={(e) => setTargets(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="input"
              />
              {targets.length > 0 && (
                <div className="targets-list">
                  {targets.map(t => (
                    <span key={t} className="badge badge-info">{t}</span>
                  ))}
                </div>
              )}
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
                className="input"
              />
            </div>

            {/* Preview Toggle */}
            <div className="form-group">
              <button
                data-testid="toggle-preview"
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-sm btn-secondary"
              >
                {showPreview ? '✓ Hide Preview' : 'Preview'}
              </button>
            </div>

            {/* Preview */}
            {showPreview && (
              <div data-testid="preview-pane" className="preview-pane">
                <h3>Preview</h3>
                <div className="preview-content">
                  <h4>{title || '(Title)'}</h4>
                  <p>{message || '(Message)'}</p>
                  <div className="preview-meta">
                    <span>Type: {type}</span>
                    <span>Priority: {priority}</span>
                    <span>Channels: {channels.length > 0 ? channels.join(', ') : 'None'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Test Email */}
            <div className="form-group">
              <label htmlFor="test-email">Send Test Notification</label>
              <div className="form-row">
                <input
                  id="test-email"
                  data-testid="test-email-input"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email for test"
                  className="input"
                />
                <button
                  data-testid="send-test-button"
                  onClick={handleSendTest}
                  className="btn btn-secondary"
                >
                  Send Test
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="compose-actions">
            <button
              data-testid="send-button"
              onClick={handleSendNotification}
              className="btn btn-primary"
            >
              {schedule ? 'Schedule Notification' : 'Send Notification'}
            </button>
            <button
              data-testid="draft-button"
              onClick={() => {
                setSuccessMessage('Notification saved as draft');
                setIsCreateMode(false);
                resetForm();
              }}
              className="btn btn-secondary"
            >
              Save as Draft
            </button>
            <button
              data-testid="cancel-button"
              onClick={() => {
                setIsCreateMode(false);
                resetForm();
              }}
              className="btn btn-tertiary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
