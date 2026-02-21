import { Request, Response } from 'express';
import { prisma } from '../database/index';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { cacheService, cacheKeys } from '../cache/redis';
import { metricsStore } from '../monitoring/metrics';
import { createLogger } from '@tripalfa/shared-utils/logger';
const logger = createLogger({ serviceName: 'booking-engine' });
import { BookingStatus, ServiceType, Priority } from '../types/booking';
import { CreateBookingRequest, SearchBookingsRequest, HoldInventoryRequest } from '../types/bookingManagement';
import { TypedRequest } from '../types';

export class BookingManagementController {
  // Create a new booking
  async createBooking(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const bookingData: CreateBookingRequest = typedReq.body;
      const userId = typedReq.user?.id;

      // Validate customer exists
      let customer;
      if (bookingData.customerInfo.type === 'individual') {
        customer = await prisma.customer.findUnique({
          where: { email: bookingData.customerInfo.email }
        });
      } else {
        customer = await prisma.company.findUnique({
          where: { name: bookingData.customerInfo.companyRegistrationNumber } as any
        });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      // Calculate pricing
      const pricing = await this.calculatePricing(bookingData);
      
      // Create booking
      const booking = await prisma.booking.create({
        data: {
          serviceType: bookingData.type as ServiceType,
          status: bookingData.bookingOptions?.hold ? BookingStatus.HOLD : BookingStatus.PENDING,
          reference: await this.generateBookingReference(),
          segment: 'default',
          customerPrice: pricing.sellingAmount,
          supplierPrice: pricing.netAmount,
          profit: pricing.profit,
          currency: bookingData.paymentInfo.currency,
          paymentMethod: bookingData.paymentInfo.method || 'wallet',
          assignedAgent: bookingData.bookingOptions?.hold ? null : await this.assignAgent(),
          customerName: bookingData.customerInfo.name,
          customerEmail: bookingData.customerInfo.email,
          customerPhone: bookingData.customerInfo.phone
        },
        include: {
          customer: true
        }
      });

      // Cache the booking
      await cacheService.set(
        cacheKeys.booking(booking.id),
        booking,
        600 // 10 minutes
      );

      // Record metrics
      (metricsStore as any).recordBookingCreated(booking.serviceType, booking.status);

      logger.info('Booking created successfully', {
        bookingId: booking.id,
        reference: booking.reference,
        type: booking.serviceType,
        customerType: bookingData.customerInfo.type,
        amount: booking.customerPrice,
        currency: booking.currency
      });

      res.status(201).json({
        success: true,
        data: {
          booking,
          message: bookingData.bookingOptions?.hold ? 'Booking placed on hold' : 'Booking created successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to create booking', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create booking'
      });
    }
  }

  // Search bookings with advanced filtering
  async searchBookings(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const searchParams: SearchBookingsRequest = typedReq.query;
      const page = parseInt(String(searchParams.page)) || 1;
      const limit = parseInt(String(searchParams.limit)) || 10;
      const offset = (page - 1) * limit;

      // Build filter conditions
      const whereConditions: any = {};

      if (searchParams.status && searchParams.status.length > 0) {
        whereConditions.status = { in: searchParams.status };
      }

      if (searchParams.customer) {
        whereConditions.customerInfo = {
          path: '$.name',
          string_contains: searchParams.customer
        };
      }

      if (searchParams.agent) {
        whereConditions.assignedAgentId = searchParams.agent;
      }

      if (searchParams.dateFrom) {
        whereConditions.createdAt = {
          gte: new Date(searchParams.dateFrom as string)
        };
      }

      if (searchParams.dateTo) {
        whereConditions.createdAt = {
          ...whereConditions.createdAt,
          lte: new Date(searchParams.dateTo as string)
        };
      }

      if (searchParams.travelDateFrom) {
        whereConditions.details = {
          path: '$.travelDate',
          gte: new Date(searchParams.travelDateFrom as string)
        };
      }

      if (searchParams.travelDateTo) {
        whereConditions.details = {
          ...whereConditions.details,
          lte: new Date(searchParams.travelDateTo as string)
        };
      }

      if (searchParams.serviceType) {
        whereConditions.type = searchParams.serviceType;
      }

      if (searchParams.origin) {
        whereConditions.details = {
          path: '$.origin',
          string_contains: searchParams.origin
        };
      }

      if (searchParams.destination) {
        whereConditions.details = {
          path: '$.destination',
          string_contains: searchParams.destination
        };
      }

      if (searchParams.supplier) {
        whereConditions.details = {
          path: '$.supplier',
          string_contains: searchParams.supplier
        };
      }

      if (searchParams.priority && searchParams.priority.length > 0) {
        whereConditions.bookingOptions = {
          path: '$.priority',
          in: searchParams.priority
        };
      }

      if (searchParams.assignedAgent) {
        whereConditions.assignedAgentId = searchParams.assignedAgent;
      }

      if (searchParams.branchId) {
        whereConditions.branchId = searchParams.branchId;
      }

      if (searchParams.search) {
        whereConditions.OR = [
          {
            reference: {
              contains: searchParams.search,
              mode: 'insensitive'
            }
          },
          {
            customerInfo: {
              path: '$.name',
              string_contains: searchParams.search
            }
          },
          {
            details: {
              path: '$.origin',
              string_contains: searchParams.search
            }
          },
          {
            details: {
              path: '$.destination',
              string_contains: searchParams.search
            }
          }
        ];
      }

      // Execute search with pagination
      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where: whereConditions,
          skip: offset,
          take: limit,
          orderBy: { bookedAt: 'desc' },
          include: {
            customer: true
          }
        }),
        prisma.booking.count({ where: whereConditions })
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: {
          bookings,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      });

    } catch (error) {
      logger.error('Failed to search bookings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to search bookings'
      });
    }
  }

  private respondNotImplemented(res: Response, action: string): Response {
    return res.status(501).json({
      success: false,
      error: `${action} is not implemented`
    });
  }

  async getBookingDetails(_req: Request, res: Response): Promise<Response> {
    return this.respondNotImplemented(res, 'getBookingDetails');
  }

  async updateBooking(_req: Request, res: Response): Promise<Response> {
    return this.respondNotImplemented(res, 'updateBooking');
  }

  async cancelBooking(_req: Request, res: Response): Promise<Response> {
    return this.respondNotImplemented(res, 'cancelBooking');
  }

  async releaseInventory(_req: Request, res: Response): Promise<Response> {
    return this.respondNotImplemented(res, 'releaseInventory');
  }

  async getBookingHistory(_req: Request, res: Response): Promise<Response> {
    return this.respondNotImplemented(res, 'getBookingHistory');
  }

  async generateReport(_req: Request, res: Response): Promise<Response> {
    return this.respondNotImplemented(res, 'generateReport');
  }

  async getDashboardStats(_req: Request, res: Response): Promise<Response> {
    return this.respondNotImplemented(res, 'getDashboardStats');
  }

  async bulkUpdateBookings(_req: Request, res: Response): Promise<Response> {
    return this.respondNotImplemented(res, 'bulkUpdateBookings');
  }

  // ============================================================================
  // Order Cancellation Routes (Duffel Integration)
  // ============================================================================

  /**
   * Cancel a flight order
   * Handles both reservation-only cancellations (hold bookings) and ticket cancellations
   * with smart timing logic for void (same-day) vs refund (next-day) operations.
   */
  async cancelOrder(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId, orderId, reason } = typedReq.body;
      const userId = typedReq.user?.id;

      if (!bookingId && !orderId) {
        return res.status(400).json({
          success: false,
          error: 'Either bookingId or orderId is required'
        });
      }

      // Import the cancellation service
      const { duffelOrderCancellationService } = await import('../services/duffelOrderCancellationService');

      // Get Duffel order ID if only booking ID provided
      let duffelOrderId = orderId;
      if (!duffelOrderId && bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId }
        });

        if (!booking || !booking.supplierRef) {
          return res.status(404).json({
            success: false,
            error: 'Booking not found or has no associated Duffel order'
          });
        }

        duffelOrderId = booking.supplierRef;
      }

      logger.info('Starting order cancellation', {
        bookingId,
        orderId: duffelOrderId,
        userId,
        reason
      });

      // Call the cancellation service
      const cancellationResult = await duffelOrderCancellationService.cancelOrder({
        orderId: duffelOrderId,
        reason: reason || 'Customer requested cancellation'
      });

      if (!cancellationResult.success) {
        logger.warn('Order cancellation failed', {
          bookingId,
          orderId: duffelOrderId,
          message: cancellationResult.message
        });

        return res.status(422).json({
          success: false,
          error: cancellationResult.message,
          details: cancellationResult
        });
      }

      // Record cancellation in audit trail
      if (bookingId) {
        await prisma.auditLog.create({
          data: {
            bookingId,
            action: 'user_initiated_cancellation',
            actor: userId || 'unknown',
            details: {
              orderId: duffelOrderId,
              cancellationId: cancellationResult.cancellationId,
              method: cancellationResult.cancellationMethod,
              reason,
              timestamp: new Date().toISOString()
            }
          }
        });
      }

      logger.info('Order cancelled successfully', {
        bookingId,
        orderId: duffelOrderId,
        cancellationId: cancellationResult.cancellationId,
        method: cancellationResult.cancellationMethod
      });

      res.status(200).json({
        success: true,
        data: cancellationResult,
        message: 'Order cancelled successfully'
      });

    } catch (error) {
      logger.error('Failed to cancel order', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to cancel order',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get cancellation status for an order
   */
  async getCancellationStatus(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId, orderId } = typedReq.query;

      if (!bookingId && !orderId) {
        return res.status(400).json({
          success: false,
          error: 'Either bookingId or orderId is required'
        });
      }

      const { duffelOrderCancellationService } = await import('../services/duffelOrderCancellationService');

      // Get Duffel order ID if only booking ID provided
      let duffelOrderId = orderId as string;
      if (!duffelOrderId && bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId as string }
        });

        if (!booking) {
          return res.status(404).json({
            success: false,
            error: 'Booking not found'
          });
        }

        duffelOrderId = booking.supplierRef || booking.id;
      }

      logger.info('Fetching cancellation status', {
        bookingId,
        orderId: duffelOrderId
      });

      const status = await duffelOrderCancellationService.getCancellationStatus(duffelOrderId);

      res.status(200).json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Failed to fetch cancellation status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch cancellation status'
      });
    }
  }

  // Get available airline credits for a customer
  async getAvailableAirlineCredits(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { customerId, bookingId } = typedReq.query;
      const page = parseInt(typedReq.query.page as string) || 1;
      const limit = parseInt(typedReq.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      let targetCustomerId = customerId as string;

      // If bookingId provided, get the customer from the booking
      if (bookingId && !targetCustomerId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId as string },
          select: { customerId: true }
        });

        if (!booking) {
          return res.status(404).json({
            success: false,
            error: 'Booking not found'
          });
        }

        targetCustomerId = booking.customerId;
      }

      if (!targetCustomerId) {
        return res.status(400).json({
          success: false,
          error: 'Either customerId or bookingId is required'
        });
      }

      // Verify customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: targetCustomerId }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      logger.info('Fetching available airline credits', {
        customerId: targetCustomerId,
        page,
        limit
      });

      // Get available airline credits (not spent, not invalidated, not expired)
      const now = new Date();

      const [credits, total] = await Promise.all([
        prisma.airlineCredit.findMany({
          where: {
            customerId: targetCustomerId,
            status: 'active',
            availableForUse: true,
            expiresAt: {
              gt: now
            },
            spentAt: null,
            invalidatedAt: null
          },
          select: {
            id: true,
            duffelCreditId: true,
            code: true,
            amount: true,
            currency: true,
            type: true,
            airlineIataCode: true,
            givenName: true,
            familyName: true,
            issuedOn: true,
            expiresAt: true,
            booking: {
              select: {
                id: true,
                reference: true,
                travelDate: true
              }
            }
          },
          orderBy: { expiresAt: 'asc' },
          take: limit,
          skip: offset
        }),
        prisma.airlineCredit.count({
          where: {
            customerId: targetCustomerId,
            status: 'active',
            availableForUse: true,
            expiresAt: {
              gt: now
            },
            spentAt: null,
            invalidatedAt: null
          }
        })
      ]);

      // Calculate expiration warnings
      const creditsWithWarnings = credits.map((credit: any) => ({
        ...credit,
        expiresIn: Math.ceil((credit.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        expiringSoon: credit.expiresAt.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000 // Less than 7 days
      }));

      const totalAmount = credits.reduce((sum: number, c: any) => sum + Number(c.amount), 0);

      res.status(200).json({
        success: true,
        data: {
          credits: creditsWithWarnings,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          summary: {
            totalCredits: total,
            totalAmount,
            currency: credits[0]?.currency || 'USD',
            expiringInNext7Days: creditsWithWarnings.filter((c: any) => c.expiresIn <= 7).length
          }
        }
      });

    } catch (error) {
      logger.error('Failed to fetch available airline credits', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch available airline credits'
      });
    }
  }

  // Search customers
  async searchCustomers(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const searchParams = typedReq.query;
      const page = parseInt(searchParams.page as string) || 1;
      const limit = parseInt(searchParams.limit as string) || 10;
      const offset = (page - 1) * limit;

      const whereConditions: any = {};

      if (searchParams.type) {
        whereConditions.type = searchParams.type;
      }

      if (searchParams.name) {
        whereConditions.name = {
          contains: searchParams.name,
          mode: 'insensitive'
        };
      }

      if (searchParams.email) {
        whereConditions.email = searchParams.email;
      }

      if (searchParams.phone) {
        whereConditions.phone = searchParams.phone;
      }

      if (searchParams.companyName) {
        whereConditions.companyName = {
          contains: searchParams.companyName,
          mode: 'insensitive'
        };
      }

      if (searchParams.branchId) {
        whereConditions.branchId = searchParams.branchId;
      }

      if (searchParams.status) {
        whereConditions.status = searchParams.status;
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where: whereConditions,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.customer.count({ where: whereConditions })
      ]);

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Failed to search customers', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to search customers'
      });
    }
  }

  // Create customer
  async createCustomer(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const customerData = typedReq.body;
      const userId = typedReq.user?.id;

      const customer = await prisma.customer.create({
        data: {
          ...customerData,
          createdBy: userId,
          status: 'active'
        }
      });

      logger.info('Customer created successfully', {
        customerId: customer.id,
        name: customer.name,
        type: customer.type,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: customer
      });

    } catch (error) {
      // Check for Prisma unique constraint violation on email
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002' &&
          error.meta?.target && Array.isArray(error.meta.target) && error.meta.target.includes('email')) {
        logger.warn('Attempted to create customer with duplicate email', {
          email: typedReq.body.email,
          userId: typedReq.user?.id
        });

        return res.status(409).json({
          success: false,
          error: 'Customer with this email already exists'
        });
      }

      logger.error('Failed to create customer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create customer'
      });
    }
  }

  // Search suppliers
  async searchSuppliers(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const searchParams = typedReq.query;
      const page = parseInt(searchParams.page as string) || 1;
      const limit = parseInt(searchParams.limit as string) || 10;
      const offset = (page - 1) * limit;

      const whereConditions: any = {};

      if (searchParams.type) {
        whereConditions.type = searchParams.type;
      }

      if (searchParams.name) {
        whereConditions.name = {
          contains: searchParams.name,
          mode: 'insensitive'
        };
      }

      if (searchParams.contactName) {
        whereConditions.contactName = {
          contains: searchParams.contactName,
          mode: 'insensitive'
        };
      }

      if (searchParams.contactEmail) {
        whereConditions.contactEmail = searchParams.contactEmail;
      }

      if (searchParams.contactPhone) {
        whereConditions.contactPhone = searchParams.contactPhone;
      }

      if (searchParams.status) {
        whereConditions.status = searchParams.status;
      }

      if (searchParams.serviceTypes && Array.isArray(searchParams.serviceTypes) && searchParams.serviceTypes.length > 0) {
        whereConditions.serviceTypes = {
          hasSome: searchParams.serviceTypes
        };
      }

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where: whereConditions,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.supplier.count({ where: whereConditions })
      ]);

      res.json({
        success: true,
        data: {
          suppliers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Failed to search suppliers', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to search suppliers'
      });
    }
  }

  // Create supplier
  async createSupplier(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const supplierData = typedReq.body;
      const userId = typedReq.user?.id;

      const supplier = await prisma.supplier.create({
        data: {
          ...supplierData,
          createdBy: userId
        }
      });

      logger.info('Supplier created successfully', {
        supplierId: supplier.id,
        name: supplier.name,
        type: supplier.type,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: supplier
      });

    } catch (error) {
      logger.error('Failed to create supplier', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create supplier'
      });
    }
  }

  // ============================================================================
  // Inventory Management Methods
  // ============================================================================

  // Search inventory with filters and pagination
  async searchInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const searchParams = typedReq.query;
      const page = Math.max(1, parseInt(String(searchParams.page || 1), 10));
      const limit = Math.max(1, Math.min(100, parseInt(String(searchParams.limit || 10), 10)));
      const offset = (page - 1) * limit;

      const whereConditions: any = {};

      if (searchParams.supplierId) {
        whereConditions.supplierId = searchParams.supplierId;
      }

      if (searchParams.productCode) {
        whereConditions.productCode = {
          contains: searchParams.productCode,
          mode: 'insensitive'
        };
      }

      if (searchParams.name) {
        whereConditions.name = {
          contains: searchParams.name,
          mode: 'insensitive'
        };
      }

      if (searchParams.status) {
        const statusArray = Array.isArray(searchParams.status) ? searchParams.status : [searchParams.status];
        if (statusArray.length > 0) {
          whereConditions.status = {
            in: statusArray
          };
        }
      }

      if (searchParams.minPrice !== undefined && searchParams.minPrice !== '') {
        const minPrice = parseFloat(String(searchParams.minPrice));
        if (!isNaN(minPrice)) {
          whereConditions.price = {
            gte: minPrice
          };
        }
      }

      if (searchParams.maxPrice !== undefined && searchParams.maxPrice !== '') {
        const maxPrice = parseFloat(String(searchParams.maxPrice));
        if (!isNaN(maxPrice)) {
          if (whereConditions.price) {
            whereConditions.price.lte = maxPrice;
          } else {
            whereConditions.price = { lte: maxPrice };
          }
        }
      }

      if (searchParams.minAvailable !== undefined && searchParams.minAvailable !== '') {
        const minAvailable = parseInt(String(searchParams.minAvailable), 10);
        if (!isNaN(minAvailable)) {
          whereConditions.available = {
            gte: minAvailable
          };
        }
      }

      if (searchParams.serviceTypes) {
        const serviceTypesArray = Array.isArray(searchParams.serviceTypes) ? searchParams.serviceTypes : [searchParams.serviceTypes];
        if (serviceTypesArray.length > 0) {
          whereConditions.serviceTypes = {
            hasSome: serviceTypesArray
          };
        }
      }

      if (searchParams.search) {
        whereConditions.OR = [
          { productCode: { contains: searchParams.search, mode: 'insensitive' } },
          { name: { contains: searchParams.search, mode: 'insensitive' } },
          { description: { contains: searchParams.search, mode: 'insensitive' } }
        ];
      }

      const [inventory, total] = await Promise.all([
        (prisma as any).inventory.findMany({
          where: whereConditions,
          skip: offset,
          take: limit,
          include: {
            supplier: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        (prisma as any).inventory.count({ where: whereConditions })
      ]);

      logger.info('Inventory search completed', {
        userId: typedReq.user?.id,
        filters: searchParams,
        resultCount: inventory.length,
        totalCount: total
      });

      res.status(200).json({
        success: true,
        data: {
          inventory,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Inventory search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to search inventory'
      });
    }
  }

  // Create inventory item
  async createInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const inventoryData = typedReq.body;
      const userId = typedReq.user?.id;

      // Check if supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: inventoryData.supplierId }
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: 'Supplier not found'
        });
      }

      // Check if product code already exists
      const existing = await (prisma as any).inventory.findUnique({
        where: { productCode: inventoryData.productCode }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Product code already exists'
        });
      }

      const inventory = await (prisma as any).inventory.create({
        data: {
          supplierId: inventoryData.supplierId,
          productCode: inventoryData.productCode,
          name: inventoryData.name,
          description: inventoryData.description,
          quantity: inventoryData.quantity,
          available: inventoryData.quantity,
          reserved: 0,
          price: inventoryData.price,
          currency: inventoryData.currency || 'USD',
          minimumPrice: inventoryData.minimumPrice,
          status: inventoryData.status || 'active',
          serviceTypes: inventoryData.serviceTypes || []
        },
        include: {
          supplier: true
        }
      });

      // Cache the inventory
      await cacheService.set(
        cacheKeys.inventory(inventory.id),
        inventory,
        600
      );

      logger.info('Inventory created successfully', {
        inventoryId: inventory.id,
        productCode: inventory.productCode,
        supplierId: inventory.supplierId,
        quantity: inventory.quantity,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: inventory
      });

    } catch (error) {
      logger.error('Failed to create inventory', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create inventory'
      });
    }
  }

  // Get specific inventory item
  async getInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { inventoryId } = typedReq.params;

      // Try cache first
      const cached = await cacheService.get(cacheKeys.inventory(inventoryId));
      if (cached) {
        return res.status(200).json({
          success: true,
          data: cached
        });
      }

      const inventory = await (prisma as any).inventory.findUnique({
        where: { id: inventoryId },
        include: {
          supplier: true
        }
      });

      if (!inventory) {
        return res.status(404).json({
          success: false,
          error: 'Inventory not found'
        });
      }

      // Cache the result
      await cacheService.set(cacheKeys.inventory(inventoryId), inventory, 600);

      logger.info('Inventory retrieved', {
        inventoryId: inventoryId,
        userId: typedReq.user?.id
      });

      res.status(200).json({
        success: true,
        data: inventory
      });

    } catch (error) {
      logger.error('Failed to get inventory', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve inventory'
      });
    }
  }

  // Update inventory item
  async updateInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { inventoryId } = typedReq.params;
      const updates = typedReq.body;
      const userId = typedReq.user?.id;

      // Verify inventory exists
      const existing = await (prisma as any).inventory.findUnique({
        where: { id: inventoryId }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Inventory not found'
        });
      }

      // Update available quantity if quantity was changed
      let updateData: any = {
        ...updates,
        lastUpdated: new Date()
      };

      if (updates.quantity !== undefined && updates.available === undefined) {
        const quantityDiff = updates.quantity - existing.quantity;
        updateData.available = existing.available + quantityDiff;
      }

      const inventory = await (prisma as any).inventory.update({
        where: { id: inventoryId },
        data: updateData,
        include: {
          supplier: true
        }
      });

      // Invalidate cache
      await cacheService.del(cacheKeys.inventory(inventoryId));

      logger.info('Inventory updated', {
        inventoryId: inventoryId,
        updates,
        updatedBy: userId
      });

      res.status(200).json({
        success: true,
        data: inventory
      });

    } catch (error) {
      logger.error('Failed to update inventory', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update inventory'
      });
    }
  }

  // Delete inventory item
  async deleteInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { inventoryId } = typedReq.params;
      const userId = typedReq.user?.id;

      // Verify inventory exists
      const existing = await (prisma as any).inventory.findUnique({
        where: { id: inventoryId }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Inventory not found'
        });
      }

      await (prisma as any).inventory.delete({
        where: { id: inventoryId }
      });

      // Invalidate cache
      await cacheService.del(cacheKeys.inventory(inventoryId));

      logger.info('Inventory deleted', {
        inventoryId: inventoryId,
        productCode: existing.productCode,
        deletedBy: userId
      });

      res.status(200).json({
        success: true,
        data: { message: 'Inventory deleted successfully' }
      });

    } catch (error) {
      logger.error('Failed to delete inventory', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete inventory'
      });
    }
  }

  // Check inventory availability
  async checkAvailability(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { inventoryId } = typedReq.params;
      const { quantity } = typedReq.body;

      const inventory = await (prisma as any).inventory.findUnique({
        where: { id: inventoryId },
        include: {
          supplier: true
        }
      });

      if (!inventory) {
        return res.status(404).json({
          success: false,
          error: 'Inventory not found'
        });
      }

      const isAvailable = inventory.available >= quantity;
      const canReserve = inventory.available >= quantity && inventory.status === 'active';

      logger.info('Availability check performed', {
        inventoryId: inventoryId,
        requestedQuantity: quantity,
        availableQuantity: inventory.available,
        isAvailable,
        canReserve,
        userId: typedReq.user?.id
      });

      res.status(200).json({
        success: true,
        data: {
          inventoryId: inventoryId,
          productCode: inventory.productCode,
          name: inventory.name,
          requestedQuantity: quantity,
          availableQuantity: inventory.available,
          isAvailable,
          canReserve,
          status: inventory.status,
          price: inventory.price,
          currency: inventory.currency,
          supplier: inventory.supplier
        }
      });

    } catch (error) {
      logger.error('Availability check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to check availability'
      });
    }
  }

  // Hold inventory
  async holdInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const holdData: HoldInventoryRequest = typedReq.body;
      const userId = typedReq.user?.id;

      // Check if inventory is available
      const inventory = await (prisma as any).inventory.findFirst({
        where: {
          serviceType: holdData.serviceType,
          status: 'available',
          validity: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          }
        }
      });

      if (!inventory) {
        return res.status(404).json({
          success: false,
          error: 'No available inventory found'
        });
      }

      // Create hold record
      const hold = await (prisma as any).inventoryHold.create({
        data: {
          inventoryId: inventory.id,
          serviceType: holdData.serviceType,
          inventoryDetails: holdData.inventoryDetails,
          holdDuration: holdData.holdDuration,
          customerInfo: holdData.customerInfo,
          remarks: holdData.remarks,
          createdBy: userId
        }
      });

      // Update inventory status
      await (prisma as any).inventory.update({
        where: { id: inventory.id },
        data: { status: 'on_hold' }
      });

      logger.info('Inventory held successfully', {
        holdId: hold.id,
        inventoryId: inventory.id,
        serviceType: holdData.serviceType,
        customerName: holdData.customerInfo.name,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: {
          hold,
          message: `Inventory held for ${holdData.holdDuration} minutes`
        }
      });

    } catch (error) {
      logger.error('Failed to hold inventory', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to hold inventory'
      });
    }
  }

  // Confirm booking
  async confirmBooking(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId } = typedReq.params;
      const confirmationData = typedReq.body;
      const userId = typedReq.user?.id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      if (booking.status !== BookingStatus.HOLD && booking.status !== BookingStatus.PENDING) {
        return res.status(400).json({
          success: false,
          error: 'Booking cannot be confirmed in current status'
        });
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          supplierRef: confirmationData.supplierReference,
          supplierPnr: confirmationData.supplierPNR,
          lastModified: new Date()
        }
      });

      // Clear cache
      await cacheService.del(cacheKeys.booking(String(bookingId)));

      logger.info('Booking confirmed successfully', {
        bookingId,
        reference: updatedBooking.reference,
        supplierReference: confirmationData.supplierReference,
        confirmedBy: userId
      });

      res.json({
        success: true,
        data: {
          booking: updatedBooking,
          message: 'Booking confirmed successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to confirm booking', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to confirm booking'
      });
    }
  }

  // Issue ticket
  async issueTicket(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId } = typedReq.params;
      const ticketData = typedReq.body;
      const userId = typedReq.user?.id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      if (booking.status !== BookingStatus.CONFIRMED) {
        return res.status(400).json({
          success: false,
          error: 'Cannot issue ticket for non-confirmed booking'
        });
      }

      // Create ticket records
      const tickets = await Promise.all(
        ticketData.passengerDetails.map((passenger: any) =>
          (prisma as any).ticket.create({
            data: {
              bookingId,
              passengerId: passenger.passengerId,
              ticketNumber: passenger.ticketNumber,
              pnr: passenger.pnr,
              seatNumber: passenger.seatNumber,
              baggageAllowance: passenger.baggageAllowance,
              issuedBy: userId,
              issueDate: ticketData.issueDetails.issueDate,
              remarks: ticketData.issueDetails.remarks
            }
          })
        )
      );

      logger.info('Tickets issued successfully', {
        bookingId,
        ticketCount: tickets.length,
        issuedBy: userId
      });

      res.json({
        success: true,
        data: {
          tickets,
          message: 'Tickets issued successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to issue ticket', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to issue ticket'
      });
    }
  }

  // Update workflow status
  async updateWorkflowStatus(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId } = typedReq.params;
      const statusData = typedReq.body;
      const userId = typedReq.user?.id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: statusData.status as BookingStatus,
        }
      });

      // Clear cache
      await cacheService.del(cacheKeys.booking(String(bookingId)));

      logger.info('Workflow status updated', {
        bookingId,
        status: statusData.status,
        reason: statusData.reason,
        updatedBy: userId
      });

      res.json({
        success: true,
        data: {
          booking: updatedBooking,
          message: 'Workflow status updated successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to update workflow status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update workflow status'
      });
    }
  }

  // Assign booking to agent
  async assignBooking(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId } = typedReq.params;
      const assignmentData = typedReq.body;
      const userId = typedReq.user?.id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          assignedAgent: assignmentData.agentId,
          lastModified: new Date()
        }
      });

      // Clear cache
      await cacheService.del(cacheKeys.booking(String(bookingId)));

      logger.info('Booking assigned successfully', {
        bookingId,
        assignedAgentId: assignmentData.agentId,
        priority: assignmentData.priority,
        assignedBy: userId
      });

      res.json({
        success: true,
        data: {
          booking: updatedBooking,
          message: 'Booking assigned successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to assign booking', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to assign booking'
      });
    }
  }

  // Update booking priority
  async updatePriority(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId } = typedReq.params;
      const priorityData = typedReq.body;
      const userId = typedReq.user?.id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          assignedAgent: priorityData.assignedAgent || booking.assignedAgent
        }
      });

      // Clear cache
      await cacheService.del(cacheKeys.booking(String(bookingId)));

      logger.info('Booking priority updated', {
        bookingId,
        priority: priorityData.priority,
        reason: priorityData.reason,
        updatedBy: userId
      });

      res.json({
        success: true,
        data: {
          booking: updatedBooking,
          message: 'Booking priority updated successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to update booking priority', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update booking priority'
      });
    }
  }

  // Get pricing rules
  async getPricingRules(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const page = parseInt(typedReq.query.page as string) || 1;
      const limit = parseInt(typedReq.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const [pricingRules, total] = await Promise.all([
        (prisma as any).pricingRule.findMany({
          skip: offset,
          take: limit,
          orderBy: { bookedAt: 'desc' }
        }),
        (prisma as any).pricingRule.count()
      ]);

      res.json({
        success: true,
        data: {
          pricingRules,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get pricing rules', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get pricing rules'
      });
    }
  }

  // Create pricing rule
  async createPricingRule(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const pricingRuleData = typedReq.body;
      const userId = typedReq.user?.id;

      const pricingRule = await (prisma as any).pricingRule.create({
        data: {
          ...pricingRuleData,
          createdBy: userId
        }
      });

      logger.info('Pricing rule created successfully', {
        ruleId: pricingRule.id,
        name: pricingRule.name,
        ruleType: pricingRule.ruleType,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: pricingRule
      });

    } catch (error) {
      logger.error('Failed to create pricing rule', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create pricing rule'
      });
    }
  }

  // Update pricing rule
  async updatePricingRule(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { ruleId } = typedReq.params;
      const updates = typedReq.body;
      const userId = typedReq.user?.id;

      const pricingRule = await (prisma as any).pricingRule.update({
        where: { id: ruleId },
        data: updates
      });

      logger.info('Pricing rule updated successfully', {
        ruleId,
        updates: Object.keys(updates),
        updatedBy: userId
      });

      res.json({
        success: true,
        data: pricingRule
      });

    } catch (error) {
      logger.error('Failed to update pricing rule', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update pricing rule'
      });
    }
  }

  // Delete pricing rule
  async deletePricingRule(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { ruleId } = typedReq.params;
      const userId = typedReq.user?.id;

      await (prisma as any).pricingRule.delete({
        where: { id: ruleId }
      });

      logger.info('Pricing rule deleted successfully', {
        ruleId,
        deletedBy: userId
      });

      res.json({
        success: true,
        message: 'Pricing rule deleted successfully'
      });

    } catch (error) {
      logger.error('Failed to delete pricing rule', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete pricing rule'
      });
    }
  }

  // Get commission rules
  async getCommissionRules(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const page = parseInt(typedReq.query.page as string) || 1;
      const limit = parseInt(typedReq.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const [commissionRules, total] = await Promise.all([
        (prisma as any).commissionRule.findMany({
          skip: offset,
          take: limit,
          orderBy: { bookedAt: 'desc' }
        }),
        (prisma as any).commissionRule.count()
      ]);

      res.json({
        success: true,
        data: {
          commissionRules,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get commission rules', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get commission rules'
      });
    }
  }

  // Create commission rule
  async createCommissionRule(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const commissionRuleData = typedReq.body;
      const userId = typedReq.user?.id;

      const commissionRule = await (prisma as any).commissionRule.create({
        data: {
          ...commissionRuleData,
          createdBy: userId
        }
      });

      logger.info('Commission rule created successfully', {
        ruleId: commissionRule.id,
        name: commissionRule.name,
        ruleType: commissionRule.ruleType,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: commissionRule
      });

    } catch (error) {
      logger.error('Failed to create commission rule', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create commission rule'
      });
    }
  }

  // Update commission rule
  async updateCommissionRule(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { ruleId } = typedReq.params;
      const updates = typedReq.body;
      const userId = typedReq.user?.id;

      const commissionRule = await (prisma as any).commissionRule.update({
        where: { id: ruleId },
        data: updates
      });

      logger.info('Commission rule updated successfully', {
        ruleId,
        updates: Object.keys(updates),
        updatedBy: userId
      });

      res.json({
        success: true,
        data: commissionRule
      });

    } catch (error) {
      logger.error('Failed to update commission rule', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update commission rule'
      });
    }
  }

  // Delete commission rule
  async deleteCommissionRule(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { ruleId } = typedReq.params;
      const userId = typedReq.user?.id;

      await (prisma as any).commissionRule.delete({
        where: { id: ruleId }
      });

      logger.info('Commission rule deleted successfully', {
        ruleId,
        deletedBy: userId
      });

      res.json({
        success: true,
        message: 'Commission rule deleted successfully'
      });

    } catch (error) {
      logger.error('Failed to delete commission rule', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete commission rule'
      });
    }
  }

  // Get booking report
  async getBookingReport(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const reportParams = typedReq.query;
      const userId = typedReq.user?.id;

      // Generate booking report based on parameters
      const report = await this.generateBookingReport(reportParams);

      logger.info('Booking report generated', {
        reportType: reportParams.reportType,
        dateRange: reportParams.dateRange,
        generatedBy: userId
      });

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Failed to generate booking report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate booking report'
      });
    }
  }

  // Get commission report
  async getCommissionReport(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const reportParams = typedReq.query;
      const userId = typedReq.user?.id;

      // Generate commission report based on parameters
      const report = await this.generateCommissionReport(reportParams);

      logger.info('Commission report generated', {
        reportType: reportParams.reportType,
        dateRange: reportParams.dateRange,
        generatedBy: userId
      });

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Failed to generate commission report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate commission report'
      });
    }
  }

  // Get inventory report
  async getInventoryReport(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const reportParams = typedReq.query;
      const userId = typedReq.user?.id;

      // Generate inventory report based on parameters
      const report = await this.generateInventoryReport(reportParams);

      logger.info('Inventory report generated', {
        reportType: reportParams.reportType,
        dateRange: reportParams.dateRange,
        generatedBy: userId
      });

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Failed to generate inventory report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate inventory report'
      });
    }
  }

  // Get audit log
  async getAuditLog(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const auditParams = typedReq.query;
      const page = parseInt(auditParams.page as string) || 1;
      const limit = parseInt(auditParams.limit as string) || 50;
      const offset = (page - 1) * limit;

      const whereConditions: any = {};

      if (auditParams.userId) {
        whereConditions.userId = auditParams.userId;
      }

      if (auditParams.actionType && String(auditParams.actionType).length > 0) {
        whereConditions.actionType = { in: auditParams.actionType };
      }

      if (auditParams.resourceType && String(auditParams.resourceType).length > 0) {
        whereConditions.resourceType = { in: auditParams.resourceType };
      }

      if (auditParams.ipAddress) {
        whereConditions.ipAddress = auditParams.ipAddress;
      }

      const [auditLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: whereConditions,
          skip: offset,
          take: limit,
          orderBy: { timestamp: 'desc' }
        }),
        prisma.auditLog.count({ where: whereConditions })
      ]);

      res.json({
        success: true,
        data: {
          auditLogs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get audit log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get audit log'
      });
    }
  }

  // Get compliance report
  async getComplianceReport(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const userId = typedReq.user?.id;

      // Generate compliance report
      const report = await this.generateComplianceReport();

      logger.info('Compliance report generated', {
        generatedBy: userId
      });

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Failed to generate compliance report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance report'
      });
    }
  }

  // Helper methods
  private async calculatePricing(bookingData: CreateBookingRequest): Promise<any> {
    // Implementation for pricing calculation
    return {
      netAmount: bookingData.paymentInfo.amount * 0.9, // Example calculation
      sellingAmount: bookingData.paymentInfo.amount,
      profit: bookingData.paymentInfo.amount * 0.1
    };
  }

  private async generateBookingReference(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `BK-${timestamp}-${random}`;
  }

  private async assignAgent(): Promise<string | null> {
    // Logic to assign booking to an available agent
    return null; // Placeholder
  }

  private async generateBookingReport(params: any): Promise<any> {
    // Implementation for booking report generation
    return { report: 'booking_report_data' };
  }

  private async generateCommissionReport(params: any): Promise<any> {
    // Implementation for commission report generation
    return { report: 'commission_report_data' };
  }

  private async generateInventoryReport(params: any): Promise<any> {
    // Implementation for inventory report generation
    return { report: 'inventory_report_data' };
  }

  private async generateComplianceReport(): Promise<any> {
    // Implementation for compliance report generation
    return { report: 'compliance_report_data' };
  }

  /**
   * Get available payment options for customer (combined wallet + credits)
   */
  async getPaymentOptions(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { customerId } = typedReq.params;
      const { totalAmount, currency = 'USD' } = typedReq.query;

      if (!customerId || !totalAmount) {
        return res.status(400).json({
          success: false,
          error: 'customerId and totalAmount are required',
        });
      }

      const bookingPaymentService = (await import('../services/bookingPaymentService')).default;
      const paymentOptions = await bookingPaymentService.getAvailablePaymentOptions(
        customerId,
        parseFloat(totalAmount as string),
        (currency as string) || 'USD'
      );

      logger.info('Retrieved payment options', {
        customerId,
        totalAmount,
        walletBalance: paymentOptions.walletBalance,
        totalCreditsAvailable: paymentOptions.totalCreditAvailable,
      });

      return res.status(200).json({
        success: true,
        data: paymentOptions,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting payment options', { error: errorMsg });
      return res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Process combined payment (wallet + airline credits + card)
   */
  async processCombinedPayment(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const paymentRequest = typedReq.body;
      const userId = typedReq.user?.id;

      // Validate booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: paymentRequest.bookingId },
        select: { id: true, customerId: true, customerPrice: true, currency: true },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }

      // Verify customer authorization
      if (booking.customerId !== paymentRequest.customerId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: Customer ID does not match booking',
        });
      }

      const bookingPaymentService = (await import('../services/bookingPaymentService')).default;
      const paymentBreakdown = await bookingPaymentService.processCombinedPayment({
        bookingId: paymentRequest.bookingId,
        customerId: paymentRequest.customerId,
        totalAmount: parseFloat(booking.customerPrice.toString()),
        currency: booking.currency,
        useWallet: paymentRequest.useWallet ?? true,
        walletAmount: paymentRequest.walletAmount,
        useCredits: paymentRequest.useCredits ?? true,
        creditIds: paymentRequest.creditIds,
        cardAmount: paymentRequest.cardAmount,
      });

      logger.info('Combined payment processed successfully', {
        bookingId: paymentRequest.bookingId,
        customerId: paymentRequest.customerId,
        walletUsed: paymentBreakdown.walletUsed,
        creditsUsed: paymentBreakdown.creditsUsed,
        cardRequired: paymentBreakdown.cardRequired,
        creditsCount: paymentBreakdown.creditsApplied.length,
      });

      return res.status(200).json({
        success: true,
        data: paymentBreakdown,
        message: 'Combined payment processed successfully',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing combined payment', { error: errorMsg, body: typedReq.body });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Get booking payment details
   */
  async getBookingPaymentDetails(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId } = typedReq.params;

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: 'bookingId is required',
        });
      }

      const bookingPaymentService = (await import('../services/bookingPaymentService')).default;
      const paymentDetails = await bookingPaymentService.getBookingPaymentDetails(bookingId);

      return res.status(200).json({
        success: true,
        data: paymentDetails,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting booking payment details', { error: errorMsg });
      return res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Refund combined payment
   */
  async refundCombinedPayment(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId } = typedReq.params;

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: 'bookingId is required',
        });
      }

      const bookingPaymentService = (await import('../services/bookingPaymentService')).default;
      await bookingPaymentService.refundCombinedPayment(bookingId);

      logger.info('Combined payment refunded', { bookingId });

      return res.status(200).json({
        success: true,
        message: 'Combined payment refunded successfully',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error refunding combined payment', { error: errorMsg });
      return res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Create booking with combined payment
   */
  async createBookingWithCombinedPayment(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const bookingData = typedReq.body;
      const userId = typedReq.user?.id;

      // Create booking first
      const booking = await prisma.booking.create({
        data: {
          serviceType: bookingData.serviceType || 'flight',
          status: 'PENDING',
          reference: await this.generateBookingReference(),
          segment: 'default',
          customerId: bookingData.customerId,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          customerPrice: bookingData.totalAmount,
          supplierPrice: bookingData.supplierPrice || bookingData.totalAmount,
          currency: bookingData.currency || 'USD',
          paymentMethod: 'combined',
        },
      });

      // Process combined payment
      const bookingPaymentService = (await import('../services/bookingPaymentService')).default;
      const paymentBreakdown = await bookingPaymentService.processCombinedPayment({
        bookingId: booking.id,
        customerId: bookingData.customerId,
        totalAmount: bookingData.totalAmount,
        currency: bookingData.currency || 'USD',
        useWallet: bookingData.useWallet ?? true,
        walletAmount: bookingData.walletAmount,
        useCredits: bookingData.useCredits ?? true,
        creditIds: bookingData.creditIds,
        cardAmount: bookingData.cardAmount,
      });

      logger.info('Booking created with combined payment', {
        bookingId: booking.id,
        customerId: bookingData.customerId,
        paymentBreakdown,
      });

      return res.status(201).json({
        success: true,
        data: {
          booking: {
            id: booking.id,
            reference: booking.reference,
            status: booking.status,
          },
          payment: paymentBreakdown,
        },
        message: 'Booking created with combined payment',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating booking with combined payment', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Apply airline credits to existing booking
   */
  async applyCreditsToBooking(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { bookingId } = typedReq.params;
      const { creditIds } = typedReq.body;

      if (!bookingId || !creditIds || creditIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'bookingId and creditIds array are required',
        });
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, customerId: true, customerPrice: true },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }

      const bookingPaymentService = (await import('../services/bookingPaymentService')).default;
      const paymentBreakdown = await bookingPaymentService.processCombinedPayment({
        bookingId,
        customerId: booking.customerId,
        totalAmount: parseFloat(booking.customerPrice.toString()),
        currency: 'USD',
        useWallet: false,
        useCredits: true,
        creditIds,
      });

      logger.info('Credits applied to booking', {
        bookingId,
        creditsCount: creditIds.length,
        creditsUsed: paymentBreakdown.creditsUsed,
      });

      return res.status(200).json({
        success: true,
        data: paymentBreakdown,
        message: 'Credits applied to booking successfully',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error applying credits to booking', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Check if a Duffel order is changeable
   * Returns available changeable slices
   */
  async checkOrderChangeEligibility(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { orderId } = typedReq.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'orderId is required',
        });
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');
      const { changeable, changeableSlices } = await duffelClient.isOrderChangeable(orderId);

      logger.info('Order change eligibility checked', {
        orderId,
        changeable,
        changeableSlicesCount: changeableSlices.length,
      });

      return res.status(200).json({
        success: true,
        data: {
          changeable,
          changeableSlices: changeableSlices.map((slice: any) => ({
            id: slice.id,
            origin: slice.segments?.[0]?.origin?.iata_code,
            destination: slice.segments?.[slice.segments.length - 1]?.destination?.iata_code,
            departureDate: slice.segments?.[0]?.departing_at?.split('T')?.[0],
            passengers: slice.passengers?.length || 0,
          })),
        },
        message: changeable ? 'Order is changeable' : 'Order is not changeable',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error checking order change eligibility', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Check if baggage can be added to an order
   * Returns available baggage services for the order
   */
  async checkBaggageEligibility(req: Request, res: Response): Promise<Response | void> {
    try {
      const { orderId } = req.params as { orderId: string };
      const typedReq = req as any;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');
      const eligible = await duffelClient.isOrderEligibleForBaggage(orderId);
      const availableBaggages = await duffelClient.getAvailableBaggages(orderId);

      logger.info('Baggage eligibility checked', {
        orderId,
        eligible,
        availableBaggagesCount: availableBaggages.length,
      });

      return res.status(200).json({
        success: true,
        data: {
          eligible,
          availableBaggages: availableBaggages.map((baggage: any) => ({
            id: baggage.id,
            type: baggage.type,
            quantity: baggage.quantity,
            maximumQuantity: baggage.maximum_quantity,
            totalAmount: baggage.total_amount,
            totalCurrency: baggage.total_currency,
            metadata: baggage.metadata,
            segmentIds: baggage.segment_ids,
            passengerIds: baggage.passenger_ids,
          })),
        },
        message: eligible ? 'Baggage services available for this order' : 'No baggage services available',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error checking baggage eligibility', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Get available baggage services for an order
   */
  async getAvailableBaggages(req: Request, res: Response): Promise<Response | void> {
    try {
      const { orderId } = req.params as { orderId: string };
      const typedReq = req as any;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');
      const availableBaggages = await duffelClient.getAvailableBaggages(orderId);

      logger.info('Available baggages retrieved', {
        orderId,
        count: availableBaggages.length,
      });

      return res.status(200).json({
        success: true,
        data: {
          orderId,
          baggagesCount: availableBaggages.length,
          baggages: availableBaggages.map((baggage: any) => ({
            id: baggage.id,
            type: baggage.type,
            quantity: baggage.quantity,
            maximumQuantity: baggage.maximum_quantity,
            totalAmount: baggage.total_amount,
            totalCurrency: baggage.total_currency,
            metadata: baggage.metadata,
            segmentIds: baggage.segment_ids,
            passengerIds: baggage.passenger_ids,
          })),
        },
        message: `${availableBaggages.length} baggage service(s) available`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching available baggages', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Book baggage services for an order
   */
  async bookBaggageServices(req: Request, res: Response): Promise<Response | void> {
    try {
      const { orderId } = req.params as { orderId: string };
      const { baggages, payment } = req.body as {
        baggages: Array<{ id: string; quantity: number }>;
        payment?: { type: string; currency: string; amount: string };
      };
      const typedReq = req as any;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
      }

      if (!baggages || baggages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one baggage service is required',
        });
      }

      // Validate baggage items
      for (const baggage of baggages) {
        if (!baggage.id) {
          return res.status(400).json({
            success: false,
            error: 'Each baggage must have an id',
          });
        }

        if (!baggage.quantity || baggage.quantity < 1) {
          return res.status(400).json({
            success: false,
            error: 'Each baggage must have a quantity of at least 1',
          });
        }
      }

      if (!payment) {
        return res.status(400).json({
          success: false,
          error: 'Payment information is required',
        });
      }

      if (!payment.type || !payment.currency || !payment.amount) {
        return res.status(400).json({
          success: false,
          error: 'Payment must include type, currency, and amount',
        });
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');

      logger.info('Booking baggage services', {
        orderId,
        baggagesCount: baggages.length,
        paymentAmount: payment.amount,
        paymentCurrency: payment.currency,
      });

      const result = await duffelClient.addServicesToOrder(orderId, baggages, payment);

      logger.info('Baggage services booked successfully', {
        orderId,
        baggagesBooked: baggages.length,
      });

      // Extract services from the updated order
      const bookedServices = result?.services || [];
      const bookedBaggages = bookedServices.filter((service: any) => service.type === 'baggage');

      return res.status(201).json({
        success: true,
        data: {
          orderId,
          baggagesBooked: baggages.length,
          bookedServices: bookedBaggages.map((baggage: any) => ({
            id: baggage.id,
            type: baggage.type,
            quantity: baggage.quantity,
            totalAmount: baggage.total_amount,
            totalCurrency: baggage.total_currency,
            metadata: baggage.metadata,
          })),
          totalAmount: payment.amount,
          totalCurrency: payment.currency,
        },
        message: `${baggages.length} baggage service(s) booked successfully`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error booking baggage services', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Get booked baggage services for an order
   */
  async getOrderBaggages(req: Request, res: Response): Promise<Response | void> {
    try {
      const { orderId } = req.params as { orderId: string };
      const typedReq = req as any;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');
      const bookedBaggages = await duffelClient.getOrderBaggages(orderId);

      logger.info('Booked baggages retrieved', {
        orderId,
        count: bookedBaggages.length,
      });

      return res.status(200).json({
        success: true,
        data: {
          orderId,
          baggagesCount: bookedBaggages.length,
          baggages: bookedBaggages.map((baggage: any) => ({
            id: baggage.id,
            type: baggage.type,
            quantity: baggage.quantity,
            totalAmount: baggage.total_amount,
            totalCurrency: baggage.total_currency,
            metadata: baggage.metadata,
            segmentIds: baggage.segment_ids,
            passengerIds: baggage.passenger_ids,
          })),
        },
        message: `${bookedBaggages.length} baggage service(s) booked on this order`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching booked baggages', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Step 1: Create an order change request
   * Initiates the order change process
   */
  async createOrderChangeRequest(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { orderId } = typedReq.params;
      const { slices } = typedReq.body;

      if (!orderId || !slices || !slices.remove || !slices.add) {
        return res.status(400).json({
          success: false,
          error: 'orderId, slices.remove array, and slices.add array are required',
        });
      }

      // Validate remove slices
      if (!Array.isArray(slices.remove) || slices.remove.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one slice must be specified in remove array',
        });
      }

      // Validate add slices
      if (!Array.isArray(slices.add) || slices.add.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one slice must be specified in add array',
        });
      }

      // Validate add slice structure
      for (const addSlice of slices.add) {
        if (!addSlice.origin || !addSlice.destination || !addSlice.departure_date || !addSlice.cabin_class) {
          return res.status(400).json({
            success: false,
            error: 'Each slice in add array must have origin, destination, departure_date, and cabin_class',
          });
        }
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');
      const changeRequest = await duffelClient.createOrderChangeRequest(orderId, slices);

      logger.info('Order change request created', {
        orderId,
        changeRequestId: changeRequest.id,
        removeSlicesCount: slices.remove.length,
        addSlicesCount: slices.add.length,
      });

      return res.status(201).json({
        success: true,
        data: {
          id: changeRequest.id,
          orderId: changeRequest.order_id,
          slices: changeRequest.slices,
          createdAt: changeRequest.created_at,
        },
        message: 'Order change request created successfully',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating order change request', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Step 2: Get order change request with available offers
   * Reviews available change offers and pricing
   */
  async getOrderChangeOffers(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { orderChangeRequestId } = typedReq.params;

      if (!orderChangeRequestId) {
        return res.status(400).json({
          success: false,
          error: 'orderChangeRequestId is required',
        });
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');
      const changeRequest = await duffelClient.getOrderChangeRequest(orderChangeRequestId);

      if (!changeRequest) {
        return res.status(404).json({
          success: false,
          error: 'Order change request not found',
        });
      }

      const offers = changeRequest.order_change_offers || [];

      logger.info('Order change offers retrieved', {
        changeRequestId: orderChangeRequestId,
        offersCount: offers.length,
      });

      return res.status(200).json({
        success: true,
        data: {
          changeRequestId: changeRequest.id,
          offersCount: offers.length,
          offers: offers.map((offer: any) => ({
            id: offer.id,
            slices: offer.slices,
            changeTotalAmount: offer.change_total_amount,
            changeTotalCurrency: offer.change_total_currency,
            penaltyTotalAmount: offer.penalty_total_amount,
            penaltyTotalCurrency: offer.penalty_total_currency,
            createdAt: offer.created_at,
          })),
        },
        message: `${offers.length} change offer(s) available`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error retrieving order change offers', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Step 3: Create a pending order change
   * Selects a change offer to proceed
   */
  async createPendingOrderChange(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { orderChangeOfferId } = typedReq.body;

      if (!orderChangeOfferId) {
        return res.status(400).json({
          success: false,
          error: 'orderChangeOfferId is required',
        });
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');
      const pendingChange = await duffelClient.createPendingOrderChange(orderChangeOfferId);

      logger.info('Pending order change created', {
        changeId: pendingChange.id,
        offerId: orderChangeOfferId,
        confirmedAt: pendingChange.confirmed_at,
      });

      return res.status(201).json({
        success: true,
        data: {
          id: pendingChange.id,
          orderId: pendingChange.order_id,
          slices: pendingChange.slices,
          changeTotalAmount: pendingChange.change_total_amount,
          changeTotalCurrency: pendingChange.change_total_currency,
          confirmedAt: pendingChange.confirmed_at,
          createdAt: pendingChange.created_at,
        },
        message: 'Pending order change created successfully. Review pricing before confirming.',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating pending order change', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Get current status of a pending order change
   * Useful for reviewing final price before confirmation
   */
  async getPendingOrderChangeStatus(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { orderChangeId } = typedReq.params;

      if (!orderChangeId) {
        return res.status(400).json({
          success: false,
          error: 'orderChangeId is required',
        });
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');
      const orderChange = await duffelClient.getPendingOrderChange(orderChangeId);

      if (!orderChange) {
        return res.status(404).json({
          success: false,
          error: 'Order change not found',
        });
      }

      logger.info('Pending order change status retrieved', {
        changeId: orderChangeId,
        confirmedAt: orderChange.confirmed_at,
      });

      return res.status(200).json({
        success: true,
        data: {
          id: orderChange.id,
          orderId: orderChange.order_id,
          slices: orderChange.slices,
          changeTotalAmount: orderChange.change_total_amount,
          changeTotalCurrency: orderChange.change_total_currency,
          penaltyTotalAmount: orderChange.penalty_total_amount,
          penaltyTotalCurrency: orderChange.penalty_total_currency,
          confirmed: !!orderChange.confirmed_at,
          confirmedAt: orderChange.confirmed_at,
          createdAt: orderChange.created_at,
        },
        message: orderChange.confirmed_at ? 'Order change confirmed' : 'Order change is pending',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error retrieving pending order change status', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Step 4: Confirm the order change
   * Finalizes the order change with payment
   */
  async confirmOrderChange(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { orderChangeId } = typedReq.params;
      const { payment } = typedReq.body;

      if (!orderChangeId) {
        return res.status(400).json({
          success: false,
          error: 'orderChangeId is required',
        });
      }

      // Payment is optional - if order change is a credit, no payment needed
      if (payment) {
        if (!payment.type || !payment.currency || !payment.amount) {
          return res.status(400).json({
            success: false,
            error: 'Payment must include type, currency, and amount',
          });
        }
      }

      const { duffelClient } = await import('../integrations/duffelApiClient');
      const confirmedChange = await duffelClient.confirmOrderChange(orderChangeId, payment);

      logger.info('Order change confirmed', {
        changeId: orderChangeId,
        orderId: confirmedChange.order_id,
        confirmedAt: confirmedChange.confirmed_at,
        paymentApplied: !!payment,
      });

      return res.status(200).json({
        success: true,
        data: {
          id: confirmedChange.id,
          orderId: confirmedChange.order_id,
          slices: confirmedChange.slices,
          changeTotalAmount: confirmedChange.change_total_amount,
          changeTotalCurrency: confirmedChange.change_total_currency,
          confirmed: true,
          confirmedAt: confirmedChange.confirmed_at,
          createdAt: confirmedChange.created_at,
        },
        message: 'Order change confirmed successfully',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error confirming order change', { error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }
}

export const bookingManagementController = new BookingManagementController();

// Bind methods to maintain 'this' context for Express routes
export const boundBookingManagementController = {
  createBooking: bookingManagementController.createBooking.bind(bookingManagementController),
  searchBookings: bookingManagementController.searchBookings.bind(bookingManagementController),
  searchCustomers: bookingManagementController.searchCustomers.bind(bookingManagementController),
  createCustomer: bookingManagementController.createCustomer.bind(bookingManagementController),
  searchSuppliers: bookingManagementController.searchSuppliers.bind(bookingManagementController),
  createSupplier: bookingManagementController.createSupplier.bind(bookingManagementController),
  getBookingDetails: bookingManagementController.getBookingDetails.bind(bookingManagementController),
  updateBooking: bookingManagementController.updateBooking.bind(bookingManagementController),
  cancelBooking: bookingManagementController.cancelBooking.bind(bookingManagementController),
  confirmBooking: bookingManagementController.confirmBooking.bind(bookingManagementController),
  assignBooking: bookingManagementController.assignBooking.bind(bookingManagementController),
  holdInventory: bookingManagementController.holdInventory.bind(bookingManagementController),
  releaseInventory: bookingManagementController.releaseInventory.bind(bookingManagementController),
  deleteInventory: bookingManagementController.deleteInventory.bind(bookingManagementController),
  issueTicket: bookingManagementController.issueTicket.bind(bookingManagementController),
  updateWorkflowStatus: bookingManagementController.updateWorkflowStatus.bind(bookingManagementController),
  updatePriority: bookingManagementController.updatePriority.bind(bookingManagementController),
  getInventory: bookingManagementController.getInventory.bind(bookingManagementController),
  updateInventory: bookingManagementController.updateInventory.bind(bookingManagementController),
  searchInventory: bookingManagementController.searchInventory.bind(bookingManagementController),
  createInventory: bookingManagementController.createInventory.bind(bookingManagementController),
  checkAvailability: bookingManagementController.checkAvailability.bind(bookingManagementController),
  getPricingRules: bookingManagementController.getPricingRules.bind(bookingManagementController),
  createPricingRule: bookingManagementController.createPricingRule.bind(bookingManagementController),
  updatePricingRule: bookingManagementController.updatePricingRule.bind(bookingManagementController),
  deletePricingRule: bookingManagementController.deletePricingRule.bind(bookingManagementController),
  getCommissionRules: bookingManagementController.getCommissionRules.bind(bookingManagementController),
  createCommissionRule: bookingManagementController.createCommissionRule.bind(bookingManagementController),
  updateCommissionRule: bookingManagementController.updateCommissionRule.bind(bookingManagementController),
  deleteCommissionRule: bookingManagementController.deleteCommissionRule.bind(bookingManagementController),
  getBookingReport: bookingManagementController.getBookingReport.bind(bookingManagementController),
  getCommissionReport: bookingManagementController.getCommissionReport.bind(bookingManagementController),
  getInventoryReport: bookingManagementController.getInventoryReport.bind(bookingManagementController),
  getAuditLog: bookingManagementController.getAuditLog.bind(bookingManagementController),
  getBookingHistory: bookingManagementController.getBookingHistory.bind(bookingManagementController),
  generateReport: bookingManagementController.generateReport.bind(bookingManagementController),
  getDashboardStats: bookingManagementController.getDashboardStats.bind(bookingManagementController),
  bulkUpdateBookings: bookingManagementController.bulkUpdateBookings.bind(bookingManagementController),
  getComplianceReport: bookingManagementController.getComplianceReport.bind(bookingManagementController),
  cancelOrder: bookingManagementController.cancelOrder.bind(bookingManagementController),
  getCancellationStatus: bookingManagementController.getCancellationStatus.bind(bookingManagementController),
  getAvailableAirlineCredits: bookingManagementController.getAvailableAirlineCredits.bind(bookingManagementController),
  getPaymentOptions: bookingManagementController.getPaymentOptions.bind(bookingManagementController),
  processCombinedPayment: bookingManagementController.processCombinedPayment.bind(bookingManagementController),
  getBookingPaymentDetails: bookingManagementController.getBookingPaymentDetails.bind(bookingManagementController),
  refundCombinedPayment: bookingManagementController.refundCombinedPayment.bind(bookingManagementController),
  createBookingWithCombinedPayment: bookingManagementController.createBookingWithCombinedPayment.bind(bookingManagementController),
  applyCreditsToBooking: bookingManagementController.applyCreditsToBooking.bind(bookingManagementController),
  checkOrderChangeEligibility: bookingManagementController.checkOrderChangeEligibility.bind(bookingManagementController),
  createOrderChangeRequest: bookingManagementController.createOrderChangeRequest.bind(bookingManagementController),
  getOrderChangeOffers: bookingManagementController.getOrderChangeOffers.bind(bookingManagementController),
  createPendingOrderChange: bookingManagementController.createPendingOrderChange.bind(bookingManagementController),
  getPendingOrderChangeStatus: bookingManagementController.getPendingOrderChangeStatus.bind(bookingManagementController),
  confirmOrderChange: bookingManagementController.confirmOrderChange.bind(bookingManagementController),
  checkBaggageEligibility: bookingManagementController.checkBaggageEligibility.bind(bookingManagementController),
  getAvailableBaggages: bookingManagementController.getAvailableBaggages.bind(bookingManagementController),
  bookBaggageServices: bookingManagementController.bookBaggageServices.bind(bookingManagementController),
  getOrderBaggages: bookingManagementController.getOrderBaggages.bind(bookingManagementController)
};