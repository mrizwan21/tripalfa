import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { TypedRequest } from '../types';

const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const typedReq = req as TypedRequest;
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
      if (err) {
        logger.warn('Invalid token attempt', { 
          ip: req.ip, 
          userAgent: req.get('User-Agent'),
          path: req.path 
        });
        res.status(403).json({
          success: false,
          error: 'Invalid or expired token'
        });
        return;
      }

      typedReq.user = user as any;
      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Authentication service unavailable'
    });
  }
};

export default authenticateToken;