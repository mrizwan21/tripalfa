import { PrismaClient } from "@prisma/client";
import {
  MarkupRule,
  MarkupRuleCreate,
  MarkupRuleUpdate,
  RuleMatchContext,
  ValidationResult,
} from "../types";

/**
 * Markup Service
 *
 * Core service for managing markup rules with CRUD operations.
 * Handles creation, updates, validation, and lifecycle management of markup rules.
 * Provides fine-grained pricing control across different service types and customer segments.
 */
export class MarkupService {
  private prisma: any;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new markup rule
   */
  async createMarkupRule(ruleData: MarkupRuleCreate): Promise<MarkupRule> {
    try {
      // Validate rule data
      const validation = await this.validateMarkupRuleCreation(ruleData);
      if (!validation.isValid) {
        throw new Error(
          `Markup rule validation failed: ${validation.errors.join(", ")}`,
        );
      }

      const result = await this.prisma.markupRule.create({
        data: {
          companyId: ruleData.companyId,
          name: ruleData.name,
          code: ruleData.code,
          priority: ruleData.priority || 0,
          applicableTo: ruleData.applicableTo,
          serviceTypes: ruleData.serviceTypes || [],
          markupType: ruleData.markupType,
          markupValue: ruleData.markupValue,
          minMarkup: ruleData.minMarkup,
          maxMarkup: ruleData.maxMarkup,
          conditions: ruleData.conditions,
          supplierIds: ruleData.supplierIds || [],
          branchIds: ruleData.branchIds || [],
          userIds: ruleData.userIds || [],
          validFrom: new Date(ruleData.validFrom),
          validTo: ruleData.validTo ? new Date(ruleData.validTo) : null,
          isActive: true,
          metadata: ruleData.metadata || {},
        },
      });

      return this.mapPrismaToMarkupRule(result);
    } catch (error) {
      throw new Error(
        `Failed to create markup rule: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Update an existing markup rule
   */
  async updateMarkupRule(
    id: string,
    updates: MarkupRuleUpdate,
  ): Promise<MarkupRule> {
    try {
      const result = await this.prisma.markupRule.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.priority !== undefined && { priority: updates.priority }),
          ...(updates.applicableTo && { applicableTo: updates.applicableTo }),
          ...(updates.serviceTypes && { serviceTypes: updates.serviceTypes }),
          ...(updates.markupType && { markupType: updates.markupType }),
          ...(updates.markupValue !== undefined && {
            markupValue: updates.markupValue,
          }),
          ...(updates.minMarkup !== undefined && {
            minMarkup: updates.minMarkup,
          }),
          ...(updates.maxMarkup !== undefined && {
            maxMarkup: updates.maxMarkup,
          }),
          ...(updates.conditions && { conditions: updates.conditions }),
          ...(updates.supplierIds && { supplierIds: updates.supplierIds }),
          ...(updates.branchIds && { branchIds: updates.branchIds }),
          ...(updates.userIds && { userIds: updates.userIds }),
          ...(updates.validFrom && { validFrom: new Date(updates.validFrom) }),
          ...(updates.validTo && { validTo: new Date(updates.validTo) }),
          ...(updates.metadata && { metadata: updates.metadata }),
          updatedAt: new Date(),
        },
      });

      return this.mapPrismaToMarkupRule(result);
    } catch (error) {
      throw new Error(
        `Failed to update markup rule: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get markup rule by ID
   */
  async getMarkupRule(id: string): Promise<MarkupRule | null> {
    try {
      const rule = await this.prisma.markupRule.findUnique({
        where: { id },
      });

      return rule ? this.mapPrismaToMarkupRule(rule) : null;
    } catch (error) {
      throw new Error(
        `Failed to get markup rule: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * List markup rules with optional filters
   */
  async listMarkupRules(
    filters?: {
      companyId?: string;
      serviceType?: string;
      isActive?: boolean;
      supplierId?: string;
    },
    skip: number = 0,
    take: number = 50,
  ): Promise<MarkupRule[]> {
    try {
      const where: any = {};

      if (filters?.companyId) where.companyId = filters.companyId;
      if (filters?.serviceType)
        where.serviceTypes = { hasSome: [filters.serviceType] };
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;
      if (filters?.supplierId)
        where.supplierIds = { hasSome: [filters.supplierId] };

      const rules = await this.prisma.markupRule.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip,
        take,
      });

      return rules.map((rule: any) => this.mapPrismaToMarkupRule(rule));
    } catch (error) {
      throw new Error(
        `Failed to list markup rules: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get applicable markup rules for a context
   */
  async getApplicableMarkupRules(
    context: RuleMatchContext,
  ): Promise<MarkupRule[]> {
    try {
      // Get all active rules that match the service type
      const rules = await this.prisma.markupRule.findMany({
        where: {
          isActive: true,
          serviceTypes: context.serviceType
            ? { hasSome: [context.serviceType] }
            : { isEmpty: false },
          OR: [
            {
              AND: [
                { validFrom: { lte: new Date() } },
                { OR: [{ validTo: null }, { validTo: { gte: new Date() } }] },
              ],
            },
          ],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });

      return rules.map((rule: any) => this.mapPrismaToMarkupRule(rule));
    } catch (error) {
      throw new Error(
        `Failed to get applicable markup rules: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete markup rule (soft delete)
   */
  async deleteMarkupRule(id: string): Promise<void> {
    try {
      await this.prisma.markupRule.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete markup rule: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Activate markup rule
   */
  async activateMarkupRule(id: string): Promise<MarkupRule> {
    try {
      const rule = await this.prisma.markupRule.update({
        where: { id },
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
      });

      return this.mapPrismaToMarkupRule(rule);
    } catch (error) {
      throw new Error(
        `Failed to activate markup rule: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Deactivate markup rule
   */
  async deactivateMarkupRule(id: string): Promise<MarkupRule> {
    try {
      const rule = await this.prisma.markupRule.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      return this.mapPrismaToMarkupRule(rule);
    } catch (error) {
      throw new Error(
        `Failed to deactivate markup rule: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Count markup rules matching filters
   */
  async countMarkupRules(filters?: {
    companyId?: string;
    serviceType?: string;
    isActive?: boolean;
  }): Promise<number> {
    try {
      const where: any = {};

      if (filters?.companyId) where.companyId = filters.companyId;
      if (filters?.serviceType)
        where.serviceTypes = { hasSome: [filters.serviceType] };
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;

      return await this.prisma.markupRule.count({ where });
    } catch (error) {
      throw new Error(
        `Failed to count markup rules: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Validate markup rule creation
   */
  private async validateMarkupRuleCreation(
    ruleData: MarkupRuleCreate,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!ruleData.name) errors.push("Rule name is required");
    if (!ruleData.code) errors.push("Rule code is required");
    if (!ruleData.applicableTo || ruleData.applicableTo.length === 0) {
      errors.push("Applicable to must have at least one value");
    }
    if (!ruleData.markupType) errors.push("Markup type is required");
    if (ruleData.markupValue === undefined || ruleData.markupValue < 0) {
      errors.push("Markup value must be >= 0");
    }

    // Validate date ranges
    if (ruleData.validFrom && ruleData.validTo) {
      const from = new Date(ruleData.validFrom);
      const to = new Date(ruleData.validTo);
      if (from >= to)
        errors.push("Valid to date must be after valid from date");
    }

    // Validate markup value based on type
    if (ruleData.markupType === "percentage" && ruleData.markupValue > 1000) {
      errors.push("Percentage markup value must be <= 1000%");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Map Prisma markup rule to interface
   */
  private mapPrismaToMarkupRule(prismaRule: any): MarkupRule {
    return {
      id: prismaRule.id,
      companyId: prismaRule.companyId,
      name: prismaRule.name,
      code: prismaRule.code,
      priority: prismaRule.priority,
      applicableTo: prismaRule.applicableTo,
      serviceTypes: prismaRule.serviceTypes,
      markupType: prismaRule.markupType,
      markupValue: Number(prismaRule.markupValue),
      minMarkup: prismaRule.minMarkup
        ? Number(prismaRule.minMarkup)
        : undefined,
      maxMarkup: prismaRule.maxMarkup
        ? Number(prismaRule.maxMarkup)
        : undefined,
      conditions: prismaRule.conditions,
      supplierIds: prismaRule.supplierIds,
      branchIds: prismaRule.branchIds,
      userIds: prismaRule.userIds,
      isActive: prismaRule.isActive,
      validFrom: prismaRule.validFrom ? prismaRule.validFrom.toISOString() : "",
      validTo: prismaRule.validTo
        ? prismaRule.validTo.toISOString()
        : undefined,
      metadata: prismaRule.metadata,
      createdAt: prismaRule.createdAt.toISOString(),
      updatedAt: prismaRule.updatedAt.toISOString(),
    };
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
