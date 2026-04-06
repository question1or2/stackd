'use client'

import { ItemWithComputed } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

interface ReminderCardProps {
  item: ItemWithComputed
  onBuy: (item: ItemWithComputed) => void
}

export default function ReminderCard({ item, onBuy }: ReminderCardProps) {
  const { s } = useLanguage()
  const isUrgent = item.status === 'urgent'
  const assignee = item.nextBuyerProfile ?? item.defaultBuyerProfile
  const avatarColor = assignee?.avatar_color ?? '#B5D4F4'
  const avatarTextColor = avatarColor === '#B5D4F4' ? '#0C447C' : avatarColor === '#9FE1CB' ? '#085041' : '#1a1a18'

  const title = item.tracking_mode === 'depletion'
    ? s.running_low(item.name, item.daysRemaining ?? 0)
    : s.reorder_window(item.name)

  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isUrgent ? 'var(--red-bg)' : 'var(--amber-bg)' }}>
        {isUrgent ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#E24B4A" strokeWidth="1.2"/>
            <path d="M7 4v3" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="7" cy="10.2" r="0.7" fill="#E24B4A"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2L13 12H1L7 2Z" stroke="#BA7517" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M7 6v2.5" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="7" cy="10" r="0.6" fill="#BA7517"/>
          </svg>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {s.last_price} {formatPrice(item.last_price)}
          {item.product_url && (
            <>{' · '}<a href={item.product_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }}>{s.open_product}</a></>
          )}
        </div>
        {isUrgent && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{s.reminding_daily}</div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        {assignee && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, background: avatarColor, color: avatarTextColor }}>
              {assignee.avatar_letter}
            </div>
            {assignee.display_name}
          </div>
        )}
        <button onClick={() => onBuy(item)} style={{ fontSize: 11, padding: '5px 10px', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', background: 'var(--blue-bg)', color: 'var(--blue-text)', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>
          {s.confirm_buy}
        </button>
      </div>
    </div>
  )
}
