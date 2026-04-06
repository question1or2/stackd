import { Item, ItemWithComputed, ItemStatus, Profile, Category } from './types'

export function computeItemStatus(item: Item): { daysRemaining: number | null; status: ItemStatus; progressPercent: number } {
  if (item.is_ordered) {
    return { daysRemaining: null, status: 'ordered', progressPercent: 90 }
  }

  if (item.tracking_mode === 'depletion') {
    if (!item.current_stock || !item.usage_rate) {
      return { daysRemaining: null, status: 'ok', progressPercent: 50 }
    }
    const days = Math.floor(item.current_stock / item.usage_rate)
    const threshold = item.reorder_threshold_days || 5
    const status: ItemStatus = days <= threshold ? (days <= 2 ? 'urgent' : 'warning') : 'ok'
    const maxDays = 30
    const progressPercent = Math.min(100, Math.round((days / maxDays) * 100))
    return { daysRemaining: days, status, progressPercent }
  } else {
    // cycle mode
    if (!item.last_purchase_date || !item.cycle_days) {
      return { daysRemaining: null, status: 'ok', progressPercent: 0 }
    }
    const lastPurchase = new Date(item.last_purchase_date)
    const nextDue = new Date(lastPurchase)
    nextDue.setDate(nextDue.getDate() + item.cycle_days)
    const today = new Date()
    const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const threshold = item.reorder_threshold_days || 5
    const status: ItemStatus = daysUntilDue <= threshold ? (daysUntilDue <= 2 ? 'urgent' : 'warning') : 'ok'
    const elapsed = item.cycle_days - daysUntilDue
    const progressPercent = Math.max(0, Math.min(100, Math.round((elapsed / item.cycle_days) * 100)))
    return { daysRemaining: daysUntilDue, status, progressPercent }
  }
}

export function enrichItem(
  item: Item,
  categories: Category[],
  profiles: Profile[]
): ItemWithComputed {
  const computed = computeItemStatus(item)
  return {
    ...item,
    ...computed,
    category: categories.find(c => c.id === item.category_id),
    defaultBuyerProfile: profiles.find(p => p.id === item.default_buyer),
    nextBuyerProfile: profiles.find(p => p.id === item.next_buyer),
  }
}

export function formatStock(amount: number | null, unit: string): string {
  if (amount === null) return '—'
  return `${amount.toLocaleString()}${unit}`
}

export function formatPrice(price: number | null): string {
  if (price === null) return '—'
  return `₩${price.toLocaleString()}`
}

export function daysLabel(days: number | null, mode: 'depletion' | 'cycle'): string {
  if (days === null) return '—'
  if (mode === 'cycle') return `reorder in ${days} days`
  if (days === 0) return 'out today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}
