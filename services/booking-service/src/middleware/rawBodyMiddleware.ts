/**
 * Raw Body Middleware
 * Captures raw request body before JSON parsing
 * Essential for webhook signature validation
 * 
 * IMPORTANT: In app.ts, express.raw() middleware must be mounted
 * BEFORE express.json() for /api/webhooks paths to ensure raw bytes
 * are available before any parsing occurs.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to capture and parse raw request body
 * - If raw body already captured by express.raw(), extracts it from request
 * - Otherwise, captures from request stream for signature validation
 * - Stores raw data in request for signature validation
 * - Parses as JSON for regular processing
 */
export function rawBodyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // If express.raw() middleware already captured the raw body, use it
  if (Buffer.isBuffer((req as any).body)) {
    const rawBuffer = (req as any).body as Buffer;

    // Don't process empty buffers
    if (rawBuffer.length === 0) {
      res.status(400).json({ error: 'Empty request body' });
      return;
    }

    try {
      // Store raw buffer for signature validation
      (req as any).rawBody = rawBuffer;
      (req as any).get_rawbody = () => rawBuffer;

      // Parse buffer as JSON
      req.body = JSON.parse(rawBuffer.toString('utf8'));
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid JSON payload' });
    }
    return;
  }

  // Fallback: if raw body not already captured, read from stream
  let rawBody = '';

  req.on('data', (chunk) => {
    rawBody += chunk.toString('utf8');
  });

  req.on('end', () => {
    try {
      // Don't process empty payloads
      if (rawBody.length === 0) {
        return res.status(400).json({ error: 'Empty request body' });
      }

      const rawBuffer = Buffer.from(rawBody);

      // Store the raw body for signature validation
      (req as any).rawBody = rawBuffer;
      (req as any).get_rawbody = () => rawBuffer;

      // Parse as JSON
      req.body = JSON.parse(rawBody);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid JSON payload' });
    }
  });

  req.on('error', (error) => {
    res.status(400).json({ error: 'Error reading request body' });
  });
}

