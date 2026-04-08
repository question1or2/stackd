import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const body = await req.json()
  const message = body?.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId: number = message.chat.id
  const text: string = message.text ?? ''

  if (text.startsWith('/start')) {
    const userId = text.split(' ')[1]?.trim()

    if (!userId) {
      await sendMessage(chatId, 'Open the Stockd app and tap "Enable Telegram reminders" to connect your account.')
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('profiles')
      .update({ telegram_chat_id: chatId.toString() })
      .eq('id', userId)

    if (error) {
      await sendMessage(chatId, `❌ Error: ${error.message}`)
    } else {
      await sendMessage(chatId, "✅ Connected! You'll get daily reminders here when items need restocking.")
    }
  }

  return NextResponse.json({ ok: true })
}
