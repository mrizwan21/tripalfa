import { MarkupRule, CommissionRule, RuleMatchContext } from '../types';

/**
 * Utility functions for rule matching and validation
 */

/**
 * Check if a markup rule matches the given context
 */
export function ruleMatchesConditions(rule: MarkupRule, context: RuleMatchContext): boolean {
  if (!rule.conditions) {
    return true;
  }

  const conditions = rule.conditions;

  // Check supplier codes
  if (conditions.supplierCode && Array.isArray(conditions.supplierCode)) {
    if (context.supplierCode && !conditions.supplierCode.includes(context.supplierCode)) {
      return false;
    }
  }

  // Check fare class
  if (conditions.fareClass && Array.isArray(conditions.fareClass)) {
    if (context.fareClass && !conditions.fareClass.includes(context.fareClass)) {
      return false;
    }
  }

  // Check advance booking days
  if (conditions.advanceBookingDays) {
    if (context.advanceBookingDays !== undefined) {
      const min = conditions.advanceBookingDays.min || 0;
      const max = conditions.advanceBookingDays.max || Infinity;
      if (context.advanceBookingDays < min || context.advanceBookingDays > max) {
        return false;
      }
    }
  }

  // Check travel date range
  if (conditions.travelDateRange && context.travelDate) {
    const from = new Date(conditions.travelDateRange.from);
    const to = new Date(conditions.travelDateRange.to);
    if (context.travelDate < from || context.travelDate > to) {
      return false;
    }
  }

  // Check cabin class
  if (conditions.cabinClass && Array.isArray(conditions.cabinClass)) {
    if (context.cabinClass && !conditions.cabinClass.includes(context.cabinClass)) {
      return false;
    }
  }

  // Check route type
  if (conditions.routeType) {
    if (context.routeType && conditions.routeType !== 'all' && conditions.routeType !== context.routeType) {
      return false;
    }
  }

  return true;
}

/**
 * Sort rules by priority (highest first)
 */
export function sortRulesByPriority<T extends { priority: number; createdAt: string }>(rules: T[]): T[] {
  return [...rules].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // If priority is same, sort by creation date (newer first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Filter active rules within their validity period
 */
export function filterActiveRules<T extends { isActive: boolean; validFrom: string; validTo?: string }>(
  rules: T[],
  asOfDate: Date = new Date()
): T[] {
  return rules.filter(rule => {
    if (!rule.isActive) {
      return false;
    }

    const validFrom = new Date(rule.validFrom);
    const validTo = rule.validTo ? new Date(rule.validTo) : null;

    return asOfDate >= validFrom && (!validTo || asOfDate <= validTo);
  });
}

/**
 * Check if rule applies to a specific service type
 */
export function ruleAppliesToService(rule: { applicableTo: string[] }, serviceType: string): boolean {
  return rule.applicableTo.includes(serviceType) || rule.applicableTo.includes('all');
}

/**
 * Check if rule applies to a specific entity (supplier, branch, user)
 */
export function ruleAppliesToEntity(
  rule: { supplierIds?: string[]; branchIds?: string[]; userIds?: string[] },
  entityType: 'supplier' | 'branch' | 'user',
  entityId?: string
): boolean {
  if (!entityId) {
    return true; // No restriction if no entity ID provided
  }

  const fieldMap = {
    supplier: 'supplierIds',
    branch: 'branchIds',
    user: 'userIds'
  };

  const field = fieldMap[entityType] as keyof typeof rule;
  const ids = rule[field];

  if (!ids || ids.length === 0) {
    return true; // No restriction if empty list
  }

  return ids.includes(entityId);
}

/**
 * Calculate markup amount based on rule and base amount
 */
export function calculateMarkupAmount(baseAmount: number, markupValue: number, markupType: string): number {
  let markup = 0;

  switch (markupType) {
    case 'percentage':
      markup = baseAmount * (markupValue / 100);
      break;
    case 'fixed':
      markup = markupValue;
      break;
    case 'multiplier':
      markup = baseAmount * markupValue;
      break;
    default:
      throw new Error(`Unknown markup type: ${markupType}`);
  }

  return Math.max(0, markup);
}

/**
 * Apply min/max constraints to a calculated amount
 */
export function applyAmountConstraints(amount: number, min?: number, max?: number): number {
  let constrained = amount;

  if (min !== undefined && constrained < min) {
    constrained = min;
  }

  if (max !== undefined && constrained > max) {
    constrained = max;
  }

  return constrained;
}

/**
 * Calculate commission amount based on rule and base amount
 */
export function calculateCommissionAmount(baseAmount: number, commissionValue: number, commissionType: string): number {
  let commission = 0;

  switch (commissionType) {
    case 'percentage':
      commission = baseAmount * (commissionValue / 100);
      break;
    case 'fixed':
      commission = commissionValue;
      break;
    default:
      throw new Error(`Unknown commission type: ${commissionType}`);
  }

  return Math.max(0, commission);
}
