import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseMiddleware,
  Logger,
  HttpStatus,
} from "@nestjs/common";
import { PricingService } from "../services/pricingService";
import { ValidationService } from "../services/validationService";
import { PricingError } from "../errors/pricingErrors";

@Controller("api/pricing")
export class PricingController {
  private readonly logger = new Logger(PricingController.name);

  constructor(
    private pricingService: PricingService,
    private validationService: ValidationService,
  ) {}

  /**
   * POST /api/pricing/calculate
   * Calculate comprehensive price with full breakdown
   */
  @Post("calculate")
  async calculatePrice(@Body() request: any) {
    try {
      this.logger.log(`Calculating price for booking: ${request.bookingId}`);

      const result = await this.pricingService.calculatePricing({
        userId: request.userId,
        serviceType: request.serviceType,
        supplierPrice: request.supplierPrice,
        currency: request.currency || "USD",
        bookingDate: request.bookingDate
          ? new Date(request.bookingDate)
          : new Date(),
        couponCode: request.couponCode,
        applyLoyalty: request.applyLoyalty !== false,
        companyId: request.companyId,
        context: request.context,
      });

      return {
        success: true,
        data: result,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error("Error calculating price:", error);

      if (error instanceof PricingError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          statusCode: error.statusCode,
        };
      }

      return {
        success: false,
        error: {
          code: "CALCULATION_ERROR",
          message: "Failed to calculate price",
        },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * POST /api/pricing/validate-coupon
   * Validate coupon before application
   */
  @Post("validate-coupon")
  async validateCoupon(@Body() request: any) {
    try {
      this.logger.log(`Validating coupon: ${request.couponCode}`);

      const result = await this.validationService.validateCouponCode(
        request.couponCode,
        request.userId,
        request.amount,
      );

      return {
        success: result.valid,
        data: result,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error("Error validating coupon:", error);

      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Failed to validate coupon",
        },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * GET /api/pricing/breakdown/:bookingId
   * Retrieve detailed price breakdown from audit log
   */
  @Get("breakdown/:bookingId")
  async getPriceBreakdown(@Param("bookingId") bookingId: string) {
    try {
      this.logger.log(`Retrieving price breakdown for booking: ${bookingId}`);

      const breakdown =
        await this.pricingService.getPricingBreakdown(bookingId);

      if (!breakdown) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Pricing breakdown not found",
          },
          statusCode: HttpStatus.NOT_FOUND,
        };
      }

      return {
        success: true,
        data: breakdown,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error("Error retrieving price breakdown:", error);

      return {
        success: false,
        error: {
          code: "RETRIEVAL_ERROR",
          message: "Failed to retrieve pricing breakdown",
        },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * GET /api/pricing/rules/applicable
   * Get applicable rules for given context
   */
  @Get("rules/applicable")
  async getApplicableRules(@Query() query: any) {
    try {
      this.logger.log(`Retrieving applicable rules for context:`, query);

      const rules = await this.pricingService.getApplicableRules({
        serviceType: query.serviceType,
        amount: query.amount ? parseFloat(query.amount) : undefined,
        supplierCode: query.supplierCode,
        context: query.context,
      });

      return {
        success: true,
        data: rules,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error("Error retrieving applicable rules:", error);

      return {
        success: false,
        error: {
          code: "RETRIEVAL_ERROR",
          message: "Failed to retrieve applicable rules",
        },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * POST /api/pricing/audit-log
   * Get pricing audit logs for a booking
   */
  @Post("audit-log")
  async getPricingAuditLogs(@Body() request: any) {
    try {
      this.logger.log(
        `Retrieving audit logs for booking: ${request.bookingId}`,
      );

      const logs = await this.pricingService.getPricingAuditLogs(
        request.bookingId,
        request.limit || 10,
      );

      return {
        success: true,
        data: logs,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error("Error retrieving audit logs:", error);

      return {
        success: false,
        error: {
          code: "RETRIEVAL_ERROR",
          message: "Failed to retrieve audit logs",
        },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
