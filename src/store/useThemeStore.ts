import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

function setDocumentTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#080a01' : '#f9f9f7')
}

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  applyTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      toggleTheme: () => {
        const next: Theme = get().theme === 'light' ? 'dark' : 'light'
        setDocumentTheme(next)
        set({ theme: next })
      },

      applyTheme: () => {
        setDocumentTheme(get().theme)
      },
    }),
    { name: 'progress-theme', version: 1, migrate: (s) => s as ThemeState }
  )
)
