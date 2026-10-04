import { describe, expect, it } from 'vitest'
import { buildActivity, computeStreak, isActiveOn, isScheduledOn } from './schedule'
import type { Habit, HabitLog } from '../types'

const habit = (over: Partial<Habit> = {}): Habit => ({ id: 'h', title: 'H', icon: 'water', timeSlot: 'morning', ...over })
const done = (date: string, habitId = 'h'): HabitLog => ({ habitId, date, completed: true })
const SUNDAY = new Date(2026, 9, 4, 12)

describe('isScheduledOn', () => {
  it('handles daily, weekdays and custom days', () => {
    expect(isScheduledOn(habit(), 0)).toBe(true)
    expect(isScheduledOn(habit({ frequency: 'weekdays' }), 6)).toBe(false)
    expect(isScheduledOn(habit({ frequency: 'weekdays' }), 1)).toBe(true)
    expect(isScheduledOn(habit({ frequency: 'custom', customDays: [2, 4] }), 4)).toBe(true)
    expect(isScheduledOn(habit({ frequency: 'custom', customDays: [2, 4] }), 3)).toBe(false)
  })
})

describe('computeStreak', () => {
  it('does not break a weekday habit over the weekend', () => {
    const logs = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].map((d) => done(d))
    expect(computeStreak(habit({ frequency: 'weekdays' }), logs, SUNDAY)).toEqual({ habitId: 'h', current: 5, best: 5 })
  })

  it('keeps yesterday\'s streak while today is still open', () => {
    const logs = ['2026-10-01', '2026-10-02', '2026-10-03'].map((d) => done(d))
    expect(computeStreak(habit(), logs, SUNDAY).current).toBe(3)
  })

  it('counts today once done', () => {
    const logs = ['2026-10-03', '2026-10-04'].map((d) => done(d))
    expect(computeStreak(habit(), logs, SUNDAY).current).toBe(2)
  })

  it('resets after a missed scheduled day', () => {
    const logs = ['2026-09-30', '2026-10-01', '2026-10-03'].map((d) => done(d))
    expect(computeStreak(habit(), logs, SUNDAY)).toEqual({ habitId: 'h', current: 1, best: 2 })
  })

  it('treats a skip as keeping the streak, so best is never below current', () => {
    const logs: HabitLog[] = [
      done('2026-10-01'),
      { habitId: 'h', date: '2026-10-02', completed: false, skipped: true },
      done('2026-10-03'),
    ]
    const s = computeStreak(habit(), logs, SUNDAY)
    expect(s.current).toBe(3)
    expect(s.best).toBeGreaterThanOrEqual(s.current)
  })
})

describe('isActiveOn', () => {
  it('ignores days before a habit existed', () => {
    const h = habit({ createdAt: '2026-10-02' })
    const act = buildActivity([])
    expect(isActiveOn(h, '2026-10-01', act, '2026-10-04')).toBe(false)
    expect(isActiveOn(h, '2026-10-02', act, '2026-10-04')).toBe(true)
  })

  it('counts an archived habit only up to its last check-in, never today', () => {
    const h = habit({ isArchived: true })
    const act = buildActivity([done('2026-10-02')])
    expect(isActiveOn(h, '2026-10-02', act, '2026-10-04')).toBe(true)
    expect(isActiveOn(h, '2026-10-03', act, '2026-10-04')).toBe(false)
  })
})
