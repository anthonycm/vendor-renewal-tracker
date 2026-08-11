function titleCase(value: string): string {
  return value
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

export const itemTypeLabel = titleCase
export const statusLabel = titleCase
export const extractionStatusLabel = titleCase

const PROPOSABLE_FIELD_LABELS: Record<string, string> = {
  expiration_date: 'Expiration Date',
  renewal_terms: 'Renewal Terms',
  vendor_contact: 'Vendor Contact',
}

export function proposableFieldLabel(field: string): string {
  return PROPOSABLE_FIELD_LABELS[field] ?? titleCase(field)
}

export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
