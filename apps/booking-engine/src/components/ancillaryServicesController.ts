/**
 * Ancillary Services Controller
 * Handles requests for ancillary services (baggage, meals, special requests) during booking and post-booking flows
 */

import { Request, Response } from 'express';
import { ancillaryServicesApi } from '../services/ancillaryServicesApi';
import { createLogger } from '@tripalfa/shared-utils/logger';
const logger = createLogger({ serviceName: 'booking-engine' });

export class AncillaryServicesController {
  private ancillaryServicesService: typeof import('../services/ancillaryServicesApi').ancillaryServicesApi;

  constructor() {
    this.ancillaryServicesService = ancillaryServicesApi;
  }

  /**
   * GET /bookings/ancillary/services
   * Gets available ancillary services during booking or post-booking flow
   * Query params:
   *   - offerId: For booking flow (getting available services from offer)
   *   - orderId: For post-booking flow (getting available services for existing order)
   *   - serviceType: Optional filter ('baggage', 'meal', 'special_request', 'lounge', 'seat')
   *   - provider: GDS provider ('duffel', 'innstant', 'etc')
   *   - env: Environment ('sandbox', 'production')
   */
  async getAvailableServices(req: Request, res: Response): Promise<void> {
    try {
      const { offerId, orderId, serviceType, provider = 'duffel', env = 'sandbox' } = req.query;

      logger.info(`[AncillaryServicesController] Request - offerId: ${offerId}, orderId: ${orderId}, serviceType: ${serviceType}`);

      // Validate parameters
      if (!offerId && !orderId) {
        logger.error('[AncillaryServicesController] Missing offerId or orderId');
        res.status(400).json({
          error: 'MISSING_PARAMETER',
          message: 'Either offerId or orderId must be provided'
        });
        return;
      }

      if (offerId && orderId) {
        logger.error('[AncillaryServicesController] Both offerId and orderId provided');
        res.status(400).json({
          error: 'INVALID_PARAMETER',
          message: 'Provide either offerId or orderId, not both'
        });
        return;
      }

      // Booking flow - get available services from offer
      if (offerId) {
        const result = await this.ancillaryServicesService.getServicesForBooking(
        );

        if (!result) {
          logger.error('[AncillaryServicesController] Offer not found');
          res.status(404).json({
            success: false,
            error: {
              code: 'OFFER_NOT_FOUND',
              message: 'The specified offer could not be found',
              details: {
                field: 'offerId',
                hint: 'Verify the offerId is correct and hasn\'t expired'
              }
            }
          });
          return;
        }

        logger.info(`[AncillaryServicesController] Found ${result.services.length} available services for offer`);
        res.status(200).json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Post-booking flow - get available services for order
      if (orderId) {
        const result = await this.ancillaryServicesService.getServicesForOrder(
          orderId as string,
          serviceType as string | undefined,
          provider as string,
          env as string
        );

        if (!result) {
          logger.error('[AncillaryServicesController] Order not found');
          res.status(404).json({
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'The specified order could not be found',
              details: {
                field: 'orderId',
                hint: 'Verify the orderId is correct'
              }
            }
          });
          return;
        }

        logger.info(`[AncillaryServicesController] Found ${result.services.length} available services for order`);
        res.status(200).json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
        return;
      }
    } catch (error) {
      logger.error('[AncillaryServicesController] Error fetching services:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: 'Failed to fetch available services',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      });
    }
  }

  /**
   * POST /bookings/ancillary/services/select
   * Add/select ancillary services
   * Body:
   *   - offerId?: For booking flow (select services during booking)
   *   - orderId?: For post-booking flow (add services to existing order)
   *   - services: Array of {id, quantity, passengerIds?, segmentIds?}
   */
  async selectServices(req: Request, res: Response): Promise<void> {
    try {
      const { offerId, orderId, services } = req.body;

      logger.info(`[AncillaryServicesController] Selecting services - offerId: ${offerId}, orderId: ${orderId}`);

      // Validate parameters
      if (!offerId && !orderId) {
        logger.error('[AncillaryServicesController] Missing offerId or orderId in select');
        res.status(400).json({
          error: 'MISSING_PARAMETER',
          message: 'Either offerId or orderId must be provided'
        });
        return;
      }

      if (!services || !Array.isArray(services) || services.length === 0) {
        logger.error('[AncillaryServicesController] Missing or invalid services array');
        res.status(400).json({
          error: 'INVALID_SERVICES',
          message: 'Services array is required and must contain at least one service'
        });
        return;
      }

      // Booking flow - select services during booking
      if (offerId && !orderId) {
        const result = await this.ancillaryServicesService.selectServicesForBooking(
          offerId,
          services
        );

        if (!result) {
          logger.error('[AncillaryServicesController] Failed to select services for booking');
          res.status(400).json({
            success: false,
            error: {
              code: 'SELECTION_ERROR',
              message: 'Failed to select services for offer'
            }
          });
          return;
        }

        logger.info(`[AncillaryServicesController] Successfully selected ${services.length} services`);
        res.status(200).json({
          success: true,
          data: result,
          message: 'Services selected successfully',
          servicesCount: services.length,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Post-booking flow - add services to existing order
      if (orderId && !offerId) {
        const result = await this.ancillaryServicesService.addServicesToOrder(
          orderId,
          services
        );

        if (!result) {
          logger.error('[AncillaryServicesController] Failed to add services to order');
          res.status(400).json({
            success: false,
            error: {
              code: 'ADD_SERVICE_ERROR',
              message: 'Failed to add services to order'
            }
          });
          return;
        }

        logger.info(`[AncillaryServicesController] Successfully added ${services.length} services to order`);
        res.status(200).json({
          success: true,
          data: result,
          message: 'Services added successfully',
          servicesCount: services.length,
          timestamp: new Date().toISOString()
        });
        return;
      }

      logger.error('[AncillaryServicesController] Invalid request - both offerId and orderId provided');
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Provide either offerId or orderId, not both'
      });
    } catch (error) {
      logger.error('[AncillaryServicesController] Error selecting services:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: 'Failed to select services',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      });
    }
  }

  /**
   * GET /bookings/ancillary/services/categories
   * Get available service categories with descriptions
   */
  async getServiceCategories(req: Request, res: Response): Promise<void> {
    try {
      logger.info('[AncillaryServicesController] Fetching service categories');

      const categories = this.ancillaryServicesService.getServiceCategories();

      res.status(200).json({
        success: true,
        data: categories,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('[AncillaryServicesController] Error fetching service categories:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: 'Failed to fetch service categories'
        }
      });
    }
  }

  /**
   * GET /bookings/ancillary/services/details/:serviceId
   * Get detailed information about a specific service
   */
  async getServiceDetails(req: Request, res: Response): Promise<void> {
    try {
      let { serviceId } = req.params;
      if (Array.isArray(serviceId)) serviceId = serviceId[0];

      if (!serviceId) {
        logger.error('[AncillaryServicesController] Missing serviceId');
        res.status(400).json({
          error: 'MISSING_SERVICE_ID',
          message: 'Service ID is required'
        });
        return;
      }

      logger.info(`[AncillaryServicesController] Fetching details for service: ${serviceId}`);

      const details = await this.ancillaryServicesService.getServiceDetails(serviceId);

      if (!details) {
        logger.error('[AncillaryServicesController] Service not found');
        res.status(404).json({
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: 'The specified service could not be found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('[AncillaryServicesController] Error fetching service details:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: 'Failed to fetch service details'
        }
      });
    }
  }
}

export const ancillaryServicesController = new AncillaryServicesController();
