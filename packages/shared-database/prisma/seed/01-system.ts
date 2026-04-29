/**
 * 01-system.ts — SystemConfig, CurrencyExchangeRate, BoardType
 */
import { PrismaClient } from '../../generated/prisma-client';
import { log } from './helpers/faker.js';

export async function seedSystem(prisma: PrismaClient) {
  console.log('\n📦 [01-system] Seeding system configuration...');

  // ── SystemConfig ────────────────────────────────────────────────────────────
  const configs = [
    { key: 'DEFAULT_CURRENCY', value: JSON.stringify('BHD'), description: 'Platform default currency', isPublic: true },
    { key: 'BOOKING_TICKET_DEADLINE_HOURS', value: JSON.stringify(72), description: 'Hours before auto-cancel if not ticketed', isPublic: false },
    { key: 'MAX_PAX_PER_BOOKING', value: JSON.stringify(9), description: 'Maximum passengers per booking', isPublic: true },
    { key: 'ENABLE_B2B2C', value: JSON.stringify(false), description: 'Global B2B2C feature toggle', isPublic: false },
    { key: 'WALLET_LOW_BALANCE_THRESHOLD_PCT', value: JSON.stringify(20), description: 'Alert when wallet drops below X% of credit limit', isPublic: false },
    { key: 'REFUND_PROCESSING_DAYS', value: JSON.stringify(7), description: 'Business days for refund processing', isPublic: true },
    { key: 'SUPPORT_EMAIL', value: JSON.stringify('support@tripalfa.com'), description: 'Platform support email', isPublic: true },
    { key: 'SUPPORT_PHONE', value: JSON.stringify('+973-1234-5678'), description: 'Platform support phone', isPublic: true },
    { key: 'PLATFORM_NAME', value: JSON.stringify('TripAlfa OTA'), description: 'Platform display name', isPublic: true },
    { key: 'PLATFORM_TIMEZONE', value: JSON.stringify('Asia/Bahrain'), description: 'Default platform timezone', isPublic: true },
    { key: 'MAX_API_RATE_LIMIT_RPM', value: JSON.stringify(600), description: 'API gateway rate limit per minute', isPublic: false },
    { key: 'ENABLE_AUDIT_LOGGING', value: JSON.stringify(true), description: 'Enable full audit trail', isPublic: false },
    { key: 'PREBOOK_SESSION_TTL_MINUTES', value: JSON.stringify(15), description: 'Prebook session expiry', isPublic: false },
    { key: 'AUTO_CANCEL_BUFFER_MINUTES', value: JSON.stringify(30), description: 'Buffer before auto-cancel job runs', isPublic: false },
    { key: 'DUFFEL_SANDBOX_MODE', value: JSON.stringify(true), description: 'Use Duffel sandbox API', isPublic: false },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: { ...config, lastUpdatedBy: 'seed' },
    });
  }
  log('01-system', 'SystemConfig', configs.length);

  // ── CurrencyExchangeRate ─────────────────────────────────────────────────────
  const fxRates = [
    { baseCurrency: 'USD', quoteCurrency: 'BHD', rate: 0.376, inverseRate: 2.659, source: 'Manual' },
    { baseCurrency: 'BHD', quoteCurrency: 'USD', rate: 2.659, inverseRate: 0.376, source: 'Manual' },
    { baseCurrency: 'USD', quoteCurrency: 'SAR', rate: 3.75, inverseRate: 0.267, source: 'Manual' },
    { baseCurrency: 'SAR', quoteCurrency: 'USD', rate: 0.267, inverseRate: 3.75, source: 'Manual' },
    { baseCurrency: 'BHD', quoteCurrency: 'SAR', rate: 9.96, inverseRate: 0.1004, source: 'Manual' },
    { baseCurrency: 'SAR', quoteCurrency: 'BHD', rate: 0.1004, inverseRate: 9.96, source: 'Manual' },
    { baseCurrency: 'USD', quoteCurrency: 'EUR', rate: 0.92, inverseRate: 1.087, source: 'ECB' },
    { baseCurrency: 'USD', quoteCurrency: 'GBP', rate: 0.79, inverseRate: 1.266, source: 'ECB' },
    { baseCurrency: 'USD', quoteCurrency: 'AED', rate: 3.67, inverseRate: 0.272, source: 'Manual' },
  ];

  for (const fx of fxRates) {
    await prisma.currencyExchangeRate.upsert({
      where: {
        baseCurrency_quoteCurrency_validFrom: {
          baseCurrency: fx.baseCurrency,
          quoteCurrency: fx.quoteCurrency,
          validFrom: new Date('2024-01-01'),
        },
      },
      update: { rate: fx.rate, inverseRate: fx.inverseRate },
      create: { ...fx, validFrom: new Date('2024-01-01') },
    });
  }
  log('01-system', 'CurrencyExchangeRate', fxRates.length);

  // ── BoardType ──────────────────────────────────────────────────────────────
  const boardTypes = [
    { code: 'RO', name: 'Room Only' },
    { code: 'BB', name: 'Bed & Breakfast' },
    { code: 'HB', name: 'Half Board' },
    { code: 'FB', name: 'Full Board' },
    { code: 'AI', name: 'All Inclusive' },
  ];
  for (const bt of boardTypes) {
    await prisma.boardType.upsert({
      where: { code: bt.code },
      update: {},
      create: { ...bt, isActive: true },
    });
  }
  log('01-system', 'BoardType', boardTypes.length);
}
