import bookingService from '../../services/bookingService';

// Mock supplier integration
jest.mock('../../integrations/supplierIntegration', () => ({
  default: {
    bookHotel: jest.fn().mockResolvedValue({
      confirmationNumber: 'HOTEL-123',
      supplierReference: 'SUP-456',
    }),
  },
}));

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      // Arrange
      const bookingData = {
        type: 'flight',
        totalAmount: 250.00,
        serviceFee: 10.00,
        passengers: [{
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          passportNumber: 'AB123456'
        }],
        flightDetails: {
          flightNumber: 'AA100',
          origin: 'JFK',
          destination: 'LAX',
          departureTime: '2024-01-15T10:00:00Z',
          arrivalTime: '2024-01-15T13:00:00Z',
          cabinClass: 'economy'
        }
      };
      const userId = 'user1';

      // Act
      const result = await bookingService.createBooking(bookingData, userId);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.type).toBe('flight');
      expect(result.status).toBe('confirmed');
      expect(result.userId).toBe(userId);
      expect(result.totalAmount).toBe(250.00);
      expect(result.confirmationNumber).toMatch(/^TK-/);
    });

    it('should throw error for invalid booking data', async () => {
      // Arrange
      const invalidData = { totalAmount: 100 }; // missing type
      const userId = 'user1';

      // Act & Assert
      await expect(bookingService.createBooking(invalidData, userId))
        .rejects.toThrow('Booking type and total amount are required');
    });
  });

  describe('getBookingById', () => {
    it('should return booking by ID', async () => {
      // First create a booking
      const bookingData = {
        type: 'hotel',
        totalAmount: 400.00,
        serviceFee: 15.00,
        passengers: [{
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        }]
      };
      const createdBooking = await bookingService.createBooking(bookingData, 'user2');

      // Act
      const result = await bookingService.getBookingById(createdBooking.id);

      // Assert
      expect(result.id).toBe(createdBooking.id);
      expect(result.type).toBe('hotel');
      expect(result.status).toBe('confirmed');
    });

    it('should throw error when booking not found', async () => {
      // Act & Assert
      await expect(bookingService.getBookingById('non-existent-id'))
        .rejects.toThrow('Booking not found');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking successfully', async () => {
      // First create a booking
      const bookingData = {
        type: 'flight',
        totalAmount: 300.00,
        passengers: [{ firstName: 'Test', lastName: 'User' }]
      };
      const createdBooking = await bookingService.createBooking(bookingData, 'user3');

      // Act
      const result = await bookingService.cancelBooking(createdBooking.id, 'Customer request', 'user3');

      // Assert
      expect(result.status).toBe('cancelled');
      expect(result.cancellationReason).toBe('Customer request');
      expect(result.cancelledBy).toBe('user3');
    });
  });

  describe('searchBookings', () => {
    it('should return user bookings with filters', async () => {
      // First create some bookings
      await bookingService.createBooking({
        type: 'flight',
        totalAmount: 200.00,
        passengers: [{ firstName: 'Search', lastName: 'Test' }]
      }, 'search-user');

      await bookingService.createBooking({
        type: 'hotel',
        totalAmount: 150.00,
        passengers: [{ firstName: 'Search', lastName: 'Test' }]
      }, 'search-user');

      // Act
      const result = await bookingService.searchBookings({ type: 'flight' }, 'search-user');

      // Assert
      expect(result.bookings).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      result.bookings.forEach((booking: any) => {
        expect(booking.userId).toBe('search-user');
        expect(booking.type).toBe('flight');
      });
    });
  });

  describe('getUserBookings', () => {
    it('should return user bookings', async () => {
      // First create a booking
      await bookingService.createBooking({
        type: 'flight',
        totalAmount: 100.00,
        passengers: [{ firstName: 'User', lastName: 'Bookings' }]
      }, 'user-bookings');

      // Act
      const result = await bookingService.getUserBookings('user-bookings');

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((booking: any) => {
        expect(booking.userId).toBe('user-bookings');
      });
    });
  });

  describe('getUserBookingStats', () => {
    it('should return user booking statistics', async () => {
      // First create some bookings for the user
      await bookingService.createBooking({
        type: 'flight',
        totalAmount: 100.00,
        passengers: [{ firstName: 'Stats', lastName: 'Test' }]
      }, 'stats-user');

      await bookingService.createBooking({
        type: 'hotel',
        totalAmount: 200.00,
        passengers: [{ firstName: 'Stats', lastName: 'Test' }]
      }, 'stats-user');

      // Act
      const result = await bookingService.getUserBookingStats('stats-user');

      // Assert
      expect(result).toHaveProperty('totalBookings');
      expect(result).toHaveProperty('confirmedBookings');
      expect(result).toHaveProperty('totalSpent');
      expect(result).toHaveProperty('bookingTypes');
      expect(result.totalBookings).toBeGreaterThanOrEqual(2);
      expect(result.totalSpent).toBeGreaterThanOrEqual(300);
    });
  });

  describe('holdBooking', () => {
    it('should create a booking on hold', async () => {
      // Arrange
      const bookingData = {
        type: 'flight',
        totalAmount: 150.00,
        passengers: [{ firstName: 'Hold', lastName: 'Test' }]
      };

      // Act
      const result = await bookingService.holdBooking(bookingData, 'hold-user');

      // Assert
      expect(result.status).toBe('hold');
      expect(result.userId).toBe('hold-user');
      expect(result.holdUntil).toBeDefined();
    });
  });

  describe('confirmBooking', () => {
    it('should confirm a held booking', async () => {
      // First create a hold booking
      const bookingData = {
        type: 'flight',
        totalAmount: 120.00,
        passengers: [{ firstName: 'Confirm', lastName: 'Test' }]
      };
      const heldBooking = await bookingService.holdBooking(bookingData, 'confirm-user');

      // Act
      const result = await bookingService.confirmBooking(heldBooking.id);

      // Assert
      expect(result.status).toBe('confirmed');
      expect(result.id).toBe(heldBooking.id);
    });
  });
});
