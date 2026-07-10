import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format } from "date-fns";
import { upsertProfile, fetchProfile } from "../lib/db";
import { useAuthStore } from "./useAuthStore";
import type { Goal } from "../types";

const uid = () => useAuthStore.getState().userId;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

interface OnboardingState {
  completed: boolean;
  userName: string;
  focuses: string[];
  goals: Goal[];
  joinedAt: string;
  loadFromDb: (userId: string) => Promise<void>;
  updateProfile: (name: string, focuses: string[]) => void;
  complete: (name: string, focuses: string[]) => void;
  addGoal: (text: string, habitId?: string) => Goal;
  editGoal: (id: string, text: string) => void;
  linkGoalHabit: (id: string, habitId: string) => void;
  deleteGoal: (id: string) => void;
  reset: () => void;
}

function serializeGoals(goals: Goal[]): string {
  return goals.length === 0 ? "" : JSON.stringify(goals);
}

function parseGoalsField(field: string, fallbackDate: string): Goal[] {
  if (!field) return [];

  if (field.startsWith("[") || field.startsWith("{")) {
    try {
      const parsed = JSON.parse(field) as Goal[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return plainTextGoal(field, fallbackDate);
    }
  }
  return plainTextGoal(field, fallbackDate);
}

function plainTextGoal(field: string, fallbackDate: string): Goal[] {
  return [
    {
      id: newId(),
      text: field,
      setDate: fallbackDate || format(new Date(), "yyyy-MM-dd"),
    },
  ];
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completed: false,
      userName: "",
      focuses: [],
      goals: [],
      joinedAt: "",

      loadFromDb: async (userId) => {
        const profile = await fetchProfile(userId);
        if (!profile) return;
        const goals = parseGoalsField(
          (profile.goal as string) ?? "",
          (profile.goal_set_date as string) ?? "",
        );
        set({
          completed: profile.onboarding_completed ?? false,
          userName: profile.user_name ?? "",
          focuses: profile.focuses ?? [],
          goals,
        });
      },

      updateProfile: (name, focuses) => {
        set({ userName: name.trim(), focuses });
        const userId = uid();
        if (userId) {
          const state = get();
          upsertProfile(userId, {
            userName: name.trim(),
            focuses,
            goal: serializeGoals(state.goals),
            goalSetDate: state.goals[0]?.setDate ?? "",
            completed: state.completed,
          });
        }
      },

      complete: (name, focuses) => {
        set({ userName: name.trim(), focuses, completed: true });
        const userId = uid();
        if (userId) {
          const state = get();
          upsertProfile(userId, {
            userName: name.trim(),
            focuses,
            goal: serializeGoals(state.goals),
            goalSetDate: state.goals[0]?.setDate ?? "",
            completed: true,
          });
        }
      },

      addGoal: (text, habitId) => {
        const goal: Goal = {
          id: newId(),
          text: text.trim(),
          setDate: format(new Date(), "yyyy-MM-dd"),
          habitId,
        };
        const goals = [...get().goals, goal];
        set({ goals });
        const userId = uid();
        if (userId) {
          const state = get();
          upsertProfile(userId, {
            userName: state.userName,
            focuses: state.focuses,
            goal: serializeGoals(goals),
            goalSetDate: goals[0].setDate,
            completed: state.completed,
          });
        }
        return goal;
      },

      editGoal: (id, text) => {
        const goals = get().goals.map((g) =>
          g.id === id ? { ...g, text: text.trim() } : g,
        );
        set({ goals });
        const userId = uid();
        if (userId) {
          const state = get();
          upsertProfile(userId, {
            userName: state.userName,
            focuses: state.focuses,
            goal: serializeGoals(goals),
            goalSetDate: goals[0]?.setDate ?? "",
            completed: state.completed,
          });
        }
      },

      linkGoalHabit: (id, habitId) => {
        const goals = get().goals.map((g) =>
          g.id === id ? { ...g, habitId } : g,
        );
        set({ goals });
        const userId = uid();
        if (userId) {
          const state = get();
          upsertProfile(userId, {
            userName: state.userName,
            focuses: state.focuses,
            goal: serializeGoals(goals),
            goalSetDate: goals[0]?.setDate ?? "",
            completed: state.completed,
          });
        }
      },

      deleteGoal: (id) => {
        const goals = get().goals.filter((g) => g.id !== id);
        set({ goals });
        const userId = uid();
        if (userId) {
          const state = get();
          upsertProfile(userId, {
            userName: state.userName,
            focuses: state.focuses,
            goal: serializeGoals(goals),
            goalSetDate: goals[0]?.setDate ?? "",
            completed: state.completed,
          });
        }
      },

      reset: () =>
        set({ completed: false, userName: "", focuses: [], goals: [] }),
    }),
    {
      name: "progress-onboarding",
      version: 2,

      migrate: (raw, version) => {
        const s = raw as Partial<
          OnboardingState & { goal?: string; goalSetDate?: string }
        >;
        if (version < 2 && s.goal && (!s.goals || s.goals.length === 0)) {
          return {
            ...s,
            goals: [
              {
                id: newId(),
                text: s.goal,
                setDate: s.goalSetDate || format(new Date(), "yyyy-MM-dd"),
              },
            ],
          } as OnboardingState;
        }
        return { goals: [], ...s } as OnboardingState;
      },
    },
  ),
);
