import { Request, Response } from 'express';
import { BookingData, BookingResponse, SearchParams, BookingStats, UserBookingStats } from '../types/index.js';
import { isBookingData, isSearchParams } from '../types/typeGuards.js';

/**
 * API Documentation with Typed Endpoints
 * 
 * This module provides comprehensive API documentation with typed endpoints
 * for the booking service, including request/response schemas and examples.
 */

// API Documentation Structure
export interface APIDocumentation {
  version: string;
  title: string;
  description: string;
  endpoints: EndpointDocumentation[];
  schemas: SchemaDocumentation;
}

export interface EndpointDocumentation {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  parameters?: ParameterDocumentation[];
  requestBody?: RequestBodyDocumentation;
  responses: ResponseDocumentation[];
  security?: SecurityRequirement[];
}

export interface ParameterDocumentation {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description: string;
  required: boolean;
  schema: SchemaType;
}

export interface RequestBodyDocumentation {
  description: string;
  required: boolean;
  content: {
    [contentType: string]: {
      schema: SchemaType;
      examples?: Record<string, any>;
    };
  };
}

export interface ResponseDocumentation {
  statusCode: number;
  description: string;
  content?: {
    [contentType: string]: {
      schema: SchemaType;
      examples?: Record<string, any>;
    };
  };
}

export interface SchemaDocumentation {
  [schemaName: string]: SchemaType;
}

export interface SchemaType {
  type?: 'object' | 'string' | 'number' | 'boolean' | 'array' | 'integer';
  properties?: Record<string, SchemaType>;
  items?: SchemaType;
  required?: string[];
  enum?: string[];
  format?: string;
  description?: string;
  example?: any;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  nullable?: boolean;
  const?: boolean;
  $ref?: string;
}

export interface SecurityRequirement {
  [securityScheme: string]: string[];
}

// API Documentation Instance
export const apiDocumentation: APIDocumentation = {
  version: '1.0.0',
  title: 'Booking Service API',
  description: 'Comprehensive booking management API with typed endpoints',
  endpoints: [
    {
      path: '/api/bookings',
      method: 'POST',
      summary: 'Create a new booking',
      description: 'Creates a new booking with the provided booking data',
      requestBody: {
        description: 'Booking data to create',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              $ref: '#/schemas/BookingData'
            },
            examples: {
              flightBooking: {
                summary: 'Flight Booking Example',
                value: {
                  userId: 'user-123',
                  flightRouteId: 1,
                  totalAmount: 500.00,
                  currency: 'USD',
                  bookingId: 'BK-2023-001',
                  partnerId: 'amadeus',
                  productId: 'flight-123',
                  status: 'confirmed',
                  pricing: {
                    sellingAmount: 500.00,
                    markupAmount: 50.00,
                    commissionAmount: 25.00
                  },
                  paymentInfo: {
                    method: 'credit_card',
                    status: 'completed',
                    transactionId: 'txn-123'
                  }
                }
              },
              hotelBooking: {
                summary: 'Hotel Booking Example',
                value: {
                  userId: 'user-456',
                  hotelId: 1,
                  totalAmount: 200.00,
                  currency: 'USD',
                  bookingId: 'BK-2023-002',
                  partnerId: 'booking.com',
                  productId: 'hotel-456',
                  status: 'pending',
                  bookingOptions: {
                    travelInsurance: true,
                    specialRequests: 'Late check-in'
                  }
                }
              }
            }
          }
        }
      },
      responses: [
        {
          statusCode: 201,
          description: 'Booking created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/BookingResponse'
              },
              examples: {
                success: {
                  summary: 'Successful Response',
                  value: {
                    id: 1,
                    userId: 'user-123',
                    flightRouteId: 1,
                    totalAmount: 500.00,
                    currency: 'USD',
                    bookingId: 'BK-2023-001',
                    partnerId: 'amadeus',
                    productId: 'flight-123',
                    status: 'confirmed',
                    createdAt: '2023-01-01T00:00:00.000Z',
                    updatedAt: '2023-01-01T00:00:00.000Z',
                    tenantId: 'tenant-123',
                    companyId: 'company-123'
                  }
                }
              }
            }
          }
        },
        {
          statusCode: 400,
          description: 'Invalid booking data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/ErrorResponse'
              }
            }
          }
        },
        {
          statusCode: 409,
          description: 'Booking already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/ErrorResponse'
              }
            }
          }
        }
      ],
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    {
      path: '/api/bookings/{id}',
      method: 'GET',
      summary: 'Get booking by ID',
      description: 'Retrieves a booking by its unique identifier',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Booking ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: [
        {
          statusCode: 200,
          description: 'Booking found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/BookingResponse'
              }
            }
          }
        },
        {
          statusCode: 404,
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/ErrorResponse'
              }
            }
          }
        }
      ],
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    {
      path: '/api/bookings',
      method: 'GET',
      summary: 'Search bookings',
      description: 'Searches for bookings based on various criteria',
      parameters: [
        {
          name: 'status',
          in: 'query',
          description: 'Booking status filter',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'confirmed', 'cancelled', 'refunded', 'failed']
          }
        },
        {
          name: 'type',
          in: 'query',
          description: 'Booking type filter',
          required: false,
          schema: {
            type: 'string',
            enum: ['flight', 'hotel', 'package']
          }
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Start date for booking creation filter',
          required: false,
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'End date for booking creation filter',
          required: false,
          schema: {
            type: 'string',
            format: 'date-time'
          }
        },
        {
          name: 'userId',
          in: 'query',
          description: 'User ID filter',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Number of results per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100
          }
        }
      ],
      responses: [
        {
          statusCode: 200,
          description: 'Bookings found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bookings: {
                    type: 'array',
                    items: {
                      $ref: '#/schemas/BookingResponse'
                    }
                  },
                  total: {
                    type: 'integer'
                  },
                  page: {
                    type: 'integer'
                  },
                  limit: {
                    type: 'integer'
                  },
                  totalPages: {
                    type: 'integer'
                  }
                }
              }
            }
          }
        }
      ],
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    {
      path: '/api/bookings/{id}',
      method: 'PUT',
      summary: 'Update booking',
      description: 'Updates an existing booking',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Booking ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        description: 'Updated booking data',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['pending', 'confirmed', 'cancelled', 'refunded', 'failed'],
                  description: 'New booking status'
                },
                totalAmount: {
                  type: 'number',
                  description: 'Updated total amount'
                },
                currency: {
                  type: 'string',
                  pattern: '^[A-Z]{3}$',
                  description: 'Updated currency code'
                }
              }
            }
          }
        }
      },
      responses: [
        {
          statusCode: 200,
          description: 'Booking updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/BookingResponse'
              }
            }
          }
        },
        {
          statusCode: 404,
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/ErrorResponse'
              }
            }
          }
        }
      ],
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    {
      path: '/api/bookings/{id}',
      method: 'DELETE',
      summary: 'Delete booking',
      description: 'Deletes a booking by its ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Booking ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: [
        {
          statusCode: 200,
          description: 'Booking deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        {
          statusCode: 404,
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/ErrorResponse'
              }
            }
          }
        }
      ],
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    {
      path: '/api/bookings/stats',
      method: 'GET',
      summary: 'Get booking statistics',
      description: 'Retrieves booking statistics including counts and totals',
      responses: [
        {
          statusCode: 200,
          description: 'Statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/BookingStats'
              }
            }
          }
        }
      ],
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    {
      path: '/api/bookings/users/{userId}/stats',
      method: 'GET',
      summary: 'Get user booking statistics',
      description: 'Retrieves booking statistics for a specific user',
      parameters: [
        {
          name: 'userId',
          in: 'path',
          description: 'User ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: [
        {
          statusCode: 200,
          description: 'User statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/UserBookingStats'
              }
            }
          }
        },
        {
          statusCode: 404,
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/schemas/ErrorResponse'
              }
            }
          }
        }
      ],
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  ],
  schemas: {
    BookingData: {
      type: 'object',
      description: 'Booking creation data',
      properties: {
        userId: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the user making the booking'
        },
        flightRouteId: {
          type: 'integer',
          minimum: 1,
          description: 'ID of the flight route (optional for hotel bookings)'
        },
        hotelId: {
          type: 'integer',
          minimum: 1,
          description: 'ID of the hotel (optional for flight bookings)'
        },
        totalAmount: {
          type: 'number',
          minimum: 0,
          description: 'Total amount for the booking'
        },
        currency: {
          type: 'string',
          pattern: '^[A-Z]{3}$',
          description: 'Currency code (e.g., USD, EUR)'
        },
        bookingId: {
          type: 'string',
          description: 'Unique booking identifier'
        },
        partnerId: {
          type: 'string',
          description: 'ID of the booking partner'
        },
        productId: {
          type: 'string',
          description: 'ID of the product being booked'
        },
        status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'cancelled', 'refunded', 'failed'],
          description: 'Current status of the booking'
        },
        type: {
          type: 'string',
          enum: ['flight', 'hotel', 'package'],
          description: 'Type of booking'
        },
        reference: {
          type: 'string',
          description: 'External reference for the booking'
        },
        pricing: {
          type: 'object',
          properties: {
            sellingAmount: {
              type: 'number',
              minimum: 0
            },
            markupAmount: {
              type: 'number',
              minimum: 0
            },
            commissionAmount: {
              type: 'number',
              minimum: 0
            }
          },
          required: ['sellingAmount', 'markupAmount', 'commissionAmount']
        },
        paymentInfo: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['credit_card', 'debit_card', 'paypal', 'stripe']
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded']
            },
            transactionId: {
              type: 'string'
            }
          },
          required: ['method', 'status']
        },
        bookingOptions: {
          type: 'object',
          properties: {
            travelInsurance: {
              type: 'boolean'
            },
            specialRequests: {
              type: 'string'
            }
          }
        },
        assignedAgentId: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the agent assigned to this booking'
        },
        workflowStatus: {
          type: 'string',
          enum: ['new', 'in_progress', 'completed', 'cancelled'],
          description: 'Current workflow status'
        }
      },
      required: ['userId', 'totalAmount', 'currency', 'bookingId', 'partnerId', 'productId', 'status']
    },
    BookingResponse: {
      type: 'object',
      description: 'Booking response data',
      properties: {
        id: {
          type: 'integer',
          description: 'Unique booking ID'
        },
        userId: {
          type: 'string',
          format: 'uuid'
        },
        flightRouteId: {
          type: 'integer',
          nullable: true
        },
        hotelId: {
          type: 'integer',
          nullable: true
        },
        totalAmount: {
          type: 'number'
        },
        currency: {
          type: 'string'
        },
        bookingId: {
          type: 'string'
        },
        partnerId: {
          type: 'string'
        },
        productId: {
          type: 'string'
        },
        status: {
          type: 'string'
        },
        createdAt: {
          type: 'string',
          format: 'date-time'
        },
        updatedAt: {
          type: 'string',
          format: 'date-time'
        },
        tenantId: {
          type: 'string'
        },
        companyId: {
          type: 'string'
        },
        type: {
          type: 'string'
        },
        reference: {
          type: 'string'
        },
        pricing: {
          type: 'object',
          properties: {
            sellingAmount: {
              type: 'number'
            },
            markupAmount: {
              type: 'number'
            },
            commissionAmount: {
              type: 'number'
            }
          }
        },
        paymentInfo: {
          type: 'object',
          properties: {
            method: {
              type: 'string'
            },
            status: {
              type: 'string'
            },
            transactionId: {
              type: 'string'
            }
          }
        },
        bookingOptions: {
          type: 'object',
          properties: {
            travelInsurance: {
              type: 'boolean'
            },
            specialRequests: {
              type: 'string'
            }
          }
        },
        assignedAgentId: {
          type: 'string',
          format: 'uuid'
        },
        workflowStatus: {
          type: 'string'
        }
      },
      required: ['id', 'userId', 'totalAmount', 'currency', 'bookingId', 'partnerId', 'productId', 'status', 'createdAt', 'updatedAt', 'tenantId', 'companyId']
    },
    BookingStats: {
      type: 'object',
      description: 'Booking statistics',
      properties: {
        totalBookings: {
          type: 'integer',
          description: 'Total number of bookings'
        },
        pendingBookings: {
          type: 'integer',
          description: 'Number of pending bookings'
        },
        confirmedBookings: {
          type: 'integer',
          description: 'Number of confirmed bookings'
        },
        cancelledBookings: {
          type: 'integer',
          description: 'Number of cancelled bookings'
        },
        totalAmount: {
          type: 'number',
          description: 'Total amount of all bookings'
        },
        currency: {
          type: 'string',
          description: 'Currency of the total amount'
        }
      },
      required: ['totalBookings', 'pendingBookings', 'confirmedBookings', 'cancelledBookings', 'totalAmount', 'currency']
    },
    UserBookingStats: {
      type: 'object',
      description: 'User booking statistics',
      properties: {
        userId: {
          type: 'string',
          format: 'uuid'
        },
        totalBookings: {
          type: 'integer'
        },
        totalSpent: {
          type: 'number'
        },
        currency: {
          type: 'string'
        },
        lastBookingDate: {
          type: 'string',
          format: 'date-time',
          nullable: true
        },
        bookingHistory: {
          type: 'array',
          items: {
            $ref: '#/schemas/BookingResponse'
          }
        }
      },
      required: ['userId', 'totalBookings', 'totalSpent', 'currency', 'bookingHistory']
    },
    ErrorResponse: {
      type: 'object',
      description: 'Error response',
      properties: {
        success: {
          type: 'boolean',
          const: false
        },
        error: {
          type: 'string',
          description: 'Error message'
        },
        details: {
          type: 'object',
          nullable: true,
          description: 'Additional error details'
        },
        timestamp: {
          type: 'string',
          format: 'date-time'
        },
        path: {
          type: 'string',
          description: 'Request path where error occurred'
        }
      },
      required: ['success', 'error', 'timestamp']
    }
  }
};

// Typed API Response Helpers
export class APIResponseHelper {
  static success<T>(data: T, message?: string): { success: true; data: T; message?: string } {
    const response: { success: true; data: T; message?: string } = { success: true, data };
    if (message) response.message = message;
    return response;
  }

  static error(message: string, details?: any, statusCode: number = 500): { success: false; error: string; details?: any; statusCode: number } {
    return {
      success: false,
      error: message,
      details,
      statusCode
    };
  }

  static validationError(field: string, message: string): { success: false; error: string; field: string } {
    return {
      success: false,
      error: 'Validation failed',
      field
    };
  }

  static notFound(resource: string): { success: false; error: string } {
    return {
      success: false,
      error: `${resource} not found`
    };
  }

  static conflict(resource: string): { success: false; error: string } {
    return {
      success: false,
      error: `${resource} already exists`
    };
  }
}

// API Documentation Endpoint
export function getAPIDocumentation(req: Request, res: Response): void {
  res.json({
    ...apiDocumentation,
    generatedAt: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
}

// Schema validation helpers
export function validateBookingData(data: any): data is BookingData {
  return isBookingData(data);
}

export function validateSearchParams(params: any): params is SearchParams {
  return isSearchParams(params);
}

// API Versioning
export const API_VERSIONS = {
  V1: '1.0.0',
  V2: '2.0.0'
} as const;

export type APIVersion = keyof typeof API_VERSIONS;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    retryAfter: 900 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

// Security Schemes
export const SECURITY_SCHEMES = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
  }
};

export default apiDocumentation;