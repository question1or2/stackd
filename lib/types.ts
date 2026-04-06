export type TrackingMode = 'depletion' | 'cycle'
export type ItemStatus = 'ok' | 'warning' | 'urgent' | 'ordered'

export interface Household {
  id: string
  name: string
  invite_code: string
}

export interface Profile {
  id: string
  household_id: string
  display_name: string
  avatar_letter: string
  avatar_color: string
}

export interface Category {
  id: string
  household_id: string
  name: string
  icon: string
  sort_order: number
}

export interface Item {
  id: string
  household_id: string
  category_id: string | null
  name: string
  tracking_mode: TrackingMode
  unit: string
  current_stock: number | null
  usage_rate: number | null
  reorder_threshold_days: number
  cycle_days: number | null
  last_purchase_date: string | null
  product_url: string | null
  last_price: number | null
  default_buyer: string | null
  alternate_buyer: boolean
  next_buyer: string | null
  is_ordered: boolean
  ordered_quantity: number | null
  ordered_at: string | null
  is_archived: boolean
}

export interface Purchase {
  id: string
  item_id: string
  buyer_id: string | null
  quantity: number | null
  price: number | null
  ordered_at: string
  arrived_at: string | null
}

export interface CheckIn {
  id: string
  item_id: string
  user_id: string
  stock_amount: number | null
  created_at: string
}

// Computed
export interface ItemWithComputed extends Item {
  daysRemaining: number | null
  status: ItemStatus
  progressPercent: number
  category?: Category
  defaultBuyerProfile?: Profile
  nextBuyerProfile?: Profile
}
