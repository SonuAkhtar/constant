import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', async () => ({ supabase: (await import('../test/fakeSupabase')).fake.supabase }))

import { fake } from '../test/fakeSupabase'
import { clearOutbox, enqueue, flushOutbox, hasPendingWrites } from './outbox'

beforeEach(() => {
  clearOutbox()
  fake.calls.length = 0
  fake.setOffline(false)
})

describe('outbox', () => {
  it('keeps writes while offline and sends them in order once back online', async () => {
    fake.setOffline(true)
    enqueue({ kind: 'delete', table: 'habits', match: { id: '1' } })
    enqueue({ kind: 'delete', table: 'habits', match: { id: '2' } })
    await flushOutbox()
    expect(hasPendingWrites()).toBe(true)

    fake.setOffline(false)
    await flushOutbox()
    expect(hasPendingWrites()).toBe(false)
    expect(fake.calls.map((c) => c.filters.id)).toEqual(['1', '2'])
  })

  it('survives a reload via localStorage', () => {
    fake.setOffline(true)
    enqueue({ kind: 'delete', table: 'habits', match: { id: '1' } })
    expect(JSON.parse(localStorage.getItem('progress-outbox')!)).toHaveLength(1)
  })

  it('drops a write the server rejects instead of retrying it forever', async () => {
    fake.supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'violates check constraint' }, status: 400 })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    enqueue({ kind: 'rpc', fn: 'upsert_habit_logs', args: { logs: [] } })
    await flushOutbox()
    expect(hasPendingWrites()).toBe(false)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('keeps a write queued after a temporary server error and sends it later', async () => {
    fake.supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Service Unavailable' }, status: 503 })
    enqueue({ kind: 'rpc', fn: 'upsert_habit_logs', args: { logs: [] } })
    await flushOutbox()
    expect(hasPendingWrites()).toBe(true)
    expect(JSON.parse(localStorage.getItem('progress-outbox')!)[0].attempts).toBe(1)

    await flushOutbox()
    expect(hasPendingWrites()).toBe(false)
  })

  it('keeps a write queued while the database function is not deployed yet', async () => {
    fake.supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Could not find the function', code: 'PGRST202' }, status: 404 })
    enqueue({ kind: 'rpc', fn: 'upsert_habit_logs', args: { logs: [] } })
    await flushOutbox()
    expect(hasPendingWrites()).toBe(true)
  })

  it('gives up on a write that keeps failing and reports it', async () => {
    fake.supabase.rpc.mockResolvedValue({ data: null, error: { message: 'Internal Server Error' }, status: 500 })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    enqueue({ kind: 'rpc', fn: 'upsert_habit_logs', args: { logs: [] } })
    for (let i = 0; i < 20; i++) await flushOutbox()
    expect(hasPendingWrites()).toBe(false)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
    fake.supabase.rpc.mockReset()
  })
})
