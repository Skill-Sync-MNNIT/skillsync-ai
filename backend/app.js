import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import errorHandler from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/auth.routes.js';
import dashboardRoutes from './src/routes/protected.routes.js';
import profileRoutes from './src/routes/profile.routes.js';
import internalRoutes from './src/routes/internal.routes.js';
import searchRoutes from './src/routes/search.routes.js';
import jobRoutes from './src/routes/jobs.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import settingsRoutes from './src/routes/settings.routes.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

app.use('/auth', authRoutes); // later proper structure of this file

app.use('/api', dashboardRoutes);

app.use('/profile', profileRoutes);

app.use('/internal', internalRoutes);

app.use('/search', searchRoutes);
app.use('/jobs', jobRoutes);
app.use('/notifications', notificationRoutes);
app.use('/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.send('SkillSync Backend Running');
});

app.all('/{*any}', (req, res) => {
  res.status(404).send('Page Not Found');
});

app.use(errorHandler);

export default app;
