// ============================================================================
// TripAlfa Shared Types - User Domain
// ============================================================================

import { UserType, UserStatus, Gender, CustomerTier } from './enums';
import { Address } from './company';

// ============================================================================
// User Types
// ============================================================================
export interface User {
  id: string;
  companyId?: string;
  branchId?: string;
  email: string;
  type: UserType;
  status: UserStatus;
  firstName: string;
  lastName: string;
  displayName?: string;
  phone?: string;
  avatar?: string;
  language: string;
  timezone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  passwordChangedAt?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserCreate {
  companyId?: string;
  branchId?: string;
  email: string;
  password: string;
  type?: UserType;
  firstName: string;
  lastName: string;
  displayName?: string;
  phone?: string;
  avatar?: string;
  language?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
}

export interface UserUpdate {
  branchId?: string | null;
  email?: string;
  type?: UserType;
  status?: UserStatus;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  avatar?: string;
  language?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// User Profile B2B Types
// ============================================================================
export interface UserProfileB2B {
  id: string;
  userId: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  reportingTo?: string;
  bookingLimit?: number;
  dailyLimit?: number;
  canApprove: boolean;
  approvalLimit?: number;
  workPhone?: string;
  workEmail?: string;
  joiningDate?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileB2BCreate {
  userId: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  reportingTo?: string;
  bookingLimit?: number;
  dailyLimit?: number;
  canApprove?: boolean;
  approvalLimit?: number;
  workPhone?: string;
  workEmail?: string;
  joiningDate?: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfileB2BUpdate {
  employeeId?: string;
  department?: string;
  designation?: string;
  reportingTo?: string | null;
  bookingLimit?: number;
  dailyLimit?: number;
  canApprove?: boolean;
  approvalLimit?: number;
  workPhone?: string;
  workEmail?: string;
  joiningDate?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// User Profile B2C Types
// ============================================================================
export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface TravelPreferences {
  seatPreference?: 'window' | 'aisle' | 'middle';
  mealPreference?: string;
  specialAssistance?: string[];
}

export interface LoyaltyProgram {
  programId: string;
  membershipNo: string;
}

export interface UserProfileB2C {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  preferences?: TravelPreferences;
  loyaltyPrograms?: LoyaltyProgram[];
  travelHistory?: unknown;
  totalBookings: number;
  totalSpent: number;
  loyaltyPoints: number;
  tier: CustomerTier;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileB2CCreate {
  userId: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  preferences?: TravelPreferences;
  loyaltyPrograms?: LoyaltyProgram[];
}

export interface UserProfileB2CUpdate {
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  preferences?: TravelPreferences;
  loyaltyPrograms?: LoyaltyProgram[];
}

// ============================================================================
// User Document Types
// ============================================================================
export interface UserDocument {
  id: string;
  userId: string;
  documentType: string;
  documentNo: string;
  issuingCountry: string;
  issueDate?: string;
  expiryDate?: string;
  firstName: string;
  lastName: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: Gender;
  documentUrl?: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  isPrimary: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserDocumentCreate {
  userId: string;
  documentType: string;
  documentNo: string;
  issuingCountry: string;
  issueDate?: string;
  expiryDate?: string;
  firstName: string;
  lastName: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: Gender;
  documentUrl?: string;
  isPrimary?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UserDocumentUpdate {
  documentNo?: string;
  issueDate?: string;
  expiryDate?: string;
  firstName?: string;
  lastName?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: Gender;
  documentUrl?: string;
  isPrimary?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// User List/Search Types
// ============================================================================
export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  branchId?: string;
  type?: UserType;
  status?: UserStatus;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// User with Relations
// ============================================================================
export interface UserWithRelations extends User {
  profileB2B?: UserProfileB2B;
  profileB2C?: UserProfileB2C;
  documents?: UserDocument[];
  roles?: {
    id: string;
    name: string;
    code: string;
  }[];
}

// ============================================================================
// Authentication Types
// ============================================================================
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest extends UserCreate {
  confirmPassword: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
