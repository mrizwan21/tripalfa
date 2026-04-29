/**
 * OTA Platform Seed Helpers — Shared faker utilities
 */
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

// ─── Deterministic seed so each run produces the same data ───────────────────
faker.seed(42);

// ─── Password ─────────────────────────────────────────────────────────────────
export const SEED_PASSWORD_PLAIN = 'Test@1234';
let _hashedPassword: string | null = null;

export async function getSeedPasswordHash(): Promise<string> {
  if (!_hashedPassword) {
    _hashedPassword = await bcrypt.hash(SEED_PASSWORD_PLAIN, 10);
  }
  return _hashedPassword;
}

// ─── Reference generators ─────────────────────────────────────────────────────
let _bookingCounter = 1000;
export function genBookingRef(): string {
  const d = new Date();
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `BK-${yyyymmdd}-${String(_bookingCounter++).padStart(4, '0')}`;
}

let _txnCounter = 1;
export function genTxnNo(): string {
  return `TXN-${Date.now()}-${String(_txnCounter++).padStart(6, '0')}`;
}

let _walletCounter = 1;
export function genWalletNo(): string {
  return `WAL-${String(_walletCounter++).padStart(8, '0')}`;
}

let _holdCounter = 1;
export function genHoldNo(): string {
  return `HOLD-${Date.now()}-${String(_holdCounter++).padStart(6, '0')}`;
}

let _refundCounter = 1;
export function genRefundNo(): string {
  return `REF-${Date.now()}-${String(_refundCounter++).padStart(6, '0')}`;
}

let _invoiceCounter = 1;
export function genInvoiceNo(): string {
  return `INV-${Date.now()}-${String(_invoiceCounter++).padStart(6, '0')}`;
}

let _settlementCounter = 1;
export function genSettlementNo(supplierId: string): string {
  return `SETT-${supplierId.slice(0, 6).toUpperCase()}-${String(_settlementCounter++).padStart(6, '0')}`;
}

let _corpInvCounter = 1;
export function genCorpInvoiceNo(corpId: string): string {
  return `CINV-${corpId.slice(0, 6).toUpperCase()}-${String(_corpInvCounter++).padStart(6, '0')}`;
}

let _ledgerEntryCounter = 1;
export function genLedgerEntryNo(): string {
  return `LE-${Date.now()}-${String(_ledgerEntryCounter++).padStart(6, '0')}`;
}

let _ledgerAccountCounter = 1000;
export function genLedgerAccountNo(type: string): string {
  return `ACC-${type.slice(0, 3).toUpperCase()}-${String(_ledgerAccountCounter++)}`;
}

let _commissionTxnCounter = 1;
export function genCommissionTxnSlug(): string {
  return `CTX-${Date.now()}-${String(_commissionTxnCounter++).padStart(6, '0')}`;
}

let _requestRefCounter = 1;
export function genRequestRef(): string {
  return `REQ-${Date.now()}-${String(_requestRefCounter++).padStart(6, '0')}`;
}

let _enquiryCounter = 1;
export function genEnquiryId(): string {
  return `ENQ-${Date.now()}-${String(_enquiryCounter++).padStart(6, '0')}`;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export function randomPastDate(minDays = 1, maxDays = 365): Date {
  return daysAgo(faker.number.int({ min: minDays, max: maxDays }));
}

export function randomFutureDate(minDays = 1, maxDays = 365): Date {
  return daysFromNow(faker.number.int({ min: minDays, max: maxDays }));
}

// ─── Enum pickers ─────────────────────────────────────────────────────────────
export function pickOne<T>(arr: readonly T[]): T {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })];
}

export function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// ─── IATA codes pool ──────────────────────────────────────────────────────────
export const AIRPORTS = ['DXB', 'LHR', 'JFK', 'CDG', 'SIN', 'BOM', 'DOH', 'BAH', 'RUH', 'CAI', 'IST', 'FCO', 'AMS', 'FRA', 'BKK'];
export const AIRLINES = ['EK', 'QR', 'EY', 'SV', 'GF', 'MS', 'TK', 'LH', 'BA', 'AF'];
export const CURRENCIES = ['USD', 'BHD', 'SAR'];
export const COUNTRIES = ['Bahrain', 'Saudi Arabia', 'UAE', 'Kuwait', 'Oman', 'Jordan', 'Egypt', 'United Kingdom', 'India', 'USA'];

// ─── Log helper ───────────────────────────────────────────────────────────────
export function log(module: string, model: string, count: number) {
  console.log(`  ✅ [${module}] ${model}: ${count} records`);
}
