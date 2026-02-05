import express, { Router } from 'express';

// Temporarily comment out middleware imports for testing
// import authenticateToken from '../middleware/authenticateToken.js';
// import authorize from '../middleware/authorize.js';
// import { validate } from '../middleware/validate.js';
// import { bookingManagementSchemas } from '../validation/bookingManagementSchemas.js';
// import { boundBookingManagementController as bookingManagementController } from '../controllers/bookingManagementController.js';
// import { adminBookingCardController } from '../controllers/adminBookingCardController.js';
// import { permissionMiddleware } from '../middleware/permissionMiddleware.js';

const router = Router();

// Simple test route without middleware
router.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

export default router;