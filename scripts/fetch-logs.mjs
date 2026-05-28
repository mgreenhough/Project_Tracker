#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const API_URL = process.env.API_URL || 'https://api.khortech.com.au/api'
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const dateArg = process.argv[2] // YYYY-MM-DD (optional)

if (!email || !password) {
  console.error('Provide ADMIN_EMAIL and ADMIN_PASSWORD environment variables.')
  console.error('Example: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=pass node scripts/fetch-logs.mjs 2026-05-28')
  process.exit(1)
}

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Login failed: ${res.status} ${text}`)
  }
  return res.json()
}

async function fetchLogs(token, date) {
  const url = new URL(`${API_URL}/logs`)
  if (date) url.searchParams.set('date', date)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to fetch logs: ${res.status} ${text}`)
  }
  return res.text()
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

;(async () => {
  try {
    console.log('Logging in...')
    const data = await login()
    const token = data.accessToken || data.token || data.access_token
    if (!token) throw new Error('No access token from login response')

    let date = dateArg
    if (!date) {
      // fetch list of logs and pick latest
      const listRes = await fetch(`${API_URL}/logs`, { headers: { Authorization: `Bearer ${token}` } })
      if (!listRes.ok) {
        const t = await listRes.text().catch(() => '')
        throw new Error(`Failed to list logs: ${listRes.status} ${t}`)
      }
      const list = await listRes.json()
      if (!Array.isArray(list.logs) || list.logs.length === 0) throw new Error('No logs available')
      const latest = list.logs[0] // error-YYYY-MM-DD.log
      const m = latest.match(/error-(\d{4}-\d{2}-\d{2})\.log/)
      if (!m) throw new Error('Could not parse latest log filename')
      date = m[1]
      console.log('No date provided; using latest log date', date)
    }

    console.log('Fetching log for date', date)
    const content = await fetchLogs(token, date)
    const outDir = path.resolve(process.cwd(), 'backend_logs')
    ensureDir(outDir)
    const outPath = path.join(outDir, `error-${date}.log`)
    fs.writeFileSync(outPath, content, 'utf8')
    console.log('Saved log to', outPath)
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
})()
