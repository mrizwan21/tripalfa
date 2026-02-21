import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotificationPreferences } from '@/hooks/useNotifications';

interface PreferencesForm {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  offlineRequestUpdates: boolean;
  priceDropAlerts: boolean;
  bookingReminders: boolean;
  promotionalEmails: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export const NotificationPreferences = () => {
  const { preferences, isLoading, error, updatePreferences } =
    useNotificationPreferences();

  const [form, setForm] = useState<PreferencesForm>({
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    offlineRequestUpdates: true,
    priceDropAlerts: true,
    bookingReminders: true,
    promotionalEmails: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: 'UTC',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setForm({
        emailEnabled: preferences.emailEnabled ?? true,
        smsEnabled: preferences.smsEnabled ?? true,
        pushEnabled: preferences.pushEnabled ?? true,
        offlineRequestUpdates: preferences.offlineRequestUpdates ?? true,
        priceDropAlerts: preferences.priceDropAlerts ?? true,
        bookingReminders: preferences.bookingReminders ?? true,
        promotionalEmails: preferences.promotionalEmails ?? false,
        quietHoursStart: preferences.quietHoursStart || '22:00',
        quietHoursEnd: preferences.quietHoursEnd || '08:00',
        timezone: preferences.timezone || 'UTC',
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof PreferencesForm) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTimeChange = (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTimezoneChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      timezone: value,
    }));
  };

  const handleSave = async () => {
    setSaveStatus('idle');
    setIsSaving(true);

    try {
      await updatePreferences(form);
      setSaveStatus('success');
      setSaveMessage('Preferences saved successfully');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const timezones = [
    { value: 'UTC', label: 'UTC / GMT' },
    { value: 'EST', label: 'Eastern Time (EST)' },
    { value: 'CST', label: 'Central Time (CST)' },
    { value: 'MST', label: 'Mountain Time (MST)' },
    { value: 'PST', label: 'Pacific Time (PST)' },
    { value: 'IST', label: 'India Standard Time (IST)' },
    { value: 'SGT', label: 'Singapore Time (SGT)' },
    { value: 'AEST', label: 'Australian Eastern (AEST)' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-gray-600 mt-1">
          Customize how and when you receive notifications from TripAlfa
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose which communication channels you want to receive notifications on
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600 mt-1">
                Receive important updates and alerts via email
              </p>
            </div>
            <Switch
              checked={form.emailEnabled}
              onCheckedChange={() => handleToggle('emailEnabled')}
            />
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h4 className="font-medium text-gray-900">SMS Notifications</h4>
              <p className="text-sm text-gray-600 mt-1">
                Receive urgent notifications via text message
              </p>
            </div>
            <Switch
              checked={form.smsEnabled}
              onCheckedChange={() => handleToggle('smsEnabled')}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h4 className="font-medium text-gray-900">Push Notifications</h4>
              <p className="text-sm text-gray-600 mt-1">
                Receive instant notifications in your browser
              </p>
            </div>
            <Switch
              checked={form.pushEnabled}
              onCheckedChange={() => handleToggle('pushEnabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Select which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Offline Request Updates */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h4 className="font-medium text-gray-900">Offline Request Updates</h4>
              <p className="text-sm text-gray-600 mt-1">
                Status updates on your offline booking requests
              </p>
            </div>
            <Switch
              checked={form.offlineRequestUpdates}
              onCheckedChange={() => handleToggle('offlineRequestUpdates')}
            />
          </div>

          {/* Price Drop Alerts */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h4 className="font-medium text-gray-900">Price Drop Alerts</h4>
              <p className="text-sm text-gray-600 mt-1">
                Be notified when prices drop for your saved searches
              </p>
            </div>
            <Switch
              checked={form.priceDropAlerts}
              onCheckedChange={() => handleToggle('priceDropAlerts')}
            />
          </div>

          {/* Booking Reminders */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h4 className="font-medium text-gray-900">Booking Reminders</h4>
              <p className="text-sm text-gray-600 mt-1">
                Reminders before your flight departures and check-ins
              </p>
            </div>
            <Switch
              checked={form.bookingReminders}
              onCheckedChange={() => handleToggle('bookingReminders')}
            />
          </div>

          {/* Promotional Emails */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h4 className="font-medium text-gray-900">Promotional Offers</h4>
              <p className="text-sm text-gray-600 mt-1">
                Receive special deals and promotional offers
              </p>
            </div>
            <Switch
              checked={form.promotionalEmails}
              onCheckedChange={() => handleToggle('promotionalEmails')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set times when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Notifications will not be sent between your quiet hours. Urgent notifications may
            still be sent.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quiet Hours Start</label>
              <input
                type="time"
                value={form.quietHoursStart || '22:00'}
                onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quiet Hours End</label>
              <input
                type="time"
                value={form.quietHoursEnd || '08:00'}
                onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <Select value={form.timezone || 'UTC'} onValueChange={handleTimezoneChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          <Save className="w-4 h-4" />
          Save Preferences
        </Button>
      </div>

      {/* Info Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-medium text-blue-900 mb-2">💡 Tip</h4>
          <p className="text-sm text-blue-800">
            You can update these preferences at any time. Changes take effect immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
