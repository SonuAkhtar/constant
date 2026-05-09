import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { findOrCreateUser } from '../lib/db'

interface AuthState {
  userId: string | null
  phone:  string | null
  loading: boolean
  signIn:  (phone: string) => Promise<{ error: string | null }>
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId:  null,
      phone:   null,
      loading: false,

      signIn: async (phone) => {
        set({ loading: true })
        const { userId, error } = await findOrCreateUser(phone)
        set({ loading: false })
        if (error) return { error }
        set({ userId, phone })
        return { error: null }
      },

      signOut: () => set({ userId: null, phone: null }),
    }),
    {
      name: 'constant-auth',
      partialize: (state) => ({ userId: state.userId, phone: state.phone }),
    }
  )
)
