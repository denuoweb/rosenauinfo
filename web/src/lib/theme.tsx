import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark' | 'cyber'
type ThemeContextValue = { theme: Theme; setTheme: (t: Theme) => void }
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const STORAGE_KEY = 'site.theme'

function applyTheme(t: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', t)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const getInitial = (): Theme => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark' || saved === 'cyber') return saved
    return 'light'
  }
  const [theme, setThemeState] = useState<Theme>(getInitial)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    setTheme: (t: Theme) => setThemeState(t)
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
