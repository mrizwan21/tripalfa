/**
 * Seat Maps Controller
 * Handles requests for seat map data and seat selection
 */

import { Request, Response } from "express";
import { SeatMapsService } from "../services/seatMapsService";
import { createLogger } from "@tripalfa/shared-utils/logger";
const logger = createLogger({ serviceName: "booking-engine" });

export class SeatMapsController {
  private seatMapsService: SeatMapsService;

  constructor() {
    this.seatMapsService = new SeatMapsService();
  }

  /**
   * GET /bookings/flight/seat-maps
   * Gets seat maps for booking or post-booking flow
   * Query params:
   *   - offerId: For booking flow (getting seat maps to select)
   *   - orderId: For post-booking flow (viewing/modifying current seats)
   */
  async getSeatMaps(req: Request, res: Response): Promise<void> {
    try {
      const { offerId, orderId } = req.query;
      const provider = (req.query.provider as string) || "duffel";
      const env = (req.query.env as string) || "sandbox";

      logger.info(
        `[SeatMapsController] Request - offerId: ${offerId}, orderId: ${orderId}`,
      );

      // Validate parameters
      if (!offerId && !orderId) {
        logger.error("[SeatMapsController] Missing offerId or orderId");
        res.status(400).json({
          error: "MISSING_PARAMETER",
          message: "Either offerId or orderId must be provided",
        });
        return;
      }

      if (offerId && orderId) {
        logger.error("[SeatMapsController] Both offerId and orderId provided");
        res.status(400).json({
          error: "INVALID_PARAMETER",
          message: "Provide either offerId or orderId, not both",
        });
        return;
      }

      // Booking flow - get seat maps for offer
      if (offerId) {
        const result = await this.seatMapsService.getSeatMapsForBooking(
          offerId as string,
          provider,
          env,
        );

        if (!result) {
          logger.error("[SeatMapsController] Offer not found");
          res.status(404).json({
            error: "OFFER_NOT_FOUND",
            message: "No seat maps available for this offer",
          });
          return;
        }

        res.status(200).json(result);
        return;
      }

      // Post-booking flow - get current seats and available seats for modification
      if (orderId) {
        const result = await this.seatMapsService.getSeatMapsForOrder(
          orderId as string,
          provider,
          env,
        );

        if (!result) {
          logger.error("[SeatMapsController] Order not found");
          res.status(404).json({
            error: "ORDER_NOT_FOUND",
            message: "No seat maps available for this order",
          });
          return;
        }

        res.status(200).json(result);
        return;
      }
    } catch (error: any) {
      logger.error("[SeatMapsController] Error:", error);

      // Handle specific error types
      if (
        error.code === "INVALID_OFFER_ID" ||
        error.code === "INVALID_ORDER_ID"
      ) {
        res.status(400).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      if (error.code === "DUFFEL_API_ERROR") {
        res.status(503).json({
          error: "SERVICE_UNAVAILABLE",
          message: "Duffel API is currently unavailable",
        });
        return;
      }

      if (error.code === "TIMEOUT") {
        res.status(504).json({
          error: "GATEWAY_TIMEOUT",
          message: "Request to upstream service timed out",
        });
        return;
      }

      // Generic error
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "An error occurred while fetching seat maps",
      });
    }
  }

  /**
   * POST /bookings/flight/seat-maps/select
   * Select seats for a flight
   * Body:
   *   - offerId: Offer ID
   *   - selectedSeats: Array of seat numbers to select
   */
  async selectSeats(req: Request, res: Response): Promise<void> {
    try {
      const { offerId, selectedSeats } = req.body;

      logger.info(
        `[SeatMapsController] Selecting seats - offerId: ${offerId}, count: ${selectedSeats?.length}`,
      );

      // Validate parameters
      if (!offerId) {
        res.status(400).json({
          error: "MISSING_PARAMETER",
          message: "offerId is required",
        });
        return;
      }

      if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        res.status(400).json({
          error: "INVALID_PARAMETER",
          message: "selectedSeats must be a non-empty array",
        });
        return;
      }

      // TODO: Implement seat selection in service
      // This would update the order with selected seats
      res.status(200).json({
        success: true,
        message: "Seats selected successfully",
        offerId,
        selectedSeatsCount: selectedSeats.length,
      });
    } catch (error: any) {
      logger.error("[SeatMapsController] Error selecting seats:", error);

      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "An error occurred while selecting seats",
      });
    }
  }
}

export const seatMapsController = new SeatMapsController();
