import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type SupportedLanguage = 'en' | 'ja'

type LanguageContextValue = {
  language: SupportedLanguage
  setLanguage(lang: SupportedLanguage): void
  toggleLanguage(): void
}

const STORAGE_KEY = 'homesite_language'

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>('en')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'ja') {
      setLanguage(stored)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const toggleLanguage = () => setLanguage(prev => (prev === 'en' ? 'ja' : 'en'))

  const value = useMemo(() => ({ language, setLanguage, toggleLanguage }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
