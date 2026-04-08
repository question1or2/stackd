'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function confirmPurchase(itemId: string, price: number, quantity: number) {
  if (quantity < 0) throw new Error('Quantity cannot be negative')
  if (price < 0) throw new Error('Price cannot be negative')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  // Get current item to compute optimistic restock
  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (!item) throw new Error('Item not found')

  const optimisticStock = (item.current_stock ?? 0) + quantity

  await supabase
    .from('items')
    .update({
      is_ordered: true,
      ordered_quantity: quantity,
      ordered_at: new Date().toISOString(),
      last_price: price,
      current_stock: optimisticStock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  await supabase
    .from('purchases')
    .insert({
      item_id: itemId,
      buyer_id: profile?.id ?? null,
      quantity,
      price,
      ordered_at: new Date().toISOString(),
    })

  revalidatePath('/dashboard')
}

export async function markArrived(itemId: string, receivedQty: number) {
  if (receivedQty < 0) throw new Error('Received quantity cannot be negative')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('items')
    .update({
      is_ordered: false,
      current_stock: receivedQty,
      ordered_quantity: null,
      ordered_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  // Update purchase arrived_at
  await supabase
    .from('purchases')
    .update({ arrived_at: new Date().toISOString() })
    .eq('item_id', itemId)
    .is('arrived_at', null)

  revalidatePath('/dashboard')
}

export async function checkIn(itemId: string, stockAmount: number) {
  if (stockAmount < 0) throw new Error('Stock amount cannot be negative')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  await supabase
    .from('items')
    .update({
      current_stock: stockAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  await supabase
    .from('check_ins')
    .insert({
      item_id: itemId,
      user_id: profile?.id ?? user.id,
      stock_amount: stockAmount,
    })

  revalidatePath('/dashboard')
}

export async function markBought(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = new Date().toISOString().split('T')[0]

  await supabase
    .from('items')
    .update({
      last_purchase_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  revalidatePath('/dashboard')
}

export async function addItem(formData: {
  name: string
  category_id: string | null
  tracking_mode: 'depletion' | 'cycle'
  unit: string
  current_stock?: number | null
  usage_rate?: number | null
  cycle_days?: number | null
  last_purchase_date?: string | null
  product_url?: string | null
  last_price?: number | null
  default_buyer?: string | null
  alternate_buyer?: boolean
  household_id: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('items').insert({
    ...formData,
    reorder_threshold_days: 5,
    is_ordered: false,
    is_archived: false,
  })

  revalidatePath('/dashboard')
}

export async function updateCategoryName(categoryId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('categories')
    .update({ name })
    .eq('id', categoryId)

  revalidatePath('/dashboard')
}

export async function toggleItemNotify(itemId: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('items')
    .update({ notify_enabled: enabled })
    .eq('id', itemId)

  revalidatePath('/dashboard')
}

export async function addCategory(householdId: string, name: string, icon: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data } = await supabase
    .from('categories')
    .insert({ household_id: householdId, name, icon })
    .select('id')
    .single()

  revalidatePath('/dashboard')
  return data?.id
}
