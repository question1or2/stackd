'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'

export default function LogoutButton() {
  const { s } = useLanguage()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        fontSize: 12, padding: '5px 10px',
        border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)',
        background: 'transparent', color: 'var(--text-3)',
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {s.logout}
    </button>
  )
}
