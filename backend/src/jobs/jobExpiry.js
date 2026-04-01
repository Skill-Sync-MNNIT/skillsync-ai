import cron from 'node-cron';
import JobPosting from '../models/JobPosting.js';

/**
 * Identify and mark jobs as 'expired' if their deadline has passed.
 * Runs every hour on the minute 0.
 */
export const initJobExpiryJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running automated job expiry cron...');
    try {
      const now = new Date();
      const result = await JobPosting.updateMany(
        {
          status: 'active',
          deadline: { $lt: now },
        },
        {
          status: 'expired',
        }
      );
      console.log(`Job expiry cron finished. Expired ${result.modifiedCount} jobs.`);
    } catch (error) {
      console.error('Job expiry cron error:', error);
    }
  });
};
