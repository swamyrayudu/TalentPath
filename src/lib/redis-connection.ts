import Redis from 'ioredis';

// Global variable to persist connection across hot-reloads in development
const globalForQueueRedis = global as unknown as { queueRedis: Redis | undefined };

const getQueueRedisConnection = () => {
  const restUrl2 = process.env.UPSTASH_REDIS_REST_URL2;
  const restToken2 = process.env.UPSTASH_REDIS_REST_TOKEN2;

  if (restUrl2 && restToken2) {
    // Strip http:// or https:// to extract host, and build TLS TCP connection string
    const host = restUrl2.replace(/^https?:\/\//i, '');
    const connectionUrl = `rediss://default:${restToken2}@${host}:6379`;
    return new Redis(connectionUrl, {
      maxRetriesPerRequest: null, // Strictly required by BullMQ
    });
  }

  const connectionUrl = process.env.EMAIL_REDIS_URL || process.env.REDIS_URL;
  if (connectionUrl) {
    return new Redis(connectionUrl, {
      maxRetriesPerRequest: null, // Strictly required by BullMQ
    });
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379');
  const password = process.env.REDIS_PASSWORD || undefined;

  
  
  return new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: null, // Strictly required by BullMQ
  });
};

export const queueRedis = globalForQueueRedis.queueRedis || getQueueRedisConnection();

if (process.env.NODE_ENV !== 'production') {
  globalForQueueRedis.queueRedis = queueRedis;
}
