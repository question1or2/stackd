'use client'

import { useState } from 'react'
import { addCategory } from '@/app/actions'
import { useLanguage } from '@/lib/language-context'

interface AddCategoryModalProps {
  householdId: string
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function AddCategoryModal({ householdId, onClose, onSuccess }: AddCategoryModalProps) {
  const { s } = useLanguage()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📦')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)',
    padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)',
    outline: 'none', fontFamily: 'inherit',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await addCategory(householdId, name.trim(), icon)
      onSuccess(s.add_category_title)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : s.failed_add_category)
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '100%', maxWidth: 360 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.25rem' }}>{s.add_category_title}</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '3rem 1fr', gap: 8, marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>{s.icon}</label>
              <input type="text" value={icon} onChange={e => setIcon(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3, textAlign: 'center' }}>⌘⌃Space</div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>{s.name}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Cleaning" autoFocus style={inputStyle} />
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', fontSize: 12, padding: '8px 10px', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
              {s.cancel}
            </button>
            <button type="submit" disabled={saving} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', background: 'var(--blue)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
              {saving ? s.adding : s.add_category_btn}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
