import { create } from 'zustand'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  message: string
  icon?: string
  action?: ToastAction
}

interface ToastStore {
  toasts: ToastItem[]
  push: (message: string, icon?: string, action?: ToastAction) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  push(message, icon, action) {
    const id = `${Date.now()}-${Math.random()}`
    set(s => ({ toasts: [...s.toasts.slice(-2), { id, message, icon, action }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 3000)
  },

  dismiss(id) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },
}))
