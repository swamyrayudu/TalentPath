import { Queue } from 'bullmq';
import { queueRedis } from './redis-connection';

// Global variable to persist queue across hot-reloads in development
const globalForQueue = global as unknown as { emailQueue: Queue | undefined };

export const emailQueue = globalForQueue.emailQueue || new Queue('email-queue', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: queueRedis as any,
  defaultJobOptions: {
    attempts: 3,                 // Retry failing jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000,               // Delay 5s, 10s, 20s
    },
    removeOnComplete: true,      // Clean up completed jobs from Redis
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.emailQueue = emailQueue;
}
