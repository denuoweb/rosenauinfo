import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type SupportedLanguage = 'en' | 'ja'

type LanguageContextValue = {
  language: SupportedLanguage
  setLanguage(lang: SupportedLanguage): void
}

const STORAGE_KEY = 'homesite_language'

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'ja' ? 'ja' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => ({ language, setLanguage }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
