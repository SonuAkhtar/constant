import { vi } from 'vitest'

interface FakeCall {
  table?: string
  fn?: string
  op: 'select' | 'upsert' | 'update' | 'delete' | 'insert' | 'rpc'
  values?: unknown
  filters: Record<string, unknown>
  range?: [number, number]
}

function createFakeSupabase() {
  const calls: FakeCall[] = []
  let offline = false
  let selectHandler: (call: FakeCall) => unknown[] = () => []

  type Result = { data: unknown; error: { message: string; code?: string } | null; status: number }

  const result = (call: FakeCall): Result => {
    if (offline) return { data: null, error: { message: 'TypeError: Failed to fetch' }, status: 0 }
    calls.push(call)
    if (call.op === 'select') return { data: selectHandler(call), error: null, status: 200 }
    return { data: null, error: null, status: 201 }
  }

  const from = (table: string) => {
    const call: FakeCall = { table, op: 'select', filters: {} }
    const builder = {
      select: () => builder,
      eq: (k: string, v: unknown) => ((call.filters[k] = v), builder),
      gte: (k: string, v: unknown) => ((call.filters[`${k}>=`] = v), builder),
      order: () => builder,
      range: (a: number, b: number) => ((call.range = [a, b]), builder),
      maybeSingle: () => builder,
      upsert: (v: unknown) => ((call.op = 'upsert'), (call.values = v), builder),
      update: (v: unknown) => ((call.op = 'update'), (call.values = v), builder),
      insert: (v: unknown) => ((call.op = 'insert'), (call.values = v), builder),
      delete: () => ((call.op = 'delete'), builder),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve(result(call)).then(res, rej),
    }
    return builder
  }

  const supabase = {
    from: vi.fn(from),
    rpc: vi.fn((fn: string, args: unknown) => Promise.resolve(result({ fn, op: 'rpc', values: args, filters: {} }))),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })), onAuthStateChange: vi.fn() },
    functions: { invoke: vi.fn() },
  }

  return {
    supabase,
    calls,
    setOffline: (v: boolean) => { offline = v },
    onSelect: (fn: (call: FakeCall) => unknown[]) => { selectHandler = fn },
  }
}

export const fake = createFakeSupabase()
