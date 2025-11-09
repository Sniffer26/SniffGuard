import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // State
      theme: 'auto', // 'light', 'dark', 'auto'
      systemTheme: 'light',

      // Actions
      setTheme: (newTheme) => {
        set({ theme: newTheme })
        
        // Apply theme immediately
        get().applyTheme(newTheme)
      },

      initTheme: () => {
        const { theme } = get()
        
        // Detect system theme
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        set({ systemTheme })

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          const newSystemTheme = e.matches ? 'dark' : 'light'
          set({ systemTheme: newSystemTheme })
          
          // If theme is auto, apply the new system theme
          if (get().theme === 'auto') {
            get().applyTheme('auto')
          }
        })

        // Apply current theme
        get().applyTheme(theme)
      },

      applyTheme: (theme) => {
        const root = document.documentElement
        const { systemTheme } = get()

        if (theme === 'dark') {
          root.classList.add('dark')
        } else if (theme === 'light') {
          root.classList.remove('dark')
        } else { // auto
          if (systemTheme === 'dark') {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
          const isDark = root.classList.contains('dark')
          metaThemeColor.setAttribute('content', isDark ? '#1f2937' : '#3b82f6')
        }
      },

      getCurrentTheme: () => {
        const { theme, systemTheme } = get()
        return theme === 'auto' ? systemTheme : theme
      },

      isDarkMode: () => {
        return get().getCurrentTheme() === 'dark'
      },

      toggleTheme: () => {
        const { theme } = get()
        
        if (theme === 'light') {
          get().setTheme('dark')
        } else if (theme === 'dark') {
          get().setTheme('auto')
        } else {
          get().setTheme('light')
        }
      },
    }),
    {
      name: 'sniffguard-theme',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
)