import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Which parts of the request to validate
   */
  validate?: 'body' | 'query' | 'params' | 'all';
  
  /**
   * Whether to strip unknown fields
   */
  stripUnknown?: boolean;
  
  /**
   * Custom error handler
   */
  onError?: (error: ZodError, req: Request, res: Response) => void;
}

/**
 * Default error handler
 */
const defaultErrorHandler = (error: ZodError, req: Request, res: Response) => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
  
  res.status(400).json({
    success: false,
    error: 'Validation failed',
    errors,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

/**
 * Create validation middleware for Express
 */
export const validate = (
  schema: AnyZodObject,
  options: ValidationOptions = {}
) => {
  const {
    validate: validateParts = 'body',
    stripUnknown = true,
    onError = defaultErrorHandler,
  } = options;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let dataToValidate: any = {};
      
      // Determine which parts to validate
      if (validateParts === 'all' || validateParts === 'body') {
        dataToValidate = { ...dataToValidate, ...req.body };
      }
      
      if (validateParts === 'all' || validateParts === 'query') {
        dataToValidate = { ...dataToValidate, ...req.query };
      }
      
      if (validateParts === 'all' || validateParts === 'params') {
        dataToValidate = { ...dataToValidate, ...req.params };
      }
      
      // Validate the data
      const result = await schema.safeParseAsync(dataToValidate);
      
      if (!result.success) {
        return onError(result.error, req, res);
      }
      
      // Update request with validated data
      if (validateParts === 'all' || validateParts === 'body') {
        req.body = result.data;
      }
      
      if (validateParts === 'all' || validateParts === 'query') {
        req.query = result.data;
      }
      
      if (validateParts === 'all' || validateParts === 'params') {
        req.params = result.data;
      }
      
      next();
    } catch (error) {
      // Handle unexpected errors
      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: AnyZodObject, options?: Omit<ValidationOptions, 'validate'>) => {
  return validate(schema, { ...options, validate: 'body' });
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: AnyZodObject, options?: Omit<ValidationOptions, 'validate'>) => {
  return validate(schema, { ...options, validate: 'query' });
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: AnyZodObject, options?: Omit<ValidationOptions, 'validate'>) => {
  return validate(schema, { ...options, validate: 'params' });
};

/**
 * Validate all request parts
 */
export const validateAll = (schema: AnyZodObject, options?: Omit<ValidationOptions, 'validate'>) => {
  return validate(schema, { ...options, validate: 'all' });
};