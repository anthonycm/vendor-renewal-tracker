import { daysRemaining } from './dates'
import type { RenewalItem, RiskTier } from './types'

const RISK_RANK: Record<RiskTier, number> = { high: 0, medium: 1, low: 2 }

// High risk first, then soonest-expiring first within a tier. Unassessed
// (null risk_tier) items sort after low.
export function sortByRiskThenDays(items: RenewalItem[]): RenewalItem[] {
  return [...items].sort((a, b) => {
    const rankA = a.risk_tier ? RISK_RANK[a.risk_tier] : 3
    const rankB = b.risk_tier ? RISK_RANK[b.risk_tier] : 3
    if (rankA !== rankB) return rankA - rankB
    return daysRemaining(a.expiration_date) - daysRemaining(b.expiration_date)
  })
}
