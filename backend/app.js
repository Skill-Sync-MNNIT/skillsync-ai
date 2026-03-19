import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// import errorHandler from "./src/middleware/errorHandler";
// import authRoutes from "./src/routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// app.use("/auth", authRoutes);         // later proper structure of this file

// app.use(errorHandler);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

app.get('/', (req, res) => {
  res.send('SkillSync Backend Running');
});

app.all('/{*any}', (req, res) => {
  res.status(404).send('Page Not Found');
});

export default app;
