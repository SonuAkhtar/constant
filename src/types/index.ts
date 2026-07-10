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

export interface Goal {
  id: string
  text: string
  setDate: string
  habitId?: string
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

export type SkinType =
  | 'oily'
  | 'dry'
  | 'sensitive'
  | 'combination'
  | 'mature'
  | 'hyperpigmentation'

export type RoutineWhen = 'morning' | 'night' | 'daytime'
export type EvidenceStrength = 'strongest' | 'strong' | 'moderate' | 'emerging' | 'insufficient'

export interface SkincareStep {
  id: string
  step: number
  name: string
  summary: string
  why: string
  evidence: string
  usage: string
  notFor?: SkinType[]
  timeSlot: TimeSlot
  when: RoutineWhen
}

export interface DaytimeHabit {
  id: string
  icon: string
  text: string
}

export interface Supplement {
  id: string
  name: string
  strength: EvidenceStrength
  benefit: string
  dose: string
  notes: string
  recommended: boolean
}

export interface SkinTypeGuide {
  type: SkinType
  label: string
  emoji: string
  prioritise: string[]
  avoid: string[]
}

export type ExperienceLevel = 'beginner' | 'intermediate'
export type WorkoutVolume = 6 | 8

export interface Exercise {
  id: string
  name: string
  muscles: string
  sets: number
  reps: string
  rest: string
  cue?: string
}

export interface WorkoutDay {
  day: number
  label: string
  focus: string
  summary: string
  exercises: Exercise[]
  extraExercises?: Exercise[]
  isRest?: boolean
}
