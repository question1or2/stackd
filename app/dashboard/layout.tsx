import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LanguageToggle from '@/components/LanguageToggle'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, households(*)')
    .eq('id', user.id)
    .single()

  const { data: householdMembers } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_letter, avatar_color')
    .eq('household_id', profile?.household_id ?? '')

  const household = profile?.households as { id: string; name: string; invite_code: string } | null

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1rem 4rem' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', marginBottom: '2rem', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'var(--blue-bg)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="8" r="5.5" stroke="#185FA5" strokeWidth="1.4"/>
              <path d="M8 5v3l2 1.5" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>stockd</span>
          {household && (
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>— {household.name}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LanguageToggle />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex' }}>
              {(householdMembers ?? []).map((member, i) => (
                <div
                  key={member.id}
                  title={member.display_name}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, border: '2px solid var(--bg)',
                    background: member.avatar_color,
                    color: member.avatar_color === '#B5D4F4' ? '#0C447C' : member.avatar_color === '#9FE1CB' ? '#085041' : '#1a1a18',
                    marginLeft: i > 0 ? -8 : 0,
                  }}
                >
                  {member.avatar_letter}
                </div>
              ))}
            </div>
            {household && (
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>invite: {household.invite_code}</span>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
