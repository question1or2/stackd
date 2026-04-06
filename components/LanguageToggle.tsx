'use client'

import { useLanguage } from '@/lib/language-context'

export default function LanguageToggle() {
  const { lang, toggle } = useLanguage()

  return (
    <button
      onClick={toggle}
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 'var(--radius)',
        border: '0.5px solid var(--border-strong)',
        background: 'transparent',
        color: 'var(--text-2)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        letterSpacing: '0.04em',
      }}
    >
      {lang === 'en' ? 'KO' : 'EN'}
    </button>
  )
}
