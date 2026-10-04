import type { Habit, HabitLog } from '../types'
import { buildActivity, dowOf, isActiveOn, isScheduledOn, ymd } from './schedule'

export type DayStatus = 'done' | 'skip' | 'miss' | 'off'

export interface HabitPeriodStat {
  habit: Habit
  rate: number
  completed: number
  skipped: number
  scheduled: number
  dayStats: { date: string; status: DayStatus }[]
}

export function computeHabitStats(
  habits: Habit[],
  logs: HabitLog[],
  dates: string[],
): HabitPeriodStat[] {
  const activity = buildActivity(logs)
  const today = ymd(new Date())
  const byKey = new Map<string, HabitLog>()
  for (const l of logs) byKey.set(`${l.habitId}|${l.date}`, l)

  return habits
    .filter((h) => !h.isArchived)
    .map((habit) => {
      const dayStats = dates.map((date) => {
        if (!isScheduledOn(habit, dowOf(date)) || !isActiveOn(habit, date, activity, today)) {
          return { date, status: 'off' as DayStatus }
        }
        const log = byKey.get(`${habit.id}|${date}`)
        if (log?.completed) return { date, status: 'done' as DayStatus }
        if (log?.skipped) return { date, status: 'skip' as DayStatus }
        return { date, status: 'miss' as DayStatus }
      })
      const scheduled = dayStats.filter((d) => d.status !== 'off').length
      const completed = dayStats.filter((d) => d.status === 'done').length
      const skipped = dayStats.filter((d) => d.status === 'skip').length
      const countable = scheduled - skipped
      const rate = countable > 0 ? Math.round((completed / countable) * 100) : 0
      return { habit, rate, completed, skipped, scheduled, dayStats }
    })
    .sort((a, b) => b.rate - a.rate)
}
