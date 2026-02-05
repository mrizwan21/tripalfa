import { Database } from '../utils/database.js';
import { 
  Company, 
  CompanyCreate, 
  CompanyUpdate, 
  Branch, 
  BranchCreate, 
  BranchUpdate,
  ApiResponse,
  PaginatedResponse,
  CompanyType,
  BranchType
} from '../types/auth.js';
import { SecurityMiddleware, sanitizeEmail, sanitizePhone } from '../middleware/security.js';
import { logger } from '../utils/logger.js';

export class CompanyService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  /**
   * Get all companies with pagination and search
   */
  async getCompanies(
    page: number = 1, 
    limit: number = 10, 
    search?: string,
    companyId?: string
  ): Promise<PaginatedResponse<Company>> {
    try {
      // Validate pagination parameters
      const validatedPage = Math.max(1, Math.floor(page));
      const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit)));

      // Sanitize search input
      const sanitizedSearch = search ? SecurityMiddleware.sanitizeInput(search) : undefined;

      // If companyId is provided, filter by that company only
      let whereClause = 'WHERE deleted_at IS NULL';
      const params: any[] = [];
      let paramIndex = 1;

      if (sanitizedSearch) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        params.push(`%${sanitizedSearch}%`);
        paramIndex++;
      }

      if (companyId) {
        whereClause += ` AND id = $${paramIndex}`;
        params.push(companyId);
        paramIndex++;
      }

      const offset = (validatedPage - 1) * validatedLimit;

      // Get total count
      const countResult = await this.db.query(
        `SELECT COUNT(*) as total FROM companies ${whereClause}`,
        params
      );

      const total = parseInt(countResult.rows[0].total);

      // Get companies
      const result = await this.db.query(
        `SELECT * FROM companies ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, validatedLimit, offset]
      );

      return {
        data: result.rows,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit)
        }
      };
    } catch (error) {
      logger.error('Failed to get companies', error);
      throw new Error('Failed to retrieve companies');
    }
  }

  /**
   * Get company by ID
   */
  async getCompanyById(id: string): Promise<Company | null> {
    try {
      // Sanitize input
      const sanitizedId = SecurityMiddleware.sanitizeInput(id);
      
      return await this.db.findCompanyById(sanitizedId);
    } catch (error) {
      logger.error('Failed to get company', error);
      throw new Error('Failed to retrieve company');
    }
  }

  /**
   * Create a new company
   */
  async createCompany(companyData: CompanyCreate): Promise<Company> {
    try {
      // Sanitize input data
      const sanitizedData = {
        ...companyData,
        name: SecurityMiddleware.sanitizeInput(companyData.name),
        legalName: companyData.legalName ? SecurityMiddleware.sanitizeInput(companyData.legalName) : undefined,
        email: sanitizeEmail(companyData.email),
        phone: companyData.phone ? sanitizePhone(companyData.phone) : undefined,
        website: companyData.website ? SecurityMiddleware.sanitizeInput(companyData.website) : undefined,
        address: companyData.address ? {
          ...companyData.address,
          street: companyData.address.street ? SecurityMiddleware.sanitizeInput(companyData.address.street) : undefined,
          city: companyData.address.city ? SecurityMiddleware.sanitizeInput(companyData.address.city) : undefined,
          country: companyData.address.country ? SecurityMiddleware.sanitizeInput(companyData.address.country) : undefined,
          postalCode: companyData.address.postalCode ? SecurityMiddleware.sanitizeInput(companyData.address.postalCode) : undefined,
        } : undefined,
        billingAddress: companyData.billingAddress ? {
          ...companyData.billingAddress,
          street: companyData.billingAddress.street ? SecurityMiddleware.sanitizeInput(companyData.billingAddress.street) : undefined,
          city: companyData.billingAddress.city ? SecurityMiddleware.sanitizeInput(companyData.billingAddress.city) : undefined,
          country: companyData.billingAddress.country ? SecurityMiddleware.sanitizeInput(companyData.billingAddress.country) : undefined,
          postalCode: companyData.billingAddress.postalCode ? SecurityMiddleware.sanitizeInput(companyData.billingAddress.postalCode) : undefined,
        } : undefined,
      };

      // Validate required fields
      if (!sanitizedData.name || sanitizedData.name.trim().length < 2) {
        throw new Error('Company name must be at least 2 characters');
      }

      if (!sanitizedData.email || !SecurityMiddleware.validateEmail(sanitizedData.email)) {
        throw new Error('Invalid email format');
      }

      // Check if company with same email already exists
      const existingCompany = await this.db.query(
        'SELECT id FROM companies WHERE email = $1 AND deleted_at IS NULL',
        [sanitizedData.email]
      );

      if (existingCompany.rows.length > 0) {
        throw new Error('Company with this email already exists');
      }

      // Create company
      const company: Company = {
        id: crypto.randomUUID(),
        code: sanitizedData.code || this.generateCompanyCode(sanitizedData.name),
        name: sanitizedData.name,
        legalName: sanitizedData.legalName,
        taxId: sanitizedData.taxId,
        registrationNo: sanitizedData.registrationNo,
        type: (sanitizedData.type || 'CORPORATE') as CompanyType,
        status: (sanitizedData.status || 'ACTIVE') as any,
        parentCompanyId: sanitizedData.parentCompanyId,
        logo: sanitizedData.logo,
        website: sanitizedData.website,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        address: sanitizedData.address,
        billingAddress: sanitizedData.billingAddress,
        settings: sanitizedData.settings || {},
        creditLimit: sanitizedData.creditLimit || 0,
        currentBalance: 0,
        currency: sanitizedData.currency || 'USD',
        timezone: sanitizedData.timezone || 'UTC',
        locale: sanitizedData.locale || 'en',
        contractStartDate: sanitizedData.contractStartDate,
        contractEndDate: sanitizedData.contractEndDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined
      };

      const createdCompany = await this.db.createCompany(company);

      logger.info(`Company created: ${createdCompany.name}`, { companyId: createdCompany.id });

      return createdCompany;
    } catch (error) {
      logger.error('Failed to create company', error);
      throw error;
    }
  }

  /**
   * Update company
   */
  async updateCompany(id: string, updates: CompanyUpdate): Promise<Company> {
    try {
      // Sanitize input
      const sanitizedId = SecurityMiddleware.sanitizeInput(id);
      const sanitizedUpdates = {
        ...updates,
        name: updates.name ? SecurityMiddleware.sanitizeInput(updates.name) : undefined,
        legalName: updates.legalName ? SecurityMiddleware.sanitizeInput(updates.legalName) : undefined,
        email: updates.email ? SecurityMiddleware.sanitizeEmail(updates.email) : undefined,
        phone: updates.phone ? SecurityMiddleware.sanitizePhone(updates.phone) : undefined,
        website: updates.website ? SecurityMiddleware.sanitizeInput(updates.website) : undefined,
        address: updates.address ? {
          ...updates.address,
          street: updates.address.street ? SecurityMiddleware.sanitizeInput(updates.address.street) : undefined,
          city: updates.address.city ? SecurityMiddleware.sanitizeInput(updates.address.city) : undefined,
          country: updates.address.country ? SecurityMiddleware.sanitizeInput(updates.address.country) : undefined,
          postalCode: updates.address.postalCode ? SecurityMiddleware.sanitizeInput(updates.address.postalCode) : undefined,
        } : undefined,
        billingAddress: updates.billingAddress ? {
          ...updates.billingAddress,
          street: updates.billingAddress.street ? SecurityMiddleware.sanitizeInput(updates.billingAddress.street) : undefined,
          city: updates.billingAddress.city ? SecurityMiddleware.sanitizeInput(updates.billingAddress.city) : undefined,
          country: updates.billingAddress.country ? SecurityMiddleware.sanitizeInput(updates.billingAddress.country) : undefined,
          postalCode: updates.billingAddress.postalCode ? SecurityMiddleware.sanitizeInput(updates.billingAddress.postalCode) : undefined,
        } : undefined,
      };

      // Check if company exists
      const existingCompany = await this.db.findCompanyById(sanitizedId);
      if (!existingCompany) {
        throw new Error('Company not found');
      }

      // Check for email conflicts if email is being updated
      if (sanitizedUpdates.email && sanitizedUpdates.email !== existingCompany.email) {
        const emailConflict = await this.db.query(
          'SELECT id FROM companies WHERE email = $1 AND id != $2 AND deleted_at IS NULL',
          [sanitizedUpdates.email, sanitizedId]
        );

        if (emailConflict.rows.length > 0) {
          throw new Error('Company with this email already exists');
        }
      }

      // Update company
      const updatedCompany = await this.db.updateCompany(sanitizedId, sanitizedUpdates);

      logger.info(`Company updated: ${updatedCompany.name}`, { companyId: updatedCompany.id });

      return updatedCompany;
    } catch (error) {
      logger.error('Failed to update company', error);
      throw error;
    }
  }

  /**
   * Delete company (soft delete)
   */
  async deleteCompany(id: string): Promise<void> {
    try {
      const sanitizedId = SecurityMiddleware.sanitizeInput(id);

      // Check if company exists
      const existingCompany = await this.db.findCompanyById(sanitizedId);
      if (!existingCompany) {
        throw new Error('Company not found');
      }

      // Soft delete by setting deleted_at
      await this.db.query(
        'UPDATE companies SET deleted_at = NOW() WHERE id = $1',
        [sanitizedId]
      );

      logger.info(`Company deleted: ${existingCompany.name}`, { companyId: existingCompany.id });
    } catch (error) {
      logger.error('Failed to delete company', error);
      throw error;
    }
  }

  /**
   * Get branches for a company
   */
  async getBranchesByCompany(companyId: string): Promise<Branch[]> {
    try {
      const sanitizedCompanyId = SecurityMiddleware.sanitizeInput(companyId);
      
      return await this.db.getBranchesByCompany(sanitizedCompanyId);
    } catch (error) {
      logger.error('Failed to get branches', error);
      throw new Error('Failed to retrieve branches');
    }
  }

  /**
   * Create branch for a company
   */
  async createBranch(branchData: BranchCreate): Promise<Branch> {
    try {
      // Sanitize input data
      const sanitizedData = {
        ...branchData,
        name: SecurityMiddleware.sanitizeInput(branchData.name),
        email: branchData.email ? SecurityMiddleware.sanitizeEmail(branchData.email) : undefined,
        phone: branchData.phone ? SecurityMiddleware.sanitizePhone(branchData.phone) : undefined,
        address: branchData.address ? {
          ...branchData.address,
          street: branchData.address.street ? SecurityMiddleware.sanitizeInput(branchData.address.street) : undefined,
          city: branchData.address.city ? SecurityMiddleware.sanitizeInput(branchData.address.city) : undefined,
          country: branchData.address.country ? SecurityMiddleware.sanitizeInput(branchData.address.country) : undefined,
          postalCode: branchData.address.postalCode ? SecurityMiddleware.sanitizeInput(branchData.address.postalCode) : undefined,
        } : undefined,
      };

      // Validate required fields
      if (!sanitizedData.name || sanitizedData.name.trim().length < 2) {
        throw new Error('Branch name must be at least 2 characters');
      }

      // Check if company exists
      const company = await this.db.findCompanyById(sanitizedData.companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Create branch
      const branch: Branch = {
        id: crypto.randomUUID(),
        companyId: sanitizedData.companyId,
        code: sanitizedData.code || this.generateBranchCode(sanitizedData.name),
        name: sanitizedData.name,
        type: (sanitizedData.type || 'OFFICE') as BranchType,
        status: (sanitizedData.status || 'ACTIVE') as any,
        isHeadOffice: sanitizedData.isHeadOffice || false,
        managerUserId: sanitizedData.managerUserId,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        address: sanitizedData.address,
        operatingHours: sanitizedData.operatingHours,
        allowedServices: sanitizedData.allowedServices || [],
        bookingLimit: sanitizedData.bookingLimit,
        settings: sanitizedData.settings || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined
      };

      const createdBranch = await this.db.createBranch(branch);

      logger.info(`Branch created: ${createdBranch.name}`, { branchId: createdBranch.id, companyId: createdBranch.companyId });

      return createdBranch;
    } catch (error) {
      logger.error('Failed to create branch', error);
      throw error;
    }
  }

  /**
   * Update branch
   */
  async updateBranch(id: string, updates: BranchUpdate): Promise<Branch> {
    try {
      const sanitizedId = SecurityMiddleware.sanitizeInput(id);
      const sanitizedUpdates = {
        ...updates,
        name: updates.name ? SecurityMiddleware.sanitizeInput(updates.name) : undefined,
        email: updates.email ? SecurityMiddleware.sanitizeEmail(updates.email) : undefined,
        phone: updates.phone ? SecurityMiddleware.sanitizePhone(updates.phone) : undefined,
        address: updates.address ? {
          ...updates.address,
          street: updates.address.street ? SecurityMiddleware.sanitizeInput(updates.address.street) : undefined,
          city: updates.address.city ? SecurityMiddleware.sanitizeInput(updates.address.city) : undefined,
          country: updates.address.country ? SecurityMiddleware.sanitizeInput(updates.address.country) : undefined,
          postalCode: updates.address.postalCode ? SecurityMiddleware.sanitizeInput(updates.address.postalCode) : undefined,
        } : undefined,
      };

      // Check if branch exists
      const existingBranch = await this.db.findBranchById(sanitizedId);
      if (!existingBranch) {
        throw new Error('Branch not found');
      }

      // Update branch
      const updatedBranch = await this.db.updateBranch(sanitizedId, sanitizedUpdates);

      logger.info(`Branch updated: ${updatedBranch.name}`, { branchId: updatedBranch.id });

      return updatedBranch;
    } catch (error) {
      logger.error('Failed to update branch', error);
      throw error;
    }
  }

  /**
   * Generate company code from name
   */
  private generateCompanyCode(name: string): string {
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
    
    return code || `COMP${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Generate branch code from name
   */
  private generateBranchCode(name: string): string {
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4);
    
    return code || `BR${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }
}

export const companyService = new CompanyService();