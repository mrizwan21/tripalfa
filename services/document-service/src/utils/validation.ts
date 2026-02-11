/**
 * Request Validation Utility
 * Schema validation for request bodies and query parameters
 */

import { Request, Response, NextFunction } from 'express';

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface FieldSchema {
  type: FieldType;
  required?: boolean;
  enum?: any[];
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface Schema {
  [key: string]: FieldSchema;
}

/**
 * Validate a field against schema
 */
export function validateField(value: any, schema: FieldSchema, fieldName: string): string | null {
  // Check required
  if (schema.required && (value === undefined || value === null)) {
    return `${fieldName} is required`;
  }

  // Allow null/undefined if not required
  if (!schema.required && (value === undefined || value === null)) {
    return null;
  }

  // Check type
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (actualType !== schema.type) {
    return `${fieldName} must be of type ${schema.type}, got ${actualType}`;
  }

  // Check enum
  if (schema.enum && !schema.enum.includes(value)) {
    return `${fieldName} must be one of: ${schema.enum.join(', ')}`;
  }

  // Check string min/max
  if (schema.type === 'string') {
    if (schema.min && value.length < schema.min) {
      return `${fieldName} must be at least ${schema.min} characters`;
    }
    if (schema.max && value.length > schema.max) {
      return `${fieldName} must be at most ${schema.max} characters`;
    }
    if (schema.pattern && !schema.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
  }

  // Check number min/max
  if (schema.type === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      return `${fieldName} must be at least ${schema.min}`;
    }
    if (schema.max !== undefined && value > schema.max) {
      return `${fieldName} must be at most ${schema.max}`;
    }
  }

  // Check custom validator
  if (schema.custom) {
    const result = schema.custom(value);
    if (result !== true) {
      return typeof result === 'string' ? result : `${fieldName} validation failed`;
    }
  }

  return null;
}

/**
 * Validate entire object against schema
 */
export function validateObject(obj: any, schema: Schema): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [key, fieldSchema] of Object.entries(schema)) {
    const value = obj[key];
    const error = validateField(value, fieldSchema, key);

    if (error) {
      errors[key] = error;
    }
  }

  return errors;
}

/**
 * Create validation middleware
 */
export function validateRequest(source: 'body' | 'query' | 'params', schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;

    const errors = validateObject(data, schema);

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Validate multiple sources
 */
export function validateMultiple(validations: Array<[string, Schema]>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const allErrors: Record<string, Record<string, string>> = {};
    let hasErrors = false;

    for (const [source, schema] of validations) {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const errors = validateObject(data, schema);

      if (Object.keys(errors).length > 0) {
        allErrors[source] = errors;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: allErrors,
        },
      });
      return;
    }

    next();
  };
}
