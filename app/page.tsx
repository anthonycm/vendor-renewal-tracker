'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RiskBadge from './components/RiskBadge'
import { daysRemaining } from '@/lib/dates'
import { computeStats } from '@/lib/stats'
import { formatDate, itemTypeLabel, statusLabel } from '@/lib/format'
import type { RenewalItem } from '@/lib/types'

export default function DashboardPage() {
  const [items, setItems] = useState<RenewalItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/items')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load items')
        return res.json()
      })
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!items) return <p className="text-sm text-black/60 dark:text-white/60">Loading…</p>

  const stats = computeStats(items)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/items/new"
            className="px-3 py-1.5 rounded bg-black text-white dark:bg-white dark:text-black text-sm font-medium"
          >
            + Add New Item
          </Link>
          <Link
            href="/report"
            className="px-3 py-1.5 rounded border border-black/20 dark:border-white/20 text-sm font-medium"
          >
            Generate Report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Tracked Items" value={stats.tracked_count} />
        <StatTile label="High Risk" value={stats.high_risk_count} />
        <StatTile label="Due Within 60 Days" value={stats.due_within_60_count} />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          No items tracked yet. Add your first one to get started.
        </p>
      ) : (
        <div className="divide-y divide-black/10 dark:divide-white/10 border border-black/10 dark:border-white/10 rounded">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-black/[.03] dark:hover:bg-white/[.05]"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{item.item_name}</p>
                <p className="text-xs text-black/60 dark:text-white/60">
                  {itemTypeLabel(item.item_type)} · {statusLabel(item.status)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right text-xs text-black/60 dark:text-white/60">
                  <p>{formatDate(item.expiration_date)}</p>
                  <p>{daysRemaining(item.expiration_date)} days</p>
                </div>
                <RiskBadge tier={item.risk_tier} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-black/10 dark:border-white/10 rounded px-4 py-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-black/60 dark:text-white/60">{label}</p>
    </div>
  )
}
