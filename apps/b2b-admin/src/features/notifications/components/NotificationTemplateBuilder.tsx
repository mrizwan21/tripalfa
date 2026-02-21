import React, { useState, useCallback, useMemo } from 'react'
import * as Icons from 'lucide-react';

const {
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
  Settings,
  Filter,
  Search
} = Icons as any;
import type { NotificationTemplate, TemplateVariable, ChannelConfig } from '@/features/notifications/types-notification'

// ============================================================================
// TEMPLATE BUILDER COMPONENT
// ============================================================================

export interface NotificationTemplateBuilderProps {
  template?: Partial<NotificationTemplate>
  onSave?: (template: NotificationTemplate) => Promise<void>
  onCancel?: () => void
  readOnly?: boolean
  disabled?: boolean
}

export const NotificationTemplateBuilder: React.FC<NotificationTemplateBuilderProps> = ({
  template,
  onSave,
  onCancel,
  readOnly = false,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'channels' | 'variables' | 'conditions'>('content')
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.type || 'booking',
    category: template?.category || '',
    subject: template?.subject || '',
    body: template?.body || '',
    htmlBody: template?.htmlBody || '',
    supportedChannels: template?.supportedChannels || ['email'],
    variables: template?.variables || [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = useCallback(async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSave?.({
        id: template?.id || `tmpl-${Date.now()}`,
        ...formData,
        enabled: true,
        archived: false,
        createdAt: template?.createdAt || new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
        tags: [],
        version: (template?.version || 0) + 1,
        channelConfigs: {
          email: { enabled: true, fromAddress: '', fromName: '' },
          sms: { enabled: false, accountId: '', authKey: '' },
          push: { enabled: false, apiKey: '' },
          in_app: { enabled: false },
          webhook: { enabled: false, webhooks: [] },
        },
        defaultPriority: 'medium',
        defaultChannels: formData.supportedChannels,
      } as NotificationTemplate)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, template, onSave])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <p className="text-gray-600 mt-1">Design notification content and delivery channels</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={disabled || readOnly}
              placeholder="Order Confirmation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={disabled || readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category...</option>
              <option value="transactional">Transactional</option>
              <option value="promotional">Promotional</option>
              <option value="informational">Informational</option>
              <option value="alert">Alert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              disabled={disabled || readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="system">System</option>
              <option value="alert">Alert</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={disabled || readOnly}
              placeholder="What is this template for?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {(['content', 'channels', 'variables', 'conditions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-1 py-3 font-medium text-sm border-b-2 transition-all capitalize
                ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              disabled={disabled || readOnly}
              placeholder="Your booking is confirmed - {{orderId}}"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Use &#123;&#123;variableName&#125;&#125; to insert variables</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body Text
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              disabled={disabled || readOnly}
              rows={6}
              placeholder="Thank you for your booking..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTML Body (Optional)
            </label>
            <textarea
              value={formData.htmlBody}
              onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
              disabled={disabled || readOnly}
              rows={6}
              placeholder="<h1>Booking Confirmed</h1>..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>
      )}

      {/* Channels Tab */}
      {activeTab === 'channels' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Supported Channels</h3>
          <div className="space-y-2">
            {['email', 'sms', 'push', 'in_app', 'webhook'].map((channel) => (
              <label key={channel} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.supportedChannels.includes(channel as any)}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      supportedChannels: e.target.checked
                        ? [...formData.supportedChannels, channel as any]
                        : formData.supportedChannels.filter((c) => c !== channel),
                    })
                  }}
                  disabled={disabled || readOnly}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700 capitalize">{channel}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Variables Tab */}
      {activeTab === 'variables' && (
        <VariableEditor
          variables={formData.variables}
          onChange={(vars) => setFormData({ ...formData, variables: vars })}
          disabled={disabled || readOnly}
        />
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          onClick={onCancel}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSubmitting || !formData.name || !formData.subject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? '✓ Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// VARIABLE EDITOR SUB-COMPONENT
// ============================================================================

interface VariableEditorProps {
  variables: TemplateVariable[]
  onChange: (variables: TemplateVariable[]) => void
  disabled: boolean
}

const VariableEditor: React.FC<VariableEditorProps> = ({ variables, onChange, disabled }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newVar, setNewVar] = useState<Partial<TemplateVariable>>({})

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Template Variables</h3>
        <button
          onClick={() => setNewVar({ type: 'string', required: false })}
          disabled={disabled}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
        >
          + Add Variable
        </button>
      </div>

      <div className="space-y-2">
        {variables.map((variable, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg flex justify-between items-start">
            <div className="flex-1">
              <p className="font-mono font-medium text-sm">{'{{'}{variable.name}{'}}}'}</p>
              <p className="text-xs text-gray-600">{variable.description}</p>
              <p className="text-xs text-gray-500 mt-1">Type: {variable.type}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setEditingIndex(index)
                  setNewVar(variable)
                }}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                Edit
              </button>
              <button
                onClick={() => onChange(variables.filter((_, i) => i !== index))}
                className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {(editingIndex !== null || Object.keys(newVar).length > 0) && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">
            {editingIndex !== null ? 'Edit Variable' : 'New Variable'}
          </h4>

          <input
            type="text"
            value={(newVar as any).name || ''}
            onChange={(e) => setNewVar({ ...newVar, name: e.target.value })}
            placeholder="Variable name (e.g., orderId)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            value={(newVar as any).description || ''}
            onChange={(e) => setNewVar({ ...newVar, description: e.target.value })}
            placeholder="What is this variable for?"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={(newVar as any).type || 'string'}
            onChange={(e) => setNewVar({ ...newVar, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
            <option value="json">JSON</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(newVar as any).required === true}
              onChange={(e) => setNewVar({ ...newVar, required: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Required</span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (editingIndex !== null && (newVar as any).name) {
                  const updated = [...variables]
                  updated[editingIndex] = newVar as TemplateVariable
                  onChange(updated)
                } else if ((newVar as any).name) {
                  onChange([...variables, newVar as TemplateVariable])
                }
                setEditingIndex(null)
                setNewVar({})
              }}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Variable
            </button>
            <button
              onClick={() => {
                setEditingIndex(null)
                setNewVar({})
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationTemplateBuilder
