// ============================================================================
// RULE ENGINE TYPES - Aligned with b2b-admin feature types
// ============================================================================

import axios from "axios";
import { getEnv } from "./env.js";
import { getErrorMessage } from "./utils.js";

export type RuleStatus =
  | "draft"
  | "active"
  | "paused"
  | "archived"
  | "disabled";
export type RulePriority = "low" | "medium" | "high" | "critical";
export type RuleTrigger = "event" | "schedule" | "api" | "webhook" | "manual";
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_equal"
  | "less_equal"
  | "in"
  | "not_in"
  | "exists"
  | "not_exists"
  | "regex"
  | "between"
  | "matches"
  | "any_of"
  | "all_of";

export type ActionType =
  | "send_notification"
  | "create_ticket"
  | "update_record"
  | "call_webhook"
  | "send_email"
  | "send_sms"
  | "assign_user"
  | "change_status"
  | "add_tag"
  | "trigger_workflow"
  | "execute_sql"
  | "log_event"
  | "create_alert"
  | "custom";

export type DataType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "array"
  | "object"
  | "json";
export type FieldPath = string;

export interface RuleCondition {
  id: string;
  type: "simple" | "group" | "complex";
  field?: FieldPath;
  operator?: ConditionOperator;
  value?: any;
  logic?: "AND" | "OR" | "XOR";
  conditions?: RuleCondition[];
  expression?: string;
  variables?: Record<string, any>;
}

export interface RuleActionConfig {
  [key: string]: any;
}

export interface RuleAction {
  id: string;
  order: number;
  type: ActionType;
  config: RuleActionConfig;
  conditions?: RuleCondition[];
  async: boolean;
  maxRetries: number;
  description?: string;
}

export interface RuleSchedule {
  frequency: "once" | "hourly" | "daily" | "weekly" | "monthly" | "custom_cron";
  nextRun?: string;
  lastRun?: string;
  cronExpression?: string;
  timeZone?: string;
}

export interface EntityScope {
  entityType: string;
  filter?: EntityFilter;
  limitToCount?: number;
}

export interface EntityFilter {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface RuleRetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

export interface ExecutionContext {
  environment: "production" | "staging" | "development";
  timezone: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: "simple" | "composite";
  tags: string[];
  trigger: RuleTrigger;
  triggerEvent?: string;
  triggerSchedule?: RuleSchedule;
  condition: RuleCondition;
  actions: RuleAction[];
  priority: RulePriority;
  enabled: boolean;
  status: RuleStatus;
  maxExecutionsPerDay?: number;
  timeout: number;
  retryPolicy?: RuleRetryPolicy;
  appliesToEntities: EntityScope;
  version: number;
  previousVersion?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  documentation?: string;
}

export interface CreateRuleRequest {
  name: string;
  description?: string;
  category: string;
  type?: "simple" | "composite";
  tags?: string[];
  trigger: RuleTrigger;
  triggerEvent?: string;
  triggerSchedule?: RuleSchedule;
  condition: RuleCondition;
  actions: RuleAction[];
  priority?: RulePriority;
  appliesToEntities: EntityScope;
  maxExecutionsPerDay?: number;
  timeout?: number;
  retryPolicy?: RuleRetryPolicy;
}

export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {
  status?: RuleStatus;
  enabled?: boolean;
}

export interface ExecuteRuleRequest {
  ruleId: string;
  data: Record<string, any>;
  userId?: string;
  testMode?: boolean;
}

export interface ExecuteRuleResponse {
  executionId: string;
  ruleId: string;
  status: "success" | "failed" | "timeout" | "skipped";
  conditionMet: boolean;
  actionsExecuted: number;
  actionsFailed: number;
  duration: number;
  outputs: Array<{
    actionId: string;
    status: "success" | "failed";
    result?: any;
    error?: string;
  }>;
  timestamp: Date;
}

export interface DebugRuleRequest {
  ruleId: string;
  condition?: any;
  sampleData: Record<string, any>;
  includeActions?: boolean;
}

export interface DebugRuleResponse {
  conditionEvals: Array<{
    step: number;
    operator: string;
    field: string;
    value: any;
    result: boolean;
  }>;
  actionSimulations: Array<{
    actionId: string;
    actionType: string;
    willExecute: boolean;
    simulatedOutput?: any;
  }>;
  logs: Array<{
    level: "info" | "warn" | "error";
    timestamp: Date;
    message: string;
  }>;
}

export interface RuleAnalysisResponse {
  ruleId: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  impactAnalysis: any;
  conflictAnalysis: any;
  performance: {
    estimatedExecutionTime: number;
    averageExecutionTime: number;
    timeoutRisk: number;
  };
  recommendations: string[];
}

export interface RuleExecutionHistory {
  executionId: string;
  ruleId: string;
  ruleName: string;
  status: "pending" | "running" | "success" | "failed" | "timeout" | "skipped";
  conditionMet: boolean;
  actionsExecuted: number;
  actionsFailed: number;
  duration: number;
  startedAt: Date;
  completedAt?: Date;
  inputs: Record<string, any>;
  outputs: any[];
  errorMessage?: string;
}

export interface RuleConflictCheckResponse {
  hasConflicts: boolean;
  conflicts: Array<{
    conflictingRuleId: string;
    conflictingRuleName: string;
    conflictType: "condition" | "action" | "trigger";
    severity: "low" | "medium" | "high";
    description: string;
  }>;
}

export interface RuleStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  conditionMetCount: number;
  conditionNotMetCount: number;
  actionsTriggeredTotal: number;
  actionsFailedTotal: number;
  periodStart: string;
  periodEnd: string;
  trend: "up" | "down" | "stable";
  errorTrend: "increasing" | "decreasing" | "stable";
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  trigger: RuleTrigger;
  triggerEvent?: string;
  startedAt: string;
  completedAt?: string;
  duration: number;
  status: "pending" | "running" | "success" | "failed" | "timeout" | "skipped";
  errorMessage?: string;
  errorCode?: string;
  conditionMet: boolean;
  actionsExecuted: number;
  actionsFailed: number;
  inputs: Record<string, any>;
  outputs: ExecutionOutput[];
  conditionEvaluationTime: number;
  actionExecutionTime: number;
  entityId?: string;
  entityType?: string;
  userId?: string;
  executedBy: "system" | "user" | "api" | "schedule";
}

export interface ExecutionOutput {
  actionId: string;
  actionType: ActionType;
  status: "pending" | "success" | "failed";
  result?: any;
  error?: string;
  duration: number;
}

export interface RuleImpactAnalysis {
  ruleId: string;
  affectedEntities: number;
  affectedEntityTypes: string[];
  estimatedExecutionTime: number;
  estimatedCPUUsage: number;
  estimatedMemoryUsage: number;
  dependsOnRules: string[];
  dependedByRules: string[];
  usedByWorkbenches: string[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  risks: string[];
}

export interface RuleConflict {
  ruleId1: string;
  ruleId2: string;
  conflictType: "same_trigger" | "same_action" | "contradictory_conditions";
  severity: "low" | "high";
  description: string;
}

export interface RuleConflictAnalysis {
  conflicts: RuleConflict[];
  recommendations: string[];
}

export interface ConditionEvaluationResult {
  met: boolean;
  evaluationTime: number;
  steps: EvaluationStep[];
}

export interface EvaluationStep {
  conditionId: string;
  field?: string;
  operator?: string;
  value?: any;
  result: boolean;
  actualValue?: any;
  evaluationTime: number;
}

export interface ActionSimulation {
  actionId: string;
  actionType: ActionType;
  wouldExecute: boolean;
  configRendered: Record<string, any>;
  estimatedTime: number;
}

export interface DebugLog {
  timestamp: string;
  level: "debug" | "info" | "warning" | "error";
  message: string;
  context?: Record<string, any>;
}

export interface RuleDebugSession {
  id: string;
  ruleId: string;
  ruleName: string;
  testData: Record<string, any>;
  testContext?: ExecutionContext;
  conditionEvaluation: ConditionEvaluationResult;
  actionSimulations: ActionSimulation[];
  logs: DebugLog[];
  createdAt: string;
  createdBy: string;
}

// Note: RuleStats is already exported above, RuleExecutionHistory is separate interface

export class RuleEngineService {
  /**
   * Get base URL for rule engine service - uses lazy evaluation to support runtime config changes
   */
  private static get baseURL(): string {
    return getEnv("VITE_RULE_ENGINE_SERVICE_URL", "http://localhost:3005");
  }

  /**
   * Create a new rule
   */
  static async createRule(request: CreateRuleRequest): Promise<Rule> {
    try {
      const response = await axios.post<Rule>(
        `${this.baseURL}/api/rules`,
        request,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to create rule: ${message}`, { cause: error });
    }
  }

  /**
   * Get rule by ID
   */
  static async getRule(ruleId: string): Promise<Rule> {
    try {
      const response = await axios.get<Rule>(
        `${this.baseURL}/api/rules/${ruleId}`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get rule: ${message}`, { cause: error });
    }
  }

  /**
   * List all rules with filtering
   */
  static async listRules(
    status?: Rule["status"],
    category?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Rule[]> {
    try {
      const response = await axios.get<Rule[]>(`${this.baseURL}/api/rules`, {
        params: {
          ...(status && { status }),
          ...(category && { category }),
          limit,
          offset,
        },
      });

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to list rules: ${message}`, { cause: error });
    }
  }

  /**
   * Update a rule
   */
  static async updateRule(
    ruleId: string,
    updates: UpdateRuleRequest,
  ): Promise<Rule> {
    try {
      const response = await axios.patch<Rule>(
        `${this.baseURL}/api/rules/${ruleId}`,
        updates,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to update rule: ${message}`, { cause: error });
    }
  }

  /**
   * Delete a rule
   */
  static async deleteRule(ruleId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/api/rules/${ruleId}`);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to delete rule: ${message}`, { cause: error });
    }
  }

  /**
   * Execute a rule with test data
   */
  static async executeRule(
    request: ExecuteRuleRequest,
  ): Promise<ExecuteRuleResponse> {
    try {
      const response = await axios.post<ExecuteRuleResponse>(
        `${this.baseURL}/api/rules/${request.ruleId}/execute`,
        {
          data: request.data,
          userId: request.userId,
          testMode: request.testMode,
        },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to execute rule: ${message}`, { cause: error });
    }
  }

  /**
   * Debug a rule with sample data
   */
  static async debugRule(
    request: DebugRuleRequest,
  ): Promise<DebugRuleResponse> {
    try {
      const response = await axios.post<DebugRuleResponse>(
        `${this.baseURL}/api/rules/${request.ruleId}/debug`,
        {
          condition: request.condition,
          sampleData: request.sampleData,
          includeActions: request.includeActions,
        },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to debug rule: ${message}`, { cause: error });
    }
  }

  /**
   * Analyze rule for conflicts and impact
   */
  static async analyzeRule(ruleId: string): Promise<RuleAnalysisResponse> {
    try {
      const response = await axios.get<RuleAnalysisResponse>(
        `${this.baseURL}/api/rules/${ruleId}/analyze`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to analyze rule: ${message}`, { cause: error });
    }
  }

  /**
   * Check for conflicts with other rules
   */
  static async checkConflicts(
    ruleId: string,
  ): Promise<RuleConflictCheckResponse> {
    try {
      const response = await axios.get<RuleConflictCheckResponse>(
        `${this.baseURL}/api/rules/${ruleId}/conflicts`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to check conflicts: ${message}`, { cause: error });
    }
  }

  /**
   * Get execution history for a rule
   */
  static async getExecutionHistory(
    ruleId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<RuleExecutionHistory[]> {
    try {
      const response = await axios.get<RuleExecutionHistory[]>(
        `${this.baseURL}/api/rules/${ruleId}/executions`,
        { params: { limit, offset } },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get execution history: ${message}`, { cause: error });
    }
  }

  /**
   * Get a specific execution
   */
  static async getExecution(
    executionId: string,
  ): Promise<RuleExecutionHistory> {
    try {
      const response = await axios.get<RuleExecutionHistory>(
        `${this.baseURL}/api/executions/${executionId}`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get execution: ${message}`, { cause: error });
    }
  }

  /**
   * Duplicate a rule
   */
  static async duplicateRule(ruleId: string, newName?: string): Promise<Rule> {
    try {
      const response = await axios.post<Rule>(
        `${this.baseURL}/api/rules/${ruleId}/duplicate`,
        { newName },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to duplicate rule: ${message}`, { cause: error });
    }
  }

  /**
   * Enable a rule
   */
  static async enableRule(ruleId: string): Promise<Rule> {
    try {
      const response = await axios.post<Rule>(
        `${this.baseURL}/api/rules/${ruleId}/enable`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to enable rule: ${message}`, { cause: error });
    }
  }

  /**
   * Disable a rule
   */
  static async disableRule(ruleId: string): Promise<Rule> {
    try {
      const response = await axios.post<Rule>(
        `${this.baseURL}/api/rules/${ruleId}/disable`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to disable rule: ${message}`, { cause: error });
    }
  }

  /**
   * Get rule execution statistics
   */
  static async getRuleStats(ruleId: string): Promise<{
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageDuration: number;
    lastExecution?: Date;
  }> {
    try {
      const response = await axios.get<{
        totalExecutions: number;
        successCount: number;
        failureCount: number;
        successRate: number;
        averageDuration: number;
        lastExecution?: Date;
      }>(`${this.baseURL}/api/rules/${ruleId}/stats`);

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get rule stats: ${message}`, { cause: error });
    }
  }
}

export default RuleEngineService;
