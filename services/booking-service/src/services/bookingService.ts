import { v4 as uuidv4 } from 'uuid';
import { setTimeout as delay } from 'timers/promises';
import supplierIntegration from '../integrations/supplierIntegration.js';

// Mock database (in real implementation, this would be a database)
interface Booking {
  id: string;
  type: string;
  status: string;
  userId: string;
  totalAmount: number;
  serviceFee: number;
  passengers: any[];
  [key: string]: any;
  createdAt: Date;
  updatedAt: Date;
}

class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

let bookings: Booking[] = [];

// Mock booking data for demonstration
const mockBookings = [
  {
    id: uuidv4(),
    type: 'flight',
    status: 'confirmed',
    userId: 'user1',
    totalAmount: 250.00,
    serviceFee: 10.00,
    passengers: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        passportNumber: 'AB123456'
      }
    ],
    flightDetails: {
      flightNumber: 'AA100',
      origin: 'JFK',
      destination: 'LAX',
      departureTime: '2024-01-15T10:00:00Z',
      arrivalTime: '2024-01-15T13:00:00Z',
      cabinClass: 'economy'
    },
    confirmationNumber: 'TK-1234567890-ABC',
    createdAt: new Date('2024-01-10T10:00:00Z'),
    updatedAt: new Date('2024-01-10T10:00:00Z'),
  },
  {
    id: uuidv4(),
    type: 'hotel',
    status: 'confirmed',
    userId: 'user2',
    totalAmount: 400.00,
    serviceFee: 15.00,
    passengers: [
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        dateOfBirth: '1985-05-15',
        passportNumber: 'CD789012'
      }
    ],
    hotelDetails: {
      hotelName: 'Grand Plaza Hotel',
      hotelCode: 'GP001',
      checkInDate: '2024-02-01',
      checkOutDate: '2024-02-05',
      numberOfRooms: 1,
      roomType: 'deluxe'
    },
    confirmationNumber: 'TK-0987654321-XYZ',
    createdAt: new Date('2024-01-08T15:30:00Z'),
    updatedAt: new Date('2024-01-08T15:30:00Z'),
  }
];

// Initialize with mock data
bookings = mockBookings;

class BookingService {
  // Create a new booking
  async createBooking(bookingData: any, userId: string) {
    // Validate booking data
    if (!bookingData.type || !bookingData.totalAmount) {
      throw new Error('Booking type and total amount are required');
    }

    // Generate confirmation number
    const confirmationNumber = this.generateConfirmationNumber();

    // Create booking object
    const booking = {
      id: uuidv4(),
      ...bookingData,
      userId,
      status: 'pending',
      confirmationNumber,
      serviceFee: bookingData.serviceFee || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: Integrate with payment service for payment processing
    // TODO: Integrate with inventory service for availability check
    // TODO: Save to database

    // For now, add to mock array
    bookings.push(booking);

    // Simulate payment processing
    await this.processPayment(booking);

    // Update status to confirmed
    booking.status = 'confirmed';
    booking.updatedAt = new Date();

    return booking;
  }

  // Get booking by ID
  async getBookingById(id: string) {
    const booking = bookings.find(b => b.id === id);
    if (!booking) {
      throw new CustomError('Booking not found', 404);
    }
    return booking;
  }

  // Cancel booking
  async cancelBooking(id: string, reason: string, cancelledBy: string) {
    const booking = await this.getBookingById(id);

    if (booking.status === 'cancelled') {
      throw new CustomError('Booking is already cancelled', 400);
    }

    if (booking.status === 'confirmed') {
      // TODO: Integrate with payment service for refund processing
      // TODO: Integrate with inventory service to release inventory
      await this.processRefund(booking);
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = cancelledBy;
    booking.cancellationReason = reason;
    booking.updatedAt = new Date();

    return booking;
  }

  // Search bookings
  async searchBookings(searchParams: any, userId: string) {
    let filteredBookings = bookings.filter(b => b.userId === userId);

    // Apply filters
    if (searchParams.status) {
      filteredBookings = filteredBookings.filter(b => b.status === searchParams.status);
    }

    if (searchParams.type) {
      filteredBookings = filteredBookings.filter(b => b.type === searchParams.type);
    }

    if (searchParams.startDate && searchParams.endDate) {
      const startDate = new Date(searchParams.startDate);
      const endDate = new Date(searchParams.endDate);
      filteredBookings = filteredBookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }

    // Pagination
    const page = parseInt(searchParams.page, 10) || 1;
    const limit = parseInt(searchParams.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Sorting
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = searchParams.sortOrder === 'DESC' ? -1 : 1;

    filteredBookings.sort((a, b) => {
      const valA = a[sortBy] as any;
      const valB = b[sortBy] as any;
      const sortOrderNum = sortOrder as number;
      if (sortOrderNum === -1) {
        if (valA < valB) return 1;
        if (valA > valB) return -1;
        return 0;
      } else {
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
      }
    });

    const total = filteredBookings.length;
    const bookingsPage = filteredBookings.slice(startIndex, endIndex);

    return {
      bookings: bookingsPage,
      total,
    };
  }

  // Get user bookings
  async getUserBookings(userId: string, status?: string, type?: string) {
    let userBookings = bookings.filter(b => b.userId === userId);

    if (status) {
      userBookings = userBookings.filter(b => b.status === status);
    }

    if (type) {
      userBookings = userBookings.filter(b => b.type === type);
    }

    return userBookings.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }

  // Get user booking stats
  async getUserBookingStats(userId: string) {
    const userBookings = bookings.filter(b => b.userId === userId);

    const totalBookings = userBookings.length;
    const confirmedBookings = userBookings.filter(b => b.status === 'confirmed').length;
    const cancelledBookings = userBookings.filter(b => b.status === 'cancelled').length;

    const totalSpent = userBookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const bookingTypes = userBookings.reduce((acc: Record<string, number>, booking) => {
      acc[booking.type] = (acc[booking.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalSpent,
      bookingTypes,
    };
  }

  // Update booking status
  async updateBookingStatus(id: string, status: string) {
    const booking = await this.getBookingById(id);
    booking.status = status;
    booking.updatedAt = new Date();
    return booking;
  }

  async holdBooking(bookingData: any, userId: string) {
    if (!bookingData.type) {
      throw new Error('Booking type is required');
    }
    const booking = {
      id: uuidv4(),
      ...bookingData,
      userId,
      status: 'hold',
      confirmationNumber: this.generateConfirmationNumber(),
      serviceFee: bookingData.serviceFee || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      holdUntil: bookingData.holdUntil || new Date(Date.now() + 30 * 60 * 1000),
    };
    bookings.push(booking);
    return booking;
  }

  async confirmBooking(id: string, paymentDetails?: any) {
    const booking = await this.getBookingById(id);
    
    // For hotel bookings, call the supplier API to confirm
    if (booking.type === 'hotel') {
      try {
        // Extract hotel booking data from the booking
        const hotelBookingData = {
          hotelId: booking.hotel?.id || booking.hotelId,
          offerId: booking.hotel?.offers?.[0]?.id || booking.offerId,
          checkin: booking.hotel?.checkin || booking.checkin,
          checkout: booking.hotel?.checkout || booking.checkout,
          rooms: booking.hotel?.rooms || booking.rooms || [{
            adults: booking.adults || 2,
            children: booking.children || 0
          }],
          guests: booking.passengers || booking.guests || [{
            firstName: 'Guest',
            lastName: 'User',
            email: 'guest@example.com'
          }],
          payment: paymentDetails
        };

        // Call supplier integration to book the hotel
        const supplierResponse = await supplierIntegration.bookHotel('liteapi', hotelBookingData);
        
        // Update booking with supplier response
        booking.confirmationNumber = supplierResponse.confirmationNumber || booking.confirmationNumber;
        booking.supplierReference = supplierResponse.supplierReference;
        booking.status = 'confirmed';
        booking.paymentDetails = paymentDetails || booking.paymentDetails;
        booking.updatedAt = new Date();
        
        return booking;
      } catch (error) {
        console.error('Hotel booking confirmation failed:', error);
        throw new Error(`Hotel booking confirmation failed: ${(error as Error).message}`);
      }
    }
    
    // For other booking types, just update status
    booking.status = 'confirmed';
    booking.paymentDetails = paymentDetails || booking.paymentDetails;
    booking.updatedAt = new Date();
    return booking;
  }

  async listBookings(scope: string = 'all', userId?: string | any) {
    if (scope === 'user' && userId) {
      return bookings.filter(b => b.userId === userId);
    }
    return bookings;
  }

  // Helper methods
  generateConfirmationNumber() {
    return `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  // Mock payment processing
  async processPayment(booking: any) {
    // Simulate payment service call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Payment processed for booking ${booking.id}`);
        resolve();
      }, 1000);
    });
  }

  // Mock refund processing
  async processRefund(booking: any) {
    // Simulate payment service call for refund
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Refund processed for booking ${booking.id}`);
        resolve();
      }, 1000);
    });
  }
}

export default new BookingService();
