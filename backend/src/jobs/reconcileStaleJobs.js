import JobPosting from '../models/JobPosting.js';
import { moderationQueue } from '../config/queue.js';
import redis from '../config/redis.js';

/**
 * Reconciliation Job
 * ------------------
 * Upstash free tier can go offline (daily limits, cold starts, rate limits).
 * When Redis is down, jobs are saved to MongoDB as "pending_moderation" but
 * never enqueued. This job runs on:
 *   1. Server startup (to catch stale jobs from previous downtime)
 *   2. Redis 'ready' event (when Redis comes back online mid-session)
 *
 * It finds all stale "pending_moderation" jobs and re-enqueues them.
 */
export const reconcileStaleJobs = async () => {
  if (!moderationQueue) {
    console.warn('[Reconcile] Moderation queue not available — skipping reconciliation.');
    return;
  }

  try {
    // Find all jobs stuck in pending_moderation
    const staleJobs = await JobPosting.find({ status: 'pending_moderation' }).lean();

    if (staleJobs.length === 0) {
      console.log('[Reconcile] No stale jobs found. Queue is clean ✅');
      return;
    }

    console.log(`[Reconcile] Found ${staleJobs.length} stale job(s) — re-enqueuing...`);

    let enqueued = 0;
    for (const job of staleJobs) {
      try {
        // jobId used as deduplication key — prevents double-processing
        // if the job was already in the queue from a previous run
        await moderationQueue.add(
          'moderate-job',
          {
            jobId: job._id,
            title: job.title,
            description: job.description,
          },
          {
            jobId: `reconcile-${job._id}`, // BullMQ dedup key
          }
        );
        enqueued++;
        console.log(`[Reconcile] Re-enqueued job: ${job._id} ("${job.title}")`);
      } catch (err) {
        console.error(`[Reconcile] Failed to re-enqueue job ${job._id}:`, err.message);
      }
    }

    console.log(`[Reconcile] Done — ${enqueued}/${staleJobs.length} job(s) re-enqueued.`);
  } catch (err) {
    console.error('[Reconcile] Error during reconciliation:', err.message);
  }
};

/**
 * Registers the reconciliation to auto-run whenever Redis reconnects.
 * This handles mid-session Upstash cold starts or daily limit resets.
 */
export const registerRedisReconnectReconciliation = () => {
  redis.on('ready', async () => {
    console.log('[Reconcile] Redis is ready — running stale job reconciliation...');
    // Small delay to let BullMQ queue re-initialize its internal state
    setTimeout(reconcileStaleJobs, 2000);
  });
};
