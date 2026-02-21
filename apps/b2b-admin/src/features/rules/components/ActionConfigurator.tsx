import React, { useState, useCallback } from 'react'
import * as Icons from 'lucide-react';

const {
  Plus,
  Trash2,
  Copy
} = Icons as any;
import type { RuleAction, ActionType } from '@/features/rules/types-rule-engine'

// ============================================================================
// ACTION CONFIGURATOR - ACTION SETUP WITH DYNAMIC FIELDS
// ============================================================================

export interface ActionConfiguratorProps {
  actions?: ActionItem[]
  onActionsChange?: (actions: ActionItem[]) => void
  executionMode?: 'sequential' | 'parallel'
  disabled?: boolean
}

export interface ActionItem extends RuleAction {
  id: string
}

const ACTION_TYPES: ActionType[] = [
  'send_notification',
  'create_ticket',
  'update_record',
  'call_webhook',
  'send_email',
  'send_sms',
  'assign_user',
  'change_status',
  'add_tag',
  'trigger_workflow',
  'execute_sql',
  'log_event',
  'create_alert',
]

export const ActionConfigurator: React.FC<ActionConfiguratorProps> = ({
  actions = [],
  onActionsChange,
  executionMode = 'sequential',
  disabled = false,
}) => {
  const [actionList, setActionList] = useState<ActionItem[]>(actions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddingAction, setIsAddingAction] = useState(false)

  const handleAddAction = useCallback(() => {
    setIsAddingAction(true)
    setEditingId(null)
  }, [])

  const handleSaveAction = useCallback(
    (action: ActionItem) => {
      let updated: ActionItem[] = []

      if (editingId) {
        updated = actionList.map((a) => (a.id === editingId ? action : a))
      } else {
        updated = [...actionList, action]
      }

      setActionList(updated)
      onActionsChange?.(updated)
      setIsAddingAction(false)
      setEditingId(null)
    },
    [actionList, editingId, onActionsChange]
  )

  const handleDeleteAction = useCallback(
    (id: string) => {
      const updated = actionList.filter((a) => a.id !== id)
      setActionList(updated)
      onActionsChange?.(updated)
    },
    [actionList, onActionsChange]
  )

  const handleDuplicateAction = useCallback(
    (id: string) => {
      const action = actionList.find((a) => a.id === id)
      if (!action) return

      const newAction: ActionItem = {
        ...action,
        id: `action-${Date.now()}`,
        order: action.order + 1,
      }

      const updated = actionList.map((a) => (a.order >= newAction.order ? { ...a, order: a.order + 1 } : a))
      updated.push(newAction)

      setActionList(updated)
      onActionsChange?.(updated)
    },
    [actionList, onActionsChange]
  )

  const handleReorderAction = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const index = actionList.findIndex((a) => a.id === id)
      if (index === -1) return

      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= actionList.length) return

      const updated = [...actionList]
      ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]

      updated.forEach((a, i) => (a.order = i))
      setActionList(updated)
      onActionsChange?.(updated)
    },
    [actionList, onActionsChange]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Action Configuration</h2>
          <p className="text-gray-600 mt-1">Define actions to execute when condition matches</p>
          {executionMode === 'sequential' && (
            <p className="text-xs text-gray-500 mt-1">Execution: Sequential (one after another)</p>
          )}
          {executionMode === 'parallel' && (
            <p className="text-xs text-gray-500 mt-1">Execution: Parallel (all at once)</p>
          )}
        </div>
        <button
          onClick={handleAddAction}
          disabled={disabled || isAddingAction}
          className="
            px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center gap-2
          "
        >
          <Plus size={18} />
          Add Action
        </button>
      </div>

      {/* Action Form */}
      {isAddingAction && (
        <ActionForm
          action={editingId ? actionList.find((a) => a.id === editingId) : undefined}
          onSave={handleSaveAction}
          onCancel={() => {
            setIsAddingAction(false)
            setEditingId(null)
          }}
          disabled={disabled}
          maxOrder={actionList.length}
        />
      )}

      {/* Actions List */}
      <div className="space-y-3">
        {actionList.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600">No actions configured yet</p>
            <button
              onClick={handleAddAction}
              className="text-blue-600 font-medium hover:text-blue-700 mt-2"
            >
              Add your first action
            </button>
          </div>
        ) : (
          actionList
            .sort((a, b) => a.order - b.order)
            .map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                index={index}
                totalActions={actionList.length}
                onEdit={() => {
                  setEditingId(action.id)
                  setIsAddingAction(true)
                }}
                onDelete={() => handleDeleteAction(action.id)}
                onDuplicate={() => handleDuplicateAction(action.id)}
                onMoveUp={() => handleReorderAction(action.id, 'up')}
                onMoveDown={() => handleReorderAction(action.id, 'down')}
                disabled={disabled}
              />
            ))
        )}
      </div>

      {/* Summary */}
      {actionList.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">{actionList.length}</span> action
            {actionList.length !== 1 ? 's' : ''} configured • Execution mode:{' '}
            <span className="font-semibold capitalize">{executionMode}</span>
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ACTION FORM SUB-COMPONENT
// ============================================================================

interface ActionFormProps {
  action?: ActionItem
  onSave: (action: ActionItem) => void
  onCancel: () => void
  disabled?: boolean
  maxOrder?: number
}

const ActionForm: React.FC<ActionFormProps> = ({
  action,
  onSave,
  onCancel,
  disabled = false,
  maxOrder = 0,
}) => {
  const [formData, setFormData] = useState<ActionItem>(
    action || ({
      id: `action-${Date.now()}`,
      type: 'send_notification',
      order: maxOrder,
      async: false,
      maxRetries: 0,
      config: {},
    } as ActionItem)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      onSave(formData)
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
        {action ? 'Edit Action' : 'Create New Action'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action Type *</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as ActionType,
                config: {},
              })
            }
            disabled={disabled || isSubmitting}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
            required
          >
            {ACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Enabled Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={formData.async}
              onChange={(e) => setFormData({ ...formData, async: e.target.checked })}
              disabled={disabled || isSubmitting}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Enabled</span>
          </div>
        </div>
      </div>

      {/* Type-Specific Configuration */}
      <ActionConfigSection
        type={formData.type}
        config={formData.config}
        onConfigChange={(config) => setFormData({ ...formData, config })}
        disabled={disabled || isSubmitting}
      />

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
          disabled={disabled || isSubmitting}
          className="
            px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isSubmitting ? 'Saving...' : 'Save Action'}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// ACTION CONFIG SECTION SUB-COMPONENT
// ============================================================================

interface ActionConfigSectionProps {
  type: ActionType
  config: any
  onConfigChange: (config: any) => void
  disabled?: boolean
}

const ActionConfigSection: React.FC<ActionConfigSectionProps> = ({
  type,
  config,
  onConfigChange,
  disabled = false,
}) => {
  const renderConfigFields = () => {
    switch (type) {
      case 'send_notification':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template ID</label>
              <input
                type="text"
                placeholder="e.g., template-123"
                value={config.templateId || ''}
                onChange={(e) => onConfigChange({ ...config, templateId: e.target.value })}
                disabled={disabled}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channels</label>
              <input
                type="text"
                placeholder="email, sms, push (comma-separated)"
                value={config.channels || ''}
                onChange={(e) => onConfigChange({ ...config, channels: e.target.value })}
                disabled={disabled}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                "
              />
            </div>
          </div>
        )

      case 'create_ticket':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Title</label>
              <input
                type="text"
                placeholder="e.g., High Temperature Alert"
                value={config.title || ''}
                onChange={(e) => onConfigChange({ ...config, title: e.target.value })}
                disabled={disabled}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={config.priority || 'medium'}
                onChange={(e) => onConfigChange({ ...config, priority: e.target.value })}
                disabled={disabled}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                "
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        )

      case 'call_webhook':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input
                type="url"
                placeholder="https://api.example.com/webhook"
                value={config.webhookUrl || ''}
                onChange={(e) => onConfigChange({ ...config, webhookUrl: e.target.value })}
                disabled={disabled}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (seconds)</label>
              <input
                type="number"
                placeholder="30"
                value={config.timeout || 30}
                onChange={(e) => onConfigChange({ ...config, timeout: parseInt(e.target.value) })}
                disabled={disabled}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                "
              />
            </div>
          </div>
        )

      case 'execute_sql':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SQL Query</label>
              <textarea
                placeholder="SELECT * FROM table WHERE ..."
                value={config.query || ''}
                onChange={(e) => onConfigChange({ ...config, query: e.target.value })}
                rows={4}
                disabled={disabled}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                "
              />
            </div>
          </div>
        )

      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Email</label>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={config.toEmail || ''}
                onChange={(e) => onConfigChange({ ...config, toEmail: e.target.value })}
                disabled={disabled}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                placeholder="Email subject"
                value={config.subject || ''}
                onChange={(e) => onConfigChange({ ...config, subject: e.target.value })}
                disabled={disabled}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                "
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            Configure action type '{type}' settings
          </div>
        )
    }
  }

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-700">
        Configuration ({type.replace(/_/g, ' ')})
      </p>
      {renderConfigFields()}
    </div>
  )
}

// ============================================================================
// ACTION CARD SUB-COMPONENT
// ============================================================================

interface ActionCardProps {
  action: ActionItem
  index: number
  totalActions: number
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  disabled?: boolean
}

const ActionCard: React.FC<ActionCardProps> = ({
  action,
  index,
  totalActions,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  disabled = false,
}) => {
  const typeLabel = action.type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveUp}
            disabled={disabled || index === 0}
            className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            ▲
          </button>
          <span className="text-sm font-medium text-gray-600 text-center">{index + 1}</span>
          <button
            onClick={onMoveDown}
            disabled={disabled || index === totalActions - 1}
            className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            ▼
          </button>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{typeLabel}</p>
            {action.async && (
              <span className="px-2 py-1 bg-blue-200 text-blue-600 text-xs rounded">
                Async
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {JSON.stringify(action.config)
              .substring(0, 60)
              .replace(/[{}":]/g, '')
              .replace(/,/g, ' • ')}
            {JSON.stringify(action.config).length > 60 ? '...' : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          disabled={disabled}
          className="
            px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded
            hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Edit
        </button>
        <button
          onClick={onDuplicate}
          disabled={disabled}
          className="
            p-1 text-purple-600 border border-purple-300 rounded
            hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Copy size={16} />
        </button>
        <button
          onClick={onDelete}
          disabled={disabled}
          className="
            p-1 text-red-600 border border-red-300 rounded
            hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default ActionConfigurator
