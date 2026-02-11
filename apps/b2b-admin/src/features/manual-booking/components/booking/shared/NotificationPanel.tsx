import React, { useState, useCallback } from 'react';
import { Bell, Send } from 'lucide-react';

interface NotificationPanelProps {
  customerEmail?: string;
  customerId?: string;
  supplierEmail?: string;
  bookingReference?: string;
  onNotificationSent?: (data: any) => void;
}

interface FormErrors {
  title?: string;
  message?: string;
  recipients?: string;
  customerEmail?: string;
  supplierEmail?: string;
  submit?: string;
  [key: string]: string | undefined;
}

export function NotificationPanel({
  customerEmail = '',
  customerId = '',
  supplierEmail = '',
  bookingReference = '',
  onNotificationSent
}: NotificationPanelProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('email');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [sendToCustomer, setSendToCustomer] = useState(true);
  const [sendToSupplier, setSendToSupplier] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }
    if (message.length > 500) {
      newErrors.message = 'Message cannot exceed 500 characters';
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
  }, [title, message, sendToCustomer, sendToSupplier, customerEmail, supplierEmail]);

  const handleSendNotification = useCallback(async () => {
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
        setErrors({});
      }, 2000);
    } catch (error) {
      setErrors({ submit: 'Failed to send notification' });
    } finally {
      setIsLoading(false);
    }
  }, [title, message, type, priority, sendToCustomer, sendToSupplier, customerEmail, supplierEmail, bookingReference, validateForm, onNotificationSent]);

  const handleReset = useCallback(() => {
    setTitle('');
    setMessage('');
    setType('email');
    setPriority('medium');
    setSendToCustomer(true);
    setSendToSupplier(false);
    setErrors({});
    setSuccessMessage('');
  }, []);

  return (
    <div data-testid="notification-panel" className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Bell size={20} className="text-blue-600" />
        Send Notification
      </h2>

      {successMessage && (
        <div data-testid="success-message" className="alert alert-success mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          {successMessage}
        </div>
      )}

      <form data-testid="notification-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSendNotification(); }}>
        {/* Title Input */}
        <div data-testid="title-field" className="form-group">
          <label htmlFor="panel-title" className="block text-sm font-bold mb-2">Title *</label>
          <input
            id="panel-title"
            data-testid="panel-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            aria-invalid={!!errors.title}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && (
            <span data-testid="title-error" className="error text-red-600 text-sm mt-1 block">
              {errors.title}
            </span>
          )}
        </div>

        {/* Type Selection */}
        <div data-testid="type-field" className="form-group">
          <label htmlFor="panel-type" className="block text-sm font-bold mb-2">Type</label>
          <select
            id="panel-type"
            data-testid="panel-type-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="system">System</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        {/* Priority Selection */}
        <div data-testid="priority-field" className="form-group">
          <label htmlFor="panel-priority" className="block text-sm font-bold mb-2">Priority</label>
          <select
            id="panel-priority"
            data-testid="panel-priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Message Textarea */}
        <div data-testid="message-field" className="form-group">
          <label htmlFor="panel-message" className="block text-sm font-bold mb-2">Message *</label>
          <textarea
            id="panel-message"
            data-testid="panel-message-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows={5}
            aria-invalid={!!errors.message}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.message && (
            <span data-testid="message-error" className="error text-red-600 text-sm mt-1 block">
              {errors.message}
            </span>
          )}
          <span data-testid="char-count" className="char-count text-xs text-gray-500 mt-1 block">
            {message.length} / 500
          </span>
        </div>

        {/* Recipients */}
        <div data-testid="recipients-field" className="form-group">
          <label className="block text-sm font-bold mb-2">Send To</label>
          <div data-testid="recipient-checkboxes" className="space-y-2">
            <label className="checkbox-label flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                data-testid="send-to-customer-checkbox"
                checked={sendToCustomer}
                onChange={(e) => setSendToCustomer(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">
                Customer {customerEmail && `(${customerEmail})`}
              </span>
            </label>
            <label className="checkbox-label flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                data-testid="send-to-supplier-checkbox"
                checked={sendToSupplier}
                onChange={(e) => setSendToSupplier(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">
                Supplier {supplierEmail && `(${supplierEmail})`}
              </span>
            </label>
          </div>
          {errors.recipients && (
            <span data-testid="recipients-error" className="error text-red-600 text-sm mt-1 block">
              {errors.recipients}
            </span>
          )}
        </div>

        {/* Error Messages */}
        {errors.customerEmail && (
          <div data-testid="customer-email-error" className="error text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
            {errors.customerEmail}
          </div>
        )}
        {errors.supplierEmail && (
          <div data-testid="supplier-email-error" className="error text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
            {errors.supplierEmail}
          </div>
        )}

        {/* Action Buttons */}
        <div data-testid="action-buttons" className="button-group flex gap-3 pt-4">
          <button
            type="button"
            data-testid="send-notification-button"
            onClick={handleSendNotification}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {isLoading ? 'Sending...' : 'Send Notification'}
          </button>
          <button
            type="button"
            data-testid="reset-button"
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold disabled:bg-gray-300"
          >
            Clear
          </button>
        </div>

        {errors.submit && (
          <div data-testid="submit-error" className="error-box text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
            {errors.submit}
          </div>
        )}
      </form>
    </div>
  );
}
