import { Pool, PoolClient } from 'pg';
import { User, Company, Branch, LoginAttempt, SecurityEvent } from '../types/auth.js';

export class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/tripalfa_b2b',
      // In production, require certificate verification and allow providing a CA via DATABASE_SSL_CA
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true,
        ...(process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA } : {})
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Get a database client
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Execute a query
   */
  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    const result = await this.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create user
   */
  async createUser(user: User): Promise<User> {
    const result = await this.query(
      `INSERT INTO users (
        id, email, name, phone, password, is_active, is_verified, role, 
        company_id, branch_id, created_at, updated_at, failed_login_attempts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        user.id, user.email, user.name, user.phone, user.password,
        user.isActive, user.isVerified, user.role, user.companyId,
        user.branchId, user.createdAt, user.updatedAt, user.failedLoginAttempts
      ]
    );
    return result.rows[0];
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];

    const result = await this.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Find company by ID
   */
  async findCompanyById(id: string): Promise<Company | null> {
    const result = await this.query(
      'SELECT * FROM companies WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create company
   */
  async createCompany(company: Company): Promise<Company> {
    const result = await this.query(
      `INSERT INTO companies (
        id, code, name, legal_name, tax_id, registration_no, type, status,
        parent_company_id, logo, website, email, phone, address, billing_address,
        settings, credit_limit, current_balance, currency, timezone, locale,
        contract_start_date, contract_end_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`,
      [
        company.id, company.code, company.name, company.legalName, company.taxId,
        company.registrationNo, company.type, company.status, company.parentCompanyId,
        company.logo, company.website, company.email, company.phone, company.address,
        company.billingAddress, company.settings, company.creditLimit, company.currentBalance,
        company.currency, company.timezone, company.locale, company.contractStartDate,
        company.contractEndDate, company.createdAt, company.updatedAt
      ]
    );
    return result.rows[0];
  }

  /**
   * Update company
   */
  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];

    const result = await this.query(
      `UPDATE companies SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Find branch by ID
   */
  async findBranchById(id: string): Promise<Branch | null> {
    const result = await this.query(
      'SELECT * FROM branches WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create branch
   */
  async createBranch(branch: Branch): Promise<Branch> {
    const result = await this.query(
      `INSERT INTO branches (
        id, company_id, code, name, type, status, is_head_office,
        manager_user_id, email, phone, address, operating_hours,
        allowed_services, booking_limit, settings, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        branch.id, branch.companyId, branch.code, branch.name, branch.type,
        branch.status, branch.isHeadOffice, branch.managerUserId, branch.email,
        branch.phone, branch.address, branch.operatingHours, branch.allowedServices,
        branch.bookingLimit, branch.settings, branch.createdAt, branch.updatedAt
      ]
    );
    return result.rows[0];
  }

  /**
   * Update branch
   */
  async updateBranch(id: string, updates: Partial<Branch>): Promise<Branch> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];

    const result = await this.query(
      `UPDATE branches SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Create login attempt
   */
  async createLoginAttempt(loginAttempt: LoginAttempt): Promise<LoginAttempt> {
    const result = await this.query(
      `INSERT INTO login_attempts (
        id, email, ip_address, user_agent, success, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        loginAttempt.id, loginAttempt.email, loginAttempt.ipAddress,
        loginAttempt.userAgent, loginAttempt.success, loginAttempt.createdAt
      ]
    );
    return result.rows[0];
  }

  /**
   * Create security event
   */
  async createSecurityEvent(securityEvent: SecurityEvent): Promise<SecurityEvent> {
    const result = await this.query(
      `INSERT INTO security_events (
        id, user_id, action, resource, details, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        securityEvent.id, securityEvent.userId, securityEvent.action,
        securityEvent.resource, securityEvent.details, securityEvent.ipAddress,
        securityEvent.userAgent, securityEvent.createdAt
      ]
    );
    return result.rows[0];
  }

  /**
   * Get companies with pagination
   */
  async getCompanies(page: number = 1, limit: number = 10, search?: string): Promise<{ data: Company[]; total: number }> {
    let whereClause = 'WHERE deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const offset = (page - 1) * limit;

    const countResult = await this.query(
      `SELECT COUNT(*) as total FROM companies ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    const result = await this.query(
      `SELECT * FROM companies ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      data: result.rows,
      total
    };
  }

  /**
   * Get branches for a company
   */
  async getBranchesByCompany(companyId: string): Promise<Branch[]> {
    const result = await this.query(
      'SELECT * FROM branches WHERE company_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [companyId]
    );
    return result.rows;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private db: Database;

  private constructor() {
    this.db = new Database();
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<PoolClient> {
    return this.db.getClient();
  }
}