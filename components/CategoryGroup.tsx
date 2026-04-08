'use client'

import { useState } from 'react'
import { Category, ItemWithComputed } from '@/lib/types'
import { updateCategoryName } from '@/app/actions'
import { useLanguage } from '@/lib/language-context'
import ItemCard from './ItemCard'

interface CategoryGroupProps {
  category: Category
  items: ItemWithComputed[]
  onCheckIn: (item: ItemWithComputed) => void
  onBuy: (item: ItemWithComputed) => void
  onArrived: (item: ItemWithComputed) => void
  onMarkBought: (item: ItemWithComputed) => void
  onToggleNotify: (item: ItemWithComputed) => void
}

export default function CategoryGroup({ category, items, onCheckIn, onBuy, onArrived, onMarkBought, onToggleNotify }: CategoryGroupProps) {
  const { s } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [saving, setSaving] = useState(false)

  async function handleBlur() {
    const trimmed = name.trim()
    if (!trimmed) { setName(category.name); setEditing(false); return }
    if (trimmed === category.name) { setEditing(false); return }
    setSaving(true)
    await updateCategoryName(category.id, trimmed)
    setSaving(false)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
    if (e.key === 'Escape') { setName(category.name); setEditing(false) }
  }

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
          {category.icon}
        </div>
        {editing ? (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={saving}
            style={{ fontSize: 16, fontWeight: 600, border: '0.5px solid var(--blue)', borderRadius: 6, padding: '1px 6px', outline: 'none', fontFamily: 'inherit', width: 120 }}
          />
        ) : (
          <span style={{ fontSize: 16, fontWeight: 600 }}>{name}</span>
        )}
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ fontSize: 11, color: 'var(--blue)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, border: '0.5px solid transparent', background: 'transparent', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
          >
            {s.edit_name}
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {items.map(item => (
          <ItemCard key={item.id} item={item} onCheckIn={onCheckIn} onBuy={onBuy} onArrived={onArrived} onMarkBought={onMarkBought} onToggleNotify={onToggleNotify} />
        ))}
      </div>
    </div>
  )
}
