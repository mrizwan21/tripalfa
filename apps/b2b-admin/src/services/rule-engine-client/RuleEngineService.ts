/**
 * Rule Engine Service - Backend Integration Layer
 *
 * Handles:
 * - Creating and managing automation rules
 * - Executing rules with debugging
 * - Performance analysis and conflict detection
 * - Execution history and tracking
 * - Rule versioning and snapshots
 *
 * This service now uses the centralized APIManager for all API calls,
 * providing consistent error handling, caching, and request/response interceptors.
 *
 * Types are now aligned with @tripalfa/api-clients package.
 */

import { APIManager } from "../api-manager/APIManager.js";
import type {
  Rule,
  RuleStatus,
  RuleExecution,
  RuleCondition,
  RuleAction,
  RuleImpactAnalysis,
  RuleConflictAnalysis,
  CreateRuleRequest,
  UpdateRuleRequest,
  ExecuteRuleRequest,
  ExecuteRuleResponse,
  DebugRuleRequest,
  DebugRuleResponse,
  RuleExecutionHistory,
  RuleConflictCheckResponse,
  RuleAnalysisResponse,
  RulePriority,
  ConditionOperator,
  ActionType,
  RuleRetryPolicy,
  ExecutionContext,
} from "@tripalfa/api-clients";

// Get the singleton APIManager instance
const apiManager = APIManager.getInstance();

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class RuleEngineService {
  private apiBaseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = "/api", apiKey: string = "") {
    this.apiBaseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Create a new rule
   * Uses centralized APIManager for consistent error handling and caching
   */
  async createRule(request: CreateRuleRequest): Promise<Rule> {
    try {
      const response = await apiManager.post<Rule>(
        `${this.apiBaseUrl}/rules`,
        request,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to create rule");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error creating rule:", error);
      throw error;
    }
  }

  /**
   * Get rule by ID
   * Uses centralized APIManager with caching support
   */
  async getRule(ruleId: string): Promise<Rule> {
    try {
      const response = await apiManager.get<Rule>(
        `${this.apiBaseUrl}/rules/${ruleId}`,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Rule not found");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error fetching rule:", error);
      throw error;
    }
  }

  /**
   * List all rules with filtering
   * Uses centralized APIManager with caching support
   */
  async listRules(
    status?: RuleStatus,
    category?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Rule[]> {
    try {
      const params: Record<string, string | number> = {
        limit,
        offset,
      };
      if (status) params.status = status;
      if (category) params.category = category;

      const response = await apiManager.get<Rule[]>(
        `${this.apiBaseUrl}/rules`,
        { params },
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to list rules");
      }

      return response.data || [];
    } catch (error) {
      console.error("[RuleEngineService] Error listing rules:", error);
      throw error;
    }
  }

  /**
   * Update a rule
   * Uses centralized APIManager
   */
  async updateRule(ruleId: string, updates: UpdateRuleRequest): Promise<Rule> {
    try {
      const response = await apiManager.patch<Rule>(
        `${this.apiBaseUrl}/rules/${ruleId}`,
        updates,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to update rule");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error updating rule:", error);
      throw error;
    }
  }

  /**
   * Delete a rule
   * Uses centralized APIManager
   */
  async deleteRule(ruleId: string): Promise<void> {
    try {
      const response = await apiManager.delete(
        `${this.apiBaseUrl}/rules/${ruleId}`,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete rule");
      }
    } catch (error) {
      console.error("[RuleEngineService] Error deleting rule:", error);
      throw error;
    }
  }

  /**
   * Execute a rule with test data
   * Uses centralized APIManager
   */
  async executeRule(request: ExecuteRuleRequest): Promise<ExecuteRuleResponse> {
    try {
      const response = await apiManager.post<ExecuteRuleResponse>(
        `${this.apiBaseUrl}/rules/${request.ruleId}/execute`,
        {
          data: request.data,
          userId: request.userId,
          testMode: request.testMode,
        },
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to execute rule");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error executing rule:", error);
      throw error;
    }
  }

  /**
   * Debug a rule with sample data
   * Uses centralized APIManager
   */
  async debugRule(request: DebugRuleRequest): Promise<DebugRuleResponse> {
    try {
      const response = await apiManager.post<DebugRuleResponse>(
        `${this.apiBaseUrl}/rules/${request.ruleId}/debug`,
        {
          condition: request.condition,
          sampleData: request.sampleData,
          includeActions: request.includeActions,
        },
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to debug rule");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error debugging rule:", error);
      throw error;
    }
  }

  /**
   * Analyze rule for conflicts and impact
   * Uses centralized APIManager with caching support
   */
  async analyzeRule(ruleId: string): Promise<RuleAnalysisResponse> {
    try {
      const response = await apiManager.get<RuleAnalysisResponse>(
        `${this.apiBaseUrl}/rules/${ruleId}/analyze`,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to analyze rule");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error analyzing rule:", error);
      throw error;
    }
  }

  /**
   * Check for conflicts with other rules
   * Uses centralized APIManager
   */
  async checkConflicts(ruleId: string): Promise<RuleConflictCheckResponse> {
    try {
      const response = await apiManager.get<RuleConflictCheckResponse>(
        `${this.apiBaseUrl}/rules/${ruleId}/conflicts`,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to check conflicts");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error checking conflicts:", error);
      throw error;
    }
  }

  /**
   * Get execution history for a rule
   * Uses centralized APIManager
   */
  async getExecutionHistory(
    ruleId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<RuleExecutionHistory[]> {
    try {
      const response = await apiManager.get<RuleExecutionHistory[]>(
        `${this.apiBaseUrl}/rules/${ruleId}/executions`,
        { params: { limit, offset } },
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch execution history",
        );
      }

      return response.data || [];
    } catch (error) {
      console.error(
        "[RuleEngineService] Error fetching execution history:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get a specific execution
   * Uses centralized APIManager
   */
  async getExecution(executionId: string): Promise<RuleExecutionHistory> {
    try {
      const response = await apiManager.get<RuleExecutionHistory>(
        `${this.apiBaseUrl}/executions/${executionId}`,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch execution");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error fetching execution:", error);
      throw error;
    }
  }

  /**
   * Duplicate a rule
   * Uses centralized APIManager
   */
  async duplicateRule(ruleId: string, newName?: string): Promise<Rule> {
    try {
      const response = await apiManager.post<Rule>(
        `${this.apiBaseUrl}/rules/${ruleId}/duplicate`,
        { newName },
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to duplicate rule");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error duplicating rule:", error);
      throw error;
    }
  }

  /**
   * Enable a rule
   * Uses centralized APIManager
   */
  async enableRule(ruleId: string): Promise<Rule> {
    try {
      const response = await apiManager.post<Rule>(
        `${this.apiBaseUrl}/rules/${ruleId}/enable`,
        {},
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to enable rule");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error enabling rule:", error);
      throw error;
    }
  }

  /**
   * Disable a rule
   * Uses centralized APIManager
   */
  async disableRule(ruleId: string): Promise<Rule> {
    try {
      const response = await apiManager.post<Rule>(
        `${this.apiBaseUrl}/rules/${ruleId}/disable`,
        {},
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to disable rule");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error disabling rule:", error);
      throw error;
    }
  }

  /**
   * Get rule execution statistics
   * Uses centralized APIManager
   */
  async getRuleStats(ruleId: string): Promise<{
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageDuration: number;
    lastExecution?: string;
  }> {
    try {
      const response = await apiManager.get<any>(
        `${this.apiBaseUrl}/rules/${ruleId}/stats`,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch stats");
      }

      return response.data!;
    } catch (error) {
      console.error("[RuleEngineService] Error fetching stats:", error);
      throw error;
    }
  }
}

export default RuleEngineService;
