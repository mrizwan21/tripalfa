import express, { Router } from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import authorize from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { bookingManagementSchemas } from '../validation/bookingManagementSchemas.js';
import { boundBookingManagementController as bookingManagementController } from '../controllers/bookingManagementController.js';
import { adminBookingCardController } from '../controllers/adminBookingCardController.js';
import { permissionMiddleware } from '../middleware/permissionMiddleware.js';

const router: Router = Router();

// POST /api/admin/book - Create a new booking
router.post(
  '/admin/book',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('create_booking'),
  validate(bookingManagementSchemas.createBooking),
  bookingManagementController.createBooking
);

// GET /api/admin/search - Search bookings with filters
router.get(
  '/admin/search',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('search_bookings'),
  validate(bookingManagementSchemas.searchBookings),
  bookingManagementController.searchBookings
);

// POST /api/admin/hold - Hold inventory for a booking
router.post(
  '/admin/hold',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('hold_inventory'),
  validate(bookingManagementSchemas.holdInventory),
  bookingManagementController.holdInventory
);

// POST /api/admin/confirm/:bookingId - Confirm a booking
router.post(
  '/admin/confirm/:bookingId',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('confirm_booking'),
  validate(bookingManagementSchemas.confirmBooking),
  bookingManagementController.confirmBooking
);

// POST /api/admin/issue-ticket/:bookingId - Issue ticket for a booking
router.post(
  '/admin/issue-ticket/:bookingId',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('issue_ticket'),
  validate(bookingManagementSchemas.issueTicket),
  bookingManagementController.issueTicket
);

// PUT /api/admin/workflow/:bookingId/status - Update booking workflow status
router.put(
  '/admin/workflow/:bookingId/status',
  authenticateToken,
  authorize(['admin', 'supervisor', 'manager']),
  permissionMiddleware('manage_workflow'),
  validate(bookingManagementSchemas.updateWorkflowStatus),
  bookingManagementController.updateWorkflowStatus
);

// PUT /api/admin/workflow/:bookingId/assign - Assign booking to agent
router.put(
  '/admin/workflow/:bookingId/assign',
  authenticateToken,
  authorize(['admin', 'supervisor', 'manager']),
  permissionMiddleware('assign_booking'),
  validate(bookingManagementSchemas.assignBooking),
  bookingManagementController.assignBooking
);

// PUT /api/admin/workflow/:bookingId/priority - Update booking priority
router.put(
  '/admin/workflow/:bookingId/priority',
  authenticateToken,
  authorize(['admin', 'supervisor', 'manager']),
  permissionMiddleware('update_priority'),
  validate(bookingManagementSchemas.updatePriority),
  bookingManagementController.updatePriority
);

// GET /api/admin/customers - Search customers
router.get(
  '/admin/customers',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_customers'),
  validate(bookingManagementSchemas.searchCustomers),
  bookingManagementController.searchCustomers
);

// POST /api/admin/customers - Create customer
router.post(
  '/admin/customers',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('create_customer'),
  validate(bookingManagementSchemas.createCustomer),
  bookingManagementController.createCustomer
);

// ============================================================================
// Inventory Management Routes
// ============================================================================

// GET /api/admin/inventory - Search inventory with filters and pagination
router.get(
  '/admin/inventory',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_inventory'),
  validate(bookingManagementSchemas.searchInventory),
  bookingManagementController.searchInventory
);

// GET /api/admin/inventory/:inventoryId - Get single inventory item
router.get(
  '/admin/inventory/:inventoryId',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_inventory'),
  validate(bookingManagementSchemas.getInventory),
  bookingManagementController.getInventory
);

// POST /api/admin/inventory - Add new inventory
router.post(
  '/admin/inventory',
  authenticateToken,
  authorize(['admin', 'manager']),
  permissionMiddleware('manage_inventory'),
  validate(bookingManagementSchemas.createInventory),
  bookingManagementController.createInventory
);

// PUT /api/admin/inventory/:inventoryId - Update inventory
router.put(
  '/admin/inventory/:inventoryId',
  authenticateToken,
  authorize(['admin', 'manager']),
  permissionMiddleware('manage_inventory'),
  validate(bookingManagementSchemas.updateInventorySchema),
  bookingManagementController.updateInventory
);

// DELETE /api/admin/inventory/:inventoryId - Delete inventory
router.delete(
  '/admin/inventory/:inventoryId',
  authenticateToken,
  authorize(['admin', 'manager']),
  permissionMiddleware('manage_inventory'),
  validate(bookingManagementSchemas.deleteInventory),
  bookingManagementController.deleteInventory
);

// POST /api/admin/inventory/:inventoryId/check-availability - Check availability
router.post(
  '/admin/inventory/:inventoryId/check-availability',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_inventory'),
  validate(bookingManagementSchemas.checkAvailability),
  bookingManagementController.checkAvailability
);

// GET /api/admin/suppliers - Search suppliers
router.get(
  '/admin/suppliers',
  authenticateToken,
  authorize(['admin', 'supervisor', 'manager']),
  permissionMiddleware('view_suppliers'),
  validate(bookingManagementSchemas.searchSuppliers),
  bookingManagementController.searchSuppliers
);

// POST /api/admin/suppliers - Create supplier
router.post(
  '/admin/suppliers',
  authenticateToken,
  authorize(['admin', 'supervisor', 'manager']),
  permissionMiddleware('create_supplier'),
  validate(bookingManagementSchemas.createSupplier),
  bookingManagementController.createSupplier
);

export default router;
