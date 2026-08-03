import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sortByRiskThenDays } from '@/lib/sort'
import { reassessItem } from '@/lib/reassess'
import type { RenewalItem } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  const { data, error } = await supabaseAdmin.from('renewal_items').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(sortByRiskThenDays(data as RenewalItem[]))
}

export async function POST(request: Request) {
  const body = await request.json()
  const { item_name, item_type, expiration_date, consequence, internal_owner, vendor_contact } = body

  if (!item_name || !item_type || !expiration_date || !consequence) {
    return NextResponse.json(
      { error: 'item_name, item_type, expiration_date, and consequence are required' },
      { status: 400 }
    )
  }

  const { data: inserted, error } = await supabaseAdmin
    .from('renewal_items')
    .insert({
      item_name,
      item_type,
      expiration_date,
      consequence,
      internal_owner: internal_owner || null,
      vendor_contact: vendor_contact || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const reassessed = await reassessItem(inserted as RenewalItem)
    return NextResponse.json(reassessed, { status: 201 })
  } catch (err) {
    // The item still exists even if the initial assessment fails (e.g. Claude
    // key not configured yet) — it can be reassessed later from the detail page.
    console.error('Initial reassessment failed:', err)
    return NextResponse.json(inserted, { status: 201 })
  }
}
