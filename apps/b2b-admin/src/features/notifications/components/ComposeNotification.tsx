import React, { useState, useCallback } from 'react';
import { notificationsApi } from '@/components/notifications/notificationsApi';
import { mockNotificationTemplates } from '@/__mocks__/fixtures';

interface ComposeNotificationProps {
  onSubmit?: (data: any) => void;
  onNotificationSent?: (id: string) => void;
}

interface FormState {
  title: string;
  message: string;
  type: string;
  priority: string;
  channels: string[];
  selectedUsers: string[];
  selectedGroups: string[];
  schedule: string;
  isDraft: boolean;
  templateId: string;
}

interface FormErrors {
  title?: string;
  message?: string;
  channels?: string;
  targets?: string;
  submit?: string;
  [key: string]: string | undefined;
}

export function ComposeNotification({ onSubmit, onNotificationSent }: ComposeNotificationProps) {
  const [formData, setFormData] = useState<FormState>({
    title: '',
    message: '',
    type: 'system',
    priority: 'medium',
    channels: [],
    selectedUsers: [],
    selectedGroups: [],
    schedule: '',
    isDraft: false,
    templateId: ''
  });

  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [substitutedMessage, setSubstitutedMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    if (formData.type !== 'system' && formData.channels.length === 0) {
      newErrors.channels = 'At least one channel must be selected';
    }
    if (formData.selectedUsers.length === 0 && formData.selectedGroups.length === 0) {
      newErrors.targets = 'Select at least one user or group';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleTemplateSelect = useCallback((id: string) => {
    const template = mockNotificationTemplates.find(t => t.id === id);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId: id,
        title: template.subject || template.name,
        message: template.body || ''
      }));
    }
  }, []);

  const handleSubstituteVariables = useCallback((message: string) => {
    let substituted = message;
    const regex = /\{\{(\w+)\}\}/g;
    substituted = substituted.replace(regex, (match, variable) => {
      const sampleValues: Record<string, string> = {
        customerName: 'John Doe',
        bookingId: 'BK-12345',
        hotelName: 'Sample Hotel',
        checkInDate: '2024-02-15',
        paymentDeadline: '2024-02-10'
      };
      return sampleValues[variable] || match;
    });
    setSubstitutedMessage(substituted);
    return substituted;
  }, []);

  const handlePreviewToggle = useCallback(() => {
    setShowPreview(!showPreview);
    if (!showPreview && formData.message) {
      handleSubstituteVariables(formData.message);
    }
  }, [showPreview, formData.message, handleSubstituteVariables]);

  const handleSend = useCallback(async (asDraft?: boolean, asSchedule?: boolean) => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const messageToSend = substitutedMessage || formData.message;
      
      const notificationData = {
        title: formData.title,
        message: messageToSend,
        userIds: formData.selectedUsers,
        type: formData.type,
        channels: formData.channels,
        priority: formData.priority,
        ...(formData.schedule && { schedule: formData.schedule }),
        ...(formData.templateId && { template: formData.templateId })
      };

      if (onSubmit) {
        onSubmit(notificationData);
      }

      // Simulate API call
      await notificationsApi.sendNotification(notificationData as any);

      const successMsg = asDraft
        ? 'Notification saved as draft'
        : asSchedule
        ? 'Notification scheduled successfully'
        : 'Notification sent successfully';

      setSuccessMessage(successMsg);

      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: '',
          message: '',
          type: 'system',
          priority: 'medium',
          channels: [],
          selectedUsers: [],
          selectedGroups: [],
          schedule: '',
          isDraft: false,
          templateId: ''
        });
        setSuccessMessage('');
        setErrors({});
        setShowPreview(false);
      }, 2000);
    } catch (error) {
      setErrors({ submit: 'Failed to send notification' });
    } finally {
      setLoading(false);
    }
  }, [formData, substitutedMessage, validateForm, onSubmit]);

  const handleReset = useCallback(() => {
    setFormData({
      title: '',
      message: '',
      type: 'system',
      priority: 'medium',
      channels: [],
      selectedUsers: [],
      selectedGroups: [],
      schedule: '',
      isDraft: false,
      templateId: ''
    });
    setErrors({});
    setSuccessMessage('');
    setShowPreview(false);
  }, []);

  return (
    <div data-testid="compose-container" className="w-full max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Compose Notification</h1>

      {successMessage && (
        <div data-testid="success-alert" className="alert alert-success mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          {successMessage}
        </div>
      )}

      <form data-testid="compose-form" className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
        {/* Title Field */}
        <div data-testid="title-field" className="form-group">
          <label htmlFor="title" className="block text-sm font-bold mb-2">Title *</label>
          <input
            id="title"
            data-testid="title-input"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter notification title"
            aria-invalid={!!errors.title}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && (
            <span data-testid="title-error" className="error text-red-600 text-sm mt-1 block">
              {errors.title}
            </span>
          )}
        </div>

        {/* Message Field */}
        <div data-testid="message-field" className="form-group">
          <label htmlFor="message" className="block text-sm font-bold mb-2">Message *</label>
          <textarea
            id="message"
            data-testid="message-input"
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Enter notification message"
            rows={6}
            aria-invalid={!!errors.message}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.message && (
            <span data-testid="message-error" className="error text-red-600 text-sm mt-1 block">
              {errors.message}
            </span>
          )}
        </div>

        {/* Type Selection */}
        <div data-testid="type-field" className="form-group">
          <label htmlFor="type" className="block text-sm font-bold mb-2">Type</label>
          <select
            id="type"
            data-testid="type-select"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="system">System</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        {/* Priority Selection */}
        <div data-testid="priority-field" className="form-group">
          <label htmlFor="priority" className="block text-sm font-bold mb-2">Priority</label>
          <select
            id="priority"
            data-testid="priority-select"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Channel Selection */}
        <div data-testid="channels-field" className="form-group">
          <label className="block text-sm font-bold mb-2">Channels *</label>
          <div data-testid="channels-checkboxes" className="space-y-2">
            {['email', 'sms', 'push', 'system'].map(channel => (
              <label key={channel} className="checkbox-label flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid={`channel-${channel}`}
                  checked={formData.channels.includes(channel)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, channels: [...prev.channels, channel] }));
                    } else {
                      setFormData(prev => ({ ...prev, channels: prev.channels.filter(c => c !== channel) }));
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="capitalize text-sm">{channel}</span>
              </label>
            ))}
          </div>
          {errors.channels && (
            <span data-testid="channels-error" className="error text-red-600 text-sm mt-1 block">
              {errors.channels}
            </span>
          )}
        </div>

        {/* User Selection */}
        <div data-testid="users-field" className="form-group">
          <label htmlFor="selected-users" className="block text-sm font-bold mb-2">Select Users</label>
          <input
            id="selected-users"
            data-testid="users-input"
            type="text"
            placeholder="Enter user IDs (comma-separated)"
            onChange={(e) => setFormData(prev => ({ ...prev, selectedUsers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Group Selection */}
        <div data-testid="groups-field" className="form-group">
          <label htmlFor="selected-groups" className="block text-sm font-bold mb-2">Select Groups</label>
          <input
            id="selected-groups"
            data-testid="groups-input"
            type="text"
            placeholder="Enter group IDs (comma-separated)"
            onChange={(e) => setFormData(prev => ({ ...prev, selectedGroups: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {errors.targets && (
          <span data-testid="targets-error" className="error text-red-600 text-sm block">
            {errors.targets}
          </span>
        )}

        {/* Template Selection */}
        <div data-testid="template-field" className="form-group">
          <label htmlFor="template" className="block text-sm font-bold mb-2">Use Template</label>
          <select
            id="template"
            data-testid="template-select"
            value={formData.templateId}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- No Template --</option>
            {mockNotificationTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Template Variables Info */}
        {formData.templateId && (
          <div data-testid="template-variables-info" className="info-box p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <strong className="text-blue-900">Template variables detected:</strong>
            <ul className="mt-2 list-disc list-inside text-sm text-blue-800">
              <li>{'{{'}<span className="font-mono">customerName</span>{'}}'}</li>
              <li>{'{{'}<span className="font-mono">bookingId</span>{'}}'}</li>
              <li>{'{{'}<span className="font-mono">hotelName</span>{'}}'}</li>
            </ul>
          </div>
        )}

        {/* Schedule */}
        <div data-testid="schedule-field" className="form-group">
          <label htmlFor="schedule" className="block text-sm font-bold mb-2">Schedule (Optional)</label>
          <input
            id="schedule"
            data-testid="schedule-input"
            type="datetime-local"
            value={formData.schedule}
            onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Preview Section */}
        <div className="section">
          <button
            type="button"
            data-testid="preview-button"
            onClick={handlePreviewToggle}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>

          {showPreview && (
            <div data-testid="preview-content" className="preview-box mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
              <div className="preview-section mb-4">
                <h4 className="font-bold text-sm">Title:</h4>
                <p data-testid="preview-title" className="text-sm">{formData.title || '(empty)'}</p>
              </div>
              <div className="preview-section mb-4">
                <h4 className="font-bold text-sm">Message:</h4>
                <p data-testid="preview-message" className="text-sm">
                  {substitutedMessage || formData.message || '(empty)'}
                </p>
              </div>
              <div className="preview-meta text-xs text-gray-600 space-y-1">
                <span>Type: {formData.type}</span>
                <span>Priority: {formData.priority}</span>
                <span>Channels: {formData.channels.length > 0 ? formData.channels.join(', ') : 'none'}</span>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Action Buttons */}
      <div data-testid="action-buttons" className="button-group mt-6 flex gap-3 flex-wrap">
        <button
          data-testid="send-button"
          onClick={() => handleSend(false, false)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400"
        >
          Send Notification
        </button>
        <button
          data-testid="draft-button"
          onClick={() => handleSend(true, false)}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold disabled:bg-gray-400"
        >
          Save as Draft
        </button>
        <button
          data-testid="schedule-button"
          onClick={() => handleSend(false, true)}
          disabled={!formData.schedule || loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:bg-gray-400"
        >
          Schedule Only
        </button>
        <button
          data-testid="reset-button"
          onClick={handleReset}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold disabled:bg-gray-400"
        >
          Reset
        </button>
      </div>

      {errors.submit && (
        <div data-testid="submit-error" className="error-box mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {errors.submit}
        </div>
      )}
    </div>
  );
}
