-- Capstone feature: document upload + AI term extraction, part 3
-- Run once in Supabase Studio: Database > SQL Editor > New query > Run

-- Live field for the auto-renew / notice-period / grace-period language a
-- document states. Kept separate from renewal_history, which logs what
-- actually happened at each past renewal and feeds the daily risk
-- assessment's judgment of vendor flexibility -- mixing contract boilerplate
-- into that log would dilute that signal.
alter table renewal_items
  add column renewal_terms text;
