import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';
import { BookingDetailPage } from '../pages/BookingDetailPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');

test.describe('Booking Management - Day 5-6 Enhanced Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable test mode for mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_BOOKINGS = true;
    });
  });

  test('BM-001: View and filter bookings by service type', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    // Navigate to bookings page
    await bookingMgmt.goto('/bookings');
    
    // Verify bookings list is visible
    await expect(page.getByTestId('booking-row-0')).toBeVisible();
    
    // Filter by flights
    await bookingMgmt.filterByService('flights');
    await expect(page.getByTestId('service-filter')).toHaveValue('flights');
    
    // Filter by hotels
    await bookingMgmt.filterByService('hotels');
    await expect(page.getByTestId('service-filter')).toHaveValue('hotels');
    
    // Clear filter
    await bookingMgmt.filterByService('all');
  });

  test('BM-002: Search bookings by reference number', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);

    await bookingMgmt.goto('/bookings');
    
    // Search by reference prefix
    await bookingMgmt.searchByReference('BK-');
    await expect(page.getByTestId('search-results')).toBeVisible();
    
    // Search by specific reference
    await bookingMgmt.searchByReference('BK-2026-001');
    await expect(page.getByTestId('booking-row-0')).toContainText('BK-2026-001');
  });

  test('BM-003: Sort bookings by date and status', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);

    await bookingMgmt.goto('/bookings');
    
    // Sort by date
    await bookingMgmt.sortByDate();
    await expect(page.getByTestId('sort-date')).toHaveAttribute('data-sort', 'desc');
    
    // Sort by status
    await bookingMgmt.sortByStatus();
    await expect(page.getByTestId('sort-status')).toBeVisible();
  });

  test('BM-004: View booking details with passenger information', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto('/bookings');
    
    // Select first booking
    await bookingMgmt.selectBooking(0);
    
    // Verify booking details page
    await bookingDetail.verifyDetails();
    
    // Verify passenger information is displayed
    await expect(page.getByTestId('passenger-list')).toBeVisible();
    await expect(page.getByTestId('booking-reference')).toBeVisible();
  });

  test('BM-005: Modify booking dates and passenger details', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto('/bookings');
    await bookingMgmt.selectBooking(0);
    
    // Click modify button
    await bookingDetail.clickModifyBooking();
    
    // Modify dates
    await bookingDetail.modifyDates('2026-03-15', '2026-03-20');
    
    // Add passenger
    await bookingDetail.addPassenger({
      firstName: 'Jane',
      lastName: 'Doe',
      passport: 'P12345678'
    });
    
    // Save changes
    await bookingDetail.saveModifications();
    
    // Verify success message
    await expect(page.getByTestId('modification-success')).toBeVisible();
  });

  test('BM-006: Cancel booking with refund processing', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto('/bookings');
    await bookingMgmt.selectBooking(0);
    
    // Get booking reference before cancellation
    const bookingRef = await page.getByTestId('booking-reference').textContent();
    
    // Initiate cancellation
    await bookingDetail.clickCancelBooking();
    
    // Confirm cancellation reason
    await bookingDetail.selectCancellationReason('Change of plans');
    
    // Confirm cancellation
    await bookingDetail.confirmCancellation();
    
    // Verify cancellation success
    await expect(page.getByTestId('cancellation-success')).toBeVisible();
    await expect(page.getByTestId('refund-status')).toContainText('Processing');
  });

  test('BM-007: Bulk booking operations - select and export', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);

    await bookingMgmt.goto('/bookings');
    
    // Select multiple bookings
    await bookingMgmt.selectMultipleBookings([0, 1, 2]);
    
    // Verify selection count
    await expect(page.getByTestId('selected-count')).toContainText('3');
    
    // Export selected bookings
    await bookingMgmt.exportSelectedBookings();
    
    // Verify export success
    await expect(page.getByTestId('export-success')).toBeVisible();
  });

  test('BM-008: Booking status tracking and history', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto('/bookings');
    await bookingMgmt.selectBooking(0);
    
    // View status history
    await bookingDetail.viewStatusHistory();
    
    // Verify status timeline
    await expect(page.getByTestId('status-timeline')).toBeVisible();
    await expect(page.getByTestId('status-confirmed')).toBeVisible();
  });

  test('BM-009: Advanced filtering by date range and status', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);

    await bookingMgmt.goto('/bookings');
    
    // Filter by date range
    await bookingMgmt.filterByDateRange('2026-01-01', '2026-12-31');
    await expect(page.getByTestId('date-filter-active')).toBeVisible();
    
    // Filter by status
    await bookingMgmt.filterByStatus('confirmed');
    await expect(page.getByTestId('status-filter')).toHaveValue('confirmed');
    
    // Combine filters
    await bookingMgmt.applyCombinedFilters({
      dateFrom: '2026-01-01',
      dateTo: '2026-06-30',
      status: 'confirmed',
      service: 'flights'
    });
  });

  test('BM-010: Booking amendment with payment difference', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto('/bookings');
    await bookingMgmt.selectBooking(0);
    
    // Start amendment process
    await bookingDetail.clickAmendBooking();
    
    // Change flight to more expensive option
    await bookingDetail.selectNewFlightOption('premium');
    
    // Verify price difference
    const priceDiff = await page.getByTestId('price-difference').textContent();
    expect(priceDiff).toContain('+');
    
    // Proceed to payment
    await bookingDetail.proceedToPayment();
    
    // Verify payment page
    await expect(page.getByTestId('payment-page')).toBeVisible();
  });

  test('BM-011: Rebooking cancelled flight', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto('/bookings');
    
    // Filter for cancelled bookings
    await bookingMgmt.filterByStatus('cancelled');
    await bookingMgmt.selectBooking(0);
    
    // Click rebook
    await bookingDetail.clickRebook();
    
    // Select new flight
    await bookingDetail.selectAlternativeFlight(0);
    
    // Confirm rebooking
    await bookingDetail.confirmRebooking();
    
    // Verify new booking created
    await expect(page.getByTestId('new-booking-reference')).toBeVisible();
  });

  test('BM-012: Booking notes and special requests management', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto('/bookings');
    await bookingMgmt.selectBooking(0);
    
    // Add note
    await bookingDetail.addNote('Special dietary requirements: Vegetarian meal');
    await expect(page.getByTestId('note-added')).toBeVisible();
    
    // View special requests
    await bookingDetail.viewSpecialRequests();
    await expect(page.getByTestId('special-requests-list')).toBeVisible();
    
    // Update special request
    await bookingDetail.updateSpecialRequest('Wheelchair assistance required');
    await expect(page.getByTestId('request-updated')).toBeVisible();
  });
});
