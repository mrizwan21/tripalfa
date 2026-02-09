import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const sendErrorDev = (err: AppError, req: AuthenticatedRequest, res: Response): void => {
  logger.error('Error in development mode', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err: AppError, req: AuthenticatedRequest, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.warn('Operational error', {
      error: err.message,
      statusCode: err.statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.errorCode && { errorCode: err.errorCode })
    });

  // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    logger.error('Unknown error', {
      error: err.message,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    // 2) Send generic message
    res.status(500).json({
      success: false,
      error: 'Something went very wrong!'
    });
  }
};

export const errorHandler = (err: any, req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      error = new AppError('Resource not found', 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const message = 'Duplicate field value entered';
      error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
      error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
      error = new AppError('Token expired', 401);
    }

    sendErrorProd(error, req, res);
  }
};