import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { reassessItem } from '@/lib/reassess'
import { daysRemaining, isStale } from '@/lib/dates'
import type { RenewalItem } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('renewal_items')
    .select('*')
    .neq('status', 'renewed')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = data as RenewalItem[]
  const eligible = items.filter(
    (item) =>
      daysRemaining(item.expiration_date) <= 60 && isStale(item.last_flagged_at)
  )

  const updated = []
  for (const item of eligible) {
    try {
      const result = await reassessItem(item)
      updated.push({
        id: result.id,
        item_name: result.item_name,
        risk_tier: result.risk_tier,
      })
    } catch (err) {
      console.error(`Reassessment failed for item ${item.id}:`, err)
      updated.push({ id: item.id, item_name: item.item_name, error: 'reassessment failed' })
    }
  }

  return NextResponse.json({
    scanned: items.length,
    flagged: eligible.length,
    updated,
  })
}
