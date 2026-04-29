/**
 * Channel Context Middleware
 * Stamps every incoming request with the correct SalesChannel so that downstream
 * route handlers and repository calls don't need to derive it themselves.
 *
 * Detection priority:
 *  1. `X-Sales-Channel` HTTP header (set by API gateway or B2C front-end)
 *  2. `req.body.salesChannel`
 *  3. `req.query.salesChannel`
 *  4. Fallback: `SUBAGENT` (safe B2B default)
 *
 * Usage:
 *   import { channelContext } from '@tripalfa/shared-express';
 *   app.use(channelContext);
 *
 * Then in any route handler:
 *   const { salesChannel, isB2C } = req.channelContext;
 */

import { Request, Response, NextFunction } from 'express';

// ─── SalesChannel enum mirror ─────────────────────────────────────────────────
// Mirrored here so shared-express doesn't take a hard dep on shared-database.
// Keep in sync with the Prisma SalesChannel enum.

export enum SalesChannelValue {
  POS_DC  = 'POS_DC',
  POS_SA  = 'POS_SA',
  POS_CA  = 'POS_CA',
  SUBAGENT = 'SUBAGENT',
  WEBSITE  = 'WEBSITE',
  MOBILE   = 'MOBILE',
}

const VALID_CHANNELS = new Set<string>(Object.values(SalesChannelValue));

const B2C_CHANNELS = new Set<string>([
  SalesChannelValue.WEBSITE,
  SalesChannelValue.MOBILE,
]);

// ─── Context shape ────────────────────────────────────────────────────────────

export interface ChannelContext {
  /** Resolved SalesChannel value */
  salesChannel: SalesChannelValue;
  /** True when the request originates from a consumer-facing (B2C) channel */
  isB2C: boolean;
  /** True when the request originates from an agent/B2B channel */
  isB2B: boolean;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      channelContext: ChannelContext;
    }
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function resolveChannel(raw: unknown): SalesChannelValue {
  if (typeof raw === 'string' && VALID_CHANNELS.has(raw.toUpperCase())) {
    return raw.toUpperCase() as SalesChannelValue;
  }
  return SalesChannelValue.SUBAGENT; // safe default
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function channelContext(req: Request, _res: Response, next: NextFunction): void {
  const raw =
    req.headers['x-sales-channel'] ??
    req.body?.salesChannel ??
    req.query?.salesChannel;

  const salesChannel = resolveChannel(raw);

  req.channelContext = {
    salesChannel,
    isB2C: B2C_CHANNELS.has(salesChannel),
    isB2B: !B2C_CHANNELS.has(salesChannel),
  };

  next();
}

/**
 * Guard middleware — rejects requests that don't match the expected channel class.
 *
 * @example
 * // Only allow B2C requests on this router
 * router.use(requireChannel('B2C'));
 */
export function requireChannel(channelClass: 'B2B' | 'B2C') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.channelContext) {
      res.status(500).json({ error: 'channelContext middleware not mounted' });
      return;
    }
    const allowed =
      channelClass === 'B2C' ? req.channelContext.isB2C : req.channelContext.isB2B;

    if (!allowed) {
      res.status(403).json({
        error: `This endpoint is restricted to ${channelClass} channels.`,
        receivedChannel: req.channelContext.salesChannel,
      });
      return;
    }
    next();
  };
}
