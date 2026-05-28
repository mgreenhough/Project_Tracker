import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listLogFiles, readLogFileByDate } from '../logger.js'

const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const dateQuery = req.query.date ? String(req.query.date) : undefined
    if (!dateQuery) {
      const logs = await listLogFiles()
      res.json({ logs })
      return
    }

    const content = await readLogFileByDate(dateQuery)
    res.type('text/plain').send(content)
  } catch (err) {
    console.error('[logs] failed to read logs', err)
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to read log file' })
  }
})

export default router
