export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night'
export type HabitFrequency = 'daily' | 'weekdays' | 'custom'
export type SkipReason = 'sick' | 'no-time' | 'rest'

export interface Habit {
  id: string
  title: string
  description?: string
  intention?: string
  timeSlot: TimeSlot
  icon: string
  isCustom?: boolean
  isPinned?: boolean
  isArchived?: boolean
  frequency?: HabitFrequency
  customDays?: number[]
  reminderTime?: string
}

export interface Milestone {
  type: string
  date: string
  message: string
}

export interface HabitLog {
  habitId: string
  date: string
  completed: boolean
  skipped?: boolean
  completedAt?: string
  skipReason?: SkipReason
}

export interface DailyProgress {
  date: string
  total: number
  completed: number
  percentage: number
}

export interface Streak {
  habitId: string
  current: number
  best: number
}

export interface PersonalBests {
  longestStreakEver: number
  mostCompletedInDay: number
  bestWeekAvg: number
}

export interface HabitDayStat {
  date: string
  completed: boolean
  skipped: boolean
}

export interface HabitStats {
  completionRate30: number
  completedDays: number
  skippedDays: number
  dailyData: HabitDayStat[]
  streak: Streak
}
