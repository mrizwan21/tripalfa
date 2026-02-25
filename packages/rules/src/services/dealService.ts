// @ts-ignore
import { PrismaClient } from '@prisma/client';
import {
  SupplierDeal,
  SupplierDealCreate,
  SupplierDealUpdate,
  DealFilters,
  DealApplication,
  ValidationResult,
  ConflictReport,
  DealMappingRules,
  DealMappingRuleCreate
} from '../types';

/**
 * Deal Service
 *
 * Core service for managing supplier deals, mapping rules, and applications.
 * Handles creation, updates, validation, and lifecycle management of deals.
 */
export class DealService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new supplier deal with mapping rules
   */
  async createDeal(dealData: SupplierDealCreate): Promise<SupplierDeal> {
    try {
      // Validate deal data
      const validation = await this.validateDealCreation(dealData);
      if (!validation.isValid) {
        throw new Error(`Deal validation failed: ${validation.errors.join(', ')}`);
      }

      // Create deal with mapping rules in transaction
      const result = await this.prisma.$transaction(async (tx: any) => {
        const deal = await tx.supplierDeals.create({
          data: {
            name: dealData.name,
            code: dealData.code,
            productType: dealData.productType,
            supplierCodes: dealData.supplierCodes,
            dealType: dealData.dealType,
            discountType: dealData.discountType,
            discountValue: dealData.discountValue,
            maxDiscount: dealData.maxDiscount,
            minOrderAmount: dealData.minOrderAmount,
            priority: dealData.priority || 0,
            isCombinableWithCoupons: dealData.isCombinableWithCoupons || false,
            validFrom: new Date(dealData.validFrom),
            validTo: new Date(dealData.validTo),
            metadata: dealData.metadata || {}
          }
        });

        // Create mapping rules
        if (dealData.mappingRules && dealData.mappingRules.length > 0) {
          await tx.dealMappingRules.createMany({
            data: dealData.mappingRules.map((rule: DealMappingRuleCreate) => ({
              dealId: deal.id,
              journeyType: rule.journeyType || 'all',
              bookingClasses: rule.bookingClasses || [],
              rbds: rule.rbds || [],
              cabinClasses: rule.cabinClasses || [],
              originCities: rule.originCities || [],
              destinationCities: rule.destinationCities || [],
              originCountries: rule.originCountries || [],
              destinationCountries: rule.destinationCountries || [],
              regions: rule.regions || [],
              routes: rule.routes || [],
              channels: rule.channels || [],
              b2bCompanyIds: rule.b2bCompanyIds || [],
              hotelCategories: rule.hotelCategories || [],
              hotelStarRatings: rule.hotelStarRatings || [],
              conditions: rule.conditions || {}
            }))
          });
        }

        return deal;
      });

      return this.mapPrismaToDeal(result);
    } catch (error) {
      throw new Error(`Failed to create deal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update an existing deal
   */
  async updateDeal(id: string, updates: SupplierDealUpdate): Promise<SupplierDeal> {
    try {
      const result = await this.prisma.$transaction(async (tx: any) => {
        const deal = await tx.supplierDeals.update({
          where: { id },
          data: {
            ...(updates.name && { name: updates.name }),
            ...(updates.code && { code: updates.code }),
            ...(updates.dealType && { dealType: updates.dealType }),
            ...(updates.discountType && { discountType: updates.discountType }),
            ...(updates.discountValue !== undefined && { discountValue: updates.discountValue }),
            ...(updates.maxDiscount !== undefined && { maxDiscount: updates.maxDiscount }),
            ...(updates.minOrderAmount !== undefined && { minOrderAmount: updates.minOrderAmount }),
            ...(updates.status && { status: updates.status }),
            ...(updates.priority !== undefined && { priority: updates.priority }),
            ...(updates.isCombinableWithCoupons !== undefined && { isCombinableWithCoupons: updates.isCombinableWithCoupons }),
            ...(updates.validFrom && { validFrom: new Date(updates.validFrom) }),
            ...(updates.validTo && { validTo: new Date(updates.validTo) }),
            ...(updates.metadata && { metadata: updates.metadata }),
            ...(updates.supplierCodes && { supplierCodes: updates.supplierCodes }),
            updatedAt: new Date()
          }
        });

        // Update mapping rules if provided
        if (updates.mappingRules) {
          await tx.dealMappingRules.deleteMany({ where: { dealId: id } });
          if (updates.mappingRules.length > 0) {
            await tx.dealMappingRules.createMany({
              data: updates.mappingRules.map((rule: DealMappingRuleCreate) => ({
                dealId: id,
                journeyType: rule.journeyType || 'all',
                bookingClasses: rule.bookingClasses || [],
                rbds: rule.rbds || [],
                cabinClasses: rule.cabinClasses || [],
                originCities: rule.originCities || [],
                destinationCities: rule.destinationCities || [],
                originCountries: rule.originCountries || [],
                destinationCountries: rule.destinationCountries || [],
                regions: rule.regions || [],
                routes: rule.routes || [],
                channels: rule.channels || [],
                b2bCompanyIds: rule.b2bCompanyIds || [],
                hotelCategories: rule.hotelCategories || [],
                hotelStarRatings: rule.hotelStarRatings || [],
                conditions: rule.conditions || {}
              }))
            });
          }
        }

        return deal;
      });

      return this.mapPrismaToDeal(result);
    } catch (error) {
      throw new Error(`Failed to update deal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get deal by ID
   */
  async getDeal(id: string): Promise<SupplierDeal | null> {
    try {
      const deal = await this.prisma.supplierDeal.findUnique({
        where: { id },
        include: { dealMappingRules: true }
      });

      return deal ? this.mapPrismaToDeal(deal) : null;
    } catch (error) {
      throw new Error(`Failed to get deal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List deals with filters
   */
  async listDeals(filters?: DealFilters, skip: number = 0, take: number = 50): Promise<SupplierDeal[]> {
    try {
      const where: any = {};

      if (filters?.productType) where.productType = filters.productType;
      if (filters?.dealType) where.dealType = filters.dealType;
      if (filters?.status) where.status = filters.status;
      if (filters?.supplierCode) where.supplierCodes = { hasSome: [filters.supplierCode] };

      const deals = await this.prisma.supplierDeal.findMany({
        where,
        include: { dealMappingRules: true },
        orderBy: { priority: 'desc' },
        skip,
        take
      });

      return deals.map((deal: any) => this.mapPrismaToDeal(deal));
    } catch (error) {
      throw new Error(`Failed to list deals: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete deal (soft delete)
   */
  async deleteDeal(id: string): Promise<void> {
    try {
      await this.prisma.supplierDeal.update({
        where: { id },
        data: { status: 'archived', updatedAt: new Date() }
      });
    } catch (error) {
      throw new Error(`Failed to delete deal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Activate deal
   */
  async activateDeal(id: string): Promise<SupplierDeal> {
    try {
      const deal = await this.prisma.supplierDeal.update({
        where: { id },
        data: { status: 'active', updatedAt: new Date() }
      });

      return this.mapPrismaToDeal(deal);
    } catch (error) {
      throw new Error(`Failed to activate deal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Pause deal
   */
  async pauseDeal(id: string): Promise<SupplierDeal> {
    try {
      const deal = await this.prisma.supplierDeal.update({
        where: { id },
        data: { status: 'paused', updatedAt: new Date() }
      });

      return this.mapPrismaToDeal(deal);
    } catch (error) {
      throw new Error(`Failed to pause deal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate deal creation
   */
  private async validateDealCreation(dealData: SupplierDealCreate): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!dealData.name) errors.push('Deal name is required');
    if (!dealData.code) errors.push('Deal code is required');
    if (!dealData.productType) errors.push('Product type is required');
    if (!dealData.dealType) errors.push('Deal type is required');
    if (dealData.discountValue === undefined || dealData.discountValue < 0) errors.push('Discount value must be >= 0');
    if (!dealData.validFrom) errors.push('Valid from date is required');
    if (!dealData.validTo) errors.push('Valid to date is required');
    if (new Date(dealData.validFrom) >= new Date(dealData.validTo)) errors.push('Valid to date must be after valid from date');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Map Prisma deal to interface
   */
  private mapPrismaToDeal(prismaDeal: any): SupplierDeal {
    return {
      id: prismaDeal.id,
      name: prismaDeal.name,
      code: prismaDeal.code,
      productType: prismaDeal.productType,
      dealType: prismaDeal.dealType,
      status: prismaDeal.status,
      supplierCodes: prismaDeal.supplierCodes,
      discountType: prismaDeal.discountType,
      discountValue: Number(prismaDeal.discountValue),
      maxDiscount: prismaDeal.maxDiscount ? Number(prismaDeal.maxDiscount) : undefined,
      minOrderAmount: prismaDeal.minOrderAmount ? Number(prismaDeal.minOrderAmount) : undefined,
      priority: prismaDeal.priority,
      isCombinableWithCoupons: prismaDeal.isCombinableWithCoupons,
      validFrom: prismaDeal.validFrom.toISOString(),
      validTo: prismaDeal.validTo.toISOString(),
      metadata: prismaDeal.metadata,
      createdAt: prismaDeal.createdAt.toISOString(),
      updatedAt: prismaDeal.updatedAt.toISOString()
    };
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
