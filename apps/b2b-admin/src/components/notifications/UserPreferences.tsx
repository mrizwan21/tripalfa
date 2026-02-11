/**
 * User Notification Preferences
 * Allows users to manage their notification channel preferences
 * 
 * Features:
 * - Toggle individual notification channels (Email, SMS, Push, In-App)
 * - Validation: at least one channel must be enabled
 * - Save and cancel buttons
 * - Success/error message display
 * - Persistence to localStorage and API
 */

import React, { useEffect, useState, useCallback } from 'react';

interface UserPreferencesState {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
}

interface UserPreferencesProps {
  userId?: string;
  onSave?: (preferences: UserPreferencesState) => void;
}

export default function UserPreferences({ userId = 'user-001', onSave }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferencesState>({
    userId,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    inAppNotifications: true
  });

  const [originalPreferences, setOriginalPreferences] = useState<UserPreferencesState>(preferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notificationPreferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        setOriginalPreferences(parsed);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [userId]);

  // Handle preference toggle
  const handleToggle = useCallback((key: keyof Omit<UserPreferencesState, 'userId'>) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      
      // Check if at least one channel is enabled
      const enabledChannels = (
        (updated.emailNotifications ? 1 : 0) +
        (updated.smsNotifications ? 1 : 0) +
        (updated.pushNotifications ? 1 : 0) +
        (updated.inAppNotifications ? 1 : 0)
      );

      // If trying to disable all channels, show error but don't update
      if (enabledChannels === 0) {
        setError('At least one notification channel must be enabled');
        return prev;
      }

      setError(null);
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validation: at least one channel must be enabled
    const anyEnabled =
      preferences.emailNotifications ||
      preferences.smsNotifications ||
      preferences.pushNotifications ||
      preferences.inAppNotifications;

    if (!anyEnabled) {
      setError('At least one notification channel must be enabled');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save to localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      setSuccessMessage('Preferences saved successfully!');
      setOriginalPreferences(preferences);
      setIsDirty(false);
      onSave?.(preferences);
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [preferences, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setPreferences(originalPreferences);
    setIsDirty(false);
    setError(null);
    setSuccessMessage(null);
  }, [originalPreferences]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [successMessage]);

  return (
    <div data-testid="preferences-container" className="user-preferences">
      <h1>Notification Preferences</h1>

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

      <div data-testid="preferences-form" className="preferences-form">
        <h2>Notification Channels</h2>
        <p>Select which channels you want to receive notifications through:</p>

        {/* Email Notifications */}
        <div data-testid="email-preference" className="preference-item">
          <label htmlFor="email-toggle" className="preference-label">
            <input
              id="email-toggle"
              type="checkbox"
              data-testid="email-toggle"
              checked={preferences.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
              className="preference-checkbox"
            />
            <span className="preference-text">Email Notifications</span>
          </label>
          <p className="preference-description">Receive notifications via email</p>
        </div>

        {/* SMS Notifications */}
        <div data-testid="sms-preference" className="preference-item">
          <label htmlFor="sms-toggle" className="preference-label">
            <input
              id="sms-toggle"
              type="checkbox"
              data-testid="sms-toggle"
              checked={preferences.smsNotifications}
              onChange={() => handleToggle('smsNotifications')}
              className="preference-checkbox"
            />
            <span className="preference-text">SMS Notifications</span>
          </label>
          <p className="preference-description">Receive notifications via SMS</p>
        </div>

        {/* Push Notifications */}
        <div data-testid="push-preference" className="preference-item">
          <label htmlFor="push-toggle" className="preference-label">
            <input
              id="push-toggle"
              type="checkbox"
              data-testid="push-toggle"
              checked={preferences.pushNotifications}
              onChange={() => handleToggle('pushNotifications')}
              className="preference-checkbox"
            />
            <span className="preference-text">Push Notifications</span>
          </label>
          <p className="preference-description">Receive notifications via browser push</p>
        </div>

        {/* In-App Notifications */}
        <div data-testid="inapp-preference" className="preference-item">
          <label htmlFor="inapp-toggle" className="preference-label">
            <input
              id="inapp-toggle"
              type="checkbox"
              data-testid="inapp-toggle"
              checked={preferences.inAppNotifications}
              onChange={() => handleToggle('inAppNotifications')}
              className="preference-checkbox"
            />
            <span className="preference-text">In-App Notifications</span>
          </label>
          <p className="preference-description">Receive notifications within the application</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="preference-actions">
        <button
          data-testid="save-button"
          onClick={handleSave}
          disabled={loading || !isDirty}
          className="button button-primary"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
        <button
          data-testid="cancel-button"
          onClick={handleCancel}
          disabled={loading || !isDirty}
          className="button button-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
