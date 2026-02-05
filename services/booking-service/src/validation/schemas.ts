import * as JoiModule from 'joi';
const Joi: any = (JoiModule as any).default || JoiModule;

// Booking validation schema
export const bookingSchema = Joi.object({
  type: Joi.string().valid('flight', 'hotel', 'package').required(),
  customerId: Joi.string().uuid().required(),
  customerType: Joi.string().valid('B2B', 'B2C').required(),
  companyId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  productId: Joi.string().optional(),
  supplierId: Joi.string().optional(),
  serviceDetails: Joi.object().required(),
  passengers: Joi.array().items(Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    dateOfBirth: Joi.date().iso().optional(),
    passportNumber: Joi.string().optional(),
    nationality: Joi.string().length(2).optional()
  })).min(1).required(),
  pricing: Joi.object({
    customerPrice: Joi.number().positive().required(),
    supplierPrice: Joi.number().positive().required(),
    markup: Joi.number().min(0).required(),
    currency: Joi.string().length(3).required()
  }).required(),
  payment: Joi.object({
    method: Joi.string().valid('wallet', 'credit_card', 'supplier_credit').required(),
    amount: Joi.number().positive().required(),
    supplierPayment: Joi.object({
      method: Joi.string().required(),
      terms: Joi.string().required()
    }).optional()
  }).required(),
  bookingType: Joi.string().valid('instant', 'hold', 'request').required(),
  specialRequests: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional()
});

// Search validation schema
export const searchSchema = Joi.object({
  bookingId: Joi.string().optional(),
  customerName: Joi.string().min(2).max(100).optional(),
  customerEmail: Joi.string().email().optional(),
  pnr: Joi.string().optional(),
  supplierRef: Joi.string().optional(),
  companyId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  status: Joi.array().items(Joi.string()).optional(),
  type: Joi.array().items(Joi.string()).optional(),
  queueType: Joi.array().items(Joi.string()).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC').optional()
});

// GDS import validation schema
export const gdsImportSchema = Joi.object({
  gdsType: Joi.string().valid('amadeus', 'sabre', 'travelport').required(),
  pnr: Joi.string().required(),
  supplierRef: Joi.string().required()
});