import { Queue } from 'bullmq';
import redis from './redis.js';

/**
 * Shared BullMQ moderation queue.
 * Exported as `null` if Redis is unavailable at startup.
 */
let moderationQueue = null;

try {
  moderationQueue = new Queue('moderation-queue', { connection: redis });
  console.log('[Queue] Moderation queue initialized.');
} catch (err) {
  console.warn('[Queue] Failed to initialize moderation queue — Redis unavailable:', err.message);
}

export { moderationQueue };
