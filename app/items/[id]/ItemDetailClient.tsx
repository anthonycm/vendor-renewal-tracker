'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RiskBadge from '../../components/RiskBadge'
import { daysRemaining } from '@/lib/dates'
import { formatDate, formatDateTime, itemTypeLabel, statusLabel } from '@/lib/format'
import { ITEM_STATUSES } from '@/lib/types'
import type { RenewalItem } from '@/lib/types'

export default function ItemDetailClient({ id }: { id: string }) {
  const [item, setItem] = useState<RenewalItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reassessing, setReassessing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  function load() {
    fetch(`/api/items/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Item not found')
        return res.json()
      })
      .then(setItem)
      .catch((err) => setError(err.message))
  }

  useEffect(load, [id])

  async function handleReassess() {
    setReassessing(true)
    setError(null)
    try {
      const res = await fetch(`/api/items/${id}/reassess`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Reassessment failed')
      }
      setItem(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reassessment failed')
    } finally {
      setReassessing(false)
    }
  }

  async function handleStatusChange(status: string) {
    if (!item) return
    setUpdatingStatus(true)
    setError(null)
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      setItem(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (error && !item) return <p className="text-red-600">{error}</p>
  if (!item) return <p className="text-sm text-black/60 dark:text-white/60">Loading…</p>

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/" className="text-sm text-black/60 dark:text-white/60 hover:underline">
        ← Dashboard
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">{item.item_name}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {itemTypeLabel(item.item_type)}
          </p>
        </div>
        <RiskBadge tier={item.risk_tier} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <Detail label="Expiration Date" value={formatDate(item.expiration_date)} />
        <Detail label="Days Remaining" value={String(daysRemaining(item.expiration_date))} />
        <Detail label="Status" value={statusLabel(item.status)} />
        <Detail label="Internal Owner" value={item.internal_owner || '—'} />
        <Detail label="Vendor Contact" value={item.vendor_contact || '—'} />
        <Detail
          label="Last Flagged"
          value={item.last_flagged_at ? formatDateTime(item.last_flagged_at) : 'Never'}
        />
      </div>

      <div>
        <h2 className="text-sm font-medium mb-1">Consequence</h2>
        <p className="text-sm text-black/80 dark:text-white/80">{item.consequence}</p>
      </div>

      <div className="border border-black/10 dark:border-white/10 rounded p-4 bg-black/[.02] dark:bg-white/[.03]">
        <h2 className="text-sm font-medium mb-1">Recommended Action</h2>
        <p className="text-sm">
          {item.recommended_action || 'Not assessed yet — click Reassess to get a recommendation.'}
        </p>
      </div>

      <div>
        <h2 className="text-sm font-medium mb-2">Renewal History</h2>
        {item.renewal_history.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No history yet.</p>
        ) : (
          <ul className="space-y-2">
            {item.renewal_history.map((entry, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{entry.date}</span> — {entry.note}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReassess}
          disabled={reassessing}
          className="px-3 py-1.5 rounded bg-black text-white dark:bg-white dark:text-black text-sm font-medium disabled:opacity-50"
        >
          {reassessing ? 'Reassessing…' : 'Reassess'}
        </button>

        <label className="flex items-center gap-2 text-sm">
          Update Status:
          <select
            value={item.status}
            disabled={updatingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="input w-auto"
          >
            {ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-black/50 dark:text-white/50">{label}</p>
      <p className="break-words">{value}</p>
    </div>
  )
}
