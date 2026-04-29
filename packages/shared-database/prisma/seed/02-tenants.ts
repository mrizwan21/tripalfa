/**
 * 02-tenants.ts — Tenant, User, SalesChannelConfig, ApiKey
 * Hierarchy: 1 MASTER → 6 SUB_AGENT → 4 CORPORATE
 */
import { PrismaClient, TenantStatus, TenantType } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { getSeedPasswordHash, log, daysAgo } from './helpers/faker.js';

// Exported so downstream modules can reference IDs
export const TENANT_IDS = {
  master: 'tenant-master-001',
  sub1: 'tenant-sub-001',   // Active, large credit
  sub2: 'tenant-sub-002',   // Active, medium credit
  sub3: 'tenant-sub-003',   // Active, small credit
  sub4: 'tenant-sub-004',   // Suspended
  sub5: 'tenant-sub-005',   // Active, B2B2C enabled
  sub6: 'tenant-sub-006',   // Active, minimal access
  corp1: 'tenant-corp-001',
  corp2: 'tenant-corp-002',
  corp3: 'tenant-corp-003',
  corp4: 'tenant-corp-004',
} as const;

export const USER_IDS = {
  superAdmin: 'user-super-admin-001',
  masterAdmin: 'user-master-admin-001',
  sub1Admin: 'user-sub1-admin-001',
  sub1Agent: 'user-sub1-agent-001',
  sub1Agent2: 'user-sub1-agent-002',
  sub2Admin: 'user-sub2-admin-001',
  sub2Agent: 'user-sub2-agent-001',
  sub3Admin: 'user-sub3-admin-001',
  sub4Admin: 'user-sub4-admin-001',   // Suspended tenant
  sub5Admin: 'user-sub5-admin-001',
  sub6Admin: 'user-sub6-admin-001',
  corp1Admin: 'user-corp1-admin-001',
  corp2Admin: 'user-corp2-admin-001',
} as const;

export async function seedTenants(prisma: PrismaClient) {
  console.log('\n🏢 [02-tenants] Seeding tenants, users, channels, keys...');
  const passwordHash = await getSeedPasswordHash();

  // ── Master Tenant ──────────────────────────────────────────────────────────
  await prisma.tenant.upsert({
    where: { id: TENANT_IDS.master },
    update: {},
    create: {
      id: TENANT_IDS.master,
      agentCode: 'MASTER001',
      name: 'TripAlfa Master Agency',
      type: TenantType.MASTER,
      status: 'ACTIVE' as TenantStatus,
      databaseUrl: process.env.MASTER_DATABASE_URL ?? '',
      databaseSchema: 'public',
      contactEmail: 'admin@tripalfa.com',
      contactPhone: '+97317001000',
      address: '123 Diplomatic Area',
      city: 'Manama',
      country: 'Bahrain',
      creditLimit: 0,
      paymentType: 'CREDIT',
      accessFlights: true,
      accessHotels: true,
      accessCars: true,
      accessInsurance: true,
      accessPackages: true,
      accessSightseeing: true,
      accessTransfers: true,
      enableB2B2C: true,
      canManageMarkups: true,
      canManageUsers: true,
      canManageBranches: true,
      canManageRoles: true,
      canImportPNR: true,
      canAllowAutoTicket: true,
      iataNo: 'IATA-MASTER-001',
      vatNo: 'VAT-BH-MASTER',
      language: 'English',
      noOfEmployees: 50,
      noOfBranches: 3,
      annualTurnover: 5000000,
      payPeriod: 'Monthly',
      isActive: true,
      perfSparkline: [120, 135, 142, 156, 148, 163, 178, 190, 185, 200, 212, 225],
    },
  });

  // ── Sub-Agents ─────────────────────────────────────────────────────────────
  const subAgents = [
    {
      id: TENANT_IDS.sub1,
      agentCode: 'SUBA001',
      name: 'Gulf Travel Solutions',
      status: 'ACTIVE' as TenantStatus,
      creditLimit: 50000,
      city: 'Manama',
      country: 'Bahrain',
      iataNo: 'IATA-SA-001',
      noOfEmployees: 25,
      annualTurnover: 1200000,
      perfSparkline: [85, 92, 105, 98, 112, 118, 125, 130, 128, 135, 140, 150],
    },
    {
      id: TENANT_IDS.sub2,
      agentCode: 'SUBA002',
      name: 'Riyadh Express Travel',
      status: 'ACTIVE' as TenantStatus,
      creditLimit: 15000,
      city: 'Riyadh',
      country: 'Saudi Arabia',
      iataNo: 'IATA-SA-002',
      noOfEmployees: 12,
      annualTurnover: 450000,
      perfSparkline: [45, 52, 48, 60, 58, 65, 70, 75, 72, 80, 85, 90],
    },
    {
      id: TENANT_IDS.sub3,
      agentCode: 'SUBA003',
      name: 'Dubai Horizons Agency',
      status: 'ACTIVE' as TenantStatus,
      creditLimit: 5000,
      city: 'Dubai',
      country: 'UAE',
      iataNo: 'IATA-SA-003',
      noOfEmployees: 6,
      annualTurnover: 120000,
      perfSparkline: [20, 22, 25, 28, 24, 30, 32, 35, 33, 38, 40, 42],
    },
    {
      id: TENANT_IDS.sub4,
      agentCode: 'SUBA004',
      name: 'Nile Tours Egypt',
      status: 'SUSPENDED' as TenantStatus,
      creditLimit: 8000,
      city: 'Cairo',
      country: 'Egypt',
      iataNo: 'IATA-SA-004',
      noOfEmployees: 8,
      annualTurnover: 80000,
      perfSparkline: [30, 28, 25, 20, 15, 10, 8, 5, 3, 2, 1, 0],
    },
    {
      id: TENANT_IDS.sub5,
      agentCode: 'SUBA005',
      name: 'Jeddah Flyers B2B2C',
      status: 'ACTIVE' as TenantStatus,
      creditLimit: 25000,
      city: 'Jeddah',
      country: 'Saudi Arabia',
      iataNo: 'IATA-SA-005',
      enableB2B2C: true,
      noOfEmployees: 18,
      annualTurnover: 700000,
      perfSparkline: [60, 65, 70, 68, 75, 80, 85, 88, 92, 98, 105, 110],
    },
    {
      id: TENANT_IDS.sub6,
      agentCode: 'SUBA006',
      name: 'Kuwait Wings Travel',
      status: 'ACTIVE' as TenantStatus,
      creditLimit: 10000,
      city: 'Kuwait City',
      country: 'Kuwait',
      iataNo: 'IATA-SA-006',
      accessCars: false,
      accessInsurance: false,
      noOfEmployees: 5,
      annualTurnover: 95000,
      perfSparkline: [25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 52],
    },
  ];

  for (const sub of subAgents) {
    await prisma.tenant.upsert({
      where: { id: sub.id },
      update: {},
      create: {
        ...sub,
        type: TenantType.SUB_AGENT,
        parentId: TENANT_IDS.master,
        databaseUrl: process.env.MASTER_DATABASE_URL ?? '',
        databaseSchema: 'public',
        contactEmail: `admin@${sub.agentCode.toLowerCase()}.com`,
        contactPhone: `+973170${faker.number.int({ min: 10000, max: 99999 })}`,
        paymentType: 'CREDIT',
        accessFlights: true,
        accessHotels: true,
        accessCars: sub.agentCode === 'SUBA006' ? false : true,
        accessInsurance: sub.agentCode === 'SUBA006' ? false : true,
        enableB2B2C: sub.enableB2B2C ?? false,
        canManageMarkups: true,
        canManageUsers: true,
        canImportPNR: true,
        canAllowAutoTicket: true,
        language: 'English',
        payPeriod: 'Monthly',
        isActive: sub.status === TenantStatus.ACTIVE,
        perfSparkline: sub.perfSparkline,
      },
    });
  }
  log('02-tenants', 'Tenant (SUB_AGENT)', subAgents.length);

  // ── Corporate Tenants ──────────────────────────────────────────────────────
  const corporates = [
    { id: TENANT_IDS.corp1, agentCode: 'CORP001', name: 'Bahrain Petroleum Co', city: 'Awali', creditLimit: 100000 },
    { id: TENANT_IDS.corp2, agentCode: 'CORP002', name: 'Gulf Finance House', city: 'Manama', creditLimit: 75000 },
    { id: TENANT_IDS.corp3, agentCode: 'CORP003', name: 'Saudi Telecom Ventures', city: 'Riyadh', creditLimit: 200000 },
    { id: TENANT_IDS.corp4, agentCode: 'CORP004', name: 'Emirates Logistics Ltd', city: 'Dubai', creditLimit: 50000 },
  ];

  for (const corp of corporates) {
    await prisma.tenant.upsert({
      where: { id: corp.id },
      update: {},
      create: {
        ...corp,
        type: TenantType.CORPORATE,
        status: 'ACTIVE' as TenantStatus,
        parentId: TENANT_IDS.sub1,
        databaseUrl: process.env.MASTER_DATABASE_URL ?? '',
        databaseSchema: 'public',
        contactEmail: `travel@${corp.agentCode.toLowerCase()}.com`,
        paymentType: 'CREDIT',
        accessFlights: true,
        accessHotels: true,
        canManageMarkups: false,
        canManageUsers: true,
        isActive: true,
        language: 'English',
        country: 'Bahrain',
        perfSparkline: [10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38],
      },
    });
  }
  log('02-tenants', 'Tenant (CORPORATE)', corporates.length);
  log('02-tenants', 'Tenant (MASTER)', 1);

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = [
    // Master
    { id: USER_IDS.superAdmin, tenantId: TENANT_IDS.master, username: 'superadmin', email: 'superadmin@tripalfa.com', name: 'Super Admin', role: 'SUPER_ADMIN', lastLoginAt: daysAgo(1) },
    { id: USER_IDS.masterAdmin, tenantId: TENANT_IDS.master, username: 'masteradmin', email: 'masteradmin@tripalfa.com', name: 'Master Admin', role: 'ADMIN', lastLoginAt: daysAgo(2) },
    // Sub1
    { id: USER_IDS.sub1Admin, tenantId: TENANT_IDS.sub1, username: 'gulf.admin', email: 'admin@gulftravelsolutions.com', name: 'Gulf Admin', role: 'ADMIN', lastLoginAt: daysAgo(1) },
    { id: USER_IDS.sub1Agent, tenantId: TENANT_IDS.sub1, username: 'gulf.agent1', email: 'agent1@gulftravelsolutions.com', name: 'Ahmed Al-Mansoori', role: 'AGENT', lastLoginAt: daysAgo(3) },
    { id: USER_IDS.sub1Agent2, tenantId: TENANT_IDS.sub1, username: 'gulf.agent2', email: 'agent2@gulftravelsolutions.com', name: 'Fatima Al-Hassan', role: 'AGENT', lastLoginAt: null },
    // Sub2
    { id: USER_IDS.sub2Admin, tenantId: TENANT_IDS.sub2, username: 'riyadh.admin', email: 'admin@riyadhexpress.com', name: 'Riyadh Admin', role: 'ADMIN', lastLoginAt: daysAgo(5) },
    { id: USER_IDS.sub2Agent, tenantId: TENANT_IDS.sub2, username: 'riyadh.agent1', email: 'agent@riyadhexpress.com', name: 'Mohammed Al-Qahtani', role: 'AGENT', lastLoginAt: daysAgo(10) },
    // Sub3
    { id: USER_IDS.sub3Admin, tenantId: TENANT_IDS.sub3, username: 'dubai.admin', email: 'admin@dubaihorizons.com', name: 'Dubai Admin', role: 'ADMIN', lastLoginAt: daysAgo(2) },
    // Sub4 (suspended)
    { id: USER_IDS.sub4Admin, tenantId: TENANT_IDS.sub4, username: 'nile.admin', email: 'admin@niletours.com', name: 'Nile Admin', role: 'ADMIN', lastLoginAt: daysAgo(90), isActive: false },
    // Sub5
    { id: USER_IDS.sub5Admin, tenantId: TENANT_IDS.sub5, username: 'jeddah.admin', email: 'admin@jeddahflyers.com', name: 'Jeddah Admin', role: 'ADMIN', lastLoginAt: daysAgo(1) },
    // Sub6
    { id: USER_IDS.sub6Admin, tenantId: TENANT_IDS.sub6, username: 'kuwait.admin', email: 'admin@kuwaitwings.com', name: 'Kuwait Admin', role: 'ADMIN', lastLoginAt: daysAgo(7) },
    // Corporates
    { id: USER_IDS.corp1Admin, tenantId: TENANT_IDS.corp1, username: 'bpc.travel', email: 'travel@bpc.com.bh', name: 'BPC Travel Manager', role: 'ADMIN', lastLoginAt: daysAgo(1) },
    { id: USER_IDS.corp2Admin, tenantId: TENANT_IDS.corp2, username: 'gfh.travel', email: 'travel@gfh.com', name: 'GFH Travel Coordinator', role: 'AGENT', lastLoginAt: daysAgo(4) },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        tenantId: u.tenantId,
        username: u.username,
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        isActive: u.isActive ?? true,
        lastLoginAt: u.lastLoginAt,
      },
    });
  }
  log('02-tenants', 'User', users.length);

  // ── SalesChannelConfig ─────────────────────────────────────────────────────
  const channels = [
    { tenantId: TENANT_IDS.master, channelCode: 'POS-MASTER-DC', name: 'Master Direct Channel', slug: 'master-pos-dc' },
    { tenantId: TENANT_IDS.master, channelCode: 'POS-MASTER-WEB', name: 'Master Web Channel', slug: 'master-pos-web' },
    { tenantId: TENANT_IDS.sub1, channelCode: 'POS-GULF-DC', name: 'Gulf Direct Channel', slug: 'gulf-pos-dc' },
    { tenantId: TENANT_IDS.sub1, channelCode: 'POS-GULF-SA', name: 'Gulf Sub-Agent Channel', slug: 'gulf-pos-sa' },
    { tenantId: TENANT_IDS.sub2, channelCode: 'POS-RIYADH-DC', name: 'Riyadh Direct Channel', slug: 'riyadh-pos-dc' },
    { tenantId: TENANT_IDS.sub5, channelCode: 'POS-JED-B2C', name: 'Jeddah B2C Web', slug: 'jeddah-b2c-web' },
  ];

  for (const ch of channels) {
    await prisma.salesChannelConfig.upsert({
      where: { channelCode: ch.channelCode },
      update: {},
      create: { ...ch, isActive: true, markupOverride: null, commissionShare: null },
    });
  }
  log('02-tenants', 'SalesChannelConfig', channels.length);

  // ── ApiKey ─────────────────────────────────────────────────────────────────
  const apiKeys = [
    { tenantId: TENANT_IDS.master, key: 'sk_master_test_abc123def456', name: 'Master API Key', scopes: ['bookings:read', 'bookings:write', 'reports:read'] },
    { tenantId: TENANT_IDS.sub1, key: 'sk_gulf_test_xyz789uvw012', name: 'Gulf API Key', scopes: ['bookings:read', 'bookings:write'] },
    { tenantId: TENANT_IDS.sub5, key: 'sk_jed_test_b2c345fgh678', name: 'Jeddah B2C Key', scopes: ['search:read', 'bookings:write'] },
  ];

  for (const ak of apiKeys) {
    await prisma.apiKey.upsert({
      where: { key: ak.key },
      update: {},
      create: { ...ak, isActive: true, expiresAt: new Date('2027-12-31') },
    });
  }
  log('02-tenants', 'ApiKey', apiKeys.length);
}
