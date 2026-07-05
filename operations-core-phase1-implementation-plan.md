# Operations Core — Phase 1 Implementation Plan

**Created:** 2026-07-04  
**Status:** Approved for planning — **do not implement until operator signs off this document**  
**Type:** Implementation plan only — no code, no database changes, no migrations in this step

**Prerequisites:**
- `operations-core-phase1-blueprint.md` (canonical model)
- `operations-core-gap-analysis.md` (gap register)
- Approved decisions **OC-P1-01** through **OC-P1-07** (below)

**Architecture preserved:** Supabase = auth + legacy metadata · Prisma = ops + media index · R2 = bytes · `video_comments` = Supabase REST/RLS

---

## 1. Approved decisions (locked)

| ID | Decision | Implementation implication |
|----|----------|---------------------------|
| **OC-P1-01** | `AgencyProject` is canonical project SoT | All new ops reads/writes target Prisma; admin phase/brief/tasks scoped by `selectedProjectId` |
| **OC-P1-02** | `User.id` = Supabase `auth.users.id` = client tenant | `MediaAsset.userId`, `AgencyProject.clientId`, admin `selectedClient` stay aligned |
| **OC-P1-03** | `MediaAsset` keeps `userId` + adds `agencyProjectId` | Nullable FK first; backfill links assets; upload accepts optional `agencyProjectId` |
| **OC-P1-04** | `project_status` = legacy satellite; dual-write during transition | `updateStatus` writes `AgencyProject.status` **and** `project_status` until cutover QA |
| **OC-P1-05** | `video_comments` stays Supabase REST/RLS in Phase 1 | **No** Prisma model; **no** change to `useLiveComments.ts` except optional `file_name` stability checks |
| **OC-P1-06** | One default `AgencyProject` per existing client for backfill | Idempotent script; title prefix `Default —` for rollback identification |
| **OC-P1-07** | Admin HQ project selector **after** schema + API ready | Work packages **WP1–WP5** before **WP8** (admin UI) |

---

## 2. Implementation overview

### 2.1 Work package sequence

```text
WP0  Pre-flight ─────────► Verify P0/P1 Supabase tables; backend :4000 up
         │
WP1  Prisma schema ─────► agencyProjectId + brief columns + migration SQL
         │
WP2  Supabase SQL ───────► client_invoices.agency_project_id
         │
WP3  Backend agency API ► GET/PATCH projects; PATCH tasks; pipeline status validation
         │
WP4  Backend media API ──► agencyProjectId filter; clients enrich; asset create/update
         │
WP5  Backfill script ───► default projects + link MediaAsset rows
         │
WP6  Frontend API utils ► agencyProjects.ts; mediaAssets types/params
         │
WP7  Next.js proxies ───► routes for new agency endpoints
         │
WP8  Admin HQ UI ───────► project selector; dual-write status; tasks panel; asset scope
         │
WP9  Upload path ───────► optional agencyProjectId on save (default project fallback)
         │
WP10 QA + cutover ─────► testing checklist; disable dual-write when green
```

### 2.2 Estimated effort

| Work package | Estimate | Owner |
|--------------|----------|-------|
| WP0 Pre-flight | 0.5 h | Operator |
| WP1–WP2 Schema | 1–2 h | Backend |
| WP3–WP4 API | 3–4 h | Backend |
| WP5 Backfill | 1–2 h | Operator + backend script |
| WP6–WP7 Frontend proxies | 2 h | Frontend |
| WP8 Admin HQ | 4–6 h | Frontend |
| WP9 Upload | 1–2 h | Full-stack |
| WP10 QA | 2–4 h | Operator |

**Total:** ~15–22 h focused work (single developer, local verify).

---

## 3. Schema changes

### 3.1 Prisma (`rendorax-backend/prisma/schema.prisma`)

#### 3.1.1 `AgencyProject` — add brief columns

| Column | Type | Nullable | Default | Maps from legacy |
|--------|------|----------|---------|------------------|
| `deadline` | `DateTime` | yes | — | `project_status_details.deadline` |
| `videoLength` | `String` | yes | — | `project_status_details.video_length` |
| `editingStyle` | `String` | yes | — | `project_status_details.editing_style` |
| `referenceLinks` | `String` | yes | — | `project_status_details.reference_links` |

**`status` field:** Keep `String`. Change application default from `"active"` to `"Awaiting Assets"` on create. Validate against allowlist in API (see §5.1).

**`description`:** Continue to hold long-form instructions; backfill maps `project_status_details.instructions`.

#### 3.1.2 `MediaAsset` — add project FK

| Column | Type | Nullable | Relation |
|--------|------|----------|----------|
| `agencyProjectId` | `String` | yes (Phase 1a) | `AgencyProject @relation(...)` |

Add index: `@@index([agencyProjectId])`.

Add relation on `AgencyProject`:

```prisma
assets MediaAsset[]
```

**FK behavior:** `onDelete: SetNull` — deleting a project must not delete R2 assets.

#### 3.1.3 Prisma migration file

**New file:** `rendorax-backend/prisma/migrations/YYYYMMDDHHMMSS_ops_core_phase1/migration.sql`

Expected SQL (illustrative — generate via `prisma migrate dev`):

```sql
ALTER TABLE "public"."AgencyProject"
  ADD COLUMN "deadline" TIMESTAMP(3),
  ADD COLUMN "videoLength" TEXT,
  ADD COLUMN "editingStyle" TEXT,
  ADD COLUMN "referenceLinks" TEXT;

ALTER TABLE "public"."MediaAsset"
  ADD COLUMN "agencyProjectId" TEXT;

CREATE INDEX "MediaAsset_agencyProjectId_idx" ON "public"."MediaAsset"("agencyProjectId");

ALTER TABLE "public"."MediaAsset"
  ADD CONSTRAINT "MediaAsset_agencyProjectId_fkey"
  FOREIGN KEY ("agencyProjectId") REFERENCES "public"."AgencyProject"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
```

**Operator commands (when approved to implement):**

```bash
cd rendorax-backend
npx prisma migrate dev --name ops_core_phase1
npx prisma generate
```

**Do not run** until WP0 pre-flight passes.

### 3.2 Supabase SQL (not Prisma)

#### 3.2.1 P1 admin tables (if missing)

**File:** `supabase-p1-admin-legacy-tables.sql` (existing)

**Verify before WP1:**

```sql
SELECT to_regclass('public.project_status') AS project_status,
       to_regclass('public.project_status_details') AS project_status_details,
       to_regclass('public.client_invoices') AS client_invoices;
```

Apply script in Supabase SQL Editor if any return `NULL`.

#### 3.2.2 `client_invoices.agency_project_id`

**New file:** `supabase-p1-client-invoices-project-id.sql`

```sql
ALTER TABLE public.client_invoices
  ADD COLUMN IF NOT EXISTS agency_project_id uuid;

CREATE INDEX IF NOT EXISTS client_invoices_agency_project_id_idx
  ON public.client_invoices (agency_project_id);

COMMENT ON COLUMN public.client_invoices.agency_project_id IS
  'Optional link to Prisma AgencyProject.id (stored as uuid text-compatible). Phase 1: nullable.';

NOTIFY pgrst, 'reload schema';
```

**Note:** Prisma `AgencyProject.id` is `TEXT` UUID; Postgres `uuid` column accepts UUID strings. Application must pass valid UUID format. No FK constraint across Prisma-managed vs legacy table (intentional).

#### 3.2.3 Tables unchanged in Phase 1

| Table | Action |
|-------|--------|
| `video_comments` | **No schema change** (OC-P1-05) |
| `video_metadata` | **No change** |
| `project_status` | **No DDL change** — dual-write only |
| `project_status_details` | **No DDL change** — read for backfill; reads demoted after cutover |

---

## 4. Migration and backfill steps

### 4.1 Pre-migration inventory (WP0)

Record counts before any migration:

```sql
-- Prisma DB (via psql or Prisma Studio)
SELECT COUNT(*) FROM "MediaAsset";
SELECT COUNT(*) FROM "AgencyProject";
SELECT COUNT(DISTINCT "userId") FROM "MediaAsset" WHERE "userId" IS NOT NULL;

-- Supabase (if P1 applied)
SELECT COUNT(*) FROM project_status;
SELECT COUNT(*) FROM project_status_details;
SELECT COUNT(*) FROM client_invoices;
```

Save output in operator log.

### 4.2 Backfill script (WP5)

**New file:** `rendorax-backend/scripts/backfill-agency-projects.ts`

**Inputs (env or CLI args):**

| Param | Required | Description |
|-------|----------|-------------|
| `BACKFILL_OWNER_ID` | yes | Studio admin Supabase UUID (`AgencyProject.ownerId`) |
| `DATABASE_URL` | yes | Prisma connection (pooler OK for script) |
| `DRY_RUN` | optional | `true` = log only, no writes |

**Algorithm (idempotent):**

```text
FOR EACH DISTINCT MediaAsset.userId WHERE userId IS NOT NULL:

  1. clientId = userId

  2. clientUser = prisma.user.findUnique({ id: clientId })
     IF missing:
       SKIP with warning OR upsert if email available from Supabase Admin API
       (Phase 1: skip clients with no User row; ensureAgencyUser on first API hit)

  3. existingProjects = prisma.agencyProject.findMany({ where: { clientId } })

  4. IF existingProjects.length = 0:
       legacyStatus = fetch project_status for user_id = clientId (optional HTTP to Supabase service role)
       legacyBrief  = fetch project_status_details for user_id = clientId
       CREATE AgencyProject {
         title: legacyBrief.project_title OR `Default — ${clientId.slice(0,8)}`,
         description: legacyBrief.instructions,
         status: legacyStatus.status OR 'Awaiting Assets',
         deadline, videoLength, editingStyle, referenceLinks from legacyBrief,
         clientId,
         ownerId: BACKFILL_OWNER_ID
       }
       projectId = new.id
     ELSE IF existingProjects.length = 1:
       projectId = existingProjects[0].id
     ELSE:
       projectId = most recently updated project OR first created
       LOG: multi-project client; orphan assets go to chosen project

  5. UPDATE MediaAsset
     SET agencyProjectId = projectId
     WHERE userId = clientId AND agencyProjectId IS NULL

  6. LOG: clientId, projectId, assetsUpdated count
```

**Rollback identification:** Projects created by backfill use title prefix `Default —`.

**Post-backfill verification:**

```sql
SELECT COUNT(*) FROM "MediaAsset" WHERE "userId" IS NOT NULL AND "agencyProjectId" IS NULL;
-- Expect 0 after successful backfill

SELECT "clientId", COUNT(*) FROM "AgencyProject" GROUP BY "clientId";
```

### 4.3 Dual-write transition (OC-P1-04)

| Phase | Read path | Write path |
|-------|-----------|------------|
| **Transition** | Prefer `GET /api/agency/projects/:id`; fallback `project_status` if 404 | `PATCH` agency project **+** `project_status` upsert |
| **Cutover** (WP10) | Agency only | Agency only; legacy read-only |

**Feature flag (recommended):**

| Env var | Default | Purpose |
|---------|---------|---------|
| `NEXT_PUBLIC_OPS_DUAL_WRITE_STATUS` | `true` during transition | Admin writes both stores |
| `NEXT_PUBLIC_OPS_USE_AGENCY_PROJECT` | `true` after WP8 | Admin reads agency first |

### 4.4 Invoice backfill (optional, low priority)

On new invoice create in admin: set `agency_project_id` = `selectedProjectId`.

Existing invoices: optional one-time SQL:

```sql
-- Only if exactly one AgencyProject per clientId
UPDATE client_invoices ci
SET agency_project_id = ap.id::uuid
FROM (
  SELECT DISTINCT ON ("clientId") id, "clientId"
  FROM "AgencyProject"
  WHERE "clientId" IS NOT NULL
  ORDER BY "clientId", "updatedAt" DESC
) ap
WHERE ci.user_id::text = ap."clientId"
  AND ci.agency_project_id IS NULL;
```

Run manually after backfill; not blocking for Phase 1 MVP.

---

## 5. API changes

### 5.1 Pipeline status allowlist (shared constant)

**New file:** `rendorax-backend/src/lib/agencyPipelineStatus.ts`

```typescript
export const AGENCY_PIPELINE_STATUSES = [
  "Awaiting Assets",
  "Ingesting",
  "Offline Edit",
  "Color Grading",
  "Audio & Master",
  "Ready for Review",
] as const;
```

Used by `POST /projects`, `PATCH /projects/:id` validation. Matches `admin/page.tsx` L38–44.

### 5.2 Agency routes (`rendorax-backend/src/routes/agency.routes.ts`)

#### Existing (keep)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/projects` | Update default `status` to `Awaiting Assets`; accept brief fields |
| POST | `/tasks` | Unchanged |
| GET | `/tasks` | Unchanged |

#### New endpoints

| Method | Path | Auth | Query/body | Response |
|--------|------|------|------------|----------|
| **GET** | `/projects` | JWT | `?clientId=`, `?status=` | `{ projects: AgencyProject[] }` |
| **GET** | `/projects/:id` | JWT | — | Project + owner + client + `_count.assets` |
| **PATCH** | `/projects/:id` | JWT | `title`, `description`, `status`, brief fields | Updated project |
| **PATCH** | `/tasks/:id` | JWT | `status`, `dueDate`, `title`, `description` | Updated task |

#### GET `/projects` authorization

| Role | `where` clause |
|------|----------------|
| admin | `{}` or filter by `clientId` |
| editor | `{ ownerId: actor.id }` (+ optional `clientId`) |
| client | `{ clientId: actor.id }` |

#### PATCH `/projects/:id` authorization

- **admin:** any project
- **editor:** `ownerId === actor.id`
- **client:** **403** (clients cannot change pipeline in Phase 1)

#### POST `/projects` body extension

```json
{
  "title": "string",
  "description": "string?",
  "clientId": "uuid?",
  "status": "Awaiting Assets?",
  "deadline": "ISO8601?",
  "videoLength": "string?",
  "editingStyle": "string?",
  "referenceLinks": "string?"
}
```

#### PATCH `/tasks/:id` authorization

- **admin:** any task
- **editor:** task on owned project OR `assigneeId === actor.id`
- **client:** **403** on status change (or assignee-only — match product; recommend 403 for pipeline)

### 5.3 Media routes (`rendorax-backend/src/routes/media.routes.ts`)

#### GET `/assets` — extend query

| Param | Behavior |
|-------|----------|
| `userId` | Existing — admin/client scope |
| `agencyProjectId` | **New** — filter `where: { agencyProjectId }` |
| `folder` | Existing |

When **both** provided: `AND` filter (must match client tenancy).

#### POST `/assets` (save after upload) — extend body

| Field | Behavior |
|-------|----------|
| `agencyProjectId` | Optional UUID; validate project exists and `project.clientId === authenticatedUserId` (or admin) |
| If omitted | **WP9:** lookup sole project for `clientId = authenticatedUserId`; if one exists, auto-set |

#### PATCH `/assets/:id` (if exists) or new route

Allow admin to reassign `agencyProjectId` (Phase 2 prep; optional in Phase 1).

#### GET `/clients` — enrich response

**Current:** `{ userId, assetCount }`

**Target:**

```json
{
  "userId": "uuid",
  "assetCount": 6,
  "email": "client@example.com",
  "displayName": "Acme Corp",
  "projectCount": 1
}
```

Join `prisma.user` + `agencyProject.count` where `clientId = userId`.

### 5.4 Next.js API proxies (`rendorax-frontend/app/api/agency/`)

| File | Methods | Upstream |
|------|---------|----------|
| `projects/route.ts` | **GET** (new), POST (existing) | `/api/agency/projects` |
| `projects/[id]/route.ts` | **GET**, **PATCH** (new file) | `/api/agency/projects/:id` |
| `tasks/route.ts` | GET, POST (existing) | `/api/agency/tasks` |
| `tasks/[id]/route.ts` | **PATCH** (new file) | `/api/agency/tasks/:id` |

All use `proxyAgencyRequest` from `utils/agencyBackend.ts`.

### 5.5 Frontend client utilities

**New file:** `rendorax-frontend/utils/agencyProjects.ts`

| Function | Calls |
|----------|-------|
| `fetchAgencyProjects({ clientId? })` | `GET /api/agency/projects` |
| `fetchAgencyProject(id)` | `GET /api/agency/projects/:id` |
| `createAgencyProject(body)` | `POST /api/agency/projects` |
| `updateAgencyProject(id, body)` | `PATCH /api/agency/projects/:id` |
| `fetchAgencyTasks()` | `GET /api/agency/tasks` |
| `createAgencyTask(body)` | `POST /api/agency/tasks` |
| `updateAgencyTask(id, body)` | `PATCH /api/agency/tasks/:id` |

Types: `AgencyProjectRecord`, `AgencyTaskRecord` exported from same file.

### 5.6 `utils/mediaAssets.ts` updates

| Change | Detail |
|--------|--------|
| `MediaAssetRecord` | Add `agencyProjectId?: string \| null` |
| `FetchMediaAssetsParams` | Add `agencyProjectId?: string` |
| `SaveMediaAssetInput` | Add `agencyProjectId?: string` |
| `fetchMediaAssets` | Pass query param |
| `MediaClientRecord` | Add `email?`, `displayName?`, `projectCount?` |

---

## 6. Admin HQ UI wiring (WP8)

**Primary file:** `rendorax-frontend/app/admin/page.tsx`

**Constraint (OC-P1-07):** Implement only after WP1–WP5 deployed and verified via API smoke tests.

### 6.1 New state

| State | Type | Purpose |
|-------|------|---------|
| `clientProjects` | `AgencyProjectRecord[]` | Projects for `selectedClient` |
| `selectedProjectId` | `string \| null` | Canonical ops scope |
| `projectsLoading` | `boolean` | Project list fetch |
| `projectTasks` | `AgencyTaskRecord[]` | Task panel |
| `showNewProjectForm` | `boolean` | Create project (admin) |
| `showNewTaskForm` | `boolean` | Create task |

### 6.2 Load sequence (replace `fetchClientData` flow)

```text
fetchClientFolders()                    // unchanged — GET /api/media/clients
  → user selects client
fetchClientProjects(clientId)           // NEW — GET /api/agency/projects?clientId=
  → auto-select if length === 1
  → user selects project (or create)
fetchProjectData(projectId)             // NEW — replaces scattered legacy loads
  → GET /api/agency/projects/:id        // status, brief
  → fetchMediaAssets({ agencyProjectId }) // assets
  → GET /api/agency/tasks + client filter // tasks for project
  → client_invoices: .eq('agency_project_id', projectId) with user_id fallback
  → preview comments: unchanged (file_name)
```

### 6.3 UI additions (minimal — same page, no redesign)

| Region | Change |
|--------|--------|
| Below client sidebar selection | **Project selector** dropdown + "New Project" button |
| Project Phase Control | Read `currentStatus` from agency project; `updateStatus` → `updateAgencyProject` + dual-write `project_status` |
| Project Requirements | Read brief fields from agency project (`deadline`, `videoLength`, etc.) |
| Vault Assets | Filter by `agencyProjectId`; show message if project not selected |
| **New panel: Project Tasks** | List tasks; create form (title, assigneeId, dueDate); status dropdown |
| Billing | On invoice insert, include `agency_project_id: selectedProjectId` |

### 6.4 `updateStatus` dual-write (OC-P1-04)

```text
1. PATCH /api/agency/projects/:id  { status: newStatus }
2. IF NEXT_PUBLIC_OPS_DUAL_WRITE_STATUS:
     supabase.from('project_status').upsert({ user_id: selectedClient, status })
3. On PATCH failure: do NOT write legacy; show error
4. On PATCH success + legacy failure: show warning (non-blocking)
```

### 6.5 Fallback reads (transition only)

If `fetchAgencyProject` 404 and `NEXT_PUBLIC_OPS_USE_AGENCY_PROJECT !== 'true'`:

- Fall back to `project_status` + `project_status_details` by `selectedClient`

Remove fallback after WP10 cutover.

### 6.6 Unchanged in Phase 1

| Feature | Reason |
|---------|--------|
| Preview player + comments | OC-P1-05 — `video_comments` path unchanged |
| HQ Communications footer | Embedded `GlobalLiveWidget` / `ChatbotWidget` |
| Client discovery sidebar | OC-P1-02 — still `userId` keyed |

---

## 7. Upload path (WP9)

### 7.1 Dashboard upload

**Files:** `rendorax-frontend/app/dashboard/page.tsx`, `hooks/useFileManager.ts`, `utils/mediaAssets.ts`

| Step | Change |
|------|--------|
| Save asset | Pass `agencyProjectId` when dashboard has project context |
| Phase 1 MVP | If client has exactly one `AgencyProject`, backend auto-assigns on POST `/assets` |
| Multi-project (Phase 2) | Project picker on dashboard — **out of scope** |

### 7.2 Backend auto-assign rule

On `POST /api/media/assets` when `agencyProjectId` omitted:

```text
projects = findMany({ clientId: authenticatedUserId })
IF projects.length === 1:
  set agencyProjectId = projects[0].id
ELSE:
  leave null (admin backfill or manual assign)
```

---

## 8. Rollback plan

### 8.1 Rollback triggers

| Symptom | Action |
|---------|--------|
| Admin phase buttons error | Set `NEXT_PUBLIC_OPS_USE_AGENCY_PROJECT=false`; legacy read/write only |
| Assets missing after project filter | Admin assets query: fall back to `userId` only |
| Backfill wrong project linkage | Run rollback script (below) |
| Prisma migration failure | Do not deploy frontend; fix migration forward |

### 8.2 Rollback procedures

#### A. Feature-flag rollback (instant, no DB)

```env
NEXT_PUBLIC_OPS_USE_AGENCY_PROJECT=false
NEXT_PUBLIC_OPS_DUAL_WRITE_STATUS=false
```

Redeploy frontend only. Admin reverts to `project_status` reads/writes.

#### B. Backfill rollback (operator)

```sql
-- Unlink assets
UPDATE "MediaAsset" SET "agencyProjectId" = NULL
WHERE "agencyProjectId" IN (
  SELECT id FROM "AgencyProject" WHERE title LIKE 'Default —%'
);

-- Remove backfill projects
DELETE FROM "AgencyProject" WHERE title LIKE 'Default —%';
```

**Warning:** Deletes cascade `Task` rows on those projects.

#### C. Schema rollback (last resort)

Prisma does not auto-down. Manual:

```sql
ALTER TABLE "MediaAsset" DROP CONSTRAINT IF EXISTS "MediaAsset_agencyProjectId_fkey";
ALTER TABLE "MediaAsset" DROP COLUMN IF EXISTS "agencyProjectId";
ALTER TABLE "AgencyProject"
  DROP COLUMN IF EXISTS "deadline",
  DROP COLUMN IF EXISTS "videoLength",
  DROP COLUMN IF EXISTS "editingStyle",
  DROP COLUMN IF EXISTS "referenceLinks";
```

Only if no production dependency on new columns.

#### D. Supabase column rollback

```sql
ALTER TABLE public.client_invoices DROP COLUMN IF EXISTS agency_project_id;
```

### 8.3 Rollback verification

- [ ] Admin phase control works via `project_status` only
- [ ] Vault assets load by `userId`
- [ ] Dashboard upload + comments unaffected
- [ ] No 500s on `GET /api/media/assets`

---

## 9. Testing checklist

### 9.1 Pre-implementation baseline

- [ ] `npm run dev` — frontend `:3000`, backend `:4000`
- [ ] Admin login with `app_metadata.role = admin`
- [ ] Client discovery shows expected UUID(s)
- [ ] Dashboard upload → asset appears in vault
- [ ] Comment create on asset works

### 9.2 Schema / migration (WP1–WP2)

- [ ] `prisma migrate dev` succeeds locally
- [ ] `MediaAsset.agencyProjectId` column exists (nullable)
- [ ] `AgencyProject` brief columns exist
- [ ] `client_invoices.agency_project_id` exists (Supabase)
- [ ] P1 tables exist (`project_status`, etc.)

### 9.3 API smoke (WP3–WP4) — use admin JWT

- [ ] `POST /api/agency/projects` — creates with `Awaiting Assets`
- [ ] `GET /api/agency/projects?clientId=` — returns list
- [ ] `GET /api/agency/projects/:id` — returns brief fields
- [ ] `PATCH /api/agency/projects/:id` — updates `status`
- [ ] Invalid status returns 400
- [ ] `POST /api/agency/tasks` — creates with assignee
- [ ] `GET /api/agency/tasks` — role-filtered
- [ ] `PATCH /api/agency/tasks/:id` — status `in_progress`
- [ ] `GET /api/media/assets?agencyProjectId=` — filtered assets
- [ ] `GET /api/media/clients` — includes email/projectCount
- [ ] Client JWT cannot PATCH project status (403)

### 9.4 Backfill (WP5)

- [ ] Dry run logs expected clients/projects counts
- [ ] Live run: `MediaAsset` with `userId` all have `agencyProjectId`
- [ ] Re-run idempotent — no duplicate default projects
- [ ] Legacy `project_status` values copied to `AgencyProject.status`

### 9.5 Admin HQ (WP8)

- [ ] Client select → project list loads
- [ ] Single project auto-selected
- [ ] Project select → assets scoped correctly
- [ ] Phase button updates agency + legacy (dual-write)
- [ ] Brief panel shows agency fields
- [ ] Task create/list works for selected project
- [ ] Invoice create sets `agency_project_id`
- [ ] Preview + comments still load (`file_name` unchanged)
- [ ] Delete asset still works

### 9.6 Upload (WP9)

- [ ] New upload gets `agencyProjectId` when client has one project
- [ ] Upload without project leaves null (edge case)

### 9.7 Regression

- [ ] `/dashboard` vault list unchanged for client user
- [ ] Compare workflow still works
- [ ] Export markers (CSV/JSON/XML) still works
- [ ] `useLiveComments` realtime unchanged
- [ ] Portfolio `/portfolio` unaffected

### 9.8 Cutover (WP10)

- [ ] `NEXT_PUBLIC_OPS_DUAL_WRITE_STATUS=false`
- [ ] Phase updates write agency only
- [ ] Legacy tables readable for audit
- [ ] Checklist + gap analysis docs updated

---

## 10. Risk analysis

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| **R1** | P1 Supabase tables missing — admin errors during dual-write | High (known) | Medium | WP0 verify; apply `supabase-p1-admin-legacy-tables.sql` first |
| **R2** | `AgencyProject` POST default `"active"` confuses pipeline | Medium | Low | Change default to `Awaiting Assets`; validate on PATCH |
| **R3** | Assets invisible when `agencyProjectId` set but wrong | Medium | High | Backfill before enabling project filter; `userId` fallback in admin |
| **R4** | Client has no `User` row — backfill skips | Medium | Medium | Script logs skips; `ensureAgencyUser` on first login |
| **R5** | `file_name` ≠ `MediaAsset.fileName` — comments orphan | Low | Medium | No change in Phase 1; document; Phase 2 `asset_id` |
| **R6** | Admin page regression (loading/empty assets) | Medium | High | Incremental WP8; keep `fetchClientData` fallback path |
| **R7** | Multi-project client — all assets on one project | Low (Phase 1) | Low | Document OC-P1-06; Phase 2 split UI |
| **R8** | `client_invoices.agency_project_id` type mismatch | Low | Low | Store UUID string; validate in app |
| **R9** | Backend not deployed — agency API 502 in prod | High (known) | High | Local verify first; deploy backend before frontend flag on |
| **R10** | Task assignee must exist in `User` table | Medium | Medium | Admin task form: list editors from Prisma or hardcode UUID |
| **R11** | Large `admin/page.tsx` diff — merge conflicts | Medium | Medium | Optional extract `components/admin/ProjectSelector.tsx` — only if needed |
| **R12** | Prisma migrate on shared Supabase prod | Medium | High | Test on branch DB; backup; migrate during maintenance window |

---

## 11. Files likely to change

### 11.1 New files

| File | Work package |
|------|--------------|
| `rendorax-backend/prisma/migrations/*_ops_core_phase1/migration.sql` | WP1 |
| `rendorax-backend/src/lib/agencyPipelineStatus.ts` | WP3 |
| `rendorax-backend/scripts/backfill-agency-projects.ts` | WP5 |
| `supabase-p1-client-invoices-project-id.sql` | WP2 |
| `rendorax-frontend/utils/agencyProjects.ts` | WP6 |
| `rendorax-frontend/app/api/agency/projects/[id]/route.ts` | WP7 |
| `rendorax-frontend/app/api/agency/tasks/[id]/route.ts` | WP7 |
| `operations-core-phase1-implementation-plan.md` | This document |

### 11.2 Modified files

| File | Changes |
|------|---------|
| `rendorax-backend/prisma/schema.prisma` | `agencyProjectId`, brief cols, relations |
| `rendorax-backend/src/routes/agency.routes.ts` | GET/PATCH projects, PATCH tasks, validation |
| `rendorax-backend/src/routes/media.routes.ts` | Filter, enrich clients, asset create |
| `rendorax-frontend/app/api/agency/projects/route.ts` | Add GET handler |
| `rendorax-frontend/app/api/agency/tasks/route.ts` | No change (PATCH in `[id]`) |
| `rendorax-frontend/utils/mediaAssets.ts` | Types, params, `agencyProjectId` |
| `rendorax-frontend/utils/agencyBackend.ts` | Optional shared types only |
| `rendorax-frontend/app/admin/page.tsx` | Project selector, dual-write, tasks, asset scope |
| `rendorax-frontend/app/dashboard/page.tsx` | Pass `agencyProjectId` on save (WP9) |
| `rendorax-frontend/hooks/useFileManager.ts` | Pass `agencyProjectId` on save (WP9) |
| `rendorax-project-checklist.md` | Status updates after implementation |
| `.env.example` (both packages) | Feature flags, `BACKFILL_OWNER_ID` |

### 11.3 Explicitly not changed (Phase 1)

| File | Reason |
|------|--------|
| `rendorax-frontend/hooks/useLiveComments.ts` | OC-P1-05 |
| `rendorax-backend/prisma/schema.prisma` → `Project` model | Portfolio only |
| `rendorax-frontend/app/portfolio/**` | Marketing |
| `legacy-supabase-tables-migration-plan.md` | Reference only |
| R2 storage configuration | Architecture preserved |

---

## 12. Implementation approval gate

Before writing code, operator confirms:

- [ ] Work package order accepted (§2.1)
- [ ] Schema in §3.1–3.2 accepted
- [ ] Backfill uses `Default —` title prefix for rollback
- [ ] Dual-write env flags acceptable
- [ ] Admin tasks panel in scope for Phase 1 (minimal)
- [ ] Backend deploy plan exists before production flag enable

**Sign-off:** _________________ **Date:** _________

---

## 13. Post-implementation documentation updates

After WP10 QA pass, update:

| Document | Update |
|----------|--------|
| `rendorax-project-checklist.md` | Mark Phase 1 complete; known issues |
| `operations-core-gap-analysis.md` | Gap statuses → Working/Partial |
| `admin-dashboard-qa-issue-map.md` | Close ADM items resolved by project model |

---

**Plan complete. No code changed. No database modified. Awaiting implementation sign-off.**
