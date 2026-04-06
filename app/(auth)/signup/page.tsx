'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'household'>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [householdMode, setHouseholdMode] = useState<'create' | 'join'>('create')
  const [householdName, setHouseholdName] = useState('Our Home')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 'account') {
      if (!email || !password || !displayName) return
      setStep('household')
      return
    }

    setError(null)
    setLoading(true)
    const supabase = createClient()

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      setError(authError?.message ?? 'Signup failed')
      setLoading(false)
      return
    }

    const userId = authData.user.id
    const avatarColors = ['#B5D4F4', '#9FE1CB', '#FAEEDA', '#EAF3DE']
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)]

    if (householdMode === 'create') {
      const { error: rpcError } = await supabase.rpc('setup_household', {
        p_household_name: householdName,
        p_user_id: userId,
        p_display_name: displayName,
        p_avatar_color: avatarColor,
      })
      if (rpcError) {
        setError(rpcError.message)
        setLoading(false)
        return
      }
    } else {
      const { error: rpcError } = await supabase.rpc('join_household', {
        p_invite_code: inviteCode.trim(),
        p_user_id: userId,
        p_display_name: displayName,
        p_avatar_color: avatarColor,
      })
      if (rpcError) {
        setError(rpcError.message === 'Household not found' ? 'Household not found. Check your invite code.' : rpcError.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
          <div style={{ width: 30, height: 30, background: 'var(--blue-bg)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="8" r="5.5" stroke="#185FA5" strokeWidth="1.4"/>
              <path d="M8 5v3l2 1.5" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>stockd</span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {step === 'account' ? 'Create account' : 'Set up your household'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {step === 'account'
              ? 'Track supplies together with your household.'
              : 'Create a new household or join an existing one.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 'account' ? (
            <>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  placeholder="e.g. Junho"
                  style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </>
          ) : (
            <>
              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
                {(['create', 'join'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setHouseholdMode(mode)}
                    style={{
                      flex: 1, padding: '7px 12px', fontSize: 12, fontWeight: 500,
                      borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit',
                      background: householdMode === mode ? 'var(--blue-bg)' : 'transparent',
                      color: householdMode === mode ? 'var(--blue-text)' : 'var(--text-2)',
                      border: householdMode === mode ? '0.5px solid var(--blue)' : '0.5px solid var(--border-strong)',
                    }}
                  >
                    {mode === 'create' ? 'Create new' : 'Join existing'}
                  </button>
                ))}
              </div>

              {householdMode === 'create' ? (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Household name</label>
                  <input
                    type="text"
                    value={householdName}
                    onChange={e => setHouseholdName(e.target.value)}
                    required
                    placeholder="e.g. Our Home"
                    style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Invite code</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                    required
                    placeholder="8-character code"
                    style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', letterSpacing: '0.05em' }}
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', fontSize: 12, padding: '8px 10px', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'household' && (
              <button
                type="button"
                onClick={() => setStep('account')}
                style={{ flex: 1, padding: '8px 16px', fontSize: 13, border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, background: 'var(--blue)', color: '#fff', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}
            >
              {loading ? 'Creating…' : step === 'account' ? 'Continue' : 'Create account'}
            </button>
          </div>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: '1.25rem', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
