// @ts-ignore
import { PrismaClient } from '@prisma/client';
import {
  PricingCalculationRequest,
  PricingCalculationResponse,
  MarkupRule,
  CommissionRule,
  CorporateContract,
  DiscountCoupon,
  CustomerLoyalty,
  LoyaltyTransactionCreate,
  CouponValidationResult
} from '../types';
import {
  calculateMarkupAmount,
  calculateCommissionAmount,
  applyAmountConstraints,
  filterActiveRules,
  sortRulesByPriority
} from '../utils';
import { PricingCalculationError, InvalidCouponError } from '../errors';
import { RuleMatchingEngine } from './ruleMatchingEngine';

/**
 * Pricing Engine
 *
 * Handles comprehensive pricing calculations including markups, discounts, commissions, taxes,
 * loyalty discounts, and coupon validations. Consolidates all pricing-related business logic.
 */
export class PricingEngine {
  private prisma: any;
  private ruleMatchingEngine: RuleMatchingEngine;

  constructor(ruleMatchingEngine?: RuleMatchingEngine) {
    this.prisma = new PrismaClient();
    this.ruleMatchingEngine = ruleMatchingEngine || new RuleMatchingEngine(true);
  }

  /**
   * Calculate comprehensive pricing for a booking
   */
  async calculatePricing(request: PricingCalculationRequest): Promise<PricingCalculationResponse> {
    const {
      bookingType,
      baseAmount,
      currency,
      companyId,
      branchId,
      userId,
      supplierId,
      serviceDetails,
      couponCode
    } = request;

    try {
      let currentAmount = baseAmount;
      let markupAmount = 0;
      let discountAmount = 0;
      let commissionAmount = 0;
      let loyaltyDiscount = 0;

      const appliedRules: any = {};

      // 1. Apply markup rules
      const markupRule = await this.ruleMatchingEngine.findFirstApplicableMarkupRule({
        bookingType,
        companyId,
        branchId,
        userId,
        supplierId,
        serviceDetails
      });

      if (markupRule) {
        markupAmount = this.applyMarkupRule(currentAmount, markupRule);
        currentAmount += markupAmount;
        appliedRules.markupRule = markupRule;
      }

      // 2. Apply corporate contract discounts
      if (companyId) {
        const corporateContract = await this.findApplicableCorporateContract(companyId, bookingType);
        if (corporateContract) {
          const contractDiscount = this.calculateCorporateDiscount(currentAmount, corporateContract, bookingType);
          discountAmount += contractDiscount;
          currentAmount -= contractDiscount;
          appliedRules.corporateContract = corporateContract;
        }
      }

      // 3. Apply coupon discounts
      if (couponCode && userId) {
        const couponResult = await this.validateAndApplyCoupon(couponCode, userId, currentAmount, currency);
        if (couponResult.valid && couponResult.discountAmount) {
          discountAmount += couponResult.discountAmount;
          currentAmount -= couponResult.discountAmount;
          appliedRules.discountCoupon = couponResult.coupon;
        }
      }

      // 4. Apply loyalty discounts
      if (userId) {
        loyaltyDiscount = await this.calculateLoyaltyDiscount(userId, currentAmount);
        if (loyaltyDiscount > 0) {
          currentAmount -= loyaltyDiscount;

          // Get loyalty tier info
          const customerLoyalty = await this.getCustomerLoyalty(userId);
          if (customerLoyalty?.currentTier) {
            appliedRules.loyaltyTier = customerLoyalty.currentTier;
          }
        }
      }

      // 5. Calculate commission
      const commissionRule = await this.ruleMatchingEngine.findFirstApplicableCommissionRule({
        bookingType,
        companyId,
        supplierId,
        serviceDetails
      });

      if (commissionRule) {
        commissionAmount = this.applyCommissionRule(baseAmount, commissionRule);
        appliedRules.commissionRule = commissionRule;
      }

      // Build price breakdown
      const breakdown = [
        { label: 'Base Amount', amount: baseAmount, type: 'base' as const },
        { label: 'Markup', amount: markupAmount, type: 'markup' as const },
        { label: 'Discount', amount: -(discountAmount + loyaltyDiscount), type: 'discount' as const },
        { label: 'Commission', amount: commissionAmount, type: 'fee' as const }
      ];

      return {
        baseAmount,
        markup: markupAmount,
        markupRuleId: appliedRules.markupRule?.id,
        taxes: [],
        totalTax: 0,
        discount: discountAmount + loyaltyDiscount,
        couponId: appliedRules.discountCoupon?.id,
        commission: commissionAmount,
        commissionRuleId: appliedRules.commissionRule?.id,
        totalAmount: currentAmount,
        breakdown
      };
    } catch (error) {
      throw new PricingCalculationError('Pricing calculation failed', {
        error: error instanceof Error ? error.message : String(error),
        request
      });
    }
  }

  /**
   * Apply a markup rule to calculate markup amount
   */
  private applyMarkupRule(baseAmount: number, rule: MarkupRule): number {
    const markup = calculateMarkupAmount(baseAmount, rule.markupValue, rule.markupType);
    return applyAmountConstraints(markup, rule.minMarkup, rule.maxMarkup);
  }

  /**
   * Apply a commission rule to calculate commission amount
   */
  private applyCommissionRule(baseAmount: number, rule: CommissionRule): number {
    const commission = calculateCommissionAmount(baseAmount, rule.commissionValue, rule.commissionType);
    return applyAmountConstraints(commission, rule.minCommission, rule.maxCommission);
  }

  /**
   * Find applicable corporate contract
   */
  private async findApplicableCorporateContract(
    companyId: string,
    bookingType: string
  ): Promise<CorporateContract | null> {
    try {
      const contract = await this.prisma.corporateContract.findFirst({
        where: {
          companyId,
          status: 'active',
          validFrom: { lte: new Date() },
          OR: [{ validTo: null }, { validTo: { gte: new Date() } }]
        }
      });

      return contract as CorporateContract | null;
    } catch (error) {
      // Log error but don't throw - contracts are optional
      return null;
    }
  }

  /**
   * Calculate corporate contract discount
   */
  private calculateCorporateDiscount(
    amount: number,
    contract: CorporateContract,
    bookingType: string
  ): number {
    let discount = 0;

    // Base discount percentage
    if (contract.baseDiscountPercentage > 0) {
      discount = amount * (contract.baseDiscountPercentage / 100);
    }

    // Service-specific discounts
    if (contract.serviceDiscounts?.[bookingType]) {
      const serviceDiscount = (contract.serviceDiscounts[bookingType] as number) || 0;
      discount = Math.max(discount, amount * (serviceDiscount / 100));
    }

    return Math.max(0, discount);
  }

  /**
   * Validate and apply coupon discount
   */
  async validateAndApplyCoupon(
    code: string,
    userId: string,
    amount: number,
    currency: string
  ): Promise<CouponValidationResult> {
    try {
      const coupon = await this.prisma.discountCoupon.findUnique({
        where: { code }
      });

      if (!coupon) {
        return {
          valid: false,
          errorCode: 'INVALID_CODE',
          errorMessage: 'Coupon code not found'
        };
      }

      // Check if active
      if (!coupon.isActive) {
        return {
          valid: false,
          errorCode: 'EXPIRED',
          errorMessage: 'Coupon is not active'
        };
      }

      // Check validity period
      const now = new Date();
      if (new Date(coupon.validFrom) > now || (coupon.validTo && new Date(coupon.validTo) < now)) {
        return {
          valid: false,
          errorCode: 'EXPIRED',
          errorMessage: 'Coupon is expired'
        };
      }

      // Check minimum order amount
      if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
        return {
          valid: false,
          errorCode: 'MIN_AMOUNT',
          errorMessage: `Minimum order amount is ${currency} ${coupon.minOrderAmount}`
        };
      }

      // Check usage limits
      if (coupon.totalUsageLimit && coupon.currentUsage >= coupon.totalUsageLimit) {
        return {
          valid: false,
          errorCode: 'USAGE_LIMIT',
          errorMessage: 'Coupon usage limit exceeded'
        };
      }

      // Check per-user limits
      if (coupon.perUserLimit) {
        const userUsage = await this.prisma.couponRedemption.count({
          where: { couponId: coupon.id, userId }
        });
        if (userUsage >= coupon.perUserLimit) {
          return {
            valid: false,
            errorCode: 'USAGE_LIMIT',
            errorMessage: 'Per-user usage limit exceeded'
          };
        }
      }

      // Check user restrictions
      if (coupon.allowedUserIds?.length && !coupon.allowedUserIds.includes(userId)) {
        return {
          valid: false,
          errorCode: 'NOT_APPLICABLE',
          errorMessage: 'Coupon not applicable for this user'
        };
      }

      if (coupon.excludedUserIds?.includes(userId)) {
        return {
          valid: false,
          errorCode: 'NOT_APPLICABLE',
          errorMessage: 'Coupon not applicable for this user'
        };
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = amount * (coupon.discountValue / 100);
      } else if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue;
      }

      // Apply maximum discount limit
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }

      return {
        valid: true,
        coupon: coupon as DiscountCoupon,
        discountAmount
      };
    } catch (error) {
      throw new InvalidCouponError(code, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Calculate loyalty discount for user
   */
  private async calculateLoyaltyDiscount(userId: string, amount: number): Promise<number> {
    const customerLoyalty = await this.getCustomerLoyalty(userId);
    if (!customerLoyalty?.currentTier) {
      return 0;
    }

    const discountPercentage = customerLoyalty.currentTier.discountPercentage;
    return amount * (discountPercentage / 100);
  }

  /**
   * Get customer loyalty information
   */
  async getCustomerLoyalty(userId: string): Promise<CustomerLoyalty | null> {
    try {
      const loyalty = await this.prisma.customerLoyalty.findUnique({
        where: { userId },
        include: { currentTier: true }
      });

      return loyalty as CustomerLoyalty | null;
    } catch (error) {
      // Return null if loyalty not found
      return null;
    }
  }

  /**
   * Record coupon redemption
   */
  async recordCouponRedemption(redemptionData: {
    couponId: string;
    userId: string;
    bookingId?: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    currency: string;
  }): Promise<void> {
    try {
      await this.prisma.couponRedemption.create({
        data: redemptionData as any
      });

      // Update coupon usage count
      await this.prisma.discountCoupon.update({
        where: { id: redemptionData.couponId },
        data: { currentUsage: { increment: 1 } }
      });
    } catch (error) {
      throw new PricingCalculationError('Failed to record coupon redemption', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Award loyalty points to user
   */
  async awardLoyaltyPoints(transactionData: LoyaltyTransactionCreate): Promise<void> {
    try {
      // Create transaction record
      await this.prisma.loyaltyTransaction.create({
        data: transactionData as any
      });

      // Update customer loyalty points
      const pointsChange = transactionData.transactionType === 'redeem' ? -transactionData.points : transactionData.points;

      await this.prisma.customerLoyalty.upsert({
        where: { userId: transactionData.userId },
        update: {
          totalPoints: { increment: pointsChange },
          availablePoints: { increment: pointsChange },
          lifetimePoints: { increment: Math.max(0, pointsChange) },
          lastActivityAt: new Date()
        },
        create: {
          userId: transactionData.userId,
          totalPoints: Math.max(0, pointsChange),
          availablePoints: Math.max(0, pointsChange),
          lifetimePoints: Math.max(0, pointsChange),
          lastActivityAt: new Date()
        }
      });

      // Update tier if needed
      await this.updateCustomerTier(transactionData.userId);
    } catch (error) {
      throw new PricingCalculationError('Failed to award loyalty points', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update customer loyalty tier based on points
   */
  private async updateCustomerTier(userId: string): Promise<void> {
    try {
      const customerLoyalty = await this.prisma.customerLoyalty.findUnique({
        where: { userId },
        include: { currentTier: true }
      });

      if (!customerLoyalty) return;

      // Find appropriate tier
      const appropriateTier = await this.prisma.loyaltyTier.findFirst({
        where: {
          isActive: true,
          minPoints: { lte: customerLoyalty.totalPoints },
          OR: [
            { maxPoints: null },
            { maxPoints: { gte: customerLoyalty.totalPoints } }
          ]
        },
        orderBy: { tierLevel: 'desc' }
      });

      if (appropriateTier && appropriateTier.id !== customerLoyalty.currentTierId) {
        await this.prisma.customerLoyalty.update({
          where: { userId },
          data: {
            currentTierId: appropriateTier.id,
            tierQualifiedAt: new Date()
          }
        });
      }
    } catch (error) {
      // Log but don't throw - tier update is not critical
    }
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
