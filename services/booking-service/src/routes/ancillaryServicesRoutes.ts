/**
 * Ancillary Services Routes
 * Defines routes for ancillary services operations (baggage, meals, special requests, etc.)
 */

import { Router, type Router as ExpressRouter } from 'express';
import { ancillaryServicesController } from '../controllers/ancillaryServicesController';

const router: ExpressRouter = Router();

/**
 * GET /bookings/ancillary/services
 * Get available ancillary services for booking or post-booking flow
 * Query params: offerId | orderId, serviceType (optional), provider, env
 */
router.get('/services', (req, res) => ancillaryServicesController.getAvailableServices(req, res));

/**
 * POST /bookings/ancillary/services/select
 * Select/add ancillary services
 * Body: {offerId|orderId, services: [{id, quantity}]}
 */
router.post('/services/select', (req, res) => ancillaryServicesController.selectServices(req, res));

/**
 * GET /bookings/ancillary/services/categories
 * Get available service categories with descriptions
 */
router.get('/services/categories', (req, res) => ancillaryServicesController.getServiceCategories(req, res));

/**
 * GET /bookings/ancillary/services/details/:serviceId
 * Get detailed information about a specific service
 */
router.get('/services/details/:serviceId', (req, res) => ancillaryServicesController.getServiceDetails(req, res));

export default router;
