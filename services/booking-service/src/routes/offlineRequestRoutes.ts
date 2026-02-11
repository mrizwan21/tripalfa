import express, { Router } from 'express';
import authenticateToken from '../middleware/authenticateToken';
import authorize from '../middleware/authorize';
import {
  verifyOfflineRequestOwnership,
  verifyBookingOwnership,
  requireStaffRole
} from '../middleware/offlineRequestAuth';
import {
  createOfflineRequest,
  getOfflineRequest,
  getOfflineRequestByRef,
  getCustomerRequests,
  getStaffQueue,
  submitPricing,
  approveRequest,
  rejectRequest,
  recordPayment,
  completeRequest,
  cancelRequest,
  addInternalNote,
  getAuditLog,
} from '../controllers/offlineRequestController';

const router: Router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * Offline Request Management API Routes
 * Base path: /api/offline-requests
 */

/**
 * POST /api/offline-requests
 * Create a new offline change request
 */
router.post('/', createOfflineRequest);

/**
 * GET /api/offline-requests/queue
 * Get staff queue (must be before :id routes)
 */
router.get('/queue', requireStaffRole, getStaffQueue);

/**
 * GET /api/offline-requests/customer/my-requests
 * Get customer's offline requests
 */
router.get('/customer/my-requests', verifyBookingOwnership, getCustomerRequests);

/**
 * GET /api/offline-requests/ref/:requestRef
 * Get offline request by reference number
 */
router.get('/ref/:requestRef', verifyOfflineRequestOwnership, getOfflineRequestByRef);

/**
 * GET /api/offline-requests/:id
 * Get offline request by ID
 */
router.get('/:id', verifyOfflineRequestOwnership, getOfflineRequest);

/**
 * PUT /api/offline-requests/:id/pricing
 * Staff submits pricing for the request
 */
router.put('/:id/pricing', requireStaffRole, submitPricing);

/**
 * PUT /api/offline-requests/:id/approve
 * Customer approves the pricing
 */
router.put('/:id/approve', verifyOfflineRequestOwnership, approveRequest);

/**
 * PUT /api/offline-requests/:id/reject
 * Customer rejects the pricing
 */
router.put('/:id/reject', verifyOfflineRequestOwnership, rejectRequest);

/**
 * POST /api/offline-requests/:id/payment
 * Record payment for approved request
 */
router.post('/:id/payment', requireStaffRole, recordPayment);

/**
 * PUT /api/offline-requests/:id/complete
 * Mark request as completed
 */
router.put('/:id/complete', requireStaffRole, completeRequest);

/**
 * PUT /api/offline-requests/:id/cancel
 * Cancel the offline request
 */
router.put('/:id/cancel', verifyOfflineRequestOwnership, cancelRequest);

/**
 * POST /api/offline-requests/:id/notes
 * Add internal note to request
 */
router.post('/:id/notes', requireStaffRole, addInternalNote);

/**
 * GET /api/offline-requests/:id/audit
 * Get audit log for request
 */
router.get('/:id/audit', verifyOfflineRequestOwnership, getAuditLog);

export default router;
