// @ts-ignore
import { PrismaClient } from "@prisma/client";
import {
  SupplierDeal,
  SupplierDealCreate,
  SupplierDealUpdate,
  DealFilters,
  JourneyType,
  ValidationResult,
} from "../types";

/**
 * Airline Deals Service
 *
 * Specialized service for managing airline-specific deals including:
 * - Private fare management
 * - NDC special deals and ancillaries
 * - Route-specific pricing
 * - Airline contract management
 * - Airline Performance Bonus (APB) integration
 *
 * Extends the generic DealService with airline-specific features and integrations.
 */
export class AirlineDealsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create an airline-specific deal with NDC support
   */
  async createAirlineDeal(
    dealData: SupplierDealCreate & {
      airlineCode: string;
      dealCategory:
        | "private_fare"
        | "ndc_special"
        | "route_specific"
        | "contract";
      cabinClasses?: string[];
      aircraftTypes?: string[];
      fareBasis?: string;
      ancillaryIncluded?: string[];
      apbEligible?: boolean;
    },
  ): Promise<SupplierDeal> {
    try {
      // Validate airline deal data
      const validation = await this.validateAirlineDealCreation(dealData);
      if (!validation.isValid) {
        throw new Error(
          `Airline deal validation failed: ${validation.errors.join(", ")}`,
        );
      }

      // Create deal with airline-specific metadata
      // @ts-ignore
      const result = await this.prisma.supplierDeals.create({
        data: {
          name: dealData.name,
          code: dealData.code,
          supplier: {
            connect: {
              code: dealData.airlineCode,
            },
          },
          productType: "flight", // Force flight product type
          supplierCodes: [dealData.airlineCode], // Store airline code as supplier
          dealType: dealData.dealType,
          discountType: dealData.discountType,
          discountValue: dealData.discountValue,
          maxDiscount: dealData.maxDiscount,
          minOrderAmount: dealData.minOrderAmount,
          priority: dealData.priority || 0,
          isCombinableWithCoupons: dealData.isCombinableWithCoupons || false,
          validFrom: new Date(dealData.validFrom),
          validTo: new Date(dealData.validTo),
          metadata: {
            airlineCode: dealData.airlineCode,
            dealCategory: dealData.dealCategory,
            cabinClasses: dealData.cabinClasses || [],
            aircraftTypes: dealData.aircraftTypes || [],
            fareBasis: dealData.fareBasis,
            ancillaryIncluded: dealData.ancillaryIncluded || [],
            apbEligible: dealData.apbEligible || false,
            createdAt: new Date().toISOString(),
          },
        },
      });

      return this.mapPrismaToDeal(result);
    } catch (error) {
      throw new Error(
        `Failed to create airline deal: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get private fare by airline and route
   */
  async getPrivateFareByRoute(
    airlineCode: string,
    origin: string,
    destination: string,
    journeyType: JourneyType = "all",
  ): Promise<SupplierDeal | null> {
    try {
      const deal = await this.prisma.supplierDeals.findFirst({
        where: {
          productType: "flight",
          supplierCodes: { hasSome: [airlineCode] },
          metadata: {
            path: ["dealCategory"],
            equals: "private_fare",
          },
        },
        include: {
          dealMappingRules: {
            where: {
              OR: [
                {
                  originCities: { hasSome: [origin] },
                  destinationCities: { hasSome: [destination] },
                },
                {
                  originCountries: { hasSome: [origin] },
                  destinationCountries: { hasSome: [destination] },
                },
              ],
            },
          },
        },
      });

      return deal ? this.mapPrismaToDeal(deal) : null;
    } catch (error) {
      throw new Error(
        `Failed to get private fare: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get NDC special deals for an airline
   */
  async getNDCDeals(
    airlineCode: string,
    options?: {
      includeAncillaries?: boolean;
      cabinClass?: string;
      skip?: number;
      take?: number;
    },
  ): Promise<SupplierDeal[]> {
    try {
      const deals = await this.prisma.supplierDeals.findMany({
        where: {
          productType: "flight",
          supplierCodes: { hasSome: [airlineCode] },
          metadata: {
            path: ["dealCategory"],
            equals: "ndc_special",
          },
        },
        orderBy: { createdAt: "desc" },
        skip: options?.skip || 0,
        take: options?.take || 50,
      });

      return deals.map((deal: any) => this.mapPrismaToDeal(deal));
    } catch (error) {
      throw new Error(
        `Failed to get NDC deals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get route-specific deals for an airline
   */
  async getRouteSpecificDeals(
    airlineCode: string,
    origin?: string,
    destination?: string,
  ): Promise<SupplierDeal[]> {
    try {
      const deals = await this.prisma.supplierDeals.findMany({
        where: {
          productType: "flight",
          supplierCodes: { hasSome: [airlineCode] },
          metadata: {
            path: ["dealCategory"],
            equals: "route_specific",
          },
        },
        include: {
          dealMappingRules:
            origin && destination
              ? {
                  where: {
                    AND: [
                      {
                        OR: [
                          { originCities: { hasSome: [origin] } },
                          { originCountries: { hasSome: [origin] } },
                        ],
                      },
                      {
                        OR: [
                          { destinationCities: { hasSome: [destination] } },
                          { destinationCountries: { hasSome: [destination] } },
                        ],
                      },
                    ],
                  },
                }
              : true,
        },
        orderBy: { createdAt: "desc" },
      });

      return deals.map((deal: any) => this.mapPrismaToDeal(deal));
    } catch (error) {
      throw new Error(
        `Failed to get route-specific deals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get airline contracts
   */
  async getAirlineContracts(
    airlineCode: string,
    skip: number = 0,
    take: number = 50,
  ): Promise<SupplierDeal[]> {
    try {
      const contracts = await this.prisma.supplierDeals.findMany({
        where: {
          productType: "flight",
          supplierCodes: { hasSome: [airlineCode] },
          metadata: {
            path: ["dealCategory"],
            equals: "contract",
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      });

      return contracts.map((deal: any) => this.mapPrismaToDeal(deal));
    } catch (error) {
      throw new Error(
        `Failed to get airline contracts: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get APB-eligible deals for an airline
   */
  async getAPBEligibleDeals(
    airlineCode: string,
    skip: number = 0,
    take: number = 50,
  ): Promise<SupplierDeal[]> {
    try {
      const deals = await this.prisma.supplierDeals.findMany({
        where: {
          productType: "flight",
          supplierCodes: { hasSome: [airlineCode] },
          metadata: {
            path: ["apbEligible"],
            equals: true,
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      });

      return deals.map((deal: any) => this.mapPrismaToDeal(deal));
    } catch (error) {
      throw new Error(
        `Failed to get APB-eligible deals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Update airline deal with airline-specific fields
   */
  async updateAirlineDeal(
    id: string,
    updates: SupplierDealUpdate & {
      cabinClasses?: string[];
      aircraftTypes?: string[];
      fareBasis?: string;
      ancillaryIncluded?: string[];
      apbEligible?: boolean;
    },
  ): Promise<SupplierDeal> {
    try {
      // Get current deal to preserve airline-specific metadata
      const current = await this.prisma.supplierDeals.findUnique({
        where: { id },
      });
      if (!current) {
        throw new Error("Deal not found");
      }

      const currentMetadata = current.metadata as Record<string, unknown>;

      const result = await this.prisma.supplierDeals.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.code && { code: updates.code }),
          ...(updates.dealType && { dealType: updates.dealType }),
          ...(updates.discountType && { discountType: updates.discountType }),
          ...(updates.discountValue !== undefined && {
            discountValue: updates.discountValue,
          }),
          ...(updates.maxDiscount !== undefined && {
            maxDiscount: updates.maxDiscount,
          }),
          ...(updates.minOrderAmount !== undefined && {
            minOrderAmount: updates.minOrderAmount,
          }),
          ...(updates.status && { status: updates.status }),
          ...(updates.priority !== undefined && { priority: updates.priority }),
          ...(updates.isCombinableWithCoupons !== undefined && {
            isCombinableWithCoupons: updates.isCombinableWithCoupons,
          }),
          ...(updates.validFrom && { validFrom: new Date(updates.validFrom) }),
          ...(updates.validTo && { validTo: new Date(updates.validTo) }),
          metadata: {
            ...currentMetadata,
            ...(updates.cabinClasses && { cabinClasses: updates.cabinClasses }),
            ...(updates.aircraftTypes && {
              aircraftTypes: updates.aircraftTypes,
            }),
            ...(updates.fareBasis && { fareBasis: updates.fareBasis }),
            ...(updates.ancillaryIncluded && {
              ancillaryIncluded: updates.ancillaryIncluded,
            }),
            ...(updates.apbEligible !== undefined && {
              apbEligible: updates.apbEligible,
            }),
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      });

      return this.mapPrismaToDeal(result);
    } catch (error) {
      throw new Error(
        `Failed to update airline deal: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * List airline deals with filters
   */
  async listAirlineDeals(
    airlineCode: string,
    filters?: {
      dealCategory?:
        | "private_fare"
        | "ndc_special"
        | "route_specific"
        | "contract";
      status?: string;
      apbEligibleOnly?: boolean;
    },
    skip: number = 0,
    take: number = 50,
  ): Promise<SupplierDeal[]> {
    try {
      const where: any = {
        productType: "flight",
        supplierCodes: { hasSome: [airlineCode] },
      };

      if (filters?.dealCategory) {
        where.metadata = {
          path: ["dealCategory"],
          equals: filters.dealCategory,
        };
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.apbEligibleOnly) {
        where.metadata = {
          path: ["apbEligible"],
          equals: true,
        };
      }

      const deals = await this.prisma.supplierDeals.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      });

      return deals.map((deal: any) => this.mapPrismaToDeal(deal));
    } catch (error) {
      throw new Error(
        `Failed to list airline deals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete airline deal (soft delete)
   */
  async deleteAirlineDeal(id: string): Promise<void> {
    try {
      await this.prisma.supplierDeals.update({
        where: { id },
        data: { status: "archived", updatedAt: new Date() },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete airline deal: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Activate airline deal
   */
  async activateAirlineDeal(id: string): Promise<SupplierDeal> {
    try {
      const deal = await this.prisma.supplierDeals.update({
        where: { id },
        data: { status: "active", updatedAt: new Date() },
      });

      return this.mapPrismaToDeal(deal);
    } catch (error) {
      throw new Error(
        `Failed to activate airline deal: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Pause airline deal
   */
  async pauseAirlineDeal(id: string): Promise<SupplierDeal> {
    try {
      const deal = await this.prisma.supplierDeals.update({
        where: { id },
        data: { status: "paused", updatedAt: new Date() },
      });

      return this.mapPrismaToDeal(deal);
    } catch (error) {
      throw new Error(
        `Failed to pause airline deal: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Count airline deals by category
   */
  async countAirlineDeals(
    airlineCode: string,
    dealCategory?: string,
  ): Promise<number> {
    try {
      const where: any = {
        productType: "flight",
        supplierCodes: { hasSome: [airlineCode] },
      };

      if (dealCategory) {
        where.metadata = {
          path: ["dealCategory"],
          equals: dealCategory,
        };
      }

      return await this.prisma.supplierDeals.count({ where });
    } catch (error) {
      throw new Error(
        `Failed to count airline deals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Validate airline deal creation
   */
  private async validateAirlineDealCreation(
    dealData: any,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!dealData.name) errors.push("Deal name is required");
    if (!dealData.code) errors.push("Deal code is required");
    if (!dealData.airlineCode) errors.push("Airline code is required");
    if (!dealData.dealCategory) errors.push("Deal category is required");
    if (!dealData.dealType) errors.push("Deal type is required");
    if (dealData.discountValue === undefined || dealData.discountValue < 0) {
      errors.push("Discount value must be >= 0");
    }
    if (!dealData.validFrom) errors.push("Valid from date is required");
    if (!dealData.validTo) errors.push("Valid to date is required");
    if (new Date(dealData.validFrom) >= new Date(dealData.validTo)) {
      errors.push("Valid to date must be after valid from date");
    }

    // Validate deal category
    const validCategories = [
      "private_fare",
      "ndc_special",
      "route_specific",
      "contract",
    ];
    if (!validCategories.includes(dealData.dealCategory)) {
      errors.push(
        `Invalid deal category. Must be one of: ${validCategories.join(", ")}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
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
      maxDiscount: prismaDeal.maxDiscount
        ? Number(prismaDeal.maxDiscount)
        : undefined,
      minOrderAmount: prismaDeal.minOrderAmount
        ? Number(prismaDeal.minOrderAmount)
        : undefined,
      priority: prismaDeal.priority,
      isCombinableWithCoupons: prismaDeal.isCombinableWithCoupons,
      validFrom: prismaDeal.validFrom.toISOString(),
      validTo: prismaDeal.validTo.toISOString(),
      metadata: prismaDeal.metadata,
      createdAt: prismaDeal.createdAt.toISOString(),
      updatedAt: prismaDeal.updatedAt.toISOString(),
    };
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
