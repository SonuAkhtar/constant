import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, subDays } from "date-fns";
import type {
  Habit,
  HabitLog,
  DailyProgress,
  Streak,
  HabitFrequency,
  SkipReason,
  PersonalBests,
  HabitStats,
  Milestone,
} from "../types";
import {
  fetchHabits,
  fetchLogs,
  fetchMilestones,
  upsertHabit,
  deleteHabit,
  upsertLog,
  upsertMilestone,
} from "../lib/db";
import { useAuthStore } from "./useAuthStore";

const uid = () => useAuthStore.getState().userId;

function isScheduledOn(habit: Habit, dayOfWeek: number): boolean {
  const freq: HabitFrequency = habit.frequency ?? "daily";
  if (freq === "daily") return true;
  if (freq === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (freq === "custom") return (habit.customDays ?? []).includes(dayOfWeek);
  return true;
}

function computeStreak(logs: HabitLog[], habitId: string): Streak {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const todayLog = logs.find(
    (l) => l.habitId === habitId && l.date === todayStr,
  );
  const todayPresent = (todayLog?.completed || todayLog?.skipped) ?? false;

  let current = 0;
  let d = todayPresent ? today : subDays(today, 1);
  while (true) {
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs.find((l) => l.habitId === habitId && l.date === dateStr);
    const present = (log?.completed || log?.skipped) ?? false;
    if (!present) break;
    current++;
    d = subDays(d, 1);
  }

  let best = 0;
  let run = 0;
  const sorted = [...logs]
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date)
    .sort();

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      run = diff === 1 ? run + 1 : 1;
    }
    if (run > best) best = run;
  }

  return { habitId, current, best };
}

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  milestones: Milestone[];
  loadFromDb: (userId: string) => Promise<void>;
  getTodayHabits: () => Habit[];
  toggleHabit: (habitId: string, date?: string) => Milestone | null;
  isCompleted: (habitId: string, date?: string) => boolean;
  skipHabit: (habitId: string, date?: string, reason?: SkipReason) => void;
  isSkipped: (habitId: string, date?: string) => boolean;
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
  addHabit: (habit: Omit<Habit, "id" | "isCustom">) => void;
  editHabit: (
    id: string,
    updates: Partial<Omit<Habit, "id" | "isCustom">>,
  ) => void;
  removeHabit: (id: string) => void;
  reorderHabits: (slot: string, reordered: Habit[]) => void;
  addMilestone: (milestone: Milestone) => void;
  exportData: () => string;
  importData: (json: string) => void;
  reset: () => void;
}

function checkMilestones(
  logs: HabitLog[],
  _habits: Habit[],
  habitId: string,
  existing: Milestone[],
): Milestone | null {
  const streak = computeStreak(logs, habitId);
  const today = format(new Date(), "yyyy-MM-dd");

  const milestoneTypes: Array<{
    type: string;
    threshold: number;
    message: string;
  }> = [
    {
      type: "streak-7",
      threshold: 7,
      message: "7-day streak. You're building a real habit.",
    },
    {
      type: "streak-14",
      threshold: 14,
      message: "14 days straight. This is becoming part of you.",
    },
    {
      type: "streak-30",
      threshold: 30,
      message: "30 days. You're building a new identity.",
    },
    {
      type: "streak-50",
      threshold: 50,
      message: "50-day streak. Remarkable consistency.",
    },
    {
      type: "streak-100",
      threshold: 100,
      message: "100 days. You've changed your life.",
    },
  ];

  for (const { type, threshold, message } of milestoneTypes) {
    if (streak.current === threshold) {
      const alreadyUnlocked = existing.some((m) => m.type === type);
      if (!alreadyUnlocked) {
        return { type, date: today, message };
      }
    }
  }

  const totalCompletions = logs.filter((l) => l.completed).length;
  const completionMilestones = [
    {
      type: "total-10",
      threshold: 10,
      message: "10 habits completed. The streak starts here.",
    },
    {
      type: "total-50",
      threshold: 50,
      message: "50 habits done. You're on a roll.",
    },
    {
      type: "total-100",
      threshold: 100,
      message: "100 habits completed. That's who you are now.",
    },
    {
      type: "total-250",
      threshold: 250,
      message: "250 completions. Extraordinary discipline.",
    },
    {
      type: "total-500",
      threshold: 500,
      message: "500 habits. You've outpaced most people on Earth.",
    },
  ];
  for (const { type, threshold, message } of completionMilestones) {
    if (totalCompletions === threshold) {
      const alreadyUnlocked = existing.some((m) => m.type === type);
      if (!alreadyUnlocked) {
        return { type, date: today, message };
      }
    }
  }

  return null;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      milestones: [],

      loadFromDb: async (userId) => {
        const [habits, logs, milestones] = await Promise.all([
          fetchHabits(userId),
          fetchLogs(userId),
          fetchMilestones(userId),
        ]);
        set({ habits, logs, milestones });
      },

      getTodayHabits: () => {
        const { habits } = get();
        const dow = new Date().getDay();
        return habits.filter((h) => !h.isArchived && isScheduledOn(h, dow));
      },

      toggleHabit: (habitId, date) => {
        const today = date ?? format(new Date(), "yyyy-MM-dd");
        const { logs, milestones } = get();
        const existing = logs.find(
          (l) => l.habitId === habitId && l.date === today,
        );
        let updatedLog: HabitLog;
        if (existing) {
          updatedLog = {
            ...existing,
            completed: !existing.completed,
            completedAt: !existing.completed
              ? new Date().toISOString()
              : undefined,
          };
          set({
            logs: logs.map((l) =>
              l.habitId === habitId && l.date === today ? updatedLog : l,
            ),
          });
        } else {
          updatedLog = {
            habitId,
            date: today,
            completed: true,
            completedAt: new Date().toISOString(),
          };
          set({ logs: [...logs, updatedLog] });
        }

        const userId = uid();
        if (userId) upsertLog(userId, updatedLog);

        const updatedLogs = get().logs;
        const newMilestone = checkMilestones(
          updatedLogs,
          get().habits,
          habitId,
          milestones,
        );
        if (newMilestone) {
          set({ milestones: [...get().milestones, newMilestone] });
          if (userId) upsertMilestone(userId, newMilestone);
          return newMilestone;
        }
        return null;
      },

      isCompleted: (habitId, date) => {
        const today = date ?? format(new Date(), "yyyy-MM-dd");
        return (
          get().logs.find((l) => l.habitId === habitId && l.date === today)
            ?.completed ?? false
        );
      },

      skipHabit: (habitId, date, reason) => {
        const today = date ?? format(new Date(), "yyyy-MM-dd");
        const { logs } = get();
        const existing = logs.find(
          (l) => l.habitId === habitId && l.date === today,
        );
        const updatedLog: HabitLog = existing
          ? {
              ...existing,
              completed: false,
              skipped: true,
              completedAt: undefined,
              skipReason: reason,
            }
          : {
              habitId,
              date: today,
              completed: false,
              skipped: true,
              skipReason: reason,
            };
        if (existing) {
          set({
            logs: logs.map((l) =>
              l.habitId === habitId && l.date === today ? updatedLog : l,
            ),
          });
        } else {
          set({ logs: [...logs, updatedLog] });
        }
        const userId = uid();
        if (userId) upsertLog(userId, updatedLog);
      },

      isSkipped: (habitId, date) => {
        const today = date ?? format(new Date(), "yyyy-MM-dd");
        return (
          get().logs.find((l) => l.habitId === habitId && l.date === today)
            ?.skipped ?? false
        );
      },

      togglePin: (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, isPinned: !h.isPinned } : h,
          ),
        }));
        const userId = uid();
        const habit = get().habits.find((h) => h.id === habitId);
        if (userId && habit) upsertHabit(userId, habit);
      },

      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, isArchived: true, isPinned: false } : h,
          ),
        }));
        const userId = uid();
        const habit = get().habits.find((h) => h.id === id);
        if (userId && habit) upsertHabit(userId, habit);
      },

      unarchiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, isArchived: false } : h,
          ),
        }));
        const userId = uid();
        const habit = get().habits.find((h) => h.id === id);
        if (userId && habit) upsertHabit(userId, habit);
      },

      getScheduledHabits: (date) => {
        const { habits } = get()
        const dow = new Date(`${date}T00:00:00`).getDay()
        return habits.filter(h => !h.isArchived && isScheduledOn(h, dow))
      },

      getStreak: (habitId) => computeStreak(get().logs, habitId),

      getAppStreak: () => {
        const { logs } = get();
        let streak = 0;
        let d = new Date();
        while (true) {
          const dateStr = format(d, "yyyy-MM-dd");
          const hasAny = logs.some((l) => l.date === dateStr && l.completed);
          if (!hasAny) break;
          streak++;
          d = subDays(d, 1);
        }
        return streak;
      },

      getLastActiveDate: () => {
        const { logs } = get();
        const completedDates = logs
          .filter((l) => l.completed)
          .map((l) => l.date)
          .sort()
          .reverse();
        return completedDates[0] ?? null;
      },

      getDayProgress: (date) => {
        const today = date ?? format(new Date(), "yyyy-MM-dd");
        const { habits, logs } = get();
        const dow = new Date(`${today}T00:00:00`).getDay();
        const scheduled = habits.filter(
          (h) => !h.isArchived && isScheduledOn(h, dow),
        );
        const skippedIds = new Set(
          logs
            .filter((l) => l.date === today && l.skipped)
            .map((l) => l.habitId),
        );
        const total = scheduled.filter((h) => !skippedIds.has(h.id)).length;
        const completed = logs.filter(
          (l) =>
            l.date === today &&
            l.completed &&
            !l.skipped &&
            scheduled.some((h) => h.id === l.habitId),
        ).length;
        return {
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },

      getWeeklyProgress: () => {
        const { habits, logs } = get();
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
          const date = format(subDays(today, 6 - i), "yyyy-MM-dd");
          const dow = new Date(`${date}T00:00:00`).getDay();
          const scheduled = habits.filter(
            (h) => !h.isArchived && isScheduledOn(h, dow),
          );
          const total = scheduled.length;
          const completed = logs.filter(
            (l) =>
              l.date === date &&
              l.completed &&
              scheduled.some((h) => h.id === l.habitId),
          ).length;
          return {
            date,
            total,
            completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        });
      },

      getMonthlyProgress: () => {
        const { habits, logs } = get();
        const today = new Date();
        return Array.from({ length: 30 }, (_, i) => {
          const date = format(subDays(today, 29 - i), "yyyy-MM-dd");
          const dow = new Date(`${date}T00:00:00`).getDay();
          const scheduled = habits.filter(
            (h) => !h.isArchived && isScheduledOn(h, dow),
          );
          const total = scheduled.length;
          const completed = logs.filter(
            (l) =>
              l.date === date &&
              l.completed &&
              scheduled.some((h) => h.id === l.habitId),
          ).length;
          return {
            date,
            total,
            completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        });
      },

      getPersonalBests: (): PersonalBests => {
        const { habits, logs } = get();

        let longestStreakEver = 0;
        for (const h of habits.filter((h) => !h.isArchived)) {
          const s = computeStreak(logs, h.id);
          if (s.best > longestStreakEver) longestStreakEver = s.best;
        }

        const dailyCounts: Record<string, number> = {};
        for (const log of logs) {
          if (log.completed) {
            dailyCounts[log.date] = (dailyCounts[log.date] ?? 0) + 1;
          }
        }
        const vals = Object.values(dailyCounts);
        const mostCompletedInDay = vals.length > 0 ? Math.max(...vals) : 0;

        const today = new Date();
        const last30Pcts = Array.from({ length: 30 }, (_, i) => {
          const date = format(subDays(today, 29 - i), "yyyy-MM-dd");
          const total = habits.filter((h) => !h.isArchived).length;
          const completed = logs.filter(
            (l) => l.date === date && l.completed,
          ).length;
          return total > 0 ? Math.round((completed / total) * 100) : 0;
        });
        let bestWeekAvg = 0;
        for (let i = 0; i <= last30Pcts.length - 7; i++) {
          const avg = Math.round(
            last30Pcts.slice(i, i + 7).reduce((s, v) => s + v, 0) / 7,
          );
          if (avg > bestWeekAvg) bestWeekAvg = avg;
        }

        return { longestStreakEver, mostCompletedInDay, bestWeekAvg };
      },

      getHabitStats: (habitId): HabitStats => {
        const { logs } = get();
        const today = new Date();
        const last30 = Array.from({ length: 30 }, (_, i) =>
          format(subDays(today, 29 - i), "yyyy-MM-dd"),
        );
        const completedDays = last30.filter((d) =>
          logs.some(
            (l) => l.habitId === habitId && l.date === d && l.completed,
          ),
        ).length;
        const skippedDays = last30.filter((d) =>
          logs.some((l) => l.habitId === habitId && l.date === d && l.skipped),
        ).length;
        const dailyData = last30.map((date) => {
          const log = logs.find(
            (l) => l.habitId === habitId && l.date === date,
          );
          return {
            date,
            completed: log?.completed ?? false,
            skipped: log?.skipped ?? false,
          };
        });
        return {
          completionRate30: Math.round((completedDays / 30) * 100),
          completedDays,
          skippedDays,
          dailyData,
          streak: computeStreak(logs, habitId),
        };
      },

      addHabit: (habit) => {
        const id = crypto.randomUUID();
        const newHabit: Habit = { ...habit, id, isCustom: true };
        const sortOrder = get().habits.filter(
          (h) => h.timeSlot === habit.timeSlot,
        ).length;
        set({ habits: [...get().habits, newHabit] });
        const userId = uid();
        if (userId) upsertHabit(userId, newHabit, sortOrder);
      },

      editHabit: (id, updates) => {
        set({
          habits: get().habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h,
          ),
        });
        const userId = uid();
        const habit = get().habits.find((h) => h.id === id);
        if (userId && habit) upsertHabit(userId, habit);
      },

      removeHabit: (id) => {
        set({ habits: get().habits.filter((h) => h.id !== id) });
        const userId = uid();
        if (userId) deleteHabit(id);
      },

      reorderHabits: (slot, reordered) => {
        set((state) => {
          const result = [...state.habits];
          let ri = 0;
          for (let i = 0; i < result.length; i++) {
            if (result[i].timeSlot === slot && !result[i].isArchived)
              result[i] = reordered[ri++];
          }
          return { habits: result };
        });
        const userId = uid();
        if (userId) reordered.forEach((h, i) => upsertHabit(userId, h, i));
      },

      addMilestone: (milestone) => {
        set((state) => ({ milestones: [...state.milestones, milestone] }));
        const userId = uid();
        if (userId) upsertMilestone(userId, milestone);
      },

      exportData: () => {
        const { habits, logs, milestones } = get();
        return JSON.stringify(
          { habits, logs, milestones, exportedAt: new Date().toISOString() },
          null,
          2,
        );
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (Array.isArray(data.habits) && Array.isArray(data.logs)) {
            const habits: Habit[] = data.habits;
            const logs: HabitLog[] = data.logs;
            const milestones: Milestone[] = Array.isArray(data.milestones) ? data.milestones : [];
            set({ habits, logs, milestones });
            const userId = uid();
            if (userId) {
              habits.forEach((h, i) => upsertHabit(userId, h, i));
              logs.forEach(l => upsertLog(userId, l));
              milestones.forEach(m => upsertMilestone(userId, m));
            }
          }
        } catch { /* */ }
      },

      reset: () => set({ habits: [], logs: [], milestones: [] }),
    }),
    { name: "bestofme-habits" },
  ),
);
