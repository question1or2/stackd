'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Lang, Strings } from './i18n'
import { t } from './i18n'

const LanguageContext = createContext<{
  lang: Lang
  s: Strings
  toggle: () => void
}>({ lang: 'en', s: t.en, toggle: () => {} })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved === 'ko' || saved === 'en') setLang(saved)
  }, [])

  function toggle() {
    const next: Lang = lang === 'en' ? 'ko' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  return (
    <LanguageContext.Provider value={{ lang, s: t[lang] as Strings, toggle }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
