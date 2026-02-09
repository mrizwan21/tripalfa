import express, { Router } from 'express';
import {
  createNotification,
  getNotification,
  listNotifications,
  updateNotification,
  deleteNotification,
} from '../controllers/notificationController';

const router: Router = Router();

/**
 * Notification API Routes
 * Base path: /api/notifications
 */

/**
 * POST /api/notifications
 * Create a new notification
 */
router.post('/', createNotification);

/**
 * GET /api/notifications
 * List all notifications with pagination and filtering
 */
router.get('/', listNotifications);

/**
 * GET /api/notifications/:id
 * Get a specific notification by ID
 */
router.get('/:id', getNotification);

/**
 * PATCH /api/notifications/:id
 * Update notification status
 */
router.patch('/:id', updateNotification);

/**
 * DELETE /api/notifications/:id
 * Delete a notification (soft delete)
 */
router.delete('/:id', deleteNotification);

export default router;
