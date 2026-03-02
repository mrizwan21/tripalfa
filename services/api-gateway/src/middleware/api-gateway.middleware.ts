/**
 * API Gateway Routing Middleware
 * Integrates with APIManager to route requests to appropriate services
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import apiManager from "../config/api-manager.config.js";

interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

interface APIRequest extends Request {
  apiEndpoint?: any;
  serviceConfig?: any;
  requestId?: string;
  user?: AuthUser;
}

/**
 * Middleware to resolve endpoint and service configuration
 */
export const resolveEndpoint = (
  req: APIRequest,
  res: Response,
  next: NextFunction,
) => {
  const { method, path } = req;

  // Resolve endpoint config
  const endpoint = apiManager.getEndpoint(method, path);

  if (!endpoint) {
    return res.status(404).json({
      error: "Endpoint not found",
      method,
      path,
    });
  }

  // Get service configuration
  const serviceConfig = apiManager.getService(endpoint.serviceId);

  if (!serviceConfig) {
    return res.status(500).json({
      error: "Service not configured",
      serviceId: endpoint.serviceId,
    });
  }

  // Attach to request for use in downstream handlers
  req.apiEndpoint = endpoint;
  req.serviceConfig = serviceConfig;
  const requestIdHeader = req.headers["x-request-id"];
  req.requestId = Array.isArray(requestIdHeader)
    ? requestIdHeader[0]
    : requestIdHeader || generateRequestId();

  // Log routing decision
  console.log(
    `[${req.requestId}] Route: ${method} ${path} -> ${endpoint.serviceId}`,
  );

  next();
};

/**
 * Middleware to check authentication
 */
export const checkAuth = (
  req: APIRequest,
  res: Response,
  next: NextFunction,
) => {
  const endpoint = req.apiEndpoint;

  if (endpoint?.requiresAuth) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authorization header with Bearer token is required",
      });
    }

    const token = authHeader.substring(7);

    try {
      // Get JWT secret from environment
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        console.error("[checkAuth] JWT_SECRET not configured!");
        return res.status(500).json({
          error: "Internal Server Error",
          message: "Authentication service not properly configured",
        });
      }

      // Verify and decode the JWT token
      const decoded = jwt.verify(token, jwtSecret) as AuthUser;

      // Attach decoded user to request for downstream use
      req.user = decoded;

      console.log(
        `[${req.requestId}] Auth: Token validated for user ${decoded.id}`,
      );
    } catch (err: any) {
      console.error(
        `[${req.requestId}] Auth: Token validation failed:`,
        err.message,
      );

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Token has expired",
        });
      }

      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }
  }

  next();
};

/**
 * Middleware for rate limiting
 */
export const rateLimit = (
  req: APIRequest,
  res: Response,
  next: NextFunction,
) => {
  const endpoint = req.apiEndpoint;

  if (!endpoint) {
    return next();
  }

  // This would integrate with Redis or in-memory store
  // For now, we just track it
  console.log(
    `[${req.requestId}] Rate Limit: ${endpoint.rateLimit.requestsPerMinute}/min, ${endpoint.rateLimit.requestsPerHour}/hour`,
  );

  res.set("X-RateLimit-Limit", endpoint.rateLimit.requestsPerMinute.toString());
  res.set(
    "X-RateLimit-Remaining",
    (endpoint.rateLimit.requestsPerMinute - 1).toString(),
  );

  next();
};

/**
 * Middleware to forward request with retry logic
 */
export const forwardRequest = async (
  req: APIRequest,
  res: Response,
  next: NextFunction,
) => {
  const endpoint = req.apiEndpoint;
  const serviceConfig = req.serviceConfig;

  if (!endpoint || !serviceConfig) {
    return res.status(500).json({ error: "Routing configuration error" });
  }

  try {
    const rewrittenPath =
      endpoint.serviceId === "b2bAdminService" && req.path.startsWith("/api/b2b/")
        ? req.path.replace("/api/b2b/", "/api/")
        : req.path;

    // Construct URL with query parameters
    const queryString =
      Object.keys(req.query).length > 0
        ? "?" + new URLSearchParams(req.query as any).toString()
        : "";
    const url = `${serviceConfig.baseUrl}${rewrittenPath}${queryString}`;

    const forwardedHeaders: Record<string, string> = {
      Authorization: req.headers.authorization || "",
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Request-ID": req.requestId || "",
      "X-Forwarded-For": req.ip || "",
    };

    // Prepare request options
    const options: any = {
      method: req.method,
      headers: forwardedHeaders,
      timeout: endpoint.timeout,
    };

    // Add body for methods that support payloads
    if (["POST", "PATCH", "PUT"].includes(req.method)) {
      options.body = JSON.stringify(req.body);
    }

    // Execute request with retry logic
    const response = await executeWithRetry(
      url,
      options,
      serviceConfig.retryPolicy,
      req.requestId!,
    );

    // Forward response
    res.status((response as any).status);
    res.set("X-Service", endpoint.serviceId);
    res.set("X-Endpoint", endpoint.id);

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`[${req.requestId}] Forwarding error:`, error);

    res.status(502).json({
      error: "Bad Gateway",
      message: "Failed to forward request to service",
      requestId: req.requestId,
    });
  }
};

/**
 * Execute request with retry logic
 */
async function executeWithRetry(
  url: string,
  options: any,
  retryPolicy: any,
  requestId: string,
  attempt: number = 1,
): Promise<any> {
  try {
    const response = await fetch(url, options);

    // Check if we should retry
    if (
      attempt < retryPolicy.maxRetries &&
      retryPolicy.codes.includes(response.status)
    ) {
      console.log(
        `[${requestId}] Retry attempt ${attempt + 1}/${retryPolicy.maxRetries} (status: ${response.status})`,
      );

      // Backoff delay
      await new Promise((resolve) =>
        setTimeout(resolve, retryPolicy.backoffMs * attempt),
      );

      return executeWithRetry(
        url,
        options,
        retryPolicy,
        requestId,
        attempt + 1,
      );
    }

    return response;
  } catch (error) {
    if (attempt < retryPolicy.maxRetries) {
      console.log(
        `[${requestId}] Retry attempt ${attempt + 1}/${retryPolicy.maxRetries} (error)`,
      );

      // Backoff delay
      await new Promise((resolve) =>
        setTimeout(resolve, retryPolicy.backoffMs * attempt),
      );

      return executeWithRetry(
        url,
        options,
        retryPolicy,
        requestId,
        attempt + 1,
      );
    }

    throw error;
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Composite middleware applying all gateway policies
 */
export const gatewayMiddleware = [resolveEndpoint, checkAuth, rateLimit];

/**
 * Export forwarding middleware separately for final route handler
 */
export default {
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest,
  gatewayMiddleware,
};
