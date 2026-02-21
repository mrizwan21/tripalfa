import {
  SupplierDeal,
  DealMatchResult,
  SearchCriteria,
  CustomerContext,
  DealMappingRules
} from '../types';

/**
 * Deal Matching Engine
 *
 * Intelligent service for finding and applying applicable deals to search results.
 * Features priority-based matching, validation, and deal application to search results.
 */
export class DealMatchingEngine {
  private deals: Map<string, SupplierDeal> = new Map();
  private matchCache: Map<string, DealMatchResult[]> = new Map();
  private cacheEnabled: boolean = true;

  /**
   * Initialize engine with deals
   */
  initialize(deals: SupplierDeal[]): void {
    this.deals.clear();
    deals.forEach(deal => this.deals.set(deal.id, deal));
    this.matchCache.clear();
  }

  /**
   * Find applicable deals for search criteria
   */
  findApplicableDeals(
    criteria: SearchCriteria,
    context: CustomerContext,
    availableDeals?: SupplierDeal[]
  ): DealMatchResult[] {
    const cacheKey = this.generateCacheKey(criteria);

    // Check cache
    if (this.cacheEnabled && this.matchCache.has(cacheKey)) {
      return this.matchCache.get(cacheKey)!;
    }

    // Get deals to check
    const dealsToCheck = availableDeals || Array.from(this.deals.values());

    // Filter active and valid deals
    const validDeals = dealsToCheck.filter(deal => this.isDealValid(deal));

    // Match deals
    const matches: DealMatchResult[] = [];
    for (const deal of validDeals) {
      if (this.dealMatchesCriteria(deal, criteria, context)) {
        const discountAmount = this.calculateDealDiscount(deal, 0, criteria);
        matches.push({
          deal,
          discountAmount,
          applicableAmount: discountAmount,
          reason: `Deal ${deal.code} matches search criteria`,
          priority: deal.priority
        });
      }
    }

    // Sort by priority (descending)
    matches.sort((a, b) => b.priority - a.priority);

    // Cache results
    if (this.cacheEnabled) {
      this.matchCache.set(cacheKey, matches);
    }

    return matches;
  }

  /**
   * Find best deal for amount and criteria
   */
  findBestDeal(
    criteria: SearchCriteria,
    context: CustomerContext,
    baseAmount: number,
    availableDeals?: SupplierDeal[]
  ): DealMatchResult | null {
    const matches = this.findApplicableDeals(criteria, context, availableDeals);

    if (matches.length === 0) return null;

    // Find deal with maximum discount
    let bestMatch = matches[0];
    let maxDiscount = this.calculateDealDiscount(bestMatch.deal, baseAmount, criteria);

    for (let i = 1; i < matches.length; i++) {
      const discount = this.calculateDealDiscount(matches[i].deal, baseAmount, criteria);
      if (discount > maxDiscount) {
        maxDiscount = discount;
        bestMatch = matches[i];
      }
    }

    return {
      ...bestMatch,
      discountAmount: maxDiscount,
      applicableAmount: maxDiscount
    };
  }

  /**
   * Apply deals to search result
   */
  applyDealsToSearchResults(
    searchResults: any[],
    criteria: SearchCriteria,
    context: CustomerContext
  ): any[] {
    return searchResults.map(result => {
      const bestDeal = this.findBestDeal(criteria, context, result.price || result.total);
      
      if (bestDeal) {
        return {
          ...result,
          applicableDeals: [bestDeal],
          originalPrice: result.price || result.total,
          discountApplied: bestDeal.discountAmount,
          finalPrice: (result.price || result.total) - bestDeal.discountAmount,
          dealCode: bestDeal.deal.code
        };
      }

      return result;
    });
  }

  /**
   * Check if deal is currently valid
   */
  private isDealValid(deal: SupplierDeal): boolean {
    const now = new Date();
    const validFrom = new Date(deal.validFrom);
    const validTo = new Date(deal.validTo);

    return (
      deal.status === 'active' &&
      now >= validFrom &&
      now <= validTo
    );
  }

  /**
   * Check if deal matches search criteria
   */
  private dealMatchesCriteria(
    deal: SupplierDeal,
    criteria: SearchCriteria,
    context: CustomerContext
  ): boolean {
    // Product type must match
    if (deal.productType !== criteria.productType) return false;

    // If supplier codes specified in criteria, deal must match one
    if (criteria.supplierCodes && criteria.supplierCodes.length > 0) {
      const hasMatchingSupplier = deal.supplierCodes.some(s => 
        criteria.supplierCodes!.includes(s)
      );
      if (!hasMatchingSupplier) return false;
    }

    // Check mapping rules if they exist
    if (deal.metadata && (deal.metadata as any).mappingRules) {
      const rules = (deal.metadata as any).mappingRules as DealMappingRules[];
      const hasMatchingRule = rules.some(rule => this.ruleMatchesCriteria(rule, criteria, context));
      if (!hasMatchingRule) return false;
    }

    return true;
  }

  /**
   * Check if mapping rule matches criteria
   */
  private ruleMatchesCriteria(
    rule: DealMappingRules,
    criteria: SearchCriteria,
    context: CustomerContext
  ): boolean {
    // Check journey type
    if (rule.journeyType !== 'all' && rule.journeyType !== criteria.journeyType) {
      return false;
    }

    // Check origin cities
    if (rule.originCities && rule.originCities.length > 0) {
      if (criteria.origin && !rule.originCities.includes(criteria.origin)) {
        return false;
      }
    }

    // Check destination cities
    if (rule.destinationCities && rule.destinationCities.length > 0) {
      if (criteria.destination && !rule.destinationCities.includes(criteria.destination)) {
        return false;
      }
    }

    // Check booking class
    if (rule.bookingClasses && rule.bookingClasses.length > 0) {
      if (criteria.bookingClass && !rule.bookingClasses.includes(criteria.bookingClass)) {
        return false;
      }
    }

    // Check cabin class
    if (rule.cabinClasses && rule.cabinClasses.length > 0) {
      if (criteria.cabinClass && !rule.cabinClasses.includes(criteria.cabinClass)) {
        return false;
      }
    }

    // Check channels
    if (rule.channels && rule.channels.length > 0) {
      if (criteria.channel && !rule.channels.includes(criteria.channel)) {
        return false;
      }
    }

    // Check B2B company
    if (rule.b2bCompanyIds && rule.b2bCompanyIds.length > 0) {
      if (context.companyId && !rule.b2bCompanyIds.includes(context.companyId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate deal discount
   */
  private calculateDealDiscount(deal: SupplierDeal, baseAmount: number, criteria: SearchCriteria): number {
    let discount = 0;

    if (deal.discountType === 'percentage') {
      discount = (baseAmount * deal.discountValue) / 100;
    } else if (deal.discountType === 'fixed') {
      discount = deal.discountValue;
    } else if (deal.discountType === 'tiered') {
      // Tiered discounts would be handled based on order size
      discount = deal.discountValue;
    }

    // Apply max discount if set
    if (deal.maxDiscount && discount > deal.maxDiscount) {
      discount = deal.maxDiscount;
    }

    return discount;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(criteria: SearchCriteria): string {
    return `${criteria.productType}|${criteria.supplierCodes?.join(',')}|${criteria.origin}|${criteria.destination}|${criteria.journeyType}`;
  }

  /**
   * Invalidate cache
   */
  invalidateCache(): void {
    this.matchCache.clear();
  }

  /**
   * Set cache enabled
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.matchCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; enabled: boolean } {
    return {
      size: this.matchCache.size,
      enabled: this.cacheEnabled
    };
  }
}
