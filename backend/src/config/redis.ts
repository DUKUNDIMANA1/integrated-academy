import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

const createRedisInstance = (): Redis => {
  const instance = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    // Stop infinite reconnect spam when Redis is down:
    // give up quickly so callers can fall back gracefully.
    retryStrategy: (times: number) => {
      if (times > 3) return null; // stop retrying
      return Math.min(times * 200, 1000);
    },
  });

  instance.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  instance.on('connect', () => {
    console.log('Redis connected');
  });

  return instance;
};

export const getRedis = (): Redis => {
  if (!redis) {
    redis = createRedisInstance();
  }
  return redis;
};

/** Create a fresh (non-shared) connection — required by BullMQ (Queue/Worker must not share). */
export const createBullMQConnection = (): Redis => createRedisInstance();

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    try {
      redis.removeAllListeners('error');
      redis.disconnect();
    } catch {
      /* ignore */
    }
    redis = null;
  }
};

export default getRedis;
