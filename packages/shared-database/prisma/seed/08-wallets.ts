/**
 * 08-wallets.ts — Wallet, CurrencyAccount, AgentCreditLimit, CorporateAccount, SupplierWallet
 */
import { PrismaClient } from '../../generated/prisma-client';
import { TENANT_IDS } from './02-tenants.js';
import { SUPPLIER_IDS, SUPPLIER_WALLET_IDS } from './03-suppliers.js';
import { log, genWalletNo, genLedgerAccountNo } from './helpers/faker.js';

export const WALLET_IDS = {
  // Agent Wallets
  master: 'wallet-agt-master-001',
  sub1: 'wallet-agt-sub-001',
  sub2: 'wallet-agt-sub-002',
  sub3: 'wallet-agt-sub-003',
  sub4: 'wallet-agt-sub-004', // Suspended
  sub5: 'wallet-agt-sub-005',
  sub6: 'wallet-agt-sub-006',
  // Corporate Wallets
  corp1: 'wallet-corp-001',
  corp2: 'wallet-corp-002',
  corp3: 'wallet-corp-003',
  corp4: 'wallet-corp-004',
} as const;

export async function seedWallets(prisma: PrismaClient) {
  console.log('\n💰 [08-wallets] Seeding wallets and accounts...');

  // ── Ledger Accounts (Chart of Accounts) ────────────────────────────────────
  const ledgerAccounts = [
    { id: 'ledger-cash', no: genLedgerAccountNo('AST'), name: 'Cash at Bank', type: 'ASSET' },
    { id: 'ledger-ar', no: genLedgerAccountNo('AST'), name: 'Accounts Receivable', type: 'ASSET' },
    { id: 'ledger-ap', no: genLedgerAccountNo('LIA'), name: 'Accounts Payable', type: 'LIABILITY' },
    { id: 'ledger-client-funds', no: genLedgerAccountNo('LIA'), name: 'Client Funds (Wallets)', type: 'LIABILITY' },
    { id: 'ledger-rev-flight', no: genLedgerAccountNo('REV'), name: 'Revenue - Flights', type: 'REVENUE' },
    { id: 'ledger-rev-hotel', no: genLedgerAccountNo('REV'), name: 'Revenue - Hotels', type: 'REVENUE' },
    { id: 'ledger-cogs-flight', no: genLedgerAccountNo('EXP'), name: 'COGS - Flights', type: 'EXPENSE' },
    { id: 'ledger-cogs-hotel', no: genLedgerAccountNo('EXP'), name: 'COGS - Hotels', type: 'EXPENSE' },
  ];

  for (const acc of ledgerAccounts) {
    await prisma.ledgerAccount.upsert({
      where: { id: acc.id },
      update: {},
      create: { id: acc.id, accountNo: acc.no, accountName: acc.name, accountType: acc.type },
    });
  }
  log('08-wallets', 'LedgerAccount', ledgerAccounts.length);

  // ── Agent Wallets ──────────────────────────────────────────────────────────
  const agents = [
    { id: WALLET_IDS.master, owner: TENANT_IDS.master, name: 'Master Agent Wallet', limit: 0, status: 'ACTIVE', balBHD: 15000, balUSD: 50000, balSAR: 0 },
    { id: WALLET_IDS.sub1, owner: TENANT_IDS.sub1, name: 'Gulf Travel Wallet', limit: 50000, status: 'ACTIVE', balBHD: 12500, balUSD: 5000, balSAR: 20000 },
    { id: WALLET_IDS.sub2, owner: TENANT_IDS.sub2, name: 'Riyadh Express Wallet', limit: 15000, status: 'ACTIVE', balBHD: 0, balUSD: 2000, balSAR: 45000 }, // High SAR balance
    { id: WALLET_IDS.sub3, owner: TENANT_IDS.sub3, name: 'Dubai Horizons Wallet', limit: 5000, status: 'ACTIVE', balBHD: 500, balUSD: 1000, balSAR: 0, autoReload: true }, // Near limit
    { id: WALLET_IDS.sub4, owner: TENANT_IDS.sub4, name: 'Nile Tours Wallet', limit: 8000, status: 'SUSPENDED', balBHD: 0, balUSD: -250, balSAR: 0 },
    { id: WALLET_IDS.sub5, owner: TENANT_IDS.sub5, name: 'Jeddah Flyers Wallet', limit: 25000, status: 'ACTIVE', balBHD: 0, balUSD: 15000, balSAR: 30000 },
    { id: WALLET_IDS.sub6, owner: TENANT_IDS.sub6, name: 'Kuwait Wings Wallet', limit: 10000, status: 'ACTIVE', balBHD: 1000, balUSD: 3000, balSAR: 0 },
  ];

  for (const w of agents) {
    await prisma.wallet.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id, walletNo: genWalletNo(), ownerType: 'AGENT', ownerId: w.owner, ownerName: w.name,
        balance: 0, creditLimit: w.limit, currency: 'BHD', status: w.status as any,
        autoReloadEnabled: w.autoReload ?? false,
        autoReloadAmount: w.autoReload ? 1000 : null,
        autoReloadThreshold: w.autoReload ? 200 : null,
        autoReloadCurrency: 'BHD',
      },
    });

    // Create currency accounts
    await prisma.currencyAccount.upsert({
      where: { walletId_currency: { walletId: w.id, currency: 'BHD' } },
      update: {}, create: { walletId: w.id, currency: 'BHD', balance: w.balBHD, availableBalance: w.balBHD, ledgerAccountId: 'ledger-client-funds' }
    });
    await prisma.currencyAccount.upsert({
      where: { walletId_currency: { walletId: w.id, currency: 'USD' } },
      update: {}, create: { walletId: w.id, currency: 'USD', balance: w.balUSD, availableBalance: w.balUSD, ledgerAccountId: 'ledger-client-funds' }
    });
    await prisma.currencyAccount.upsert({
      where: { walletId_currency: { walletId: w.id, currency: 'SAR' } },
      update: {}, create: { walletId: w.id, currency: 'SAR', balance: w.balSAR, availableBalance: w.balSAR, ledgerAccountId: 'ledger-client-funds' }
    });

    // AgentCreditLimit
    await prisma.agentCreditLimit.upsert({
      where: { walletId: w.id },
      update: {},
      create: {
        walletId: w.id, creditLimit: w.limit, currency: 'BHD',
        alertThreshold: 0.8, status: w.balBHD + w.balUSD * 0.376 < -w.limit ? 'EXCEEDED' : 'ACTIVE', // Simplistic check
      },
    });
  }
  log('08-wallets', 'Wallet (AGENT)', agents.length);

  // ── Corporate Wallets ──────────────────────────────────────────────────────
  const corps = [
    { id: WALLET_IDS.corp1, owner: TENANT_IDS.corp1, name: 'BPC Corporate Wallet', limit: 100000, bal: 0, outstanding: 15000 },
    { id: WALLET_IDS.corp2, owner: TENANT_IDS.corp2, name: 'GFH Corporate Wallet', limit: 75000, bal: 5000, outstanding: 0 },
    { id: WALLET_IDS.corp3, owner: TENANT_IDS.corp3, name: 'STV Corporate Wallet', limit: 200000, bal: 0, outstanding: 85000 },
    { id: WALLET_IDS.corp4, owner: TENANT_IDS.corp4, name: 'EL Corporate Wallet', limit: 50000, bal: -2500, outstanding: 2500 },
  ];

  for (const w of corps) {
    await prisma.wallet.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id, walletNo: genWalletNo(), ownerType: 'CORPORATE', ownerId: w.owner, ownerName: w.name,
        balance: 0, creditLimit: w.limit, currency: 'BHD', status: 'ACTIVE',
      },
    });
    await prisma.currencyAccount.upsert({
      where: { walletId_currency: { walletId: w.id, currency: 'BHD' } },
      update: {}, create: { walletId: w.id, currency: 'BHD', balance: w.bal, availableBalance: w.bal, ledgerAccountId: 'ledger-client-funds' }
    });
    await prisma.corporateAccount.upsert({
      where: { id: `corp-acc-${w.id}` },
      update: {},
      create: {
        id: `corp-acc-${w.id}`, walletId: w.id, corporateId: w.owner, corporateName: w.name,
        creditLimit: w.limit, outstandingBalance: w.outstanding,
      },
    });
  }
  log('08-wallets', 'Wallet (CORPORATE)', corps.length);

  // ── Supplier Wallets ───────────────────────────────────────────────────────
  const suppliers = [
    { id: SUPPLIER_WALLET_IDS.sabre, owner: SUPPLIER_IDS.sabre, name: 'Sabre Supplier Wallet', currency: 'USD', payable: 45000, paid: 120000 },
    { id: SUPPLIER_WALLET_IDS.duffel, owner: SUPPLIER_IDS.duffel, name: 'Duffel Supplier Wallet', currency: 'USD', payable: 15000, paid: 85000 },
    { id: SUPPLIER_WALLET_IDS.liteapi, owner: SUPPLIER_IDS.liteapi, name: 'LiteAPI Supplier Wallet', currency: 'USD', payable: 22000, paid: 40000 },
    { id: SUPPLIER_WALLET_IDS.amadeus, owner: SUPPLIER_IDS.amadeus, name: 'Amadeus Supplier Wallet', currency: 'EUR', payable: 35000, paid: 60000 },
    { id: SUPPLIER_WALLET_IDS.localHotel, owner: SUPPLIER_IDS.localHotel, name: 'Gulf Hotels Supplier Wallet', currency: 'BHD', payable: 8000, paid: 25000 },
  ];

  for (const w of suppliers) {
    await prisma.wallet.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id, walletNo: genWalletNo(), ownerType: 'SUPPLIER', ownerId: w.owner, ownerName: w.name,
        balance: 0, creditLimit: 0, currency: w.currency, status: 'ACTIVE',
      },
    });
    await prisma.currencyAccount.upsert({
      where: { walletId_currency: { walletId: w.id, currency: w.currency } },
      update: {}, create: { walletId: w.id, currency: w.currency, balance: 0, availableBalance: 0, ledgerAccountId: 'ledger-ap' }
    });
    await prisma.supplierWallet.upsert({
      where: { id: `sup-wallet-${w.owner}` },
      update: {},
      create: {
        id: `sup-wallet-${w.owner}`, walletId: w.id, supplierId: w.owner, supplierCode: w.name.split(' ')[0].toUpperCase(),
        supplierName: w.name, supplierType: 'GDS/API', settlementCurrency: w.currency,
        payableBalance: w.payable, paidBalance: w.paid,
      },
    });
  }
  log('08-wallets', 'Wallet (SUPPLIER)', suppliers.length);
}
