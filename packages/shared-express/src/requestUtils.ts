import { Request } from 'express';

// Type helper to fix Express body/query types
export const getStr = (v: any): string => (typeof v === 'string' ? v : '');
export const getOptStr = (v: any): string | undefined => (typeof v === 'string' ? v : undefined);

// Helper to get string header
export const getHeader = (req: Request, header: string): string => {
  const val = req.headers[header];
  return Array.isArray(val) ? val[0] : val || '';
};

// Helper to get body property as string
export const getBody = (req: Request, key: string): string | undefined => {
  const val = (req.body as any)?.[key];
  return typeof val === 'string' ? val : undefined;
};

// Helper to get query param as string
export const getQuery = (req: Request, key: string): string | undefined => {
  const val = (req.query as any)?.[key];
  return typeof val === 'string' ? val : undefined;
};
