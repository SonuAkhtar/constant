import { supabase } from './supabase'
import { reportError } from './monitoring'

type Row = Record<string, unknown>

type Op = (
  | { kind: 'upsert'; table: string; values: Row | Row[]; onConflict?: string }
  | { kind: 'update'; table: string; values: Row; match: Record<string, string> }
  | { kind: 'delete'; table: string; match: Record<string, string> }
  | { kind: 'rpc'; fn: string; args: Row }
) & { attempts?: number }

type Result = { status: number; error: { message: string; code?: string } | null }

const MAX_ATTEMPTS = 20
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000
const MISSING_SCHEMA_CODES = new Set(['PGRST202', 'PGRST205', '42P01', '42883'])

function isTransient({ status, error }: Result): boolean {
  return (
    status === 401 ||
    status === 408 ||
    status === 429 ||
    status >= 500 ||
    MISSING_SCHEMA_CODES.has(error?.code ?? '')
  )
}

const KEY = 'progress-outbox'

function load(): Op[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

let queue: Op[] = load()
let flushing: Promise<void> | null = null
let retryTimer: ReturnType<typeof setTimeout> | undefined

function scheduleRetry(attempts: number) {
  clearTimeout(retryTimer)
  const delay = Math.min(MAX_RETRY_DELAY_MS, 2000 * 2 ** attempts)
  retryTimer = setTimeout(() => void flushOutbox(), delay)
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue))
  } catch (e) {
    reportError(e, { where: 'outbox.save', queued: queue.length })
  }
}

async function run(op: Op): Promise<Result> {
  if (op.kind === 'rpc') {
    return await supabase.rpc(op.fn, op.args)
  }
  if (op.kind === 'upsert') {
    return await supabase
      .from(op.table)
      .upsert(op.values, op.onConflict ? { onConflict: op.onConflict } : undefined)
  }
  if (op.kind === 'update') {
    let q = supabase.from(op.table).update(op.values)
    for (const [k, v] of Object.entries(op.match)) q = q.eq(k, v)
    return await q
  }
  let q = supabase.from(op.table).delete()
  for (const [k, v] of Object.entries(op.match)) q = q.eq(k, v)
  return await q
}

export function enqueue(op: Op) {
  queue.push(op)
  save()
  void flushOutbox()
}

export function flushOutbox(): Promise<void> {
  if (flushing) return flushing
  flushing = (async () => {
    while (queue.length > 0) {
      const op = queue[0]
      let res: Result
      try {
        res = await run(op)
      } catch (e) {
        res = { status: 0, error: { message: e instanceof Error ? e.message : String(e) } }
      }
      if (res.error && res.status === 0) break
      if (res.error && isTransient(res)) {
        op.attempts = (op.attempts ?? 0) + 1
        if (op.attempts < MAX_ATTEMPTS) {
          save()
          scheduleRetry(op.attempts)
          break
        }
      }
      if (res.error) {
        const target = op.kind === 'rpc' ? op.fn : op.table
        reportError(new Error(`[sync] ${op.kind} ${target}: ${res.error.message}`), {
          status: res.status,
          code: res.error.code,
          attempts: op.attempts ?? 1,
        })
      }
      queue.shift()
      save()
    }
  })().finally(() => {
    flushing = null
  })
  return flushing
}

export const hasPendingWrites = () => queue.length > 0

export function clearOutbox() {
  clearTimeout(retryTimer)
  queue = []
  save()
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushOutbox())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void flushOutbox()
  })
}
