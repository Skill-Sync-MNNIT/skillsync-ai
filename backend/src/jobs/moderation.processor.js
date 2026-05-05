import { Worker } from 'bullmq';
import JobPosting from '../models/JobPosting.js';
import { ModerationService } from '../services/jobs/moderation.service.js';
import { NotificationEngine } from '../services/notifications/notification.engine.js';
import { BanManager } from '../services/auth/ban.manager.js';
import { findUserById } from '../repositories/index.js';
import { sendJobRejectionEmail } from '../utils/email.js';
import redis from '../config/redis.js';

export const initModerationWorker = () => {
  let worker;
  try {
    worker = new Worker(
      'moderation-queue',
      async (job) => {
        const { jobId, title, description } = job.data;
        console.log(`[MODERATION] Processing job: ${jobId}`);

        try {
          const result = await ModerationService.scanJobPost(jobId, title, description);

          const jobPosting = await JobPosting.findById(jobId);
          if (!jobPosting) return;

          if (result.passed) {
            // 1. Success: Mark job as active
            await JobPosting.findByIdAndUpdate(jobId, {
              status: 'active',
              moderationResult: {
                passed: true,
                checkedAt: new Date(),
              },
            });
            console.log(`[MODERATION] Job ${jobId} PASSED. Status: active.`);

            // Trigger NotificationEngine (Sprint 4)
            await NotificationEngine.triggerForNewJob(
              jobId,
              jobPosting.title,
              jobPosting.requiredSkills
            );
          } else {
            // 2. Failure: Mark job as rejected and apply ban
            await JobPosting.findByIdAndUpdate(jobId, {
              status: 'rejected',
              moderationResult: {
                passed: false,
                violationType: result.violation_type || 'unspecified',
                checkedAt: new Date(),
              },
            });

            console.warn(
              `[MODERATION] Job ${jobId} REJECTED: ${result.violation_type}. Applying ban.`
            );

            // Apply Violation Policy
            const banInfo = await BanManager.applyViolationPolicy(jobPosting.postedBy);

            // Notify Alumni via Email
            try {
              const user = await findUserById(jobPosting.postedBy);
              if (user && user.email) {
                await sendJobRejectionEmail(
                  user.email,
                  title,
                  result.violation_type || 'General Violation',
                  banInfo.banUntil
                );
              }
            } catch (emailError) {
              console.error('[MODERATION] Email notification failed:', emailError.message);
            }
          }
        } catch (error) {
          console.error(`[MODERATION] Error processing job ${jobId}:`, error.message);
          throw error; // Re-queue if it fails
        }
      },
      {
        connection: redis,

        /**
         * Upstash free tier = 10,000 Redis commands/day.
         * BullMQ default drainDelay is 5ms → ~17M commands/day when idle.
         *
         * drainDelay: 1000  → poll every 1s when queue is empty (~86,400/day)
         * stalledInterval   → check for stalled jobs every 60s (default: 30s)
         * lockDuration      → job lock lasts 60s → fewer mid-job lock renewals
         */
        drainDelay: 1000, // ms to wait between polls when queue is empty
        stalledInterval: 60_000, // ms between stalled-job checks
        lockDuration: 60_000, // ms a job lock stays valid (default: 30_000)
      }
    );
  } catch (err) {
    console.warn(
      '[MODERATION] Worker failed to start — Redis unavailable. Moderation queue disabled.',
      err.message
    );
    return;
  }

  worker.on('completed', (job) => {
    console.log(`[MODERATION] Completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[MODERATION] Failed job ${job?.id}:`, err.message);
  });

  worker.on('error', (err) => {
    // Absorbs transport-level errors (e.g. Redis disconnect) so the process doesn't crash
    console.error('[MODERATION] Worker error:', err.message);
  });
};
