import Redis from 'ioredis';

// Global variable to persist connection across hot-reloads in development
const globalForQueueRedis = global as unknown as { queueRedis: Redis | undefined };

const getQueueRedisConnection = () => {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL2 || process.env.UPSTASH_REDIS_REST_URL1;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN2 || process.env.UPSTASH_REDIS_REST_TOKEN1;

  let client: Redis;

  if (restUrl && restToken) {
    // Strip http:// or https:// to extract host, and build TLS TCP connection string
    const host = restUrl.replace(/^https?:\/\//i, '');
    const connectionUrl = `rediss://default:${restToken}@${host}:6379`;
    client = new Redis(connectionUrl, {
      maxRetriesPerRequest: null, // Strictly required by BullMQ
      retryStrategy(times) {
        return Math.min(times * 1000, 30000);
      },
    });
  } else {
    const connectionUrl = process.env.EMAIL_REDIS_URL || process.env.REDIS_URL;
    if (connectionUrl) {
      client = new Redis(connectionUrl, {
        maxRetriesPerRequest: null, // Strictly required by BullMQ
        retryStrategy(times) {
          return Math.min(times * 1000, 30000);
        },
      });
    } else {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = parseInt(process.env.REDIS_PORT || '6379');
      const password = process.env.REDIS_PASSWORD || undefined;

      client = new Redis({
        host,
        port,
        password,
        maxRetriesPerRequest: null, // Strictly required by BullMQ
        retryStrategy(times) {
          return Math.min(times * 1000, 30000);
        },
      });
    }
  }

  // Prevent uncaught error crashes/unhandled events
  client.on('error', (err) => {
    console.error('[Queue Redis] Connection error:', err.message);
  });

  return client;
};

export const queueRedis = globalForQueueRedis.queueRedis || getQueueRedisConnection();

if (process.env.NODE_ENV !== 'production') {
  globalForQueueRedis.queueRedis = queueRedis;
}

