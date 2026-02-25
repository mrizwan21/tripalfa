/**
 * Kiwi.com Deposit Account Management Integration
 * 
 * This service manages the Kiwi supplier wallet and deposit account operations:
 * - Balance tracking & top-ups for Kiwi multi-city bookings
 * - Hold/reserve funds during booking flow
 * - Settlement after ticketing confirmation
 * - Refund processing via Kiwi API
 * - Webhook handling for booking status changes
 * 
 * API Docs: https://tequila.kiwi.com/portal/docs/user_guides/deposit_account_management
 */

import { prisma } from '@tripalfa/shared-database';
import { logger } from '../utils/logger.js';
import walletService from './walletService.js';
import { toNumber, DecimalLike } from '../types/wallet.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KiwiDepositConfig {
  affilId:    string;
  apiKey:     string;
  walletId:   string;   // Our internal wallet ID for Kiwi supplier
  currency:   string;   // Default currency (EUR for Kiwi)
  minBalance: number;   // Alert threshold
}

export interface KiwiBookingHold {
  bookingId:      string;
  kiwiBookingId:  string;
  amount:         number;
  currency:       string;
  status:         'held' | 'confirmed' | 'released' | 'refunded';
  heldAt:         Date;
  expiresAt:      Date;
  confirmedAt?:   Date | null;
  releasedAt?:    Date | null;
  metadata?:      Record<string, any> | null;
}

export interface KiwiSettlement {
  id:              string;
  kiwiBookingId:   string;
  amount:          number;
  currency:        string;
  commission:      number;
  netAmount:       number;
  status:          'pending' | 'settled' | 'failed';
  settledAt?:      Date | null;
  invoiceId?:      string | null;
}

export interface KiwiRefundRequest {
  kiwiBookingId:   string;
  amount:          number;
  currency:        string;
  reason:          'customer_cancel' | 'airline_cancel' | 'schedule_change' | 'other';
  idempotencyKey:  string;
}

export interface KiwiWebhookPayload {
  event:      string;
  booking_id: string;
  status:     string;
  amount?:    number;
  currency?:  string;
  timestamp:  string;
  data?:      Record<string, any>;
}

interface KiwiRefundResponse {
  refund_id: string;
  status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KIWI_API_BASE = 'https://api.tequila.kiwi.com';
const KIWI_SUPPLIER_ID = 'kiwi_noman_supplier'; // Internal supplier ID
const DEFAULT_CURRENCY = 'EUR';
const HOLD_DURATION_HOURS = 24; // Default hold duration before auto-release

// ─── Service Implementation ────────────────────────────────────────────────────

class KiwiDepositService {
  private config: KiwiDepositConfig;
  private isConfigured: boolean = true;
  
  constructor() {
    // Check for required environment variables with graceful degradation
    const missingVars: string[] = [];
    if (!process.env.KIWI_AFFIL_ID) {
      missingVars.push('KIWI_AFFIL_ID');
    }
    if (!process.env.KIWI_API_KEY) {
      missingVars.push('KIWI_API_KEY');
    }
    
    if (missingVars.length > 0) {
      logger.warn(
        `[KiwiDepositService] Missing required environment variables: ${missingVars.join(', ')}. ` +
        `Kiwi deposit functionality will be disabled. ` +
        `Set these variables to enable Kiwi.com integration.`
      );
      this.isConfigured = false;
    }
    
    this.config = {
      affilId:    process.env.KIWI_AFFIL_ID || '',
      apiKey:     process.env.KIWI_API_KEY || '',
      walletId:   process.env.KIWI_WALLET_ID   || '',
      currency:   process.env.KIWI_CURRENCY    || DEFAULT_CURRENCY,
      minBalance: parseFloat(process.env.KIWI_MIN_BALANCE || '1000'),
    };
  }

  /**
   * Check if the Kiwi service is properly configured
   * Returns true if all required environment variables are set
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Ensure the service is configured before attempting operations
   * @throws Error if the service is not configured
   */
  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new Error(
        'KiwiDepositService is not configured. ' +
        'Set KIWI_AFFIL_ID and KIWI_API_KEY environment variables to enable Kiwi integration.'
      );
    }
  }

  // ─── Wallet Management ──────────────────────────────────────────────────────

  /**
   * Ensure Kiwi supplier wallet exists
   */
  async ensureKiwiWallet(): Promise<string> {
    const existing = await prisma.wallet.findFirst({
      where: { userId: KIWI_SUPPLIER_ID, currency: this.config.currency },
    });
    
    if (existing) {
      this.config.walletId = existing.id;
      return existing.id;
    }
    
    const wallet = await prisma.wallet.create({
      data: {
        userId: KIWI_SUPPLIER_ID,
        currency: this.config.currency,
        balance: 0,
        reservedBalance: 0,
        status: 'active',
      },
    });
    
    this.config.walletId = wallet.id;
    logger.info(`[KiwiDepositService] Created Kiwi supplier wallet: ${wallet.id}`);
    return wallet.id;
  }

  /**
   * Get Kiwi wallet balance
   */
  async getBalance(): Promise<{ available: number; reserved: number; total: number }> {
    await this.ensureKiwiWallet();
    
    const wallet = await prisma.wallet.findUnique({
      where: { id: this.config.walletId },
    }) as (Awaited<ReturnType<typeof prisma.wallet.findUnique>> & { reservedBalance: DecimalLike }) | null;
    
    if (!wallet) {
      throw new Error('Kiwi wallet not found');
    }
    
    return {
      available: toNumber(wallet.balance) - toNumber(wallet.reservedBalance),
      reserved: toNumber(wallet.reservedBalance),
      total: toNumber(wallet.balance),
    };
  }

  /**
   * Top-up Kiwi deposit account (credit from payment gateway)
   */
  async topup(amount: number, gatewayReference: string, idempotencyKey: string): Promise<any> {
    await this.ensureKiwiWallet();
    
    return await walletService.creditWallet(
      KIWI_SUPPLIER_ID,
      this.config.currency,
      amount,
      `Kiwi deposit top-up - Ref: ${gatewayReference}`,
      idempotencyKey
    );
  }

  // ─── Booking Hold/Reserve Flow ──────────────────────────────────────────────

  /**
   * Place a hold on funds for a pending booking
   * Kiwi deposit model: reserve funds before ticketing
   */
  async holdForBooking(
    bookingId: string,
    kiwiBookingId: string,
    amount: number,
    currency: string = this.config.currency,
    metadata?: Record<string, any>
  ): Promise<KiwiBookingHold> {
    await this.ensureKiwiWallet();
    
    // Check for existing hold (idempotency)
    const existing = await prisma.kiwiBookingHold.findUnique({
      where: { bookingId },
    });
    
    if (existing) {
      logger.info(`[KiwiDepositService] Returning existing hold for booking: ${bookingId}`);
      return {
        bookingId: existing.bookingId,
        kiwiBookingId: existing.kiwiBookingId,
        amount: toNumber(existing.amount),
        currency: existing.currency,
        status: existing.status as KiwiBookingHold['status'],
        heldAt: existing.heldAt,
        expiresAt: existing.expiresAt,
        confirmedAt: existing.confirmedAt,
        releasedAt: existing.releasedAt,
        metadata: existing.metadata as Record<string, any> | null,
      };
    }
    
    // Validate sufficient balance
    const { available } = await this.getBalance();
    if (available < amount) {
      throw new Error(`Insufficient Kiwi deposit balance. Available: ${available}, Required: ${amount}`);
    }
    
    // Create hold and reserve funds
    const now = new Date();
    const expiresAt = new Date(now.getTime() + HOLD_DURATION_HOURS * 60 * 60 * 1000);
    
    const hold = await prisma.$transaction(async (tx) => {
      // Reserve funds in wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: this.config.walletId },
      }) as (typeof wallet & { reservedBalance: ReturnType<typeof toNumber> }) | null;
      
      if (!wallet) throw new Error('Kiwi wallet not found');
      
      const newReserved = toNumber(wallet.reservedBalance) + amount;
      await tx.wallet.update({
        where: { id: this.config.walletId },
        data: { reservedBalance: newReserved },
      });
      
      // Create hold record
      return await tx.kiwiBookingHold.create({
        data: {
          bookingId,
          kiwiBookingId,
          amount,
          currency,
          status: 'held',
          heldAt: now,
          expiresAt,
          metadata,
        },
      });
    });
    
    logger.info(`[KiwiDepositService] Funds held for booking: ${bookingId}, amount: ${amount} ${currency}`);
    
    return {
      bookingId: hold.bookingId,
      kiwiBookingId: hold.kiwiBookingId,
      amount: toNumber(hold.amount),
      currency: hold.currency,
      status: hold.status as KiwiBookingHold['status'],
      heldAt: hold.heldAt,
      expiresAt: hold.expiresAt,
      confirmedAt: hold.confirmedAt,
      releasedAt: hold.releasedAt,
      metadata: hold.metadata as Record<string, any> | null,
    };
  }

  /**
   * Confirm a hold after successful ticketing
   * Moves held funds to settled state
   */
  async confirmHold(bookingId: string): Promise<KiwiBookingHold> {
    const hold = await prisma.kiwiBookingHold.findUnique({
      where: { bookingId },
    });
    
    if (!hold) {
      throw new Error(`No hold found for booking ${bookingId}`);
    }
    
    if (hold.status !== 'held') {
      throw new Error(`Hold already ${hold.status}`);
    }
    
    const updatedHold = await prisma.$transaction(async (tx) => {
      // Debit the reserved amount from wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: this.config.walletId },
      }) as (typeof wallet & { reservedBalance: ReturnType<typeof toNumber> }) | null;
      
      if (!wallet) throw new Error('Kiwi wallet not found');
      
      const holdAmount = toNumber(hold.amount);
      const newBalance = toNumber(wallet.balance) - holdAmount;
      const newReserved = toNumber(wallet.reservedBalance) - holdAmount;
      
      await tx.wallet.update({
        where: { id: this.config.walletId },
        data: { balance: newBalance, reservedBalance: newReserved },
      });
      
      // Update hold status
      return await tx.kiwiBookingHold.update({
        where: { bookingId },
        data: { status: 'confirmed', confirmedAt: new Date() },
      });
    });
    
    return {
      bookingId: updatedHold.bookingId,
      kiwiBookingId: updatedHold.kiwiBookingId,
      amount: toNumber(updatedHold.amount),
      currency: updatedHold.currency,
      status: updatedHold.status as KiwiBookingHold['status'],
      heldAt: updatedHold.heldAt,
      expiresAt: updatedHold.expiresAt,
      confirmedAt: updatedHold.confirmedAt,
      releasedAt: updatedHold.releasedAt,
      metadata: updatedHold.metadata as Record<string, any> | null,
    };
  }

  /**
   * Release a hold (booking cancelled before ticketing)
   */
  async releaseHold(bookingId: string): Promise<KiwiBookingHold> {
    const hold = await prisma.kiwiBookingHold.findUnique({
      where: { bookingId },
    });
    
    if (!hold) {
      throw new Error(`No hold found for booking ${bookingId}`);
    }
    
    if (hold.status !== 'held') {
      throw new Error(`Hold already ${hold.status}`);
    }
    
    const updatedHold = await prisma.$transaction(async (tx) => {
      // Release reserved funds
      const wallet = await tx.wallet.findUnique({
        where: { id: this.config.walletId },
      }) as (typeof wallet & { reservedBalance: ReturnType<typeof toNumber> }) | null;
      
      if (!wallet) throw new Error('Kiwi wallet not found');
      
      const holdAmount = toNumber(hold.amount);
      const newReserved = toNumber(wallet.reservedBalance) - holdAmount;
      
      await tx.wallet.update({
        where: { id: this.config.walletId },
        data: { reservedBalance: Math.max(0, newReserved) },
      });
      
      // Update hold status
      return await tx.kiwiBookingHold.update({
        where: { bookingId },
        data: { status: 'released', releasedAt: new Date() },
      });
    });
    
    return {
      bookingId: updatedHold.bookingId,
      kiwiBookingId: updatedHold.kiwiBookingId,
      amount: toNumber(updatedHold.amount),
      currency: updatedHold.currency,
      status: updatedHold.status as KiwiBookingHold['status'],
      heldAt: updatedHold.heldAt,
      expiresAt: updatedHold.expiresAt,
      confirmedAt: updatedHold.confirmedAt,
      releasedAt: updatedHold.releasedAt,
      metadata: updatedHold.metadata as Record<string, any> | null,
    };
  }

  // ─── Settlement Flow ────────────────────────────────────────────────────────

  /**
   * Process settlement after Kiwi confirms ticketing
   * Records the settlement and updates accounting
   */
  async settleBooking(
    kiwiBookingId: string,
    grossAmount: number,
    commission: number,
    invoiceId?: string
  ): Promise<KiwiSettlement> {
    const netAmount = grossAmount - commission;
    
    // Ensure Kiwi wallet exists
    const walletId = await this.ensureKiwiWallet();
    
    const settlement = await prisma.kiwiSettlement.create({
      data: {
        bookingId: kiwiBookingId,
        kiwiBookingId,
        walletId,
        amount: grossAmount,
        currency: this.config.currency,
        commission,
        netAmount,
        type: 'deposit',
        status: 'settled',
        settledAt: new Date(),
      },
    });
    
    logger.info(`[KiwiDepositService] Booking settled: ${kiwiBookingId}, gross: ${grossAmount}, commission: ${commission}, net: ${netAmount}`);
    
    return {
      id: settlement.id,
      kiwiBookingId: settlement.kiwiBookingId,
      amount: toNumber(settlement.amount),
      currency: settlement.currency,
      commission: toNumber(settlement.commission),
      netAmount: toNumber(settlement.netAmount),
      status: settlement.status as KiwiSettlement['status'],
      settledAt: settlement.settledAt,
      invoiceId: settlement.invoiceId,
    };
  }

  // ─── Refund Processing ───────────────────────────────────────────────────────

  /**
   * Process refund request via Kiwi API
   * https://tequila.kiwi.com/portal/docs/user_guides/refund_api
   */
  async processRefund(request: KiwiRefundRequest): Promise<{ refundId: string; status: string }> {
    this.ensureConfigured();
    try {
      // Call Kiwi refund API
      const response = await fetch(`${KIWI_API_BASE}/booking/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey,
        },
        body: JSON.stringify({
          booking_id: request.kiwiBookingId,
          amount: request.amount,
          currency: request.currency,
          reason: request.reason,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        logger.error(`[KiwiDepositService] Refund API error: ${response.status} - ${error}`);
        throw new Error(`Kiwi refund failed: ${error}`);
      }
      
      const result = (await response.json()) as KiwiRefundResponse;
      
      // Record refund in our system
      const walletId = await this.ensureKiwiWallet();
      await prisma.kiwiRefund.create({
        data: {
          bookingId: request.kiwiBookingId,
          kiwiBookingId: request.kiwiBookingId,
          walletId,
          amount: request.amount,
          currency: request.currency,
          reason: request.reason,
          refundId: result.refund_id,
          status: result.status,
        },
      });
      
      logger.info(`[KiwiDepositService] Refund processed: ${request.kiwiBookingId} -> ${result.refund_id}`);
      
      return { refundId: result.refund_id, status: result.status };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[KiwiDepositService] Refund processing failed: ${errorMessage}`);
      throw error;
    }
  }

  // ─── Webhook Handling ────────────────────────────────────────────────────────

  /**
   * Handle incoming webhook from Kiwi
   * https://tequila.kiwi.com/portal/docs/user_guides/web_hooks_and_mail_notifications
   */
  async handleWebhook(payload: KiwiWebhookPayload): Promise<void> {
    logger.info(`[KiwiDepositService] Webhook received: ${payload.event} for booking ${payload.booking_id}`);
    
    switch (payload.event) {
      case 'booking_confirmed':
        await this.handleBookingConfirmed(payload);
        break;
      case 'booking_cancelled':
        await this.handleBookingCancelled(payload);
        break;
      case 'price_change':
        await this.handlePriceChange(payload);
        break;
      case 'schedule_change':
        await this.handleScheduleChange(payload);
        break;
      case 'refund_processed':
        await this.handleRefundProcessed(payload);
        break;
      default:
        logger.warn(`[KiwiDepositService] Unhandled webhook event: ${payload.event}`);
    }
  }

  private async handleBookingConfirmed(payload: KiwiWebhookPayload): Promise<void> {
    // Find and confirm the hold
    const hold = await prisma.kiwiBookingHold.findFirst({
      where: { kiwiBookingId: payload.booking_id },
    });
    
    if (hold && hold.status === 'held') {
      await this.confirmHold(hold.bookingId);
    }
  }

  private async handleBookingCancelled(payload: KiwiWebhookPayload): Promise<void> {
    const hold = await prisma.kiwiBookingHold.findFirst({
      where: { kiwiBookingId: payload.booking_id },
    });
    
    if (hold && hold.status === 'held') {
      await this.releaseHold(hold.bookingId);
    }
  }

  private async handlePriceChange(payload: KiwiWebhookPayload): Promise<void> {
    // Log price change for review
    logger.warn(`[KiwiDepositService] Price change notification for booking ${payload.booking_id} - manual review required`);
    
    // Store for review
    try {
      const walletId = await this.ensureKiwiWallet();
      await prisma.kiwiPriceChange.create({
        data: {
          bookingId: payload.booking_id,
          kiwiBookingId: payload.booking_id,
          walletId,
          oldPrice: payload.data?.old_price || 0,
          originalAmount: payload.data?.old_price || 0,
          newAmount: payload.data?.new_price || 0,
          difference: (payload.data?.new_price || 0) - (payload.data?.old_price || 0),
          currency: payload.currency || this.config.currency,
          status: 'pending_review',
        },
      });
    } catch (error) {
      // Log error but don't fail the webhook - price change records are for audit purposes
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[KiwiDepositService] Failed to create price change record for booking ${payload.booking_id}: ${errorMessage}`);
    }
  }

  private async handleScheduleChange(payload: KiwiWebhookPayload): Promise<void> {
    logger.info(`[KiwiDepositService] Schedule change for booking ${payload.booking_id} - notifying customer`);
    // TODO: Trigger notification to customer
  }

  private async handleRefundProcessed(payload: KiwiWebhookPayload): Promise<void> {
    await prisma.kiwiRefund.updateMany({
      where: { kiwiBookingId: payload.booking_id },
      data: { status: 'completed' },
    });
    
    // Credit the refund back to wallet
    if (payload.amount && payload.currency) {
      await walletService.creditWallet(
        KIWI_SUPPLIER_ID,
        payload.currency,
        payload.amount,
        `Refund credit - Booking ${payload.booking_id}`,
        `refund_${payload.booking_id}_${Date.now()}`
      );
    }
  }

  // ─── Ancillary Services ─────────────────────────────────────────────────────

  /**
   * Add baggage to booking
   * https://tequila.kiwi.com/portal/docs/user_guides/acquiring_multiple_hold_weight_baggage
   */
  async addBaggage(kiwiBookingId: string, baggage: { weight: number; count: number }): Promise<any> {
    // TODO: Implement baggage API call
    logger.info(`[KiwiDepositService] Adding baggage to booking ${kiwiBookingId}: ${baggage.weight}kg x ${baggage.count}`);
    return { success: true, message: 'Baggage addition requires Kiwi API integration' };
  }

  /**
   * Add seats to booking
   * https://tequila.kiwi.com/portal/docs/user_guides/acquiring_seating
   */
  async addSeating(kiwiBookingId: string, seats: Array<{ segment: number; seat: string }>): Promise<any> {
    // TODO: Implement seating API call
    logger.info(`[KiwiDepositService] Adding seating to booking ${kiwiBookingId}: ${seats.length} seats`);
    return { success: true, message: 'Seating addition requires Kiwi API integration' };
  }

  /**
   * Add premium disruption protection
   * https://tequila.kiwi.com/portal/docs/user_guides/acquiring_premium_disruption_protection
   */
  async addDisruptionProtection(kiwiBookingId: string): Promise<any> {
    // TODO: Implement disruption protection API call
    logger.info(`[KiwiDepositService] Adding disruption protection to booking ${kiwiBookingId}`);
    return { success: true, message: 'Disruption protection requires Kiwi API integration' };
  }

  // ─── Balance Monitoring ─────────────────────────────────────────────────────

  /**
   * Check if balance is below threshold
   */
  async checkBalanceAlert(): Promise<{ needsTopup: boolean; currentBalance: number; minBalance: number }> {
    const { total } = await this.getBalance();
    const needsTopup = total < this.config.minBalance;
    
    if (needsTopup) {
      logger.warn(`[KiwiDepositService] Low balance alert: ${total} (min: ${this.config.minBalance})`);
    }
    
    return { needsTopup, currentBalance: total, minBalance: this.config.minBalance };
  }

  /**
   * Auto-release expired holds
   */
  async releaseExpiredHolds(): Promise<number> {
    const expired = await prisma.kiwiBookingHold.findMany({
      where: {
        status: 'held',
        expiresAt: { lt: new Date() },
      },
    });
    
    for (const hold of expired) {
      try {
        await this.releaseHold(hold.bookingId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[KiwiDepositService] Failed to release expired hold ${hold.bookingId}: ${errorMessage}`);
      }
    }
    
    if (expired.length > 0) {
      logger.info(`[KiwiDepositService] Released ${expired.length} expired holds`);
    }
    
    return expired.length;
  }
}

// ─── Export ────────────────────────────────────────────────────────────────────

export const kiwiDepositService = new KiwiDepositService();
export default kiwiDepositService;