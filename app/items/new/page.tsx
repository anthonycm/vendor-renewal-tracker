'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ITEM_TYPES } from '@/lib/types'
import { itemTypeLabel } from '@/lib/format'

export default function AddNewItemPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body = {
      item_name: form.get('item_name'),
      item_type: form.get('item_type'),
      expiration_date: form.get('expiration_date'),
      consequence: form.get('consequence'),
      internal_owner: form.get('internal_owner') || null,
      vendor_contact: form.get('vendor_contact') || null,
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create item')
      }
      const created = await res.json()
      router.push(`/items/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Add New Item</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Item Name">
          <input
            name="item_name"
            required
            className="input"
            placeholder="Vendor A - Gaming License"
          />
        </Field>

        <Field label="Item Type">
          <select name="item_type" required className="input">
            <option value="">Select a type…</option>
            {ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {itemTypeLabel(type)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Expiration Date">
          <input type="date" name="expiration_date" required className="input" />
        </Field>

        <Field label="Consequence" hint="What happens if this lapses?">
          <textarea
            name="consequence"
            required
            rows={3}
            className="input"
            placeholder="Vendor cannot process transactions with us until license is renewed."
          />
        </Field>

        <Field label="Internal Owner" hint="Optional">
          <input name="internal_owner" className="input" />
        </Field>

        <Field label="Vendor Contact" hint="Optional">
          <input name="vendor_contact" className="input" />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-black text-white dark:bg-white dark:text-black text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add Item'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="block text-xs text-black/50 dark:text-white/50">{hint}</span>}
      {children}
    </label>
  )
}
