import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { reassessItem } from '@/lib/reassess'
import type { RenewalItem } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: item, error } = await supabaseAdmin
    .from('renewal_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  try {
    const updated = await reassessItem(item as RenewalItem)
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Reassessment failed:', err)
    return NextResponse.json({ error: 'Reassessment failed' }, { status: 502 })
  }
}
