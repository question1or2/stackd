'use client'

import { useState } from 'react'
import { ItemWithComputed } from '@/lib/types'
import { checkIn, markBought } from '@/app/actions'

interface CheckinModalProps {
  item: ItemWithComputed
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function CheckinModal({ item, onClose, onSuccess }: CheckinModalProps) {
  const [amount, setAmount] = useState(item.current_stock?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const isCycle = item.tracking_mode === 'cycle'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (isCycle) {
        await markBought(item.id)
        onSuccess('Cycle reset — marked as bought today')
      } else {
        await checkIn(item.id, parseFloat(amount))
        onSuccess('Stock level updated')
      }
      onClose()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxWidth: 360, width: '90%', border: '0.5px solid var(--border-strong)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          {isCycle ? `Mark bought — ${item.name}` : `Check in — ${item.name}`}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          {isCycle
            ? 'This will reset the cycle clock to today.'
            : 'Update the current stock level so the tracker stays accurate.'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isCycle && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                Current amount remaining ({item.unit})
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                min="0"
                placeholder={`e.g. 1500`}
                style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: isCycle ? 0 : '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
              cancel
            </button>
            <button type="submit" disabled={saving} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', background: 'var(--blue)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
              {saving ? 'saving…' : isCycle ? 'mark bought' : 'save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
