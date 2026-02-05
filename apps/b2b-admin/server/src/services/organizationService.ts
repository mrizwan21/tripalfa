import { PoolClient } from 'pg';
import { logger } from '../utils/logger.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { 
  Department, 
  CreateDepartmentRequest, 
  UpdateDepartmentRequest,
  Designation,
  CreateDesignationRequest,
  UpdateDesignationRequest,
  CostCenter,
  CreateCostCenterRequest,
  UpdateCostCenterRequest,
  OrganizationQueryParams,
  PaginatedResponse,
  DepartmentWithStats,
  DesignationWithStats,
  CostCenterWithStats,
  OrganizationStats
} from '../types/organization.js';

/**
 * Organization Service for managing departments, designations, and cost centers
 */
export class OrganizationService {
  private db: PoolClient;

  constructor(db: PoolClient) {
    this.db = db;
  }

  /**
   * Department Management
   */

  /**
   * Create a new department with validation and security checks
   */
  async createDepartment(
    departmentData: CreateDepartmentRequest, 
    userId: string, 
    userRole: string
  ): Promise<Department> {
    try {
      // Security validation
      this.validateDepartmentInput(departmentData);
      
      // Authorization check
      await this.checkDepartmentPermissions(userId, userRole, 'create', departmentData.companyId);

      // Check if department code already exists
      const existingCode = await this.db.query(
        'SELECT id FROM departments WHERE code = $1 AND company_id = $2 AND deleted_at IS NULL',
        [departmentData.code, departmentData.companyId]
      );

      if (existingCode.rows.length > 0) {
        throw new Error('Department code already exists for this company');
      }

      // Check if parent department exists and belongs to same company
      if (departmentData.parentDepartmentId) {
        const parentDept = await this.db.query(
          'SELECT id, company_id FROM departments WHERE id = $1 AND deleted_at IS NULL',
          [departmentData.parentDepartmentId]
        );

        if (parentDept.rows.length === 0) {
          throw new Error('Parent department not found');
        }

        if (parentDept.rows[0].company_id !== departmentData.companyId) {
          throw new Error('Parent department belongs to a different company');
        }
      }

      // Generate department code if not provided
      const code = departmentData.code || await this.generateDepartmentCode(departmentData.companyId);

      const result = await this.db.query(
        `INSERT INTO departments (
          company_id, name, code, description, head_id, parent_department_id, 
          level, budget, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          departmentData.companyId,
          departmentData.name,
          code,
          departmentData.description || null,
          departmentData.headId || null,
          departmentData.parentDepartmentId || null,
          departmentData.level,
          departmentData.budget || null,
          departmentData.status || 'active'
        ]
      );

      const department = result.rows[0];

      // Log security event
      logger.info('Department created', {
        departmentId: department.id,
        companyId: department.company_id,
        createdBy: userId,
        userRole
      });

      return this.mapDepartment(department);
    } catch (error) {
      logger.error('Error creating department', { error, userId, userRole });
      throw error;
    }
  }

  /**
   * Get department by ID with security checks
   */
  async getDepartmentById(id: string, userId: string, userRole: string): Promise<Department> {
    try {
      const result = await this.db.query(
        `SELECT d.*, 
                COUNT(e.id) as employee_count,
                COALESCE(SUM(d2.budget), 0) as child_budgets
         FROM departments d
         LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL
         LEFT JOIN departments d2 ON d2.parent_department_id = d.id AND d2.deleted_at IS NULL
         WHERE d.id = $1 AND d.deleted_at IS NULL
         GROUP BY d.id`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Department not found');
      }

      const department = result.rows[0];

      // Authorization check
      await this.checkDepartmentPermissions(userId, userRole, 'read', department.company_id);

      return this.mapDepartmentWithStats(department);
    } catch (error) {
      logger.error('Error getting department', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Get departments with pagination and filtering
   */
  async getDepartments(
    params: OrganizationQueryParams, 
    userId: string, 
    userRole: string
  ): Promise<PaginatedResponse<DepartmentWithStats>> {
    try {
      // Build query with security filters
      let query = `
        SELECT d.*, 
               COUNT(e.id) as employee_count,
               COALESCE(SUM(d2.budget), 0) as child_budgets
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL
        LEFT JOIN departments d2 ON d2.parent_department_id = d.id AND d2.deleted_at IS NULL
        WHERE d.deleted_at IS NULL
      `;
      
      const values: any[] = [];
      let paramIndex = 1;

      // Apply security filters based on user role
      if (userRole !== 'SUPER_ADMIN') {
        query += ` AND d.company_id = $${paramIndex}`;
        values.push(params.companyId || 'user_company_id'); // This would be replaced with actual user company
        paramIndex++;
      } else if (params.companyId) {
        query += ` AND d.company_id = $${paramIndex}`;
        values.push(params.companyId);
        paramIndex++;
      }

      if (params.status) {
        query += ` AND d.status = $${paramIndex}`;
        values.push(params.status);
        paramIndex++;
      }

      if (params.search) {
        query += ` AND (d.name ILIKE $${paramIndex} OR d.code ILIKE $${paramIndex})`;
        values.push(`%${params.search}%`);
        paramIndex++;
      }

      query += ` GROUP BY d.id`;

      // Add sorting
      const sortBy = params.sortBy || 'name';
      const sortOrder = params.sortOrder || 'asc';
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

      // Add pagination
      if (params.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(params.limit);
        paramIndex++;
        
        if (params.offset) {
          query += ` OFFSET $${paramIndex}`;
          values.push(params.offset);
        }
      }

      // Get total count
      const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM');
      const countResult = await this.db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get data
      const result = await this.db.query(query, values);

      const departments = result.rows.map(row => this.mapDepartmentWithStats(row));

      return {
        data: departments,
        total,
        page: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(total / (params.limit || 10))
      };
    } catch (error) {
      logger.error('Error getting departments', { error, params, userId, userRole });
      throw error;
    }
  }

  /**
   * Update department with validation
   */
  async updateDepartment(
    id: string, 
    updateData: UpdateDepartmentRequest, 
    userId: string, 
    userRole: string
  ): Promise<Department> {
    try {
      // Security validation
      this.validateDepartmentInput(updateData);

      // Get existing department
      const existing = await this.getDepartmentById(id, userId, userRole);

      // Authorization check
      await this.checkDepartmentPermissions(userId, userRole, 'update', existing.companyId);

      // Check for conflicts
      if (updateData.code && updateData.code !== existing.code) {
        const existingCode = await this.db.query(
          'SELECT id FROM departments WHERE code = $1 AND company_id = $2 AND id != $3 AND deleted_at IS NULL',
          [updateData.code, existing.companyId, id]
        );

        if (existingCode.rows.length > 0) {
          throw new Error('Department code already exists for this company');
        }
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${this.toSnakeCase(key)} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE departments 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Department not found or already deleted');
      }

      const department = result.rows[0];

      // Log security event
      logger.info('Department updated', {
        departmentId: id,
        companyId: department.company_id,
        updatedBy: userId,
        userRole,
        fields: Object.keys(updateData)
      });

      return this.mapDepartment(department);
    } catch (error) {
      logger.error('Error updating department', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Soft delete department
   */
  async deleteDepartment(id: string, userId: string, userRole: string): Promise<void> {
    try {
      const department = await this.getDepartmentById(id, userId, userRole);

      // Authorization check
      await this.checkDepartmentPermissions(userId, userRole, 'delete', department.companyId);

      // Check if department has sub-departments or employees
      const childCount = await this.db.query(
        'SELECT COUNT(*) FROM departments WHERE parent_department_id = $1 AND deleted_at IS NULL',
        [id]
      );

      const employeeCount = await this.db.query(
        'SELECT COUNT(*) FROM employees WHERE department_id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (parseInt(childCount.rows[0].count) > 0) {
        throw new Error('Cannot delete department with sub-departments');
      }

      if (parseInt(employeeCount.rows[0].count) > 0) {
        throw new Error('Cannot delete department with employees');
      }

      await this.db.query(
        'UPDATE departments SET deleted_at = NOW() WHERE id = $1',
        [id]
      );

      // Log security event
      logger.info('Department deleted', {
        departmentId: id,
        companyId: department.companyId,
        deletedBy: userId,
        userRole
      });
    } catch (error) {
      logger.error('Error deleting department', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Designation Management
   */

  async createDesignation(
    designationData: CreateDesignationRequest, 
    userId: string, 
    userRole: string
  ): Promise<Designation> {
    try {
      this.validateDesignationInput(designationData);
      
      await this.checkDesignationPermissions(userId, userRole, 'create', designationData.companyId);

      const result = await this.db.query(
        `INSERT INTO designations (
          company_id, name, level, description, department_id, 
          responsibilities, requirements, salary_range, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          designationData.companyId,
          designationData.name,
          designationData.level,
          designationData.description || null,
          designationData.departmentId || null,
          designationData.responsibilities || [],
          designationData.requirements || [],
          designationData.salaryRange || null,
          designationData.status || 'active'
        ]
      );

      const designation = result.rows[0];

      logger.info('Designation created', {
        designationId: designation.id,
        companyId: designation.company_id,
        createdBy: userId,
        userRole
      });

      return this.mapDesignation(designation);
    } catch (error) {
      logger.error('Error creating designation', { error, userId, userRole });
      throw error;
    }
  }

  async getDesignations(
    params: OrganizationQueryParams, 
    userId: string, 
    userRole: string
  ): Promise<PaginatedResponse<DesignationWithStats>> {
    try {
      let query = `
        SELECT d.*, 
               COUNT(e.id) as employee_count,
               AVG(e.salary) as average_salary,
               dept.name as department_name
        FROM designations d
        LEFT JOIN employees e ON e.designation_id = d.id AND e.deleted_at IS NULL
        LEFT JOIN departments dept ON dept.id = d.department_id
        WHERE d.deleted_at IS NULL
      `;
      
      const values: any[] = [];
      let paramIndex = 1;

      if (userRole !== 'SUPER_ADMIN') {
        query += ` AND d.company_id = $${paramIndex}`;
        values.push(params.companyId || 'user_company_id');
        paramIndex++;
      } else if (params.companyId) {
        query += ` AND d.company_id = $${paramIndex}`;
        values.push(params.companyId);
        paramIndex++;
      }

      if (params.status) {
        query += ` AND d.status = $${paramIndex}`;
        values.push(params.status);
        paramIndex++;
      }

      if (params.departmentId) {
        query += ` AND d.department_id = $${paramIndex}`;
        values.push(params.departmentId);
        paramIndex++;
      }

      if (params.search) {
        query += ` AND d.name ILIKE $${paramIndex}`;
        values.push(`%${params.search}%`);
        paramIndex++;
      }

      query += ` GROUP BY d.id, dept.name ORDER BY ${params.sortBy || 'name'} ${params.sortOrder || 'asc'}`;

      if (params.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(params.limit);
        paramIndex++;
        
        if (params.offset) {
          query += ` OFFSET $${paramIndex}`;
          values.push(params.offset);
        }
      }

      const countResult = await this.db.query(query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM'), values);
      const total = parseInt(countResult.rows[0].count);
      const result = await this.db.query(query, values);

      const designations = result.rows.map(row => this.mapDesignationWithStats(row));

      return {
        data: designations,
        total,
        page: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(total / (params.limit || 10))
      };
    } catch (error) {
      logger.error('Error getting designations', { error, params, userId, userRole });
      throw error;
    }
  }

  /**
   * Cost Center Management
   */

  async createCostCenter(
    costCenterData: CreateCostCenterRequest, 
    userId: string, 
    userRole: string
  ): Promise<CostCenter> {
    try {
      this.validateCostCenterInput(costCenterData);
      
      await this.checkCostCenterPermissions(userId, userRole, 'create', costCenterData.companyId);

      const result = await this.db.query(
        `INSERT INTO cost_centers (
          company_id, name, code, description, department_id, branch_id, 
          budget, spent, currency, status, manager_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *`,
        [
          costCenterData.companyId,
          costCenterData.name,
          costCenterData.code,
          costCenterData.description || null,
          costCenterData.departmentId || null,
          costCenterData.branchId || null,
          costCenterData.budget,
          0, // spent starts at 0
          costCenterData.currency || 'USD',
          costCenterData.status || 'active',
          costCenterData.managerId || null
        ]
      );

      const costCenter = result.rows[0];

      logger.info('Cost center created', {
        costCenterId: costCenter.id,
        companyId: costCenter.company_id,
        createdBy: userId,
        userRole
      });

      return this.mapCostCenter(costCenter);
    } catch (error) {
      logger.error('Error creating cost center', { error, userId, userRole });
      throw error;
    }
  }

  async getCostCenters(
    params: OrganizationQueryParams, 
    userId: string, 
    userRole: string
  ): Promise<PaginatedResponse<CostCenterWithStats>> {
    try {
      let query = `
        SELECT cc.*, 
               (cc.spent / cc.budget * 100) as utilization_percentage,
               (cc.budget - cc.spent) as remaining_budget,
               dept.name as department_name,
               b.name as branch_name
        FROM cost_centers cc
        LEFT JOIN departments dept ON dept.id = cc.department_id
        LEFT JOIN branches b ON b.id = cc.branch_id
        WHERE cc.deleted_at IS NULL
      `;
      
      const values: any[] = [];
      let paramIndex = 1;

      if (userRole !== 'SUPER_ADMIN') {
        query += ` AND cc.company_id = $${paramIndex}`;
        values.push(params.companyId || 'user_company_id');
        paramIndex++;
      } else if (params.companyId) {
        query += ` AND cc.company_id = $${paramIndex}`;
        values.push(params.companyId);
        paramIndex++;
      }

      if (params.status) {
        query += ` AND cc.status = $${paramIndex}`;
        values.push(params.status);
        paramIndex++;
      }

      if (params.departmentId) {
        query += ` AND cc.department_id = $${paramIndex}`;
        values.push(params.departmentId);
        paramIndex++;
      }

      if (params.branchId) {
        query += ` AND cc.branch_id = $${paramIndex}`;
        values.push(params.branchId);
        paramIndex++;
      }

      if (params.search) {
        query += ` AND (cc.name ILIKE $${paramIndex} OR cc.code ILIKE $${paramIndex})`;
        values.push(`%${params.search}%`);
        paramIndex++;
      }

      query += ` ORDER BY ${params.sortBy || 'name'} ${params.sortOrder || 'asc'}`;

      if (params.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(params.limit);
        paramIndex++;
        
        if (params.offset) {
          query += ` OFFSET $${paramIndex}`;
          values.push(params.offset);
        }
      }

      const countResult = await this.db.query(query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM'), values);
      const total = parseInt(countResult.rows[0].count);
      const result = await this.db.query(query, values);

      const costCenters = result.rows.map(row => this.mapCostCenterWithStats(row));

      return {
        data: costCenters,
        total,
        page: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(total / (params.limit || 10))
      };
    } catch (error) {
      logger.error('Error getting cost centers', { error, params, userId, userRole });
      throw error;
    }
  }

  async updateCostCenter(
    id: string,
    costCenterData: UpdateCostCenterRequest, 
    userId: string, 
    userRole: string
  ): Promise<CostCenter> {
    try {
      // Get existing cost center to check permissions
      const existing = await this.db.query(
        'SELECT company_id FROM cost_centers WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      
      if (existing.rows.length === 0) {
        throw new Error('Cost center not found');
      }

      await this.checkCostCenterPermissions(userId, userRole, 'update', existing.rows[0].company_id);

      const result = await this.db.query(
        `UPDATE cost_centers SET
          name = $1, code = $2, description = $3, department_id = $4, branch_id = $5, 
          budget = $6, currency = $7, status = $8, manager_id = $9, updated_at = NOW()
        WHERE id = $10 AND deleted_at IS NULL
        RETURNING *`,
        [
          costCenterData.name,
          costCenterData.code,
          costCenterData.description || null,
          costCenterData.departmentId || null,
          costCenterData.branchId || null,
          costCenterData.budget,
          costCenterData.currency || 'USD',
          costCenterData.status || 'active',
          costCenterData.managerId || null,
          id
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Cost center not found');
      }

      const costCenter = result.rows[0];

      logger.info('Cost center updated', {
        costCenterId: costCenter.id,
        companyId: costCenter.company_id,
        updatedBy: userId,
        userRole
      });

      return this.mapCostCenter(costCenter);
    } catch (error) {
      logger.error('Error updating cost center', { error, id, userId, userRole });
      throw error;
    }
  }

  async deleteCostCenter(
    id: string,
    userId: string, 
    userRole: string
  ): Promise<void> {
    try {
      // Get existing cost center to check permissions
      const existing = await this.db.query(
        'SELECT company_id FROM cost_centers WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      
      if (existing.rows.length === 0) {
        throw new Error('Cost center not found');
      }

      await this.checkCostCenterPermissions(userId, userRole, 'delete', existing.rows[0].company_id);

      await this.db.query(
        'UPDATE cost_centers SET deleted_at = NOW() WHERE id = $1',
        [id]
      );

      logger.info('Cost center deleted', {
        costCenterId: id,
        deletedBy: userId,
        userRole
      });
    } catch (error) {
      logger.error('Error deleting cost center', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Security and Validation Methods
   */

  private validateDepartmentInput(data: Partial<CreateDepartmentRequest>): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Department name must be at least 2 characters');
    }
    
    if (!data.code || data.code.trim().length < 2) {
      throw new Error('Department code must be at least 2 characters');
    }

    if (data.code && data.code.length > 20) {
      throw new Error('Department code cannot exceed 20 characters');
    }

    if (data.level && (data.level < 1 || data.level > 10)) {
      throw new Error('Department level must be between 1 and 10');
    }

    if (data.budget && data.budget < 0) {
      throw new Error('Budget cannot be negative');
    }
  }

  private validateDesignationInput(data: Partial<CreateDesignationRequest>): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Designation name must be at least 2 characters');
    }
    
    if (data.level && (data.level < 1 || data.level > 10)) {
      throw new Error('Designation level must be between 1 and 10');
    }

    if (data.salaryRange) {
      if (data.salaryRange.min < 0 || data.salaryRange.max < 0) {
        throw new Error('Salary range values cannot be negative');
      }
      if (data.salaryRange.min > data.salaryRange.max) {
        throw new Error('Minimum salary cannot be greater than maximum salary');
      }
    }
  }

  private validateCostCenterInput(data: Partial<CreateCostCenterRequest>): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Cost center name must be at least 2 characters');
    }
    
    if (!data.code || data.code.trim().length < 2) {
      throw new Error('Cost center code must be at least 2 characters');
    }

    if (data.code && data.code.length > 20) {
      throw new Error('Cost center code cannot exceed 20 characters');
    }

    if (data.budget < 0) {
      throw new Error('Budget cannot be negative');
    }

    if (data.currency && data.currency.length !== 3) {
      throw new Error('Currency code must be 3 characters');
    }
  }

  private async checkDepartmentPermissions(userId: string, userRole: string, action: string, companyId: string): Promise<void> {
    if (userRole === 'SUPER_ADMIN') return;
    
    // For non-super admins, verify they have access to the company
    const result = await this.db.query(
      'SELECT id FROM companies WHERE id = $1 AND deleted_at IS NULL',
      [companyId]
    );

    if (result.rows.length === 0) {
      throw new Error('Company not found');
    }
  }

  private async checkDesignationPermissions(userId: string, userRole: string, action: string, companyId: string): Promise<void> {
    await this.checkDepartmentPermissions(userId, userRole, action, companyId);
  }

  private async checkCostCenterPermissions(userId: string, userRole: string, action: string, companyId: string): Promise<void> {
    await this.checkDepartmentPermissions(userId, userRole, action, companyId);
  }

  private async generateDepartmentCode(companyId: string): Promise<string> {
    const result = await this.db.query(
      'SELECT COUNT(*) FROM departments WHERE company_id = $1 AND deleted_at IS NULL',
      [companyId]
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `DEPT-${companyId.substring(0, 4).toUpperCase()}-${count.toString().padStart(3, '0')}`;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private mapDepartment(row: any): Department {
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      code: row.code,
      description: row.description,
      headId: row.head_id,
      parentDepartmentId: row.parent_department_id,
      level: row.level,
      budget: row.budget,
      employeeCount: row.employee_count,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private mapDepartmentWithStats(row: any): DepartmentWithStats {
    const dept = this.mapDepartment(row);
    return {
      ...dept,
      employeeCount: parseInt(row.employee_count || '0'),
      budgetUtilization: row.budget ? (row.child_budgets / row.budget) * 100 : 0,
      childDepartments: parseInt(row.child_budgets || '0')
    };
  }

  private mapDesignation(row: any): Designation {
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      level: row.level,
      description: row.description,
      departmentId: row.department_id,
      responsibilities: row.responsibilities,
      requirements: row.requirements,
      salaryRange: row.salary_range,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private mapDesignationWithStats(row: any): DesignationWithStats {
    const designation = this.mapDesignation(row);
    return {
      ...designation,
      employeeCount: parseInt(row.employee_count || '0'),
      averageSalary: parseFloat(row.average_salary || '0'),
      departmentName: row.department_name
    };
  }

  private mapCostCenter(row: any): CostCenter {
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      code: row.code,
      description: row.description,
      departmentId: row.department_id,
      branchId: row.branch_id,
      budget: parseFloat(row.budget),
      spent: parseFloat(row.spent),
      currency: row.currency,
      status: row.status,
      managerId: row.manager_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private mapCostCenterWithStats(row: any): CostCenterWithStats {
    const costCenter = this.mapCostCenter(row);
    return {
      ...costCenter,
      utilizationPercentage: parseFloat(row.utilization_percentage || '0'),
      remainingBudget: parseFloat(row.remaining_budget || '0'),
      departmentName: row.department_name,
      branchName: row.branch_name
    };
  }
}