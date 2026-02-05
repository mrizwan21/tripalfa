// Rule Management Types

export type RuleCategory = 'markup' | 'commission' | 'coupon' | 'airline_deal';

export type RuleStatus = 'active' | 'inactive' | 'pending' | 'expired';

export type RuleType = {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  status: RuleStatus;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  metadata: RuleMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
};

export type RuleCondition = {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains';
  value: any;
  logic?: 'and' | 'or';
};

export type RuleAction = {
  type: 'apply_markup' | 'apply_commission' | 'apply_discount' | 'block_booking' | 'require_approval';
  parameters: Record<string, any>;
};

export type RuleMetadata = {
  version: string;
  tags: string[];
  lastTestedAt?: Date;
  testResults?: RuleTestResult[];
};

export type RuleTestResult = {
  testId: string;
  passed: boolean;
  input: any;
  expectedOutput: any;
  actualOutput: any;
  timestamp: Date;
};

export type RuleAnalytics = {
  category: RuleCategory;
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  averagePriority: number;
  lastModified: Date;
  usageStats: {
    totalApplications: number;
    successRate: number;
    errorRate: number;
  };
};

export type RuleAuditLog = {
  id: string;
  ruleId: string;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  performedBy: string;
  timestamp: Date;
  changes: AuditChange[];
  ipAddress?: string;
  userAgent?: string;
};

export type AuditChange = {
  field: string;
  oldValue: any;
  newValue: any;
};

export type RuleFilter = {
  category?: RuleCategory;
  status?: RuleStatus;
  name?: string;
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
};

export type RuleSort = {
  field: 'name' | 'priority' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
};

export type RuleValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
};

export type RuleImportExport = {
  version: string;
  rules: RuleType[];
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    categories: RuleCategory[];
    totalRules: number;
  };
};

export type RuleTestScenario = {
  id: string;
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  category: RuleCategory;
  tags: string[];
};

export type RuleConflict = {
  ruleId: string;
  conflictingRuleId: string;
  conflictType: 'priority' | 'condition' | 'action';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
};

export type RuleDependency = {
  ruleId: string;
  dependsOn: string[];
  dependencyType: 'condition' | 'action' | 'metadata';
  description: string;
};

export type RuleTemplate = {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  template: Partial<RuleType>;
  parameters: RuleTemplateParameter[];
  createdAt: Date;
  createdBy: string;
};

export type RuleTemplateParameter = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
  };
};

export type RuleExecutionLog = {
  id: string;
  ruleId: string;
  executionId: string;
  input: any;
  output: any;
  executionTime: number;
  status: 'success' | 'failed' | 'timeout';
  error?: string;
  timestamp: Date;
};

export type RulePerformanceMetrics = {
  ruleId: string;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  totalExecutions: number;
  successRate: number;
  lastExecutionTime: Date;
  errorRate: number;
};

export type RuleHealthCheck = {
  ruleId: string;
  status: 'healthy' | 'warning' | 'error';
  lastCheck: Date;
  checks: HealthCheckResult[];
  overallScore: number;
};

export type HealthCheckResult = {
  checkName: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
};

export type RuleVersion = {
  id: string;
  ruleId: string;
  version: string;
  changes: string[];
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  rollbackAvailable: boolean;
};

export type RuleMigration = {
  id: string;
  fromVersion: string;
  toVersion: string;
  migrationScript: string;
  createdAt: Date;
  createdBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  errors?: string[];
};

export type RuleExportFormat = 'json' | 'yaml' | 'csv' | 'xml';

export type RuleImportResult = {
  totalRules: number;
  importedRules: number;
  failedRules: number;
  errors: ImportError[];
  warnings: string[];
};

export type ImportError = {
  ruleId?: string;
  error: string;
  details?: any;
};

export type RuleBulkOperation = {
  id: string;
  operation: 'activate' | 'deactivate' | 'delete' | 'update';
  filters: RuleFilter;
  parameters?: Record<string, any>;
  createdAt: Date;
  createdBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  results?: BulkOperationResult[];
};

export type BulkOperationResult = {
  ruleId: string;
  success: boolean;
  message?: string;
  error?: string;
};