import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { enrichItem } from '@/lib/utils'
import { Category, Item, Profile } from '@/lib/types'
import CategoryGroup from '@/components/CategoryGroup'
import ReminderCard from '@/components/ReminderCard'
import AddItemModal from '@/components/modals/AddItemModal'
import Toast from '@/components/Toast'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-2)' }}>
        <p>You&apos;re not part of a household yet. Please sign up again and set up your household.</p>
      </div>
    )
  }

  const [{ data: rawItems }, { data: categories }, { data: profiles }] = await Promise.all([
    supabase
      .from('items')
      .select('*')
      .eq('household_id', profile.household_id)
      .eq('is_archived', false)
      .order('created_at', { ascending: true }),
    supabase
      .from('categories')
      .select('*')
      .eq('household_id', profile.household_id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('profiles')
      .select('*')
      .eq('household_id', profile.household_id),
  ])

  const allCategories: Category[] = categories ?? []
  const allProfiles: Profile[] = profiles ?? []
  const items = (rawItems ?? []).map((item: Item) => enrichItem(item, allCategories, allProfiles))

  const reminders = items.filter(i => i.status === 'warning' || i.status === 'urgent')

  // Group items by category
  const grouped: Record<string, typeof items> = {}
  const uncategorized: typeof items = []

  for (const item of items) {
    if (item.category_id) {
      if (!grouped[item.category_id]) grouped[item.category_id] = []
      grouped[item.category_id].push(item)
    } else {
      uncategorized.push(item)
    }
  }

  return (
    <DashboardClient
      initialItems={items}
      categories={allCategories}
      profiles={allProfiles}
      householdId={profile.household_id}
      currentUserId={user.id}
      grouped={grouped}
      uncategorized={uncategorized}
      reminders={reminders}
    />
  )
}
