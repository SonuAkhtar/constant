import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExperienceLevel, WorkoutVolume } from '../types'

interface WorkoutState {
  weights: Record<string, number>
  level: ExperienceLevel
  volume: WorkoutVolume
  setWeight: (exerciseId: string, kg: number) => void
  setLevel: (level: ExperienceLevel) => void
  setVolume: (volume: WorkoutVolume) => void
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      weights: {},
      level: 'intermediate',
      volume: 6,
      setWeight: (exerciseId, kg) =>
        set((s) => ({ weights: { ...s.weights, [exerciseId]: kg } })),
      setLevel: (level) => set({ level }),
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: 'workout-weights',
      version: 2,
      migrate: (s) => {
        const state = s as Partial<WorkoutState>
        return { volume: 6, ...state } as WorkoutState
      },
    }
  )
)
