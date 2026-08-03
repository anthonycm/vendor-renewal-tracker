import Anthropic from '@anthropic-ai/sdk'
import type { ItemType, RenewalHistoryEntry, RiskTier } from './types'

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
