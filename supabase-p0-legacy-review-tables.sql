-- =============================================================================
-- Rendorax P0 legacy review tables (dashboard comment + picture-lock metadata)
-- =============================================================================
-- Target: Supabase project used by rendorax-frontend (bviltofeuqsibbgancby)
-- Scope:  video_comments, video_metadata ONLY (no P1/P2 tables)
--
-- BEFORE RUNNING:
--   1. Confirm Supabase project URL matches NEXT_PUBLIC_SUPABASE_URL
--   2. Run in SQL Editor (not via Prisma)
--   3. Intended one-time apply; re-run uses IF NOT EXISTS / DROP POLICY IF EXISTS
--
-- AFTER RUNNING:
--   NOTIFY pgrst at end reloads PostgREST schema cache (fixes PGRST205)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. video_comments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.video_comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name     text NOT NULL,
  user_id       uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  time_stamp    double precision NOT NULL,
  comment_text  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_comments_file_name_idx
  ON public.video_comments (file_name);

CREATE INDEX IF NOT EXISTS video_comments_user_id_idx
  ON public.video_comments (user_id);

CREATE INDEX IF NOT EXISTS video_comments_file_name_time_idx
  ON public.video_comments (file_name, time_stamp);

ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_comments_select_authenticated" ON public.video_comments;
CREATE POLICY "video_comments_select_authenticated"
  ON public.video_comments
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "video_comments_insert_own" ON public.video_comments;
CREATE POLICY "video_comments_insert_own"
  ON public.video_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "video_comments_update_own" ON public.video_comments;
CREATE POLICY "video_comments_update_own"
  ON public.video_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "video_comments_delete_own" ON public.video_comments;
CREATE POLICY "video_comments_delete_own"
  ON public.video_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2. video_metadata
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.video_metadata (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name       text NOT NULL UNIQUE,
  is_locked       boolean NOT NULL DEFAULT false,
  integrity_hash  text,
  locked_by       uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  locked_at       timestamptz,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_metadata_file_name_idx
  ON public.video_metadata (file_name);

ALTER TABLE public.video_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_metadata_select_authenticated" ON public.video_metadata;
CREATE POLICY "video_metadata_select_authenticated"
  ON public.video_metadata
  FOR SELECT
  TO authenticated
  USING (true);

-- Writes to video_metadata use service role in POST /api/picture-lock (bypasses RLS).
-- No INSERT/UPDATE policy for authenticated clients.

-- -----------------------------------------------------------------------------
-- Grants (Supabase API roles)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_comments TO authenticated, service_role;
GRANT SELECT ON public.video_metadata TO authenticated, service_role;
GRANT ALL ON public.video_metadata TO service_role;

-- -----------------------------------------------------------------------------
-- PostgREST schema cache reload
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
