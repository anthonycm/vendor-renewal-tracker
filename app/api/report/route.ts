import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sortByRiskThenDays } from '@/lib/sort'
import { computeStats } from '@/lib/stats'
import type { RenewalItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin.from('renewal_items').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = sortByRiskThenDays(data as RenewalItem[])

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    ...computeStats(items),
    items,
  })
}
