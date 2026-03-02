/**
 * Rule Engine Repository - API Integration
 *
 * Acts as the data access layer, providing a clean interface
 * between the frontend components and the backend API.
 */

import {
  RuleEngineService,
  type CreateRuleRequest,
  type UpdateRuleRequest,
  type ExecuteRuleRequest,
  type ExecuteRuleResponse,
  type DebugRuleRequest,
  type DebugRuleResponse,
  type RuleAnalysisResponse,
  type RuleExecutionHistory,
  type RuleConflictCheckResponse,
  type Rule,
} from "@tripalfa/api-clients";

// ============================================================================
// REPOSITORY CLASS
// ============================================================================

export class RuleEngineRepository {
  constructor(apiBaseUrl: string = "/api", apiKey: string = "") {
    // Service is now static, no instance needed
  }

  /**
   * Create a rule (from RuleBuilder)
   */
  async createRule(request: CreateRuleRequest): Promise<Rule> {
    return RuleEngineService.createRule(request);
  }

  /**
   * Get rule by ID
   */
  async getRule(ruleId: string): Promise<Rule> {
    return RuleEngineService.getRule(ruleId);
  }

  /**
   * List rules (for RuleBuilder)
   */
  async listRules(
    status?: string,
    category?: string,
    limit?: number,
    offset?: number,
  ): Promise<Rule[]> {
    return RuleEngineService.listRules(status as any, category, limit, offset);
  }

  /**
   * Update rule (from RuleBuilder)
   */
  async updateRule(ruleId: string, updates: UpdateRuleRequest): Promise<Rule> {
    return RuleEngineService.updateRule(ruleId, updates);
  }

  /**
   * Delete rule (from RuleBuilder)
   */
  async deleteRule(ruleId: string): Promise<void> {
    return RuleEngineService.deleteRule(ruleId);
  }

  /**
   * Execute rule (from RuleExecutor and RuleBuilder)
   */
  async executeRule(request: ExecuteRuleRequest): Promise<ExecuteRuleResponse> {
    return RuleEngineService.executeRule(request);
  }

  /**
   * Debug rule with sample data (from RuleDebugger)
   */
  async debugRule(request: DebugRuleRequest): Promise<DebugRuleResponse> {
    return RuleEngineService.debugRule(request);
  }

  /**
   * Analyze rule for conflicts and impact (from RuleAnalyzer)
   */
  async analyzeRule(ruleId: string): Promise<RuleAnalysisResponse> {
    return RuleEngineService.analyzeRule(ruleId);
  }

  /**
   * Check for conflicts with other rules (from RuleAnalyzer)
   */
  async checkConflicts(ruleId: string): Promise<RuleConflictCheckResponse> {
    return RuleEngineService.checkConflicts(ruleId);
  }

  /**
   * Get execution history (from RuleExecutor and RuleAnalyzer)
   */
  async getExecutionHistory(
    ruleId: string,
    limit?: number,
    offset?: number,
  ): Promise<RuleExecutionHistory[]> {
    return RuleEngineService.getExecutionHistory(ruleId, limit, offset);
  }

  /**
   * Get a specific execution (from RuleExecutor)
   */
  async getExecution(executionId: string): Promise<RuleExecutionHistory> {
    return RuleEngineService.getExecution(executionId);
  }

  /**
   * Duplicate a rule (from RuleBuilder)
   */
  async duplicateRule(ruleId: string, newName?: string): Promise<Rule> {
    return RuleEngineService.duplicateRule(ruleId, newName);
  }

  /**
   * Enable a rule (from RuleBuilder)
   */
  async enableRule(ruleId: string): Promise<Rule> {
    return RuleEngineService.enableRule(ruleId);
  }

  /**
   * Disable a rule (from RuleBuilder)
   */
  async disableRule(ruleId: string): Promise<Rule> {
    return RuleEngineService.disableRule(ruleId);
  }

  /**
   * Get rule statistics (from RuleBuilder and RuleAnalyzer)
   */
  async getRuleStats(ruleId: string): Promise<{
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageDuration: number;
    lastExecution?: Date;
  }> {
    return RuleEngineService.getRuleStats(ruleId);
  }
}

export default RuleEngineRepository;
