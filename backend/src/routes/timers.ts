import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { timerCreateSchema, timerUpdateSchema } from '../validation/schemas.js';

const router = Router();

interface TimerOut {
  id: string;
  stepId: string;
  projectId: string;
  description: string;
  elapsedSeconds: number;
  isRunning: boolean;
  startedAt: string | null;
  checkInDisabled: boolean;
  createdAt: string;
  updatedAt: string;
}

function rowToTimer(row: any): TimerOut {
  return {
    id: row.id,
    stepId: row.step_id,
    projectId: row.project_id,
    description: row.description,
    elapsedSeconds: row.elapsed_seconds,
    isRunning: row.is_running === 1,
    startedAt: row.started_at,
    checkInDisabled: row.check_in_disabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /timers?stepId= — returns all timers for a step
router.get('/', requireAuth, (req: AuthRequest, res) => {
  const { stepId } = req.query;

  if (!stepId || typeof stepId !== 'string') {
    res.status(400).json({ error: 'stepId query parameter is required' });
    return;
  }

  const rows = db
    .prepare(`SELECT * FROM timers WHERE step_id = ? ORDER BY created_at ASC`)
    .all(stepId);

  res.json({ timers: (rows as any[]).map(rowToTimer) });
});

// POST /timers — create a new timer
router.post('/', requireAuth, (req: AuthRequest, res) => {
  const parse = timerCreateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
    return;
  }

  const data = parse.data;
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO timers (id, step_id, project_id, description, elapsed_seconds, is_running, started_at, check_in_disabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.stepId,
    data.projectId,
    data.description ?? '',
    0,
    0,
    null,
    0,
    now,
    now
  );

  const row = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id);
  res.status(201).json({ timer: rowToTimer(row) });
});

// PATCH /timers/:id — update a timer (description only)
router.patch('/:id', requireAuth, (req: AuthRequest, res) => {
  const parse = timerUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
    return;
  }

  const { id } = req.params;
  const data = parse.data;
  const now = new Date().toISOString();

  const existing = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Timer not found' });
    return;
  }

  db.prepare(`
    UPDATE timers SET
      description = COALESCE(?, description),
      check_in_disabled = COALESCE(?, check_in_disabled),
      updated_at = ?
    WHERE id = ?
  `).run(
    data.description ?? null,
    data.checkInDisabled !== undefined ? (data.checkInDisabled ? 1 : 0) : null,
    now,
    id
  );

  const row = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id);
  res.json({ timer: rowToTimer(row) });
});

// DELETE /timers/:id — delete a timer
router.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;

  const existing = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Timer not found' });
    return;
  }

  db.prepare(`DELETE FROM timers WHERE id = ?`).run(id);
  res.status(204).send();
});

// POST /timers/:id/start — stop any running timers, then start this one
router.post('/:id/start', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  const existing = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Timer not found' });
    return;
  }

  // Stop all running timers first
  const runningTimers = db
    .prepare(`SELECT * FROM timers WHERE is_running = 1`)
    .all() as any[];

  for (const timer of runningTimers) {
    const startedAt = new Date(timer.started_at).getTime();
    const nowTime = new Date().getTime();
    const additionalSeconds = Math.floor((nowTime - startedAt) / 1000);
    const newElapsed = timer.elapsed_seconds + additionalSeconds;

    db.prepare(`
      UPDATE timers SET
        is_running = 0,
        started_at = NULL,
        elapsed_seconds = ?,
        updated_at = ?
      WHERE id = ?
    `).run(newElapsed, now, timer.id);
  }

  // Start the requested timer
  db.prepare(`
    UPDATE timers SET
      is_running = 1,
      started_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(now, now, id);

  const row = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id);
  res.json({ timer: rowToTimer(row) });
});

// POST /timers/:id/stop — stop a running timer and calculate elapsed time
router.post('/:id/stop', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  const existing = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Timer not found' });
    return;
  }

  if (existing.is_running !== 1 || !existing.started_at) {
    res.status(400).json({ error: 'Timer is not running' });
    return;
  }

  const startedAt = new Date(existing.started_at).getTime();
  const nowTime = new Date().getTime();
  const additionalSeconds = Math.floor((nowTime - startedAt) / 1000);
  const newElapsed = existing.elapsed_seconds + additionalSeconds;

  db.prepare(`
    UPDATE timers SET
      is_running = 0,
      started_at = NULL,
      elapsed_seconds = ?,
      updated_at = ?
    WHERE id = ?
  `).run(newElapsed, now, id);

  const row = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id);
  res.json({ timer: rowToTimer(row) });
});

// POST /timers/:id/reset — reset elapsed time to 0 and stop timer
router.post('/:id/reset', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  const existing = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Timer not found' });
    return;
  }

  db.prepare(`
    UPDATE timers SET
      elapsed_seconds = 0,
      is_running = 0,
      started_at = NULL,
      updated_at = ?
    WHERE id = ?
  `).run(now, id);

  const row = db.prepare(`SELECT * FROM timers WHERE id = ?`).get(id);
  res.json({ timer: rowToTimer(row) });
});

export default router;