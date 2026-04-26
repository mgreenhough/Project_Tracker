import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { stepCreateSchema, stepUpdateSchema } from '../validation/schemas.js';

const router = Router();

function rowToStep(row: any) {
  return {
    id: row.id,
    projectId: row.project_id,
    content: row.content,
    stepOrder: row.step_order,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Admin POST /step
router.post('/', requireAuth, (req: AuthRequest, res) => {
  const parse = stepCreateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
    return;
  }

  const data = parse.data;
  const id = uuidv4();
  const now = new Date().toISOString();

  const project = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(data.projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const maxOrder = db.prepare(`SELECT COALESCE(MAX(step_order), -1) as max FROM steps WHERE project_id = ?`).get(data.projectId) as { max: number };
  const stepOrder = data.stepOrder ?? (maxOrder.max + 1);

  db.prepare(`
    INSERT INTO steps (id, project_id, content, step_order, status, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.projectId,
    data.content,
    stepOrder,
    data.status ?? 'CLEAR',
    data.dueDate ?? null,
    now,
    now
  );

  const row = db.prepare(`SELECT * FROM steps WHERE id = ?`).get(id);
  res.status(201).json({ step: rowToStep(row) });
});

// Admin PUT /step/:id
router.put('/:id', requireAuth, (req: AuthRequest, res) => {
  const parse = stepUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
    return;
  }

  const { id } = req.params;
  const data = parse.data;
  const now = new Date().toISOString();

  const existing = db.prepare(`SELECT * FROM steps WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Step not found' });
    return;
  }

  db.prepare(`
    UPDATE steps SET
      content = COALESCE(?, content),
      step_order = COALESCE(?, step_order),
      status = COALESCE(?, status),
      due_date = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    data.content ?? null,
    data.stepOrder ?? null,
    data.status ?? null,
    data.dueDate !== undefined ? data.dueDate : undefined,
    now,
    id
  );

  const row = db.prepare(`SELECT * FROM steps WHERE id = ?`).get(id);
  res.json({ step: rowToStep(row) });
});

// Admin DELETE /step/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;

  const existing = db.prepare(`SELECT * FROM steps WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Step not found' });
    return;
  }

  db.prepare(`DELETE FROM steps WHERE id = ?`).run(id);
  res.status(204).send();
});

export default router;
