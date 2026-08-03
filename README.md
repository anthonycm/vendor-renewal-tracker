# Vendor & License Renewal Tracker

A single-user tracker for vendor contracts, software licenses, hardware warranties,
and gaming licenses at a tribal gaming property — built to replace a manual
spreadsheet-and-memory process for staying ahead of renewal deadlines.

Live: https://vendor-renewal-tracker-seven.vercel.app

## What it does

- **Dashboard** (`/`) — every tracked item, sorted by risk (high first) then days
  remaining, with tracked/high-risk/due-within-60-days counts.
- **Add New Item** (`/items/new`) — intake form for a new renewal item.
- **Item Detail** (`/items/[id]`) — full record, recommended action, renewal
  history, Reassess button, status control.
- **Status Report** (`/report`) — read-only snapshot for handoff/audit.

## Scheduled vs. on-demand

- **Scheduled**: a Vercel Cron job (`GET /api/cron/daily-scan`, daily at 13:00
  UTC via `vercel.json`) scans every open item, and for anything within 60 days
  that hasn't been flagged in the last 24 hours, calls the shared assessment
  function and writes the verdict back.
- **On-demand**: Add Item, Update Status, Generate Report, and the Reassess
  button (`POST /api/items/[id]/reassess`) — all plain, deterministic reads
  and writes with no Claude call, except Reassess, which triggers the same
  assessment function as the cron job, immediately, for one item.

## The agentic step

Urgency here isn't just "how many days are left" — it's days left weighed
against how bad the consequence is and whether this specific vendor has been
flexible before. That's a judgment call, not a threshold, so
`assessRenewalUrgency()` (`lib/claude.ts`) hands the item plus its renewal
history to Claude (`claude-haiku-4-5-20251001`) and gets back a risk tier and
a plain-language recommended action — fixed if/else logic can't weigh
"severe consequence, no vendor flexibility" against "mild consequence, tight
date" the way a person actually would.

## Local development

```bash
npm install
npm run dev
```

Requires a `.env.local` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`ANTHROPIC_API_KEY`, and `CRON_SECRET` — see `.env.example`.
