# Legacy Supabase Tables — Migration Plan

**Created:** 2026-07-03  
**Root cause (confirmed):** `PGRST205` — `public.video_comments` not in PostgREST schema cache. Same class of failure for `public.video_metadata` (404).  
**New Supabase project:** `bviltofeuqsibbgancby` (per checklist) — Prisma `MediaAsset` tables exist; **legacy review tables were never created**.  
**Scope:** Inspection + SQL **proposal only** — do **not** run SQL yet; do **not** change application code.

**Related:** `comment-create-failure-trace.md`, `comment-review-workflow-map.md`, `rendorax-backend/prisma.config.ts`

---

## Executive summary

The dashboard **review workflow** (comments, picture lock) and **admin HQ workflow** (project status, briefs, invoices) depend on **six legacy `public` tables** accessed via **Supabase JS REST** (`supabase.from(...)`). None are defined in `prisma/schema.prisma`. They are listed as **external** in `prisma.config.ts` so Prisma does not manage or drop them.

| Priority | Table | Blocks (confirmed / likely) |
|----------|-------|-----------------------------|
| **P0** | `video_comments` | Comment create/read (dashboard + admin preview) |
| **P0** | `video_metadata` | Picture lock + vault lock badge |
| **P1** | `project_status` | Admin client pipeline status |
| **P1** | `project_status_details` | Admin client brief panel |
| **P1** | `client_invoices` | Admin billing UI |
| **P2** | `user_roles` | Listed in `prisma.config.ts` only — **no REST usage in repo** |

**Recommendation:** Create P0 tables first, verify comment CRUD, then P1 for admin. Keep tables **Supabase-legacy unmanaged** (SQL in Supabase SQL Editor or future `supabase/migrations/` — not Prisma `migrate`).

---

## Architecture: Prisma vs Supabase legacy

| Layer | Technology | Tables |
|-------|------------|--------|
| Media pipeline | Prisma + backend API | `MediaAsset`, `MediaProcessingJob`, `MediaFolder`, agency models |
| Review / admin UX | Supabase browser client (anon + JWT) | `video_comments`, `video_metadata`, `project_status`, … |
| Picture lock write | Next.js route + **service role** | `video_metadata` upsert bypasses RLS |

`prisma.config.ts` explicitly registers legacy tables as **external**:

```19:26:rendorax-backend/prisma.config.ts
const legacyPublicTables = [
  "public.client_invoices",
  "public.project_status",
  "public.project_status_details",
  "public.user_roles",
  "public.video_comments",
  "public.video_metadata",
] as const;
```

### Should these be Prisma-managed?

| Option | Verdict |
|--------|---------|
| **Supabase-legacy (recommended)** | Matches current code (direct `.from()`). No Prisma model changes. SQL owned by Supabase migrations. Prisma `db push` will **ignore** external tables. |
| **Prisma-managed** | Would require adding models + rewriting frontend to use backend API — **out of scope**, high regression risk. |

**Do not** add these models to `schema.prisma` unless planning a full API migration.

---

## Table 1: `video_comments` (P0)

### Purpose
Time-stamped review notes keyed by `file_name` (= `previewFile.name` in dashboard).

### Columns required (from code)

| Column | Type | Nullable | Default | Used by |
|--------|------|----------|---------|---------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK; edit/delete/socket dedupe |
| `file_name` | `text` | NO | — | Scope key; indexed filter |
| `user_id` | `uuid` | NO | — | Author; FK → `auth.users(id)` |
| `time_stamp` | `double precision` | NO | — | Seconds from `<video>.currentTime` |
| `comment_text` | `text` | NO | — | Note body |
| `created_at` | `timestamptz` | NO | `now()` | Recommended; not read in UI today |

### Indexes

```sql
CREATE INDEX video_comments_file_name_idx ON public.video_comments (file_name);
CREATE INDEX video_comments_user_id_idx ON public.video_comments (user_id);
CREATE INDEX video_comments_file_name_time_idx ON public.video_comments (file_name, time_stamp);
```

### Frontend / API usage

| File | Operations |
|------|------------|
| `hooks/useLiveComments.ts` | `SELECT *` by `file_name`; `INSERT`; `UPDATE comment_text` by `id`; `DELETE` by `id` |
| `app/admin/page.tsx` | `SELECT *` by `file_name` + `user_id` (client), order `time_stamp` |
| `components/CommentsPanel.tsx` | UI only (displays `id`, `time_stamp`, `comment_text`) |

### Auth path
- Browser `createClient()` — **anon key + user JWT**
- No Next.js API proxy

---

## Table 2: `video_metadata` (P0)

### Purpose
Picture lock state and integrity hash per `file_name`.

### Columns required (from code)

| Column | Type | Nullable | Default | Used by |
|--------|------|----------|---------|---------|
| `file_name` | `text` | NO | — | **Unique** key (`onConflict: file_name`) |
| `is_locked` | `boolean` | NO | `false` | Lock badge |
| `integrity_hash` | `text` | YES | — | SHA-256 hex display |
| `locked_by` | `uuid` | YES | — | `auth.users.id` at lock time |
| `locked_at` | `timestamptz` | YES | — | Lock timestamp |
| `metadata` | `jsonb` | YES | — | `{ duration, frameRate }` |
| `id` | `uuid` | NO | `gen_random_uuid()` | Optional surrogate PK (upsert uses `file_name`) |
| `created_at` | `timestamptz` | NO | `now()` | Recommended audit |

**Note:** Vault preview **reads** lock with full vault name (`1730…_clip.mp4`); lock **writes** `previewFile.name` (stripped). Existing app bug — migration should still use `file_name` unique as code expects.

### Frontend / API usage

| File | Operations | Client |
|------|------------|--------|
| `app/dashboard/page.tsx` | `SELECT *` `.eq("file_name", fileName).single()` | Anon + JWT |
| `app/api/picture-lock/route.ts` | `upsert` on `file_name` | **Service role** (`supabaseAdmin`) |

### Separate issue (not fixed by table create alone)
Picture lock route still streams from **Supabase Storage** `client-vault` bucket — R2 assets may hash-fail even after `video_metadata` exists.

---

## Table 3: `project_status` (P1 — admin)

### Columns required

| Column | Type | Nullable | Default | Used by |
|--------|------|----------|---------|---------|
| `user_id` | `uuid` | NO | — | PK or unique (`onConflict: user_id`) |
| `status` | `text` | NO | — | Pipeline label |
| `updated_at` | `timestamptz` | NO | `now()` | Upsert on admin status change |

**Status values in UI:** `Awaiting Assets`, `Ingesting`, `Offline Edit`, `Color Grading`, `Audio & Master`, `Ready for Review` (admin dropdown).

> Dashboard `projectStage` (`Rough Cut`, etc.) is **Zustand local state only** — **not** loaded from this table.

### Frontend usage

| File | Operations |
|------|------------|
| `app/admin/page.tsx` | `SELECT status` by `user_id`; `upsert` `{ user_id, status, updated_at }` |

---

## Table 4: `project_status_details` (P1 — admin)

### Columns required (from admin UI)

| Column | Type | Nullable | Used by |
|--------|------|----------|---------|
| `user_id` | `uuid` | NO | PK or unique; `.eq("user_id", clientId)` |
| `project_title` | `text` | YES | Brief header |
| `deadline` | `date` or `timestamptz` | YES | `toLocaleDateString()` |
| `video_length` | `text` | YES | Display |
| `editing_style` | `text` | YES | Display |
| `instructions` | `text` | YES | Display |
| `reference_links` | `text` | YES | URL display |
| `updated_at` | `timestamptz` | NO | `now()` | Recommended |

### Frontend usage

| File | Operations |
|------|------------|
| `app/admin/page.tsx` | `SELECT *` by `user_id` — **read only** in current code (no client-side insert/update) |

---

## Table 5: `client_invoices` (P1 — admin)

### Columns required

| Column | Type | Nullable | Default | Used by |
|--------|------|----------|---------|---------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Update/delete key |
| `user_id` | `uuid` | NO | — | Client scope |
| `invoice_number` | `text` | NO | — | Display |
| `description` | `text` | NO | — | Display |
| `amount` | `numeric(12,2)` | NO | — | `parseFloat` on insert |
| `due_date` | `date` | NO | — | Display |
| `status` | `text` | NO | `'Unpaid'` | `Unpaid` / `Paid` in UI |
| `created_at` | `timestamptz` | NO | `now()` | `order(created_at desc)` |

### Frontend usage

| File | Operations |
|------|------------|
| `app/admin/page.tsx` | `SELECT *`; `INSERT`; `UPDATE status`; `DELETE` by `id` |

---

## Table 6: `user_roles` (P2 — optional)

Listed in `prisma.config.ts` as external. **No** `supabase.from("user_roles")` in frontend or backend.

Admin access uses `user.app_metadata.role === "admin"` (`utils/auth/roles.ts`), not this table.

**Recommendation:** Skip until a concrete feature references it, or create minimal stub if Prisma external table registration expects existence (not required for PostgREST).

---

## Other Supabase dependencies (not SQL tables)

| Resource | Used by | Note |
|----------|---------|------|
| Storage bucket `client-vault` | `admin/page.tsx` list clients; `picture-lock/route.ts`; `video-uploaded` webhook | Separate from table migration |
| `auth.users` | All JWT flows | Already exists |

---

## Required RLS policies (current auth flow)

### Auth model today

| Actor | Key | App check |
|-------|-----|-----------|
| Client | Anon + JWT | Dashboard routes |
| Admin | Anon + JWT | `app_metadata.role === 'admin'` (middleware) |
| Server | Service role | `picture-lock` upsert only |

Helper for admin policies (JWT `app_metadata`):

```sql
-- Use in policies:
(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
```

### `video_comments`

| Operation | Who (app behavior) | Proposed policy |
|-----------|-------------------|-----------------|
| `SELECT` | Any logged-in user; filter by `file_name` only | `authenticated` → `true` (permissive; matches dashboard) |
| `INSERT` | `user_id = auth.uid()` in insert payload | `authenticated` WITH CHECK (`user_id = auth.uid()`) |
| `UPDATE` | Any user by `id` (no author check in app) | **Option A (match app):** `authenticated` → `true`. **Option B (safer):** `user_id = auth.uid()` OR admin |
| `DELETE` | Same as update | Same as update |

**Admin read:** uses `.eq("user_id", selectedClient)` — satisfied by permissive SELECT.

### `video_metadata`

| Operation | Who | Proposed policy |
|-----------|-----|-----------------|
| `SELECT` | Dashboard vault preview (JWT) | `authenticated` → `true` |
| `INSERT`/`UPDATE` | Service role in `picture-lock` | Bypasses RLS — no client policy required for write |
| Client write | None today | Deny direct client upsert |

### `project_status` / `project_status_details`

| Operation | Who | Proposed policy |
|-----------|-----|-----------------|
| `SELECT` | Admin for any `user_id` | Admin JWT **or** `user_id = auth.uid()` (client read own — future) |
| `INSERT`/`UPDATE` | Admin upsert with `user_id = selectedClient` | Admin JWT only (matches admin-only UI) |
| `project_status_details` write | Not in app | Admin insert/update optional for manual SQL seed |

### `client_invoices`

| Operation | Who | Proposed policy |
|-----------|-----|-----------------|
| `SELECT` | Admin lists by `user_id` | Admin **or** `user_id = auth.uid()` (client vault invoice view — if added later) |
| `INSERT` | Admin inserts `user_id: selectedClient` | **Admin only** (insert sets another user's id) |
| `UPDATE`/`DELETE` | Admin | Admin only |

### Service role

Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in frontend server env for `picture-lock` — service role bypasses RLS for `video_metadata` upsert.

---

## Safe SQL migration script (PROPOSAL — do not run yet)

Run in **Supabase SQL Editor** for project `bviltofeuqsibbgancby`, or save as `supabase/migrations/YYYYMMDDHHMMSS_legacy_review_tables.sql` when ready.

```sql
-- =============================================================================
-- Rendorax legacy dashboard tables (PROPOSAL)
-- Run once per new Supabase project. Review in staging before production.
-- =============================================================================

-- Extensions (usually enabled on Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. video_comments (P0)
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

CREATE POLICY "video_comments_select_authenticated"
  ON public.video_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "video_comments_insert_own"
  ON public.video_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "video_comments_update_authenticated"
  ON public.video_comments FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "video_comments_delete_authenticated"
  ON public.video_comments FOR DELETE TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- 2. video_metadata (P0)
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

CREATE POLICY "video_metadata_select_authenticated"
  ON public.video_metadata FOR SELECT TO authenticated
  USING (true);

-- Writes: service role via picture-lock API (bypasses RLS)

-- -----------------------------------------------------------------------------
-- 3. project_status (P1)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_status (
  user_id     uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'Awaiting Assets',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_status_admin_all"
  ON public.project_status FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "project_status_select_own"
  ON public.project_status FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4. project_status_details (P1)
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

ALTER TABLE public.project_status_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_status_details_admin_select"
  ON public.project_status_details FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR user_id = auth.uid()
  );

CREATE POLICY "project_status_details_admin_write"
  ON public.project_status_details FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- -----------------------------------------------------------------------------
-- 5. client_invoices (P1)
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

CREATE INDEX IF NOT EXISTS client_invoices_user_id_idx
  ON public.client_invoices (user_id);

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_invoices_admin_all"
  ON public.client_invoices FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "client_invoices_select_own"
  ON public.client_invoices FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Grants (Supabase default roles)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- PostgREST schema cache reload (Supabase)
NOTIFY pgrst, 'reload schema';
```

### Post-migration: admin JWT

Admin policies require `app_metadata.role = 'admin'`. Set per user in Supabase SQL:

```sql
-- Example (replace USER_UUID):
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
-- WHERE id = 'USER_UUID';
```

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **PGRST205 persists** until schema reload | High | Run `NOTIFY pgrst, 'reload schema'`; wait ~1 min; retry |
| Permissive comment UPDATE/DELETE policies | Medium | Matches current app; tighten to `user_id = auth.uid()` later |
| Admin policies depend on `app_metadata.role` | High | Set admin role on HQ users before testing `/admin` |
| `file_name` not tied to `MediaAsset.id` | Medium | Orphan comments on rename (pre-existing design) |
| Picture lock still uses Storage not R2 | High | Table fixes metadata only; lock API may still fail for R2 assets |
| `project_status_details` read-only in app | Low | Table empty until manual seed or future client form |
| Running SQL on wrong project | Critical | Verify `NEXT_PUBLIC_SUPABASE_URL` matches target |
| Prisma `db push` | Low | External tables ignored — safe |
| Data migration from old project | Medium | If old Supabase had rows, export/import separately |

---

## Verification steps (after table creation)

### V0 — Schema

1. Supabase **Table Editor** — all five P0/P1 tables visible.
2. SQL: `SELECT to_regclass('public.video_comments');` → not null.
3. API: `GET {SUPABASE_URL}/rest/v1/video_comments?limit=1` with anon key → **200** (not PGRST205).

### V1 — Comment create (unblocks TC-1.1)

1. Dashboard → open video → post `MIGRATION-TEST-001`.
2. Network: `POST .../video_comments` → **201** + row JSON.
3. Reload → comment persists.
4. Click timestamp → seek works.

### V2 — `video_metadata`

1. Vault preview → no 404 on `GET .../video_metadata?file_name=eq....`
2. Picture lock (optional): `POST /api/picture-lock` → row in table (may still fail on R2 storage stream).

### V3 — Admin (requires admin `app_metadata`)

1. `/admin` → select client → status dropdown saves without error.
2. Brief panel loads (empty OK if no `project_status_details` row).
3. Create test invoice → appears in list.

### V4 — RLS spot-check

1. Logged-in client: insert comment → success.
2. Logged-out: `POST video_comments` → 401.
3. Non-admin: `upsert project_status` → 403 (if admin-only policy applied).

### V5 — Re-run validation checklist

Complete `comment-review-validation-checklist.md` TC-1.1 through TC-6.1.

---

## Rollout order (recommended)

| Step | Action |
|------|--------|
| 1 | Run SQL **P0 only** (`video_comments`, `video_metadata`) in dev project |
| 2 | `NOTIFY pgrst, 'reload schema'` |
| 3 | Verify comment create (V1) |
| 4 | Run SQL **P1** tables for admin |
| 5 | Set admin `app_metadata.role` |
| 6 | Verify admin (V3) |
| 7 | Document completion in `rendorax-project-checklist.md` §14 |
| 8 | Repeat on production Supabase when ready |

---

## File reference index

| Table | Files |
|-------|-------|
| `video_comments` | `hooks/useLiveComments.ts`, `components/CommentsPanel.tsx`, `app/admin/page.tsx` |
| `video_metadata` | `app/dashboard/page.tsx` (read), `app/api/picture-lock/route.ts` (write) |
| `project_status` | `app/admin/page.tsx` |
| `project_status_details` | `app/admin/page.tsx` |
| `client_invoices` | `app/admin/page.tsx` |
| `user_roles` | `prisma.config.ts` only |

---

## Approval gate

| Step | Status |
|------|--------|
| Root cause | ✅ Missing tables — PGRST205 |
| SQL proposal | ✅ Drafted — **not executed** |
| Code changes | ⏳ None (per instruction) |
| Production apply | ⏳ Awaiting approval |

**No SQL was run. No code was modified.**
