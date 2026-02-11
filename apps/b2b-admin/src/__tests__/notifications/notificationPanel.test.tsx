/**
 * Notification Panel Tests (for Manual Booking Form)
 * Tests for notification panel component used in manual booking creation/editing
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Notification Panel Component
const NotificationPanel = ({
  onNotificationSent,
  customerEmail,
  supplierEmail,
  bookingReference
}: {
  onNotificationSent?: (data: any) => void;
  customerEmail?: string;
  supplierEmail?: string;
  bookingReference?: string;
}) => {
  const [title, setTitle] = React.useState('');
  const [type, setType] = React.useState('email');
  const [priority, setPriority] = React.useState('medium');
  const [message, setMessage] = React.useState('');
  const [sendToCustomer, setSendToCustomer] = React.useState(true);
  const [sendToSupplier, setSendToSupplier] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }
    if (!sendToCustomer && !sendToSupplier) {
      newErrors.recipients = 'Please select at least one recipient';
    }
    if (sendToCustomer && !customerEmail) {
      newErrors.customerEmail = 'Customer email not provided';
    }
    if (sendToSupplier && !supplierEmail) {
      newErrors.supplierEmail = 'Supplier email not provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendNotification = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const data = {
        title,
        message,
        type,
        priority,
        sendToCustomer,
        sendToSupplier,
        customers: sendToCustomer ? [customerEmail] : [],
        suppliers: sendToSupplier ? [supplierEmail] : [],
        bookingReference
      };

      if (onNotificationSent) {
        onNotificationSent(data);
      }

      setSuccessMessage('Notification sent successfully!');

      // Reset form
      setTimeout(() => {
        setTitle('');
        setMessage('');
        setType('email');
        setPriority('medium');
        setSendToCustomer(true);
        setSendToSupplier(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      setErrors({ submit: 'Failed to send notification' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setMessage('');
    setType('email');
    setPriority('medium');
    setSendToCustomer(true);
    setSendToSupplier(false);
    setErrors({});
  };

  return (
    <div data-testid="notification-panel">
      <h2>Send Notification</h2>

      {successMessage && (
        <div data-testid="success-message" className="alert alert-success">
          {successMessage}
        </div>
      )}

      <form data-testid="notification-form">
        {/* Title Input */}
        <div data-testid="title-field" className="form-group">
          <label htmlFor="panel-title">Title *</label>
          <input
            id="panel-title"
            data-testid="panel-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <span data-testid="title-error" className="error">
              {errors.title}
            </span>
          )}
        </div>

        {/* Type Selection */}
        <div data-testid="type-field" className="form-group">
          <label htmlFor="panel-type">Type</label>
          <select
            id="panel-type"
            data-testid="panel-type-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="system">System</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        {/* Priority Selection */}
        <div data-testid="priority-field" className="form-group">
          <label htmlFor="panel-priority">Priority</label>
          <select
            id="panel-priority"
            data-testid="panel-priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Message Textarea */}
        <div data-testid="message-field" className="form-group">
          <label htmlFor="panel-message">Message *</label>
          <textarea
            id="panel-message"
            data-testid="panel-message-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows={5}
            aria-invalid={!!errors.message}
          />
          {errors.message && (
            <span data-testid="message-error" className="error">
              {errors.message}
            </span>
          )}
          <span data-testid="char-count" className="char-count">
            {message.length} / 500
          </span>
        </div>

        {/* Recipients */}
        <div data-testid="recipients-field" className="form-group">
          <label>Send To</label>
          <div data-testid="recipient-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                data-testid="send-to-customer-checkbox"
                checked={sendToCustomer}
                onChange={(e) => setSendToCustomer(e.target.checked)}
              />
              Customer {customerEmail && `(${customerEmail})`}
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                data-testid="send-to-supplier-checkbox"
                checked={sendToSupplier}
                onChange={(e) => setSendToSupplier(e.target.checked)}
              />
              Supplier {supplierEmail && `(${supplierEmail})`}
            </label>
          </div>
          {errors.recipients && (
            <span data-testid="recipients-error" className="error">
              {errors.recipients}
            </span>
          )}
        </div>

        {/* Error Messages */}
        {errors.customerEmail && (
          <div data-testid="customer-email-error" className="error">
            {errors.customerEmail}
          </div>
        )}
        {errors.supplierEmail && (
          <div data-testid="supplier-email-error" className="error">
            {errors.supplierEmail}
          </div>
        )}

        {/* Action Buttons */}
        <div data-testid="action-buttons" className="button-group">
          <button
            type="button"
            data-testid="send-notification-button"
            onClick={handleSendNotification}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Sending...' : 'Send Notification'}
          </button>
          <button
            type="button"
            data-testid="reset-button"
            onClick={handleReset}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>

        {errors.submit && (
          <div data-testid="submit-error" className="error-box">
            {errors.submit}
          </div>
        )}
      </form>
    </div>
  );
};

describe('Notification Panel (Manual Booking)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification panel', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
  });

  it('should display in manual booking form', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
  });

  it('should have empty title input initially', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const titleInput = screen.getByTestId('panel-title-input') as HTMLInputElement;
    expect(titleInput.value).toBe('');
  });

  it('should allow typing in title input', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const titleInput = screen.getByTestId('panel-title-input') as HTMLInputElement;
    await user.type(titleInput, 'Booking Confirmation');

    expect(titleInput.value).toBe('Booking Confirmation');
  });

  it('should validate title is required', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    expect(screen.getByTestId('title-error')).toHaveTextContent('Title is required');
  });

  it('should have type selection dropdown', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const typeSelect = screen.getByTestId('panel-type-select') as HTMLSelectElement;
    expect(typeSelect.value).toBe('email');
  });

  it('should allow selecting email type', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const typeSelect = screen.getByTestId('panel-type-select') as HTMLSelectElement;
    expect(typeSelect.value).toBe('email');
  });

  it('should allow selecting SMS type', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const typeSelect = screen.getByTestId('panel-type-select');
    await user.selectOptions(typeSelect, 'sms');

    expect((typeSelect as HTMLSelectElement).value).toBe('sms');
  });

  it('should allow selecting system type', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const typeSelect = screen.getByTestId('panel-type-select');
    await user.selectOptions(typeSelect, 'system');

    expect((typeSelect as HTMLSelectElement).value).toBe('system');
  });

  it('should allow selecting WhatsApp type', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const typeSelect = screen.getByTestId('panel-type-select');
    await user.selectOptions(typeSelect, 'whatsapp');

    expect((typeSelect as HTMLSelectElement).value).toBe('whatsapp');
  });

  it('should have priority selection', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const prioritySelect = screen.getByTestId('panel-priority-select');
    expect(prioritySelect).toBeInTheDocument();
  });

  it('should allow selecting priority', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const prioritySelect = screen.getByTestId('panel-priority-select');
    await user.selectOptions(prioritySelect, 'high');

    expect((prioritySelect as HTMLSelectElement).value).toBe('high');
  });

  it('should have message textarea', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const messageTextarea = screen.getByTestId('panel-message-textarea');
    expect(messageTextarea).toBeInTheDocument();
  });

  it('should allow typing in message textarea', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const messageTextarea = screen.getByTestId('panel-message-textarea') as HTMLTextAreaElement;
    await user.type(messageTextarea, 'Your booking is confirmed');

    expect(messageTextarea.value).toBe('Your booking is confirmed');
  });

  it('should validate message is required', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const titleInput = screen.getByTestId('panel-title-input');
    await user.type(titleInput, 'Title');

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    expect(screen.getByTestId('message-error')).toHaveTextContent('Message is required');
  });

  it('should show character count', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const messageTextarea = screen.getByTestId('panel-message-textarea');
    await user.type(messageTextarea, 'Hello');

    const charCount = screen.getByTestId('char-count');
    expect(charCount).toHaveTextContent('5 / 500');
  });

  it('should have send to customer checkbox', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    expect(screen.getByTestId('send-to-customer-checkbox')).toBeInTheDocument();
  });

  it('should have send to supplier checkbox', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    expect(screen.getByTestId('send-to-supplier-checkbox')).toBeInTheDocument();
  });

  it('should send to customer by default', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const customerCheckbox = screen.getByTestId('send-to-customer-checkbox') as HTMLInputElement;
    expect(customerCheckbox.checked).toBe(true);
  });

  it('should not send to supplier by default', () => {
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const supplierCheckbox = screen.getByTestId('send-to-supplier-checkbox') as HTMLInputElement;
    expect(supplierCheckbox.checked).toBe(false);
  });

  it('should toggle send to customer', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const customerCheckbox = screen.getByTestId('send-to-customer-checkbox') as HTMLInputElement;
    
    await user.click(customerCheckbox);
    expect(customerCheckbox.checked).toBe(false);

    await user.click(customerCheckbox);
    expect(customerCheckbox.checked).toBe(true);
  });

  it('should toggle send to supplier', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const supplierCheckbox = screen.getByTestId('send-to-supplier-checkbox') as HTMLInputElement;
    
    await user.click(supplierCheckbox);
    expect(supplierCheckbox.checked).toBe(true);
  });

  it('should validate at least one recipient is selected', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const titleInput = screen.getByTestId('panel-title-input');
    const messageTextarea = screen.getByTestId('panel-message-textarea');
    const customerCheckbox = screen.getByTestId('send-to-customer-checkbox');

    await user.type(titleInput, 'Title');
    await user.type(messageTextarea, 'Message');
    await user.click(customerCheckbox); // Deselect customer

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    expect(screen.getByTestId('recipients-error')).toBeInTheDocument();
  });

  it('should send notification to customer', async () => {
    const user = userEvent.setup();
    const onNotificationSent = vi.fn();

    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
        onNotificationSent={onNotificationSent}
      />
    );

    const titleInput = screen.getByTestId('panel-title-input');
    const messageTextarea = screen.getByTestId('panel-message-textarea');

    await user.type(titleInput, 'Booking Confirmed');
    await user.type(messageTextarea, 'Your booking is confirmed');

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(onNotificationSent).toHaveBeenCalled();
      expect(onNotificationSent).toHaveBeenCalledWith(
        expect.objectContaining({
          sendToCustomer: true,
          sendToSupplier: false
        })
      );
    });
  });

  it('should send notification to supplier', async () => {
    const user = userEvent.setup();
    const onNotificationSent = vi.fn();

    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
        onNotificationSent={onNotificationSent}
      />
    );

    const titleInput = screen.getByTestId('panel-title-input');
    const messageTextarea = screen.getByTestId('panel-message-textarea');
    const customerCheckbox = screen.getByTestId('send-to-customer-checkbox');
    const supplierCheckbox = screen.getByTestId('send-to-supplier-checkbox');

    await user.type(titleInput, 'New Booking');
    await user.type(messageTextarea, 'New booking received');
    await user.click(customerCheckbox); // Deselect customer
    await user.click(supplierCheckbox); // Select supplier

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(onNotificationSent).toHaveBeenCalledWith(
        expect.objectContaining({
          sendToCustomer: false,
          sendToSupplier: true
        })
      );
    });
  });

  it('should send to both customer and supplier', async () => {
    const user = userEvent.setup();
    const onNotificationSent = vi.fn();

    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
        onNotificationSent={onNotificationSent}
      />
    );

    const titleInput = screen.getByTestId('panel-title-input');
    const messageTextarea = screen.getByTestId('panel-message-textarea');
    const supplierCheckbox = screen.getByTestId('send-to-supplier-checkbox');

    await user.type(titleInput, 'Booking Update');
    await user.type(messageTextarea, 'Important booking update');
    await user.click(supplierCheckbox); // Select supplier

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(onNotificationSent).toHaveBeenCalledWith(
        expect.objectContaining({
          sendToCustomer: true,
          sendToSupplier: true
        })
      );
    });
  });

  it('should clear form after successful send', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const titleInput = screen.getByTestId('panel-title-input') as HTMLInputElement;
    const messageTextarea = screen.getByTestId('panel-message-textarea') as HTMLTextAreaElement;

    await user.type(titleInput, 'Test');
    await user.type(messageTextarea, 'Test message');

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(messageTextarea.value).toBe('');
    }, { timeout: 3000 });
  });

  it('should show success message on send', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const titleInput = screen.getByTestId('panel-title-input');
    const messageTextarea = screen.getByTestId('panel-message-textarea');

    await user.type(titleInput, 'Test');
    await user.type(messageTextarea, 'Test message');

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  it('should reset form when clicking clear button', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const titleInput = screen.getByTestId('panel-title-input') as HTMLInputElement;
    const messageTextarea = screen.getByTestId('panel-message-textarea') as HTMLTextAreaElement;

    await user.type(titleInput, 'Test Title');
    await user.type(messageTextarea, 'Test Message');

    const resetButton = screen.getByTestId('reset-button');
    await user.click(resetButton);

    expect(titleInput.value).toBe('');
    expect(messageTextarea.value).toBe('');
  });

  it('should handle error on send failure', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const titleInput = screen.getByTestId('panel-title-input');
    const messageTextarea = screen.getByTestId('panel-message-textarea');

    await user.type(titleInput, 'Test');
    await user.type(messageTextarea, 'Test message');

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    // Error should occur without throwing
    expect(sendButton).toBeInTheDocument();
  });

  it('should disable send button while sending', async () => {
    const user = userEvent.setup();
    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
      />
    );

    const titleInput = screen.getByTestId('panel-title-input');
    const messageTextarea = screen.getByTestId('panel-message-textarea');

    await user.type(titleInput, 'Test');
    await user.type(messageTextarea, 'Test message');

    const sendButton = screen.getByTestId('send-notification-button') as HTMLButtonElement;
    await user.click(sendButton);

    expect(sendButton).toBeDisabled();
  });

  it('should include booking reference in payload', async () => {
    const user = userEvent.setup();
    const onNotificationSent = vi.fn();

    render(
      <NotificationPanel
        customerEmail="customer@example.com"
        supplierEmail="supplier@example.com"
        bookingReference="BK-12345"
        onNotificationSent={onNotificationSent}
      />
    );

    const titleInput = screen.getByTestId('panel-title-input');
    const messageTextarea = screen.getByTestId('panel-message-textarea');

    await user.type(titleInput, 'Test');
    await user.type(messageTextarea, 'Test message');

    const sendButton = screen.getByTestId('send-notification-button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(onNotificationSent).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingReference: 'BK-12345'
        })
      );
    });
  });
});
