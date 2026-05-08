import { supabase } from './supabase'
import type { Habit, HabitLog, Milestone } from '../types'

export async function findOrCreateUser(phone: string): Promise<{ userId: string; error: string | null }> {
  const { data: existing, error: findErr } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (findErr) return { userId: '', error: findErr.message }
  if (existing) return { userId: existing.id, error: null }

  const { data: created, error: createErr } = await supabase
    .from('users')
    .insert({ phone })
    .select('id')
    .single()

  if (createErr) return { userId: '', error: createErr.message }
  return { userId: created.id, error: null }
}

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')
  return (data ?? []).map(rowToHabit)
}

export async function upsertHabit(userId: string, habit: Habit, sortOrder = 0): Promise<void> {
  await supabase.from('habits').upsert({
    id:            habit.id,
    user_id:       userId,
    title:         habit.title,
    icon:          habit.icon,
    time_slot:     habit.timeSlot,
    description:   habit.description ?? null,
    intention:     habit.intention   ?? null,
    frequency:     habit.frequency   ?? 'daily',
    custom_days:   habit.customDays  ?? [],
    reminder_time: habit.reminderTime ?? null,
    is_archived:   habit.isArchived  ?? false,
    is_pinned:     habit.isPinned    ?? false,
    is_custom:     habit.isCustom    ?? true,
    sort_order:    sortOrder,
  })
}

export async function deleteHabit(habitId: string): Promise<void> {
  await supabase.from('habits').delete().eq('id', habitId)
}

export async function fetchLogs(userId: string): Promise<HabitLog[]> {
  const { data } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
  return (data ?? []).map(rowToLog)
}

export async function upsertLog(userId: string, log: HabitLog): Promise<void> {
  await supabase.from('habit_logs').upsert({
    user_id:      userId,
    habit_id:     log.habitId,
    date:         log.date,
    completed:    log.completed,
    skipped:      log.skipped      ?? false,
    skip_reason:  log.skipReason   ?? null,
    completed_at: log.completedAt  ?? null,
  })
}

export async function fetchMilestones(userId: string): Promise<Milestone[]> {
  const { data } = await supabase
    .from('milestones')
    .select('*')
    .eq('user_id', userId)
  return (data ?? []).map(rowToMilestone)
}

export async function upsertMilestone(userId: string, milestone: Milestone): Promise<void> {
  await supabase.from('milestones').upsert({
    user_id: userId,
    type:    milestone.type,
    message: milestone.message,
    date:    milestone.date,
  }, { onConflict: 'user_id,type' })
}

export async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function upsertProfile(userId: string, profile: {
  userName: string
  focuses: string[]
  goal: string
  goalSetDate: string
  completed: boolean
}): Promise<void> {
  await supabase.from('profiles').upsert({
    user_id:              userId,
    user_name:            profile.userName,
    focuses:              profile.focuses,
    goal:                 profile.goal,
    goal_set_date:        profile.goalSetDate,
    onboarding_completed: profile.completed,
    updated_at:           new Date().toISOString(),
  })
}

function rowToHabit(row: Record<string, unknown>): Habit {
  return {
    id:           row.id           as string,
    title:        row.title        as string,
    icon:         row.icon         as string,
    timeSlot:     row.time_slot    as Habit['timeSlot'],
    description:  (row.description as string | null) ?? undefined,
    intention:    (row.intention   as string | null) ?? undefined,
    frequency:    (row.frequency   as Habit['frequency']) ?? 'daily',
    customDays:   (row.custom_days as number[] | null) ?? [],
    reminderTime: (row.reminder_time as string | null) ?? undefined,
    isArchived:   (row.is_archived as boolean) ?? false,
    isPinned:     (row.is_pinned   as boolean) ?? false,
    isCustom:     (row.is_custom   as boolean) ?? true,
  }
}

function rowToLog(row: Record<string, unknown>): HabitLog {
  return {
    habitId:     row.habit_id     as string,
    date:        row.date         as string,
    completed:   row.completed    as boolean,
    skipped:     (row.skipped     as boolean | null) ?? false,
    skipReason:  (row.skip_reason as HabitLog['skipReason'] | null) ?? undefined,
    completedAt: (row.completed_at as string | null) ?? undefined,
  }
}

function rowToMilestone(row: Record<string, unknown>): Milestone {
  return {
    type:    row.type    as string,
    date:    row.date    as string,
    message: row.message as string,
  }
}
