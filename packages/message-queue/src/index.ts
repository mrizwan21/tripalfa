/**
 * @tripalfa/message-queue
 * 
 * Message queue abstraction for microservices
 */

// Types
export {
  type Message,
  type MessagePriority,
  type MessageStatus,
  type QueueOptions,
  type PublishOptions,
  type SubscribeOptions,
  type ConsumeResult,
  type MessageHandler,
  type QueueStats,
  type QueueBackend,
  type BackendConfig,
  type RabbitMQConfig,
  type RedisConfig,
  type MemoryConfig,
  type AnyBackendConfig,
  StandardEvents,
  type StandardEventType,
} from './types'

// Backends
export { RabbitMQBackend } from './backends/rabbitmq'
export { MemoryBackend } from './backends/memory'

// Re-export EventEmitter for convenience
export { EventEmitter } from 'eventemitter3'

/**
 * Create a message queue backend
 */
import { RabbitMQBackend } from './backends/rabbitmq'
import { MemoryBackend } from './backends/memory'
import type { AnyBackendConfig, QueueBackend } from './types'

export function createQueueBackend(config: AnyBackendConfig): QueueBackend {
  switch (config.type) {
    case 'rabbitmq':
      return new RabbitMQBackend(config)
    case 'memory':
      return new MemoryBackend(config)
    default:
      throw new Error(`Unknown queue backend type: ${(config as any).type}`)
  }
}

/**
 * Message Queue Client
 * 
 * High-level API for message queue operations
 */
export class MessageQueueClient {
  private backend: QueueBackend

  constructor(config: AnyBackendConfig) {
    this.backend = createQueueBackend(config)
  }

  async connect(): Promise<void> {
    await this.backend.connect()
  }

  async disconnect(): Promise<void> {
    await this.backend.disconnect()
  }

  isConnected(): boolean {
    return this.backend.isConnected()
  }

  async createQueue(name: string, options?: Partial<import('./types').QueueOptions>): Promise<void> {
    await this.backend.createQueue({ name, ...options })
  }

  async deleteQueue(name: string): Promise<void> {
    await this.backend.deleteQueue(name)
  }

  async publish<T = any>(
    queue: string,
    type: string,
    data: T,
    options?: import('./types').PublishOptions
  ): Promise<string> {
    return this.backend.publish(queue, type, data, options)
  }

  async subscribe<T = any>(
    queue: string,
    handler: import('./types').MessageHandler<T>,
    options?: import('./types').SubscribeOptions
  ): Promise<string> {
    return this.backend.subscribe(queue, handler, options)
  }

  async unsubscribe(consumerTag: string): Promise<void> {
    await this.backend.unsubscribe(consumerTag)
  }

  async getStats(queue: string): Promise<import('./types').QueueStats> {
    return this.backend.getStats(queue)
  }

  async purge(queue: string): Promise<void> {
    await this.backend.purge(queue)
  }
}

export function createMessageQueue(config: AnyBackendConfig): MessageQueueClient {
  return new MessageQueueClient(config)
}