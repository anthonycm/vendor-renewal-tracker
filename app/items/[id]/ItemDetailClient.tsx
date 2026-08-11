'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RiskBadge from '../../components/RiskBadge'
import { daysRemaining } from '@/lib/dates'
import {
  extractionStatusLabel,
  formatDate,
  formatDateTime,
  itemTypeLabel,
  proposableFieldLabel,
  statusLabel,
} from '@/lib/format'
import { ITEM_STATUSES, PROPOSABLE_FIELDS } from '@/lib/types'
import type { ProposableField, RenewalItem } from '@/lib/types'

export default function ItemDetailClient({ id }: { id: string }) {
  const [item, setItem] = useState<RenewalItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reassessing, setReassessing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingField, setPendingField] = useState<ProposableField | null>(null)

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

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch(`/api/items/${id}/extract`, { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      // Even when extraction fails (502), the route still attaches the
      // document server-side and returns it under `item` -- reflect that so
      // the UI doesn't look stale next to what's actually saved.
      if (data.item) setItem(data.item)
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setItem(data)
      setSelectedFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleFieldAction(field: ProposableField, action: 'accept' | 'reject') {
    setPendingField(field)
    setError(null)
    try {
      const res = await fetch(`/api/items/${id}/proposed-fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Failed to ${action} ${field}`)
      setItem(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} ${field}`)
    } finally {
      setPendingField(null)
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
        <Detail label="Renewal Terms" value={item.renewal_terms || '—'} />
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

      <div className="border border-black/10 dark:border-white/10 rounded p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-medium">Source Document</h2>
          <span className="text-xs text-black/50 dark:text-white/50">
            {extractionStatusLabel(item.extraction_status)}
          </span>
        </div>

        {item.source_document_url ? (
          <a
            href={`/api/items/${id}/document`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View attached document
          </a>
        ) : (
          <p className="text-sm text-black/60 dark:text-white/60">No document attached yet.</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
            className="text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-3 py-1.5 rounded bg-black text-white dark:bg-white dark:text-black text-sm font-medium disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : item.source_document_url ? 'Replace Document' : 'Upload Document'}
          </button>
        </div>
      </div>

      {item.extraction_status === 'pending_review' && item.proposed_values && (
        <div className="border-2 border-amber-400 dark:border-amber-600 rounded p-4 space-y-4">
          <h2 className="text-sm font-medium">
            Review Extracted Values
          </h2>
          <p className="text-xs text-black/60 dark:text-white/60">
            Read from the attached document. Nothing here is saved to the record until you
            accept it, one field at a time.
          </p>
          {PROPOSABLE_FIELDS.filter((field) => item.proposed_values && field in item.proposed_values).map(
            (field) => (
              <ProposedFieldRow
                key={field}
                field={field}
                liveValue={liveValueFor(item, field)}
                proposedValue={proposedValueFor(item, field)}
                pending={pendingField === field}
                onAccept={() => handleFieldAction(field, 'accept')}
                onReject={() => handleFieldAction(field, 'reject')}
              />
            )
          )}
        </div>
      )}

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

function liveValueFor(item: RenewalItem, field: ProposableField): string {
  if (field === 'expiration_date') return formatDate(item.expiration_date)
  return item[field] || '—'
}

function proposedValueFor(item: RenewalItem, field: ProposableField): string {
  const value = item.proposed_values?.[field]
  if (!value) return '—'
  return field === 'expiration_date' ? formatDate(value) : value
}

function ProposedFieldRow({
  field,
  liveValue,
  proposedValue,
  pending,
  onAccept,
  onReject,
}: {
  field: ProposableField
  liveValue: string
  proposedValue: string
  pending: boolean
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:items-start text-sm border-t border-black/10 dark:border-white/10 pt-3 first:border-t-0 first:pt-0">
      <p className="font-medium">{proposableFieldLabel(field)}</p>
      <div>
        <p className="text-xs text-black/50 dark:text-white/50">Current</p>
        <p className="break-words">{liveValue}</p>
      </div>
      <div>
        <p className="text-xs text-black/50 dark:text-white/50">Proposed</p>
        <p className="break-words">{proposedValue}</p>
      </div>
      <div className="flex gap-2 items-start">
        <button
          onClick={onAccept}
          disabled={pending}
          className="px-2 py-1 rounded bg-green-700 text-white text-xs font-medium disabled:opacity-50"
        >
          Accept
        </button>
        <button
          onClick={onReject}
          disabled={pending}
          className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 text-xs font-medium disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
