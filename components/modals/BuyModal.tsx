'use client'

import { useState } from 'react'
import { ItemWithComputed } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { confirmPurchase } from '@/app/actions'

interface BuyModalProps {
  item: ItemWithComputed
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function BuyModal({ item, onClose, onSuccess }: BuyModalProps) {
  const [currentPrice, setCurrentPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)
  const [priceWarning, setPriceWarning] = useState(false)

  const lastPrice = item.last_price

  function checkPriceVariance(price: number) {
    if (!lastPrice) return false
    const diff = Math.abs(price - lastPrice) / lastPrice
    return diff > 0.05
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(currentPrice.replace(/[^0-9.]/g, ''))
    const qty = parseFloat(quantity) || (item.usage_rate ? item.usage_rate * 30 : 1)

    if (!price) return

    if (checkPriceVariance(price) && !priceWarning) {
      setPriceWarning(true)
      return
    }

    setSaving(true)
    try {
      await confirmPurchase(item.id, price, qty)
      onSuccess('Purchase confirmed and logged')
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
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Confirm purchase — {item.name}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Check the current price on the {item.product_url ? (
            <a href={item.product_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }}>product page ↗</a>
          ) : 'product page'}, then confirm below.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
              Last recorded price: <strong style={{ color: 'var(--text)' }}>{formatPrice(lastPrice)}</strong>
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                value={currentPrice}
                onChange={e => { setCurrentPrice(e.target.value); setPriceWarning(false) }}
                placeholder="Enter today's price (₩)"
                required
                style={{ flex: 1, border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Quantity ordered ({item.unit})</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              min="0"
              placeholder={item.usage_rate ? `e.g. ${item.usage_rate * 30}` : 'e.g. 1'}
              style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {priceWarning && (
            <div style={{ background: 'var(--amber-bg)', color: 'var(--amber-text)', fontSize: 12, padding: '8px 10px', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
              Price is more than 5% different from last recorded price ({formatPrice(lastPrice)}). Click confirm again to proceed anyway.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
              cancel
            </button>
            <button type="submit" disabled={saving} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', background: 'var(--blue)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
              {saving ? 'confirming…' : priceWarning ? 'confirm anyway' : 'confirm purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
