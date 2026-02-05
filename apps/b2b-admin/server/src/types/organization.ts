/**
 * Department types and validation schemas
 */
export interface Department {
  id?: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  headId?: string;
  parentDepartmentId?: string;
  level: number;
  budget?: number;
  employeeCount?: number;
  status: 'active' | 'inactive' | 'archived';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateDepartmentRequest {
  companyId: string;
  name: string;
  code: string;
  description?: string;
  headId?: string;
  parentDepartmentId?: string;
  level: number;
  budget?: number;
  status?: 'active' | 'inactive' | 'archived';
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
  id: string;
}

/**
 * Designation types and validation schemas
 */
export interface Designation {
  id?: string;
  companyId: string;
  name: string;
  level: number;
  description?: string;
  departmentId?: string;
  responsibilities?: string[];
  requirements?: string[];
  salaryRange?: {
    min: number;
    max: number;
  };
  status: 'active' | 'inactive' | 'archived';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateDesignationRequest {
  companyId: string;
  name: string;
  level: number;
  description?: string;
  departmentId?: string;
  responsibilities?: string[];
  requirements?: string[];
  salaryRange?: {
    min: number;
    max: number;
  };
  status?: 'active' | 'inactive' | 'archived';
}

export interface UpdateDesignationRequest extends Partial<CreateDesignationRequest> {
  id: string;
}

/**
 * Cost Center types and validation schemas
 */
export interface CostCenter {
  id?: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  departmentId?: string;
  branchId?: string;
  budget: number;
  spent: number;
  currency: string;
  status: 'active' | 'inactive' | 'archived';
  managerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateCostCenterRequest {
  companyId: string;
  name: string;
  code: string;
  description?: string;
  departmentId?: string;
  branchId?: string;
  budget: number;
  currency?: string;
  status?: 'active' | 'inactive' | 'archived';
  managerId?: string;
}

export interface UpdateCostCenterRequest extends Partial<CreateCostCenterRequest> {
  id: string;
}

/**
 * Organization hierarchy types
 */
export interface DepartmentHierarchy {
  id: string;
  name: string;
  code: string;
  level: number;
  children: DepartmentHierarchy[];
  employees: number;
}

export interface OrganizationStats {
  totalDepartments: number;
  totalDesignations: number;
  totalCostCenters: number;
  totalBudget: number;
  totalSpent: number;
  activeDepartments: number;
  activeDesignations: number;
  activeCostCenters: number;
}

/**
 * Query parameters for organization endpoints
 */
export interface OrganizationQueryParams {
  companyId?: string;
  status?: 'active' | 'inactive' | 'archived';
  departmentId?: string;
  branchId?: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'level';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Response types
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DepartmentWithStats extends Department {
  employeeCount: number;
  budgetUtilization: number;
  childDepartments: number;
}

export interface DesignationWithStats extends Designation {
  employeeCount: number;
  averageSalary: number;
  departmentName?: string;
}

export interface CostCenterWithStats extends CostCenter {
  utilizationPercentage: number;
  remainingBudget: number;
  departmentName?: string;
  branchName?: string;
}