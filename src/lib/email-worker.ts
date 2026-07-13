import { Worker } from 'bullmq';
import { queueRedis } from './redis-connection';
import { sendWelcomeEmail } from './mail';

// Global variable to persist worker across hot-reloads in development
const globalForWorker = global as unknown as { emailWorker: Worker | undefined };

export const emailWorker = globalForWorker.emailWorker || new Worker(
  'email-queue',
  async (job) => {
    if (job.name === 'sendWelcomeEmail') {
      const { email, name } = job.data;
      if (!email) {
        throw new Error('Email is missing from job data');
      }
      await sendWelcomeEmail(email, name);
    } else {
      console.warn(`[Worker] Unknown job type received: ${job.name}`);
    }
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection: queueRedis as any,
    concurrency: 1, // Process one email at a time to prevent rate limiting
    stalledInterval: 300000, // Check for stalled jobs every 5 minutes instead of 30s
    drainDelay: 60, // Long poll for 60s when queue is empty instead of checking every 5s
  }
);

if (process.env.NODE_ENV !== 'production') {
  globalForWorker.emailWorker = emailWorker;
}

// Log worker events for transparency and debugging
emailWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});

console.log('[Worker] Email worker process successfully initialized and listening for jobs.');
