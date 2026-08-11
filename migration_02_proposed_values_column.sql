-- Capstone feature: document upload + AI term extraction, part 2
-- Run once in Supabase Studio: Database > SQL Editor > New query > Run

-- Proposed values sit here, separate from the live fields, until a human
-- accepts or rejects each one individually in the review UI.
alter table renewal_items
  add column proposed_values jsonb;
