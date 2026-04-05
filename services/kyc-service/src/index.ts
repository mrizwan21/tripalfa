import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from '@tripalfa/shared-database';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { setupKYCSwagger } from './swagger.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.KYC_SERVICE_PORT || process.env.PORT || 3011;

// JWT configuration - MUST be set via environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'tripalfa-auth';

if (!JWT_SECRET) {
  console.error('[KYCService] FATAL: JWT_SECRET environment variable is not set!');
  console.error('[KYCService] Authentication will fail for all requests.');
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Extended request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * JWT token payload interface
 */
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

/**
 * Verify JWT token from Authorization header
 * Supports both JWT tokens and internal API key for service-to-service calls
 */
async function verifyToken(
  token: string
): Promise<{ id: string; email: string; role: string } | null> {
  try {
    // Extract token value from Bearer scheme
    const tokenValue = token.startsWith('Bearer ') ? token.substring(7) : token;

    // Service-to-service authentication with API key
    // This allows internal services to authenticate without JWT
    if (tokenValue === process.env.INTERNAL_API_KEY && process.env.INTERNAL_API_KEY) {
      return { id: 'system', email: 'system@internal', role: 'admin' };
    }

    // JWT verification - requires JWT_SECRET to be configured
    if (!JWT_SECRET) {
      console.error('[KYCService] Cannot verify JWT: JWT_SECRET is not configured');
      return null;
    }

    try {
      const decoded = jwt.verify(tokenValue, JWT_SECRET, {
        issuer: JWT_ISSUER,
      }) as JwtPayload;

      // Validate required fields in token
      if (!decoded.id || !decoded.email || !decoded.role) {
        console.error('[KYCService] JWT token missing required fields');
        return null;
      }

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        console.warn('[KYCService] JWT token expired:', jwtError.expiredAt);
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        console.warn('[KYCService] Invalid JWT token:', jwtError.message);
      } else if (jwtError instanceof jwt.NotBeforeError) {
        console.warn('[KYCService] JWT token not yet valid');
      } else {
        console.error('[KYCService] JWT verification error:', jwtError);
      }
      return null;
    }
  } catch (error) {
    console.error('[KYCService] Token verification failed:', error);
    return null;
  }
}

/**
 * Authentication middleware for KYC endpoints
 * Requires valid Authorization header with Bearer token
 */
async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is required',
    });
    return;
  }

  const user = await verifyToken(authHeader);

  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
    return;
  }

  // Attach user to request for use in route handlers
  (req as AuthenticatedRequest).user = user;
  next();
}

/**
 * Admin-only middleware for sensitive operations
 * Requires the authenticated user to have 'admin' role
 */
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthenticatedRequest).user;

  if (!user || user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required for this operation',
    });
    return;
  }

  next();
}

/**
 * Rate limiting middleware (basic implementation)
 * In production, use express-rate-limit or similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  record.count++;
  next();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'kyc-service' });
});

// Validation schemas
const submitKycSchema = z.object({
  userId: z.string().min(1),
  documentType: z.enum([
    'passport',
    'national_id',
    'drivers_license',
    'utility_bill',
    'bank_statement',
  ]),
  documentNumber: z.string().min(1),
  documentFront: z.string().optional(), // Base64 encoded or URL
  documentBack: z.string().optional(),
  selfie: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nationality: z.string().min(2),
  address: z
    .object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().optional(),
      postalCode: z.string().min(1),
      country: z.string().min(2),
    })
    .optional(),
});

const updateKycStatusSchema = z.object({
  status: z.enum(['pending', 'under_review', 'approved', 'rejected', 'expired']),
  rejectionReason: z.string().optional(),
  reviewedBy: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================
// KYC ROUTES (All routes require authentication)
// ============================================

// Apply authentication to all KYC routes
app.use('/api/kyc', requireAuth);

/**
 * @swagger
 * /api/kyc:
 *   get:
 *     summary: List KYC records
 *     tags: [KYC]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server error
 */
app.get('/api/kyc', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0', status, userId } = req.query;
    const limitNum = Math.min(parseInt(String(limit)), 100);
    const offsetNum = parseInt(String(offset));

    const where: any = {};
    if (status) where.status = String(status);
    if (userId) where.userId = String(userId);

    const [verifications, total] = await Promise.all([
      prisma.kycVerification.findMany({
        where,
        take: limitNum,
        skip: offsetNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.kycVerification.count({ where }),
    ]);

    res.json({
      data: verifications,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total,
      },
    });
  } catch (error) {
    console.error('[KYCService] List error:', error);
    res.status(500).json({
      error: 'Failed to list KYC verifications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/kyc/submit:
 *   post:
 *     summary: Submit KYC verification
 *     tags: [KYC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, documentType, documentNumber, firstName, lastName, dateOfBirth, nationality]
 *             properties:
 *               userId:
 *                 type: string
 *               documentType:
 *                 type: string
 *                 enum: [passport, national_id, drivers_license, utility_bill, bank_statement]
 *               documentNumber:
 *                 type: string
 *               documentFront:
 *                 type: string
 *               documentBack:
 *                 type: string
 *               selfie:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: KYC verification submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       409:
 *         description: KYC verification already exists
 *       500:
 *         description: Server error
 */
app.post('/api/kyc/submit', async (req: Request, res: Response) => {
  try {
    const validationResult = submitKycSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.flatten().fieldErrors,
      });
    }

    const data = validationResult.data;

    // Check if user already has a pending or approved verification
    const existingVerification = await prisma.kycVerification.findFirst({
      where: {
        userId: data.userId,
        status: { in: ['pending', 'under_review', 'approved'] },
      },
    });

    if (existingVerification) {
      return res.status(409).json({
        error: 'KYC verification already exists',
        message: `User already has a ${existingVerification.status} verification`,
        verificationId: existingVerification.id,
      });
    }

    // Create KYC verification record
    const verification = await prisma.kycVerification.create({
      data: {
        userId: data.userId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentFront: data.documentFront,
        documentBack: data.documentBack,
        selfie: data.selfie,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        nationality: data.nationality,
        address: data.address as any,
        status: 'pending',
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    console.log(`[KYCService] KYC verification submitted for user ${data.userId}`);

    res.status(201).json({
      id: verification.id,
      userId: verification.userId,
      status: verification.status,
      submittedAt: verification.submittedAt,
      expiresAt: verification.expiresAt,
    });
  } catch (error) {
    console.error('[KYCService] Submit error:', error);
    res.status(500).json({
      error: 'Failed to submit KYC verification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/kyc/status/{userId}:
 *   get:
 *     summary: Get KYC status
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
app.get('/api/kyc/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authenticatedUser = (req as AuthenticatedRequest).user;

    // Authorization: Users can only view their own KYC status unless they're admin
    if (authenticatedUser?.role !== 'admin' && authenticatedUser?.id !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own KYC status',
      });
      return;
    }

    const verification = await prisma.kycVerification.findFirst({
      where: { userId: String(userId) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!verification) {
      return res.status(404).json({
        error: 'KYC verification not found',
        message: 'No KYC verification found for this user',
      });
    }

    res.json({
      id: verification.id,
      userId: verification.userId,
      status: verification.status,
      documentType: verification.documentType,
      submittedAt: verification.submittedAt,
      reviewedAt: verification.reviewedAt,
      reviewedBy: verification.reviewedBy,
      rejectionReason: verification.rejectionReason,
      expiresAt: verification.expiresAt,
      user: verification.user,
    });
  } catch (error) {
    console.error('[KYCService] Status error:', error);
    res.status(500).json({
      error: 'Failed to get KYC status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/kyc/{id}:
 *   get:
 *     summary: Get KYC record by ID
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
app.get('/api/kyc/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authenticatedUser = (req as AuthenticatedRequest).user;

    const verification = await prisma.kycVerification.findUnique({
      where: { id: String(id) },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!verification) {
      return res.status(404).json({
        error: 'KYC verification not found',
      });
    }

    // Authorization: Users can only view their own verification unless admin
    if (authenticatedUser?.role !== 'admin' && authenticatedUser?.id !== verification.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own KYC verification',
      });
    }

    // Non-admins get limited data
    if (authenticatedUser?.role !== 'admin') {
      return res.json({
        id: verification.id,
        userId: verification.userId,
        status: verification.status,
        documentType: verification.documentType,
        submittedAt: verification.submittedAt,
        expiresAt: verification.expiresAt,
      });
    }

    res.json(verification);
  } catch (error) {
    console.error('[KYCService] Get error:', error);
    res.status(500).json({
      error: 'Failed to get KYC verification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/kyc/{id}/status:
 *   patch:
 *     summary: Update KYC verification status
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The KYC verification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, under_review, approved, rejected, expired]
 *               rejectionReason:
 *                 type: string
 *               reviewedBy:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
app.patch('/api/kyc/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validationResult = updateKycStatusSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.flatten().fieldErrors,
      });
    }

    const { status, rejectionReason, reviewedBy, notes } = validationResult.data;

    const verification = await prisma.kycVerification.update({
      where: { id: String(id) },
      data: {
        status,
        rejectionReason,
        reviewedBy,
        notes,
        reviewedAt: ['approved', 'rejected'].includes(status) ? new Date() : undefined,
      },
    });

    console.log(`[KYCService] KYC verification ${id} updated to ${status}`);

    res.json(verification);
  } catch (error) {
    console.error('[KYCService] Update status error:', error);
    res.status(500).json({
      error: 'Failed to update KYC status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/kyc/{id}/resubmit:
 *   post:
 *     summary: Resubmit KYC after rejection
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The KYC verification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, documentType, documentNumber, firstName, lastName, dateOfBirth, nationality]
 *             properties:
 *               userId:
 *                 type: string
 *               documentType:
 *                 type: string
 *                 enum: [passport, national_id, drivers_license, utility_bill, bank_statement]
 *               documentNumber:
 *                 type: string
 *               documentFront:
 *                 type: string
 *               documentBack:
 *                 type: string
 *               selfie:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: KYC verification resubmitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: KYC verification not found
 *       500:
 *         description: Server error
 */
app.post('/api/kyc/:id/resubmit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authenticatedUser = (req as AuthenticatedRequest).user;
    const validationResult = submitKycSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.flatten().fieldErrors,
      });
    }

    const data = validationResult.data;

    // Get existing verification
    const existingVerification = await prisma.kycVerification.findUnique({
      where: { id: String(id) },
    });

    if (!existingVerification) {
      return res.status(404).json({
        error: 'KYC verification not found',
      });
    }

    if (existingVerification.status !== 'rejected') {
      return res.status(400).json({
        error: 'Cannot resubmit',
        message: 'Only rejected verifications can be resubmitted',
      });
    }

    // Authorization: Users can only resubmit their own verification
    if (
      authenticatedUser?.role !== 'admin' &&
      authenticatedUser?.id !== existingVerification.userId
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only resubmit your own KYC verification',
      });
    }

    // Create new verification from resubmission
    const verification = await prisma.kycVerification.create({
      data: {
        userId: data.userId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentFront: data.documentFront,
        documentBack: data.documentBack,
        selfie: data.selfie,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        nationality: data.nationality,
        address: data.address as any,
        status: 'pending',
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        previousVerificationId: String(id),
      },
    });

    console.log(`[KYCService] KYC resubmitted for user ${data.userId}`);

    res.status(201).json({
      id: verification.id,
      userId: verification.userId,
      status: verification.status,
      submittedAt: verification.submittedAt,
      previousVerificationId: id,
    });
  } catch (error) {
    console.error('[KYCService] Resubmit error:', error);
    res.status(500).json({
      error: 'Failed to resubmit KYC verification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/kyc/{id}:
 *   delete:
 *     summary: Delete KYC verification
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The KYC verification ID
 *     responses:
 *       204:
 *         description: KYC verification deleted successfully
 *       404:
 *         description: KYC verification not found
 *       500:
 *         description: Server error
 */
app.delete('/api/kyc/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.kycVerification.update({
      where: { id: String(id) },
      data: {
        status: 'expired',
        expiresAt: new Date(),
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('[KYCService] Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete KYC verification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/kyc/stats/summary:
 *   get:
 *     summary: Get KYC statistics summary
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                         rejected:
 *                           type: integer
 *                         expired:
 *                           type: integer
 *       500:
 *         description: Server error
 */
app.get('/api/kyc/stats/summary', requireAdmin, async (req: Request, res: Response) => {
  try {
    const [total, pending, approved, rejected, expired] = await Promise.all([
      prisma.kycVerification.count(),
      prisma.kycVerification.count({ where: { status: 'pending' } }),
      prisma.kycVerification.count({ where: { status: 'approved' } }),
      prisma.kycVerification.count({ where: { status: 'rejected' } }),
      prisma.kycVerification.count({ where: { status: 'expired' } }),
    ]);

    res.json({
      total,
      byStatus: {
        pending,
        approved,
        rejected,
        expired,
      },
    });
  } catch (error) {
    console.error('[KYCService] Stats error:', error);
    res.status(500).json({
      error: 'Failed to get KYC statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[KYCService] Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Start server
setupKYCSwagger(app);
app.listen(PORT, () => {
  console.log(`KYC Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Security configuration check
  if (!JWT_SECRET) {
    console.error(
      '[KYCService] SECURITY WARNING: JWT_SECRET is not configured. ' +
        'All JWT authentication will fail. Only INTERNAL_API_KEY will work.'
    );
  }

  if (!process.env.INTERNAL_API_KEY) {
    console.warn(
      '[KYCService] WARNING: INTERNAL_API_KEY is not configured. ' +
        'Service-to-service authentication will not be available.'
    );
  }
});

export default app;
