import { Request, Response, NextFunction } from 'express';

interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
}

const createValidator = (schema: any, options: ValidationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body || req.query, { 
      abortEarly: false, 
      allowUnknown: true,
      ...options 
    });
    
    if (error) {
      const errorMessages = error.details.map((detail: any) => detail.message);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
      return;
    }
    
    next();
  };
};


// Generic validator factory (also exported as named `validate` for convenience)
export const validate = createValidator;