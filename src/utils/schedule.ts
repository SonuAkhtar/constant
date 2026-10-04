import type { Habit, HabitFrequency, HabitLog, Streak } from '../types'

export function isScheduledOn(habit: Habit, dayOfWeek: number): boolean {
  const freq: HabitFrequency = habit.frequency ?? 'daily'
  if (freq === 'daily') return true
  if (freq === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5
  if (freq === 'custom') return (habit.customDays ?? []).includes(dayOfWeek)
  return true
}

const pad = (n: number) => String(n).padStart(2, '0')

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseYmd(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

export function dowOf(date: string): number {
  return parseYmd(date).getDay()
}

function isKept(log: HabitLog | undefined): boolean {
  return !!log && (log.completed || !!log.skipped)
}

type HabitActivity = Map<string, { first: string; last: string }>

export function buildActivity(logs: HabitLog[]): HabitActivity {
  const map: HabitActivity = new Map()
  for (const l of logs) {
    if (!isKept(l)) continue
    const a = map.get(l.habitId)
    if (!a) map.set(l.habitId, { first: l.date, last: l.date })
    else {
      if (l.date < a.first) a.first = l.date
      if (l.date > a.last) a.last = l.date
    }
  }
  return map
}

export function isActiveOn(habit: Habit, date: string, activity: HabitActivity, today: string): boolean {
  const a = activity.get(habit.id)
  let start = habit.createdAt
  if (start && a && a.first < start) start = a.first
  if (start && date < start) return false
  if (habit.isArchived) return !!a && date <= a.last && date < today
  return true
}

export function habitsDueOn(habits: Habit[], date: string, activity: HabitActivity, today: string): Habit[] {
  const dow = dowOf(date)
  return habits.filter((h) => isScheduledOn(h, dow) && isActiveOn(h, date, activity, today))
}

export function computeStreak(habit: Habit, logs: HabitLog[], today: Date = new Date()): Streak {
  const kept = new Set<string>()
  for (const l of logs) if (l.habitId === habit.id && isKept(l)) kept.add(l.date)
  if (kept.size === 0) return { habitId: habit.id, current: 0, best: 0 }

  let earliest = ''
  for (const d of kept) if (!earliest || d < earliest) earliest = d
  const todayStr = ymd(today)

  let run = 0
  let best = 0
  const d = parseYmd(earliest)
  for (let key = ymd(d); key < todayStr; d.setDate(d.getDate() + 1), key = ymd(d)) {
    if (!isScheduledOn(habit, d.getDay())) continue
    if (kept.has(key)) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  if (kept.has(todayStr) && isScheduledOn(habit, today.getDay())) {
    run++
    if (run > best) best = run
  }
  return { habitId: habit.id, current: run, best }
}
