import 'dotenv/config';
import app from './app.js';
import connectDB from './src/config/db.js';
import { initFacultyScraperJob } from './src/jobs/facultyScraperJob.js';

await connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initFacultyScraperJob();
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
