import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import JobPosting from '../models/JobPosting.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillsync';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. Ensure a Professor user exists to own the jobs
    let professor = await User.findOne({ role: 'professor' });
    if (!professor) {
      console.log('No professor found. Creating a temporary professor user...');
      professor = await User.create({
        email: 'prof.test@mnnit.ac.in',
        name: 'Test Professor',
        passwordHash: 'dummyhash', // In a real scenario, use bcrypt
        role: 'professor',
        isVerified: true,
      });
    }

    // 2. Clear existing job postings (optional, for clean seed)
    await JobPosting.deleteMany({});
    console.log('Cleared existing job postings.');

    // 3. Create 5 sample job postings
    const jobs = [
      {
        postedBy: professor._id,
        title: 'Full Stack Developer Intern',
        description: 'Looking for a student well-versed in MERN stack for a 6-month internship.',
        requiredSkills: ['React', 'Node.js', 'MongoDB', 'Express'],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active',
      },
      {
        postedBy: professor._id,
        title: 'AI Research Assistant',
        description: 'Help develop LLM-based tools for campus sync.',
        requiredSkills: ['Python', 'PyTorch', 'LangChain'],
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: 'active',
      },
      {
        postedBy: professor._id,
        title: 'UI/UX Designer',
        description: 'Design the next generation of SkillSync interfaces.',
        requiredSkills: ['Figma', 'Adobe XD', 'CSS'],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'active',
      },
      {
        postedBy: professor._id,
        title: 'Backend Engineer (Go)',
        description: 'Scale our internal services using Go.',
        requiredSkills: ['Go', 'gRPC', 'PostgreSQL'],
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired 1 day ago
        status: 'expired',
      },
      {
        postedBy: professor._id,
        title: 'DevOps Intern',
        description: 'Manage CI/CD pipelines and Docker orchestration.',
        requiredSkills: ['Docker', 'GitHub Actions', 'AWS'],
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        status: 'pending_moderation',
      },
    ];

    await JobPosting.insertMany(jobs);
    console.log('Successfully seeded 5 job postings.');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
