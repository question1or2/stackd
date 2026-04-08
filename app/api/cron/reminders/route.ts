import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeItemStatus } from '@/lib/utils'
import { Item } from '@/lib/types'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

async function sendMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: false }),
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('notify_enabled', true)
    .eq('is_archived', false)
    .eq('is_ordered', false)

  if (!items?.length) return NextResponse.json({ sent: 0 })

  const needsBuying = (items as Item[]).filter(item => {
    const { status } = computeItemStatus(item)
    return status === 'warning' || status === 'urgent'
  })

  if (!needsBuying.length) return NextResponse.json({ sent: 0 })

  const householdIds = [...new Set(needsBuying.map(i => i.household_id))]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('household_id', householdIds)
    .not('telegram_chat_id', 'is', null)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const item of needsBuying) {
    const householdProfiles = profiles.filter(p => p.household_id === item.household_id)
    if (!householdProfiles.length) continue

    const { daysRemaining, status } = computeItemStatus(item)
    const urgencyEmoji = status === 'urgent' ? '🔴' : '🟡'

    const buyerProfile = householdProfiles.find(
      p => p.id === (item.next_buyer ?? item.default_buyer)
    )
    const buyerName = buyerProfile?.display_name
      ?? (item.alternate_buyer ? 'Alternating' : null)

    const daysText =
      daysRemaining === null ? 'needs restocking'
      : daysRemaining <= 0 ? 'out today'
      : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`

    let msg = `${urgencyEmoji} <b>${item.name}</b> — ${daysText}\n`
    if (buyerName) msg += `👤 Buyer: ${buyerName}\n`
    if (item.last_price) msg += `💰 Last price: ₩${item.last_price.toLocaleString()}\n`
    if (item.usage_rate && item.unit) {
      const qty = item.usage_rate * 30
      msg += `📦 Suggested qty: ${qty.toLocaleString()}${item.unit}\n`
    }
    if (item.product_url) msg += `🔗 <a href="${item.product_url}">Buy now</a>`

    for (const profile of householdProfiles) {
      if (!profile.telegram_chat_id) continue
      await sendMessage(profile.telegram_chat_id, msg)
      sent++
    }
  }

  return NextResponse.json({ sent })
}
