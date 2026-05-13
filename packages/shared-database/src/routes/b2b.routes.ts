import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { prisma } from '../database/prisma.js';

const router: Router = Router();

// Helper: safely extract a string from query params
function qsString(val: any): string | undefined {
  return typeof val === 'string' ? val : undefined;
}

// Helper: build pagination meta
function buildMeta(page: number, pageSize: number, totalItems: number) {
  const totalPages = Math.ceil(totalItems / pageSize);
  return { page, pageSize, totalItems, totalPages };
}

// ---------------------------------------------------------------------------
// TENANTS
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/v1/b2b/tenants:
 *   get:
 *     tags: [B2B Portal]
 *     summary: List tenants
 *     description: Retrieve a paginated list of all tenants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: pageSize
 *         in: query
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *       - name: type
 *         in: query
 *         schema: { type: string, enum: [MASTER, SUB_AGENT, CORPORATE] }
 *     responses:
 *       200:
 *         description: Tenants list retrieved successfully
 */
router.get('/tenants', authenticateToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
  const status = qsString(req.query.status);
  const type = qsString(req.query.type);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [data, totalItems] = await Promise.all([
    prisma.tenant.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.tenant.count({ where }),
  ]);

  res.json({ data, meta: buildMeta(page, pageSize, totalItems) });
}));

/**
 * @openapi
 * /api/v1/b2b/tenants/{id}:
 *   get:
 *     tags: [B2B Portal]
 *     summary: Get tenant by ID
 *     description: Retrieve a specific tenant by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant retrieved successfully
 *       404:
 *         description: Tenant not found
 */
router.get('/tenants/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const tenant = await prisma.tenant.findUnique({ where: { id } });

  if (!tenant) {
    const error: any = new Error('Tenant not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  res.json({ data: tenant });
}));

/**
 * @openapi
 * /api/v1/b2b/tenants:
 *   post:
 *     tags: [B2B Portal]
 *     summary: Create tenant
 *     description: Create a new tenant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - agentCode
 *               - contactEmail
 *             properties:
 *               name: { type: string }
 *               agentCode: { type: string }
 *               type: { type: string, enum: [MASTER, SUB_AGENT, CORPORATE] }
 *               status: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *               contactEmail: { type: string }
 *               contactPhone: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               country: { type: string }
 *               creditLimit: { type: number }
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *       400:
 *         description: Bad request
 */
router.post('/tenants', authenticateToken, asyncHandler(async (req, res) => {
  const {
    name,
    agentCode,
    type = 'SUB_AGENT',
    status = 'ACTIVE',
    contactEmail,
    contactPhone,
    address,
    city,
    country,
    creditLimit = 0
  } = req.body;

  if (!name || !agentCode || !contactEmail) {
    const error: any = new Error('Missing required fields: name, agentCode, contactEmail');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const tenant = await prisma.tenant.create({
    data: { name, agentCode, type, status, contactEmail, contactPhone, address, city, country, creditLimit },
  });

  res.status(201).json({ data: tenant });
}));

/**
 * @openapi
 * /api/v1/b2b/tenants/{id}:
 *   put:
 *     tags: [B2B Portal]
 *     summary: Update tenant
 *     description: Update an existing tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               status: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *               contactEmail: { type: string }
 *               contactPhone: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               country: { type: string }
 *               creditLimit: { type: number }
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       404:
 *         description: Tenant not found
 */
router.put('/tenants/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const {
    name, status, contactEmail, contactPhone, address, city, country, creditLimit
  } = req.body;

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (status !== undefined) updates.status = status;
  if (contactEmail !== undefined) updates.contactEmail = contactEmail;
  if (contactPhone !== undefined) updates.contactPhone = contactPhone;
  if (address !== undefined) updates.address = address;
  if (city !== undefined) updates.city = city;
  if (country !== undefined) updates.country = country;
  if (creditLimit !== undefined) updates.creditLimit = creditLimit;

  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Tenant not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const tenant = await prisma.tenant.update({ where: { id }, data: updates });
  res.json({ data: tenant });
}));

// ---------------------------------------------------------------------------
// PARTNERS
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/v1/b2b/partners:
 *   get:
 *     tags: [B2B Portal]
 *     summary: List partners
 *     description: Retrieve a paginated list of partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: pageSize
 *         in: query
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - name: tenantId
 *         in: query
 *         schema: { type: string }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *     responses:
 *       200:
 *         description: Partners list retrieved successfully
 */
router.get('/partners', authenticateToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
  const tenantId = qsString(req.query.tenantId);
  const status = qsString(req.query.status);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (status) where.status = status;

  const [rows, totalItems] = await Promise.all([
    prisma.partner.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { tenant: { select: { name: true } } },
    }),
    prisma.partner.count({ where }),
  ]);

  const data = rows.map((p: any) => ({ ...p, tenantName: p.tenant?.name }));

  res.json({ data, meta: buildMeta(page, pageSize, totalItems) });
}));

/**
 * @openapi
 * /api/v1/b2b/partners/{id}:
 *   get:
 *     tags: [B2B Portal]
 *     summary: Get partner by ID
 *     description: Retrieve a specific partner by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Partner retrieved successfully
 *       404:
 *         description: Partner not found
 */
router.get('/partners/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { tenant: { select: { name: true } } },
  });

  if (!partner) {
    const error: any = new Error('Partner not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  res.json({ data: { ...partner, tenantName: (partner as any).tenant?.name } });
}));

/**
 * @openapi
 * /api/v1/b2b/partners:
 *   post:
 *     tags: [B2B Portal]
 *     summary: Create partner
 *     description: Create a new partner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - name
 *               - code
 *             properties:
 *               tenantId: { type: string }
 *               name: { type: string }
 *               code: { type: string }
 *               type: { type: string, enum: [RETAIL, CORPORATE, SUB_AGENT] }
 *               status: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *               contactName: { type: string }
 *               contactEmail: { type: string }
 *               contactPhone: { type: string }
 *               commissionRate: { type: number }
 *               creditLimit: { type: number }
 *     responses:
 *       201:
 *         description: Partner created successfully
 */
router.post('/partners', authenticateToken, asyncHandler(async (req, res) => {
  const {
    tenantId,
    name,
    code,
    type = 'RETAIL',
    status = 'ACTIVE',
    contactName,
    contactEmail,
    contactPhone,
    commissionRate = 0,
    creditLimit = 0
  } = req.body;

  if (!tenantId || !name || !code) {
    const error: any = new Error('Missing required fields: tenantId, name, code');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const partner = await prisma.partner.create({
    data: { tenantId, name, code, type, status, contactName, contactEmail, contactPhone, commissionRate, creditLimit },
  });

  res.status(201).json({ data: partner });
}));

/**
 * @openapi
 * /api/v1/b2b/partners/{id}:
 *   put:
 *     tags: [B2B Portal]
 *     summary: Update partner
 *     description: Update an existing partner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               status: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *               contactName: { type: string }
 *               contactEmail: { type: string }
 *               contactPhone: { type: string }
 *               commissionRate: { type: number }
 *               creditLimit: { type: number }
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *       404:
 *         description: Partner not found
 */
router.put('/partners/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { name, status, contactName, contactEmail, contactPhone, commissionRate, creditLimit } = req.body;

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (status !== undefined) updates.status = status;
  if (contactName !== undefined) updates.contactName = contactName;
  if (contactEmail !== undefined) updates.contactEmail = contactEmail;
  if (contactPhone !== undefined) updates.contactPhone = contactPhone;
  if (commissionRate !== undefined) updates.commissionRate = commissionRate;
  if (creditLimit !== undefined) updates.creditLimit = creditLimit;

  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const existing = await prisma.partner.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Partner not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const partner = await prisma.partner.update({ where: { id }, data: updates });
  res.json({ data: partner });
}));

// ---------------------------------------------------------------------------
// AGREEMENTS
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/v1/b2b/agreements:
 *   get:
 *     tags: [B2B Portal]
 *     summary: List agreements
 *     description: Retrieve a paginated list of agreements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: pageSize
 *         in: query
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - name: tenantId
 *         in: query
 *         schema: { type: string }
 *       - name: partnerId
 *         in: query
 *         schema: { type: string }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [ACTIVE, EXPIRED, TERMINATED, DRAFT] }
 *     responses:
 *       200:
 *         description: Agreements list retrieved successfully
 */
router.get('/agreements', authenticateToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
  const tenantId = qsString(req.query.tenantId);
  const partnerId = qsString(req.query.partnerId);
  const status = qsString(req.query.status);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (partnerId) where.partnerId = partnerId;
  if (status) where.status = status;

  const [rows, totalItems] = await Promise.all([
    prisma.agreement.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { tenant: { select: { name: true } }, partner: { select: { name: true } } },
    }),
    prisma.agreement.count({ where }),
  ]);

  const data = rows.map((a: any) => ({
    ...a,
    tenantName: a.tenant?.name,
    partnerName: a.partner?.name,
  }));

  res.json({ data, meta: buildMeta(page, pageSize, totalItems) });
}));

/**
 * @openapi
 * /api/v1/b2b/agreements/{id}:
 *   get:
 *     tags: [B2B Portal]
 *     summary: Get agreement by ID
 *     description: Retrieve a specific agreement by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Agreement retrieved successfully
 *       404:
 *         description: Agreement not found
 */
router.get('/agreements/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const agreement = await prisma.agreement.findUnique({
    where: { id },
    include: { tenant: { select: { name: true } }, partner: { select: { name: true } } },
  });

  if (!agreement) {
    const error: any = new Error('Agreement not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  res.json({
    data: { ...agreement, tenantName: (agreement as any).tenant?.name, partnerName: (agreement as any).partner?.name },
  });
}));

/**
 * @openapi
 * /api/v1/b2b/agreements:
 *   post:
 *     tags: [B2B Portal]
 *     summary: Create agreement
 *     description: Create a new agreement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - partnerId
 *               - agreementNumber
 *               - title
 *               - startDate
 *             properties:
 *               tenantId: { type: string }
 *               partnerId: { type: string }
 *               agreementNumber: { type: string }
 *               title: { type: string }
 *               type: { type: string, enum: [STANDARD, COMMISSION, MARKUP, SPECIAL] }
 *               status: { type: string, enum: [ACTIVE, EXPIRED, TERMINATED, DRAFT] }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               commissionRate: { type: number }
 *               markupRate: { type: number }
 *               discountRate: { type: number }
 *               terms: { type: string }
 *     responses:
 *       201:
 *         description: Agreement created successfully
 */
router.post('/agreements', authenticateToken, asyncHandler(async (req, res) => {
  const {
    tenantId,
    partnerId,
    agreementNumber,
    title,
    type = 'STANDARD',
    status = 'ACTIVE',
    startDate,
    endDate,
    commissionRate = 0,
    markupRate = 0,
    discountRate = 0,
    terms
  } = req.body;

  if (!tenantId || !partnerId || !agreementNumber || !title || !startDate) {
    const error: any = new Error('Missing required fields: tenantId, partnerId, agreementNumber, title, startDate');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const agreement = await prisma.agreement.create({
    data: { tenantId, partnerId, agreementNumber, title, type, status, startDate, endDate, commissionRate, markupRate, discountRate, terms },
  });

  res.status(201).json({ data: agreement });
}));

/**
 * @openapi
 * /api/v1/b2b/agreements/{id}:
 *   put:
 *     tags: [B2B Portal]
 *     summary: Update agreement
 *     description: Update an existing agreement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [ACTIVE, EXPIRED, TERMINATED, DRAFT] }
 *               endDate: { type: string, format: date }
 *               commissionRate: { type: number }
 *               markupRate: { type: number }
 *               discountRate: { type: number }
 *               terms: { type: string }
 *     responses:
 *       200:
 *         description: Agreement updated successfully
 *       404:
 *         description: Agreement not found
 */
router.put('/agreements/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { status, endDate, commissionRate, markupRate, discountRate, terms } = req.body;

  const updates: any = {};
  if (status !== undefined) updates.status = status;
  if (endDate !== undefined) updates.endDate = endDate;
  if (commissionRate !== undefined) updates.commissionRate = commissionRate;
  if (markupRate !== undefined) updates.markupRate = markupRate;
  if (discountRate !== undefined) updates.discountRate = discountRate;
  if (terms !== undefined) updates.terms = terms;

  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const existing = await prisma.agreement.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Agreement not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const agreement = await prisma.agreement.update({ where: { id }, data: updates });
  res.json({ data: agreement });
}));

// ---------------------------------------------------------------------------
// B2B BOOKINGS
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/v1/b2b/bookings:
 *   get:
 *     tags: [B2B Portal]
 *     summary: List B2B bookings
 *     description: Retrieve a paginated list of B2B bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: pageSize
 *         in: query
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - name: tenantId
 *         in: query
 *         schema: { type: string }
 *       - name: partnerId
 *         in: query
 *         schema: { type: string }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, REFUNDED] }
 *       - name: bookingRef
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: B2B bookings list retrieved successfully
 */
router.get('/bookings', authenticateToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
  const tenantId = qsString(req.query.tenantId);
  const partnerId = qsString(req.query.partnerId);
  const status = qsString(req.query.status);
  const bookingRef = qsString(req.query.bookingRef);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (partnerId) where.partnerId = partnerId;
  if (status) where.status = status;
  if (bookingRef) where.bookingRef = bookingRef;

  const [rows, totalItems] = await Promise.all([
    prisma.b2BBooking.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { tenant: { select: { name: true } }, partner: { select: { name: true } } },
    }),
    prisma.b2BBooking.count({ where }),
  ]);

  const data = rows.map((b: any) => ({
    ...b,
    tenantName: b.tenant?.name,
    partnerName: b.partner?.name,
  }));

  res.json({ data, meta: buildMeta(page, pageSize, totalItems) });
}));

/**
 * @openapi
 * /api/v1/b2b/bookings/{id}:
 *   get:
 *     tags: [B2B Portal]
 *     summary: Get B2B booking by ID
 *     description: Retrieve a specific B2B booking by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: B2B booking retrieved successfully
 *       404:
 *         description: B2B booking not found
 */
router.get('/bookings/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const booking = await prisma.b2BBooking.findUnique({
    where: { id },
    include: { tenant: { select: { name: true } }, partner: { select: { name: true } } },
  });

  if (!booking) {
    const error: any = new Error('B2B booking not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  res.json({
    data: { ...booking, tenantName: (booking as any).tenant?.name, partnerName: (booking as any).partner?.name },
  });
}));

/**
 * @openapi
 * /api/v1/b2b/bookings:
 *   post:
 *     tags: [B2B Portal]
 *     summary: Create B2B booking
 *     description: Create a new B2B booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - partnerId
 *               - bookingRef
 *               - service
 *               - amount
 *               - currency
 *               - netAmount
 *             properties:
 *               tenantId: { type: string }
 *               partnerId: { type: string }
 *               bookingRef: { type: string }
 *               service: { type: string, enum: [FLIGHT, HOTEL, CAR, PACKAGE] }
 *               productType: { type: string }
 *               status: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, REFUNDED] }
 *               amount: { type: number }
 *               currency: { type: string }
 *               commission: { type: number }
 *               netAmount: { type: number }
 *               customerName: { type: string }
 *               customerEmail: { type: string }
 *               customerPhone: { type: string }
 *               travelDate: { type: string, format: date }
 *               returnDate: { type: string, format: date }
 *               pnr: { type: string }
 *     responses:
 *       201:
 *         description: B2B booking created successfully
 */
router.post('/bookings', authenticateToken, asyncHandler(async (req, res) => {
  const {
    tenantId,
    partnerId,
    bookingRef,
    service,
    productType,
    status = 'PENDING',
    amount,
    currency = 'USD',
    commission = 0,
    netAmount,
    customerName,
    customerEmail,
    customerPhone,
    travelDate,
    returnDate,
    pnr
  } = req.body;

  if (!tenantId || !partnerId || !bookingRef || !service || !amount || !netAmount) {
    const error: any = new Error('Missing required fields: tenantId, partnerId, bookingRef, service, amount, netAmount');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const booking = await prisma.b2BBooking.create({
    data: {
      tenantId, partnerId, bookingRef, service, productType, status, amount, currency, commission, netAmount,
      customerName, customerEmail, customerPhone, travelDate, returnDate, pnr,
    },
  });

  res.status(201).json({ data: booking });
}));

/**
 * @openapi
 * /api/v1/b2b/bookings/{id}:
 *   put:
 *     tags: [B2B Portal]
 *     summary: Update B2B booking
 *     description: Update an existing B2B booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, REFUNDED] }
 *               amount: { type: number }
 *               currency: { type: string }
 *               commission: { type: number }
 *               netAmount: { type: number }
 *               customerName: { type: string }
 *               customerEmail: { type: string }
 *               customerPhone: { type: string }
 *               travelDate: { type: string, format: date }
 *               returnDate: { type: string, format: date }
 *               pnr: { type: string }
 *     responses:
 *       200:
 *         description: B2B booking updated successfully
 *       404:
 *         description: B2B booking not found
 */
router.put('/bookings/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { status, amount, currency, commission, netAmount, customerName, customerEmail, customerPhone, travelDate, returnDate, pnr } = req.body;

  const updates: any = {};
  if (status !== undefined) updates.status = status;
  if (amount !== undefined) updates.amount = amount;
  if (currency !== undefined) updates.currency = currency;
  if (commission !== undefined) updates.commission = commission;
  if (netAmount !== undefined) updates.netAmount = netAmount;
  if (customerName !== undefined) updates.customerName = customerName;
  if (customerEmail !== undefined) updates.customerEmail = customerEmail;
  if (customerPhone !== undefined) updates.customerPhone = customerPhone;
  if (travelDate !== undefined) updates.travelDate = travelDate;
  if (returnDate !== undefined) updates.returnDate = returnDate;
  if (pnr !== undefined) updates.pnr = pnr;

  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const existing = await prisma.b2BBooking.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('B2B booking not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const booking = await prisma.b2BBooking.update({ where: { id }, data: updates });
  res.json({ data: booking });
}));

// Soft Deletes

router.delete('/tenants/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Tenant not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  await prisma.tenant.update({ where: { id }, data: { status: 'INACTIVE' } });
  res.json({ success: true, message: 'Tenant soft-deleted' });
}));

router.delete('/partners/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.partner.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Partner not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  await prisma.partner.update({ where: { id }, data: { status: 'INACTIVE' } });
  res.json({ success: true, message: 'Partner soft-deleted' });
}));

router.delete('/agreements/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.agreement.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Agreement not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  await prisma.agreement.update({ where: { id }, data: { status: 'TERMINATED' } });
  res.json({ success: true, message: 'Agreement terminated' });
}));

router.delete('/bookings/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.b2BBooking.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('B2B booking not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  await prisma.b2BBooking.update({ where: { id }, data: { status: 'CANCELLED' } });
  res.json({ success: true, message: 'Booking cancelled' });
}));

// Status Transition
router.patch('/bookings/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { status } = req.body;
  if (!status) {
    const error: any = new Error('Status is required');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }
  const existing = await prisma.b2BBooking.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('B2B booking not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  const booking = await prisma.b2BBooking.update({ where: { id }, data: { status } });
  res.json({ data: booking });
}));

// Dashboard Stats
router.get('/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
  const [tenants, partners, agreements, bookings] = await Promise.all([
    prisma.tenant.count(),
    prisma.partner.count(),
    prisma.agreement.count(),
    prisma.b2BBooking.count(),
  ]);

  res.json({ data: { tenantsCount: tenants, partnersCount: partners, agreementsCount: agreements, bookingsCount: bookings } });
}));

export default router;