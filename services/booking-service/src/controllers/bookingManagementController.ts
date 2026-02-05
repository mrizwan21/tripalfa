import { Request, Response } from 'express';
import { prisma } from '../database/index.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { cacheService, cacheKeys } from '../cache/redis.js';
import { metricsStore } from '../monitoring/metrics.js';
import logger from '../utils/logger.js';
import { BookingStatus, ServiceType, Priority } from '../types/booking.js';
import { CreateBookingRequest, SearchBookingsRequest, HoldInventoryRequest } from '../types/bookingManagement.js';
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
      const searchParams = typedReq.body;
      const page = searchParams.page || 1;
      const limit = searchParams.limit || 10;
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

      if (searchParams.status && Array.isArray(searchParams.status)) {
        whereConditions.status = {
          in: searchParams.status
        };
      }

      if (searchParams.minPrice !== undefined) {
        whereConditions.price = {
          gte: searchParams.minPrice
        };
      }

      if (searchParams.maxPrice !== undefined) {
        if (whereConditions.price) {
          whereConditions.price.lte = searchParams.maxPrice;
        } else {
          whereConditions.price = { lte: searchParams.maxPrice };
        }
      }

      if (searchParams.minAvailable !== undefined) {
        whereConditions.available = {
          gte: searchParams.minAvailable
        };
      }

      if (searchParams.serviceTypes && Array.isArray(searchParams.serviceTypes) && searchParams.serviceTypes.length > 0) {
        whereConditions.serviceTypes = {
          hasSome: searchParams.serviceTypes
        };
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
      const { id } = typedReq.params;

      // Try cache first
      const cached = await cacheService.get(cacheKeys.inventory(id));
      if (cached) {
        return res.status(200).json({
          success: true,
          data: cached
        });
      }

      const inventory = await (prisma as any).inventory.findUnique({
        where: { id },
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
      await cacheService.set(cacheKeys.inventory(id), inventory, 600);

      logger.info('Inventory retrieved', {
        inventoryId: id,
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
      const { id } = typedReq.params;
      const updates = typedReq.body;
      const userId = typedReq.user?.id;

      // Verify inventory exists
      const existing = await (prisma as any).inventory.findUnique({
        where: { id }
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
        where: { id },
        data: updateData,
        include: {
          supplier: true
        }
      });

      // Invalidate cache
      await cacheService.del(cacheKeys.inventory(id));

      logger.info('Inventory updated', {
        inventoryId: id,
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
      const { id } = typedReq.params;
      const userId = typedReq.user?.id;

      // Verify inventory exists
      const existing = await (prisma as any).inventory.findUnique({
        where: { id }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Inventory not found'
        });
      }

      await (prisma as any).inventory.delete({
        where: { id }
      });

      // Invalidate cache
      await cacheService.del(cacheKeys.inventory(id));

      logger.info('Inventory deleted', {
        inventoryId: id,
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
      const { id } = typedReq.params;
      const { quantity } = typedReq.body;

      const inventory = await (prisma as any).inventory.findUnique({
        where: { id },
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
        inventoryId: id,
        requestedQuantity: quantity,
        availableQuantity: inventory.available,
        isAvailable,
        canReserve,
        userId: typedReq.user?.id
      });

      res.status(200).json({
        success: true,
        data: {
          inventoryId: id,
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

  // Get inventory
  async getInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const page = parseInt(typedReq.query.page as string) || 1;
      const limit = parseInt(typedReq.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const [inventory, total] = await Promise.all([
        (prisma as any).inventory.findMany({
          skip: offset,
          take: limit,
          orderBy: { bookedAt: 'desc' },
          include: {
            supplier: true
          }
        }),
        (prisma as any).inventory.count()
      ]);

      res.json({
        success: true,
        data: {
          inventory,
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
      logger.error('Failed to get inventory', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get inventory'
      });
    }
  }

  // Add inventory
  async addInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const inventoryData = typedReq.body;
      const userId = typedReq.user?.id;

      const inventory = await (prisma as any).inventory.create({
        data: {
          ...inventoryData,
          createdBy: userId
        }
      });

      logger.info('Inventory added successfully', {
        inventoryId: inventory.id,
        serviceType: inventory.serviceType,
        supplierId: inventory.supplierId,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: inventory
      });

    } catch (error) {
      logger.error('Failed to add inventory', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to add inventory'
      });
    }
  }

  // Update inventory
  async updateInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { inventoryId } = typedReq.params;
      const updates = typedReq.body;
      const userId = typedReq.user?.id;

      const inventory = await (prisma as any).inventory.update({
        where: { id: inventoryId },
        data: updates
      });

      logger.info('Inventory updated successfully', {
        inventoryId,
        updates: Object.keys(updates),
        updatedBy: userId
      });

      res.json({
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

  // Delete inventory
  async deleteInventory(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { inventoryId } = typedReq.params;
      const userId = typedReq.user?.id;

      await (prisma as any).inventory.delete({
        where: { id: inventoryId }
      });

      logger.info('Inventory deleted successfully', {
        inventoryId,
        deletedBy: userId
      });

      res.json({
        success: true,
        message: 'Inventory deleted successfully'
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
  addInventory: bookingManagementController.addInventory.bind(bookingManagementController),
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
  getComplianceReport: bookingManagementController.getComplianceReport.bind(bookingManagementController)
};