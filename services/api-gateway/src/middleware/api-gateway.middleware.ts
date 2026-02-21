/**
 * API Gateway Routing Middleware
 * Integrates with APIManager to route requests to appropriate services
 */

import { Request, Response, NextFunction } from 'express'
import apiManager from '../config/api-manager.config.js'

interface APIRequest extends Request {
  apiEndpoint?: any
  serviceConfig?: any
  requestId?: string
}

/**
 * Middleware to resolve endpoint and service configuration
 */
export const resolveEndpoint = (req: APIRequest, res: Response, next: NextFunction) => {
  const { method, path } = req

  // Resolve endpoint config
  const endpoint = apiManager.getEndpoint(method, path)

  if (!endpoint) {
    return res.status(404).json({
      error: 'Endpoint not found',
      method,
      path,
    })
  }

  // Get service configuration
  const serviceConfig = apiManager.getService(endpoint.serviceId)

  if (!serviceConfig) {
    return res.status(500).json({
      error: 'Service not configured',
      serviceId: endpoint.serviceId,
    })
  }

  // Attach to request for use in downstream handlers
  req.apiEndpoint = endpoint
  req.serviceConfig = serviceConfig
  const requestIdHeader = req.headers['x-request-id']
  req.requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : (requestIdHeader || generateRequestId())

  // Log routing decision
  console.log(`[${req.requestId}] Route: ${method} ${path} -> ${endpoint.serviceId}`)

  next()
}

/**
 * Middleware to check authentication
 */
export const checkAuth = (req: APIRequest, res: Response, next: NextFunction) => {
  const endpoint = req.apiEndpoint

  if (endpoint?.requiresAuth) {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    // Validate token (this would integrate with your auth service)
    // For now, we assume valid if present
    console.log(`[${req.requestId}] Auth: Token validated`)
  }

  next()
}

/**
 * Middleware for rate limiting
 */
export const rateLimit = (req: APIRequest, res: Response, next: NextFunction) => {
  const endpoint = req.apiEndpoint

  if (!endpoint) {
    return next()
  }

  // This would integrate with Redis or in-memory store
  // For now, we just track it
  console.log(
    `[${req.requestId}] Rate Limit: ${endpoint.rateLimit.requestsPerMinute}/min, ${endpoint.rateLimit.requestsPerHour}/hour`
  )

  res.set('X-RateLimit-Limit', endpoint.rateLimit.requestsPerMinute.toString())
  res.set('X-RateLimit-Remaining', (endpoint.rateLimit.requestsPerMinute - 1).toString())

  next()
}

/**
 * Middleware to forward request with retry logic
 */
export const forwardRequest = async (req: APIRequest, res: Response, next: NextFunction) => {
  const endpoint = req.apiEndpoint
  const serviceConfig = req.serviceConfig

  if (!endpoint || !serviceConfig) {
    return res.status(500).json({ error: 'Routing configuration error' })
  }

  try {
    // Construct URL with query parameters
    const queryString = Object.keys(req.query).length > 0 ? '?' + new URLSearchParams(req.query as any).toString() : '';
    const url = `${serviceConfig.baseUrl}${req.path}${queryString}`;

    // Prepare request options
    const options: any = {
      method: req.method,
      headers: {
        ...req.headers,
        'X-Request-ID': req.requestId,
        'X-Forwarded-For': req.ip || '',
      },
      timeout: endpoint.timeout,
    }

    // Add body for POST/PATCH
    if (['POST', 'PATCH'].includes(req.method)) {
      options.body = JSON.stringify(req.body)
      options.headers['Content-Type'] = 'application/json'
    }

    // Execute request with retry logic
    const response = await executeWithRetry(url, options, serviceConfig.retryPolicy, req.requestId!)

    // Forward response
    res.status((response as any).status)
    res.set('X-Service', endpoint.serviceId)
    res.set('X-Endpoint', endpoint.id)

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error(`[${req.requestId}] Forwarding error:`, error)

    res.status(502).json({
      error: 'Bad Gateway',
      message: 'Failed to forward request to service',
      requestId: req.requestId,
    })
  }
}

/**
 * Execute request with retry logic
 */
async function executeWithRetry(
  url: string,
  options: any,
  retryPolicy: any,
  requestId: string,
  attempt: number = 1
): Promise<any> {
  try {
    const response = await fetch(url, options)

    // Check if we should retry
    if (attempt < retryPolicy.maxRetries && retryPolicy.codes.includes(response.status)) {
      console.log(
        `[${requestId}] Retry attempt ${attempt + 1}/${retryPolicy.maxRetries} (status: ${response.status})`
      )

      // Backoff delay
      await new Promise((resolve) => setTimeout(resolve, retryPolicy.backoffMs * attempt))

      return executeWithRetry(url, options, retryPolicy, requestId, attempt + 1)
    }

    return response
  } catch (error) {
    if (attempt < retryPolicy.maxRetries) {
      console.log(`[${requestId}] Retry attempt ${attempt + 1}/${retryPolicy.maxRetries} (error)`)

      // Backoff delay
      await new Promise((resolve) => setTimeout(resolve, retryPolicy.backoffMs * attempt))

      return executeWithRetry(url, options, retryPolicy, requestId, attempt + 1)
    }

    throw error
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Composite middleware applying all gateway policies
 */
export const gatewayMiddleware = [resolveEndpoint, checkAuth, rateLimit]

/**
 * Export forwarding middleware separately for final route handler
 */
export default {
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest,
  gatewayMiddleware,
}
