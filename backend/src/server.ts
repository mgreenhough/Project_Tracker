import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import projectRoutes from './routes/projects.js';
import stepRoutes from './routes/steps.js';
import authRoutes from './routes/auth.js';
import tabRoutes from './routes/tabs.js';
import timerRoutes from './routes/timers.js';
import logRoutes from './routes/logs.js';
import { initDb } from './db/database.js';
import { initializeLogger, logError, getLoggerStatus } from './logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

app.use(express.json({ limit: '1mb' }));

async function initServer(): Promise<void> {
  await initializeLogger();

  initDb();

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/steps', stepRoutes);
  app.use('/api/tabs', tabRoutes);
  app.use('/api/timers', timerRoutes);
  app.use('/api/logs', logRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), logger: getLoggerStatus() });
  });

  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    void logError(err, req).catch((loggerErr) => console.error('[logger] failed to write error', loggerErr));
    console.error('[server] unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  process.on('uncaughtException', (error) => {
    void logError(error).catch((loggerErr) => console.error('[logger] failed to write uncaughtException', loggerErr));
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    void logError(reason).catch((loggerErr) => console.error('[logger] failed to write unhandledRejection', loggerErr));
    console.error('Unhandled rejection:', reason);
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

void initServer().catch((err) => {
  console.error('[server] failed to start', err);
});