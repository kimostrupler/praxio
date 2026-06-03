import fs   from 'fs'
import path from 'path'

const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000   // 15-minute lock-out window
const STORE_PATH   = path.join(process.cwd(), 'data', 'rate-limit.json')

type Entry = { count: number; resetAt: number }
type Store = Record<string, Entry>

function readStore(): Store {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true })
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
  } catch { return {} }
}

function writeStore(store: Store) {
  const now = Date.now()
  const pruned: Store = {}
  for (const [ip, e] of Object.entries(store)) {
    if (e.resetAt > now) pruned[ip] = e
  }
  try { fs.writeFileSync(STORE_PATH, JSON.stringify(pruned), 'utf-8') } catch {}
}

export function checkRateLimit(ip: string): boolean {
  const now   = Date.now()
  const store = readStore()
  const entry = store[ip]

  if (!entry || entry.resetAt < now) {
    store[ip] = { count: 1, resetAt: now + WINDOW_MS }
    writeStore(store)
    return true
  }

  if (entry.count >= MAX_ATTEMPTS) return false

  entry.count++
  writeStore(store)
  return true
}

export function clearRateLimit(ip: string) {
  const store = readStore()
  delete store[ip]
  writeStore(store)
}
