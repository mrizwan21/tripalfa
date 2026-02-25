/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascade failures by stopping requests to failing services.
 * States: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 */

import EventEmitter from 'eventemitter3'

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerOptions {
  /** Name of the circuit breaker for logging */
  name: string
  /** Number of failures before opening circuit */
  failureThreshold: number
  /** Number of successes in half-open state to close circuit */
  successThreshold: number
  /** Time in ms before attempting to close circuit (half-open state) */
  timeout: number
  /** Time window in ms for counting failures */
  resetTimeout: number
  /** Enable logging */
  enableLogging?: boolean
  /** Custom fallback function */
  fallback?: <T>(error: Error) => Promise<T> | T
}

export interface CircuitStats {
  name: string
  state: CircuitState
  failures: number
  successes: number
  lastFailureTime: number | null
  lastSuccessTime: number | null
  totalRequests: number
  totalFailures: number
  totalSuccesses: number
}

interface FailureRecord {
  timestamp: number
  error: Error
}

/**
 * Circuit Breaker
 * 
 * Implements the circuit breaker pattern to prevent cascade failures.
 * When a service is failing, the circuit opens and subsequent requests
 * fail fast without attempting to call the service.
 */
export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = 'CLOSED'
  private failures: FailureRecord[] = []
  private successes: number = 0
  private lastFailureTime: number | null = null
  private lastSuccessTime: number | null = null
  private totalRequests: number = 0
  private totalFailures: number = 0
  private totalSuccesses: number = 0
  private halfOpenStartTime: number | null = null
  
  private readonly options: Required<Omit<CircuitBreakerOptions, 'fallback'>> & { fallback?: CircuitBreakerOptions['fallback'] }

  constructor(options: CircuitBreakerOptions) {
    super()
    this.options = {
      ...options,
      resetTimeout: options.resetTimeout || 60000,
      enableLogging: options.enableLogging ?? false,
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('HALF_OPEN')
      } else {
        return this.handleOpenCircuit<T>()
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error as Error)
      
      // If circuit is now open, use fallback or throw
      if (this.state === 'OPEN') {
        return this.handleOpenCircuit<T>()
      }
      
      throw error
    }
  }

  /**
   * Handle request when circuit is OPEN
   */
  private async handleOpenCircuit<T>(): Promise<T> {
    this.emit('reject', { name: this.options.name, state: this.state })
    
    if (this.options.fallback) {
      this.log('Using fallback function')
      return this.options.fallback(new Error('Circuit breaker is OPEN'))
    }
    
    throw new CircuitBreakerError(
      `Circuit breaker '${this.options.name}' is OPEN`,
      this.getStats()
    )
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false
    return Date.now() - this.lastFailureTime >= this.options.timeout
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now()
    this.totalSuccesses++

    if (this.state === 'HALF_OPEN') {
      this.successes++
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo('CLOSED')
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success
      this.failures = this.failures.filter(
        f => Date.now() - f.timestamp < this.options.resetTimeout
      )
    }
    
    this.emit('success', { name: this.options.name, state: this.state })
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.lastFailureTime = Date.now()
    this.totalFailures++
    
    // Add to failure record
    this.failures.push({ timestamp: Date.now(), error })
    
    // Clean old failures outside window
    this.failures = this.failures.filter(
      f => Date.now() - f.timestamp < this.options.resetTimeout
    )

    if (this.state === 'HALF_OPEN') {
      // Any failure in half-open state opens the circuit
      this.transitionTo('OPEN')
    } else if (this.state === 'CLOSED') {
      if (this.failures.length >= this.options.failureThreshold) {
        this.transitionTo('OPEN')
      }
    }
    
    this.emit('failure', { 
      name: this.options.name, 
      state: this.state, 
      error,
      failureCount: this.failures.length 
    })
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state
    this.state = newState
    
    this.log(`State transition: ${oldState} -> ${newState}`)
    this.emit('stateChange', { 
      name: this.options.name, 
      oldState, 
      newState,
      stats: this.getStats()
    })

    if (newState === 'CLOSED') {
      this.failures = []
      this.successes = 0
      this.halfOpenStartTime = null
    } else if (newState === 'HALF_OPEN') {
      this.successes = 0
      this.halfOpenStartTime = Date.now()
    } else if (newState === 'OPEN') {
      this.halfOpenStartTime = null
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitStats {
    return {
      name: this.options.name,
      state: this.state,
      failures: this.failures.length,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    }
  }

  /**
   * Force open the circuit
   */
  trip(): void {
    if (this.state !== 'OPEN') {
      this.transitionTo('OPEN')
    }
  }

  /**
   * Force close the circuit (reset)
   */
  reset(): void {
    if (this.state !== 'CLOSED') {
      this.transitionTo('CLOSED')
    }
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === 'OPEN'
  }

  /**
   * Check if circuit is closed
   */
  isClosed(): boolean {
    return this.state === 'CLOSED'
  }

  /**
   * Check if circuit is half-open
   */
  isHalfOpen(): boolean {
    return this.state === 'HALF_OPEN'
  }

  private log(message: string): void {
    if (this.options.enableLogging) {
      console.log(`[CircuitBreaker:${this.options.name}] ${message}`)
    }
  }
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
  public readonly stats: CircuitStats

  constructor(message: string, stats: CircuitStats) {
    super(message)
    this.name = 'CircuitBreakerError'
    this.stats = stats
  }
}

/**
 * Create a circuit breaker with default options
 */
export function createCircuitBreaker(
  name: string,
  options?: Partial<CircuitBreakerOptions>
): CircuitBreaker {
  return new CircuitBreaker({
    name,
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
    resetTimeout: 60000,
    ...options,
  })
}

export default CircuitBreaker