import type { AuthPayload } from './index.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
    userId?: string;
  }
}
