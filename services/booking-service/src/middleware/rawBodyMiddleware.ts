/**
 * Raw Body Middleware
 * Captures raw request body before JSON parsing
 * Essential for webhook signature validation
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to capture raw request body
 * Stores raw data in request object for signature validation
 * Also parses as JSON for regular processing
 */
export function rawBodyMiddleware(req: Request, res: Response, next: NextFunction): void {
  let rawBody = '';

  req.on('data', (chunk) => {
    rawBody += chunk.toString('utf8');
  });

  req.on('end', () => {
    try {
      // Store the raw body for signature validation
      (req as any).rawBody = Buffer.from(rawBody);
      (req as any).get_rawbody = () => (req as any).rawBody;

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
