import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, subDays } from "date-fns";
import type {
  Habit,
  HabitLog,
  DailyProgress,
  Streak,
  SkipReason,
  PersonalBests,
  HabitStats,
  Milestone,
  TimeSlot,
} from "../types";
import {
  fetchHabits,
  fetchLogs,
  fetchMilestones,
  upsertHabit,
  deleteHabit,
  upsertLog,
  upsertLogs,
  upsertMilestones,
} from "../lib/db";
import { flushOutbox, hasPendingWrites } from "../lib/outbox";
import { useAuthStore } from "./useAuthStore";
import {
  buildActivity,
  computeStreak,
  habitsDueOn,
  isActiveOn,
  isScheduledOn,
  ymd,
} from "../utils/schedule";

const uid = () => useAuthStore.getState().userId;
const todayStr = () => format(new Date(), "yyyy-MM-dd");

const TIME_SLOTS: TimeSlot[] = ["morning", "afternoon", "evening", "night"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function lastNDates(n: number, anchor: Date = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => format(subDays(anchor, n - 1 - i), "yyyy-MM-dd"));
}

export function progressForDates(habits: Habit[], logs: HabitLog[], dates: string[]): DailyProgress[] {
  const activity = buildActivity(logs);
  const today = todayStr();
  const byDate = new Map<string, HabitLog[]>();
  for (const l of logs) {
    const arr = byDate.get(l.date);
    if (arr) arr.push(l);
    else byDate.set(l.date, [l]);
  }
  return dates.map((date) => {
    const due = habitsDueOn(habits, date, activity, today);
    const dueIds = new Set(due.map((h) => h.id));
    let completed = 0;
    let skipped = 0;
    for (const l of byDate.get(date) ?? []) {
      if (!dueIds.has(l.habitId)) continue;
      if (l.completed) completed++;
      else if (l.skipped) skipped++;
    }
    const total = due.length - skipped;
    return {
      date,
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

const STREAK_MILESTONES = [
  { type: "streak-7", threshold: 7, message: "7-day streak. You're building a real habit." },
  { type: "streak-14", threshold: 14, message: "14 days straight. This is becoming part of you." },
  { type: "streak-30", threshold: 30, message: "30 days. You're building a new identity." },
  { type: "streak-50", threshold: 50, message: "50-day streak. Remarkable consistency." },
  { type: "streak-100", threshold: 100, message: "100 days. You've changed your life." },
];

const TOTAL_MILESTONES = [
  { type: "total-10", threshold: 10, message: "10 habits completed. The streak starts here." },
  { type: "total-50", threshold: 50, message: "50 habits done. You're on a roll." },
  { type: "total-100", threshold: 100, message: "100 habits completed. That's who you are now." },
  { type: "total-250", threshold: 250, message: "250 completions. Extraordinary discipline." },
  { type: "total-500", threshold: 500, message: "500 habits. You've outpaced most people on Earth." },
];

function checkMilestones(
  logs: HabitLog[],
  habit: Habit,
  existing: Milestone[],
): Milestone | null {
  const unlocked = new Set(existing.map((m) => m.type));
  const date = todayStr();
  const streak = computeStreak(habit, logs);
  for (const m of STREAK_MILESTONES) {
    if (streak.current >= m.threshold && !unlocked.has(m.type)) {
      return { type: m.type, date, message: m.message };
    }
  }
  const totalCompletions = logs.filter((l) => l.completed).length;
  for (const m of TOTAL_MILESTONES) {
    if (totalCompletions >= m.threshold && !unlocked.has(m.type)) {
      return { type: m.type, date, message: m.message };
    }
  }
  return null;
}

type ImportResult =
  | { ok: true; habits: number; logs: number }
  | { ok: false; error: string };

export interface ParsedBackup {
  habits: Habit[];
  logs: HabitLog[];
  milestones: Milestone[];
}

export function parseBackup(json: string): ParsedBackup | null {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.habits) || !Array.isArray(d.logs)) return null;

  const habits: Habit[] = [];
  for (const raw of d.habits as Record<string, unknown>[]) {
    if (!raw || typeof raw.id !== "string" || typeof raw.title !== "string" || !raw.title.trim()) continue;
    if (!TIME_SLOTS.includes(raw.timeSlot as TimeSlot)) continue;
    const frequency = ["daily", "weekdays", "custom"].includes(raw.frequency as string)
      ? (raw.frequency as Habit["frequency"])
      : "daily";
    const customDays = Array.isArray(raw.customDays)
      ? (raw.customDays as unknown[]).filter((n): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 6)
      : [];
    habits.push({
      id: raw.id,
      title: raw.title.trim().slice(0, 60),
      icon: typeof raw.icon === "string" ? raw.icon : "water",
      timeSlot: raw.timeSlot as TimeSlot,
      description: typeof raw.description === "string" ? raw.description : undefined,
      intention: typeof raw.intention === "string" ? raw.intention : undefined,
      frequency,
      customDays,
      reminderTime: typeof raw.reminderTime === "string" ? raw.reminderTime : undefined,
      isArchived: raw.isArchived === true,
      isPinned: raw.isPinned === true,
      isCustom: raw.isCustom !== false,
      createdAt: typeof raw.createdAt === "string" && DATE_RE.test(raw.createdAt) ? raw.createdAt : undefined,
    });
  }

  const ids = new Set(habits.map((h) => h.id));
  const seen = new Set<string>();
  const logs: HabitLog[] = [];
  for (const raw of d.logs as Record<string, unknown>[]) {
    if (!raw || typeof raw.habitId !== "string" || !ids.has(raw.habitId)) continue;
    if (typeof raw.date !== "string" || !DATE_RE.test(raw.date)) continue;
    const key = `${raw.habitId}|${raw.date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const completed = raw.completed === true;
    logs.push({
      habitId: raw.habitId,
      date: raw.date,
      completed,
      skipped: !completed && raw.skipped === true,
      skipReason: !completed && ["sick", "no-time", "rest"].includes(raw.skipReason as string)
        ? (raw.skipReason as SkipReason)
        : undefined,
      completedAt: completed && typeof raw.completedAt === "string" ? raw.completedAt : undefined,
    });
  }

  const milestones: Milestone[] = Array.isArray(d.milestones)
    ? (d.milestones as Record<string, unknown>[]).filter(
        (m): m is Record<string, string> =>
          !!m && typeof m.type === "string" && typeof m.message === "string" &&
          typeof m.date === "string" && DATE_RE.test(m.date),
      ).map((m) => ({ type: m.type, message: m.message, date: m.date }))
    : [];

  return { habits, logs, milestones };
}

interface HabitState {
  ownerId: string | null;
  habits: Habit[];
  logs: HabitLog[];
  milestones: Milestone[];
  loadFromDb: (userId: string) => Promise<void>;
  getTodayHabits: () => Habit[];
  toggleHabit: (habitId: string, date?: string) => Milestone | null;
  skipHabit: (habitId: string, date?: string, reason?: SkipReason) => void;
  unskipHabit: (habitId: string, date?: string) => void;
  togglePin: (habitId: string) => void;
  archiveHabit: (id: string) => void;
  unarchiveHabit: (id: string) => void;
  getStreak: (habitId: string) => Streak;
  getAppStreak: () => number;
  getLastActiveDate: () => string | null;
  getDayProgress: (date?: string) => {
    total: number;
    completed: number;
    percentage: number;
  };
  getScheduledHabits: (date: string) => Habit[];
  getWeeklyProgress: () => DailyProgress[];
  getMonthlyProgress: () => DailyProgress[];
  getPersonalBests: () => PersonalBests;
  getHabitStats: (habitId: string) => HabitStats;
  addHabit: (habit: Omit<Habit, "id" | "isCustom" | "createdAt">) => Habit;
  editHabit: (
    id: string,
    updates: Partial<Omit<Habit, "id" | "isCustom">>,
  ) => void;
  removeHabit: (id: string) => void;
  reorderHabits: (slot: string, reordered: Habit[]) => void;
  saveOrder: (slot: string) => void;
  exportData: () => string;
  importData: (backup: ParsedBackup) => ImportResult;
  reset: () => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => {
      function save(habit: Habit) {
        const userId = uid();
        if (!userId) return;
        const idx = get().habits.findIndex((h) => h.id === habit.id);
        if (idx >= 0) upsertHabit(userId, habit, idx);
      }

      function writeLog(change: HabitLog) {
        const log = { ...change, updatedAt: new Date().toISOString() };
        const { logs } = get();
        const exists = logs.some((l) => l.habitId === log.habitId && l.date === log.date);
        set({
          logs: exists
            ? logs.map((l) => (l.habitId === log.habitId && l.date === log.date ? log : l))
            : [...logs, log],
        });
        const userId = uid();
        if (userId) upsertLog(log);
      }

      function findLog(habitId: string, date: string) {
        return get().logs.find((l) => l.habitId === habitId && l.date === date);
      }

      return {
        ownerId: null,
        habits: [],
        logs: [],
        milestones: [],

        loadFromDb: async (userId) => {
          if (get().ownerId && get().ownerId !== userId) {
            set({ ownerId: null, habits: [], logs: [], milestones: [] });
          }
          await flushOutbox();
          if (hasPendingWrites()) return;
          const [habitsRes, logs, milestones] = await Promise.all([
            fetchHabits(userId),
            fetchLogs(userId),
            fetchMilestones(userId),
          ]);
          if (!habitsRes || !logs || !milestones) return;
          set({ ownerId: userId, habits: habitsRes.habits, logs, milestones });
          if (habitsRes.needsReindex) {
            habitsRes.habits.forEach((h, i) => upsertHabit(userId, h, i));
          }
        },

        getTodayHabits: () => {
          const { habits } = get();
          const dow = new Date().getDay();
          return habits.filter((h) => !h.isArchived && isScheduledOn(h, dow));
        },

        toggleHabit: (habitId, date) => {
          const day = date ?? todayStr();
          const existing = findLog(habitId, day);
          const completing = !existing?.completed;
          writeLog({
            habitId,
            date: day,
            completed: completing,
            skipped: false,
            skipReason: undefined,
            completedAt: completing ? new Date().toISOString() : undefined,
          });

          if (!completing) return null;
          const habit = get().habits.find((h) => h.id === habitId);
          if (!habit) return null;
          const milestone = checkMilestones(get().logs, habit, get().milestones);
          if (milestone) {
            set({ milestones: [...get().milestones, milestone] });
            const userId = uid();
            if (userId) upsertMilestones(userId, [milestone]);
          }
          return milestone;
        },

        skipHabit: (habitId, date, reason) => {
          writeLog({
            habitId,
            date: date ?? todayStr(),
            completed: false,
            skipped: true,
            skipReason: reason,
            completedAt: undefined,
          });
        },

        unskipHabit: (habitId, date) => {
          const day = date ?? todayStr();
          const existing = findLog(habitId, day);
          if (!existing?.skipped) return;
          writeLog({ ...existing, skipped: false, skipReason: undefined });
        },

        togglePin: (habitId) => {
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, isPinned: !h.isPinned } : h,
            ),
          }));
          const habit = get().habits.find((h) => h.id === habitId);
          if (habit) save(habit);
        },

        archiveHabit: (id) => {
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === id ? { ...h, isArchived: true, isPinned: false } : h,
            ),
          }));
          const habit = get().habits.find((h) => h.id === id);
          if (habit) save(habit);
        },

        unarchiveHabit: (id) => {
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === id ? { ...h, isArchived: false } : h,
            ),
          }));
          const habit = get().habits.find((h) => h.id === id);
          if (habit) save(habit);
        },

        getScheduledHabits: (date) => {
          const { habits, logs } = get();
          return habitsDueOn(habits, date, buildActivity(logs), todayStr());
        },

        getStreak: (habitId) => {
          const habit = get().habits.find((h) => h.id === habitId);
          if (!habit) return { habitId, current: 0, best: 0 };
          return computeStreak(habit, get().logs);
        },

        getAppStreak: () => {
          const completedDates = new Set(
            get().logs.filter((l) => l.completed).map((l) => l.date),
          );
          const d = new Date();
          if (!completedDates.has(ymd(d))) d.setDate(d.getDate() - 1);
          let streak = 0;
          while (completedDates.has(ymd(d))) {
            streak++;
            d.setDate(d.getDate() - 1);
          }
          return streak;
        },

        getLastActiveDate: () => {
          let last: string | null = null;
          for (const l of get().logs) {
            if (l.completed && (!last || l.date > last)) last = l.date;
          }
          return last;
        },

        getDayProgress: (date) => {
          const { habits, logs } = get();
          const [p] = progressForDates(habits, logs, [date ?? todayStr()]);
          return { total: p.total, completed: p.completed, percentage: p.percentage };
        },

        getWeeklyProgress: () => {
          const { habits, logs } = get();
          return progressForDates(habits, logs, lastNDates(7));
        },

        getMonthlyProgress: () => {
          const { habits, logs } = get();
          return progressForDates(habits, logs, lastNDates(30));
        },

        getPersonalBests: (): PersonalBests => {
          const { habits, logs } = get();

          let longestStreakEver = 0;
          for (const h of habits) {
            const s = computeStreak(h, logs);
            if (s.best > longestStreakEver) longestStreakEver = s.best;
          }

          const ids = new Set(habits.map((h) => h.id));
          const dailyCounts: Record<string, number> = {};
          for (const log of logs) {
            if (log.completed && ids.has(log.habitId)) {
              dailyCounts[log.date] = (dailyCounts[log.date] ?? 0) + 1;
            }
          }
          const vals = Object.values(dailyCounts);
          const mostCompletedInDay = vals.length > 0 ? Math.max(...vals) : 0;

          const last30 = progressForDates(habits, logs, lastNDates(30));
          let bestWeekAvg = 0;
          for (let i = 0; i <= last30.length - 7; i++) {
            const week = last30.slice(i, i + 7).filter((d) => d.total > 0);
            if (week.length === 0) continue;
            const avg = Math.round(week.reduce((s, d) => s + d.percentage, 0) / week.length);
            if (avg > bestWeekAvg) bestWeekAvg = avg;
          }

          return { longestStreakEver, mostCompletedInDay, bestWeekAvg };
        },

        getHabitStats: (habitId): HabitStats => {
          const { habits, logs } = get();
          const habit = habits.find((h) => h.id === habitId);
          const activity = buildActivity(logs);
          const today = todayStr();
          const dailyData = lastNDates(30).map((date) => {
            const log = logs.find((l) => l.habitId === habitId && l.date === date);
            const scheduled = !!habit &&
              isScheduledOn(habit, new Date(`${date}T00:00:00`).getDay()) &&
              isActiveOn({ ...habit, isArchived: false }, date, activity, today);
            return {
              date,
              completed: log?.completed ?? false,
              skipped: !log?.completed && (log?.skipped ?? false),
              scheduled,
            };
          });
          const due = dailyData.filter((d) => d.scheduled);
          const completedDays = due.filter((d) => d.completed).length;
          const skippedDays = due.filter((d) => d.skipped).length;
          const countable = due.length - skippedDays;
          return {
            completionRate30: countable > 0 ? Math.round((completedDays / countable) * 100) : 0,
            completedDays,
            skippedDays,
            dailyData,
            streak: habit ? computeStreak(habit, logs) : { habitId, current: 0, best: 0 },
          };
        },

        addHabit: (habit) => {
          const newHabit: Habit = {
            ...habit,
            id: crypto.randomUUID(),
            isCustom: true,
            createdAt: todayStr(),
          };
          set({ habits: [...get().habits, newHabit] });
          save(newHabit);
          return newHabit;
        },

        editHabit: (id, updates) => {
          set({
            habits: get().habits.map((h) =>
              h.id === id ? { ...h, ...updates } : h,
            ),
          });
          const habit = get().habits.find((h) => h.id === id);
          if (habit) save(habit);
        },

        removeHabit: (id) => {
          set({
            habits: get().habits.filter((h) => h.id !== id),
            logs: get().logs.filter((l) => l.habitId !== id),
          });
          if (uid()) deleteHabit(id);
        },

        reorderHabits: (slot, reordered) => {
          set((state) => {
            const result = [...state.habits];
            let ri = 0;
            for (let i = 0; i < result.length && ri < reordered.length; i++) {
              if (result[i].timeSlot === slot && !result[i].isArchived)
                result[i] = reordered[ri++];
            }
            return { habits: result };
          });
        },

        saveOrder: (slot) => {
          get().habits.filter((h) => h.timeSlot === slot).forEach(save);
        },

        exportData: () => {
          const { habits, logs, milestones } = get();
          return JSON.stringify(
            { habits, logs, milestones, exportedAt: new Date().toISOString() },
            null,
            2,
          );
        },

        importData: (backup) => {
          const current = get();
          const currentIds = new Set(current.habits.map((h) => h.id));
          const idMap = new Map<string, string>();
          const habits = backup.habits.map((h) => {
            const id = currentIds.has(h.id) && UUID_RE.test(h.id) ? h.id : crypto.randomUUID();
            idMap.set(h.id, id);
            return { ...h, id };
          });
          const importedLogs = backup.logs.map((l) => ({ ...l, habitId: idMap.get(l.habitId)! }));
          const importedKeys = new Set(importedLogs.map((l) => `${l.habitId}|${l.date}`));
          const keptIds = new Set(habits.map((h) => h.id));
          const logs = [
            ...current.logs.filter(
              (l) => keptIds.has(l.habitId) && !importedKeys.has(`${l.habitId}|${l.date}`),
            ),
            ...importedLogs,
          ];
          const milestoneTypes = new Set(backup.milestones.map((m) => m.type));
          const milestones = [
            ...current.milestones.filter((m) => !milestoneTypes.has(m.type)),
            ...backup.milestones,
          ];

          set({ habits, logs, milestones });
          const userId = uid();
          if (userId) {
            current.habits.filter((h) => !keptIds.has(h.id)).forEach((h) => deleteHabit(h.id));
            habits.forEach((h, i) => upsertHabit(userId, h, i));
            const stamp = new Date().toISOString();
            upsertLogs(importedLogs.map((l) => ({ ...l, updatedAt: stamp })));
            upsertMilestones(userId, backup.milestones);
          }
          return { ok: true, habits: habits.length, logs: importedLogs.length };
        },

        reset: () => set({ ownerId: null, habits: [], logs: [], milestones: [] }),
      };
    },
    { name: "progress-habits", version: 1, migrate: (s) => s as HabitState },
  ),
);
