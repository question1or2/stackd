'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Profile, Item, ItemWithComputed } from '@/lib/types'
import { enrichItem } from '@/lib/utils'
import CategoryGroup from './CategoryGroup'
import ItemCard from './ItemCard'
import ReminderCard from './ReminderCard'
import AddItemModal from './modals/AddItemModal'
import AddCategoryModal from './modals/AddCategoryModal'
import CheckinModal from './modals/CheckinModal'
import BuyModal from './modals/BuyModal'
import ArrivedModal from './modals/ArrivedModal'
import Toast from './Toast'

interface DashboardClientProps {
  initialItems: ItemWithComputed[]
  categories: Category[]
  profiles: Profile[]
  householdId: string
  currentUserId: string
  grouped: Record<string, ItemWithComputed[]>
  uncategorized: ItemWithComputed[]
  reminders: ItemWithComputed[]
}

type ModalState =
  | { type: 'checkin'; item: ItemWithComputed }
  | { type: 'buy'; item: ItemWithComputed }
  | { type: 'arrived'; item: ItemWithComputed }
  | { type: 'add' }
  | { type: 'addCategory' }
  | null

export default function DashboardClient({
  initialItems,
  categories: initialCategories,
  profiles,
  householdId,
  grouped: initialGrouped,
  uncategorized: initialUncategorized,
  reminders: initialReminders,
}: DashboardClientProps) {
  const [items, setItems] = useState<ItemWithComputed[]>(initialItems)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Recompute groupings from current items/categories
  const grouped: Record<string, ItemWithComputed[]> = {}
  const uncategorized: ItemWithComputed[] = []
  for (const item of items) {
    if (item.category_id) {
      if (!grouped[item.category_id]) grouped[item.category_id] = []
      grouped[item.category_id].push(item)
    } else {
      uncategorized.push(item)
    }
  }
  const reminders = items.filter(i => i.status === 'warning' || i.status === 'urgent')

  const refreshItems = useCallback(async () => {
    const supabase = createClient()
    const [{ data: rawItems }, { data: cats }] = await Promise.all([
      supabase
        .from('items')
        .select('*')
        .eq('household_id', householdId)
        .eq('is_archived', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('categories')
        .select('*')
        .eq('household_id', householdId)
        .order('sort_order', { ascending: true }),
    ])
    const allCategories = cats ?? []
    setCategories(allCategories)
    setItems((rawItems ?? []).map((item: Item) => enrichItem(item, allCategories, profiles)))
  }, [householdId, profiles])

  // Supabase realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`household:${householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `household_id=eq.${householdId}` }, () => {
        refreshItems()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `household_id=eq.${householdId}` }, () => {
        refreshItems()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [householdId, refreshItems])

  function showToast(msg: string) {
    setToast(msg)
  }

  return (
    <>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Household supplies
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setModal({ type: 'addCategory' })}
            style={{ fontSize: 12, color: 'var(--text-2)', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '4px 12px', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2, #eee)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            + category
          </button>
          <button
            onClick={() => setModal({ type: 'add' })}
            style={{ fontSize: 12, color: 'var(--blue)', border: '0.5px solid var(--blue)', borderRadius: 'var(--radius)', padding: '4px 12px', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            + add item
          </button>
        </div>
      </div>

      {/* Category groups */}
      {categories.map(cat => {
        const catItems = grouped[cat.id]
        if (!catItems?.length) return null
        return (
          <CategoryGroup
            key={cat.id}
            category={cat}
            items={catItems}
            onCheckIn={item => setModal({ type: 'checkin', item })}
            onBuy={item => setModal({ type: 'buy', item })}
            onArrived={item => setModal({ type: 'arrived', item })}
            onMarkBought={item => setModal({ type: 'checkin', item })}
          />
        )
      })}

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📦</div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Other</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {uncategorized.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onCheckIn={i => setModal({ type: 'checkin', item: i })}
                onBuy={i => setModal({ type: 'buy', item: i })}
                onArrived={i => setModal({ type: 'arrived', item: i })}
                onMarkBought={i => setModal({ type: 'checkin', item: i })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 32, marginBottom: '0.75rem' }}>📦</div>
          <p style={{ fontSize: 14, marginBottom: '0.5rem' }}>No items yet.</p>
          <p style={{ fontSize: 12 }}>Add your first household supply item to start tracking.</p>
        </div>
      )}

      {/* Divider + Reminders */}
      {reminders.length > 0 && (
        <>
          <div style={{ height: '0.5px', background: 'var(--border)', margin: '2rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Active reminders
            </span>
          </div>
          {reminders.map(item => (
            <ReminderCard
              key={item.id}
              item={item}
              onBuy={i => setModal({ type: 'buy', item: i })}
            />
          ))}
        </>
      )}

      {/* Add Category Modal */}
      {modal?.type === 'addCategory' && (
        <AddCategoryModal
          householdId={householdId}
          onClose={() => setModal(null)}
          onSuccess={(msg: string) => { showToast(msg); refreshItems() }}
        />
      )}

      {/* Modals */}
      {modal?.type === 'add' && (
        <AddItemModal
          categories={categories}
          profiles={profiles}
          householdId={householdId}
          onClose={() => { setModal(null); refreshItems() }}
          onSuccess={msg => { showToast(msg); refreshItems() }}
        />
      )}
      {modal?.type === 'checkin' && (
        <CheckinModal
          item={modal.item}
          onClose={() => { setModal(null); refreshItems() }}
          onSuccess={msg => { showToast(msg); refreshItems() }}
        />
      )}
      {modal?.type === 'buy' && (
        <BuyModal
          item={modal.item}
          onClose={() => { setModal(null); refreshItems() }}
          onSuccess={msg => { showToast(msg); refreshItems() }}
        />
      )}
      {modal?.type === 'arrived' && (
        <ArrivedModal
          item={modal.item}
          onClose={() => { setModal(null); refreshItems() }}
          onSuccess={msg => { showToast(msg); refreshItems() }}
        />
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
