'use client'

import { useState } from 'react'
import { ItemWithComputed } from '@/lib/types'
import { markArrived } from '@/app/actions'

interface ArrivedModalProps {
  item: ItemWithComputed
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function ArrivedModal({ item, onClose, onSuccess }: ArrivedModalProps) {
  const [qty, setQty] = useState(item.ordered_quantity?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const received = parseFloat(qty)
    if (isNaN(received)) return
    setSaving(true)
    try {
      await markArrived(item.id, received)
      onSuccess('Restocked — stock updated to received quantity')
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
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{item.name} arrived</h3>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Confirm the quantity you received. We pre-filled based on your order.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
              Quantity received ({item.unit})
            </label>
            <input
              type="number"
              value={qty}
              onChange={e => setQty(e.target.value)}
              required
              min="0"
              placeholder={`e.g. ${item.ordered_quantity ?? '1'}`}
              style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Stock will be updated to this amount.</div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
              cancel
            </button>
            <button type="submit" disabled={saving} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', background: 'var(--blue)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
              {saving ? 'saving…' : 'confirm restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
