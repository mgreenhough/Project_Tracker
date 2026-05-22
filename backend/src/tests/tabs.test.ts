import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import Database from 'better-sqlite3'
import tabRoutes from '../routes/tabs.js'
import authRoutes from '../routes/auth.js'
import { initDb } from '../db/database.js'

let app: express.Express
let testDb: Database.Database
let authToken: string

function setupTestDb() {
  testDb = new Database(':memory:')
  testDb.pragma('journal_mode = WAL')
  testDb.pragma('foreign_keys = ON')

  initDb(testDb)

  return testDb
}

async function getAuthToken(): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'admin123' })
  return res.body.accessToken
}

describe('Tab CRUD', () => {
  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use('/api/auth', authRoutes)
    app.use('/api/tabs', tabRoutes)
  })

  beforeEach(async () => {
    setupTestDb()
    authToken = await getAuthToken()
  })

  afterAll(() => {
    if (testDb) testDb.close()
  })

  describe('GET /api/tabs', () => {
    it('returns tabs including default General tab', async () => {
      const res = await request(app).get('/api/tabs')
      expect(res.status).toBe(200)
      expect(res.body.tabs.length).toBeGreaterThanOrEqual(1)
      expect(res.body.tabs[0].name).toBe('General')
    })
  })

  describe('POST /api/tabs', () => {
    it('creates a tab with auth', async () => {
      const res = await request(app)
        .post('/api/tabs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Work', visibility: 'public' })

      expect(res.status).toBe(201)
      expect(res.body.tab).toMatchObject({
        name: 'Work',
        visibility: 'public',
      })
      expect(res.body.tab.sortOrder).toBe(1)
    })

    it('rejects creation without auth', async () => {
      const res = await request(app)
        .post('/api/tabs')
        .send({ name: 'Work' })

      expect(res.status).toBe(401)
    })

    it('validates tab name', async () => {
      const res = await request(app)
        .post('/api/tabs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' })

      expect(res.status).toBe(400)
    })

    it('defaults visibility to private', async () => {
      const res = await request(app)
        .post('/api/tabs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Home' })

      expect(res.status).toBe(201)
      expect(res.body.tab.visibility).toBe('private')
    })
  })

  describe('PATCH /api/tabs/:id', () => {
    it('updates tab name and visibility', async () => {
      const create = await request(app)
        .post('/api/tabs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Old', visibility: 'private' })

      const id = create.body.tab.id

      const res = await request(app)
        .patch(`/api/tabs/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New', visibility: 'public' })

      expect(res.status).toBe(200)
      expect(res.body.tab.name).toBe('New')
      expect(res.body.tab.visibility).toBe('public')
    })

    it('returns 404 for non-existent tab', async () => {
      const res = await request(app)
        .patch('/api/tabs/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/tabs/:id', () => {
    it('deletes an empty tab', async () => {
      const create = await request(app)
        .post('/api/tabs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'ToDelete' })

      const id = create.body.tab.id

      const res = await request(app)
        .delete(`/api/tabs/${id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(204)
    })

    it('returns 409 when tab has projects', async () => {
      const create = await request(app)
        .post('/api/tabs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'WithProjects' })

      const tabId = create.body.tab.id

      testDb.prepare(`
        INSERT INTO projects (id, title, priority_index, is_public, tab_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('proj-1', 'Test Project', 0, 1, tabId)

      const res = await request(app)
        .delete(`/api/tabs/${tabId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(409)
      expect(res.body.error).toBe('Tab has projects')
      expect(res.body.count).toBe(1)
    })

    it('rejects deletion without auth', async () => {
      const res = await request(app)
        .delete('/api/tabs/some-id')

      expect(res.status).toBe(401)
    })
  })
})