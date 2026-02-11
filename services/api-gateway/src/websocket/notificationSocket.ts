import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Logger } from 'pino';
import { verifyJWT } from '../middleware/auth.js';

interface NotificationSocketData {
  userId?: string;
  authenticated: boolean;
}

export class NotificationSocketServer {
  private io: Server;
  private userConnections: Map<string, Set<string>> = new Map();
  private logger: Logger;

  constructor(httpServer: HTTPServer, logger: Logger) {
    this.logger = logger;
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO middleware for authentication
   */
  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          socket.data.authenticated = false;
          socket.data.userId = undefined;
          return next();
        }

        // Verify JWT token
        try {
          const payload = verifyJWT(token);
          socket.data.authenticated = true;
          socket.data.userId = payload.userId || payload.sub;

          this.logger.debug(
            `Socket ${socket.id} authenticated for user ${socket.data.userId}`
          );
        } catch (err) {
          socket.data.authenticated = false;
          socket.data.userId = undefined;
          this.logger.warn(`Socket ${socket.id} authentication failed`);
        }

        next();
      } catch (err) {
        this.logger.error('Socket middleware error:', err);
        next(err as Error);
      }
    });
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      const authenticated = socket.data.authenticated;

      this.logger.info(
        `Socket connected: ${socket.id} (authenticated: ${authenticated}, userId: ${userId})`
      );

      // Join user room if authenticated
      if (authenticated && userId) {
        socket.join(`user:${userId}`);
        socket.join('notifications');

        // Track connection
        if (!this.userConnections.has(userId)) {
          this.userConnections.set(userId, new Set());
        }
        this.userConnections.get(userId)!.add(socket.id);

        // Emit connected event
        socket.emit('connected', {
          socketId: socket.id,
          userId,
          timestamp: new Date().toISOString(),
        });
      }

      // Handle custom events
      socket.on('notification:subscribe', (data) => {
        if (!authenticated || !userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const channel = data?.channel || `user:${userId}`;
        socket.join(channel);

        this.logger.debug(`User ${userId} subscribed to ${channel}`);
        socket.emit('notification:subscribed', { channel });
      });

      socket.on('notification:unsubscribe', (data) => {
        if (!authenticated || !userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const channel = data?.channel || `user:${userId}`;
        socket.leave(channel);

        this.logger.debug(`User ${userId} unsubscribed from ${channel}`);
        socket.emit('notification:unsubscribed', { channel });
      });

      // Ping/keep-alive handler
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        if (authenticated && userId) {
          const connections = this.userConnections.get(userId);
          if (connections) {
            connections.delete(socket.id);
            if (connections.size === 0) {
              this.userConnections.delete(userId);
              this.logger.info(`User ${userId} fully disconnected`);
            }
          }
        }

        this.logger.info(`Socket disconnected: ${socket.id}`);
      });

      socket.on('error', (err) => {
        this.logger.error(`Socket error: ${socket.id}`, err);
      });
    });
  }

  /**
   * Broadcast notification to specific user
   */
  broadcastToUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification:new', {
      ...notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcasted notification to user ${userId}`);
  }

  /**
   * Broadcast notification to multiple users
   */
  broadcastToUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.broadcastToUser(userId, notification);
    });
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastToAll(notification: any) {
    this.io.to('notifications').emit('notification:new', {
      ...notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.info('Broadcasted notification to all users');
  }

  /**
   * Send notification with acknowledgment
   */
  async sendNotificationWithAck(userId: string, notification: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.io.to(`user:${userId}`).emit(
        'notification:new',
        {
          ...notification,
          timestamp: new Date().toISOString(),
        },
        (ack: any) => {
          if (ack && ack.received) {
            resolve(ack);
          } else {
            reject(new Error('No acknowledgment from client'));
          }
        }
      );
    });
  }

  /**
   * Get count of connected users
   */
  getConnectedUserCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get connected socket IDs for a user
   */
  getUserSockets(userId: string): string[] {
    return Array.from(this.userConnections.get(userId) || new Set());
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userConnections.has(userId) && this.userConnections.get(userId)!.size > 0;
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): Server {
    return this.io;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down NotificationSocketServer');
    this.userConnections.clear();
    await this.io.close();
  }
}

/**
 * Global notification socket instance
 */
let notificationSocket: NotificationSocketServer | null = null;

/**
 * Initialize notification socket server
 */
export function initializeNotificationSocket(
  httpServer: HTTPServer,
  logger: Logger
): NotificationSocketServer {
  if (!notificationSocket) {
    notificationSocket = new NotificationSocketServer(httpServer, logger);
  }
  return notificationSocket;
}

/**
 * Get global notification socket instance
 */
export function getNotificationSocket(): NotificationSocketServer | null {
  return notificationSocket;
}
