'use client'

import { useState } from 'react'
import { Category, Profile } from '@/lib/types'
import { addItem, addCategory } from '@/app/actions'

interface AddItemModalProps {
  categories: Category[]
  profiles: Profile[]
  householdId: string
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function AddItemModal({ categories, profiles, householdId, onClose, onSuccess }: AddItemModalProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [trackingMode, setTrackingMode] = useState<'depletion' | 'cycle'>('depletion')
  const [unit, setUnit] = useState('g')
  const [currentStock, setCurrentStock] = useState('')
  const [usageRate, setUsageRate] = useState('')
  const [cycleDays, setCycleDays] = useState('')
  const [lastPurchaseDate, setLastPurchaseDate] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [lastPrice, setLastPrice] = useState('')
  const [defaultBuyer, setDefaultBuyer] = useState(profiles[0]?.id ?? '')
  const [alternate, setAlternate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    if (trackingMode === 'depletion' && currentStock && usageRate) {
      const stock = parseFloat(currentStock)
      const rate = parseFloat(usageRate)
      if (rate > stock) {
        setError('Usage rate per day cannot exceed current stock.')
        return
      }
    }

    setError(null)
    setSaving(true)

    try {
      let resolvedCategoryId: string | null = categoryId

      if (showNewCategory && newCategoryName.trim()) {
        const id = await addCategory(householdId, newCategoryName.trim(), newCategoryIcon)
        resolvedCategoryId = id ?? null
      }

      await addItem({
        name: name.trim(),
        category_id: resolvedCategoryId || null,
        tracking_mode: trackingMode,
        unit,
        household_id: householdId,
        current_stock: trackingMode === 'depletion' && currentStock ? parseFloat(currentStock) : null,
        usage_rate: trackingMode === 'depletion' && usageRate ? parseFloat(usageRate) : null,
        cycle_days: trackingMode === 'cycle' && cycleDays ? parseInt(cycleDays) : null,
        last_purchase_date: trackingMode === 'cycle' && lastPurchaseDate ? lastPurchaseDate : null,
        product_url: productUrl || null,
        last_price: lastPrice ? parseFloat(lastPrice.replace(/[^0-9.]/g, '')) : null,
        default_buyer: alternate ? null : (defaultBuyer || null),
        alternate_buyer: alternate,
      })

      onSuccess('Item added successfully')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)',
    padding: '7px 10px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          if (name.trim() && !window.confirm('Discard this item?')) return
          onClose()
        }
      }}
    >
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Add new item</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1.25rem' }}>
          Items can be pet supplies, household goods, or anything you restock regularly.
        </div>

        <form onSubmit={handleSubmit}>
          {/* Item name */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Item name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Laundry detergent" style={inputStyle} />
          </div>

          {/* Category */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Category</label>
            <select
              value={showNewCategory ? '__new' : categoryId}
              onChange={e => {
                if (e.target.value === '__new') setShowNewCategory(true)
                else { setShowNewCategory(false); setCategoryId(e.target.value) }
              }}
              style={inputStyle}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
              <option value="__new">+ new category</option>
            </select>
          </div>

          {showNewCategory && (
            <div style={{ display: 'grid', gridTemplateColumns: '3rem 1fr', gap: 8, marginBottom: '0.875rem' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Icon</label>
                <input type="text" value={newCategoryIcon} onChange={e => setNewCategoryIcon(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Category name</label>
                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Household" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Tracking mode */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Tracking mode</label>
            <select value={trackingMode} onChange={e => setTrackingMode(e.target.value as 'depletion' | 'cycle')} style={inputStyle}>
              <option value="depletion">Depletion — stock runs down (food, medicine)</option>
              <option value="cycle">Cycle — scheduled reorder (sand, detergent)</option>
            </select>
          </div>

          {/* Depletion fields */}
          {trackingMode === 'depletion' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '0.875rem' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Current stock</label>
                <input type="number" value={currentStock} onChange={e => setCurrentStock(e.target.value === '' ? '' : String(parseInt(e.target.value, 10)))} placeholder="e.g. 3000" min="0" step="1" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Usage rate (per day)</label>
                <input type="number" value={usageRate} onChange={e => setUsageRate(e.target.value === '' ? '' : String(parseInt(e.target.value, 10)))} placeholder="e.g. 200" min="0" step="1" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Cycle fields */}
          {trackingMode === 'cycle' && (
            <>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Reorder every (days)</label>
                <input type="number" value={cycleDays} onChange={e => setCycleDays(e.target.value)} placeholder="e.g. 28" min="1" step="1" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Last purchased</label>
                <input type="date" value={lastPurchaseDate} onChange={e => setLastPurchaseDate(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}

          {/* Unit */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Unit</label>
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value.replace(/[0-9]/g, ''))}
              placeholder="e.g. g, kg, bags"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Label only — not the package size (type "g" not "500g")</div>
          </div>

          {/* Product URL */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Product URL (included in reminders)</label>
            <input type="url" value={productUrl} onChange={e => setProductUrl(e.target.value)} placeholder="https://coupang.com/..." style={inputStyle} />
          </div>

          {/* Last price */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Last price (₩)</label>
            <input type="number" value={lastPrice} onChange={e => setLastPrice(e.target.value)} placeholder="e.g. 48500" min="0" step="1" style={inputStyle} />
          </div>

          {/* Default buyer */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Default buyer</label>
            <select value={alternate ? '__alternate' : defaultBuyer} onChange={e => {
              if (e.target.value === '__alternate') { setAlternate(true); setDefaultBuyer('') }
              else { setAlternate(false); setDefaultBuyer(e.target.value) }
            }} style={inputStyle}>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
              <option value="__alternate">Alternate each time</option>
            </select>
          </div>

          {error && (
            <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', fontSize: 12, padding: '8px 10px', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
              cancel
            </button>
            <button type="submit" disabled={saving} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', background: 'var(--blue)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
              {saving ? 'adding…' : 'add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
