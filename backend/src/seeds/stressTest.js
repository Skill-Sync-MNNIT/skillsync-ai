import 'dotenv/config';
import mongoose from 'mongoose';
import { JobService } from '../services/jobs/job.service.js';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillsync';

async function stressTest() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected for stress test...');

    const user = await User.findOne({ role: 'professor' });
    if (!user) {
      console.error('No professor found for stress test.');
      process.exit(1);
    }

    console.log('Enqueuing 50 jobs concurrently...');
    const jobPromises = Array.from({ length: 50 }).map((_, i) =>
      JobService.createJob(
        {
          title: `Stress Test Job ${i + 1}`,
          description: `This is a stress test job description for job number ${i + 1}.`,
          requiredSkills: ['Node.js', 'Redis'],
          deadline: new Date(Date.now() + 1000000),
        },
        user._id
      )
    );

    const results = await Promise.all(jobPromises);
    console.log(`Successfully enqueued ${results.length} jobs to the moderation queue.`);

    await mongoose.disconnect();
    console.log('Stress test finished.');
  } catch (error) {
    console.error('Stress test failed:', error.message);
    process.exit(1);
  }
}

stressTest();
