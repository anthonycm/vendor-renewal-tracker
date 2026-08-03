import { daysRemaining } from './dates'
import type { RenewalItem } from './types'

export function computeStats(items: RenewalItem[]) {
  return {
    tracked_count: items.length,
    high_risk_count: items.filter((i) => i.risk_tier === 'high').length,
    due_within_60_count: items.filter(
      (i) => i.status !== 'renewed' && daysRemaining(i.expiration_date) <= 60
    ).length,
  }
}
