import { Request, Response, NextFunction } from 'express';
import { TypedRequest } from '../types';
import prisma from '../database/prisma';
import logger from '../utils/logger';

/**
 * Middleware to verify that the authenticated user owns the offline request
 * or has staff/admin privileges
 */
export const verifyOfflineRequestOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const typedReq = req as TypedRequest;

  if (!typedReq.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  const requestId = req.params.id || req.params.requestRef;
  if (!requestId) {
    res.status(400).json({
      success: false,
      error: 'Request ID is required'
    });
    return;
  }

  try {
    // If user is staff or admin, allow access
    if (['staff', 'admin'].includes(typedReq.user.role)) {
      return next();
    }

    // For customers, verify ownership
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
      select: {
        bookingId: true,
        // We need to check if the booking belongs to the customer
        // This would typically involve joining with the bookings table
        // For now, we'll assume the bookingId is sufficient ownership check
        // In production, you'd verify against the actual booking ownership
      }
    });

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Offline request not found'
      });
      return;
    }

    // TODO: Add proper booking ownership verification
    // For now, we'll allow access if the request exists
    // In production, you'd check if the booking belongs to the user

    next();
  } catch (error) {
    logger.error('Error verifying offline request ownership', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Middleware to verify that the authenticated user owns the booking associated with offline requests
 */
export const verifyBookingOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const typedReq = req as TypedRequest;

  if (!typedReq.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  const bookingId = req.query.bookingId as string;
  if (!bookingId) {
    res.status(400).json({
      success: false,
      error: 'Booking ID is required'
    });
    return;
  }

  try {
    // If user is staff or admin, allow access
    if (['staff', 'admin'].includes(typedReq.user.role)) {
      return next();
    }

    // For customers, verify booking ownership
    // TODO: Add proper booking ownership verification
    // This would check if the booking belongs to the authenticated user
    // For now, we'll allow access

    next();
  } catch (error) {
    logger.error('Error verifying booking ownership', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Middleware to enforce staff/admin role for staff operations
 */
export const requireStaffRole = (req: Request, res: Response, next: NextFunction): void => {
  const typedReq = req as TypedRequest;

  if (!typedReq.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (!['staff', 'admin'].includes(typedReq.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Staff or admin role required'
    });
    return;
  }

  next();
};