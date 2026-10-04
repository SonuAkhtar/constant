import { supabase } from './supabase'
import { enqueue } from './outbox'
import type { Goal, Habit, HabitLog, Milestone } from '../types'
import { format, subDays } from 'date-fns'
import { DEFAULT_HABITS } from '../data/defaultHabits'

export async function usernameExists(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('username_exists', { uname: username })
  if (error) {
    console.error('[db] usernameExists:', error.message)
    return false
  }
  return data === true
}

function sanitizeUsername(raw: string): string {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
  return cleaned.length >= 3 ? cleaned : `${cleaned}user`.slice(0, 20)
}

export async function ensureProfile(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData.session?.user
  if (!user) return

  const { data: existing, error } = await supabase
    .from('profiles')
    .select('user_id, email')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return
  if (existing) {
    if (user.email && existing.email !== user.email) {
      await supabase.from('profiles').update({ email: user.email }).eq('user_id', user.id)
    }
    return
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const name = typeof meta.name === 'string' ? meta.name : ''
  const base = sanitizeUsername(
    typeof meta.username === 'string' && meta.username
      ? meta.username
      : (user.email ?? 'user').split('@')[0],
  )

  for (let attempt = 0; attempt < 4; attempt++) {
    const username =
      attempt === 0 ? base : `${base.slice(0, 15)}${Math.floor(1000 + Math.random() * 9000)}`
    const { error: insertErr } = await supabase.from('profiles').insert({
      user_id:              user.id,
      user_name:            name,
      username,
      email:                user.email ?? null,
      focuses:              [],
      goal:                 '',
      goal_set_date:        '',
      onboarding_completed: true,
      updated_at:           new Date().toISOString(),
    })
    if (!insertErr) {
      await seedDefaultHabits(user.id)
      return
    }
    if (insertErr.code !== '23505') {
      console.error('[db] ensureProfile:', insertErr.message)
      return
    }
  }
}

async function seedDefaultHabits(userId: string): Promise<void> {
  const rows = DEFAULT_HABITS.map((h, i) => ({
    id:          crypto.randomUUID(),
    user_id:     userId,
    title:       h.title,
    icon:        h.icon,
    time_slot:   h.timeSlot,
    frequency:   'daily',
    custom_days: [] as number[],
    is_archived: false,
    is_pinned:   false,
    is_custom:   false,
    sort_order:  i,
  }))
  const { error } = await supabase.from('habits').insert(rows)
  if (error) console.error('[db] seedDefaultHabits:', error.message)
}

export async function fetchHabits(
  userId: string,
): Promise<{ habits: Habit[]; needsReindex: boolean } | null> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')
    .order('created_at')
  if (error) {
    console.error('[db] fetchHabits:', error.message)
    return null
  }
  const rows = data ?? []
  const needsReindex = rows.some((r, i) => r.sort_order !== i)
  return { habits: rows.map(rowToHabit), needsReindex }
}

export function upsertHabit(userId: string, habit: Habit, sortOrder: number): void {
  enqueue({
    kind: 'upsert',
    table: 'habits',
    values: {
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
      ...(habit.createdAt
        ? { created_at: new Date(`${habit.createdAt}T00:00:00`).toISOString() }
        : {}),
    },
  })
}

export function deleteHabit(habitId: string): void {
  enqueue({ kind: 'delete', table: 'habits', match: { id: habitId } })
}

const LOG_PAGE = 1000

export async function fetchLogs(userId: string): Promise<HabitLog[] | null> {
  const since = format(subDays(new Date(), 365), 'yyyy-MM-dd')
  const rows: Record<string, unknown>[] = []
  for (let from = 0; ; from += LOG_PAGE) {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', since)
      .order('date')
      .order('habit_id')
      .range(from, from + LOG_PAGE - 1)
    if (error) {
      console.error('[db] fetchLogs:', error.message)
      return null
    }
    rows.push(...(data ?? []))
    if (!data || data.length < LOG_PAGE) break
  }
  return rows.map(rowToLog)
}

function logRow(log: HabitLog) {
  return {
    habit_id:     log.habitId,
    date:         log.date,
    completed:    log.completed,
    skipped:      log.skipped      ?? false,
    skip_reason:  log.skipReason   ?? null,
    completed_at: log.completedAt  ?? null,
    updated_at:   log.updatedAt    ?? new Date().toISOString(),
  }
}

export function upsertLog(log: HabitLog): void {
  upsertLogs([log])
}

export function upsertLogs(logs: HabitLog[]): void {
  for (let i = 0; i < logs.length; i += 500) {
    enqueue({ kind: 'rpc', fn: 'upsert_habit_logs', args: { logs: logs.slice(i, i + 500).map(logRow) } })
  }
}

export async function fetchMilestones(userId: string): Promise<Milestone[] | null> {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('user_id', userId)
  if (error) {
    console.error('[db] fetchMilestones:', error.message)
    return null
  }
  return (data ?? []).map(rowToMilestone)
}

export function upsertMilestones(userId: string, milestones: Milestone[]): void {
  if (milestones.length === 0) return
  enqueue({
    kind: 'upsert',
    table: 'milestones',
    values: milestones.map((m) => ({ user_id: userId, type: m.type, message: m.message, date: m.date })),
    onConflict: 'user_id,type',
  })
}

export async function fetchProfile(
  userId: string,
): Promise<{ profile: Record<string, unknown> | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[db] fetchProfile:', error.message)
    return null
  }
  return { profile: data }
}

export function updateProfile(userId: string, profile: { userName: string; focuses: string[] }): void {
  enqueue({
    kind: 'update',
    table: 'profiles',
    values: {
      user_name:  profile.userName,
      focuses:    profile.focuses,
      updated_at: new Date().toISOString(),
    },
    match: { user_id: userId },
  })
}

export async function fetchGoals(userId: string): Promise<Goal[] | null> {
  const { data, error } = await supabase
    .from('goals')
    .select('id, text, set_date, habit_id')
    .eq('user_id', userId)
    .order('created_at')
  if (error) {
    console.error('[db] fetchGoals:', error.message)
    return null
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    text: r.text as string,
    setDate: r.set_date as string,
    habitId: (r.habit_id as string | null) ?? undefined,
  }))
}

export function upsertGoal(userId: string, goal: Goal): void {
  enqueue({
    kind: 'upsert',
    table: 'goals',
    values: {
      id: goal.id,
      user_id: userId,
      text: goal.text,
      set_date: goal.setDate,
      habit_id: goal.habitId ?? null,
    },
  })
}

export function deleteGoal(goalId: string): void {
  enqueue({ kind: 'delete', table: 'goals', match: { id: goalId } })
}

export async function fetchSettings(userId: string): Promise<Record<string, unknown> | null | undefined> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[db] fetchSettings:', error.message)
    return undefined
  }
  return (data?.settings as Record<string, unknown> | undefined) ?? null
}

export function saveSettings(userId: string, settings: Record<string, unknown>): void {
  enqueue({
    kind: 'upsert',
    table: 'user_settings',
    values: { user_id: userId, settings, updated_at: new Date().toISOString() },
  })
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
  return { error: error ? 'Could not delete your account. Check your connection and try again.' : null }
}

function rowToHabit(row: Record<string, unknown>): Habit {
  const created = row.created_at as string | null
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
    createdAt:    created ? format(new Date(created), 'yyyy-MM-dd') : undefined,
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
    updatedAt:   (row.updated_at as string | null) ?? undefined,
  }
}

function rowToMilestone(row: Record<string, unknown>): Milestone {
  return {
    type:    row.type    as string,
    date:    row.date    as string,
    message: row.message as string,
  }
}
