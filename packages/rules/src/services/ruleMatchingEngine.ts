// @ts-ignore
import { PrismaClient } from '@prisma/client';
import { MarkupRule, CommissionRule, RuleMatchContext } from '../types';
import { ruleMatchesConditions, sortRulesByPriority, filterActiveRules, ruleAppliesToService } from '../utils';
import { RuleMatchingError } from '../errors';

/**
 * Rule Matching Engine
 *
 * Provides functionality to find and match applicable markup and commission rules
 * based on context parameters. Supports caching for performance optimization.
 */
export class RuleMatchingEngine {
  private prisma: any;
  private cacheEnabled: boolean = false;
  private cache: Map<string, any> = new Map();
  private cacheTTL: number = 300000; // 5 minutes

  constructor(cacheEnabled: boolean = false) {
    this.prisma = new PrismaClient();
    this.cacheEnabled = cacheEnabled;
  }

  /**
   * Find all applicable markup rules for the given context
   */
  async findApplicableMarkupRules(context: RuleMatchContext): Promise<MarkupRule[]> {
    try {
      const cacheKey = this.getCacheKey('markup', context);

      // Check cache first
      if (this.cacheEnabled && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const serviceType = context.bookingType || context.serviceType || 'all';

      // Fetch from database
      let rules = await this.prisma.markupRule.findMany({
        where: {
          isActive: true,
          validFrom: { lte: new Date() },
          OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
          ...(context.companyId && { companyId: context.companyId }),
          applicableTo: { hasSome: [serviceType, 'all'] }
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
      });

      // Filter based on context matching
      const applicableRules = rules
        .filter((rule: MarkupRule) => this.contextMatches(rule, context))
        .filter((rule: MarkupRule) => ruleMatchesConditions(rule, context));

      // Sort by priority
      const sorted = sortRulesByPriority(applicableRules) as MarkupRule[];

      // Cache results
      if (this.cacheEnabled) {
        this.cache.set(cacheKey, sorted);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);
      }

      return sorted;
    } catch (error) {
      throw new RuleMatchingError('Error finding applicable markup rules', { error: String(error) });
    }
  }

  /**
   * Find all applicable commission rules for the given context
   */
  async findApplicableCommissionRules(context: RuleMatchContext): Promise<CommissionRule[]> {
    try {
      const cacheKey = this.getCacheKey('commission', context);

      // Check cache first
      if (this.cacheEnabled && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const serviceType = context.bookingType || context.serviceType || 'all';

      // Fetch from database
      let rules = await this.prisma.commissionRule.findMany({
        where: {
          isActive: true,
          validFrom: { lte: new Date() },
          OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
          ...(context.companyId && { companyId: context.companyId }),
          applicableTo: { hasSome: [serviceType, 'all'] }
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
      });

      // Filter based on context matching
      const applicableRules = rules.filter((rule: CommissionRule) => this.contextMatchesCommission(rule, context));

      // Sort by priority
      const sorted = sortRulesByPriority(applicableRules) as CommissionRule[];

      // Cache results
      if (this.cacheEnabled) {
        this.cache.set(cacheKey, sorted);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);
      }

      return sorted;
    } catch (error) {
      throw new RuleMatchingError('Error finding applicable commission rules', { error: String(error) });
    }
  }

  /**
   * Find first applicable markup rule (highest priority)
   */
  async findFirstApplicableMarkupRule(context: RuleMatchContext): Promise<MarkupRule | null> {
    const rules = await this.findApplicableMarkupRules(context);
    return rules.length > 0 ? rules[0] : null;
  }

  /**
   * Find first applicable commission rule (highest priority)
   */
  async findFirstApplicableCommissionRule(context: RuleMatchContext): Promise<CommissionRule | null> {
    const rules = await this.findApplicableCommissionRules(context);
    return rules.length > 0 ? rules[0] : null;
  }

  /**
   * Invalidate cache for a rule type
   */
  invalidateCache(ruleType?: 'markup' | 'commission'): void {
    if (!ruleType) {
      this.cache.clear();
    } else {
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.includes(`:${ruleType}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }

  /**
   * Enable/disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.cache.clear();
    }
  }

  /**
   * Check if markup rule context matches
   */
  private contextMatches(rule: MarkupRule, context: RuleMatchContext): boolean {
    // Check branch restrictions
    if (rule.branchIds?.length && context.branchId && !rule.branchIds.includes(context.branchId)) {
      return false;
    }

    // Check user restrictions
    if (rule.userIds?.length && context.userId && !rule.userIds.includes(context.userId)) {
      return false;
    }

    // Check supplier restrictions
    if (rule.supplierIds?.length && context.supplierId && !rule.supplierIds.includes(context.supplierId)) {
      return false;
    }

    return true;
  }

  /**
   * Check if commission rule context matches
   */
  private contextMatchesCommission(rule: CommissionRule, context: RuleMatchContext): boolean {
    // Check supplier restrictions
    if (rule.supplierIds?.length && context.supplierId && !rule.supplierIds.includes(context.supplierId)) {
      return false;
    }

    return true;
  }

  /**
   * Generate cache key for context
   */
  private getCacheKey(type: string, context: RuleMatchContext): string {
    const contextKey = [
      context.bookingType,
      context.companyId,
      context.supplierId,
      context.branchId,
      context.userId
    ]
      .filter(Boolean)
      .join(':');

    return `rules:${type}:${contextKey || 'default'}`;
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
