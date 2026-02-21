import React, { useState, useCallback } from 'react'
import * as Icons from 'lucide-react';

const {
  Mail,
  MessageSquare,
  Bell,
  Link,
  Eye,
  Plus,
  Trash2,
  Save,
  X
} = Icons as any;
import type {
  NotificationChannel,
  EmailChannelSettings,
  SMSChannelSettings,
  PushChannelSettings,
  WebhookChannelSettings,
} from '@/features/notifications/types-notification'

// ============================================================================
// NOTIFICATION CHANNEL CONFIGURATOR
// ============================================================================

export interface NotificationChannelConfiguratorProps {
  channels?: NotificationChannelConfig[]
  onSave?: (channels: NotificationChannelConfig[]) => Promise<void>
  onCancel?: () => void
  disabled?: boolean
}

export interface NotificationChannelConfig {
  type: NotificationChannel
  provider: string
  displayName: string
  isActive: boolean
  settings: EmailChannelSettings | SMSChannelSettings | PushChannelSettings | WebhookChannelSettings
  isDefault?: boolean
}

export const NotificationChannelConfigurator: React.FC<NotificationChannelConfiguratorProps> = ({
  channels = [],
  onSave,
  onCancel,
  disabled = false,
}) => {
  const [channelList, setChannelList] = useState<NotificationChannelConfig[]>(channels)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddingChannel, setIsAddingChannel] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddChannel = useCallback(() => {
    setIsAddingChannel(true)
    setEditingId(null)
  }, [])

  const handleSaveChannel = useCallback(
    async (config: NotificationChannelConfig) => {
      setIsSubmitting(true)
      try {
        if (editingId) {
          setChannelList((prev) =>
            prev.map((ch) => (ch.provider === editingId ? config : ch))
          )
        } else {
          setChannelList((prev) => [...prev, config])
        }
        setEditingId(null)
        setIsAddingChannel(false)
      } finally {
        setIsSubmitting(false)
      }
    },
    [editingId]
  )

  const handleDeleteChannel = useCallback((provider: string) => {
    setChannelList((prev) => prev.filter((ch) => ch.provider !== provider))
  }, [])

  const handleSetDefault = useCallback((provider: string) => {
    setChannelList((prev) =>
      prev.map((ch) => ({
        ...ch,
        isDefault: ch.provider === provider,
      }))
    )
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await onSave?.(channelList)
    } finally {
      setIsSubmitting(false)
    }
  }, [channelList, onSave])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Channel Configuration</h2>
          <p className="text-gray-600 mt-1">Configure provider settings for each notification channel</p>
        </div>
        <button
          onClick={handleAddChannel}
          disabled={disabled || isAddingChannel}
          className="
            px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center gap-2
          "
        >
          <Plus size={18} />
          Add Channel
        </button>
      </div>

      {/* Add/Edit Channel Form */}
      {isAddingChannel && (
        <ChannelForm
          onSave={handleSaveChannel}
          onCancel={() => {
            setIsAddingChannel(false)
            setEditingId(null)
          }}
          disabled={isSubmitting}
        />
      )}

      {/* Channel List */}
      <div className="space-y-3">
        {channelList.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600">No channels configured yet</p>
            <button
              onClick={handleAddChannel}
              className="text-blue-600 font-medium hover:text-blue-700 mt-2"
            >
              Configure your first channel
            </button>
          </div>
        ) : (
          channelList.map((channel) => (
            <ChannelCard
              key={channel.provider}
              channel={channel}
              onDelete={() => handleDeleteChannel(channel.provider)}
              onSetDefault={() => handleSetDefault(channel.provider)}
              onEdit={() => {
                setEditingId(channel.provider)
                setIsAddingChannel(true)
              }}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-6 border-t">
        <button
          onClick={onCancel}
          disabled={disabled || isSubmitting}
          className="
            px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium
            hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || channelList.length === 0}
          className="
            px-4 py-2 bg-green-600 text-white rounded-lg font-medium
            hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center gap-2
          "
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// CHANNEL FORM SUB-COMPONENT
// ============================================================================

interface ChannelFormProps {
  channel?: NotificationChannelConfig
  onSave: (channel: NotificationChannelConfig) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

const CHANNEL_TYPES: NotificationChannel[] = ['email', 'sms', 'push', 'webhook']

const CHANNEL_PROVIDERS: Record<NotificationChannel, string[]> = {
  email: ['SendGrid', 'Mailgun', 'AWS SES', 'SMTP', 'Postmark'],
  sms: ['Twilio', 'AWS SNS', 'Vonage'],
  push: ['Firebase Cloud Messaging', 'Apple Push Notification'],
  webhook: [],
  in_app: [],
}

const ChannelForm: React.FC<ChannelFormProps> = ({
  channel,
  onSave,
  onCancel,
  disabled = false,
}) => {
  const getDefaultSettings = (type: NotificationChannel) => {
    switch (type) {
      case 'email':
        return { enabled: true, provider: 'smtp', senderEmail: '', senderName: '' } as EmailChannelSettings
      case 'sms':
        return { enabled: true, provider: 'twilio', accountId: '', authKey: '' } as SMSChannelSettings
      case 'push':
        return { enabled: true, provider: 'firebase', apiKey: '' } as PushChannelSettings
      case 'webhook':
        return { enabled: true, webhooks: [] } as WebhookChannelSettings
      default:
        return {} as any
    }
  }

  const [formData, setFormData] = useState<NotificationChannelConfig>(
    channel || {
      type: 'email',
      provider: '',
      displayName: '',
      isActive: true,
      settings: getDefaultSettings('email'),
      isDefault: false,
    }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.displayName || !formData.provider) return

    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
    >
      <h3 className="font-semibold text-gray-900">
        {channel ? 'Edit Channel' : 'Add New Channel'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Channel Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel Type</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as NotificationChannel,
                provider: '',
              })
            }
            disabled={disabled || isSubmitting}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
          >
            {CHANNEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
          {CHANNEL_PROVIDERS[formData.type].length > 0 ? (
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              disabled={disabled || isSubmitting}
              className="
                w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
              "
            >
              <option value="">Select provider...</option>
              {CHANNEL_PROVIDERS[formData.type].map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="Enter webhook URL"
              disabled={disabled || isSubmitting}
              className="
                w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
              "
            />
          )}
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="e.g., Production Email Service"
          disabled={disabled || isSubmitting}
          className="
            w-full px-3 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
          "
        />
      </div>

      {/* Provider-Specific Settings */}
      <ProviderSettingsSection
        type={formData.type}
        provider={formData.provider}
        settings={formData.settings}
        onSettingsChange={(settings) => setFormData({ ...formData, settings })}
        disabled={disabled || isSubmitting || !formData.provider}
      />

      {/* Active Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          disabled={disabled || isSubmitting}
          className="rounded"
        />
        <span className="text-sm text-gray-700">Active</span>
      </label>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled || isSubmitting}
          className="
            px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium
            hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={disabled || isSubmitting || !formData.displayName || !formData.provider}
          className="
            px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center gap-2
          "
        >
          {isSubmitting ? 'Saving...' : 'Save Channel'}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// PROVIDER SETTINGS SECTION SUB-COMPONENT
// ============================================================================

interface ProviderSettingsSectionProps {
  type: NotificationChannel
  provider: string
  settings: any
  onSettingsChange: (settings: any) => void
  disabled?: boolean
}

const ProviderSettingsSection: React.FC<ProviderSettingsSectionProps> = ({
  type,
  provider,
  settings,
  onSettingsChange,
  disabled = false,
}) => {
  if (!provider) {
    return <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">Select a provider to configure settings</div>
  }

  const renderSettingsFields = () => {
    switch (type) {
      case 'email':
        return (
          <EmailSettingsFields settings={settings} onChange={onSettingsChange} disabled={disabled} />
        )
      case 'sms':
        return (
          <SMSSettingsFields settings={settings} onChange={onSettingsChange} disabled={disabled} />
        )
      case 'push':
        return (
          <PushSettingsFields settings={settings} onChange={onSettingsChange} disabled={disabled} />
        )
      case 'webhook':
        return (
          <WebhookSettingsFields settings={settings} onChange={onSettingsChange} disabled={disabled} />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-700">Provider Settings ({provider})</p>
      {renderSettingsFields()}
    </div>
  )
}

// ============================================================================
// SETTINGS FIELDS SUB-COMPONENTS
// ============================================================================

const EmailSettingsFields: React.FC<{
  settings: any
  onChange: (settings: any) => void
  disabled?: boolean
}> = ({ settings, onChange, disabled }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">API Key / Password</label>
      <input
        type="password"
        placeholder="Enter API key or SMTP password"
        value={settings.apiKey || ''}
        onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">From Email</label>
      <input
        type="email"
        placeholder="noreply@example.com"
        value={settings.fromEmail || ''}
        onChange={(e) => onChange({ ...settings, fromEmail: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">From Name</label>
      <input
        type="text"
        placeholder="Your Company"
        value={settings.fromName || ''}
        onChange={(e) => onChange({ ...settings, fromName: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
  </div>
)

const SMSSettingsFields: React.FC<{
  settings: any
  onChange: (settings: any) => void
  disabled?: boolean
}> = ({ settings, onChange, disabled }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Account SID / API Key</label>
      <input
        type="password"
        placeholder="Enter account SID or API key"
        value={settings.accountSid || ''}
        onChange={(e) => onChange({ ...settings, accountSid: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Auth Token / API Secret</label>
      <input
        type="password"
        placeholder="Enter auth token or API secret"
        value={settings.authToken || ''}
        onChange={(e) => onChange({ ...settings, authToken: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">From Number</label>
      <input
        type="text"
        placeholder="+1234567890"
        value={settings.fromNumber || ''}
        onChange={(e) => onChange({ ...settings, fromNumber: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
  </div>
)

const PushSettingsFields: React.FC<{
  settings: any
  onChange: (settings: any) => void
  disabled?: boolean
}> = ({ settings, onChange, disabled }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Server Key / API Key</label>
      <input
        type="password"
        placeholder="Enter server key"
        value={settings.serverKey || ''}
        onChange={(e) => onChange({ ...settings, serverKey: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Project ID</label>
      <input
        type="text"
        placeholder="Enter project ID"
        value={settings.projectId || ''}
        onChange={(e) => onChange({ ...settings, projectId: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
  </div>
)

const WebhookSettingsFields: React.FC<{
  settings: any
  onChange: (settings: any) => void
  disabled?: boolean
}> = ({ settings, onChange, disabled }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Webhook URL</label>
      <input
        type="text"
        placeholder="https://api.example.com/webhooks/notify"
        value={settings.webhookUrl || ''}
        onChange={(e) => onChange({ ...settings, webhookUrl: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Secret Key (Optional)</label>
      <input
        type="password"
        placeholder="For request signing"
        value={settings.secretKey || ''}
        onChange={(e) => onChange({ ...settings, secretKey: e.target.value })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Timeout (seconds)</label>
      <input
        type="number"
        placeholder="30"
        value={settings.timeoutSeconds || 30}
        onChange={(e) => onChange({ ...settings, timeoutSeconds: parseInt(e.target.value) })}
        disabled={disabled}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
      />
    </div>
  </div>
)

// ============================================================================
// CHANNEL CARD SUB-COMPONENT
// ============================================================================

interface ChannelCardProps {
  channel: NotificationChannelConfig
  onDelete: () => void
  onSetDefault: () => void
  onEdit: () => void
  disabled?: boolean
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onDelete,
  onSetDefault,
  onEdit,
  disabled = false,
}) => {
  const getIcon = () => {
    switch (channel.type) {
      case 'email':
        return <Mail size={20} />
      case 'sms':
        return <MessageSquare size={20} />
      case 'push':
        return <Bell size={20} />
      case 'webhook':
        return <Link size={20} />
      default:
        return null
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-gray-400">{getIcon()}</div>
        <div>
          <p className="font-medium text-gray-900">{channel.displayName}</p>
          <p className="text-sm text-gray-600">
            {channel.provider} • {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)}
          </p>
        </div>
        {channel.isDefault && (
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            Default
          </span>
        )}
        {!channel.isActive && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            Inactive
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!channel.isDefault && (
          <button
            onClick={onSetDefault}
            disabled={disabled}
            className="
              px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded
              hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Set Default
          </button>
        )}
        <button
          onClick={onEdit}
          disabled={disabled}
          className="
            px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded
            hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={disabled || channel.isDefault}
          className="
            p-1 text-red-600 border border-red-300 rounded
            hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed
          "
          title={channel.isDefault ? 'Cannot delete default channel' : ''}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default NotificationChannelConfigurator
