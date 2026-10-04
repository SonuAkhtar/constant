import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { usernameExists, deleteAccount as deleteAccountRequest } from '../lib/db'
import { clearOutbox, flushOutbox } from '../lib/outbox'

const INVALID_CREDENTIALS = 'Wrong email/username or password.'

let authSubscribed = false

interface SignUpData {
  name: string
  username: string
  email: string
  password: string
}

interface AuthState {
  userId: string | null
  email: string | null
  joinedAt: string | null
  initializing: boolean
  loading: boolean

  recovery: boolean
  init: () => Promise<void>
  signUp: (data: SignUpData) => Promise<{ error: string | null; notice?: string }>

  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  changePassword: (current: string, next: string) => Promise<{ error: string | null }>
  changeEmail: (email: string) => Promise<{ error: string | null }>
  deleteAccount: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

function fromSession(session: Session | null) {
  const user = session?.user
  return {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    joinedAt: user?.created_at ? format(new Date(user.created_at), 'yyyy-MM-dd') : null,
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  userId: null,
  email: null,
  joinedAt: null,
  initializing: true,
  loading: false,
  recovery: false,

  init: async () => {
    const isRecovery =
      typeof window !== 'undefined' && window.location.hash.includes('type=recovery')

    const { data } = await supabase.auth.getSession()
    set({ ...fromSession(data.session), recovery: isRecovery, initializing: false })

    if (authSubscribed) return
    authSubscribed = true
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        set({ ...fromSession(session), recovery: true })
        return
      }
      set(fromSession(session))
    })
  },

  signUp: async ({ name, username, email, password }) => {
    set({ loading: true })
    try {
      const uname = username.trim().toLowerCase()

      if (await usernameExists(uname)) {
        set({ loading: false })
        return { error: 'That username is already taken.' }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim(), username: uname },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        set({ loading: false })
        return { error: error.message }
      }
      if (!data.user) {
        set({ loading: false })
        return { error: 'Could not create your account. Please try again.' }
      }

      if (data.session) {
        set({ ...fromSession(data.session), loading: false })
        return { error: null }
      }
      set({ loading: false })
      return {
        error: null,
        notice: 'Account created. Confirm your email, then log in with your email address.',
      }
    } catch (e) {
      set({ loading: false })
      return { error: e instanceof Error ? e.message : 'Something went wrong.' }
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
        set({ ...fromSession(data.session), loading: false })
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
      set({ ...fromSession(sessionData.session), loading: false })
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

  changePassword: async (current, next) => {
    const email = get().email
    if (!email) return { error: 'Sign in again to change your password.' }
    set({ loading: true })
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: current })
      if (verifyError) {
        set({ loading: false })
        return { error: 'Your current password is incorrect.' }
      }
      const { error } = await supabase.auth.updateUser({ password: next })
      set({ loading: false })
      return { error: error ? error.message : null }
    } catch (e) {
      set({ loading: false })
      return { error: e instanceof Error ? e.message : 'Something went wrong.' }
    }
  },

  changeEmail: async (email) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.updateUser(
        { email: email.trim() },
        { emailRedirectTo: window.location.origin },
      )
      set({ loading: false })
      return { error: error ? error.message : null }
    } catch (e) {
      set({ loading: false })
      return { error: e instanceof Error ? e.message : 'Something went wrong.' }
    }
  },

  deleteAccount: async () => {
    set({ loading: true })
    const { error } = await deleteAccountRequest()
    if (error) {
      set({ loading: false })
      return { error }
    }
    clearOutbox()
    await supabase.auth.signOut({ scope: 'local' })
    set({ userId: null, email: null, joinedAt: null, recovery: false, loading: false })
    return { error: null }
  },

  signOut: async () => {
    await flushOutbox()
    clearOutbox()
    await supabase.auth.signOut()
    set({ userId: null, email: null, joinedAt: null, recovery: false })
  },
}))
