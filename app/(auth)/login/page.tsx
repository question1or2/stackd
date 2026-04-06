'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '380px' }}>
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
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Welcome back to your household tracker.</p>
        </div>

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {error && (
            <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', fontSize: 12, padding: '8px 10px', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: 'var(--blue)', color: '#fff', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: '1.25rem', textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
