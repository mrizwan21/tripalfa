/**
 * Retry Pattern Implementation
 * 
 * Provides configurable retry strategies for transient failures
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number
  /** Base delay in ms between retries */
  baseDelayMs: number
  /** Maximum delay in ms between retries */
  maxDelayMs: number
  /** Multiplier for exponential backoff */
  backoffMultiplier: number
  /** Jitter factor (0-1) to add randomness to delays */
  jitterFactor: number
  /** HTTP status codes that should trigger retry */
  retryableStatusCodes: number[]
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: Error, attempt: number) => boolean
  /** Enable logging */
  enableLogging?: boolean
  /** Callback before each retry */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void
}

export interface RetryResult<T> {
  result: T
  attempts: number
  totalDelayMs: number
}

export interface RetryError extends Error {
  attempts: number
  lastError: Error
  allErrors: Error[]
}

const DEFAULT_RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  599, // Network Connect Timeout Error
]

const DEFAULT_OPTIONS: Omit<Required<RetryOptions>, 'isRetryable' | 'onRetry'> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  retryableStatusCodes: DEFAULT_RETRYABLE_STATUS_CODES,
  enableLogging: false,
}

/**
 * Execute a function with retry logic
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const errors: Error[] = []
  let totalDelayMs = 0

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const result = await fn()
      
      if (attempt > 1 && opts.enableLogging) {
        console.log(`[Retry] Success on attempt ${attempt}`)
      }
      
      return result
    } catch (error) {
      const err = error as Error
      errors.push(err)

      // Check if we should retry
      if (attempt <= opts.maxRetries && isRetryableError(err, attempt, opts)) {
        const delayMs = calculateDelay(attempt, opts)
        totalDelayMs += delayMs

        if (opts.enableLogging) {
          console.log(`[Retry] Attempt ${attempt} failed, retrying in ${delayMs}ms...`)
        }

        if (opts.onRetry) {
          opts.onRetry(err, attempt, delayMs)
        }

        await sleep(delayMs)
      } else {
        // No more retries, throw error
        const retryError = new Error(
          `Retry failed after ${attempt} attempts: ${err.message}`
        ) as RetryError
        
        ;(retryError as any).attempts = attempt
        ;(retryError as any).lastError = err
        ;(retryError as any).allErrors = errors
        
        throw retryError
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Retry logic error')
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error, attempt: number, options: RetryOptions): boolean {
  // Use custom function if provided
  if (options.isRetryable) {
    return options.isRetryable(error, attempt)
  }

  // Check for HTTP status code
  const httpError = error as any
  if (httpError.response?.status) {
    return options.retryableStatusCodes.includes(httpError.response.status)
  }

  // Check for network errors
  if (isNetworkError(error)) {
    return true
  }

  // Check for timeout errors
  if (isTimeoutError(error)) {
    return true
  }

  return false
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: Error): boolean {
  const networkErrorCodes = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ENETUNREACH',
    'EHOSTUNREACH',
    'EPIPE',
    'ETIMEDOUT',
  ]

  const netError = error as any
  return (
    networkErrorCodes.includes(netError.code) ||
    networkErrorCodes.includes(netError.errno) ||
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED')
  )
}

/**
 * Check if error is a timeout error
 */
function isTimeoutError(error: Error): boolean {
  const timeoutErrorCodes = ['ETIMEDOUT', 'ESOCKETTIMEDOUT']
  
  const netError = error as any
  return (
    timeoutErrorCodes.includes(netError.code) ||
    error.message.toLowerCase().includes('timeout')
  )
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  // Exponential backoff
  let delay = options.baseDelayMs * Math.pow(options.backoffMultiplier, attempt - 1)
  
  // Cap at max delay
  delay = Math.min(delay, options.maxDelayMs)
  
  // Add jitter
  if (options.jitterFactor > 0) {
    const jitter = delay * options.jitterFactor * Math.random()
    delay = delay + jitter
  }
  
  return Math.floor(delay)
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a retry wrapper for a function
 */
export function retryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: Partial<RetryOptions>
): T {
  return (async (...args: Parameters<T>) => {
    return retry(() => fn(...args), options)
  }) as T
}

/**
 * Retry decorator for class methods
 */
export function Retry(options?: Partial<RetryOptions>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  ) {
    const originalMethod = descriptor.value!

    descriptor.value = async function (...args: any[]) {
      return retry(() => originalMethod.apply(this, args), options)
    }

    return descriptor
  }
}

/**
 * Retry with result wrapper
 */
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const errors: Error[] = []
  let totalDelayMs = 0
  const startTime = Date.now()

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const result = await fn()
      
      return {
        result,
        attempts: attempt,
        totalDelayMs,
      }
    } catch (error) {
      const err = error as Error
      errors.push(err)

      if (attempt <= opts.maxRetries && isRetryableError(err, attempt, opts)) {
        const delayMs = calculateDelay(attempt, opts)
        totalDelayMs += delayMs

        if (opts.onRetry) {
          opts.onRetry(err, attempt, delayMs)
        }

        await sleep(delayMs)
      } else {
        const retryError = new Error(
          `Retry failed after ${attempt} attempts: ${err.message}`
        ) as RetryError
        
        ;(retryError as any).attempts = attempt
        ;(retryError as any).lastError = err
        ;(retryError as any).allErrors = errors
        
        throw retryError
      }
    }
  }

  throw new Error('Retry logic error')
}

export default retry