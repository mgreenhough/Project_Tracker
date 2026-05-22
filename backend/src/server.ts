import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import projectRoutes from './routes/projects.js';
import stepRoutes from './routes/steps.js';
import authRoutes from './routes/auth.js';
import tabRoutes from './routes/tabs.js';
import { initDb } from './db/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

const corsOrigins = process.env.CORS_ORIGINS;
if (corsOrigins) {
  const origin = corsOrigins === '*' ? '*' : corsOrigins.split(',');
  app.use(cors({ origin }));
} else {
  app.use(cors());
}

app.use(express.json({ limit: '1mb' }));

initDb();

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/tabs', tabRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});