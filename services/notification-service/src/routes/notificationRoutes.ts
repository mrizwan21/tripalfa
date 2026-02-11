import { Router } from 'express';
import { authenticate, authorize } from '@tripalfa/auth-middleware';
import {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  subscribeToPush,
  unsubscribeFromPush,
} from '../controllers/notificationController';

const router = Router();

/**
 * Public endpoints (no auth required for health check)
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Protected endpoints (authentication required)
 */

// Get user's notifications
router.get('/', authenticate, getUserNotifications);

// Get unread count
router.get('/count/unread', authenticate, getUnreadCount);

// Mark notification as read
router.patch('/:id/read', authenticate, markAsRead);

// Mark all notifications as read
router.patch('/read-all', authenticate, markAllAsRead);

// Delete notification
router.delete('/:id', authenticate, deleteNotification);

/**
 * Preferences endpoints
 */

// Get notification preferences
router.get('/preferences', authenticate, getPreferences);

// Update notification preferences
router.patch('/preferences', authenticate, updatePreferences);

/**
 * Push subscription endpoints
 */

// Subscribe to push notifications
router.post('/subscribe', authenticate, subscribeToPush);

// Unsubscribe from push notifications
router.delete('/subscribe/:id', authenticate, unsubscribeFromPush);

/**
 * Admin endpoints (staff/admin only)
 */

// Send notification to user (admin)
router.post('/send', authenticate, authorize(['staff', 'admin']), sendNotification);

export default router;
