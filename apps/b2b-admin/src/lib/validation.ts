import { z } from 'zod';

// Company Validation Schemas
export const CompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name cannot exceed 100 characters'),
  legalName: z.string().min(2, 'Legal name must be at least 2 characters').max(150, 'Legal name cannot exceed 150 characters'),
  registrationNumber: z.string().min(3, 'Registration number must be at least 3 characters').max(50, 'Registration number cannot exceed 50 characters'),
  taxId: z.string().min(3, 'Tax ID must be at least 3 characters').max(20, 'Tax ID cannot exceed 20 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  website: z.string().url('Invalid website URL format').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address cannot exceed 200 characters'),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City cannot exceed 100 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters').max(100, 'Country cannot exceed 100 characters'),
  status: z.enum(['active', 'inactive', 'pending'], { errorMap: () => ({ message: 'Invalid status value' }) }),
  tier: z.enum(['standard', 'premium', 'enterprise'], { errorMap: () => ({ message: 'Invalid tier value' }) }),
  usersCount: z.number().min(0, 'Users count cannot be negative'),
  bookingsCount: z.number().min(0, 'Bookings count cannot be negative'),
  totalRevenue: z.number().min(0, 'Total revenue cannot be negative'),
});

export const CreateCompanySchema = CompanySchema.omit({ 
  id: true, 
  usersCount: true, 
  bookingsCount: true, 
  totalRevenue: true, 
  createdAt: true 
} as any);

export const UpdateCompanySchema = CompanySchema.omit({ 
  id: true, 
  usersCount: true, 
  bookingsCount: true, 
  totalRevenue: true, 
  createdAt: true 
} as any).partial();

// Branch Validation Schemas
export const BranchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters').max(100, 'Branch name cannot exceed 100 characters'),
  code: z.string().min(2, 'Branch code must be at least 2 characters').max(20, 'Branch code cannot exceed 20 characters'),
  iataCode: z.string().min(3, 'IATA code must be at least 3 characters').max(10, 'IATA code cannot exceed 10 characters'),
  officeId: z.string().min(3, 'Office ID must be at least 3 characters').max(50, 'Office ID cannot exceed 50 characters'),
  address: z.object({
    formattedAddress: z.string().min(5, 'Formatted address must be at least 5 characters'),
    street: z.string().min(2, 'Street must be at least 2 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    country: z.string().min(2, 'Country must be at least 2 characters'),
    postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
    coordinates: z.object({
      lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
      lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
    }),
  }),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format'),
  managerId: z.string().min(1, 'Manager ID is required'),
  status: z.enum(['active', 'inactive'], { errorMap: () => ({ message: 'Invalid status value' }) }),
});

export const CreateBranchSchema = BranchSchema.omit({ 
  id: true, 
  status: true, 
  createdAt: true 
} as any).extend({
  companyId: z.string().min(1, 'Company ID is required'),
});

// Department Validation Schemas
export const DepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').max(100, 'Department name cannot exceed 100 characters'),
  code: z.string().min(2, 'Department code must be at least 2 characters').max(20, 'Department code cannot exceed 20 characters'),
  employeeCount: z.number().min(0, 'Employee count cannot be negative'),
  status: z.enum(['active', 'inactive'], { errorMap: () => ({ message: 'Invalid status value' }) }),
});

export const CreateDepartmentSchema = DepartmentSchema.omit({ 
  id: true, 
  status: true 
} as any).extend({
  companyId: z.string().min(1, 'Company ID is required'),
});

// Designation Validation Schemas
export const DesignationSchema = z.object({
  name: z.string().min(2, 'Designation name must be at least 2 characters').max(100, 'Designation name cannot exceed 100 characters'),
  level: z.number().min(1, 'Level must be at least 1').max(10, 'Level cannot exceed 10'),
  departmentName: z.string().min(2, 'Department name must be at least 2 characters'),
  employeeCount: z.number().min(0, 'Employee count cannot be negative'),
});

export const CreateDesignationSchema = DesignationSchema.omit({ 
  id: true 
} as any).extend({
  companyId: z.string().min(1, 'Company ID is required'),
});

// Cost Center Validation Schemas
export const CostCenterSchema = z.object({
  name: z.string().min(2, 'Cost center name must be at least 2 characters').max(100, 'Cost center name cannot exceed 100 characters'),
  code: z.string().min(2, 'Cost center code must be at least 2 characters').max(20, 'Cost center code cannot exceed 20 characters'),
  departmentName: z.string().min(2, 'Department name must be at least 2 characters'),
  budget: z.number().min(0, 'Budget cannot be negative'),
  spent: z.number().min(0, 'Spent amount cannot be negative'),
  currency: z.string().min(3, 'Currency must be at least 3 characters').max(3, 'Currency must be exactly 3 characters'),
  status: z.enum(['active', 'inactive'], { errorMap: () => ({ message: 'Invalid status value' }) }),
});

export const CreateCostCenterSchema = CostCenterSchema.omit({ 
  id: true, 
  status: true 
} as any).extend({
  companyId: z.string().min(1, 'Company ID is required'),
});

// Booking Validation Schemas
export const BookingSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  bookingRef: z.string().min(3, 'Booking reference must be at least 3 characters').max(50, 'Booking reference cannot exceed 50 characters'),
  status: z.string().min(2, 'Status must be at least 2 characters'),
  totalAmount: z.number().min(0, 'Total amount cannot be negative'),
  currency: z.string().min(3, 'Currency must be at least 3 characters').max(3, 'Currency must be exactly 3 characters'),
});

export const CreateBookingSchema = BookingSchema.omit({ 
  id: true, 
  createdAt: true 
} as any);

// User Validation Schemas
export const UserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email format'),
  role: z.string().min(2, 'Role must be at least 2 characters'),
  status: z.string().min(2, 'Status must be at least 2 characters'),
  companyId: z.string().optional(),
});

export const CreateUserSchema = UserSchema.omit({ 
  id: true, 
  createdAt: true 
} as any);

export const UpdateUserSchema = UserSchema.omit({ 
  id: true, 
  createdAt: true 
} as any).partial();

// Flight Booking Form Validation
export const FlightBookingFormSchema = z.object({
  queueNo: z.string().min(1, 'Queue number is required'),
  requestType: z.enum(['confirm', 'pricing', 'amendment', 'reissue', 'cancellation'], { errorMap: () => ({ message: 'Invalid request type' }) }),
  customerId: z.string().min(1, 'Customer ID is required'),
  customerMessage: z.string().max(1000, 'Message cannot exceed 1000 characters').optional(),
  oldDetails: z.object({
    bookingRef: z.string().optional(),
    invoice: z.string().optional(),
    supplierRef: z.string().optional(),
    date: z.date().optional(),
    time: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
  newDetails: z.object({
    bookingRef: z.string().optional(),
    invoice: z.string().optional(),
    supplierRef: z.string().optional(),
    date: z.date().optional(),
    time: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
  passengers: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'Passenger name must be at least 2 characters'),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
    type: z.enum(['adult', 'child', 'infant'], { errorMap: () => ({ message: 'Invalid passenger type' }) }),
  })).min(1, 'At least one passenger is required'),
  segments: z.array(z.object({
    id: z.string().optional(),
    flightNumber: z.string().min(2, 'Flight number must be at least 2 characters'),
    origin: z.string().min(2, 'Origin must be at least 2 characters'),
    destination: z.string().min(2, 'Destination must be at least 2 characters'),
    departureTime: z.date(),
    arrivalTime: z.date(),
    airline: z.string().min(2, 'Airline must be at least 2 characters'),
    class: z.string().min(1, 'Class is required'),
  })).min(1, 'At least one flight segment is required'),
  customerCosting: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(2, 'Description must be at least 2 characters'),
    netCost: z.number().min(0, 'Net cost cannot be negative'),
    markup: z.number().min(0, 'Markup cannot be negative'),
    totalCost: z.number().min(0, 'Total cost cannot be negative'),
    currency: z.string().min(3, 'Currency must be at least 3 characters').max(3, 'Currency must be exactly 3 characters'),
  })),
  supplierCosting: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(2, 'Description must be at least 2 characters'),
    netCost: z.number().min(0, 'Net cost cannot be negative'),
    markup: z.number().min(0, 'Markup cannot be negative'),
    totalCost: z.number().min(0, 'Total cost cannot be negative'),
    currency: z.string().min(3, 'Currency must be at least 3 characters').max(3, 'Currency must be exactly 3 characters'),
  })),
  supplierDetails: z.object({
    supplierId: z.string().min(1, 'Supplier ID is required'),
    supplierName: z.string().min(2, 'Supplier name must be at least 2 characters'),
    contactMode: z.enum(['email', 'phone', 'both'], { errorMap: () => ({ message: 'Invalid contact mode' }) }),
    contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
    contactEmail: z.string().email('Invalid email format').optional(),
  }),
});

// Input sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*[^>\s]*/gi, '') // Remove event handlers without quotes
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\s+/g, '').replace(/[^+\d]/g, '');
};

// Validation utility functions
export const validateCompany = (data: any) => {
  return CreateCompanySchema.safeParse(data);
};

export const validateBranch = (data: any) => {
  return CreateBranchSchema.safeParse(data);
};

export const validateDepartment = (data: any) => {
  return CreateDepartmentSchema.safeParse(data);
};

export const validateBooking = (data: any) => {
  return CreateBookingSchema.safeParse(data);
};

export const validateUser = (data: any) => {
  return CreateUserSchema.safeParse(data);
};

export const validateFlightBookingForm = (data: any) => {
  return FlightBookingFormSchema.safeParse(data);
};

// Error formatting utility
export const formatValidationErrors = (errors: any): string[] => {
  if (!errors || !errors.errors) {
    return ['Invalid data format'];
  }
  
  return errors.errors.map((error: any) => {
    const field = error.path.join('.');
    const message = error.message;
    return `${field}: ${message}`;
  });
};

// Rate limiting utility
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    requests.set(identifier, validRequests);
    
    // Check if under limit
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    return true;
  };
};

// Security headers utility
export const addSecurityHeaders = (headers: Headers) => {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
};