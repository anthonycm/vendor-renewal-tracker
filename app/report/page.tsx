'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RiskBadge from '../components/RiskBadge'
import { daysRemaining } from '@/lib/dates'
import { formatDate, formatDateTime, itemTypeLabel, statusLabel } from '@/lib/format'
import type { RenewalItem } from '@/lib/types'

interface ReportData {
  generated_at: string
  tracked_count: number
  high_risk_count: number
  due_within_60_count: number
  items: RenewalItem[]
}

export default function StatusReportPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/report')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load report')
        return res.json()
      })
      .then(setReport)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!report) return <p className="text-sm text-black/60 dark:text-white/60">Loading…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Status Report</h1>
        <p className="text-xs text-black/50 dark:text-white/50">
          Generated {formatDateTime(report.generated_at)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Tracked Items" value={report.tracked_count} />
        <StatTile label="High Risk" value={report.high_risk_count} />
        <StatTile label="Due Within 60 Days" value={report.due_within_60_count} />
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-xs text-black/50 dark:text-white/50 border-b border-black/10 dark:border-white/10">
            <th className="py-2 pr-2 font-medium">Item</th>
            <th className="py-2 pr-2 font-medium">Type</th>
            <th className="py-2 pr-2 font-medium">Expires</th>
            <th className="py-2 pr-2 font-medium">Days</th>
            <th className="py-2 pr-2 font-medium">Risk</th>
            <th className="py-2 pr-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {report.items.map((item) => (
            <tr key={item.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2 pr-2">
                <Link href={`/items/${item.id}`} className="hover:underline">
                  {item.item_name}
                </Link>
              </td>
              <td className="py-2 pr-2">{itemTypeLabel(item.item_type)}</td>
              <td className="py-2 pr-2">{formatDate(item.expiration_date)}</td>
              <td className="py-2 pr-2">{daysRemaining(item.expiration_date)}</td>
              <td className="py-2 pr-2">
                <RiskBadge tier={item.risk_tier} />
              </td>
              <td className="py-2 pr-2">{statusLabel(item.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {report.items.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">No items tracked yet.</p>
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
