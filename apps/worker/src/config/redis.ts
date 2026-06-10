import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from './logger.js';

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    });

    redisInstance.on('connect', () => logger.info('Worker Redis connected'));
    redisInstance.on('error', (err) => logger.error('Worker Redis error', err));
  }

  return redisInstance;
}

export const redis = getRedisClient();
