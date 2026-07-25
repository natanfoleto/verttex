'use client'

import * as React from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeProviderContext = React.createContext<ThemeProviderContextType | undefined>(
  undefined,
)

const THEME_STORAGE_KEY = 'verttex-manager-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('dark')
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('dark')

  // Load saved theme on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [])

  // Apply theme to <html> / <body> element
  React.useEffect(() => {
    const root = document.documentElement

    const applyTheme = () => {
      let activeTheme: 'light' | 'dark' = 'dark'

      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        activeTheme = systemDark ? 'dark' : 'light'
      } else {
        activeTheme = theme
      }

      setResolvedTheme(activeTheme)

      if (activeTheme === 'light') {
        root.classList.remove('dark')
        root.classList.add('light')
        root.style.colorScheme = 'light'
      } else {
        root.classList.remove('light')
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      }
    }

    applyTheme()

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme()
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeProviderContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
