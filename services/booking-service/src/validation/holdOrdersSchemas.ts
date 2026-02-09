import * as JoiModule from 'joi';
const Joi: any = (JoiModule as any).default || JoiModule;

/**
 * Validation schema for creating a hold order
 */
export const createHoldOrderSchema = Joi.object({
  offerId: Joi.string().required().messages({
    'any.required': 'Offer ID is required'
  }),
  passengers: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().valid('mr', 'ms', 'mrs', 'mister', 'miss', 'mirs').required(),
        given_name: Joi.string().min(1).max(60).required(),
        family_name: Joi.string().min(1).max(60).required(),
        email: Joi.string().email().required(),
        phone_number: Joi.string().required(),
        born_on: Joi.date().iso().required(),
        gender: Joi.string().valid('m', 'f').required()
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one passenger is required'
    }),
  customerId: Joi.string().required(),
  customerEmail: Joi.string().email().required(),
  customerPhone: Joi.string().optional()
});

/**
 * Validation schema for checking price change
 */
export const checkPriceChangeSchema = Joi.object({
  orderId: Joi.string().required(),
  lastKnownPrice: Joi.number().positive().required(),
  currency: Joi.string().length(3).required()
});

/**
 * Validation schema for checking schedule change
 */
export const checkScheduleChangeSchema = Joi.object({
  orderId: Joi.string().required(),
  originalSlices: Joi.array()
    .items(
      Joi.object({
        departure_date: Joi.string().iso().required(),
        origin: Joi.object({
          iata_code: Joi.string().length(3).required()
        }).required(),
        destination: Joi.object({
          iata_code: Joi.string().length(3).required()
        }).required(),
        status: Joi.string().optional()
      })
    )
    .min(1)
    .required()
});

/**
 * Validation schema for payment
 */
export const paymentSchema = Joi.object({
  orderId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).required(),
  paymentMethod: Joi.string().valid('balance', 'card').default('balance').optional()
});

/**
 * Validation schema for cancelling hold order
 */
export const cancelHoldOrderSchema = Joi.object({
  orderId: Joi.string().required(),
  reason: Joi.string().optional()
});

/**
 * Validation schema for adding service to hold order
 */
export const addServiceSchema = Joi.object({
  orderId: Joi.string().required(),
  serviceId: Joi.string().required()
});

/**
 * Validation schema for refunding payment
 */
export const refundPaymentSchema = Joi.object({
  paymentId: Joi.string().required(),
  reason: Joi.string().optional()
});
