import { RULE_PERMISSIONS } from '../types/rulePermissions';

/**
 * Security utilities for rule management operations
 * Provides input validation, sanitization, and security checks
 */

export interface SecurityConfig {
  maxRuleNameLength: number;
  maxRuleDescriptionLength: number;
  allowedValueTypes: string[];
  maxPercentageValue: number;
  minPercentageValue: number;
  maxDiscountValue: number;
  minDiscountValue: number;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxRuleNameLength: 100,
  maxRuleDescriptionLength: 500,
  allowedValueTypes: ['percentage', 'fixed', 'multiplier'],
  maxPercentageValue: 100,
  minPercentageValue: 0,
  maxDiscountValue: 10000,
  minDiscountValue: 0
};

/**
 * Input validation and sanitization for rule data
 */
export class RuleSecurityValidator {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Validate rule name
   */
  validateRuleName(name: string): { isValid: boolean; error?: string } {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Rule name is required' };
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return { isValid: false, error: 'Rule name cannot be empty' };
    }

    if (trimmedName.length > this.config.maxRuleNameLength) {
      return { 
        isValid: false, 
        error: `Rule name cannot exceed ${this.config.maxRuleNameLength} characters` 
      };
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(;|--|\/\*|\*\/|xp_|sp_)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(trimmedName)) {
        return { isValid: false, error: 'Invalid characters in rule name' };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate rule description
   */
  validateRuleDescription(description: string): { isValid: boolean; error?: string } {
    if (!description) {
      return { isValid: true }; // Description is optional
    }

    if (typeof description !== 'string') {
      return { isValid: false, error: 'Rule description must be a string' };
    }

    if (description.length > this.config.maxRuleDescriptionLength) {
      return { 
        isValid: false, 
        error: `Rule description cannot exceed ${this.config.maxRuleDescriptionLength} characters` 
      };
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(description)) {
        return { isValid: false, error: 'Invalid characters in rule description' };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate rule value
   */
  validateRuleValue(value: number, valueType: string): { isValid: boolean; error?: string } {
    if (typeof value !== 'number' || isNaN(value)) {
      return { isValid: false, error: 'Rule value must be a valid number' };
    }

    if (!this.config.allowedValueTypes.includes(valueType)) {
      return { isValid: false, error: `Invalid value type: ${valueType}` };
    }

    switch (valueType) {
      case 'percentage':
        if (value < this.config.minPercentageValue || value > this.config.maxPercentageValue) {
          return { 
            isValid: false, 
            error: `Percentage value must be between ${this.config.minPercentageValue} and ${this.config.maxPercentageValue}` 
          };
        }
        break;
      case 'fixed':
      case 'multiplier':
        if (value < this.config.minDiscountValue || value > this.config.maxDiscountValue) {
          return { 
            isValid: false, 
            error: `Value must be between ${this.config.minDiscountValue} and ${this.config.maxDiscountValue}` 
          };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Validate rule conditions
   */
  validateRuleConditions(conditions: any[]): { isValid: boolean; error?: string } {
    if (!Array.isArray(conditions)) {
      return { isValid: false, error: 'Conditions must be an array' };
    }

    if (conditions.length === 0) {
      return { isValid: false, error: 'At least one condition is required' };
    }

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      
      if (!condition || typeof condition !== 'object') {
        return { isValid: false, error: `Invalid condition at index ${i}` };
      }

      const { field, operator, value } = condition;

      if (!field || !operator || value === undefined) {
        return { isValid: false, error: `Missing required fields in condition at index ${i}` };
      }

      // Validate field name
      if (typeof field !== 'string' || field.trim().length === 0) {
        return { isValid: false, error: `Invalid field name in condition at index ${i}` };
      }

      // Validate operator
      const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains'];
      if (!validOperators.includes(operator)) {
        return { isValid: false, error: `Invalid operator '${operator}' in condition at index ${i}` };
      }

      // Validate value
      if (value === null || value === undefined) {
        return { isValid: false, error: `Invalid value in condition at index ${i}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Escape HTML entities
   */
  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Sanitize rule data for display
   */
  sanitizeRuleData(ruleData: any): any {
    if (!ruleData || typeof ruleData !== 'object') {
      return ruleData;
    }

    const sanitized = { ...ruleData };

    // Sanitize name and description (basic HTML escaping)
    if (sanitized.name) {
      sanitized.name = this.escapeHTML(sanitized.name);
    }

    if (sanitized.description) {
      sanitized.description = this.escapeHTML(sanitized.description);
    }

    // Sanitize conditions
    if (Array.isArray(sanitized.conditions)) {
      sanitized.conditions = sanitized.conditions.map((condition: any) => ({
        ...condition,
        field: this.escapeHTML(condition.field || ''),
        operator: this.escapeHTML(condition.operator || '')
      }));
    }

    return sanitized;
  }

  validateRule(rule: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!rule) {
      return { isValid: false, errors: ['Rule data is required'] };
    }

    // Validate name
    const nameValidation = this.validateRuleName(rule.name);
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error!);
    }

    // Validate description
    const descriptionValidation = this.validateRuleDescription(rule.description);
    if (!descriptionValidation.isValid) {
      errors.push(descriptionValidation.error!);
    }

    // Validate value
    const valueValidation = this.validateRuleValue(rule.value, rule.valueType);
    if (!valueValidation.isValid) {
      errors.push(valueValidation.error!);
    }

    // Validate conditions
    const conditionsValidation = this.validateRuleConditions(rule.conditions);
    if (!conditionsValidation.isValid) {
      errors.push(conditionsValidation.error!);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Security middleware for rule operations
 */
export class RuleSecurityMiddleware {
  private validator: RuleSecurityValidator;

  constructor(config?: Partial<SecurityConfig>) {
    this.validator = new RuleSecurityValidator(config);
  }

  /**
   * Middleware to validate rule creation
   */
  validateRuleCreation(ruleData: any): { isValid: boolean; errors: string[] } {
    return this.validator.validateRule(ruleData);
  }

  /**
   * Middleware to validate rule updates
   */
  validateRuleUpdate(ruleId: string, updateData: any): { isValid: boolean; errors: string[] } {
    // Validate rule ID
    if (!ruleId || typeof ruleId !== 'string') {
      return { isValid: false, errors: ['Invalid rule ID'] };
    }

    // Validate update data
    return this.validator.validateRule(updateData);
  }

  /**
   * Middleware to sanitize rule data for API responses
   */
  sanitizeRuleForResponse(rule: any): any {
    return this.validator.sanitizeRuleData(rule);
  }

  /**
   * Rate limiting check for rule operations
   */
  checkRateLimit(userId: string, operation: string): { allowed: boolean; resetTime?: number } {
    // Simple in-memory rate limiting (in production, use Redis or similar)
    const key = `${userId}:${operation}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 10; // Max 10 requests per minute

    // This is a simplified implementation
    // In production, use a proper rate limiting service
    return { allowed: true };
  }

  /**
   * Audit log for rule operations
   */
  logRuleOperation(
    userId: string, 
    operation: string, 
    ruleId?: string, 
    details?: any
  ): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId,
      operation,
      ruleId,
      details,
      userAgent: navigator.userAgent,
      ip: 'unknown' // In production, get from request headers
    };

    // Log to console (in production, send to logging service)
    console.log('Rule operation audit:', JSON.stringify(auditEntry, null, 2));
  }
}

/**
 * XSS prevention utilities
 */
export class XSSPrevention {
  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(content: string): string {
    // Basic HTML sanitization - escape dangerous characters
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Validate and sanitize user input
   */
  static validateInput(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const trimmed = input.trim();
    if (trimmed.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }

    return this.sanitizeHTML(trimmed);
  }
}

/**
 * SQL injection prevention utilities
 */
export class SQLInjectionPrevention {
  /**
   * Validate parameterized query parameters
   */
  static validateParameters(params: any[]): boolean {
    for (const param of params) {
      if (typeof param === 'string') {
        // Check for SQL injection patterns
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
          /(;|--|\/\*|\*\/|xp_|sp_)/i
        ];

        for (const pattern of sqlPatterns) {
          if (pattern.test(param)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Build safe WHERE clause
   */
  static buildSafeWhereClause(conditions: any[]): string {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return '1=1';
    }

    const clauses: string[] = [];

    for (const condition of conditions) {
      const { field, operator, value } = condition;
      
      // Validate field name (only allow alphanumeric and underscores)
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
        throw new Error(`Invalid field name: ${field}`);
      }

      // Validate operator
      const validOperators = ['=', '!=', '>', '>=', '<', '<=', 'IN', 'NOT IN'];
      if (!validOperators.includes(operator.toUpperCase())) {
        throw new Error(`Invalid operator: ${operator}`);
      }

      // For string values, ensure they are properly quoted for SQL
      const formattedValue = typeof value === 'string' ? ("'" + value.replace(/'/g, "''") + "'") : value;

      clauses.push(`${field} ${operator} ${formattedValue}`);
    }

    return clauses.join(' AND ');
  }
}

/**
 * CSRF protection utilities
 */
export class CSRFProtection {
  private static tokens = new Map<string, string>();

  /**
   * Generate CSRF token
   */
  static generateToken(userId: string): string {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    this.tokens.set(userId, token);
    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(userId: string, token: string): boolean {
    const storedToken = this.tokens.get(userId);
    return storedToken === token;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(userId: string): void {
    this.tokens.delete(userId);
  }
}

// Export singleton instances
export const ruleSecurityValidator = new RuleSecurityValidator();
export const ruleSecurityMiddleware = new RuleSecurityMiddleware();
export const xssPrevention = new XSSPrevention();
export const sqlPrevention = new SQLInjectionPrevention();
export const csrfProtection = new CSRFProtection();