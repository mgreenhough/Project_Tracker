import { appendFile, mkdir, readdir, readFile, stat, unlink } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Request } from 'express'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const LOG_DIR = path.resolve(__dirname, '../logs')
const RETENTION_DAYS = Number(process.env.LOG_RETENTION_DAYS ?? '30')

function getLogFileName(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `error-${year}-${month}-${day}.log`
}

function getLogFilePath(date = new Date()): string {
  return path.join(LOG_DIR, getLogFileName(date))
}

function formatLogEntry(level: string, message: string, meta: Record<string, unknown> = {}): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  }) + '\n'
}

export async function ensureLogDir(): Promise<void> {
  await mkdir(LOG_DIR, { recursive: true })
}

export async function cleanupOldLogs(days = RETENTION_DAYS): Promise<void> {
  try {
    const files = await readdir(LOG_DIR)
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(LOG_DIR, file)
        const fileStats = await stat(filePath)
        if (fileStats.mtime.getTime() < cutoff) {
          await unlink(filePath)
        }
      })
    )
  } catch (err) {
    console.error('[logger] cleanupOldLogs failed', err)
  }
}

export async function listLogFiles(): Promise<string[]> {
  await ensureLogDir()
  const files = await readdir(LOG_DIR)
  return files
    .filter((file) => /^error-\d{4}-\d{2}-\d{2}\.log$/.test(file))
    .sort((a, b) => b.localeCompare(a))
}

export async function readLogFileByDate(dateString: string): Promise<string> {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.')
  }
  const filePath = getLogFilePath(date)
  return await readFile(filePath, 'utf8')
}

export async function appendLog(level: string, message: string, meta: Record<string, unknown> = {}): Promise<void> {
  const entry = formatLogEntry(level, message, meta)
  await ensureLogDir()
  await appendFile(getLogFilePath(), entry, { encoding: 'utf8' })
}

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack }
  }
  if (typeof error === 'string') {
    return { message: error }
  }
  return { message: 'Unknown error', stack: JSON.stringify(error) }
}

export async function logError(error: unknown, req?: Request): Promise<void> {
  const normalized = normalizeError(error)
  const meta: Record<string, unknown> = {
    ...normalized,
  }
  if (req) {
    meta.request = {
      method: req.method,
      url: req.originalUrl || req.url,
      query: req.query,
      ip: req.ip,
    }
  }
  await appendLog('error', normalized.message, meta)
}
