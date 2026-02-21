/**
 * Rule Engine Service - Backend Integration Layer
 *
 * Handles:
 * - Creating and managing automation rules
 * - Executing rules with debugging
 * - Performance analysis and conflict detection
 * - Execution history and tracking
 * - Rule versioning and snapshots
 */

import type {
  Rule,
  RuleStatus,
  RuleExecution,
  RuleCondition,
  RuleAction,
  RuleConflictAnalysis,
  RuleImpactAnalysis,
} from '@/features/rules/types-rule-engine'

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface CreateRuleRequest {
  name: string
  description?: string
  category: string
  triggerEvent?: string
  condition: RuleCondition
  actions: RuleAction[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  enabled?: boolean
  maxExecutionsPerDay?: number
  timeout?: number
}

export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {
  status?: RuleStatus
}

export interface ExecuteRuleRequest {
  ruleId: string
  data: Record<string, any>
  userId?: string
  testMode?: boolean
}

export interface ExecuteRuleResponse {
  executionId: string
  ruleId: string
  status: 'success' | 'failed' | 'timeout' | 'skipped'
  conditionMet: boolean
  actionsExecuted: number
  actionsFailed: number
  duration: number
  outputs: Array<{
    actionId: string
    status: 'success' | 'failed'
    result?: any
    error?: string
  }>
  timestamp: Date
}

export interface DebugRuleRequest {
  ruleId: string
  condition?: RuleCondition
  sampleData: Record<string, any>
  includeActions?: boolean
}

export interface DebugRuleResponse {
  conditionEvals: Array<{
    step: number
    operator: string
    field: string
    value: any
    result: boolean
  }>
  actionSimulations: Array<{
    actionId: string
    actionType: string
    willExecute: boolean
    simulatedOutput?: any
  }>
  logs: Array<{
    level: 'info' | 'warn' | 'error'
    timestamp: Date
    message: string
  }>
}

export interface RuleAnalysisRequest {
  ruleId: string
}

export interface RuleAnalysisResponse {
  ruleId: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  impactAnalysis: RuleImpactAnalysis
  conflictAnalysis: RuleConflictAnalysis
  performance: {
    estimatedExecutionTime: number
    averageExecutionTime: number
    timeoutRisk: number
  }
  recommendations: string[]
}

export interface RuleExecutionHistory {
  executionId: string
  ruleId: string
  ruleName: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout' | 'skipped'
  conditionMet: boolean
  actionsExecuted: number
  actionsFailed: number
  duration: number
  startedAt: Date
  completedAt?: Date
  inputs: Record<string, any>
  outputs: any[]
  errorMessage?: string
}

export interface RuleConflictCheckResponse {
  hasConflicts: boolean
  conflicts: Array<{
    conflictingRuleId: string
    conflictingRuleName: string
    conflictType: 'condition' | 'action' | 'trigger'
    severity: 'low' | 'medium' | 'high'
    description: string
  }>
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class RuleEngineService {
  private apiBaseUrl: string
  private apiKey: string

  constructor(baseUrl: string = '/api', apiKey: string = '') {
    this.apiBaseUrl = baseUrl
    this.apiKey = apiKey
  }

  /**
   * Create a new rule
   */
  async createRule(request: CreateRuleRequest): Promise<Rule> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Failed to create rule: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        createdAt: new Date(data.createdAt),
      }
    } catch (error) {
      console.error('[RuleEngineService] Error creating rule:', error)
      throw error
    }
  }

  /**
   * Get rule by ID
   */
  async getRule(ruleId: string): Promise<Rule> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}`, {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Rule not found: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        createdAt: new Date(data.createdAt),
      }
    } catch (error) {
      console.error('[RuleEngineService] Error fetching rule:', error)
      throw error
    }
  }

  /**
   * List all rules with filtering
   */
  async listRules(
    status?: RuleStatus,
    category?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Rule[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(status && { status }),
        ...(category && { category }),
      })

      const response = await fetch(`${this.apiBaseUrl}/rules?${params}`, {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to list rules: ${response.statusText}`)
      }

      const data = await response.json()
      return Array.isArray(data)
        ? data.map((rule: any) => ({
            ...rule,
            createdAt: new Date(rule.createdAt),
          }))
        : data.rules
    } catch (error) {
      console.error('[RuleEngineService] Error listing rules:', error)
      throw error
    }
  }

  /**
   * Update a rule
   */
  async updateRule(ruleId: string, updates: UpdateRuleRequest): Promise<Rule> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update rule: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        createdAt: new Date(data.createdAt),
      }
    } catch (error) {
      console.error('[RuleEngineService] Error updating rule:', error)
      throw error
    }
  }

  /**
   * Delete a rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}`, {
        method: 'DELETE',
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to delete rule: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[RuleEngineService] Error deleting rule:', error)
      throw error
    }
  }

  /**
   * Execute a rule with test data
   */
  async executeRule(request: ExecuteRuleRequest): Promise<ExecuteRuleResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${request.ruleId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          data: request.data,
          userId: request.userId,
          testMode: request.testMode,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to execute rule: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        timestamp: new Date(data.timestamp),
      }
    } catch (error) {
      console.error('[RuleEngineService] Error executing rule:', error)
      throw error
    }
  }

  /**
   * Debug a rule with sample data
   */
  async debugRule(request: DebugRuleRequest): Promise<DebugRuleResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${request.ruleId}/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          condition: request.condition,
          sampleData: request.sampleData,
          includeActions: request.includeActions,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to debug rule: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        logs: data.logs?.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })) || [],
      }
    } catch (error) {
      console.error('[RuleEngineService] Error debugging rule:', error)
      throw error
    }
  }

  /**
   * Analyze rule for conflicts and impact
   */
  async analyzeRule(ruleId: string): Promise<RuleAnalysisResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}/analyze`, {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze rule: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[RuleEngineService] Error analyzing rule:', error)
      throw error
    }
  }

  /**
   * Check for conflicts with other rules
   */
  async checkConflicts(ruleId: string): Promise<RuleConflictCheckResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}/conflicts`, {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to check conflicts: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[RuleEngineService] Error checking conflicts:', error)
      throw error
    }
  }

  /**
   * Get execution history for a rule
   */
  async getExecutionHistory(
    ruleId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<RuleExecutionHistory[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}/executions?${params}`, {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch execution history: ${response.statusText}`)
      }

      const data = await response.json()
      return Array.isArray(data)
        ? data.map((exec: any) => ({
            ...exec,
            startedAt: new Date(exec.startedAt),
            completedAt: exec.completedAt ? new Date(exec.completedAt) : undefined,
          }))
        : data.executions
    } catch (error) {
      console.error('[RuleEngineService] Error fetching execution history:', error)
      throw error
    }
  }

  /**
   * Get a specific execution
   */
  async getExecution(executionId: string): Promise<RuleExecutionHistory> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/executions/${executionId}`, {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch execution: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        startedAt: new Date(data.startedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      }
    } catch (error) {
      console.error('[RuleEngineService] Error fetching execution:', error)
      throw error
    }
  }

  /**
   * Duplicate a rule
   */
  async duplicateRule(
    ruleId: string,
    newName?: string
  ): Promise<Rule> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          newName,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to duplicate rule: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        createdAt: new Date(data.createdAt),
      }
    } catch (error) {
      console.error('[RuleEngineService] Error duplicating rule:', error)
      throw error
    }
  }

  /**
   * Enable a rule
   */
  async enableRule(ruleId: string): Promise<Rule> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}/enable`, {
        method: 'POST',
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to enable rule: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        createdAt: new Date(data.createdAt),
      }
    } catch (error) {
      console.error('[RuleEngineService] Error enabling rule:', error)
      throw error
    }
  }

  /**
   * Disable a rule
   */
  async disableRule(ruleId: string): Promise<Rule> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}/disable`, {
        method: 'POST',
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to disable rule: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        createdAt: new Date(data.createdAt),
      }
    } catch (error) {
      console.error('[RuleEngineService] Error disabling rule:', error)
      throw error
    }
  }

  /**
   * Get rule execution statistics
   */
  async getRuleStats(ruleId: string): Promise<{
    totalExecutions: number
    successCount: number
    failureCount: number
    successRate: number
    averageDuration: number
    lastExecution?: Date
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/rules/${ruleId}/stats`, {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        lastExecution: data.lastExecution ? new Date(data.lastExecution) : undefined,
      }
    } catch (error) {
      console.error('[RuleEngineService] Error fetching stats:', error)
      throw error
    }
  }
}

export default RuleEngineService
