import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', async () => ({ supabase: (await import('../test/fakeSupabase')).fake.supabase }))

import { fake } from '../test/fakeSupabase'
import { useHabitStore, parseBackup } from './useHabitStore'
import { useAuthStore } from './useAuthStore'
import { clearOutbox, flushOutbox, hasPendingWrites } from '../lib/outbox'
import type { Habit, HabitLog } from '../types'

const S = () => useHabitStore.getState()
const habit = (id: string, over: Partial<Habit> = {}): Habit => ({ id, title: id, icon: 'water', timeSlot: 'morning', ...over })
const done = (habitId: string, date: string): HabitLog => ({ habitId, date, completed: true })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 4, 12))
  clearOutbox()
  fake.calls.length = 0
  fake.setOffline(false)
  fake.onSelect(() => [])
  useAuthStore.setState({ userId: 'u1' })
  useHabitStore.setState({ ownerId: 'u1', habits: [], logs: [], milestones: [] })
})

afterEach(() => vi.useRealTimers())

describe('progress', () => {
  it('adding a habit does not lower past days', () => {
    useHabitStore.setState({
      habits: [habit('a', { createdAt: '2026-09-01' })],
      logs: ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((d) => done('a', d)),
    })
    S().addHabit({ title: 'New', icon: 'water', timeSlot: 'morning' })
    const week = S().getWeeklyProgress().map((d) => d.percentage)
    expect(week.slice(0, 6)).toEqual([100, 100, 100, 100, 100, 100])
    expect(week[6]).toBe(50)
  })

  it('excludes skipped habits from the total, and completing clears the skip', () => {
    useHabitStore.setState({ habits: [habit('a'), habit('b')] })
    S().skipHabit('a')
    expect(S().getDayProgress()).toEqual({ total: 1, completed: 0, percentage: 0 })
    S().toggleHabit('a')
    expect(S().logs.find((l) => l.habitId === 'a')).toMatchObject({ completed: true, skipped: false })
    expect(S().getDayProgress()).toEqual({ total: 2, completed: 1, percentage: 50 })
  })

  it('keeps the app streak through yesterday until something is done today', () => {
    useHabitStore.setState({ habits: [habit('a')], logs: ['2026-10-01', '2026-10-02', '2026-10-03'].map((d) => done('a', d)) })
    expect(S().getAppStreak()).toBe(3)
  })

  it('never reports a best-week average above 100%', () => {
    const dates = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']
    useHabitStore.setState({
      habits: [habit('a'), habit('b', { isArchived: true })],
      logs: dates.flatMap((d) => [done('a', d), done('b', d)]),
    })
    expect(S().getPersonalBests().bestWeekAvg).toBeLessThanOrEqual(100)
  })

  it('removing a habit also removes its logs', () => {
    useHabitStore.setState({ habits: [habit('a')], logs: [done('a', '2026-10-04')] })
    S().removeHabit('a')
    expect(S().logs).toEqual([])
  })
})

describe('syncing', () => {
  it('keeps each habit\'s position when editing, pinning or archiving', async () => {
    useHabitStore.setState({ habits: [habit('x'), habit('y'), habit('z')] })
    S().editHabit('z', { title: 'zz' })
    S().togglePin('y')
    S().archiveHabit('x')
    await flushOutbox()
    const orders = fake.calls
      .filter((c) => c.table === 'habits' && c.op === 'upsert')
      .map((c) => `${(c.values as { id: string }).id}:${(c.values as { sort_order: number }).sort_order}`)
    expect(orders).toEqual(['z:2', 'y:1', 'x:0'])
  })

  it('only writes the new order when a drag ends', async () => {
    const hs = [habit('x'), habit('y')]
    useHabitStore.setState({ habits: hs })
    S().reorderHabits('morning', [hs[1], hs[0]])
    await flushOutbox()
    expect(fake.calls).toHaveLength(0)
    S().saveOrder('morning')
    await flushOutbox()
    expect(fake.calls).toHaveLength(2)
  })

  it('sends check-ins through upsert_habit_logs with the time of the change', async () => {
    useHabitStore.setState({ habits: [habit('a')] })
    S().toggleHabit('a')
    await flushOutbox()
    const rpc = fake.calls.find((c) => c.fn === 'upsert_habit_logs')
    const row = (rpc?.values as { logs: Record<string, unknown>[] }).logs[0]
    expect(row).toMatchObject({ habit_id: 'a', date: '2026-10-04', completed: true, skipped: false })
    expect(row.updated_at).toBe(new Date(2026, 9, 4, 12).toISOString())
  })

  it('keeps the cached data when loading fails offline, and replays queued writes later', async () => {
    useHabitStore.setState({ habits: [habit('a')], logs: [] })
    fake.setOffline(true)
    S().toggleHabit('a')
    await flushOutbox()
    expect(hasPendingWrites()).toBe(true)
    await S().loadFromDb('u1')
    expect(S().habits).toHaveLength(1)
    expect(S().logs).toHaveLength(1)

    fake.setOffline(false)
    await S().loadFromDb('u1')
    expect(hasPendingWrites()).toBe(false)
    expect(fake.calls.some((c) => c.fn === 'upsert_habit_logs')).toBe(true)
  })

  it('clears another account\'s cached data before loading', async () => {
    useHabitStore.setState({ ownerId: 'someone-else', habits: [habit('theirs')], logs: [done('theirs', '2026-10-04')] })
    fake.setOffline(true)
    await S().loadFromDb('u1')
    expect(S().habits).toEqual([])
  })
})

describe('backup import', () => {
  it('rejects files that are not backups', () => {
    expect(parseBackup('not json')).toBeNull()
    expect(parseBackup('{"habits": 1}')).toBeNull()
  })

  it('drops invalid rows', () => {
    const b = parseBackup(JSON.stringify({
      habits: [habit('11111111-1111-4111-8111-111111111111'), { id: 'bad', title: '', timeSlot: 'lunch' }],
      logs: [done('11111111-1111-4111-8111-111111111111', '2026-10-01'), done('unknown', '2026-10-01'), { habitId: '11111111-1111-4111-8111-111111111111', date: 'yesterday', completed: true }],
    }))
    expect(b?.habits).toHaveLength(1)
    expect(b?.logs).toHaveLength(1)
  })

  it('gives habits from another account new ids and deletes habits missing from the backup', async () => {
    const mine = '11111111-1111-4111-8111-111111111111'
    const theirs = '22222222-2222-4222-8222-222222222222'
    useHabitStore.setState({ habits: [habit(mine)] })
    const backup = parseBackup(JSON.stringify({ habits: [habit(theirs)], logs: [done(theirs, '2026-10-01')] }))!
    S().importData(backup)
    await flushOutbox()
    expect(S().habits[0].id).not.toBe(theirs)
    expect(S().logs[0].habitId).toBe(S().habits[0].id)
    expect(fake.calls.some((c) => c.op === 'delete' && c.filters.id === mine)).toBe(true)
  })
})
