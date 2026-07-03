-- =============================================================================
-- Rendorax P1 — comment author display columns
-- =============================================================================
-- Target: same Supabase project as supabase-p0-legacy-review-tables.sql
-- Scope:  video_comments.author_display_name, author_avatar_url
--
-- Run in Supabase SQL Editor after P0 tables exist.
-- =============================================================================

ALTER TABLE public.video_comments
  ADD COLUMN IF NOT EXISTS author_display_name text,
  ADD COLUMN IF NOT EXISTS author_avatar_url text;

NOTIFY pgrst, 'reload schema';
