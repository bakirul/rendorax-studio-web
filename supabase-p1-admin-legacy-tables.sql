-- =============================================================================
-- Rendorax P1 legacy admin tables (Admin HQ — project status, briefs, invoices)
-- =============================================================================
-- Target: Supabase project used by rendorax-frontend (bviltofeuqsibbgancby)
-- Scope:  project_status, project_status_details, client_invoices ONLY
--
-- BEFORE RUNNING:
--   1. Confirm Supabase project URL matches NEXT_PUBLIC_SUPABASE_URL
--   2. Run in SQL Editor (not via Prisma)
--   3. Intended one-time apply; re-run uses IF NOT EXISTS / DROP POLICY IF EXISTS
--   4. P0 tables (video_comments, video_metadata) should already exist — not
--      created by this script
--
-- ADMIN ACCESS:
--   RLS policies require app_metadata.role = 'admin' on the JWT for writes and
--   cross-user reads. Set on admin users before testing /admin:
--
--   UPDATE auth.users
--   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
--       || '{"role":"admin"}'::jsonb
--   WHERE email = 'your-admin@example.com';
--
-- AFTER RUNNING:
--   NOTIFY pgrst at end reloads PostgREST schema cache (fixes PGRST205)
--   Verify: SELECT to_regclass('public.project_status');
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper expression (inline in policies):
--   (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'

-- -----------------------------------------------------------------------------
-- 1. project_status
--    Used by: app/admin/page.tsx — SELECT status, UPSERT on phase change
--    Key:     user_id (client auth.users.id) — matches Vault Directories folder
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_status (
  user_id     uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'Awaiting Assets',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_status IS
  'Client project pipeline phase for Admin HQ. Status values: Awaiting Assets, Ingesting, Offline Edit, Color Grading, Audio & Master, Ready for Review.';

ALTER TABLE public.project_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_status_admin_all" ON public.project_status;
CREATE POLICY "project_status_admin_all"
  ON public.project_status
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "project_status_select_own" ON public.project_status;
CREATE POLICY "project_status_select_own"
  ON public.project_status
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2. project_status_details
--    Used by: app/admin/page.tsx — SELECT brief fields (read-only in app today)
--    Key:     user_id (one brief row per client)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_status_details (
  user_id           uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  project_title     text,
  deadline          timestamptz,
  video_length      text,
  editing_style     text,
  instructions      text,
  reference_links   text,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_status_details IS
  'Client project brief / requirements for Admin HQ. Populated via SQL seed or future client form.';

ALTER TABLE public.project_status_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_status_details_admin_select" ON public.project_status_details;
CREATE POLICY "project_status_details_admin_select"
  ON public.project_status_details
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "project_status_details_admin_write" ON public.project_status_details;
CREATE POLICY "project_status_details_admin_write"
  ON public.project_status_details
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "project_status_details_admin_update" ON public.project_status_details;
CREATE POLICY "project_status_details_admin_update"
  ON public.project_status_details
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "project_status_details_admin_delete" ON public.project_status_details;
CREATE POLICY "project_status_details_admin_delete"
  ON public.project_status_details
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- -----------------------------------------------------------------------------
-- 3. client_invoices
--    Used by: app/admin/page.tsx — SELECT, INSERT, UPDATE status, DELETE
--    Key:     user_id scopes invoice to client; id for row updates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  invoice_number  text NOT NULL,
  description     text NOT NULL,
  amount          numeric(12, 2) NOT NULL,
  due_date        date NOT NULL,
  status          text NOT NULL DEFAULT 'Unpaid',
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.client_invoices IS
  'Client billing records for Admin HQ. status: Unpaid | Paid.';

CREATE INDEX IF NOT EXISTS client_invoices_user_id_idx
  ON public.client_invoices (user_id);

CREATE INDEX IF NOT EXISTS client_invoices_user_id_created_at_idx
  ON public.client_invoices (user_id, created_at DESC);

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_invoices_admin_all" ON public.client_invoices;
CREATE POLICY "client_invoices_admin_all"
  ON public.client_invoices
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "client_invoices_select_own" ON public.client_invoices;
CREATE POLICY "client_invoices_select_own"
  ON public.client_invoices
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Grants (Supabase API roles)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.project_status
  TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.project_status_details
  TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.client_invoices
  TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- PostgREST schema cache reload
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- -----------------------------------------------------------------------------
-- Optional verification (run after apply)
-- -----------------------------------------------------------------------------
-- SELECT to_regclass('public.project_status') AS project_status,
--        to_regclass('public.project_status_details') AS project_status_details,
--        to_regclass('public.client_invoices') AS client_invoices;
