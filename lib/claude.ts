import Anthropic from '@anthropic-ai/sdk'
import type { ItemType, ProposedValues, RenewalHistoryEntry, RiskTier } from './types'

const SYSTEM_PROMPT = `You are helping an IT director prioritize renewal deadlines for vendor
licenses, contracts, and warranties at a tribal gaming property. Given the
details of one item, assess how urgent it actually is and recommend a next
action in two to three sentences, plain first-person operational language, not
corporate-speak. Weigh real-world consequence over date proximity alone: an
item with a severe consequence and a vendor with no history of flexibility is
more urgent than an item with a mild consequence even if its date is closer.
Use the renewal history to judge whether this vendor has been flexible in the
past. Respond with JSON only, no preamble, no markdown fences, matching this
shape: {"risk_tier": "High" | "Medium" | "Low", "recommended_action": "..."}`

const EXTRACTION_SYSTEM_PROMPT = `You are extracting specific fields from a vendor renewal document (a
contract, license, or warranty notice) for an IT director's renewal
tracker. Read the attached document and extract only what it actually
states. Respond with JSON only, no preamble, no markdown fences, matching
this shape: {"expiration_date": "YYYY-MM-DD" | null, "renewal_terms": string | null, "vendor_contact": string | null}

Field rules:
- expiration_date: the date this document states the item expires or is
  due for renewal, formatted as YYYY-MM-DD. If the document only gives a
  partial date (for example a month and year with no day), return null
  rather than guessing a day.
- renewal_terms: any auto-renew clause, notice period, or grace period
  language the document states, summarized in one or two plain sentences.
  Null if the document does not address renewal terms.
- vendor_contact: a name, email, phone number, or department the document
  lists as the point of contact for this vendor. Null if none is given.

Do not guess, infer, or estimate a value that is not actually written in
the document. A field you cannot find is null, not your best guess.`

export interface AssessRenewalUrgencyInput {
  item_name: string
  item_type: ItemType
  expiration_date: string
  days_remaining: number
  consequence: string
  renewal_history: RenewalHistoryEntry[]
}

export interface AssessRenewalUrgencyResult {
  risk_tier: RiskTier
  recommended_action: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function assessRenewalUrgency(
  input: AssessRenewalUrgencyInput
): Promise<AssessRenewalUrgencyResult> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    throw new Error('Unexpected response content type from Claude')
  }

  // Claude is asked to respond with bare JSON, but sometimes wraps it in
  // markdown fences anyway — strip those defensively before parsing.
  const jsonText = block.text
    .trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')

  const parsed = JSON.parse(jsonText) as {
    risk_tier: string
    recommended_action: string
  }

  const riskTier = parsed.risk_tier.toLowerCase() as RiskTier
  if (!['high', 'medium', 'low'].includes(riskTier)) {
    throw new Error(`Unexpected risk_tier from Claude: ${parsed.risk_tier}`)
  }

  return { risk_tier: riskTier, recommended_action: parsed.recommended_action }
}

// Reads an uploaded PDF and proposes values for the fields it actually
// states. Never writes to the record of truth itself — the caller is
// responsible for storing the result as a pending proposal.
export async function extractDocumentTerms(
  pdfBase64: string
): Promise<ProposedValues> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: 'Extract the fields described in your instructions from this document.',
          },
        ],
      },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    throw new Error('Unexpected response content type from Claude')
  }

  const jsonText = block.text
    .trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')

  const parsed = JSON.parse(jsonText) as ProposedValues

  return {
    expiration_date: parsed.expiration_date ?? null,
    renewal_terms: parsed.renewal_terms ?? null,
    vendor_contact: parsed.vendor_contact ?? null,
  }
}
