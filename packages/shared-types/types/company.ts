// ============================================================================
// TripAlfa Shared Types - Company Domain
// ============================================================================

import { CompanyType, CompanyStatus, BranchType, BranchStatus } from './enums';

// ============================================================================
// Address Type (Reusable)
// ============================================================================
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

// ============================================================================
// Company Types
// ============================================================================
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
  contractStartDate?: string;
  contractEndDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CompanyCreate {
  code: string;
  name: string;
  legalName?: string;
  taxId?: string;
  registrationNo?: string;
  type?: CompanyType;
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
  contractStartDate?: string;
  contractEndDate?: string;
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
  contractStartDate?: string;
  contractEndDate?: string;
}

// ============================================================================
// Company Financials Types
// ============================================================================
export interface CompanyFinancials {
  id: string;
  companyId: string;
  creditLimit: number;
  availableCredit: number;
  outstandingBalance: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  depositAmount: number;
  paymentTermsDays: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  riskScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFinancialsUpdate {
  creditLimit?: number;
  depositAmount?: number;
  paymentTermsDays?: number;
  riskScore?: number;
}

// ============================================================================
// Branch Types
// ============================================================================
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
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface BranchCreate {
  companyId: string;
  code: string;
  name: string;
  type?: BranchType;
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

// ============================================================================
// Company Settings Types
// ============================================================================
export interface CompanySetting {
  id: string;
  companyId: string;
  category: string;
  key: string;
  value: unknown;
  description?: string;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettingCreate {
  companyId: string;
  category: string;
  key: string;
  value: unknown;
  description?: string;
  isEditable?: boolean;
}

export interface CompanySettingUpdate {
  value: unknown;
  description?: string;
}

// ============================================================================
// Company List/Search Types
// ============================================================================
export interface CompanyListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: CompanyType;
  status?: CompanyStatus;
  parentCompanyId?: string;
  sortBy?: 'name' | 'code' | 'createdAt' | 'currentBalance';
  sortOrder?: 'asc' | 'desc';
}

export interface CompanyListResponse {
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Company with Relations
// ============================================================================
export interface CompanyWithRelations extends Company {
  parentCompany?: Company;
  childCompanies?: Company[];
  branches?: Branch[];
  financials?: CompanyFinancials;
}
