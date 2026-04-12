// src/services/transactionHistoryService.ts
// Transaction history service with filtering and Excel export
// Supports flights, hotels, and all wallet transactions

import { prisma } from '@tripalfa/shared-database';
import { logger } from '../utils/logger.js';

const SERVICE_NAME = 'transactionHistoryService';
const EXCEL_HEADER_BACKGROUND = `${'#'}667EEA`;
const EXCEL_HEADER_TEXT = `${'#'}FFFFFF`;

export interface TransactionFilters {
  userId?: string;
  walletId?: string;
  serviceType?: string; // 'flight', 'hotel', 'car', 'insurance', 'deposit', 'withdrawal', 'refund', 'settlement'
  type?: string; // 'debit', 'credit', 'deposit', 'withdrawal'
  flow?: string; // 'inbound', 'outbound'
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  supplierId?: string;
  bookingRef?: string;
  status?: string;
}

export interface TransactionHistoryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'amount' | 'balance';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionWithDetails {
  id: string;
  type: string;
  flow: string;
  amount: number;
  currency: string;
  balance: number;
  description: string | null;
  status: string;
  createdAt: Date;

  // Service details
  serviceType: string | null;
  supplierId: string | null;
  supplierName: string | null;
  bookingRef: string | null;
  travelDate: Date | null;
  returnDate: Date | null;
  route: string | null;
  hotelAddress: string | null;
  guestName: string | null;
  roomType: string | null;

  // Related IDs
  walletId: string;
  payerId: string | null;
  payeeId: string | null;
  bookingId: string | null;
  paymentId: string | null;
}

/**
 * Get transaction history with filters
 */
export async function getTransactionHistory(
  filters: TransactionFilters,
  options: TransactionHistoryOptions = {}
): Promise<{ transactions: TransactionWithDetails[]; total: number }> {
  const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;

  // Build where clause
  const where: any = {};

  if (filters.userId) {
    const wallets = await prisma.wallet.findMany({
      where: { userId: filters.userId },
      select: { id: true },
    });
    where.walletId = { in: wallets.map(w => w.id) };
  }

  if (filters.walletId) {
    where.walletId = filters.walletId;
  }

  if (filters.serviceType) {
    where.serviceType = filters.serviceType;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.flow) {
    where.flow = filters.flow;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  if (filters.minAmount || filters.maxAmount) {
    where.amount = {};
    if (filters.minAmount) {
      where.amount.gte = filters.minAmount;
    }
    if (filters.maxAmount) {
      where.amount.lte = filters.maxAmount;
    }
  }

  if (filters.currency) {
    where.currency = filters.currency;
  }

  if (filters.supplierId) {
    where.supplierId = filters.supplierId;
  }

  if (filters.bookingRef) {
    where.bookingRef = { contains: filters.bookingRef, mode: 'insensitive' };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  // Get total count
  const total = await prisma.walletTransaction.count({ where });

  // Get transactions
  const transactions = await prisma.walletTransaction.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    take: limit,
    skip: offset,
    include: {
      wallet: {
        select: {
          id: true,
          userId: true,
          currency: true,
        },
      },
    },
  });

  // Map to response format
  const mappedTransactions: TransactionWithDetails[] = transactions.map(tx => ({
    id: tx.id,
    type: tx.type,
    flow: tx.flow || '',
    amount: Number(tx.amount),
    currency: tx.currency,
    balance: Number(tx.balance),
    description: tx.description,
    status: tx.status,
    createdAt: tx.createdAt,

    // Service details
    serviceType: tx.serviceType,
    supplierId: tx.supplierId,
    supplierName: tx.supplierName,
    bookingRef: tx.bookingRef,
    travelDate: tx.travelDate,
    returnDate: tx.returnDate,
    route: tx.route,
    hotelAddress: tx.hotelAddress,
    guestName: tx.guestName,
    roomType: tx.roomType,

    // Related IDs
    walletId: tx.walletId,
    payerId: tx.payerId,
    payeeId: tx.payeeId,
    bookingId: tx.bookingId,
    paymentId: tx.paymentId,
  }));

  return { transactions: mappedTransactions, total };
}

/**
 * Get transaction summary for a user or wallet
 */
export async function getTransactionSummary(
  userId: string,
  filters: TransactionFilters = {}
): Promise<{
  totalCredits: number;
  totalDebits: number;
  netChange: number;
  transactionCount: number;
  byServiceType: Record<string, { count: number; total: number }>;
}> {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    select: { id: true },
  });

  const where: any = {
    walletId: { in: wallets.map(w => w.id) },
  };

  if (filters.serviceType) {
    where.serviceType = filters.serviceType;
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const transactions = await prisma.walletTransaction.findMany({ where });

  let totalCredits = 0;
  let totalDebits = 0;
  const byServiceType: Record<string, { count: number; total: number }> = {};

  for (const tx of transactions) {
    const amount = Number(tx.amount);

    if (tx.flow === 'inbound' || tx.type === 'deposit' || tx.type === 'credit') {
      totalCredits += amount;
    } else {
      totalDebits += amount;
    }

    // Group by service type
    const serviceType = tx.serviceType || 'other';
    if (!byServiceType[serviceType]) {
      byServiceType[serviceType] = { count: 0, total: 0 };
    }
    byServiceType[serviceType].count++;
    byServiceType[serviceType].total += amount;
  }

  return {
    totalCredits,
    totalDebits,
    netChange: totalCredits - totalDebits,
    transactionCount: transactions.length,
    byServiceType,
  };
}

/**
 * Export transactions to Excel-compatible CSV format
 */
export async function exportTransactionsToCSV(
  filters: TransactionFilters,
  options: TransactionHistoryOptions = {}
): Promise<string> {
  // Fetch all matching transactions (no limit for export)
  const { transactions } = await getTransactionHistory(filters, {
    ...options,
    limit: 10000, // Max export limit
    offset: 0,
  });

  // CSV Headers
  const headers = [
    'Date',
    'Transaction ID',
    'Type',
    'Service Type',
    'Description',
    'Amount',
    'Currency',
    'Balance After',
    'Status',
    'Booking Reference',
    'Supplier Name',
    'Route',
    'Travel Date',
    'Return Date',
    'Hotel Address',
    'Guest Name',
    'Room Type',
    'Created At',
  ];

  // Format date for CSV
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString();
  };

  // Format amount
  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  // Build CSV rows
  const rows = transactions.map(tx => [
    formatDate(tx.createdAt),
    tx.id,
    tx.type,
    tx.serviceType || 'N/A',
    tx.description || '',
    formatAmount(tx.amount, tx.currency),
    tx.currency,
    formatAmount(tx.balance, tx.currency),
    tx.status,
    tx.bookingRef || '',
    tx.supplierName || '',
    tx.route || '',
    formatDate(tx.travelDate),
    formatDate(tx.returnDate),
    tx.hotelAddress || '',
    tx.guestName || '',
    tx.roomType || '',
    formatDate(tx.createdAt),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export transactions to Excel-compatible XML (SpreadsheetML) format
 */
export async function exportTransactionsToExcel(
  filters: TransactionFilters,
  options: TransactionHistoryOptions = {}
): Promise<Buffer> {
  const { transactions } = await getTransactionHistory(filters, {
    ...options,
    limit: 10000,
    offset: 0,
  });

  // Generate Excel XML (SpreadsheetML format - compatible with Excel)
  const xml = generateExcelXML(transactions);

  return Buffer.from(xml, 'utf-8');
}

/**
 * Generate Excel XML from transactions
 */
function generateExcelXML(transactions: TransactionWithDetails[]): string {
  const escapeXml = (str: string) => {
    return String(str)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, String.fromCharCode(39));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatAmount = (amount: number) => amount.toFixed(2);

  // Build rows
  const rows = transactions
    .map(
      tx => `
    <Row>
      <Cell><Data ss:Type="String">${escapeXml(formatDate(tx.createdAt))}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.id)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.type)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.serviceType || 'N/A')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.description || '')}</Data></Cell>
      <Cell><Data ss:Type="Number">${escapeXml(formatAmount(tx.amount))}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.currency)}</Data></Cell>
      <Cell><Data ss:Type="Number">${escapeXml(formatAmount(tx.balance))}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.status)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.bookingRef || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.supplierName || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.route || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(formatDate(tx.travelDate))}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(formatDate(tx.returnDate))}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.hotelAddress || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.guestName || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(tx.roomType || '')}</Data></Cell>
    </Row>
  `
    )
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="${EXCEL_HEADER_BACKGROUND}" ss:Pattern="Solid"/>
      <Font ss:Color="${EXCEL_HEADER_TEXT}"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Transactions">
    <Table>
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Column ss:Width="200"/>
      <Column ss:Width="100"/>
      <Column ss:Width="60"/>
      <Column ss:Width="100"/>
      <Column ss:Width="60"/>
      <Column ss:Width="120"/>
      <Column ss:Width="150"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="200"/>
      <Column ss:Width="120"/>
      <Column ss:Width="80"/>
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Transaction ID</Data></Cell>
        <Cell><Data ss:Type="String">Type</Data></Cell>
        <Cell><Data ss:Type="String">Service Type</Data></Cell>
        <Cell><Data ss:Type="String">Description</Data></Cell>
        <Cell><Data ss:Type="String">Amount</Data></Cell>
        <Cell><Data ss:Type="String">Currency</Data></Cell>
        <Cell><Data ss:Type="String">Balance After</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
        <Cell><Data ss:Type="String">Booking Ref</Data></Cell>
        <Cell><Data ss:Type="String">Supplier Name</Data></Cell>
        <Cell><Data ss:Type="String">Route</Data></Cell>
        <Cell><Data ss:Type="String">Travel Date</Data></Cell>
        <Cell><Data ss:Type="String">Return Date</Data></Cell>
        <Cell><Data ss:Type="String">Hotel Address</Data></Cell>
        <Cell><Data ss:Type="String">Guest Name</Data></Cell>
        <Cell><Data ss:Type="String">Room Type</Data></Cell>
      </Row>
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`;
}

/**
 * Record a transaction with full booking details (for flights/hotels)
 */
async function recordTransactionWithDetails(
  walletId: string,
  data: {
    type: string;
    flow: string;
    amount: number;
    currency: string;
    balance: number;
    description?: string;
    idempotencyKey?: string;

    // Service details
    serviceType?: string;
    supplierId?: string;
    supplierName?: string;
    bookingRef?: string;
    travelDate?: Date;
    returnDate?: Date;
    route?: string;
    hotelAddress?: string;
    guestName?: string;
    roomType?: string;

    // Links
    payerId?: string;
    payeeId?: string;
    bookingId?: string;
    paymentId?: string;
  }
): Promise<{ id: string; createdAt: Date }> {
  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId,
      type: data.type,
      flow: data.flow,
      amount: data.amount,
      currency: data.currency,
      balance: data.balance,
      description: data.description,
      idempotencyKey: data.idempotencyKey,

      // Service details
      serviceType: data.serviceType,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      bookingRef: data.bookingRef,
      travelDate: data.travelDate,
      returnDate: data.returnDate,
      route: data.route,
      hotelAddress: data.hotelAddress,
      guestName: data.guestName,
      roomType: data.roomType,

      // Links
      payerId: data.payerId,
      payeeId: data.payeeId,
      bookingId: data.bookingId,
      paymentId: data.paymentId,

      status: 'completed',
    },
  });

  // Create ledger entry
  await prisma.walletLedger.create({
    data: {
      walletId,
      transactionId: transaction.id,
      entryType: data.flow === 'inbound' ? 'credit' : 'debit',
      amount: data.amount,
      balance: data.balance,
      currency: data.currency,
      accountType: 'main',
    },
  });

  logger.info(
    `[${SERVICE_NAME}] Transaction recorded: ${transaction.id}, serviceType: ${data.serviceType}`
  );

  return { id: transaction.id, createdAt: transaction.createdAt };
}
