/**
 * Hotel Deals Controller
 * Handles HTTP requests for hotel deal management with Express
 */

import { Request, Response } from "express";
import { HotelDealService } from "../services/hotelDealService";
import { HotelAllotmentService } from "../services/hotelAllotmentService";
import { hotelDealsScheduler } from "../services/hotelDealsScheduler";
import { createLogger } from "@tripalfa/shared-utils/logger";
const logger = createLogger({ serviceName: "booking-engine" });

export class HotelDealsController {
  private hotelDealService: HotelDealService;
  private hotelAllotmentService: HotelAllotmentService;

  constructor() {
    this.hotelDealService = new HotelDealService();
    this.hotelAllotmentService = new HotelAllotmentService();
  }

  /**
   * POST /api/deals/hotel/contracted-rate
   * Create a contracted rate deal
   */
  async createContractedRate(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body;

      logger.info(
        `[HotelDealsController] Creating contracted rate for deal: ${request.dealId}`,
      );

      const config = await this.hotelDealService.createDealConfiguration({
        dealId: request.dealId,
        hotelChain: request.hotelChain,
        hotelBrand: request.hotelBrand,
        hotelPropertyIds: request.hotelPropertyIds,
        starRatings: request.starRatings,
        propertyTypes: request.propertyTypes,
        roomTypes: request.roomTypes,
        bedTypes: request.bedTypes,
        freeCancellationDays: request.freeCancellationDays,
        cancellationPenaltyPercentage: request.cancellationPenaltyPercentage,
        hasAllotment: request.hasAllotment,
        allotmentRooms: request.allotmentRooms,
        allotmentReleaseDays: request.allotmentReleaseDays,
      });

      res.status(201).json({
        success: true,
        data: config,
        statusCode: 201,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error creating contracted rate:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create contracted rate",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/package
   * Create a package deal
   */
  async createPackageDeal(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body;

      logger.info(
        `[HotelDealsController] Creating package deal for deal: ${request.dealId}`,
      );

      const config = await this.hotelDealService.createDealConfiguration({
        dealId: request.dealId,
        hotelPropertyIds: request.hotelPropertyIds,
        starRatings: request.starRatings,
        propertyTypes: request.propertyTypes,
        isPackageDeal: true,
        packageInclusions: request.packageInclusions,
        packageDiscountPercentage: request.packageDiscountPercentage,
        minNights: request.minNights,
        maxNights: request.maxNights,
      });

      res.status(201).json({
        success: true,
        data: config,
        statusCode: 201,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error creating package deal:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create package deal",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/early-bird
   * Create an early bird deal
   */
  async createEarlyBirdDeal(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body;

      logger.info(
        `[HotelDealsController] Creating early bird deal for deal: ${request.dealId}`,
      );

      const config = await this.hotelDealService.createDealConfiguration({
        dealId: request.dealId,
        hotelPropertyIds: request.hotelPropertyIds,
        starRatings: request.starRatings,
        propertyTypes: request.propertyTypes,
        advanceBookingTiers: request.advanceBookingTiers,
        minNights: request.minNights,
      });

      res.status(201).json({
        success: true,
        data: config,
        statusCode: 201,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error creating early bird deal:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create early bird deal",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/last-minute
   * Create a last-minute deal
   */
  async createLastMinuteDeal(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body;

      logger.info(
        `[HotelDealsController] Creating last-minute deal for deal: ${request.dealId}`,
      );

      const config = await this.hotelDealService.createDealConfiguration({
        dealId: request.dealId,
        hotelPropertyIds: request.hotelPropertyIds,
        starRatings: request.starRatings,
        propertyTypes: request.propertyTypes,
        lastMinuteTiers: request.lastMinuteTiers,
      });

      res.status(201).json({
        success: true,
        data: config,
        statusCode: 201,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error creating last-minute deal:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create last-minute deal",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/free-nights
   * Create a free nights promotion
   */
  async createFreeNightsDeal(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body;

      logger.info(
        `[HotelDealsController] Creating free nights deal for deal: ${request.dealId}`,
      );

      const config = await this.hotelDealService.createDealConfiguration({
        dealId: request.dealId,
        hotelPropertyIds: request.hotelPropertyIds,
        starRatings: request.starRatings,
        propertyTypes: request.propertyTypes,
        freeNightStructure: request.freeNightStructure,
        minNights: request.minNights,
      });

      res.status(201).json({
        success: true,
        data: config,
        statusCode: 201,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error creating free nights deal:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create free nights deal",
        statusCode: 500,
      });
    }
  }

  /**
   * GET /api/deals/hotel/:dealId
   * Get hotel deal configuration
   */
  async getDealConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;

      logger.info(
        `[HotelDealsController] Fetching hotel deal configuration for: ${dealId}`,
      );

      const config = await this.hotelDealService.getDealConfiguration(dealId);

      if (!config) {
        res.status(404).json({
          success: false,
          error: "Deal configuration not found",
          statusCode: 404,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: config,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error fetching deal configuration:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch deal configuration",
        statusCode: 500,
      });
    }
  }

  /**
   * PUT /api/deals/hotel/:dealId
   * Update hotel deal configuration
   */
  async updateDealConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const request = req.body;

      logger.info(
        `[HotelDealsController] Updating hotel deal configuration for: ${dealId}`,
      );

      const config = await this.hotelDealService.updateDealConfiguration(
        dealId,
        request,
      );

      res.status(200).json({
        success: true,
        data: config,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error updating deal configuration:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update deal configuration",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/calculate-package-price
   * Calculate package deal pricing
   */
  async calculatePackagePrice(req: Request, res: Response): Promise<void> {
    try {
      const { baseRoomRate, nights, packageInclusions, discountPercentage } =
        req.body;

      logger.info("[HotelDealsController] Calculating package price");

      const pricing = this.hotelDealService.calculatePackagePrice(
        baseRoomRate,
        nights,
        packageInclusions,
        discountPercentage,
      );

      res.status(200).json({
        success: true,
        data: pricing,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error calculating package price:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to calculate package price",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/calculate-free-nights
   * Calculate free nights promotion
   */
  async calculateFreeNights(req: Request, res: Response): Promise<void> {
    try {
      const { nights, freeNightStructure } = req.body;

      logger.info("[HotelDealsController] Calculating free nights");

      const result = this.hotelDealService.calculateFreeNights(
        nights,
        freeNightStructure,
      );

      res.status(200).json({
        success: true,
        data: result,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error calculating free nights:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to calculate free nights",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/determine-timing-discount
   * Determine early bird or last-minute discount
   */
  async determineTimingDiscount(req: Request, res: Response): Promise<void> {
    try {
      const { checkInDate, bookingDate, advanceBookingTiers, lastMinuteTiers } =
        req.body;

      logger.info("[HotelDealsController] Determining timing discount");

      const discount = this.hotelDealService.determineTimingDiscount(
        new Date(checkInDate),
        new Date(bookingDate),
        advanceBookingTiers,
        lastMinuteTiers,
      );

      res.status(200).json({
        success: true,
        data: discount,
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error determining timing discount:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to determine timing discount",
        statusCode: 500,
      });
    }
  }

  /**
   * GET /api/deals/hotel/allotment/:dealConfigurationId
   * Check allotment availability
   */
  async checkAllotment(req: Request, res: Response): Promise<void> {
    try {
      const { dealConfigurationId } = req.params;
      const { hotelPropertyId, checkInDate, checkOutDate, roomsNeeded } =
        req.query;

      logger.info(
        `[HotelDealsController] Checking allotment for: ${dealConfigurationId}`,
      );

      const availability = await this.hotelAllotmentService.getAvailability(
        dealConfigurationId,
        hotelPropertyId as string,
        new Date(checkInDate as string),
        new Date(checkOutDate as string),
      );

      res.status(200).json({
        success: true,
        data: {
          available: availability,
          roomsNeeded: parseInt(roomsNeeded as string),
          canBook: availability.every(
            (a) => a.availableRooms >= parseInt(roomsNeeded as string),
          ),
        },
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error("[HotelDealsController] Error checking allotment:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to check allotment",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/allotment/reserve
   * Reserve rooms from allotment
   */
  async reserveAllotment(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body;

      logger.info(
        `[HotelDealsController] Reserving allotment: ${request.dealConfigurationId}`,
      );

      const reservation =
        await this.hotelAllotmentService.checkAndReserveAllotment(
          request.dealConfigurationId,
          request.hotelPropertyId,
          new Date(request.checkInDate),
          new Date(request.checkOutDate),
          request.roomsNeeded,
        );

      res.status(201).json({
        success: true,
        data: reservation,
        statusCode: 201,
      });
    } catch (error: any) {
      logger.error("[HotelDealsController] Error reserving allotment:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to reserve allotment",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/allotment/release
   * Release expired allotments
   */
  async releaseExpiredAllotments(req: Request, res: Response): Promise<void> {
    try {
      logger.info("[HotelDealsController] Releasing expired allotments");

      const count = await this.hotelAllotmentService.releaseExpiredAllotments();

      res.status(200).json({
        success: true,
        data: {
          releasedCount: count,
        },
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error("[HotelDealsController] Error releasing allotments:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to release allotments",
        statusCode: 500,
      });
    }
  }

  /**
   * GET /api/deals/hotel/allotment/low-availability/:dealConfigurationId
   * Check low availability warnings
   */
  async checkLowAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { dealConfigurationId } = req.params;
      const { threshold = "5" } = req.query;

      logger.info(
        `[HotelDealsController] Checking low availability for: ${dealConfigurationId}`,
      );

      const lowAvailability =
        await this.hotelAllotmentService.checkLowAvailability(
          dealConfigurationId,
          parseInt(threshold as string),
        );

      res.status(200).json({
        success: true,
        data: {
          lowAvailabilityAlerts: lowAvailability,
          count: lowAvailability.length,
        },
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error checking low availability:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to check low availability",
        statusCode: 500,
      });
    }
  }

  /**
   * GET /api/deals/hotel/admin/scheduler-status
   * Get scheduler task status (admin endpoint)
   */
  async getSchedulerStatus(req: Request, res: Response): Promise<void> {
    try {
      logger.info("[HotelDealsController] Fetching scheduler status");

      const status = hotelDealsScheduler.getTasksStatus();

      res.status(200).json({
        success: true,
        data: {
          tasks: status,
          count: status.length,
          activeCount: status.filter((t) => t.running).length,
        },
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error(
        "[HotelDealsController] Error fetching scheduler status:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch scheduler status",
        statusCode: 500,
      });
    }
  }

  /**
   * POST /api/deals/hotel/admin/trigger-release
   * Manually trigger allotment release (admin endpoint)
   */
  async triggerManualRelease(req: Request, res: Response): Promise<void> {
    try {
      logger.info(
        "[HotelDealsController] Manual allotment release triggered by admin",
      );

      const releasedCount =
        await hotelDealsScheduler.manuallyReleaseAllotments();

      res.status(200).json({
        success: true,
        data: {
          releasedCount,
          message: `Manually released ${releasedCount} expired allotments`,
        },
        statusCode: 200,
      });
    } catch (error: any) {
      logger.error("[HotelDealsController] Error in manual release:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to trigger manual release",
        statusCode: 500,
      });
    }
  }
}

export const hotelDealsController = new HotelDealsController();
