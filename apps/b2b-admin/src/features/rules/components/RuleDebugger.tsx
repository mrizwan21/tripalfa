import React, { useState, useCallback, useMemo } from 'react'
import * as Icons from 'lucide-react';

const {
  Play,
  Pause,
  RotateCcw,
  ChevronDown
} = Icons as any;
import type { RuleDebugSession, RuleCondition, DebugLog } from '@/features/rules/types-rule-engine'

// ============================================================================
// RULE DEBUGGER - STEP-THROUGH DEBUGGING INTERFACE
// ============================================================================

export interface RuleDebuggerProps {
  ruleName?: string
  onDebugStart?: (sampleData: any) => Promise<any>
  onDebugStop?: () => Promise<void>
  disabled?: boolean
}

export interface DebugStep {
  stepId: string
  type: 'condition_evaluation' | 'action_execution' | 'condition_check'
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  duration?: number
  result?: any
  error?: string
}

export const RuleDebugger: React.FC<RuleDebuggerProps> = ({
  ruleName = 'Rule',
  onDebugStart,
  onDebugStop,
  disabled = false,
}) => {
  const [isDebugging, setIsDebugging] = useState(false)
  const [sampleData, setSampleData] = useState<string>('{}')
  const [debugSession, setDebugSession] = useState<any>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [isRunning, setIsRunning] = useState(false)

  const handleStartDebug = useCallback(async () => {
    try {
      const data = JSON.parse(sampleData)
      setIsRunning(true)
      const session = await onDebugStart?.(data)
      setDebugSession(session || null)
      setIsDebugging(true)
    } catch (err) {
      alert('Invalid JSON input')
    } finally {
      setIsRunning(false)
    }
  }, [sampleData, onDebugStart])

  const handleStopDebug = useCallback(async () => {
    await onDebugStop?.()
    setIsDebugging(false)
    setDebugSession(null)
  }, [onDebugStop])

  const handleReset = useCallback(() => {
    setSampleData('{}')
    setDebugSession(null)
    setIsDebugging(false)
    setExpandedSteps(new Set())
  }, [])

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const conditionEvals = useMemo(() => {
    return debugSession?.conditionEvaluationSteps || []
  }, [debugSession])

  const actionSimulations = useMemo(() => {
    return debugSession?.actionSimulations || []
  }, [debugSession])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rule Debugger</h2>
          <p className="text-gray-600 mt-1">Step-through debugging for {ruleName}</p>
        </div>
        <div className="flex gap-2">
          {!isDebugging && (
            <button
              onClick={handleStartDebug}
              disabled={disabled || isRunning}
              className="
                px-4 py-2 bg-green-600 text-white rounded-lg font-medium
                hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center gap-2
              "
            >
              <Play size={18} />
              {isRunning ? 'Starting...' : 'Start Debug'}
            </button>
          )}
          {isDebugging && (
            <>
              <button
                onClick={handleStopDebug}
                disabled={disabled}
                className="
                  px-4 py-2 bg-red-600 text-white rounded-lg font-medium
                  hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors flex items-center gap-2
                "
              >
                <Pause size={18} />
                Stop Debug
              </button>
              <button
                onClick={handleReset}
                disabled={disabled}
                className="
                  px-4 py-2 bg-gray-600 text-white rounded-lg font-medium
                  hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors flex items-center gap-2
                "
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sample Data Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Sample Data</h3>
        <p className="text-xs text-gray-600 mb-2">Provide sample data to test rule condition evaluation:</p>
        <textarea
          value={sampleData}
          onChange={(e) => setSampleData(e.target.value)}
          disabled={disabled || isDebugging}
          rows={6}
          placeholder={'{\n  "temperature": 45,\n  "userId": "user-123"\n}'}
          className="
            w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
          "
        />
      </div>

      {/* Debug Session Results */}
      {debugSession && (
        <div className="space-y-4">
          {/* Session Header */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">Debug Session Active</p>
                <p className="text-sm text-blue-700 mt-1">
                  Session ID: {debugSession.sessionId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">
                  Duration: {debugSession.duration}ms
                </p>
                <p className={`text-xs font-semibold mt-1 ${
                  debugSession.overallStatus === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {debugSession.overallStatus.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Condition Evaluation Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Condition Evaluation</h3>
            {conditionEvals.length === 0 ? (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">No condition evaluations</p>
            ) : (
              conditionEvals.map((step: any, idx: number) => (
                <DebugStepCard
                  key={idx}
                  step={step}
                  isExpanded={expandedSteps.has(`condition-${idx}`)}
                  onToggle={() => toggleStep(`condition-${idx}`)}
                />
              ))
            )}
          </div>

          {/* Action Simulations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Action Simulations</h3>
            {actionSimulations.length === 0 ? (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">No action simulations</p>
            ) : (
              actionSimulations.map((simulation: any, idx: number) => (
                <ActionSimulationCard
                  key={idx}
                  simulation={simulation}
                  isExpanded={expandedSteps.has(`action-${idx}`)}
                  onToggle={() => toggleStep(`action-${idx}`)}
                />
              ))
            )}
          </div>

          {/* Debug Logs */}
          {debugSession.debugLogs && debugSession.debugLogs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Debug Logs</h3>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
                {debugSession.debugLogs.map((log: any, idx: number) => (
                  <DebugLogLine key={idx} log={log} />
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard
              label="Total Steps"
              value={conditionEvals.length + actionSimulations.length}
            />
            <SummaryCard
              label="Condition Result"
              value={debugSession.conditionResult ? 'Matched' : 'Not Matched'}
              color={debugSession.conditionResult ? 'green' : 'red'}
            />
            <SummaryCard
              label="Actions Simulated"
              value={actionSimulations.length}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// DEBUG STEP CARD SUB-COMPONENT
// ============================================================================

interface DebugStepCardProps {
  step: any
  isExpanded: boolean
  onToggle: () => void
}

const DebugStepCard: React.FC<DebugStepCardProps> = ({ step, isExpanded, onToggle }) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="
          w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors
          text-left
        "
      >
        <ChevronDown
          size={18}
          className={`transition-transform text-gray-400 flex-shrink-0 ${
            isExpanded ? '' : '-rotate-90'
          }`}
        />
        <div className="flex-1">
          <p className="font-medium text-gray-900">{step.description}</p>
          <p className="text-xs text-gray-600 mt-1">{step.field || 'Condition'}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[step.status]}`}>
          {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
        </span>
        {step.duration && <span className="text-xs text-gray-600">{step.duration}ms</span>}
      </button>

      {isExpanded && (
        <div className="border-t bg-gray-50 p-4 space-y-2">
          <DetailRow label="Operator" value={step.operator} />
          <DetailRow label="Expected" value={step.expectedValue} />
          <DetailRow label="Actual" value={step.actualValue} />
          {step.error && (
            <DetailRow label="Error" value={step.error} color="red" />
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ACTION SIMULATION CARD SUB-COMPONENT
// ============================================================================

interface ActionSimulationCardProps {
  simulation: any
  isExpanded: boolean
  onToggle: () => void
}

const ActionSimulationCard: React.FC<ActionSimulationCardProps> = ({
  simulation,
  isExpanded,
  onToggle,
}) => {
  const statusColors: Record<string, string> = {
    'would-execute': 'bg-blue-100 text-blue-800',
    'would-skip': 'bg-gray-100 text-gray-800',
    'would-fail': 'bg-red-100 text-red-800',
    simulated: 'bg-green-100 text-green-800',
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="
          w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors
          text-left
        "
      >
        <ChevronDown
          size={18}
          className={`transition-transform text-gray-400 flex-shrink-0 ${
            isExpanded ? '' : '-rotate-90'
          }`}
        />
        <div className="flex-1">
          <p className="font-medium text-gray-900">{simulation.actionType}</p>
          <p className="text-xs text-gray-600 mt-1">Action #{simulation.order}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          statusColors[simulation.simulationStatus] || statusColors['simulated']
        }`}>
          {simulation.simulationStatus.replace(/_/g, ' ')}
        </span>
        {simulation.duration && <span className="text-xs text-gray-600">{simulation.duration}ms</span>}
      </button>

      {isExpanded && (
        <div className="border-t bg-gray-50 p-4 space-y-2">
          <DetailRow label="Type" value={simulation.actionType} />
          <DetailRow label="Status" value={simulation.simulationStatus} />
          {simulation.simulatedOutput && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">Output:</p>
              <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(simulation.simulatedOutput, null, 2)}
              </pre>
            </div>
          )}
          {simulation.error && (
            <DetailRow label="Error" value={simulation.error} color="red" />
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// DEBUG LOG LINE SUB-COMPONENT
// ============================================================================

interface DebugLogLineProps {
  log: DebugLog
}

const DebugLogLine: React.FC<DebugLogLineProps> = ({ log }) => {
  const levelColors: Record<string, string> = {
    info: 'text-blue-300',
    warn: 'text-yellow-300',
    error: 'text-red-300',
    debug: 'text-gray-400',
  }

  return (
    <div className={levelColors[log.level] || 'text-gray-300'}>
      <span className="text-gray-600">[{log.timestamp.toString()}]</span> {log.message}
    </div>
  )
}

// ============================================================================
// DETAIL ROW SUB-COMPONENT
// ============================================================================

interface DetailRowProps {
  label: string
  value: any
  color?: 'default' | 'red' | 'green'
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, color = 'default' }) => {
  const colorClass = {
    default: 'text-gray-600',
    red: 'text-red-600',
    green: 'text-green-600',
  }[color]

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}:</span>
      <span className={`text-sm font-mono ${colorClass}`}>
        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </span>
    </div>
  )
}

// ============================================================================
// SUMMARY CARD SUB-COMPONENT
// ============================================================================

interface SummaryCardProps {
  label: string
  value: string | number
  color?: 'default' | 'green' | 'red'
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color = 'default' }) => {
  const bgColors = {
    default: 'bg-white',
    green: 'bg-green-50',
    red: 'bg-red-50',
  }
  const textColors = {
    default: 'text-gray-900',
    green: 'text-green-900',
    red: 'text-red-900',
  }

  return (
    <div className={`${bgColors[color]} border border-gray-200 rounded-lg p-3 text-center`}>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`text-lg font-bold ${textColors[color]}`}>{value}</p>
    </div>
  )
}

export default RuleDebugger
