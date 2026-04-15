import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ha-theme',
      partialize: (state) => ({ theme: state.theme }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<ThemeState>),
        theme: (persistedState as Partial<ThemeState>)?.theme ?? 'light',
      }),
    }
  )
)
