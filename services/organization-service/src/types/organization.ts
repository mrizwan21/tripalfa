// Organization Types

export interface CreateDepartmentRequest {
  companyId: string;
  name: string;
  code?: string;
  description?: string;
  headId?: string;
  parentDepartmentId?: string;
  level?: number;
  budget?: number;
  status?: string;
}

export interface UpdateDepartmentRequest {
  id: string;
  name?: string;
  code?: string;
  description?: string;
  headId?: string;
  parentDepartmentId?: string;
  level?: number;
  budget?: number;
  status?: string;
}

export interface CreateDesignationRequest {
  companyId: string;
  name: string;
  level?: number;
  description?: string;
  departmentId?: string;
  responsibilities?: string[];
  requirements?: string[];
  salaryRange?: any;
  status?: string;
}

export interface UpdateDesignationRequest {
  id: string;
  name?: string;
  level?: number;
  description?: string;
  departmentId?: string;
  responsibilities?: string[];
  requirements?: string[];
  salaryRange?: any;
  status?: string;
}

export interface CreateCostCenterRequest {
  companyId: string;
  name: string;
  code?: string;
  description?: string;
  departmentId?: string;
  branchId?: string;
  budget?: number;
  currency?: string;
  status?: string;
  managerId?: string;
}

export interface UpdateCostCenterRequest {
  id: string;
  name?: string;
  code?: string;
  description?: string;
  departmentId?: string;
  branchId?: string;
  budget?: number;
  currency?: string;
  status?: string;
  managerId?: string;
}

export interface OrganizationQueryParams {
  companyId: string;
  status?: string;
  departmentId?: string;
  branchId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
}
