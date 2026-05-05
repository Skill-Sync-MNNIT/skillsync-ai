import 'dotenv/config';
import app from './app.js';
import connectDB from './src/config/db.js';
import { initFacultyScraperJob } from './src/jobs/facultyScraperJob.js';
import { initJobExpiryJob } from './src/jobs/jobExpiry.js';
import { initModerationWorker } from './src/jobs/moderation.processor.js';
import { initSocket } from './src/services/socket.js';
import {
  reconcileStaleJobs,
  registerRedisReconnectReconciliation,
} from './src/jobs/reconcileStaleJobs.js';

await connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initSocket(server);
  initFacultyScraperJob();
  initJobExpiryJob();
  initModerationWorker();

  // Re-enqueue any jobs that got stuck as pending_moderation during Redis downtime
  reconcileStaleJobs();

  // Auto-reconcile whenever Upstash reconnects mid-session
  registerRedisReconnectReconciliation();
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
