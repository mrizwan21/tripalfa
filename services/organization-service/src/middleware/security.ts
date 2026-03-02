import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set it before starting the server.",
  );
}

export class SecurityMiddleware {
  static async authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Missing or invalid token",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      (req as any).user = {
        id: decoded.userId || decoded.id,
        role: (decoded.role || "USER").toUpperCase(),
        companyId: decoded.companyId,
      };
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  }

  static authorize(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Authentication required",
        });
        return;
      }

      const userRole = user.role;
      const authorizedRoles = roles.map((r) => r.toUpperCase());

      if (!authorizedRoles.includes(userRole) && userRole !== "SUPER_ADMIN") {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Insufficient permissions",
        });
        return;
      }

      next();
    };
  }
}
