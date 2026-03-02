/**
 * RabbitMQ Backend Implementation
 *
 * Production-ready RabbitMQ message queue backend
 */

import * as amqp from "amqplib";
import EventEmitter from "eventemitter3";
import { randomUUID } from "node:crypto";
import {
  QueueBackend,
  Message,
  MessageHandler,
  QueueOptions,
  PublishOptions,
  SubscribeOptions,
  ConsumeResult,
  QueueStats,
  RabbitMQConfig,
  MessagePriority,
} from "../types";

export class RabbitMQBackend extends EventEmitter implements QueueBackend {
  readonly name = "rabbitmq";

  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private consumers: Map<string, string> = new Map();
  private queues: Map<string, QueueOptions> = new Map();
  private stats: Map<string, Partial<QueueStats>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;

  private readonly config: RabbitMQConfig;
  private readonly defaultExchange = "tripalfa.events";

  constructor(config: RabbitMQConfig) {
    super();
    this.config = {
      heartbeat: 30,
      ...config,
    };
  }

  async connect(): Promise<void> {
    try {
      const url = this.buildConnectionUrl();

      this.connection = await amqp.connect(url, {
        heartbeat: this.config.heartbeat,
      });

      this.connection.on("error", (err) => {
        this.log(`Connection error: ${err.message}`);
        this.emit("error", err);
      });

      this.connection.on("close", () => {
        this.log("Connection closed");
        this.emit("disconnected");
        this.scheduleReconnect();
      });

      if (!this.connection) {
        throw new Error("Failed to establish connection");
      }

      this.channel = await this.connection.createChannel();

      // Set prefetch
      await this.channel.prefetch(10);

      // Assert default exchange
      await this.channel.assertExchange(this.defaultExchange, "topic", {
        durable: true,
      });

      this.log("Connected to RabbitMQ");
      this.emit("connected");
    } catch (error) {
      this.log(`Connection failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    this.log("Disconnected from RabbitMQ");
    this.emit("disconnected");
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  async createQueue(options: QueueOptions): Promise<void> {
    if (!this.channel) throw new Error("Not connected");

    const queueOptions: amqp.Options.AssertQueue = {
      durable: true,
      arguments: {},
    };

    if (options.maxSize) {
      queueOptions.arguments!["x-max-length"] = options.maxSize;
    }

    if (options.defaultMessageTtl) {
      queueOptions.arguments!["x-message-ttl"] = options.defaultMessageTtl;
    }

    if (options.deadLetterQueue) {
      const dlqName = options.deadLetterQueueName || `${options.name}.dlq`;
      queueOptions.arguments!["x-dead-letter-exchange"] = this.defaultExchange;
      queueOptions.arguments!["x-dead-letter-routing-key"] = `dlq.${dlqName}`;

      // Create DLQ
      await this.channel.assertQueue(dlqName, {
        durable: true,
      });
    }

    if (options.priorityQueuing) {
      queueOptions.arguments!["x-max-priority"] = 10;
    }

    await this.channel.assertQueue(options.name, queueOptions);
    this.queues.set(options.name, options);

    // Bind to default exchange with routing key
    await this.channel.bindQueue(
      options.name,
      this.defaultExchange,
      `queue.${options.name}`,
    );

    this.log(`Created queue: ${options.name}`);
  }

  async deleteQueue(name: string): Promise<void> {
    if (!this.channel) throw new Error("Not connected");
    await this.channel.deleteQueue(name);
    this.queues.delete(name);
    this.stats.delete(name);
    this.log(`Deleted queue: ${name}`);
  }

  async queueExists(name: string): Promise<boolean> {
    if (!this.channel) throw new Error("Not connected");
    try {
      await this.channel.checkQueue(name);
      return true;
    } catch {
      return false;
    }
  }

  async publish<T = any>(
    queue: string,
    type: string,
    data: T,
    options?: PublishOptions,
  ): Promise<string> {
    if (!this.channel) throw new Error("Not connected");

    const messageId = options?.messageId || randomUUID();
    const message: Message<T> = {
      id: messageId,
      type,
      data,
      headers: options?.headers || {},
      priority: options?.priority || "normal",
      timestamp: Date.now(),
      attempts: 0,
      maxRetries: 3,
      source: (options?.headers?.source as string) || "unknown",
      target: queue,
    };

    if (options?.delay) {
      message.scheduledFor = Date.now() + options.delay;
    }

    if (options?.ttl) {
      message.expiresAt = Date.now() + options.ttl;
    }

    const content = Buffer.from(JSON.stringify(message));

    const publishOptions: amqp.Options.Publish = {
      messageId,
      contentType: "application/json",
      priority: this.mapPriority(options?.priority),
      persistent: true,
      headers: {
        "x-message-type": type,
        ...options?.headers,
      },
    };

    if (options?.correlationId) {
      publishOptions.correlationId = options.correlationId;
    }

    if (options?.replyTo) {
      publishOptions.replyTo = options.replyTo;
    }

    if (options?.ttl) {
      publishOptions.expiration = options.ttl;
    }

    // Use delayed message plugin if available
    if (options?.delay) {
      const delayExchange = "tripalfa.delayed";
      try {
        await this.channel.assertExchange(delayExchange, "x-delayed-message", {
          durable: true,
          arguments: { "x-delayed-type": "direct" },
        });
      } catch {
        // Exchange might already exist, that's fine
      }

      publishOptions.headers!["x-delay"] = options.delay;
      this.channel.publish(delayExchange, queue, content, publishOptions);
    } else {
      this.channel.publish(
        this.defaultExchange,
        `queue.${queue}`,
        content,
        publishOptions,
      );
    }

    // Update stats
    const stats = this.stats.get(queue) || {};
    stats.publishedCount = (stats.publishedCount || 0) + 1;
    this.stats.set(queue, stats);

    this.log(`Published message ${messageId} to queue ${queue}`);
    return messageId;
  }

  async subscribe<T = any>(
    queue: string,
    handler: MessageHandler<T>,
    options?: SubscribeOptions,
  ): Promise<string> {
    if (!this.channel) throw new Error("Not connected");

    const consumerTag = options?.consumerTag || randomUUID();

    const consumeOptions: amqp.Options.Consume = {
      consumerTag,
      noAck: options?.autoAck || false,
      exclusive: options?.exclusive || false,
    };

    await this.channel.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        const startTime = Date.now();

        try {
          const message = JSON.parse(msg.content.toString()) as Message<T>;
          message.attempts =
            ((msg.properties.headers?.["x-attempts"] as number) || 0) + 1;

          const result: ConsumeResult = {
            ack: async () => {
              this.channel?.ack(msg);
              const stats = this.stats.get(queue) || {};
              stats.consumedCount = (stats.consumedCount || 0) + 1;
              stats.averageProcessingTimeMs =
                ((stats.averageProcessingTimeMs || 0) *
                  (stats.consumedCount - 1) +
                  (Date.now() - startTime)) /
                stats.consumedCount;
              this.stats.set(queue, stats);
            },
            nack: async (requeue = true) => {
              this.channel?.nack(msg, false, requeue);
              if (!requeue) {
                const stats = this.stats.get(queue) || {};
                stats.failedCount = (stats.failedCount || 0) + 1;
                this.stats.set(queue, stats);
              }
            },
            reject: async () => {
              this.channel?.reject(msg, false);
              const stats = this.stats.get(queue) || {};
              stats.failedCount = (stats.failedCount || 0) + 1;
              this.stats.set(queue, stats);
            },
            extendLock: async (durationMs: number) => {
              // RabbitMQ doesn't support extending lock directly
              // We would need to implement this with a separate mechanism
              this.log(
                `Lock extension requested for ${durationMs}ms (not supported in RabbitMQ)`,
              );
            },
          };

          await handler(message, result);
        } catch (error) {
          this.log(`Handler error: ${(error as Error).message}`);
          // Nack and requeue if under retry limit
          const attempts =
            (msg.properties.headers?.["x-attempts"] as number) || 0;
          if (attempts < 3) {
            // Add retry header
            this.channel?.nack(msg, false, true);
          } else {
            // Send to DLQ
            this.channel?.reject(msg, false);
          }
        }
      },
      consumeOptions,
    );

    this.consumers.set(consumerTag, queue);
    this.log(`Subscribed to queue ${queue} with consumer tag ${consumerTag}`);

    return consumerTag;
  }

  async unsubscribe(consumerTag: string): Promise<void> {
    if (!this.channel) throw new Error("Not connected");
    await this.channel.cancel(consumerTag);
    this.consumers.delete(consumerTag);
    this.log(`Unsubscribed consumer ${consumerTag}`);
  }

  async getStats(queue: string): Promise<QueueStats> {
    if (!this.channel) throw new Error("Not connected");

    const info = await this.channel.checkQueue(queue);
    const stats = this.stats.get(queue) || {};

    return {
      name: queue,
      messageCount: info.messageCount,
      consumerCount: info.consumerCount,
      publishedCount: stats.publishedCount || 0,
      consumedCount: stats.consumedCount || 0,
      failedCount: stats.failedCount || 0,
      averageProcessingTimeMs: stats.averageProcessingTimeMs || 0,
    };
  }

  async purge(queue: string): Promise<void> {
    if (!this.channel) throw new Error("Not connected");
    await this.channel.purgeQueue(queue);
    this.log(`Purged queue ${queue}`);
  }

  private buildConnectionUrl(): string {
    const [url] = this.config.urls;
    if (this.config.username && this.config.password) {
      const urlObj = new URL(url);
      urlObj.username = this.config.username;
      urlObj.password = this.config.password;
      return urlObj.toString();
    }
    return url;
  }

  private mapPriority(priority?: MessagePriority): number {
    switch (priority) {
      case "critical":
        return 10;
      case "high":
        return 7;
      case "normal":
        return 5;
      case "low":
        return 2;
      default:
        return 5;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const { retryOptions } = this.config;
    const delay = retryOptions?.baseDelayMs || 5000;

    this.reconnectTimer = setTimeout(async () => {
      this.log("Attempting to reconnect...");
      try {
        await this.connect();
      } catch (error) {
        this.log(`Reconnect failed: ${(error as Error).message}`);
        this.scheduleReconnect();
      }
    }, delay);
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[RabbitMQ] ${message}`);
    }
  }
}

export default RabbitMQBackend;
