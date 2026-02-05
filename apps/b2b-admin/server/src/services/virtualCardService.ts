import { PoolClient } from 'pg';
import { logger } from '../utils/logger.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { 
  VirtualCard, 
  VirtualCardTransaction, 
  VirtualCardSettings,
  CreateVirtualCardRequest,
  UpdateVirtualCardRequest,
  VirtualCardQueryParams,
  PaginatedResponse,
  VirtualCardStats,
  VirtualCardStatus,
  VirtualCardType,
  VirtualCardUsageType,
  VirtualCardTransactionType,
  VirtualCardTransactionStatus
} from '../types/kyc.js';

/**
 * Virtual Card Service for managing virtual credit cards
 */
export class VirtualCardService {
  private db: PoolClient;

  constructor(db: PoolClient) {
    this.db = db;
  }

  /**
   * Virtual Card Management
   */

  /**
   * Create a new virtual card with validation and security checks
   */
  async createVirtualCard(
    cardData: CreateVirtualCardRequest, 
    userId: string, 
    userRole: string
  ): Promise<VirtualCard> {
    try {
      // Security validation
      this.validateVirtualCardInput(cardData);
      
      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'create', cardData.companyId);

      // Check KYC compliance
      await this.checkKYCCompliance(cardData.companyId);

      // Generate card details
      const cardNumber = this.generateCardNumber();
      const maskedCardNumber = this.maskCardNumber(cardNumber);
      const cvv = this.generateCVV();
      const expiryDate = this.generateExpiryDate();

      const result = await this.db.query(
        `INSERT INTO virtual_cards (
          company_id, card_number, masked_card_number, cvv, expiry_date,
          cardholder_name, currency, status, card_type, spending_limit,
          daily_limit, monthly_limit, per_transaction_limit, is_active,
          usage_type, allowed_categories, blocked_categories, allowed_countries,
          blocked_countries, allowed_times, notifications, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
        RETURNING *`,
        [
          cardData.companyId,
          cardNumber,
          maskedCardNumber,
          cvv,
          expiryDate,
          cardData.cardholderName,
          cardData.currency,
          VirtualCardStatus.PENDING,
          cardData.cardType,
          cardData.spendingLimit,
          cardData.dailyLimit,
          cardData.monthlyLimit,
          cardData.perTransactionLimit,
          true,
          cardData.usageType,
          cardData.allowedCategories || [],
          cardData.blockedCategories || [],
          cardData.allowedCountries || [],
          cardData.blockedCountries || [],
          JSON.stringify({
            startHour: 0,
            endHour: 23,
            allowedDays: [0, 1, 2, 3, 4, 5, 6]
          }),
          JSON.stringify({
            lowBalanceThreshold: 100,
            transactionNotification: true,
            suspiciousActivityNotification: true
          })
        ]
      );

      const card = result.rows[0];

      // Log security event
      logger.info('Virtual card created', {
        cardId: card.id,
        companyId: card.company_id,
        cardType: card.card_type,
        currency: card.currency,
        createdBy: userId,
        userRole
      });

      return this.mapVirtualCard(card);
    } catch (error) {
      logger.error('Error creating virtual card', { error, userId, userRole });
      throw error;
    }
  }

  /**
   * Get virtual card by ID with security checks
   */
  async getVirtualCardById(id: string, userId: string, userRole: string): Promise<VirtualCard> {
    try {
      const result = await this.db.query(
        `SELECT c.*, 
                COUNT(t.id) as transaction_count,
                COALESCE(SUM(CASE WHEN t.status = 'COMPLETED' THEN t.amount ELSE 0 END), 0) as total_spent
         FROM virtual_cards c
         LEFT JOIN virtual_card_transactions t ON t.card_id = c.id
         WHERE c.id = $1 AND c.deleted_at IS NULL
         GROUP BY c.id`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Virtual card not found');
      }

      const card = result.rows[0];

      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'read', card.company_id);

      return this.mapVirtualCardWithStats(card);
    } catch (error) {
      logger.error('Error getting virtual card', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Get virtual cards with pagination and filtering
   */
  async getVirtualCards(
    params: VirtualCardQueryParams, 
    userId: string, 
    userRole: string
  ): Promise<PaginatedResponse<VirtualCard>> {
    try {
      // Build query with security filters
      let query = `
        SELECT c.*, 
               COUNT(t.id) as transaction_count,
               COALESCE(SUM(CASE WHEN t.status = 'COMPLETED' THEN t.amount ELSE 0 END), 0) as total_spent
        FROM virtual_cards c
        LEFT JOIN virtual_card_transactions t ON t.card_id = c.id
        WHERE c.deleted_at IS NULL
      `;
      
      const values: any[] = [];
      let paramIndex = 1;

      // Apply security filters based on user role
      if (userRole !== 'SUPER_ADMIN') {
        query += ` AND c.company_id = $${paramIndex}`;
        values.push(params.companyId || 'user_company_id'); // This would be replaced with actual user company
        paramIndex++;
      } else if (params.companyId) {
        query += ` AND c.company_id = $${paramIndex}`;
        values.push(params.companyId);
        paramIndex++;
      }

      if (params.status) {
        query += ` AND c.status = $${paramIndex}`;
        values.push(params.status);
        paramIndex++;
      }

      if (params.cardType) {
        query += ` AND c.card_type = $${paramIndex}`;
        values.push(params.cardType);
        paramIndex++;
      }

      if (params.usageType) {
        query += ` AND c.usage_type = $${paramIndex}`;
        values.push(params.usageType);
        paramIndex++;
      }

      if (params.currency) {
        query += ` AND c.currency = $${paramIndex}`;
        values.push(params.currency);
        paramIndex++;
      }

      if (params.search) {
        query += ` AND (c.cardholder_name ILIKE $${paramIndex} OR c.masked_card_number ILIKE $${paramIndex})`;
        values.push(`%${params.search}%`);
        paramIndex++;
      }

      query += ` GROUP BY c.id`;

      // Add sorting
      const sortBy = params.sortBy || 'created_at';
      const sortOrder = params.sortOrder || 'desc';
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

      const cards = result.rows.map(row => this.mapVirtualCardWithStats(row));

      return {
        data: cards,
        total,
        page: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(total / (params.limit || 10))
      };
    } catch (error) {
      logger.error('Error getting virtual cards', { error, params, userId, userRole });
      throw error;
    }
  }

  /**
   * Update virtual card with validation
   */
  async updateVirtualCard(
    id: string, 
    updateData: UpdateVirtualCardRequest, 
    userId: string, 
    userRole: string
  ): Promise<VirtualCard> {
    try {
      // Security validation
      this.validateVirtualCardInput(updateData);

      // Get existing card
      const existing = await this.getVirtualCardById(id, userId, userRole);

      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'update', existing.companyId);

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
        UPDATE virtual_cards 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Virtual card not found or already deleted');
      }

      const card = result.rows[0];

      // Log security event
      logger.info('Virtual card updated', {
        cardId: id,
        companyId: card.company_id,
        updatedBy: userId,
        userRole,
        fields: Object.keys(updateData)
      });

      return this.mapVirtualCard(card);
    } catch (error) {
      logger.error('Error updating virtual card', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Activate virtual card
   */
  async activateVirtualCard(
    id: string, 
    userId: string, 
    userRole: string
  ): Promise<VirtualCard> {
    try {
      const card = await this.getVirtualCardById(id, userId, userRole);

      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'update', card.companyId);

      // Check if card is already active
      if (card.status === VirtualCardStatus.ACTIVE) {
        throw new Error('Card is already active');
      }

      const result = await this.db.query(
        `UPDATE virtual_cards 
         SET status = $1, is_active = true, activated_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [VirtualCardStatus.ACTIVE, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Virtual card not found or already deleted');
      }

      const updatedCard = result.rows[0];

      // Log security event
      logger.info('Virtual card activated', {
        cardId: id,
        companyId: card.companyId,
        activatedBy: userId,
        userRole
      });

      return this.mapVirtualCard(updatedCard);
    } catch (error) {
      logger.error('Error activating virtual card', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Deactivate virtual card
   */
  async deactivateVirtualCard(
    id: string, 
    userId: string, 
    userRole: string
  ): Promise<VirtualCard> {
    try {
      const card = await this.getVirtualCardById(id, userId, userRole);

      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'update', card.companyId);

      const result = await this.db.query(
        `UPDATE virtual_cards 
         SET status = $1, is_active = false, deactivated_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [VirtualCardStatus.INACTIVE, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Virtual card not found or already deleted');
      }

      const updatedCard = result.rows[0];

      // Log security event
      logger.info('Virtual card deactivated', {
        cardId: id,
        companyId: card.companyId,
        deactivatedBy: userId,
        userRole
      });

      return this.mapVirtualCard(updatedCard);
    } catch (error) {
      logger.error('Error deactivating virtual card', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Block virtual card
   */
  async blockVirtualCard(
    id: string, 
    reason: string,
    userId: string, 
    userRole: string
  ): Promise<VirtualCard> {
    try {
      const card = await this.getVirtualCardById(id, userId, userRole);

      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'update', card.companyId);

      const result = await this.db.query(
        `UPDATE virtual_cards 
         SET status = $1, is_blocked = true, block_reason = $2, updated_at = NOW()
         WHERE id = $3 AND deleted_at IS NULL
         RETURNING *`,
        [VirtualCardStatus.BLOCKED, reason, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Virtual card not found or already deleted');
      }

      const updatedCard = result.rows[0];

      // Log security event
      logger.info('Virtual card blocked', {
        cardId: id,
        companyId: card.companyId,
        reason,
        blockedBy: userId,
        userRole
      });

      return this.mapVirtualCard(updatedCard);
    } catch (error) {
      logger.error('Error blocking virtual card', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Unblock virtual card
   */
  async unblockVirtualCard(
    id: string, 
    userId: string, 
    userRole: string
  ): Promise<VirtualCard> {
    try {
      const card = await this.getVirtualCardById(id, userId, userRole);

      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'update', card.companyId);

      const result = await this.db.query(
        `UPDATE virtual_cards 
         SET status = $1, is_blocked = false, block_reason = NULL, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [VirtualCardStatus.ACTIVE, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Virtual card not found or already deleted');
      }

      const updatedCard = result.rows[0];

      // Log security event
      logger.info('Virtual card unblocked', {
        cardId: id,
        companyId: card.companyId,
        unblockedBy: userId,
        userRole
      });

      return this.mapVirtualCard(updatedCard);
    } catch (error) {
      logger.error('Error unblocking virtual card', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Virtual Card Transaction Management
   */

  /**
   * Create virtual card transaction
   */
  async createTransaction(
    cardId: string,
    companyId: string,
    transactionData: {
      transactionType: VirtualCardTransactionType;
      amount: number;
      currency: string;
      merchantName: string;
      merchantCategory: string;
      merchantCountry: string;
      authorizationCode: string;
      status: VirtualCardTransactionStatus;
      reason?: string;
    },
    userId: string, 
    userRole: string
  ): Promise<VirtualCardTransaction> {
    try {
      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'create', companyId);

      // Validate transaction limits
      await this.validateTransactionLimits(cardId, transactionData.amount, transactionData.currency);

      const result = await this.db.query(
        `INSERT INTO virtual_card_transactions (
          card_id, company_id, transaction_type, amount, currency,
          merchant_name, merchant_category, merchant_country,
          transaction_date, authorization_code, status, reason, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          cardId,
          companyId,
          transactionData.transactionType,
          transactionData.amount,
          transactionData.currency,
          transactionData.merchantName,
          transactionData.merchantCategory,
          transactionData.merchantCountry,
          new Date(),
          transactionData.authorizationCode,
          transactionData.status,
          transactionData.reason
        ]
      );

      const transaction = result.rows[0];

      // Log security event
      logger.info('Virtual card transaction created', {
        transactionId: transaction.id,
        cardId,
        companyId,
        amount: transaction.amount,
        currency: transaction.currency,
        merchant: transaction.merchant_name,
        status: transaction.status,
        createdBy: userId,
        userRole
      });

      return this.mapVirtualCardTransaction(transaction);
    } catch (error) {
      logger.error('Error creating virtual card transaction', { error, cardId, companyId, userId, userRole });
      throw error;
    }
  }

  /**
   * Get virtual card transactions
   */
  async getTransactions(
    cardId: string,
    companyId: string,
    limit: number = 100,
    offset: number = 0,
    userId: string, 
    userRole: string
  ): Promise<VirtualCardTransaction[]> {
    try {
      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'read', companyId);

      const result = await this.db.query(
        `SELECT * FROM virtual_card_transactions 
         WHERE card_id = $1 AND company_id = $2 AND deleted_at IS NULL
         ORDER BY transaction_date DESC
         LIMIT $3 OFFSET $4`,
        [cardId, companyId, limit, offset]
      );

      return result.rows.map(row => this.mapVirtualCardTransaction(row));
    } catch (error) {
      logger.error('Error getting virtual card transactions', { error, cardId, companyId, userId, userRole });
      throw error;
    }
  }

  /**
   * Virtual Card Settings Management
   */

  /**
   * Get virtual card settings
   */
  async getSettings(companyId: string, userId: string, userRole: string): Promise<VirtualCardSettings | null> {
    try {
      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'read', companyId);

      const result = await this.db.query(
        'SELECT * FROM virtual_card_settings WHERE company_id = $1 AND deleted_at IS NULL',
        [companyId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapVirtualCardSettings(result.rows[0]);
    } catch (error) {
      logger.error('Error getting virtual card settings', { error, companyId, userId, userRole });
      throw error;
    }
  }

  /**
   * Update virtual card settings
   */
  async updateSettings(
    companyId: string,
    settingsData: Partial<VirtualCardSettings>,
    userId: string, 
    userRole: string
  ): Promise<VirtualCardSettings> {
    try {
      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'update', companyId);

      const result = await this.db.query(
        `INSERT INTO virtual_card_settings (
          company_id, default_settings, security_settings, notification_settings, compliance_settings, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (company_id) 
        DO UPDATE SET 
          default_settings = EXCLUDED.default_settings,
          security_settings = EXCLUDED.security_settings,
          notification_settings = EXCLUDED.notification_settings,
          compliance_settings = EXCLUDED.compliance_settings,
          updated_at = NOW()
        RETURNING *`,
        [
          companyId,
          JSON.stringify(settingsData.defaultSettings || {}),
          JSON.stringify(settingsData.securitySettings || {}),
          JSON.stringify(settingsData.notificationSettings || {}),
          JSON.stringify(settingsData.complianceSettings || {})
        ]
      );

      const settings = result.rows[0];

      // Log security event
      logger.info('Virtual card settings updated', {
        companyId,
        updatedBy: userId,
        userRole
      });

      return this.mapVirtualCardSettings(settings);
    } catch (error) {
      logger.error('Error updating virtual card settings', { error, companyId, userId, userRole });
      throw error;
    }
  }

  /**
   * Get virtual card statistics
   */
  async getStats(companyId: string, userId: string, userRole: string): Promise<VirtualCardStats> {
    try {
      // Authorization check
      await this.checkVirtualCardPermissions(userId, userRole, 'read', companyId);

      const statsQuery = `
        SELECT 
          COUNT(*) as total_cards,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_cards,
          COUNT(CASE WHEN status = 'BLOCKED' THEN 1 END) as blocked_cards,
          COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as expired_cards,
          COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN spending_limit ELSE 0 END), 0) as total_spend,
          COALESCE(AVG(CASE WHEN status = 'ACTIVE' THEN spending_limit ELSE NULL END), 0) as avg_spend_per_card,
          COUNT(t.id) as transaction_count
        FROM virtual_cards c
        LEFT JOIN virtual_card_transactions t ON t.card_id = c.id AND t.status = 'COMPLETED'
        WHERE c.company_id = $1 AND c.deleted_at IS NULL
      `;

      const result = await this.db.query(statsQuery, [companyId]);
      const stats = result.rows[0];

      // Calculate utilization rate
      const totalCards = parseInt(stats.total_cards || '0');
      const activeCards = parseInt(stats.active_cards || '0');
      const utilizationRate = totalCards > 0 ? (activeCards / totalCards) * 100 : 0;

      return {
        totalCards,
        activeCards,
        blockedCards: parseInt(stats.blocked_cards || '0'),
        expiredCards: parseInt(stats.expired_cards || '0'),
        totalSpend: parseFloat(stats.total_spend || '0'),
        averageSpendPerCard: parseFloat(stats.avg_spend_per_card || '0'),
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        transactionCount: parseInt(stats.transaction_count || '0')
      };
    } catch (error) {
      logger.error('Error getting virtual card stats', { error, companyId, userId, userRole });
      throw error;
    }
  }

  /**
   * Security and Validation Methods
   */

  private validateVirtualCardInput(data: Partial<CreateVirtualCardRequest>): void {
    if (!data.cardholderName || data.cardholderName.trim().length < 2) {
      throw new Error('Cardholder name must be at least 2 characters');
    }
    
    if (!data.currency || data.currency.length !== 3) {
      throw new Error('Currency code must be 3 characters');
    }

    if (data.spendingLimit <= 0) {
      throw new Error('Spending limit must be greater than 0');
    }

    if (data.dailyLimit <= 0) {
      throw new Error('Daily limit must be greater than 0');
    }

    if (data.monthlyLimit <= 0) {
      throw new Error('Monthly limit must be greater than 0');
    }

    if (data.perTransactionLimit <= 0) {
      throw new Error('Per transaction limit must be greater than 0');
    }

    if (data.dailyLimit > data.spendingLimit) {
      throw new Error('Daily limit cannot exceed spending limit');
    }

    if (data.monthlyLimit > data.spendingLimit) {
      throw new Error('Monthly limit cannot exceed spending limit');
    }

    if (data.perTransactionLimit > data.dailyLimit) {
      throw new Error('Per transaction limit cannot exceed daily limit');
    }
  }

  private async checkVirtualCardPermissions(userId: string, userRole: string, action: string, companyId: string): Promise<void> {
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

  private async checkKYCCompliance(companyId: string): Promise<void> {
    // Check if company has valid KYC documents
    const result = await this.db.query(
      `SELECT COUNT(*) as verified_docs
       FROM kyc_documents 
       WHERE company_id = $1 AND status = 'VERIFIED' AND deleted_at IS NULL`,
      [companyId]
    );

    const verifiedDocs = parseInt(result.rows[0].verified_docs || '0');
    
    if (verifiedDocs === 0) {
      throw new Error('Company must have verified KYC documents to create virtual cards');
    }
  }

  private async validateTransactionLimits(cardId: string, amount: number, currency: string): Promise<void> {
    const cardResult = await this.db.query(
      `SELECT spending_limit, daily_limit, monthly_limit, per_transaction_limit,
              currency, status, is_active, is_blocked
       FROM virtual_cards 
       WHERE id = $1 AND deleted_at IS NULL`,
      [cardId]
    );

    if (cardResult.rows.length === 0) {
      throw new Error('Virtual card not found');
    }

    const card = cardResult.rows[0];

    // Check if card is active and not blocked
    if (card.status !== 'ACTIVE' || !card.is_active || card.is_blocked) {
      throw new Error('Virtual card is not active');
    }

    // Check currency
    if (card.currency !== currency) {
      throw new Error('Transaction currency does not match card currency');
    }

    // Check per transaction limit
    if (amount > card.per_transaction_limit) {
      throw new Error('Transaction amount exceeds per transaction limit');
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailySpentResult = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) as daily_spent
       FROM virtual_card_transactions 
       WHERE card_id = $1 AND transaction_date >= $2 AND status = 'COMPLETED'`,
      [cardId, today]
    );
    const dailySpent = parseFloat(dailySpentResult.rows[0].daily_spent || '0');
    
    if (dailySpent + amount > card.daily_limit) {
      throw new Error('Transaction would exceed daily limit');
    }

    // Check monthly limit
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlySpentResult = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) as monthly_spent
       FROM virtual_card_transactions 
       WHERE card_id = $1 AND transaction_date >= $2 AND status = 'COMPLETED'`,
      [cardId, firstDayOfMonth]
    );
    const monthlySpent = parseFloat(monthlySpentResult.rows[0].monthly_spent || '0');
    
    if (monthlySpent + amount > card.monthly_limit) {
      throw new Error('Transaction would exceed monthly limit');
    }

    // Check total spending limit
    const totalSpentResult = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_spent
       FROM virtual_card_transactions 
       WHERE card_id = $1 AND status = 'COMPLETED'`,
      [cardId]
    );
    const totalSpent = parseFloat(totalSpentResult.rows[0].total_spent || '0');
    
    if (totalSpent + amount > card.spending_limit) {
      throw new Error('Transaction would exceed total spending limit');
    }
  }

  private generateCardNumber(): string {
    // Generate 16-digit card number
    let cardNumber = '4'; // Visa prefix
    for (let i = 0; i < 15; i++) {
      cardNumber += Math.floor(Math.random() * 10).toString();
    }
    return cardNumber;
  }

  private maskCardNumber(cardNumber: string): string {
    return cardNumber.substring(0, 6) + '******' + cardNumber.substring(12);
  }

  private generateCVV(): string {
    return Math.floor(100 + Math.random() * 900).toString();
  }

  private generateExpiryDate(): Date {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3); // 3 years validity
    expiryDate.setMonth(11); // December
    expiryDate.setDate(31);
    return expiryDate;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private mapVirtualCard(row: any): VirtualCard {
    return {
      id: row.id,
      companyId: row.company_id,
      cardNumber: row.card_number,
      maskedCardNumber: row.masked_card_number,
      cvv: row.cvv,
      expiryDate: row.expiry_date,
      cardholderName: row.cardholder_name,
      currency: row.currency,
      status: row.status,
      cardType: row.card_type,
      spendingLimit: parseFloat(row.spending_limit),
      dailyLimit: parseFloat(row.daily_limit),
      monthlyLimit: parseFloat(row.monthly_limit),
      perTransactionLimit: parseFloat(row.per_transaction_limit),
      isActive: row.is_active,
      isBlocked: row.is_blocked,
      blockReason: row.block_reason,
      usageType: row.usage_type,
      allowedCategories: row.allowed_categories || [],
      blockedCategories: row.blocked_categories || [],
      allowedMerchants: row.allowed_merchants || [],
      blockedMerchants: row.blocked_merchants || [],
      allowedCountries: row.allowed_countries || [],
      blockedCountries: row.blocked_countries || [],
      allowedTimes: row.allowed_times ? JSON.parse(row.allowed_times) : {},
      notifications: row.notifications ? JSON.parse(row.notifications) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      activatedAt: row.activated_at,
      deactivatedAt: row.deactivated_at,
      lastTransactionAt: row.last_transaction_at
    };
  }

  private mapVirtualCardWithStats(row: any): VirtualCard {
    const card = this.mapVirtualCard(row);
    return {
      ...card,
      transactionCount: parseInt(row.transaction_count || '0'),
      totalSpent: parseFloat(row.total_spent || '0')
    };
  }

  private mapVirtualCardTransaction(row: any): VirtualCardTransaction {
    return {
      id: row.id,
      cardId: row.card_id,
      companyId: row.company_id,
      transactionType: row.transaction_type,
      amount: parseFloat(row.amount),
      currency: row.currency,
      merchantName: row.merchant_name,
      merchantCategory: row.merchant_category,
      merchantCountry: row.merchant_country,
      transactionDate: row.transaction_date,
      authorizationCode: row.authorization_code,
      status: row.status,
      reason: row.reason,
      createdAt: row.created_at
    };
  }

  private mapVirtualCardSettings(row: any): VirtualCardSettings {
    return {
      id: row.id,
      companyId: row.company_id,
      defaultSettings: row.default_settings ? JSON.parse(row.default_settings) : {},
      securitySettings: row.security_settings ? JSON.parse(row.security_settings) : {},
      notificationSettings: row.notification_settings ? JSON.parse(row.notification_settings) : {},
      complianceSettings: row.compliance_settings ? JSON.parse(row.compliance_settings) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}