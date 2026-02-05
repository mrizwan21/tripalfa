import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Basic error formatting — extend as needed
   
  console.error('Error:', err && err.stack ? err.stack : err);
  const status = err && err.status && Number(err.status) ? Number(err.status) : 500;
  const message = err && err.message ? String(err.message) : 'Internal Server Error';
  res.status(status).json({ error: message });
}
