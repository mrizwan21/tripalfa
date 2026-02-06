import { User } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
