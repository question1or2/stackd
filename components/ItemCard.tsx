'use client'

import { ItemWithComputed } from '@/lib/types'
import { formatStock, formatPrice, daysLabel } from '@/lib/utils'

interface ItemCardProps {
  item: ItemWithComputed
  onCheckIn: (item: ItemWithComputed) => void
  onBuy: (item: ItemWithComputed) => void
  onArrived: (item: ItemWithComputed) => void
  onMarkBought: (item: ItemWithComputed) => void
}

const statusBorderColor: Record<string, string> = {
  ok: 'var(--border)',
  warning: '#FAC775',
  urgent: '#F09595',
  ordered: '#5DCAA5',
}

const fillColor: Record<string, string> = {
  ok: '#639922',
  warning: '#BA7517',
  urgent: '#E24B4A',
  ordered: '#1D9E75',
}

const badgeStyle: Record<string, React.CSSProperties> = {
  ok: { background: 'var(--green-bg)', color: 'var(--green-text)' },
  warning: { background: 'var(--amber-bg)', color: 'var(--amber-text)' },
  urgent: { background: 'var(--red-bg)', color: 'var(--red-text)' },
  ordered: { background: '#E1F5EE', color: '#085041' },
}

export default function ItemCard({ item, onCheckIn, onBuy, onArrived, onMarkBought }: ItemCardProps) {
  const borderStyle = item.status === 'ordered' ? 'dashed' : 'solid'
  const borderColor = statusBorderColor[item.status] ?? 'var(--border)'

  const badgeLabel =
    item.status === 'ordered'
      ? 'ordered'
      : item.daysRemaining !== null
        ? daysLabel(item.daysRemaining, item.tracking_mode)
        : 'ok'

  // Progress labels
  let leftLabel = ''
  let rightLabel = ''
  if (item.tracking_mode === 'depletion') {
    leftLabel = '0' + item.unit
    rightLabel = item.is_ordered
      ? `~${formatStock(item.current_stock, item.unit)} estimated`
      : formatStock(item.current_stock, item.unit) + ' left'
  } else {
    if (item.last_purchase_date) {
      const d = new Date(item.last_purchase_date)
      leftLabel = `purchased ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else {
      leftLabel = 'no purchase date'
    }
    if (item.last_purchase_date && item.cycle_days) {
      const d = new Date(item.last_purchase_date)
      d.setDate(d.getDate() + item.cycle_days)
      rightLabel = `due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
  }

  // Meta line
  let metaLine = ''
  if (item.tracking_mode === 'depletion') {
    if (item.usage_rate) {
      metaLine = `avg. ${item.usage_rate}${item.unit} / day`
      if (item.is_ordered) metaLine += ' · arrives soon'
      else if (item.daysRemaining !== null) metaLine += ` · reorder at ${item.reorder_threshold_days} days`
    } else {
      metaLine = 'irregular · check-in near depletion'
    }
  } else {
    if (item.cycle_days) {
      const weeks = item.cycle_days % 7 === 0 ? `${item.cycle_days / 7} week${item.cycle_days / 7 > 1 ? 's' : ''}` : `${item.cycle_days} days`
      if (item.last_purchase_date) {
        const d = new Date(item.last_purchase_date)
        const due = new Date(d)
        due.setDate(due.getDate() + item.cycle_days)
        const dueStr = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        metaLine = `next purchase ${dueStr} · every ${weeks}`
      } else {
        metaLine = `every ${weeks}`
      }
    }
  }

  const assignee = item.nextBuyerProfile ?? item.defaultBuyerProfile
  const avatarColor = assignee?.avatar_color ?? '#B5D4F4'
  const avatarTextColor = avatarColor === '#B5D4F4' ? '#0C447C' : avatarColor === '#9FE1CB' ? '#085041' : '#1a1a18'

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `0.5px ${borderStyle} ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</span>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', ...badgeStyle[item.status] }}>
          {badgeLabel}
        </span>
      </div>

      {/* Ordered note */}
      {item.is_ordered && (
        <div style={{ fontSize: 11, color: '#0F6E56', background: '#E1F5EE', borderRadius: 6, padding: '4px 8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#0F6E56" strokeWidth="1.2"/>
            <path d="M3.5 6l2 2 3-3" stroke="#0F6E56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          purchased · optimistically restocked
        </div>
      )}

      {/* Cycle badge */}
      {item.tracking_mode === 'cycle' && !item.is_ordered && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 7px', background: '#E1F5EE', color: '#085041', borderRadius: 20, marginBottom: 8 }}>
          cycle
        </div>
      )}

      {/* Progress labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div
          style={{
            height: '100%', borderRadius: 2,
            width: `${item.progressPercent}%`,
            background: fillColor[item.status] ?? '#639922',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Meta */}
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: '0.625rem' }}>{metaLine}</div>

      {/* Assignee */}
      {assignee && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)', marginBottom: '0.75rem' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, background: avatarColor, color: avatarTextColor }}>
            {assignee.avatar_letter}
          </div>
          {assignee.display_name}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        {item.tracking_mode === 'depletion' ? (
          <>
            <button
              onClick={() => onCheckIn(item)}
              style={{ fontSize: 11, padding: '5px 10px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              check in
            </button>
            {item.is_ordered ? (
              <button
                onClick={() => onArrived(item)}
                style={{ fontSize: 11, padding: '5px 10px', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', background: 'var(--blue-bg)', color: 'var(--blue-text)', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}
              >
                mark arrived
              </button>
            ) : (
              <button
                onClick={() => onBuy(item)}
                style={{ fontSize: 11, padding: '5px 10px', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', background: 'var(--blue-bg)', color: 'var(--blue-text)', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}
              >
                buy now
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => onMarkBought(item)}
            style={{ fontSize: 11, padding: '5px 10px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            mark bought
          </button>
        )}
      </div>
    </div>
  )
}
