-- Capstone feature: document upload + AI term extraction
-- Run once in Supabase Studio: Database > SQL Editor > New query > Run

-- 1. Two new columns on renewal_items
alter table renewal_items
  add column source_document_url text,
  add column extraction_status text not null default 'not_extracted'
    check (extraction_status in ('not_extracted', 'pending_review', 'reviewed'));

-- 2. Private storage bucket for renewal documents.
-- public = false, so files are not reachable by a bare URL; only the
-- server-side service role key (which bypasses RLS) can read or write them.
insert into storage.buckets (id, name, public)
values ('renewal-documents', 'renewal-documents', false)
on conflict (id) do nothing;
