import axios from 'axios';

export interface Rule {
  id: string;
  name: string;
  description?: string;
  category: string;
  triggerEvent?: string;
  condition: any;
  actions: any[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'inactive' | 'archived';
  enabled: boolean;
  maxExecutionsPerDay?: number;
  timeout?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleRequest {
  name: string;
  description?: string;
  category: string;
  triggerEvent?: string;
  condition: any;
  actions: any[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled?: boolean;
  maxExecutionsPerDay?: number;
  timeout?: number;
}

export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {
  status?: Rule['status'];
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
  status: 'success' | 'failed' | 'timeout' | 'skipped';
  conditionMet: boolean;
  actionsExecuted: number;
  actionsFailed: number;
  duration: number;
  outputs: Array<{
    actionId: string;
    status: 'success' | 'failed';
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
    level: 'info' | 'warn' | 'error';
    timestamp: Date;
    message: string;
  }>;
}

export interface RuleAnalysisResponse {
  ruleId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
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
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout' | 'skipped';
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
    conflictType: 'condition' | 'action' | 'trigger';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

export class RuleEngineService {
  private static baseURL = process.env.VITE_RULE_ENGINE_SERVICE_URL || 'http://localhost:3005';

  /**
   * Create a new rule
   */
  static async createRule(request: CreateRuleRequest): Promise<Rule> {
    try {
      const response = await axios.post<Rule>(
        `${this.baseURL}/api/rules`,
        request
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create rule: ${error}`);
    }
  }

  /**
   * Get rule by ID
   */
  static async getRule(ruleId: string): Promise<Rule> {
    try {
      const response = await axios.get<Rule>(
        `${this.baseURL}/api/rules/${ruleId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get rule: ${error}`);
    }
  }

  /**
   * List all rules with filtering
   */
  static async listRules(
    status?: Rule['status'],
    category?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Rule[]> {
    try {
      const response = await axios.get<Rule[]>(
        `${this.baseURL}/api/rules`,
        {
          params: {
            ...(status && { status }),
            ...(category && { category }),
            limit,
            offset,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to list rules: ${error}`);
    }
  }

  /**
   * Update a rule
   */
  static async updateRule(ruleId: string, updates: UpdateRuleRequest): Promise<Rule> {
    try {
      const response = await axios.patch<Rule>(
        `${this.baseURL}/api/rules/${ruleId}`,
        updates
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update rule: ${error}`);
    }
  }

  /**
   * Delete a rule
   */
  static async deleteRule(ruleId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/api/rules/${ruleId}`);
    } catch (error) {
      throw new Error(`Failed to delete rule: ${error}`);
    }
  }

  /**
   * Execute a rule with test data
   */
  static async executeRule(request: ExecuteRuleRequest): Promise<ExecuteRuleResponse> {
    try {
      const response = await axios.post<ExecuteRuleResponse>(
        `${this.baseURL}/api/rules/${request.ruleId}/execute`,
        {
          data: request.data,
          userId: request.userId,
          testMode: request.testMode,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to execute rule: ${error}`);
    }
  }

  /**
   * Debug a rule with sample data
   */
  static async debugRule(request: DebugRuleRequest): Promise<DebugRuleResponse> {
    try {
      const response = await axios.post<DebugRuleResponse>(
        `${this.baseURL}/api/rules/${request.ruleId}/debug`,
        {
          condition: request.condition,
          sampleData: request.sampleData,
          includeActions: request.includeActions,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to debug rule: ${error}`);
    }
  }

  /**
   * Analyze rule for conflicts and impact
   */
  static async analyzeRule(ruleId: string): Promise<RuleAnalysisResponse> {
    try {
      const response = await axios.get<RuleAnalysisResponse>(
        `${this.baseURL}/api/rules/${ruleId}/analyze`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to analyze rule: ${error}`);
    }
  }

  /**
   * Check for conflicts with other rules
   */
  static async checkConflicts(ruleId: string): Promise<RuleConflictCheckResponse> {
    try {
      const response = await axios.get<RuleConflictCheckResponse>(
        `${this.baseURL}/api/rules/${ruleId}/conflicts`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to check conflicts: ${error}`);
    }
  }

  /**
   * Get execution history for a rule
   */
  static async getExecutionHistory(
    ruleId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<RuleExecutionHistory[]> {
    try {
      const response = await axios.get<RuleExecutionHistory[]>(
        `${this.baseURL}/api/rules/${ruleId}/executions`,
        { params: { limit, offset } }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get execution history: ${error}`);
    }
  }

  /**
   * Get a specific execution
   */
  static async getExecution(executionId: string): Promise<RuleExecutionHistory> {
    try {
      const response = await axios.get<RuleExecutionHistory>(
        `${this.baseURL}/api/executions/${executionId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get execution: ${error}`);
    }
  }

  /**
   * Duplicate a rule
   */
  static async duplicateRule(ruleId: string, newName?: string): Promise<Rule> {
    try {
      const response = await axios.post<Rule>(
        `${this.baseURL}/api/rules/${ruleId}/duplicate`,
        { newName }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to duplicate rule: ${error}`);
    }
  }

  /**
   * Enable a rule
   */
  static async enableRule(ruleId: string): Promise<Rule> {
    try {
      const response = await axios.post<Rule>(
        `${this.baseURL}/api/rules/${ruleId}/enable`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to enable rule: ${error}`);
    }
  }

  /**
   * Disable a rule
   */
  static async disableRule(ruleId: string): Promise<Rule> {
    try {
      const response = await axios.post<Rule>(
        `${this.baseURL}/api/rules/${ruleId}/disable`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to disable rule: ${error}`);
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
      throw new Error(`Failed to get rule stats: ${error}`);
    }
  }
}

export default RuleEngineService;