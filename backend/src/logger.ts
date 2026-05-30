import { appendFile, mkdir, readdir, readFile, stat, unlink } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Request } from 'express'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const LOG_DIR = path.resolve(__dirname, '../logs')
const RETENTION_DAYS = Number(process.env.LOG_RETENTION_DAYS ?? '30')
const MAX_LOG_SIZE_MB = Number(process.env.LOG_MAX_SIZE_MB ?? '10')
const CLEANUP_INTERVAL_MS = Number(process.env.LOG_CLEANUP_INTERVAL_MS ?? '60') * 60 * 1000 // Default 1 hour
const LOG_BUFFER_SIZE = Number(process.env.LOG_BUFFER_SIZE ?? '100') // Buffer 100 entries before flush
const LOG_FLUSH_INTERVAL_MS = Number(process.env.LOG_FLUSH_INTERVAL_MS ?? '30') * 1000 // Flush every 30s

// Singleton state
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null
let flushIntervalId: ReturnType<typeof setInterval> | null = null
let isInitialized = false

// Log buffering
let logBuffer: string[] = []
let isFlushing = false

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

export async function cleanupOldLogs(days = RETENTION_DAYS): Promise<number> {
  let deletedCount = 0
  try {
    const files = await readdir(LOG_DIR)
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(LOG_DIR, file)
        const fileStats = await stat(filePath)
        if (fileStats.mtime.getTime() < cutoff) {
          await unlink(filePath)
          deletedCount++
          console.log(`[logger] Deleted old log: ${file}`)
        }
      })
    )
  } catch (err) {
    console.error('[logger] cleanupOldLogs failed', err)
  }
  return deletedCount
}

export async function cleanupLargeLogs(maxSizeMB = MAX_LOG_SIZE_MB): Promise<number> {
  let trimmedCount = 0
  try {
    const files = await readdir(LOG_DIR)
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(LOG_DIR, file)
        const fileStats = await stat(filePath)
        if (fileStats.size > maxSizeBytes) {
          // Read file, keep only last 1000 lines
          const content = await readFile(filePath, 'utf8')
          const lines = content.split('\n').filter(line => line.trim())
          if (lines.length > 1000) {
            const trimmed = lines.slice(-1000).join('\n') + '\n'
            const { writeFile } = await import('fs/promises')
            await writeFile(filePath, trimmed, 'utf8')
            trimmedCount++
            console.log(`[logger] Trimmed oversized log: ${file} (${lines.length} -> 1000 lines)`)
          }
        }
      })
    )
  } catch (err) {
    console.error('[logger] cleanupLargeLogs failed', err)
  }
  return trimmedCount
}

export async function startScheduledCleanup(): Promise<void> {
  // Prevent multiple intervals
  if (cleanupIntervalId !== null) {
    console.log('[logger] Scheduled cleanup already running')
    return
  }

  console.log(`[logger] Starting scheduled cleanup (interval: ${CLEANUP_INTERVAL_MS}ms, retention: ${RETENTION_DAYS} days, max size: ${MAX_LOG_SIZE_MB}MB)`)
  
  // Run immediately once
  await cleanupOldLogs()
  await cleanupLargeLogs()

  // Schedule recurring cleanup
  cleanupIntervalId = setInterval(async () => {
    console.log('[logger] Running scheduled log cleanup...')
    const deleted = await cleanupOldLogs()
    const trimmed = await cleanupLargeLogs()
    console.log(`[logger] Cleanup complete: ${deleted} deleted, ${trimmed} trimmed`)
  }, CLEANUP_INTERVAL_MS)
}

export function stopScheduledCleanup(): void {
  if (cleanupIntervalId !== null) {
    clearInterval(cleanupIntervalId)
    cleanupIntervalId = null
    console.log('[logger] Scheduled cleanup stopped')
  }
}

export async function initializeLogger(): Promise<void> {
  if (isInitialized) {
    console.log('[logger] Already initialized, skipping')
    return
  }

  await ensureLogDir()
  await startScheduledCleanup()
  startFlushInterval()
  isInitialized = true
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[logger] SIGTERM received, flushing buffer and stopping cleanup')
    await flushBuffer()
    stopScheduledCleanup()
    stopFlushInterval()
  })
  process.on('SIGINT', async () => {
    console.log('[logger] SIGINT received, flushing buffer and stopping cleanup')
    await flushBuffer()
    stopScheduledCleanup()
    stopFlushInterval()
  })

  console.log('[logger] Initialized successfully')
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

export async function flushBuffer(): Promise<void> {
  if (isFlushing || logBuffer.length === 0) return
  
  isFlushing = true
  const entries = logBuffer.splice(0, logBuffer.length) // Clear buffer and get all entries
  
  try {
    await ensureLogDir()
    await appendFile(getLogFilePath(), entries.join(''), { encoding: 'utf8' })
  } catch (err) {
    console.error('[logger] Failed to flush buffer, re-adding entries', err)
    // Re-add entries to buffer for next attempt (keep at most buffer size)
    logBuffer.unshift(...entries.slice(0, LOG_BUFFER_SIZE))
  } finally {
    isFlushing = false
  }
}

export async function appendLog(level: string, message: string, meta: Record<string, unknown> = {}): Promise<void> {
  const entry = formatLogEntry(level, message, meta)
  logBuffer.push(entry)
  
  // Flush immediately if buffer is full
  if (logBuffer.length >= LOG_BUFFER_SIZE) {
    await flushBuffer()
  }
}

export function startFlushInterval(): void {
  if (flushIntervalId !== null) {
    return
  }
  
  flushIntervalId = setInterval(() => {
    void flushBuffer()
  }, LOG_FLUSH_INTERVAL_MS)
}

export function stopFlushInterval(): void {
  if (flushIntervalId !== null) {
    clearInterval(flushIntervalId)
    flushIntervalId = null
  }
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

// Health check for monitoring
export function getLoggerStatus(): { initialized: boolean; cleanupRunning: boolean } {
  return {
    initialized: isInitialized,
    cleanupRunning: cleanupIntervalId !== null
  }
}