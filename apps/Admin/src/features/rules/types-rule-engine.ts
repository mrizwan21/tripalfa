/**
 * Rule Engine - Feature Type Facade
 *
 * The rules feature should consume the shared API client types instead of
 * maintaining a separate local copy of the same domain model.
 */

export type {
  ActionType,
  ConditionOperator,
  CreateRuleRequest,
  DataType,
  DebugRuleRequest,
  DebugRuleResponse,
  ExecuteRuleRequest,
  ExecuteRuleResponse,
  ExecutionContext,
  FieldPath,
  Rule,
  RuleAction,
  RuleActionConfig,
  RuleAnalysisResponse,
  RuleCondition,
  RuleConflictAnalysis,
  RuleDebugSession,
  RuleExecution,
  RuleExecutionHistory,
  RuleImpactAnalysis,
  RulePriority,
  RuleRetryPolicy,
  RuleStats,
  RuleStatus,
  RuleTrigger,
  UpdateRuleRequest,
} from "@tripalfa/api-clients";
