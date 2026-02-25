/**
 * Message Queue Types
 * 
 * Common types for all message queue implementations
 */

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical'

export type MessageStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead-lettered'

export interface Message<T = any> {
  /** Unique message ID */
  id: string
  /** Message type/pattern name */
  type: string
  /** Message payload */
  data: T
  /** Message headers for routing/metadata */
  headers: Record<string, string | number | boolean>
  /** Message priority */
  priority: MessagePriority
  /** Timestamp when message was created */
  timestamp: number
  /** Timestamp when message should be processed (delayed messages) */
  scheduledFor?: number
  /** Expiration timestamp */
  expiresAt?: number
  /** Number of processing attempts */
  attempts: number
  /** Maximum retry attempts */
  maxRetries: number
  /** Correlation ID for request/reply patterns */
  correlationId?: string
  /** Reply-to queue name */
  replyTo?: string
  /** Source service */
  source: string
  /** Target service/queue */
  target: string
}

export interface QueueOptions {
  /** Queue name */
  name: string
  /** Enable dead letter queue for failed messages */
  deadLetterQueue?: boolean
  /** Dead letter queue name */
  deadLetterQueueName?: string
  /** Maximum message retention in ms */
  messageRetention?: number
  /** Maximum queue size */
  maxSize?: number
  /** Enable message deduplication */
  deduplication?: boolean
  /** Deduplication window in ms */
  deduplicationWindow?: number
  /** Enable priority queuing */
  priorityQueuing?: boolean
  /** Default message TTL in ms */
  defaultMessageTtl?: number
  /** Consumer prefetch count */
  prefetch?: number
}

export interface PublishOptions {
  /** Message priority */
  priority?: MessagePriority
  /** Delay before message is available (ms) */
  delay?: number
  /** Message expiration in ms from now */
  ttl?: number
  /** Correlation ID */
  correlationId?: string
  /** Reply-to queue */
  replyTo?: string
  /** Custom headers */
  headers?: Record<string, string | number | boolean>
  /** Message ID for deduplication */
  messageId?: string
}

export interface SubscribeOptions {
  /** Consumer tag for identification */
  consumerTag?: string
  /** Prefetch count for this consumer */
  prefetch?: number
  /** Auto-acknowledge messages */
  autoAck?: boolean
  /** Exclusive consumer (only one consumer) */
  exclusive?: boolean
}

export interface ConsumeResult {
  /** Acknowledge successful processing */
  ack: () => Promise<void>
  /** Negatively acknowledge (requeue) */
  nack: (requeue?: boolean) => Promise<void>
  /** Reject message (send to DLQ) */
  reject: () => Promise<void>
  /** Extend message lock/visibility timeout */
  extendLock: (durationMs: number) => Promise<void>
}

export interface MessageHandler<T = any> {
  (message: Message<T>, result: ConsumeResult): Promise<void> | void
}

export interface QueueStats {
  name: string
  messageCount: number
  consumerCount: number
  deadLetterCount?: number
  publishedCount: number
  consumedCount: number
  failedCount: number
  averageProcessingTimeMs: number
}

export interface QueueBackend {
  /** Backend name */
  readonly name: string
  
  /** Initialize the queue backend */
  connect(): Promise<void>
  
  /** Disconnect from the backend */
  disconnect(): Promise<void>
  
  /** Check if connected */
  isConnected(): boolean
  
  /** Create a queue */
  createQueue(options: QueueOptions): Promise<void>
  
  /** Delete a queue */
  deleteQueue(name: string): Promise<void>
  
  /** Check if queue exists */
  queueExists(name: string): Promise<boolean>
  
  /** Publish a message */
  publish<T = any>(
    queue: string,
    type: string,
    data: T,
    options?: PublishOptions
  ): Promise<string>
  
  /** Subscribe to a queue */
  subscribe<T = any>(
    queue: string,
    handler: MessageHandler<T>,
    options?: SubscribeOptions
  ): Promise<string>
  
  /** Unsubscribe from a queue */
  unsubscribe(consumerTag: string): Promise<void>
  
  /** Get queue statistics */
  getStats(queue: string): Promise<QueueStats>
  
  /** Purge all messages from a queue */
  purge(queue: string): Promise<void>
}

export interface BackendConfig {
  /** Backend type */
  type: 'rabbitmq' | 'redis' | 'memory'
  /** Enable logging */
  enableLogging?: boolean
  /** Connection retry options */
  retryOptions?: {
    maxRetries: number
    baseDelayMs: number
    maxDelayMs: number
  }
}

export interface RabbitMQConfig extends BackendConfig {
  type: 'rabbitmq'
  /** RabbitMQ connection URLs */
  urls: string[]
  /** Username */
  username?: string
  /** Password */
  password?: string
  /** Virtual host */
  vhost?: string
  /** Heartbeat interval in seconds */
  heartbeat?: number
}

export interface RedisConfig extends BackendConfig {
  type: 'redis'
  /** Redis connection URL */
  url: string
  /** Key prefix for queue names */
  keyPrefix?: string
  /** Consumer group name */
  consumerGroup?: string
  /** Consumer name */
  consumerName?: string
}

export interface MemoryConfig extends BackendConfig {
  type: 'memory'
  /** Maximum queue size */
  maxSize?: number
}

export type AnyBackendConfig = RabbitMQConfig | RedisConfig | MemoryConfig

// Standard event types used across the system
export const StandardEvents = {
  // Booking events
  BOOKING_CREATED: 'booking.created',
  BOOKING_UPDATED: 'booking.updated',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_COMPLETED: 'booking.completed',
  BOOKING_FAILED: 'booking.failed',
  
  // Payment events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  
  // Notification events
  NOTIFICATION_SEND: 'notification.send',
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_FAILED: 'notification.failed',
  
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  // Organization events
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_SUSPENDED: 'organization.suspended',
  
  // Wallet events
  WALLET_CREDITED: 'wallet.credited',
  WALLET_DEBITED: 'wallet.debited',
  WALLET_INSUFFICIENT_FUNDS: 'wallet.insufficient_funds',
  
  // Flight events
  FLIGHT_SEARCHED: 'flight.searched',
  FLIGHT_BOOKED: 'flight.booked',
  FLIGHT_CANCELLED: 'flight.cancelled',
  FLIGHT_AMENDMENT_REQUESTED: 'flight.amendment_requested',
  
  // Hotel events
  HOTEL_SEARCHED: 'hotel.searched',
  HOTEL_BOOKED: 'hotel.booked',
  HOTEL_CANCELLED: 'hotel.cancelled',
  
  // System events
  SERVICE_HEALTH_CHANGED: 'system.health_changed',
  CIRCUIT_BREAKER_STATE_CHANGED: 'system.circuit_breaker_state_changed',
} as const

export type StandardEventType = typeof StandardEvents[keyof typeof StandardEvents]