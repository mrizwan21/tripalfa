import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Schema for creating a booking
const createBookingSchema = Joi.object({
  type: Joi.string().valid('flight', 'hotel', 'package').required(),
  totalAmount: Joi.number().positive().required(),
  serviceFee: Joi.number().min(0).default(0),
  passengers: Joi.array().items(
    Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^[+]?[\d\s-()]{7,15}$/).required(),
      dateOfBirth: Joi.string().isoDate().required(),
      passportNumber: Joi.string().optional(),
    })
  ).min(1).required(),
  flightDetails: Joi.when('type', {
    is: 'flight',
    then: Joi.object({
      flightNumber: Joi.string().required(),
      origin: Joi.string().required(),
      destination: Joi.string().required(),
      departureTime: Joi.date().iso().required(),
      arrivalTime: Joi.date().iso().min(Joi.ref('departureTime')).required(),
      cabinClass: Joi.string().valid('economy', 'business', 'first').required(),
    }).required(),
    otherwise: Joi.optional()
  }),
  hotelDetails: Joi.when('type', {
    is: 'hotel',
    then: Joi.object({
      hotelName: Joi.string().required(),
      hotelCode: Joi.string().required(),
      checkInDate: Joi.string().isoDate().required(),
      checkOutDate: Joi.string().isoDate().min(Joi.ref('checkInDate')).required(),
      numberOfRooms: Joi.number().integer().min(1).required(),
      roomType: Joi.string().required(),
    }).required(),
    otherwise: Joi.optional()
  }),
  supplierData: Joi.object().optional(),
});

// Schema for cancelling a booking
const cancelBookingSchema = Joi.object({
  reason: Joi.string().max(500).required(),
});

// Schema for searching bookings
const searchBookingsSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'failed', 'refunded'),
  type: Joi.string().valid('flight', 'hotel', 'package'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'totalAmount', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

// Validation middleware factory
const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: `Validation Error: ${errorMessage}`,
      });
    }

    // Replace req.body with validated data
    (req as any).body = value;
    next();
  };
};

// Specific validation middleware
const validateCreateBooking = validate(createBookingSchema);
const validateCancelBooking = validate(cancelBookingSchema);

// Query validation middleware
const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = searchBookingsSchema.validate(req.query, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: `Validation Error: ${errorMessage}`,
    });
  }

  // Replace req.query with validated data
  (req as any).query = value;
  next();
};

export {
  validateCreateBooking,
  validateCancelBooking,
  validateSearchQuery,
};
