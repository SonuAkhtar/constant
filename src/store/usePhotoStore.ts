import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PhotoState {
  photo: string
  setPhoto: (photo: string) => void
  reset: () => void
}

export const usePhotoStore = create<PhotoState>()(
  persist(
    (set) => ({
      photo: '',
      setPhoto: (photo) => set({ photo }),
      reset: () => set({ photo: '' }),
    }),
    { name: 'progress-photo', version: 1 },
  ),
)
