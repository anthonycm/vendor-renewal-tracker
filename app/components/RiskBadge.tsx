import type { RiskTier } from '@/lib/types'

const STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  low: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  none: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

export default function RiskBadge({ tier }: { tier: RiskTier | null }) {
  const key = tier ?? 'none'
  const label = tier ? tier[0].toUpperCase() + tier.slice(1) : 'Not assessed'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STYLES[key]}`}>
      {label}
    </span>
  )
}
