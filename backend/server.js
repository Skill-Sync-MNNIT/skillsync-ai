import 'dotenv/config';

import app from './app.js';
import connectDB from './src/config/db.js';

await connectDB();

const PORT = process.env.PORT || 5000;

// import { sendOTPEmail } from "./src/utils/email.js";

// sendOTPEmail("vivek.2024ca115@mnnit.ac.in", "547856", "Vivek");

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
