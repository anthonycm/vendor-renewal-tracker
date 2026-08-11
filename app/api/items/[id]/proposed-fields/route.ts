import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PROPOSABLE_FIELDS, type ProposableField, type RenewalItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Accepts or rejects exactly one proposed field at a time. There is no bulk
// endpoint here on purpose -- the review UI never offers an "accept all"
// control, so there is nothing that should call this for more than one
// field per request.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { field, action } = body as { field?: string; action?: string }

  if (!PROPOSABLE_FIELDS.includes(field as ProposableField)) {
    return NextResponse.json({ error: 'Unknown field' }, { status: 400 })
  }
  if (action !== 'accept' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be accept or reject' }, { status: 400 })
  }

  const { data: item, error: fetchError } = await supabaseAdmin
    .from('renewal_items')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const proposed = (item as RenewalItem).proposed_values
  const key = field as ProposableField

  if (!proposed || !(key in proposed)) {
    return NextResponse.json({ error: 'No proposed value for that field' }, { status: 400 })
  }

  const remaining = { ...proposed }
  delete remaining[key]
  const stillPending = Object.keys(remaining).length > 0

  const updates: Record<string, unknown> = {
    proposed_values: stillPending ? remaining : null,
    extraction_status: stillPending ? 'pending_review' : 'reviewed',
    updated_at: new Date().toISOString(),
  }

  // Rejecting leaves the live field untouched -- only accept writes through.
  if (action === 'accept') {
    updates[key] = proposed[key]
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('renewal_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(updated as RenewalItem)
}
