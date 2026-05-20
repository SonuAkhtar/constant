import type { Habit, HabitFrequency } from '../types'

export function isScheduledOn(habit: Habit, dayOfWeek: number): boolean {
  const freq: HabitFrequency = habit.frequency ?? 'daily'
  if (freq === 'daily') return true
  if (freq === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5
  if (freq === 'custom') return (habit.customDays ?? []).includes(dayOfWeek)
  return true
}
