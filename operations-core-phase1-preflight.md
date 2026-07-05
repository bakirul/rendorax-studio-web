# Operations Core Phase 1 — WP0 Pre-flight Report

**Created:** 2026-07-04  
**Type:** Inspection only — no implementation, no schema changes, no migrations, no SQL execution  
**Scope:** WP0 pre-flight verification before WP1 schema migration  
**Supabase project:** `bviltofeuqsibbgancby`  
**Approved decisions:** OC-P1-01 through OC-P1-07

**Related:** `operations-core-phase1-implementation-plan.md`, `operations-core-phase1-blueprint.md`, `admin-hq-recovery-phase1.md`

---

## Executive summary

| Area | Result |
|------|--------|
| **Supabase P1 tables** | **Present** (PostgREST 200) — **changed since** `admin-hq-recovery-phase1.md` (was PGRST205) |
| **P1 table data** | **Empty** (0 rows) — safe for backfill |
| **Prisma agency schema** | **Present** — `User`, `AgencyProject`, `Task`, `MediaAsset` exist; **WP1 columns not yet applied** |
| **Prisma ops data** | **0** `User`, **0** `AgencyProject`, **0** `Task`; **6** `MediaAsset` for **1** client |
| **Backend APIs** | Partial — POST projects/tasks + GET tasks only; WP3/WP4 endpoints **missing** |
| **Admin HQ** | Client discovery via media API; legacy Supabase loads keyed by `selectedClient` |

### Go / No-Go

| Verdict | **Conditional GO for WP1** |
|---------|---------------------------|
| **Proceed** | Prisma additive migration (WP1) |
| **Proceed in parallel** | Supabase `client_invoices.agency_project_id` DDL (WP2) — no Prisma dependency |
| **Hold** | WP5 backfill until WP1 + WP3 `POST/GET projects` verified |
| **Hold** | WP8 Admin HQ until WP3–WP5 complete |

**Rationale:** P1 Supabase tables are no longer a blocker. Database is small and clean. No `agencyProjectId` column yet — expected. Dual-write path is viable once WP1 lands.

---

## 1. Supabase verification

### 1.1 Method

| Method | Tool | Writes? |
|--------|------|---------|
| PostgREST probe | `GET /rest/v1/{table}?select=*&limit=0` with anon key | **No** |
| DDL reference | `supabase-p1-admin-legacy-tables.sql` | N/A |
| Admin query alignment | `app/admin/page.tsx` static analysis | N/A |

**Not performed:** `pg_policies` query, admin JWT write test (requires browser session). RLS assessed from **DDL script match**.

### 1.2 Table existence (live probe — 2026-07-04)

| Table | HTTP | PostgREST | Rows (probe) | vs `admin-hq-recovery-phase1.md` |
|-------|------|-----------|--------------|----------------------------------|
| `project_status` | **200** | Reachable | 0 | Was **404 PGRST205** |
| `project_status_details` | **200** | Reachable | 0 | Was **404 PGRST205** |
| `client_invoices` | **200** | Reachable | 0 | Was **404 PGRST205** |
| `video_comments` (P0 ref) | **200** | Reachable | 0 | Was 200 |
| `video_metadata` (P0 ref) | **200** | Reachable | 0 | Was 200 |

**Conclusion:** P1 admin tables **exist** in project `bviltofeuqsibbgancby`. Operator likely applied `supabase-p1-admin-legacy-tables.sql` after the morning recovery report.

### 1.3 Column contract vs plan

#### `project_status`

| Column (DDL) | Admin HQ usage | Match? |
|--------------|----------------|--------|
| `user_id` PK | `.eq("user_id", clientId)` | ✓ |
| `status` | `.select("status")`, upsert `status` | ✓ |
| `updated_at` | upsert `updated_at` | ✓ |

**Default status:** `'Awaiting Assets'` — matches `admin/page.tsx` fallback.

#### `project_status_details`

| Column (DDL) | Admin HQ usage | WP1 `AgencyProject` target |
|--------------|----------------|----------------------------|
| `user_id` PK | `.eq("user_id", clientId)` | `clientId` scope |
| `project_title` | `clientBrief.project_title` | `title` |
| `deadline` | `clientBrief.deadline` | `deadline` *(WP1)* |
| `video_length` | `clientBrief.video_length` | `videoLength` *(WP1)* |
| `editing_style` | `clientBrief.editing_style` | `editingStyle` *(WP1)* |
| `instructions` | `clientBrief.instructions` | `description` |
| `reference_links` | `clientBrief.reference_links` | `referenceLinks` *(WP1)* |
| `updated_at` | not read in UI | — |

#### `client_invoices`

| Column (DDL) | Admin HQ usage | Phase 1 plan |
|--------------|----------------|--------------|
| `id` | update/delete by `id` | ✓ |
| `user_id` | filter, insert | ✓ keep |
| `invoice_number` | insert | ✓ |
| `description` | insert | ✓ |
| `amount` | insert | ✓ |
| `due_date` | insert | ✓ |
| `status` | insert `Unpaid`, update | ✓ |
| `created_at` | order desc | ✓ |
| `agency_project_id` | **not in DDL yet** | **WP2** — not present |

### 1.4 RLS policies (DDL inspection — not live-tested)

| Table | Policies in `supabase-p1-admin-legacy-tables.sql` | Admin requirement |
|-------|---------------------------------------------------|-------------------|
| `project_status` | `project_status_admin_all` (admin JWT); `project_status_select_own` | Admin upsert needs `app_metadata.role = admin` |
| `project_status_details` | admin select/write/update/delete; client select own | Brief read works for admin |
| `client_invoices` | `client_invoices_admin_all`; `client_invoices_select_own` | Invoice CRUD needs admin role |

**Risk:** If admin user lacks `app_metadata.role = admin`, dual-write upserts **fail silently** today (`updateStatus` only checks `error` from supabase — no user-visible error on RLS deny in all cases).

**WP0 action:** Operator confirms admin account JWT role before WP8 QA (not blocking WP1).

### 1.5 Admin HQ query alignment

| Panel | Supabase call | Aligns with P1 DDL? |
|-------|---------------|---------------------|
| Project Phase | `from("project_status").select("status").eq("user_id", clientId).single()` | ✓ |
| Phase write | `upsert({ user_id, status, updated_at }, { onConflict: "user_id" })` | ✓ |
| Brief | `from("project_status_details").select("*").eq("user_id", clientId).single()` | ✓ |
| Billing list | `from("client_invoices").select("*").eq("user_id", clientId)` | ✓ |
| Billing create | `insert({ user_id, invoice_number, description, amount, due_date, status })` | ✓ |
| Preview comments | `from("video_comments")` — **not P1** | OC-P1-05 unchanged |

**Note:** Brief panel hidden when `clientBrief` is null (`{clientBrief && (`). With empty P1 tables, brief panel **does not render** — expected until seed or agency migration.

---

## 2. Prisma schema snapshot

**Source:** `rendorax-backend/prisma/schema.prisma` + live `information_schema` probe (read-only SELECT).

### 2.1 `User`

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `id` | String (PK) | NO | = `auth.users.id` |
| `email` | String (unique) | NO | |
| `displayName` | String | YES | |
| `role` | `AgencyRole` | NO | default `editor` |
| `createdAt` / `updatedAt` | DateTime | NO | |

**Relationships:** `ownedProjects`, `clientProjects`, `assignedTasks`

**Live count:** **0 rows**

### 2.2 `AgencyProject`

| Field | Type | Nullable | Default | WP1 delta |
|-------|------|----------|---------|-----------|
| `id` | String (PK) | NO | uuid | — |
| `title` | String | NO | — | — |
| `description` | String | YES | — | — |
| `status` | String | NO | **`"active"`** | Change app default → `Awaiting Assets` |
| `ownerId` | String FK → User | NO | — | — |
| `clientId` | String FK → User | YES | — | — |
| `createdAt` / `updatedAt` | DateTime | NO | — | — |
| `deadline` | — | — | — | **ADD (WP1)** |
| `videoLength` | — | — | — | **ADD (WP1)** |
| `editingStyle` | — | — | — | **ADD (WP1)** |
| `referenceLinks` | — | — | — | **ADD (WP1)** |
| `assets` relation | — | — | — | **ADD (WP1)** |

**Relationships:** `owner`, `client`, `tasks[]`

**Live count:** **0 rows**

### 2.3 `Task`

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `id` | String (PK) | NO | |
| `title` | String | NO | |
| `description` | String | YES | |
| `status` | `TaskStatus` enum | NO | `todo` \| `in_progress` \| `in_review` \| `done` |
| `dueDate` | DateTime | YES | |
| `projectId` | String FK → AgencyProject | NO | CASCADE delete |
| `assigneeId` | String FK → User | YES | |
| `createdAt` / `updatedAt` | DateTime | NO | |

**Live count:** **0 rows** · orphan FK count: **0**

### 2.4 `MediaAsset`

| Field | Type | Nullable | WP1 delta |
|-------|------|----------|-----------|
| `id` | String (PK) | NO | — |
| `fileName` | String | NO | links to `video_comments.file_name` |
| `publicUrl`, `objectKey`, `mimeType`, etc. | various | — | — |
| `userId` | String | YES | **KEEP** (OC-P1-02/03) |
| `folder` | String | YES | — |
| processing / playback fields | enums | YES | — |
| `agencyProjectId` | — | — | **ADD nullable FK (WP1)** |

**Live count:** **6 total**, **0** with `userId = null`, **1** distinct client

**`agencyProjectId` column exists in DB:** **NO** (confirmed)

### 2.5 Relationship diagram (current)

```text
User ──ownerId──► AgencyProject ◄──clientId── User
                      │
                      ├──► Task (projectId, assigneeId → User)
                      │
MediaAsset ──userId──► (client User)     [no FK to AgencyProject yet]
```

### 2.6 Migration impact analysis (WP1)

| Change | Breaking? | Data impact | Downtime |
|--------|-----------|-------------|----------|
| `MediaAsset.agencyProjectId` nullable FK | **No** | Existing 6 rows stay null until WP5 | None |
| `AgencyProject` brief columns | **No** | All null on existing rows (0 today) | None |
| `AgencyProject.assets` relation | **No** | Prisma-only | None |
| Change POST default `status` | **No** | Code-only; no rows yet | None |

**Portfolio `Project` model:** Untouched (OC-P1-07).

**External Supabase tables:** Prisma `externalTables` config continues to ignore legacy tables — no Prisma migration for `video_comments` (OC-P1-05).

---

## 3. Backend API inspection

### 3.1 `agency.routes.ts` — current surface

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| POST | `/projects` | **Exists** | Default `status: "active"` — **misaligned** with pipeline strings |
| POST | `/tasks` | **Exists** | Requires `assigneeId`; client 403 |
| GET | `/tasks` | **Exists** | Role-filtered |
| GET | `/projects` | **Missing** | WP3 |
| GET | `/projects/:id` | **Missing** | WP3 |
| PATCH | `/projects/:id` | **Missing** | WP3 |
| PATCH | `/tasks/:id` | **Missing** | WP3 |

**Auth:** `requireAuth` + `ensureAgencyUser` on all routes.

**`POST /projects` client validation:** Requires `prisma.user.findUnique` — **client must exist in `User` table**. Today **0 users** — backfill must upsert client + owner before project create with `clientId`.

### 3.2 `media.routes.ts` — current surface

| Method | Path | Relevant today | WP4 delta |
|--------|------|----------------|-----------|
| POST | `/assets` | Sets `userId` from JWT only | Accept `agencyProjectId`; auto-assign single project |
| GET | `/assets` | `userId`, `folder` query | Add `agencyProjectId` |
| GET | `/clients` | `userId`, `assetCount` groupBy | Enrich email, `projectCount` |
| PATCH | `/assets/:id` | `fileName`, `folder` only | Optional `agencyProjectId` reassign |
| DELETE | `/assets/:id` | OK | — |

### 3.3 Next.js proxies

| File | Methods today | WP7 delta |
|------|---------------|-----------|
| `app/api/agency/projects/route.ts` | POST only | Add GET |
| `app/api/agency/projects/[id]/route.ts` | **Missing** | GET, PATCH |
| `app/api/agency/tasks/route.ts` | GET, POST | — |
| `app/api/agency/tasks/[id]/route.ts` | **Missing** | PATCH |

### 3.4 WP3/WP4 gap summary

| Required endpoint | WP | Blocked by |
|-------------------|-----|------------|
| GET/PATCH projects | WP3 | WP1 for brief fields + asset relation testing |
| PATCH tasks | WP3 | — (can implement before WP1) |
| GET assets by `agencyProjectId` | WP4 | **WP1 column** |
| POST assets with `agencyProjectId` | WP4 | **WP1 column** |
| Enriched GET clients | WP4 | WP1 optional (projectCount needs AgencyProject) |

---

## 4. Admin HQ inspection

### 4.1 Current flow

```text
mount → fetchClientFolders() → GET /api/media/clients
  → user clicks client → fetchClientData(clientId)
       ├── fetchMediaAssets({ userId: clientId })
       ├── supabase project_status (phase)
       ├── supabase project_status_details (brief)
       └── supabase client_invoices (billing)
  → user clicks asset → handlePreview → video_comments by file_name
```

### 4.2 State variables (integration anchors)

| State | Line (approx) | Role |
|-------|---------------|------|
| `clients` | L27 | Sidebar list |
| `selectedClient` | L28 | **Client tenant key** — keep |
| `clientAssets` | L29 | Vault list |
| `currentStatus` | L37 | Phase buttons |
| `clientBrief` | L56 | Requirements panel |
| `clientInvoices` | L59 | Billing panel |
| `filesLoading` | L30 | Asset panel spinner |

### 4.3 Asset loading

```103:116:rendorax-frontend/app/admin/page.tsx
  const fetchClientData = async (clientId: string) => {
    ...
    const assets = await fetchMediaAssets({ userId: clientId });
    setClientAssets(assets);
```

- Scoped by **`userId` only** — no project filter.
- Errors → `setClientAssets([])` (silent empty — see `admin-hq-asset-loading-trace.md`).
- **WP8:** Switch to `fetchMediaAssets({ agencyProjectId })` when `selectedProjectId` set; keep `userId` fallback during transition.

### 4.4 Phase / billing / brief loading

| Panel | Trigger | Data source | Empty today? |
|-------|---------|-------------|--------------|
| Phase | `selectedClient` | `project_status` | Shows default `"Awaiting Assets"` (no row) |
| Brief | `selectedClient` | `project_status_details` | **Hidden** (null) |
| Billing | `selectedClient` | `client_invoices` | "No financial records" |

### 4.5 Project selector integration points (WP8)

| Location | UI region | Action |
|----------|-----------|--------|
| **A** | `lg:col-span-3` top, **before** L372 `{selectedClient && (` Phase panel | Insert project dropdown + "New Project" when `selectedClient` set |
| **B** | Split `fetchClientData` | Add `fetchClientProjects(clientId)` → `GET /api/agency/projects?clientId=` |
| **C** | New `fetchProjectData(projectId)` | Replace status/brief Supabase reads with `GET /api/agency/projects/:id` + fallback |
| **D** | `updateStatus` L145–167 | PATCH agency + dual-write `project_status` (OC-P1-04) |
| **E** | Brief panel L557–620 | Map `AgencyProject` brief fields instead of `clientBrief.*` |
| **F** | `handleCreateInvoice` L244–256 | Add `agency_project_id: selectedProjectId` after WP2 |
| **G** | Asset load L111 | `agencyProjectId` param when project selected |

**Auto-select:** If `clientProjects.length === 1`, set `selectedProjectId` immediately (OC-P1-06 UX).

### 4.6 Task panel integration points (WP8)

| Location | Action |
|----------|--------|
| **H** | After Phase panel (~L389), before Billing (~L392) | New "Project Tasks" panel |
| **I** | `useEffect` on `selectedProjectId` | `GET /api/agency/tasks` filtered client-side by `project.id` |
| **J** | Create task form | `POST /api/agency/tasks` with `projectId`, `assigneeId`, `dueDate` |
| **K** | Task row status | `PATCH /api/agency/tasks/:id` |

**Blocker for task create:** `assigneeId` must exist in `User` table — admin must pick from upserted editors or operator seeds `User` rows in WP5.

### 4.7 Pre-existing admin issues (not WP1 scope)

| Issue | Impact on Phase 1 |
|-------|-------------------|
| Preview comments `.eq("user_id", selectedClient)` L214 | Filters by **client UUID**, not comment author — may hide reviewer notes |
| Silent asset load failure | Still applies until asset trace fix |
| `client-vault` bucket absent | **Non-blocking** — discovery uses media API |

---

## 5. Data risk assessment

**Source:** Read-only Prisma inventory (2026-07-04).

### 5.1 Inventory

| Metric | Value |
|--------|-------|
| `MediaAsset` total | **6** |
| `MediaAsset` with `userId = null` | **0** |
| Distinct client `userId` values | **1** (`1a2f97b5-942e-44ee-9c32-7de0c1c8328d`) |
| `AgencyProject` total | **0** |
| `User` total | **0** |
| `Task` total | **0** |
| Tasks with missing project FK | **0** |
| `MediaAsset.agencyProjectId` column | **Does not exist** |

### 5.2 Risk items

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Clients with assets but no AgencyProject** | **High (1/1 clients)** | WP5 backfill — expected (OC-P1-06) |
| **Empty `User` table** | **High** | WP5: `ensureAgencyUser` for owner + client before `AgencyProject.create`; `POST /projects` requires client `User` row |
| **Orphan MediaAssets (`userId` null)** | **Low (0 rows)** | None |
| **Orphan Tasks** | **Low (0 rows)** | None |
| **Legacy `project_status` dependency** | **Medium** | Tables exist but empty; dual-write creates rows on first phase click |
| **POST project default `"active"`** | **Medium** | Fix in WP3 — pipeline strings differ from admin UI |
| **Backfill owner unknown** | **Medium** | Operator must set `BACKFILL_OWNER_ID` to studio admin auth UUID |

### 5.3 Backfill preview (expected WP5 outcome)

```text
Client 1a2f97b5-... → CREATE AgencyProject "Default — 1a2f97b5"
                    → UPDATE 6 MediaAsset SET agencyProjectId = <new id>
                    → UPSERT User rows for owner + client
```

---

## 6. Migration readiness by work package

| WP | Name | Status | Notes |
|----|------|--------|-------|
| **WP0** | Pre-flight | **Complete** | This document |
| **WP1** | Prisma schema | **Ready** | Additive only; no blocking issues |
| **WP2** | Supabase `agency_project_id` | **Ready** | Independent of WP1; run before WP8 billing link |
| **WP3** | Agency API GET/PATCH | **Ready** | Fix `"active"` default; can start after WP1 schema generated |
| **WP4** | Media API extensions | **Blocked** | Until WP1 `agencyProjectId` column exists |
| **WP5** | Backfill script | **Blocked** | Until WP1 + WP3; needs `BACKFILL_OWNER_ID` |
| **WP6** | `agencyProjects.ts` utils | **Ready** | Can stub types; wire after WP3 |
| **WP7** | Next.js proxies | **Ready** | After WP3 route handlers exist |
| **WP8** | Admin HQ UI | **Blocked** | Until WP3–WP5 minimum |
| **WP9** | Upload `agencyProjectId` | **Blocked** | Until WP1 + WP4 |
| **WP10** | QA + cutover | **Blocked** | Until WP8–WP9 |

### Risky work packages

| WP | Why risky |
|----|-----------|
| **WP5** | Empty `User` table; must upsert owner/client without breaking FK constraints |
| **WP8** | Large `admin/page.tsx` surface; dual-write + project selector regression risk |
| **WP9** | Upload auto-assign wrong project if multi-project added before UI |

---

## 7. Blocking issues

| ID | Issue | Blocks | Required fix before |
|----|-------|--------|---------------------|
| **PF-001** | `MediaAsset.agencyProjectId` not in DB | WP4, WP5, WP8 assets, WP9 | **WP1** |
| **PF-002** | `AgencyProject` brief columns missing | WP3 GET/PATCH full brief | **WP1** |
| **PF-003** | No GET/PATCH project API | WP5 verify, WP8 | **WP3** |
| **PF-004** | `User` table empty | WP5, task assignee | **WP5** upsert strategy |
| **PF-005** | `client_invoices.agency_project_id` missing | WP8 invoice project link | **WP2** |
| ~~**PF-006**~~ | ~~P1 Supabase tables missing~~ | ~~WP4 dual-write QA~~ | **RESOLVED** — tables exist (2026-07-04 PM probe) |
| **PF-007** | `POST /projects` default status `"active"` | Pipeline consistency | **WP3** code fix |
| **PF-008** | Admin JWT `role=admin` not verified in WP0 | Legacy dual-write RLS | Operator verify before WP8 |

**Not blocking WP1:** Empty P1 data, zero agency rows, backend production deploy.

---

## 8. Required fixes before WP1

| # | Action | Owner | Effort |
|---|--------|-------|--------|
| 1 | **None mandatory** — WP1 is additive schema only | — | — |
| 2 | *(Recommended)* Record studio admin UUID for `BACKFILL_OWNER_ID` | Operator | 5 min |
| 3 | *(Recommended)* Confirm `app_metadata.role = admin` on HQ login user | Operator | 5 min |
| 4 | *(Recommended)* Update checklist: P1 tables now present | Agent | Done in WP0 closeout |

---

## 9. Recommended implementation sequence

```text
1. WP1  Prisma migrate (agencyProjectId + brief columns)     ← START HERE
2. WP2  Supabase client_invoices.agency_project_id SQL
3. WP3  agency.routes.ts GET/PATCH + pipeline status fix
4. WP4  media.routes.ts agencyProjectId filter + create
5. WP6  agencyProjects.ts types + fetch helpers
6. WP7  Next.js API proxies [id] routes
7. WP5  backfill-agency-projects.ts (dry-run → live)
8. WP8  Admin HQ project selector + dual-write + tasks
9. WP9  Dashboard upload agencyProjectId
10. WP10 QA checklist → disable dual-write
```

**Parallel allowed:** WP2 while WP3 in progress (after WP1 migrate completes).

---

## 10. Verification evidence log

| Check | Timestamp | Result |
|-------|-----------|--------|
| PostgREST P1 tables | 2026-07-04 PM | 200 OK — all three reachable |
| Prisma row counts | 2026-07-04 PM | 6 assets, 0 projects, 0 users, 0 tasks |
| `agencyProjectId` column | 2026-07-04 PM | **false** — not migrated |
| `information_schema` agency tables | 2026-07-04 PM | Columns match schema.prisma (no WP1 fields) |
| Backend `:4000` health | 2026-07-04 PM | **Not confirmed** — frontend dev server active; backend probe inconclusive in shell |
| Temp probe scripts | 2026-07-04 PM | Created for probe, **deleted** — no repo artifacts |

---

## 11. Go / No-Go decision record

| Decision | **Conditional GO** |
|----------|-------------------|
| **Approve WP1 schema migration?** | **YES** — additive, low risk, no production data conflict |
| **Approve WP2 Supabase column?** | **YES** — independent, nullable |
| **Start WP8 before WP5?** | **NO** — assets would have no project linkage |
| **Skip dual-write?** | **NO** — OC-P1-04 requires transition window |

**Operator sign-off for WP1:** _________________ **Date:** _________

---

## 12. File index

| File | WP0 finding |
|------|-------------|
| `supabase-p1-admin-legacy-tables.sql` | P1 DDL reference; tables now live |
| `rendorax-backend/prisma/schema.prisma` | Pre-WP1 snapshot |
| `rendorax-backend/src/routes/agency.routes.ts` | 3 endpoints only |
| `rendorax-backend/src/routes/media.routes.ts` | No `agencyProjectId` |
| `rendorax-frontend/app/admin/page.tsx` | Integration points §4.5–4.6 |
| `admin-hq-recovery-phase1.md` | **Stale** on P1 existence — superseded by this report |
| `operations-core-phase1-implementation-plan.md` | Implementation sequence |

---

**WP0 complete. No code changed. No database modified. Ready for operator approval to begin WP1.**
