import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { upsertProfile, fetchProfile } from '../lib/db'
import { useAuthStore } from './useAuthStore'

const uid = () => useAuthStore.getState().userId

interface OnboardingState {
  completed:   boolean
  userName:    string
  focuses:     string[]
  goal:        string
  goalSetDate: string
  joinedAt:    string
  loadFromDb:    (userId: string) => Promise<void>
  complete:      (name: string, focuses: string[]) => void
  updateProfile: (name: string, focuses: string[]) => void
  setGoal:       (goal: string) => void
  clearGoal:     () => void
  reset:         () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completed:   false,
      userName:    '',
      focuses:     [],
      goal:        '',
      goalSetDate: '',
      joinedAt:    '',

      loadFromDb: async (userId) => {
        const profile = await fetchProfile(userId)
        if (!profile) return
        set({
          completed:   profile.onboarding_completed ?? false,
          userName:    profile.user_name    ?? '',
          focuses:     profile.focuses      ?? [],
          goal:        profile.goal         ?? '',
          goalSetDate: profile.goal_set_date ?? '',
        })
      },

      complete: (name, focuses) => {
        const joinedAt = format(new Date(), 'yyyy-MM-dd')
        set({ completed: true, userName: name.trim(), focuses, joinedAt })
        const userId = uid()
        if (userId) upsertProfile(userId, { ...get(), completed: true, userName: name.trim(), focuses })
      },

      updateProfile: (name, focuses) => {
        set({ userName: name.trim(), focuses })
        const userId = uid()
        if (userId) upsertProfile(userId, { ...get(), userName: name.trim(), focuses })
      },

      setGoal: (goal) => {
        const goalSetDate = new Date().toISOString()
        set({ goal: goal.trim(), goalSetDate })
        const userId = uid()
        if (userId) upsertProfile(userId, { ...get(), goal: goal.trim(), goalSetDate })
      },

      clearGoal: () => {
        set({ goal: '', goalSetDate: '' })
        const userId = uid()
        if (userId) upsertProfile(userId, { ...get(), goal: '', goalSetDate: '' })
      },

      reset: () => set({ completed: false, userName: '', focuses: [], goal: '', goalSetDate: '' }),
    }),
    { name: 'bestofme-onboarding' }
  )
)
