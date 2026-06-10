import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AuthPayload } from '../middleware/auth.js';

let io: Server | null = null;

const userSockets = new Map<string, Set<string>>();

export const websocketService = {
  initialize(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingInterval: 25000,
      pingTimeout: 20000,
    });

    io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        next(new Error('Authentication required'));
        return;
      }

      try {
        const decoded = jwt.verify(token as string, config.jwt.secret) as AuthPayload;
        (socket as unknown as Record<string, unknown>).user = decoded;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket: Socket) => {
      const user = (socket as unknown as { user: AuthPayload }).user;
      logger.info(`WebSocket client connected: ${user.userId}`);

      if (!userSockets.has(user.userId)) {
        userSockets.set(user.userId, new Set());
      }
      userSockets.get(user.userId)!.add(socket.id);

      socket.join(`user:${user.userId}`);

      socket.on('subscribe:agent', (agentId: string) => {
        socket.join(`agent:${agentId}`);
        logger.debug(`Socket ${socket.id} subscribed to agent ${agentId}`);
      });

      socket.on('unsubscribe:agent', (agentId: string) => {
        socket.leave(`agent:${agentId}`);
      });

      socket.on('subscribe:execution', (executionId: string) => {
        socket.join(`execution:${executionId}`);
      });

      socket.on('ping', (cb: (data: unknown) => void) => {
        if (typeof cb === 'function') cb({ pong: true });
      });

      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${user.userId}`);
        const sockets = userSockets.get(user.userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(user.userId);
          }
        }
      });
    });

    logger.info('WebSocket server initialized');
    return io;
  },

  getIO(): Server {
    if (!io) {
      throw new Error('WebSocket server not initialized');
    }
    return io;
  },

  sendToUser(userId: string, message: { type: string; payload: unknown }): void {
    if (!io) return;
    io.to(`user:${userId}`).emit('message', {
      ...message,
      timestamp: new Date().toISOString(),
    });
  },

  sendToAgent(agentId: string, message: { type: string; payload: unknown }): void {
    if (!io) return;
    io.to(`agent:${agentId}`).emit('message', {
      ...message,
      timestamp: new Date().toISOString(),
    });
  },

  sendToExecution(executionId: string, message: { type: string; payload: unknown }): void {
    if (!io) return;
    io.to(`execution:${executionId}`).emit('message', {
      ...message,
      timestamp: new Date().toISOString(),
    });
  },

  broadcast(message: { type: string; payload: unknown }): void {
    if (!io) return;
    io.emit('message', {
      ...message,
      timestamp: new Date().toISOString(),
    });
  },

  isUserConnected(userId: string): boolean {
    const sockets = userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  },

  getConnectedUsersCount(): number {
    return userSockets.size;
  },
};
