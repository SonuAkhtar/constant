import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format } from "date-fns";
import {
  updateProfile as updateProfileRow,
  fetchProfile,
  fetchGoals,
  upsertGoal,
  deleteGoal as deleteGoalRow,
} from "../lib/db";
import { hasPendingWrites } from "../lib/outbox";
import { useAuthStore } from "./useAuthStore";
import type { Goal } from "../types";

const uid = () => useAuthStore.getState().userId;

interface OnboardingState {
  ownerId: string | null;
  userName: string;
  focuses: string[];
  goals: Goal[];
  loadFromDb: (userId: string) => Promise<void>;
  updateProfile: (name: string, focuses: string[]) => void;
  addGoal: (text: string, habitId?: string) => Goal;
  editGoal: (id: string, text: string) => void;
  deleteGoal: (id: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      userName: "",
      focuses: [],
      goals: [],

      loadFromDb: async (userId) => {
        if (get().ownerId && get().ownerId !== userId) {
          set({ ownerId: null, userName: "", focuses: [], goals: [] });
        }
        if (hasPendingWrites()) return;
        const [res, goals] = await Promise.all([fetchProfile(userId), fetchGoals(userId)]);
        if (!res?.profile || !goals) return;
        const profile = res.profile;
        set({
          ownerId: userId,
          userName: (profile.user_name as string) ?? "",
          focuses: (profile.focuses as string[]) ?? [],
          goals,
        });
      },

      updateProfile: (name, focuses) => {
        set({ userName: name.trim(), focuses });
        const userId = uid();
        if (userId) updateProfileRow(userId, { userName: name.trim(), focuses });
      },

      addGoal: (text, habitId) => {
        const goal: Goal = {
          id: crypto.randomUUID(),
          text: text.trim(),
          setDate: format(new Date(), "yyyy-MM-dd"),
          habitId,
        };
        set({ goals: [...get().goals, goal] });
        const userId = uid();
        if (userId) upsertGoal(userId, goal);
        return goal;
      },

      editGoal: (id, text) => {
        set({
          goals: get().goals.map((g) => (g.id === id ? { ...g, text: text.trim() } : g)),
        });
        const userId = uid();
        const goal = get().goals.find((g) => g.id === id);
        if (userId && goal) upsertGoal(userId, goal);
      },

      deleteGoal: (id) => {
        set({ goals: get().goals.filter((g) => g.id !== id) });
        if (uid()) deleteGoalRow(id);
      },

      reset: () =>
        set({ ownerId: null, userName: "", focuses: [], goals: [] }),
    }),
    {
      name: "progress-onboarding",
      version: 4,

      migrate: (raw, version) => {
        const s = raw as Partial<
          OnboardingState & { goal?: string; goalSetDate?: string; joinedAt?: string }
        >;
        delete s.joinedAt;
        if (version < 2 && s.goal && (!s.goals || s.goals.length === 0)) {
          return {
            ...s,
            goals: [
              {
                id: crypto.randomUUID(),
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
