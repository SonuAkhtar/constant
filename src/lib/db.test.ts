import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', async () => ({ supabase: (await import('../test/fakeSupabase')).fake.supabase }))

import { fake } from '../test/fakeSupabase'
import { fetchLogs } from './db'

const row = (i: number) => ({ habit_id: `h${i}`, date: '2026-10-01', completed: true })

beforeEach(() => {
  fake.calls.length = 0
  fake.setOffline(false)
})

describe('fetchLogs', () => {
  it('pages past the 1,000-row API limit', async () => {
    fake.onSelect((call) => {
      const [from] = call.range!
      const count = from === 0 ? 1000 : from === 1000 ? 1000 : 250
      return Array.from({ length: count }, (_, i) => row(from + i))
    })
    const logs = await fetchLogs('u1')
    expect(logs).toHaveLength(2250)
    expect(fake.calls.map((c) => c.range)).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
  })

  it('returns null (keep the cache) when a page fails', async () => {
    fake.setOffline(true)
    expect(await fetchLogs('u1')).toBeNull()
  })
})
