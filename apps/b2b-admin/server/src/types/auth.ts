// ============================================================================
// TripAlfa B2B Admin - Authentication Types
// ============================================================================
// Import enums from shared types - will be updated when shared-types package is available
export enum CompanyType {
  AGENCY = 'AGENCY',
  CORPORATE = 'CORPORATE',
  CONSOLIDATOR = 'CONSOLIDATOR',
  SUB_AGENT = 'SUB_AGENT',
  FRANCHISE = 'FRANCHISE',
}

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export enum BranchType {
  HEAD_OFFICE = 'HEAD_OFFICE',
  OFFICE = 'OFFICE',
  FRANCHISE = 'FRANCHISE',
  VIRTUAL = 'VIRTUAL',
}

export enum BranchStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED',
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  password?: string;
  isActive: boolean;
  isVerified: boolean;
  role: UserRole;
  companyId?: string;
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
}

export interface UserCreate {
  email: string;
  name: string;
  phone?: string;
  password: string;
  role: UserRole;
  companyId?: string;
  branchId?: string;
}

export interface UserUpdate {
  name?: string;
  phone?: string;
  isActive?: boolean;
  role?: UserRole;
  companyId?: string;
  branchId?: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  B2B = 'B2B',
  B2C = 'B2C',
  API = 'API',
}

// Company Types
export interface Company {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  taxId?: string;
  registrationNo?: string;
  type: CompanyType;
  status: CompanyStatus;
  parentCompanyId?: string;
  logo?: string;
  website?: string;
  email: string;
  phone?: string;
  address?: Address;
  billingAddress?: Address;
  settings?: Record<string, unknown>;
  creditLimit?: number;
  currentBalance: number;
  currency: string;
  timezone: string;
  locale: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CompanyCreate {
  code: string;
  name: string;
  legalName?: string;
  taxId?: string;
  registrationNo?: string;
  type?: CompanyType;
  status?: string;
  parentCompanyId?: string;
  logo?: string;
  website?: string;
  email: string;
  phone?: string;
  address?: Address;
  billingAddress?: Address;
  settings?: Record<string, unknown>;
  creditLimit?: number;
  currency?: string;
  timezone?: string;
  locale?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
}

export interface CompanyUpdate {
  name?: string;
  legalName?: string;
  taxId?: string;
  registrationNo?: string;
  type?: CompanyType;
  status?: CompanyStatus;
  parentCompanyId?: string | null;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: Address;
  billingAddress?: Address;
  settings?: Record<string, unknown>;
  creditLimit?: number;
  currency?: string;
  timezone?: string;
  locale?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
}

// Branch Types
export interface Branch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: BranchType;
  status: BranchStatus;
  isHeadOffice: boolean;
  managerUserId?: string;
  email?: string;
  phone?: string;
  address?: Address;
  operatingHours?: Record<string, { open: string; close: string }>;
  allowedServices: string[];
  bookingLimit?: number;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface BranchCreate {
  companyId: string;
  code: string;
  name: string;
  type?: BranchType;
  status?: string;
  isHeadOffice?: boolean;
  managerUserId?: string;
  email?: string;
  phone?: string;
  address?: Address;
  operatingHours?: Record<string, { open: string; close: string }>;
  allowedServices?: string[];
  bookingLimit?: number;
  settings?: Record<string, unknown>;
}

export interface BranchUpdate {
  name?: string;
  type?: BranchType;
  status?: BranchStatus;
  isHeadOffice?: boolean;
  managerUserId?: string | null;
  email?: string;
  phone?: string;
  address?: Address;
  operatingHours?: Record<string, { open: string; close: string }>;
  allowedServices?: string[];
  bookingLimit?: number;
  settings?: Record<string, unknown>;
}

// Address Type
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

// Authentication Types
export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string;
  branchId?: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'companyId' | 'branchId' | 'isActive'>;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}

// Permission Types
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  companyId?: string;
  branchId?: string;
  createdAt: Date;
}

// Security Types
export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  createdAt: Date;
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// File Upload Types
export interface FileUpload {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedBy: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface FileUploadRequest {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: any; // Buffer type
  destination: string;
  filename: string;
  path: string;
  stream: any; // NodeJS.ReadableStream
}
