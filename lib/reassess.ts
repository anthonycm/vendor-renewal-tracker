import { supabaseAdmin } from './supabase'
import { assessRenewalUrgency } from './claude'
import { daysRemaining } from './dates'
import type { RenewalItem } from './types'

// Shared by the Add New Item flow, the Reassess button, and the daily cron
// scan. Calls Claude for one item and writes the verdict back to the row.
export async function reassessItem(item: RenewalItem): Promise<RenewalItem> {
  const result = await assessRenewalUrgency({
    item_name: item.item_name,
    item_type: item.item_type,
    expiration_date: item.expiration_date,
    days_remaining: daysRemaining(item.expiration_date),
    consequence: item.consequence,
    renewal_history: item.renewal_history,
  })

  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('renewal_items')
    .update({
      risk_tier: result.risk_tier,
      recommended_action: result.recommended_action,
      last_flagged_at: now,
      updated_at: now,
    })
    .eq('id', item.id)
    .select()
    .single()

  if (error) throw error
  return data as RenewalItem
}
