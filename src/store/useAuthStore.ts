import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { usernameExists, createProfile, seedDefaultHabits } from '../lib/db'

const INVALID_CREDENTIALS = 'Wrong email/username or password.'

let suppressAuthSync = false

export interface SignUpData {
  name: string
  username: string
  email: string
  password: string
}

interface AuthState {
  userId: string | null
  email: string | null
  initializing: boolean
  loading: boolean

  recovery: boolean
  init: () => Promise<void>
  signUp: (data: SignUpData) => Promise<{ error: string | null }>

  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  userId: null,
  email: null,
  initializing: true,
  loading: false,
  recovery: false,

  init: async () => {

    const isRecovery =
      typeof window !== 'undefined' && window.location.hash.includes('type=recovery')

    const { data } = await supabase.auth.getSession()
    const session = data.session
    set({
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
      recovery: isRecovery,
      initializing: false,
    })
    supabase.auth.onAuthStateChange((event, session) => {
      if (suppressAuthSync) return
      if (event === 'PASSWORD_RECOVERY') {
        set({
          recovery: true,
          userId: session?.user.id ?? null,
          email: session?.user.email ?? null,
        })
        return
      }
      set({
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
      })
    })
  },

  signUp: async ({ name, username, email, password }) => {
    set({ loading: true })
    suppressAuthSync = true
    try {
      const uname = username.trim().toLowerCase()

      if (await usernameExists(uname)) {
        set({ loading: false })
        return { error: 'That username is already taken.' }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (error) {
        set({ loading: false })
        return { error: error.message }
      }
      const user = data.user
      if (!user) {
        set({ loading: false })
        return { error: 'Could not create your account. Please try again.' }
      }

      const { error: profileErr } = await createProfile(user.id, {
        name: name.trim(),
        username: uname,
        email: email.trim(),
      })
      if (profileErr) {
        set({ loading: false })
        return { error: profileErr }
      }
      await seedDefaultHabits(user.id)

      if (data.session) {
        set({ userId: user.id, email: user.email ?? null, loading: false })
        return { error: null }
      }
      set({ loading: false })
      return { error: 'Account created. Confirm your email, then log in.' }
    } catch (e) {
      set({ loading: false })
      return { error: e instanceof Error ? e.message : 'Something went wrong.' }
    } finally {
      suppressAuthSync = false
    }
  },

  signIn: async (identifier, password) => {
    set({ loading: true })
    const id = identifier.trim()
    try {

      if (id.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: id, password })
        if (error || !data.session) {
          set({ loading: false })
          return { error: INVALID_CREDENTIALS }
        }
        set({ userId: data.user.id, email: data.user.email ?? null, loading: false })
        return { error: null }
      }

      const { data, error } = await supabase.functions.invoke('login', {
        body: { identifier: id, password },
      })
      if (error || !data?.session) {
        set({ loading: false })
        return { error: INVALID_CREDENTIALS }
      }
      const { data: sessionData, error: setErr } = await supabase.auth.setSession(data.session)
      if (setErr || !sessionData.session) {
        set({ loading: false })
        return { error: INVALID_CREDENTIALS }
      }
      set({
        userId: sessionData.session.user.id,
        email: sessionData.session.user.email ?? null,
        loading: false,
      })
      return { error: null }
    } catch {
      set({ loading: false })
      return { error: INVALID_CREDENTIALS }
    }
  },

  sendPasswordReset: async (email) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      })
      set({ loading: false })
      if (error) return { error: error.message }
      return { error: null }
    } catch (e) {
      set({ loading: false })
      return { error: e instanceof Error ? e.message : 'Something went wrong.' }
    }
  },

  updatePassword: async (password) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState({}, '', window.location.pathname)
      }
      set({ loading: false, recovery: false })
      return { error: null }
    } catch (e) {
      set({ loading: false })
      return { error: e instanceof Error ? e.message : 'Something went wrong.' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ userId: null, email: null, recovery: false })
  },
}))
