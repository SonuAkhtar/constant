import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExperienceLevel } from '../types'

interface WorkoutState {
  weights: Record<string, number>
  level: ExperienceLevel
  setWeight: (exerciseId: string, kg: number) => void
  setLevel: (level: ExperienceLevel) => void
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      weights: {},
      level: 'intermediate',
      setWeight: (exerciseId, kg) =>
        set((s) => ({ weights: { ...s.weights, [exerciseId]: kg } })),
      setLevel: (level) => set({ level }),
    }),
    { name: 'workout-weights' }
  )
)
