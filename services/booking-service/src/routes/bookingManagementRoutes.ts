import express, { Router } from 'express';
import authenticateToken from '../middleware/authenticateToken';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { bookingManagementSchemas } from '../validation/bookingManagementSchemas';
import { boundBookingManagementController as bookingManagementController } from '../controllers/bookingManagementController';
import { adminBookingCardController } from '../controllers/adminBookingCardController';
import { permissionMiddleware } from '../middleware/permissionMiddleware';

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

// ============================================================================
// Order Cancellation Routes (Duffel Integration)
// ============================================================================

// POST /api/admin/orders/cancel - Cancel a flight order
router.post(
  '/admin/orders/cancel',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('cancel_booking'),
  bookingManagementController.cancelOrder
);

// GET /api/admin/orders/cancellation-status - Get cancellation status
router.get(
  '/admin/orders/cancellation-status',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_bookings'),
  bookingManagementController.getCancellationStatus
);

// ============================================================================
// Airline Credits Routes
// ============================================================================

// GET /api/admin/customers/:customerId/airline-credits - Get available airline credits for a customer
router.get(
  '/admin/customers/:customerId/airline-credits',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_bookings'),
  bookingManagementController.getAvailableAirlineCredits
);

// GET /api/admin/bookings/:bookingId/airline-credits - Get airline credits for a booking
router.get(
  '/admin/bookings/:bookingId/airline-credits',
  authenticateToken,
  authorize(['admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_bookings'),
  bookingManagementController.getAvailableAirlineCredits
);

// ============================================================================
// Order Change Routes (Duffel Integration)
// ============================================================================

// GET /api/bookings/orders/:orderId/change-eligibility - Check if order is eligible for change
router.get(
  '/bookings/orders/:orderId/change-eligibility',
  authenticateToken,
  permissionMiddleware('view_bookings'),
  bookingManagementController.checkOrderChangeEligibility
);

// POST /api/bookings/orders/:orderId/change-request - Create order change request
router.post(
  '/bookings/orders/:orderId/change-request',
  authenticateToken,
  permissionMiddleware('modify_booking'),
  bookingManagementController.createOrderChangeRequest
);

// GET /api/bookings/order-changes/:orderChangeRequestId/offers - Get change offers
router.get(
  '/bookings/order-changes/:orderChangeRequestId/offers',
  authenticateToken,
  permissionMiddleware('view_bookings'),
  bookingManagementController.getOrderChangeOffers
);

// POST /api/bookings/order-changes/pending - Create pending order change
router.post(
  '/bookings/order-changes/pending',
  authenticateToken,
  permissionMiddleware('modify_booking'),
  bookingManagementController.createPendingOrderChange
);

// GET /api/bookings/order-changes/:orderChangeId/status - Get pending order change status
router.get(
  '/bookings/order-changes/:orderChangeId/status',
  authenticateToken,
  permissionMiddleware('view_bookings'),
  bookingManagementController.getPendingOrderChangeStatus
);

// POST /api/bookings/order-changes/:orderChangeId/confirm - Confirm order change
router.post(
  '/bookings/order-changes/:orderChangeId/confirm',
  authenticateToken,
  permissionMiddleware('modify_booking'),
  bookingManagementController.confirmOrderChange
);

// ============================================================================
// Post-Booking Baggage Routes (Duffel Integration)
// ============================================================================

// GET /api/bookings/orders/:orderId/baggage-eligibility - Check if baggage can be added
router.get(
  '/bookings/orders/:orderId/baggage-eligibility',
  authenticateToken,
  permissionMiddleware('view_bookings'),
  bookingManagementController.checkBaggageEligibility
);

// GET /api/bookings/orders/:orderId/available-baggage - Get available baggage services
router.get(
  '/bookings/orders/:orderId/available-baggage',
  authenticateToken,
  permissionMiddleware('view_bookings'),
  bookingManagementController.getAvailableBaggages
);

// POST /api/bookings/orders/:orderId/book-baggage - Book baggage services
router.post(
  '/bookings/orders/:orderId/book-baggage',
  authenticateToken,
  permissionMiddleware('modify_booking'),
  bookingManagementController.bookBaggageServices
);

// GET /api/bookings/orders/:orderId/baggage-services - Get booked baggage services
router.get(
  '/bookings/orders/:orderId/baggage-services',
  authenticateToken,
  permissionMiddleware('view_bookings'),
  bookingManagementController.getOrderBaggages
);

export default router;
