import React, { useState, useCallback, useMemo } from 'react'
import * as Icons from 'lucide-react';

const {
  Plus,
  Trash2,
  Play,
  Edit,
  Copy,
  Search
} = Icons as any;
import type { Rule, RuleStatus } from '@/features/rules/types-rule-engine'

// ============================================================================
// RULE BUILDER - MAIN RULE CRUD INTERFACE
// ============================================================================

export interface RuleBuilderProps {
  rules?: RuleItem[]
  onCreate?: (rule: RuleItem) => Promise<void>
  onUpdate?: (rule: RuleItem) => Promise<void>
  onDelete?: (ruleId: string) => Promise<void>
  onExecute?: (ruleId: string) => Promise<void>
  onDuplicate?: (ruleId: string) => Promise<void>
  disabled?: boolean
}

export interface RuleItem extends Rule {
  executionCount?: number
  lastExecuted?: string
  successRate?: number
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rules = [],
  onCreate,
  onUpdate,
  onDelete,
  onExecute,
  onDuplicate,
  disabled = false,
}) => {
  const [ruleList, setRuleList] = useState<RuleItem[]>(rules)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RuleStatus | 'all'>('all')
  const [editingRule, setEditingRule] = useState<RuleItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredRules = useMemo(() => {
    return ruleList.filter((rule) => {
      const matchesSearch =
        rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || rule.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [ruleList, searchTerm, statusFilter])

  const handleCreateRule = useCallback(() => {
    setIsCreating(true)
    setEditingRule(null)
  }, [])

  const handleSaveRule = useCallback(
    async (rule: RuleItem) => {
      setIsSubmitting(true)
      try {
        if (editingRule) {
          await onUpdate?.(rule)
          setRuleList((prev) => prev.map((r) => (r.id === rule.id ? rule : r)))
        } else {
          await onCreate?.(rule)
          setRuleList((prev) => [...prev, rule])
        }
        setIsCreating(false)
        setEditingRule(null)
      } finally {
        setIsSubmitting(false)
      }
    },
    [editingRule, onCreate, onUpdate]
  )

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      if (!confirm('Are you sure you want to delete this rule?')) return

      setIsSubmitting(true)
      try {
        await onDelete?.(ruleId)
        setRuleList((prev) => prev.filter((r) => r.id !== ruleId))
      } finally {
        setIsSubmitting(false)
      }
    },
    [onDelete]
  )

  const handleExecuteRule = useCallback(
    async (ruleId: string) => {
      setIsSubmitting(true)
      try {
        await onExecute?.(ruleId)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onExecute]
  )

  const handleDuplicateRule = useCallback(
    async (ruleId: string) => {
      setIsSubmitting(true)
      try {
        await onDuplicate?.(ruleId)
        // Refresh rules list
      } finally {
        setIsSubmitting(false)
      }
    },
    [onDuplicate]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rule Builder</h2>
          <p className="text-gray-600 mt-1">Create and manage event-driven automation rules</p>
        </div>
        <button
          onClick={handleCreateRule}
          disabled={disabled || isCreating}
          className="
            px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center gap-2
          "
        >
          <Plus size={18} />
          New Rule
        </button>
      </div>

      {/* Rule Form */}
      {isCreating && (
        <RuleForm
          rule={editingRule || undefined}
          onSave={handleSaveRule}
          onCancel={() => {
            setIsCreating(false)
            setEditingRule(null)
          }}
          disabled={isSubmitting}
        />
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search rules by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RuleStatus | 'all')}
          className="
            px-3 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filteredRules.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              {ruleList.length === 0 ? 'No rules created yet' : 'No rules match your search'}
            </p>
            {ruleList.length === 0 && (
              <button
                onClick={handleCreateRule}
                className="text-blue-600 font-medium hover:text-blue-700 mt-2"
              >
                Create your first rule
              </button>
            )}
          </div>
        ) : (
          filteredRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => {
                setEditingRule(rule)
                setIsCreating(true)
              }}
              onDelete={() => handleDeleteRule(rule.id)}
              onExecute={() => handleExecuteRule(rule.id)}
              onDuplicate={() => handleDuplicateRule(rule.id)}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {/* Stats */}
      {ruleList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
          <StatCard
            label="Total Rules"
            value={ruleList.length}
          />
          <StatCard
            label="Active"
            value={ruleList.filter((r) => r.status === 'active').length}
          />
          <StatCard
            label="Avg Success Rate"
            value={`${Math.round(ruleList.reduce((sum, r) => sum + (r.successRate || 0), 0) / ruleList.length)}%`}
          />
          <StatCard
            label="Total Executions"
            value={ruleList.reduce((sum, r) => sum + (r.executionCount || 0), 0).toLocaleString()}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// RULE FORM SUB-COMPONENT
// ============================================================================

interface RuleFormProps {
  rule?: RuleItem
  onSave: (rule: RuleItem) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

const RuleForm: React.FC<RuleFormProps> = ({
  rule,
  onSave,
  onCancel,
  disabled = false,
}) => {
  const [formData, setFormData] = useState<RuleItem>(
    rule || ({
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      category: 'general',
      type: 'simple',
      tags: [],
      status: 'draft',
      priority: 'medium',
      trigger: 'event',
      enabled: false,
      condition: {
        id: `cond-${Date.now()}`,
        type: 'simple',
        field: '',
        operator: 'equals',
        value: '',
      },
      actions: [],
      timeout: 30,
      appliesToEntities: { entityType: 'booking' },
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
    } as RuleItem)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

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
      <h3 className="font-semibold text-gray-900 text-lg">
        {rule ? 'Edit Rule' : 'Create New Rule'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Send notification on high temperature"
            disabled={disabled || isSubmitting}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
            required
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this rule does..."
            rows={3}
            disabled={disabled || isSubmitting}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as RuleStatus })}
            disabled={disabled || isSubmitting}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            disabled={disabled || isSubmitting}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-lg
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

        {/* Execution Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Execution Mode</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'simple' | 'composite' })}
            disabled={disabled || isSubmitting}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
          >
            <option value="sequential">Sequential</option>
            <option value="parallel">Parallel</option>
          </select>
        </div>

        {/* Timeout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (seconds)</label>
          <input
            type="number"
            value={formData.timeout || 30}
            onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
            min="1"
            max="300"
            disabled={disabled || isSubmitting}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
          />
        </div>
      </div>

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
          disabled={disabled || isSubmitting || !formData.name}
          className="
            px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isSubmitting ? 'Saving...' : 'Save Rule'}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// RULE CARD SUB-COMPONENT
// ============================================================================

interface RuleCardProps {
  rule: RuleItem
  onEdit: () => void
  onDelete: () => void
  onExecute: () => void
  onDuplicate: () => void
  disabled?: boolean
}

const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  onEdit,
  onDelete,
  onExecute,
  onDuplicate,
  disabled = false,
}) => {
  const statusColors: Record<RuleStatus, string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-gray-100 text-gray-800',
    draft: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-red-100 text-red-800',
    disabled: 'bg-red-100 text-red-800',
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-purple-100 text-purple-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{rule.name}</h3>
          {rule.description && <p className="text-sm text-gray-600 mt-1">{rule.description}</p>}
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[rule.status]}`}>
            {rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[rule.priority]}`}>
            {rule.priority.charAt(0).toUpperCase() + rule.priority.slice(1)}
          </span>
        </div>
      </div>

      {/* Rule Stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t">
        <div>
          <p className="text-xs text-gray-600">Executions</p>
          <p className="font-semibold text-gray-900">{rule.executionCount || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Success Rate</p>
          <p className="font-semibold text-gray-900">{rule.successRate || 0}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Last Executed</p>
          <p className="font-semibold text-gray-900 text-sm">
            {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t">
        <button
          onClick={onExecute}
          disabled={disabled || rule.status !== 'active'}
          className="
            flex items-center gap-1 px-3 py-1 text-xs font-medium
            text-green-600 border border-green-300 rounded
            hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed
          "
          title={rule.status !== 'active' ? 'Rule must be active to execute' : ''}
        >
          <Play size={14} />
          Execute
        </button>
        <button
          onClick={onEdit}
          disabled={disabled}
          className="
            flex items-center gap-1 px-3 py-1 text-xs font-medium
            text-blue-600 border border-blue-300 rounded
            hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Edit size={14} />
          Edit
        </button>
        <button
          onClick={onDuplicate}
          disabled={disabled}
          className="
            flex items-center gap-1 px-3 py-1 text-xs font-medium
            text-purple-600 border border-purple-300 rounded
            hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Copy size={14} />
          Duplicate
        </button>
        <button
          onClick={onDelete}
          disabled={disabled}
          className="
            flex items-center gap-1 px-3 py-1 text-xs font-medium
            text-red-600 border border-red-300 rounded
            hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed
            ml-auto
          "
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// STAT CARD SUB-COMPONENT
// ============================================================================

interface StatCardProps {
  label: string
  value: number | string
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
    <p className="text-xs text-gray-600 mb-1">{label}</p>
    <p className="text-xl font-bold text-gray-900">{value}</p>
  </div>
)

export default RuleBuilder
