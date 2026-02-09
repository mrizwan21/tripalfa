/**
 * Seat Maps Routes
 * Defines routes for seat map operations
 */

import { Router, type Router as ExpressRouter } from 'express';
import { seatMapsController } from '../controllers/seatMapsController';

const router: ExpressRouter = Router();

/**
 * GET /bookings/flight/seat-maps
 * Get seat maps for booking or post-booking flow
 */
router.get('/flight/seat-maps', (req, res) => seatMapsController.getSeatMaps(req, res));

/**
 * POST /bookings/flight/seat-maps/select
 * Select seats for a flight
 */
router.post('/flight/seat-maps/select', (req, res) => seatMapsController.selectSeats(req, res));

export default router;
