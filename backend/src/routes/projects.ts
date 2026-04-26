import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { projectCreateSchema, projectUpdateSchema } from '../validation/schemas.js';

const router = Router();

interface ProjectOut {
  id: string;
  title: string;
  description: string | null;
  priorityIndex: number;
  isPublic: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  steps: any[];
}

function rowToProject(row: any): ProjectOut {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priorityIndex: row.priority_index,
    isPublic: !!row.is_public,
    isArchived: !!row.is_archived,
    isDeleted: !!row.is_deleted,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    steps: [],
  };
}

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

// Public GET /projects — returns non-archived, non-deleted public projects with steps
router.get('/', (_req, res) => {
  const projectRows = db.prepare(
    `SELECT * FROM projects WHERE is_archived = 0 AND is_deleted = 0 AND is_public = 1 ORDER BY priority_index ASC`
  ).all();

  const stepRows = db.prepare(
    `SELECT * FROM steps WHERE project_id IN (${projectRows.map(() => '?').join(',')}) ORDER BY step_order ASC`
  ).all(projectRows.map((r: any) => r.id));

  const projects = projectRows.map(rowToProject);
  const stepsByProject = new Map<string, any[]>();
  for (const s of stepRows as any[]) {
    const arr = stepsByProject.get(s.project_id) || [];
    arr.push(rowToStep(s));
    stepsByProject.set(s.project_id, arr);
  }

  for (const p of projects) {
    p.steps = stepsByProject.get(p.id) || [];
  }

  res.json({ projects });
});

// Admin POST /project
router.post('/', requireAuth, (req: AuthRequest, res) => {
  const parse = projectCreateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
    return;
  }

  const data = parse.data;
  const id = uuidv4();
  const now = new Date().toISOString();

  const maxPriority = db.prepare(`SELECT COALESCE(MAX(priority_index), -1) as max FROM projects`).get() as { max: number };
  const priorityIndex = data.priorityIndex ?? (maxPriority.max + 1);

  db.prepare(`
    INSERT INTO projects (id, title, description, priority_index, is_public, is_archived, is_deleted, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title,
    data.description ?? null,
    priorityIndex,
    data.isPublic ?? true ? 1 : 0,
    data.isArchived ?? false ? 1 : 0,
    0,
    data.dueDate ?? null,
    now,
    now
  );

  const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
  res.status(201).json({ project: rowToProject(row) });
});

// Admin PUT /project/:id
router.put('/:id', requireAuth, (req: AuthRequest, res) => {
  const parse = projectUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
    return;
  }

  const { id } = req.params;
  const data = parse.data;
  const now = new Date().toISOString();

  const existing = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  db.prepare(`
    UPDATE projects SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority_index = COALESCE(?, priority_index),
      is_public = COALESCE(?, is_public),
      is_archived = COALESCE(?, is_archived),
      due_date = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    data.title ?? null,
    data.description ?? null,
    data.priorityIndex ?? null,
    data.isPublic !== undefined ? (data.isPublic ? 1 : 0) : null,
    data.isArchived !== undefined ? (data.isArchived ? 1 : 0) : null,
    data.dueDate !== undefined ? data.dueDate : undefined,
    now,
    id
  );

  const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
  res.json({ project: rowToProject(row) });
});

// Admin DELETE /project/:id (soft delete)
router.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  const existing = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  db.prepare(`UPDATE projects SET is_deleted = 1, updated_at = ? WHERE id = ?`).run(now, id);
  res.status(204).send();
});

export default router;
