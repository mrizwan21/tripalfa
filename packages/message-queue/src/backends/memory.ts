/**
 * In-Memory Queue Backend Implementation
 * 
 * Simple in-memory queue for testing and development
 */

import EventEmitter from 'eventemitter3'
import { v4 as uuidv4 } from 'uuid'
import {
  QueueBackend,
  Message,
  MessageHandler,
  QueueOptions,
  PublishOptions,
  SubscribeOptions,
  ConsumeResult,
  QueueStats,
  MemoryConfig,
} from '../types'

interface InternalMessage extends Message {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  visibleAt: number
}

export class MemoryBackend extends EventEmitter implements QueueBackend {
  readonly name = 'memory'
  
  private queues: Map<string, InternalMessage[]> = new Map()
  private deadLetterQueues: Map<string, InternalMessage[]> = new Map()
  private queueOptions: Map<string, QueueOptions> = new Map()
  private consumers: Map<string, { queue: string; handler: MessageHandler }> = new Map()
  private stats: Map<string, Partial<QueueStats>> = new Map()
  private processingTimers: Map<string, NodeJS.Timeout> = new Map()
  
  private readonly config: MemoryConfig
  private connected = false

  constructor(config?: MemoryConfig) {
    super()
    this.config = {
      type: 'memory',
      maxSize: config?.maxSize || 10000,
      enableLogging: config?.enableLogging || false,
    }
  }

  async connect(): Promise<void> {
    this.connected = true
    this.log('Connected to in-memory queue')
    this.emit('connected')
  }

  async disconnect(): Promise<void> {
    this.connected = false
    
    // Clear all processing timers
    for (const timer of this.processingTimers.values()) {
      clearTimeout(timer)
    }
    this.processingTimers.clear()
    
    this.log('Disconnected from in-memory queue')
    this.emit('disconnected')
  }

  isConnected(): boolean {
    return this.connected
  }

  async createQueue(options: QueueOptions): Promise<void> {
    this.queues.set(options.name, [])
    this.queueOptions.set(options.name, options)
    
    if (options.deadLetterQueue) {
      const dlqName = options.deadLetterQueueName || `${options.name}.dlq`
      this.deadLetterQueues.set(dlqName, [])
    }
    
    this.log(`Created queue: ${options.name}`)
  }

  async deleteQueue(name: string): Promise<void> {
    this.queues.delete(name)
    this.queueOptions.delete(name)
    this.stats.delete(name)
    this.log(`Deleted queue: ${name}`)
  }

  async queueExists(name: string): Promise<boolean> {
    return this.queues.has(name)
  }

  async publish<T = any>(
    queue: string,
    type: string,
    data: T,
    options?: PublishOptions
  ): Promise<string> {
    const messages = this.queues.get(queue)
    if (!messages) {
      throw new Error(`Queue ${queue} does not exist`)
    }

    const messageId = options?.messageId || uuidv4()
    const now = Date.now()
    
    const message: InternalMessage = {
      id: messageId,
      type,
      data,
      headers: options?.headers || {},
      priority: options?.priority || 'normal',
      timestamp: now,
      scheduledFor: options?.delay ? now + options.delay : undefined,
      expiresAt: options?.ttl ? now + options.ttl : undefined,
      attempts: 0,
      maxRetries: 3,
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
      source: options?.headers?.source as string || 'unknown',
      target: queue,
      status: 'pending',
      visibleAt: options?.delay ? now + options.delay : now,
    }

    // Check max size
    const opts = this.queueOptions.get(queue)
    if (opts?.maxSize && messages.length >= opts.maxSize) {
      // Remove oldest message
      messages.shift()
    }

    // Insert with priority
    if (opts?.priorityQueuing) {
      this.insertByPriority(messages, message)
    } else {
      messages.push(message)
    }

    // Update stats
    const stats = this.stats.get(queue) || {}
    stats.publishedCount = (stats.publishedCount || 0) + 1
    this.stats.set(queue, stats)

    this.log(`Published message ${messageId} to queue ${queue}`)
    
    // Trigger consumer if there's one waiting
    this.processQueue(queue)
    
    return messageId
  }

  async subscribe<T = any>(
    queue: string,
    handler: MessageHandler<T>,
    options?: SubscribeOptions
  ): Promise<string> {
    if (!this.queues.has(queue)) {
      throw new Error(`Queue ${queue} does not exist`)
    }

    const consumerTag = options?.consumerTag || uuidv4()
    this.consumers.set(consumerTag, { queue, handler })
    
    this.log(`Subscribed to queue ${queue} with consumer tag ${consumerTag}`)
    
    // Start processing the queue
    this.processQueue(queue)
    
    return consumerTag
  }

  async unsubscribe(consumerTag: string): Promise<void> {
    this.consumers.delete(consumerTag)
    this.log(`Unsubscribed consumer ${consumerTag}`)
  }

  async getStats(queue: string): Promise<QueueStats> {
    const messages = this.queues.get(queue) || []
    const stats = this.stats.get(queue) || {}
    
    // Count active consumers
    let consumerCount = 0
    for (const consumer of this.consumers.values()) {
      if (consumer.queue === queue) consumerCount++
    }
    
    return {
      name: queue,
      messageCount: messages.filter(m => m.status === 'pending').length,
      consumerCount,
      deadLetterCount: this.deadLetterQueues.get(`${queue}.dlq`)?.length || 0,
      publishedCount: stats.publishedCount || 0,
      consumedCount: stats.consumedCount || 0,
      failedCount: stats.failedCount || 0,
      averageProcessingTimeMs: stats.averageProcessingTimeMs || 0,
    }
  }

  async purge(queue: string): Promise<void> {
    const messages = this.queues.get(queue)
    if (messages) {
      messages.length = 0
    }
    this.log(`Purged queue ${queue}`)
  }

  private processQueue(queue: string): void {
    // Don't start multiple processing cycles
    if (this.processingTimers.has(queue)) return
    
    const process = () => {
      const messages = this.queues.get(queue)
      if (!messages) return
      
      // Find consumers for this queue
      const queueConsumers: { tag: string; handler: MessageHandler }[] = []
      for (const [tag, consumer] of this.consumers) {
        if (consumer.queue === queue) {
          queueConsumers.push({ tag, handler: consumer.handler })
        }
      }
      
      if (queueConsumers.length === 0) {
        this.processingTimers.delete(queue)
        return
      }
      
      // Find next message to process
      const now = Date.now()
      const messageIndex = messages.findIndex(
        m => m.status === 'pending' && m.visibleAt <= now && (!m.expiresAt || m.expiresAt > now)
      )
      
      if (messageIndex === -1) {
        // Schedule next check
        this.processingTimers.set(queue, setTimeout(process, 100))
        return
      }
      
      const message = messages[messageIndex]
      message.status = 'processing'
      message.attempts++
      
      const startTime = Date.now()
      
      // Pick a consumer (round-robin style)
      const consumer = queueConsumers[Math.floor(Math.random() * queueConsumers.length)]
      
      const result: ConsumeResult = {
        ack: async () => {
          const idx = messages.indexOf(message)
          if (idx !== -1) messages.splice(idx, 1)
          
          const stats = this.stats.get(queue) || {}
          stats.consumedCount = (stats.consumedCount || 0) + 1
          const processingTime = Date.now() - startTime
          stats.averageProcessingTimeMs = 
            ((stats.averageProcessingTimeMs || 0) * (stats.consumedCount - 1) + processingTime) / stats.consumedCount
          this.stats.set(queue, stats)
          
          this.log(`Message ${message.id} acknowledged`)
          process()
        },
        nack: async (requeue = true) => {
          if (requeue) {
            message.status = 'pending'
            message.visibleAt = Date.now() + 1000 // 1 second delay
          } else {
            const idx = messages.indexOf(message)
            if (idx !== -1) messages.splice(idx, 1)
            
            const stats = this.stats.get(queue) || {}
            stats.failedCount = (stats.failedCount || 0) + 1
            this.stats.set(queue, stats)
          }
          
          this.log(`Message ${message.id} nacked (requeue: ${requeue})`)
          process()
        },
        reject: async () => {
          const idx = messages.indexOf(message)
          if (idx !== -1) messages.splice(idx, 1)
          
          // Add to DLQ
          const opts = this.queueOptions.get(queue)
          if (opts?.deadLetterQueue) {
            const dlqName = opts.deadLetterQueueName || `${queue}.dlq`
            const dlq = this.deadLetterQueues.get(dlqName) || []
            dlq.push({ ...message, status: 'failed' })
            this.deadLetterQueues.set(dlqName, dlq)
          }
          
          const stats = this.stats.get(queue) || {}
          stats.failedCount = (stats.failedCount || 0) + 1
          this.stats.set(queue, stats)
          
          this.log(`Message ${message.id} rejected`)
          process()
        },
        extendLock: async (durationMs: number) => {
          message.visibleAt = Date.now() + durationMs
          this.log(`Lock extended for message ${message.id} by ${durationMs}ms`)
        },
      }
      
      // Execute handler
      Promise.resolve(consumer.handler(message, result)).catch(error => {
        this.log(`Handler error: ${error.message}`)
        if (message.attempts < message.maxRetries) {
          message.status = 'pending'
          message.visibleAt = Date.now() + 1000
        } else {
          result.reject()
        }
        process()
      })
      
      // Schedule next check
      this.processingTimers.set(queue, setTimeout(process, 100))
    }
    
    process()
  }

  private insertByPriority(messages: InternalMessage[], message: InternalMessage): void {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }
    const messagePriority = priorityOrder[message.priority]
    
    let insertIndex = messages.length
    for (let i = 0; i < messages.length; i++) {
      if (priorityOrder[messages[i].priority] > messagePriority) {
        insertIndex = i
        break
      }
    }
    
    messages.splice(insertIndex, 0, message)
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[MemoryQueue] ${message}`)
    }
  }
}

export default MemoryBackend