import React, { useState, useCallback, useMemo } from 'react'
import * as Icons from 'lucide-react';

const {
  Plus,
  Trash2,
  ChevronDown
} = Icons as any;
import type { RuleCondition, ConditionOperator } from '@/features/rules/types-rule-engine'

// ============================================================================
// CONDITION EDITOR - VISUAL CONDITION BUILDER
// ============================================================================

export interface ConditionEditorProps {
  condition?: RuleCondition
  onConditionChange?: (condition: RuleCondition) => void
  availableFields?: string[]
  disabled?: boolean
}

const CONDITION_OPERATORS: ConditionOperator[] = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_equal',
  'less_equal',
  'in',
  'not_in',
  'exists',
  'not_exists',
  'regex',
  'between',
  'matches',
  'any_of',
  'all_of',
]

const LOGIC_OPERATORS = ['AND', 'OR', 'XOR'] as const

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  condition = { type: 'simple', field: '', operator: 'equals', value: '' },
  onConditionChange,
  availableFields = [],
  disabled = false,
}) => {
  const [conditionData, setConditionData] = useState<RuleCondition>({
    ...condition,
    id: condition.id || `cond-${Date.now()}`,
  })
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['root']))

  const handleConditionChange = useCallback(
    (updated: RuleCondition) => {
      setConditionData(updated)
      onConditionChange?.(updated)
    },
    [onConditionChange]
  )

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Condition Builder</h3>
        <button
          onClick={() =>
            handleConditionChange({
              id: `cond-${Date.now()}-group`,
              type: 'group',
              logic: 'AND',
              conditions: [conditionData],
            })
          }
          disabled={disabled}
          className="
            px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded
            hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          + Add Group
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <ConditionNode
          condition={conditionData}
          nodeId="root"
          onConditionChange={handleConditionChange}
          availableFields={availableFields}
          isExpanded={expandedGroups.has('root')}
          onToggleExpand={() => toggleGroup('root')}
          disabled={disabled}
          isRoot
        />
      </div>

      {/* Condition Preview */}
      <ConditionPreview condition={conditionData} />
    </div>
  )
}

// ============================================================================
// CONDITION NODE SUB-COMPONENT (Recursive)
// ============================================================================

interface ConditionNodeProps {
  condition: RuleCondition
  nodeId: string
  onConditionChange: (condition: RuleCondition) => void
  availableFields: string[]
  isExpanded: boolean
  onToggleExpand: () => void
  disabled?: boolean
  isRoot?: boolean
}

const ConditionNode: React.FC<ConditionNodeProps> = ({
  condition,
  nodeId,
  onConditionChange,
  availableFields,
  isExpanded,
  onToggleExpand,
  disabled = false,
  isRoot = false,
}) => {
  if (condition.type === 'simple') {
    return (
      <SimpleCondition
        condition={condition as any}
        onConditionChange={onConditionChange}
        availableFields={availableFields}
        disabled={disabled}
      />
    )
  }

  if (condition.type === 'group') {
    return (
      <GroupCondition
        condition={condition as any}
        nodeId={nodeId}
        onConditionChange={onConditionChange}
        availableFields={availableFields}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        disabled={disabled}
        isRoot={isRoot}
      />
    )
  }

  return null
}

// ============================================================================
// SIMPLE CONDITION SUB-COMPONENT
// ============================================================================

interface SimpleConditionProps {
  condition: RuleCondition & { type: 'simple' }
  onConditionChange: (condition: RuleCondition) => void
  availableFields: string[]
  disabled?: boolean
}

const SimpleCondition: React.FC<SimpleConditionProps> = ({
  condition,
  onConditionChange,
  availableFields,
  disabled = false,
}) => {
  const doesNotNeedValue = ['exists', 'not_exists']

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">Field</label>
        <select
          value={condition.field}
          onChange={(e) =>
            onConditionChange({
              ...condition,
              field: e.target.value,
            })
          }
          disabled={disabled}
          className="
            w-full px-2 py-1 border border-gray-300 rounded text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
          "
        >
          <option value="">Select field...</option>
          {availableFields.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
        <select
          value={condition.operator}
          onChange={(e) =>
            onConditionChange({
              ...condition,
              operator: e.target.value as ConditionOperator,
            })
          }
          disabled={disabled}
          className="
            w-full px-2 py-1 border border-gray-300 rounded text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
          "
        >
          {CONDITION_OPERATORS.map((op) => (
            <option key={op} value={op}>
              {op.replace(/_/g, ' ').charAt(0).toUpperCase() + op.replace(/_/g, ' ').slice(1)}
            </option>
          ))}
        </select>
      </div>

      {!doesNotNeedValue.includes(condition.operator || 'equals') && (
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
          <input
            type="text"
            value={condition.value || ''}
            onChange={(e) =>
              onConditionChange({
                ...condition,
                value: e.target.value,
              })
            }
            placeholder="Enter value..."
            disabled={disabled}
            className="
              w-full px-2 py-1 border border-gray-300 rounded text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// GROUP CONDITION SUB-COMPONENT
// ============================================================================

interface GroupConditionProps {
  condition: RuleCondition & { type: 'group' }
  nodeId: string
  onConditionChange: (condition: RuleCondition) => void
  availableFields: string[]
  isExpanded: boolean
  onToggleExpand: () => void
  disabled?: boolean
  isRoot?: boolean
}

const GroupCondition: React.FC<GroupConditionProps> = ({
  condition,
  nodeId,
  onConditionChange,
  availableFields,
  isExpanded,
  onToggleExpand,
  disabled = false,
  isRoot = false,
}) => {
  const handleAddCondition = useCallback(() => {
    const newCondition: RuleCondition = {
      id: `cond-${Date.now()}`,
      type: 'simple',
      field: '',
      operator: 'equals',
      value: '',
    }

    onConditionChange({
      ...condition,
      conditions: [...(condition.conditions || []), newCondition],
    })
  }, [condition, onConditionChange])

  const handleRemoveCondition = useCallback(
    (index: number) => {
      onConditionChange({
        ...condition,
        conditions: condition.conditions?.filter((_, i) => i !== index) || [],
      })
    },
    [condition, onConditionChange]
  )

  const handleUpdateCondition = useCallback(
    (index: number, updated: RuleCondition) => {
      onConditionChange({
        ...condition,
        conditions: condition.conditions?.map((c, i) => (i === index ? updated : c)) || [],
      })
    },
    [condition, onConditionChange]
  )

  return (
    <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          disabled={disabled}
        >
          <ChevronDown
            size={18}
            className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
          />
          <span className="font-medium">
            {isRoot ? 'Root Condition' : 'Condition Group'}
          </span>
        </button>
        {!isRoot && (
          <button
            onClick={() => onConditionChange({ id: `cond-${Date.now()}`, type: 'simple', field: '', operator: 'equals', value: '' })}
            disabled={disabled}
            className="
              px-2 py-1 text-xs font-medium text-red-600 border border-red-300 rounded
              hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Remove Group
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-medium text-gray-600">Logic:</span>
            <div className="flex gap-1">
              {LOGIC_OPERATORS.map((op) => (
                <button
                  key={op}
                  onClick={() =>
                    onConditionChange({
                      ...condition,
                      logic: op,
                    })
                  }
                  className={`
                    px-3 py-1 text-xs font-medium rounded border
                    transition-colors
                    ${
                      condition.logic === op
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }
                  `}
                  disabled={disabled}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-conditions */}
          <div className="space-y-2">
            {condition.conditions?.map((subCondition, index) => (
              <div key={index} className="space-y-2 p-2 bg-white rounded border border-gray-200">
                <ConditionNode
                  condition={subCondition}
                  nodeId={`${nodeId}-${index}`}
                  onConditionChange={(updated) => handleUpdateCondition(index, updated)}
                  availableFields={availableFields}
                  isExpanded={true}
                  onToggleExpand={() => {}}
                  disabled={disabled}
                />
                {condition.conditions && condition.conditions.length > 1 && (
                  <button
                    onClick={() => handleRemoveCondition(index)}
                    disabled={disabled}
                    className="
                      w-full px-2 py-1 text-xs font-medium text-red-600 border border-red-300 rounded
                      hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    Remove Condition
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleAddCondition}
            disabled={disabled}
            className="
              w-full px-3 py-2 border border-dashed border-blue-300 rounded
              text-blue-600 font-medium text-sm hover:bg-blue-50
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            "
          >
            + Add Condition
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CONDITION PREVIEW SUB-COMPONENT
// ============================================================================

interface ConditionPreviewProps {
  condition: RuleCondition
}

const ConditionPreview: React.FC<ConditionPreviewProps> = ({ condition }) => {
  const preview = useMemo(() => {
    if (condition.type === 'simple') {
      const operator = (condition.operator as string).replace(/_/g, ' ')
      return `${condition.field} ${operator} ${condition.value}`
    }

    if (condition.type === 'group') {
      const subPreviews = (condition.conditions || []).map((c) => {
        if (c.type === 'simple') {
          const operator = (c.operator as string).replace(/_/g, ' ')
          return `${c.field} ${operator} ${c.value}`
        }
        return '(...)'
      })

      return `(${subPreviews.join(` ${condition.logic} `)})`
    }

    return ''
  }, [condition])

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-xs font-medium text-blue-900">Condition Preview:</p>
      <p className="font-mono text-sm text-blue-800 mt-1">{preview}</p>
    </div>
  )
}

export default ConditionEditor
