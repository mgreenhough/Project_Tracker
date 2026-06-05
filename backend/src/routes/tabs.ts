import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { tabCreateSchema, tabUpdateSchema } from '../validation/schemas.js';

const router = Router();

interface TabOut {
  id: string;
  name: string;
  visibility: 'public' | 'private';
  sortOrder: number;
  createdAt: string;
}

function rowToTab(row: any): TabOut {
  return {
    id: row.id,
    name: row.name,
    visibility: row.visibility,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

// GET /tabs — returns all tabs ordered by sort_order
router.get('/', optionalAuth, (req: AuthRequest, res) => {
  let query = `SELECT * FROM tabs`;
  if (!req.user) {
    query += ` WHERE visibility = 'public'`;
  }
  query += ` ORDER BY sort_order ASC, created_at ASC`;
  const rows = db.prepare(query).all();
  res.json({ tabs: (rows as any[]).map(rowToTab) });
});

// POST /tabs — create a new tab
router.post('/', requireAuth, (req: AuthRequest, res) => {
  const parse = tabCreateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
    return;
  }

  const data = parse.data;
  const id = uuidv4();
  const now = new Date().toISOString();

  const maxSort = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) as max FROM tabs`).get() as { max: number };
  const sortOrder = data.sortOrder ?? (maxSort.max + 1);

  db.prepare(`
    INSERT INTO tabs (id, name, visibility, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.visibility ?? 'private',
    sortOrder,
    now
  );

  const row = db.prepare(`SELECT * FROM tabs WHERE id = ?`).get(id);
  res.status(201).json({ tab: rowToTab(row) });
});

// PATCH /tabs/:id — update a tab
router.patch('/:id', requireAuth, (req: AuthRequest, res) => {
  const parse = tabUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
    return;
  }

  const { id } = req.params;
  const data = parse.data;
  const now = new Date().toISOString();

  const existing = db.prepare(`SELECT * FROM tabs WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Tab not found' });
    return;
  }

  db.prepare(`
    UPDATE tabs SET
      name = COALESCE(?, name),
      visibility = COALESCE(?, visibility),
      sort_order = COALESCE(?, sort_order),
      created_at = ?
    WHERE id = ?
  `).run(
    data.name ?? null,
    data.visibility ?? null,
    data.sortOrder ?? null,
    now,
    id
  );

  const row = db.prepare(`SELECT * FROM tabs WHERE id = ?`).get(id);
  res.json({ tab: rowToTab(row) });
});

// DELETE /tabs/:id — delete a tab
router.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;

  const existing = db.prepare(`SELECT * FROM tabs WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Tab not found' });
    return;
  }

  // Count projects in this tab
  const projectCount = db.prepare(`SELECT COUNT(*) as count FROM projects WHERE tab_id = ? AND is_deleted = 0`).get(id) as { count: number };

  if (projectCount.count > 0) {
    res.status(409).json({
      error: 'Tab has projects',
      count: projectCount.count,
      message: 'This tab contains projects. Move or delete them first, or use force=true to delete the tab and move projects to the default tab.',
    });
    return;
  }

  db.prepare(`DELETE FROM tabs WHERE id = ?`).run(id);
  res.status(204).send();
});

// GET /tabs/:id/total-time — returns total elapsed time for all timers in all projects in a tab
router.get('/:id/total-time', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;

  const tab = db.prepare(`SELECT * FROM tabs WHERE id = ?`).get(id);
  if (!tab) {
    res.status(404).json({ error: 'Tab not found' });
    return;
  }

  // Get all projects in this tab
  const projects = db.prepare(`SELECT id FROM projects WHERE tab_id = ? AND is_deleted = 0`).all(id) as any[];

  if (projects.length === 0) {
    res.json({ totalSeconds: 0 });
    return;
  }

  const projectIds = projects.map((p) => p.id);

  // Get all timers for these projects
  const placeholders = projectIds.map(() => '?').join(',');
  const timers = db
    .prepare(`SELECT * FROM timers WHERE project_id IN (${placeholders})`)
    .all(...projectIds) as any[];

  let totalSeconds = 0;

  for (const timer of timers) {
    totalSeconds += timer.elapsed_seconds;
    if (timer.is_running === 1 && timer.started_at) {
      const startedAt = new Date(timer.started_at).getTime();
      const nowTime = new Date().getTime();
      totalSeconds += Math.floor((nowTime - startedAt) / 1000);
    }
  }

  res.json({ totalSeconds });
});

export default router;
