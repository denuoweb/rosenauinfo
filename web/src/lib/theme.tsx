import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export const themes = ['light', 'dark', 'cyber'] as const
export type Theme = (typeof themes)[number]

type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void }
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const STORAGE_KEY = 'site.theme'

export function isTheme(value: string): value is Theme {
  return themes.includes(value as Theme)
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved && isTheme(saved) ? saved : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
