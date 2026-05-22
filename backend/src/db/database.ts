import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL
  ? path.resolve(process.env.DATABASE_URL)
  : path.join(__dirname, '../../data/projects.db');

export let db: Database.Database;

export function initDb(overrideDb?: Database.Database): void {
  if (overrideDb) {
    db = overrideDb;
  } else if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      description TEXT,
      priority_index INTEGER NOT NULL DEFAULT 0,
      is_public INTEGER NOT NULL DEFAULT 1,
      is_archived INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      tab_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tab_id) REFERENCES tabs(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      step_order INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'CLEAR',
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'private',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration: add tab_id column to existing projects table (pre-schema v2)
  const tabCol = db.prepare(`PRAGMA table_info(projects)`).all() as any[];
  const hasTabId = tabCol.some((c) => c.name === 'tab_id');
  if (!hasTabId) {
    db.exec(`ALTER TABLE projects ADD COLUMN tab_id TEXT REFERENCES tabs(id) ON DELETE SET NULL;`);
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority_index);
    CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(is_archived);
    CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_projects_tab ON projects(tab_id);
    CREATE INDEX IF NOT EXISTS idx_steps_project ON steps(project_id);
    CREATE INDEX IF NOT EXISTS idx_steps_order ON steps(step_order);
    CREATE INDEX IF NOT EXISTS idx_tabs_sort ON tabs(sort_order);
  `);

  // Migration: create default "General" tab and assign orphaned projects to it
  const existingTabs = db.prepare(`SELECT COUNT(*) as count FROM tabs`).get() as { count: number };
  if (existingTabs.count === 0) {
    const generalTabId = '00000000-0000-0000-0000-000000000001';
    db.prepare(`
      INSERT INTO tabs (id, name, visibility, sort_order, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(generalTabId, 'General', 'public', 0);

    db.prepare(`UPDATE projects SET tab_id = ? WHERE tab_id IS NULL`).run(generalTabId);
  }
}