/**
 * Rule Engine - Complete Type Definitions
 *
 * Includes types for:
 * - Rule definitions and builders
 * - Conditions and actions
 * - Rule execution and logging
 * - Performance tracking and debugging
 */

// ============================================================================
// CORE RULE TYPES
// ============================================================================

export type RuleStatus = 'draft' | 'active' | 'paused' | 'archived' | 'disabled'
export type RulePriority = 'low' | 'medium' | 'high' | 'critical'
export type RuleTrigger = 'event' | 'schedule' | 'api' | 'webhook' | 'manual'

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists'
  | 'regex'
  | 'between'
  | 'matches'
  | 'any_of'
  | 'all_of'

export type ActionType =
  | 'send_notification'
  | 'create_ticket'
  | 'update_record'
  | 'call_webhook'
  | 'send_email'
  | 'send_sms'
  | 'assign_user'
  | 'change_status'
  | 'add_tag'
  | 'trigger_workflow'
  | 'execute_sql'
  | 'log_event'
  | 'create_alert'
  | 'custom'

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'array' | 'object' | 'json'
export type FieldPath = string // e.g. "booking.amount", "user.profile.email"

// ============================================================================
// RULE DEFINITION
// ============================================================================

export interface Rule {
  id: string
  name: string
  description?: string
  
  // Classification
  category: string
  type: 'simple' | 'composite'
  tags: string[]
  
  // Trigger
  trigger: RuleTrigger
  triggerEvent?: string
  triggerSchedule?: RuleSchedule
  
  // Logic
  condition: RuleCondition
  actions: RuleAction[]
  
  // Execution
  priority: RulePriority
  enabled: boolean
  status: RuleStatus
  maxExecutionsPerDay?: number
  
  // Performance
  timeout: number // milliseconds
  retryPolicy?: RuleRetryPolicy
  
  // Scope
  appliesToEntities: EntityScope
  
  // Versioning
  version: number
  previousVersion?: string
  
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
  
  // Metadata
  executionHistory?: RuleExecution[]
  stats?: RuleStats
  documentation?: string
}

export interface RuleSchedule {
  frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom_cron'
  nextRun?: Date
  lastRun?: Date
  cronExpression?: string
  timeZone?: string
}

export interface EntityScope {
  entityType: string // e.g. 'booking', 'payment', 'user'
  filter?: EntityFilter
  limitToCount?: number
}

export interface EntityFilter {
  field: string
  operator: ConditionOperator
  value: any
}

// ============================================================================
// RULE CONDITIONS
// ============================================================================

export interface RuleCondition {
  id: string
  type: 'simple' | 'group' | 'complex'
  
  // For simple conditions
  field?: FieldPath
  operator?: ConditionOperator
  value?: any
  
  // For group conditions
  logic?: 'AND' | 'OR' | 'XOR'
  conditions?: RuleCondition[]
  
  // For complex conditions
  expression?: string // JavaScript or custom DSL
  variables?: Record<string, any>
}

export interface ConditionEvaluationContext {
  data: Record<string, any> // The entity being evaluated
  context: ExecutionContext
  variables: Record<string, any>
}

// ============================================================================
// RULE ACTIONS
// ============================================================================

export interface RuleAction {
  id: string
  order: number
  type: ActionType
  
  // Action configuration
  config: RuleActionConfig
  
  // Conditions (run this action only if...)
  conditions?: RuleCondition[]
  
  // Retry
  async: boolean
  maxRetries: number
  
  // Metadata
  description?: string
}

export interface RuleActionConfig {
  [key: string]: any
}

// Specific action configs:

export interface SendNotificationActionConfig extends RuleActionConfig {
  templateId: string
  recipients: string[] | ActionFieldRef // dynamic recipients
  variables?: Record<string, ActionFieldRef | string>
  channels?: string[]
  priority?: string
}

export interface SendEmailActionConfig extends RuleActionConfig {
  to: ActionFieldRef
  cc?: ActionFieldRef[]
  bcc?: ActionFieldRef[]
  subject: string
  body: string
  html?: string
  attachments?: string[]
}

export interface CallWebhookActionConfig extends RuleActionConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, ActionFieldRef | string>
  body?: Record<string, ActionFieldRef | any>
  auth?: WebhookAuth
}

export interface WebhookAuth {
  type: 'none' | 'basic' | 'bearer' | 'api_key'
  credentials: Record<string, string>
}

export interface CreateTicketActionConfig extends RuleActionConfig {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignTo?: string
  tags?: string[]
}

export interface ExecuteSQLActionConfig extends RuleActionConfig {
  query: string
  params?: Record<string, ActionFieldRef | any>
}

export interface ActionFieldRef {
  type: 'field' | 'variable' | 'function'
  value: string // e.g. "data.booking.id", "context.timestamp", "sum(data.amount)"
}

// ============================================================================
// RULE EXECUTION
// ============================================================================

export interface RuleExecution {
  id: string
  ruleId: string
  ruleName: string
  
  // Trigger info
  trigger: RuleTrigger
  triggerEvent?: string
  
  // Execution details
  startedAt: Date
  completedAt?: Date
  duration: number // milliseconds
  
  // Status
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout' | 'skipped'
  errorMessage?: string
  errorCode?: string
  
  // Detection
  conditionMet: boolean
  actionsExecuted: number
  actionsFailed: number
  
  // Details
  inputs: Record<string, any>
  outputs: ExecutionOutput[]
  
  // Performance
  conditionEvaluationTime: number
  actionExecutionTime: number
  
  // Context
  entityId?: string
  entityType?: string
  userId?: string
  executedBy: 'system' | 'user' | 'api' | 'schedule'
}

export interface ExecutionOutput {
  actionId: string
  actionType: ActionType
  status: 'pending' | 'success' | 'failed'
  result?: any
  error?: string
  duration: number
}

// ============================================================================
// RULE RETRY POLICY
// ============================================================================

export interface RuleRetryPolicy {
  maxRetries: number
  backoffMs: number
  backoffMultiplier: number
  maxBackoffMs: number
}

export interface ExecutionContext {
  environment: 'production' | 'staging' | 'development'
  timezone: string
  timestamp: Date
  userId?: string
  sessionId?: string
  correlationId?: string
}

// ============================================================================
// RULE STATISTICS
// ============================================================================

export interface RuleStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  
  // Timing
  averageExecutionTime: number
  minExecutionTime: number
  maxExecutionTime: number
  
  // Conditions
  conditionMetCount: number
  conditionNotMetCount: number
  
  // Actions
  actionsTriggeredTotal: number
  actionsFailedTotal: number
  
  // Period
  periodStart: Date
  periodEnd: Date
  
  // Trending
  trend: 'up' | 'down' | 'stable'
  errorTrend: 'increasing' | 'decreasing' | 'stable'
}

// ============================================================================
// RULE GROUP / WORKBENCH
// ============================================================================

export interface RuleWorkbench {
  id: string
  name: string
  description?: string
  
  // Rules
  ruleIds: string[]
  executionOrder: 'sequential' | 'parallel'
  stopOnFirstMatch?: boolean
  
  // Group conditions (apply to all rules)
  commonConditions?: RuleCondition
  
  // Group actions (execute after all rules)
  commonActions?: RuleAction[]
  
  // Status
  enabled: boolean
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy: string
  tags: string[]
}

// ============================================================================
// RULE BUILDER / TEMPLATE
// ============================================================================

export interface RuleTemplate {
  id: string
  name: string
  description?: string
  
  // Template structure
  triggerExample: RuleTrigger
  conditionTemplate: RuleCondition
  actionTemplates: RuleAction[]
  
  // Use cases
  useCases: string[]
  examples?: string[]
  
  // Metadata
  category: string
  tags: string[]
}

// ============================================================================
// RULE DEBUGGING
// ============================================================================

export interface RuleDebugSession {
  id: string
  ruleId: string
  ruleName: string
  
  // Test data
  testData: Record<string, any>
  testContext?: ExecutionContext
  
  // Results
  conditionEvaluation: ConditionEvaluationResult
  actionSimulations: ActionSimulation[]
  
  // Logs
  logs: DebugLog[]
  
  // Metadata
  createdAt: Date
  createdBy: string
}

export interface ConditionEvaluationResult {
  met: boolean
  evaluationTime: number
  steps: EvaluationStep[]
}

export interface EvaluationStep {
  conditionId: string
  field?: string
  operator?: string
  value?: any
  result: boolean
  actualValue?: any
  evaluationTime: number
}

export interface ActionSimulation {
  actionId: string
  actionType: ActionType
  wouldExecute: boolean
  configRendered: Record<string, any>
  estimatedTime: number
}

export interface DebugLog {
  timestamp: Date
  level: 'debug' | 'info' | 'warning' | 'error'
  message: string
  context?: Record<string, any>
}

// ============================================================================
// RULE USAGE & IMPACT ANALYSIS
// ============================================================================

export interface RuleImpactAnalysis {
  ruleId: string
  
  // Affected data
  affectedEntities: number
  affectedEntityTypes: string[]
  
  // Performance impact
  estimatedExecutionTime: number
  estimatedCPUUsage: number
  estimatedMemoryUsage: number
  
  // Dependencies
  dependsOnRules: string[]
  dependedByRules: string[]
  
  // Related entities
  usedByWorkbenches: string[]
  
  // Recommendations
  recommendations: string[]
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  risks: string[]
}

export interface RuleConflictAnalysis {
  conflicts: RuleConflict[]
  recommendations: string[]
}

export interface RuleConflict {
  ruleId1: string
  ruleId2: string
  conflictType: 'same_trigger' | 'same_action' | 'contradictory_conditions'
  severity: 'low' | 'high'
  description: string
}

// ============================================================================
// RULE API REQUESTS/RESPONSES
// ============================================================================

export interface CreateRuleRequest {
  name: string
  description?: string
  category: string
  condition: RuleCondition
  actions: RuleAction[]
  trigger: RuleTrigger
  priority?: RulePriority
  appliesToEntities: EntityScope
}

export interface CreateRuleResponse {
  success: boolean
  ruleId: string
  rule: Rule
}

export interface ExecuteRuleRequest {
  ruleId: string
  data: Record<string, any>
  context?: ExecutionContext
}

export interface ExecuteRuleResponse {
  success: boolean
  execution: RuleExecution
}

export interface DebugRuleRequest {
  ruleId: string
  testData: Record<string, any>
  context?: ExecutionContext
}

export interface DebugRuleResponse {
  success: boolean
  session: RuleDebugSession
}
