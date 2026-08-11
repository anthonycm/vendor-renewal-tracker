export type ItemType =
  | 'software_license'
  | 'vendor_contract'
  | 'hardware_warranty'
  | 'gaming_license'

export type RiskTier = 'high' | 'medium' | 'low'

export type ItemStatus =
  | 'not_started'
  | 'paperwork_prepped'
  | 'pending_signoff'
  | 'submitted_to_vendor'
  | 'renewed'

export type ExtractionStatus = 'not_extracted' | 'pending_review' | 'reviewed'

export interface RenewalHistoryEntry {
  date: string
  note: string
}

export interface ProposedValues {
  expiration_date: string | null
  renewal_terms: string | null
  vendor_contact: string | null
}

export interface RenewalItem {
  id: string
  item_name: string
  item_type: ItemType
  expiration_date: string
  consequence: string
  risk_tier: RiskTier | null
  recommended_action: string | null
  status: ItemStatus
  internal_owner: string | null
  vendor_contact: string | null
  renewal_history: RenewalHistoryEntry[]
  last_flagged_at: string | null
  source_document_url: string | null
  extraction_status: ExtractionStatus
  proposed_values: ProposedValues | null
  created_at: string
  updated_at: string
}

export const ITEM_TYPES: ItemType[] = [
  'software_license',
  'vendor_contract',
  'hardware_warranty',
  'gaming_license',
]

export const ITEM_STATUSES: ItemStatus[] = [
  'not_started',
  'paperwork_prepped',
  'pending_signoff',
  'submitted_to_vendor',
  'renewed',
]
