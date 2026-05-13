import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        status: string;
        roles: any[];
        permissions: string[];
      };
      apiKey?: {
        id: string;
        name: string;
        permissions: any;
        rateLimit: any;
      };
    }
  }
}

export {};
