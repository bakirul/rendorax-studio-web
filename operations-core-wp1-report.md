# Operations Core Phase 1 — WP1 Report

**Completed:** 2026-07-04  
**Scope:** Prisma schema additions + migration file + database sync  
**Out of scope (not started):** WP2–WP10, frontend, Admin HQ, API, backfill, deploy, merge

**Approved decisions applied:** OC-P1-01, OC-P1-03 (schema portion)

---

## Executive summary

| Item | Result |
|------|--------|
| **Prisma schema** | Updated — `MediaAsset.agencyProjectId`, `AgencyProject` brief fields, status default |
| **Migration file** | Created — `20260704161500_ops_core_phase1/migration.sql` |
| **Database sync** | **Applied** via `prisma db push` (see §4) |
| **Prisma Client** | Regenerated |
| **Backend build** | **Passed** (`npm run build` / `tsc`) |
| **Existing data** | 6 `MediaAsset` rows unchanged (`agencyProjectId` = null) |
| **Legacy Supabase tables** | **Preserved** (`video_comments` external — not dropped) |

**WP1 status:** **Complete**

---

## 1. Prisma schema diff

**File:** `rendorax-backend/prisma/schema.prisma`

### `MediaAsset`

```diff
   userId            String?
+  agencyProjectId   String?
   ...
   processingJobs    MediaProcessingJob[]
+  agencyProject     AgencyProject? @relation(fields: [agencyProjectId], references: [id], onDelete: SetNull)

   @@index([userId])
+  @@index([agencyProjectId])
```

**Preserved:** `userId`, all playback/transcode fields, `processingJobs`, R2-related columns (`objectKey`, `publicUrl`, `playbackObjectKey`, etc.).

### `AgencyProject`

```diff
-  status      String   @default("active")
+  status         String       @default("Awaiting Assets")
+  deadline       DateTime?
+  videoLength    String?
+  editingStyle   String?
+  referenceLinks String?
   ...
   tasks       Task[]
+  assets         MediaAsset[]
```

**Preserved:** `id`, `title`, `description`, `ownerId`, `clientId`, `owner`/`client` relations, `tasks`, indexes.

---

## 2. Migration file summary

**Path:** `rendorax-backend/prisma/migrations/20260704161500_ops_core_phase1/migration.sql`

| Step | SQL action |
|------|------------|
| 1 | `ALTER TABLE "AgencyProject"` — add `deadline`, `editingStyle`, `referenceLinks`, `videoLength` |
| 2 | `ALTER COLUMN "status" SET DEFAULT 'Awaiting Assets'` |
| 3 | `ALTER TABLE "MediaAsset"` — add nullable `agencyProjectId` |
| 4 | `CREATE INDEX "MediaAsset_agencyProjectId_idx"` |
| 5 | `ADD CONSTRAINT "MediaAsset_agencyProjectId_fkey"` — `ON DELETE SET NULL ON UPDATE CASCADE` |

**Also added:** `prisma/migrations/migration_lock.toml` (postgresql provider).

**Not included:** Any `DROP TABLE` on Supabase legacy tables (`video_comments`, `video_metadata`).

---

## 3. Migration apply method

| Command | Result |
|---------|--------|
| `prisma migrate dev --name ops_core_phase1` | **Failed** — P3006 shadow DB cannot replay `20250626120000_media_pipeline_phase2` (`MediaAsset` missing in shadow) |
| `prisma migrate deploy` | **Failed** — P3005 database not baselined (`_prisma_migrations` empty vs existing schema) |
| `prisma db push` | **Succeeded** — database synced with schema in 3.93s |

**Note:** This project historically used `db push` (per checklist). The migration SQL file is the **version-controlled DDL record** for WP1. Operator should baseline `_prisma_migrations` before `migrate deploy` works in CI/production (future ops task — not WP1 scope).

---

## 4. Database validation (post-apply)

Read-only `information_schema` check:

| Table | Column | Nullable | Default |
|-------|--------|----------|---------|
| `MediaAsset` | `agencyProjectId` | YES | null |
| `AgencyProject` | `deadline` | YES | null |
| `AgencyProject` | `videoLength` | YES | null |
| `AgencyProject` | `editingStyle` | YES | null |
| `AgencyProject` | `referenceLinks` | YES | null |
| `AgencyProject` | `status` | NO | `'Awaiting Assets'` |

**FK:** `MediaAsset_agencyProjectId_fkey` → `AgencyProject(id) ON DELETE SET NULL ON UPDATE CASCADE` — **confirmed**

**Row impact:**

| Table | Rows before | Rows after | `agencyProjectId` populated |
|-------|-------------|------------|------------------------------|
| `MediaAsset` | 6 | 6 | 0 (expected — backfill is WP5) |
| `AgencyProject` | 0 | 0 | — |

---

## 5. Impact analysis

| Area | Impact |
|------|--------|
| **Breaking changes** | **None** — all additions nullable or default-only |
| **Upload / R2 flow** | **Unchanged** — no route or frontend edits |
| **Playback / transcode** | **Unchanged** — `MediaAsset` pipeline fields untouched |
| **`userId` tenancy** | **Preserved** — still set at upload |
| **`POST /agency/projects`** | Still hardcodes `"active"` in code when status omitted — **WP3 fix**; DB default now `Awaiting Assets` for Prisma creates |
| **Admin HQ** | **Unchanged** — still uses `userId` + legacy Supabase |
| **Comments** | **Unchanged** — `video_comments` remains Supabase external |
| **Portfolio `Project`** | **Untouched** |

---

## 6. Affected files

| File | Change |
|------|--------|
| `rendorax-backend/prisma/schema.prisma` | Modified |
| `rendorax-backend/prisma/migrations/migration_lock.toml` | **Added** |
| `rendorax-backend/prisma/migrations/20260704161500_ops_core_phase1/migration.sql` | **Added** |
| `rendorax-backend/node_modules/@prisma/client` | Regenerated (local) |

**Not modified:** Frontend, `agency.routes.ts`, `media.routes.ts`, `admin/page.tsx`, Supabase SQL.

---

## 7. Build result

```text
> rendorax-backend@1.0.0 build
> npx prisma generate && tsc

✔ Generated Prisma Client (v7.8.0)
(exit code 0)
```

No TypeScript errors introduced by schema changes (no application code references new fields yet).

---

## 8. Rollback notes

### A. Schema rollback (if WP1 must be reverted before WP3+)

Run in Supabase SQL Editor or via Prisma:

```sql
ALTER TABLE "MediaAsset" DROP CONSTRAINT IF EXISTS "MediaAsset_agencyProjectId_fkey";
DROP INDEX IF EXISTS "MediaAsset_agencyProjectId_idx";
ALTER TABLE "MediaAsset" DROP COLUMN IF EXISTS "agencyProjectId";

ALTER TABLE "AgencyProject"
  DROP COLUMN IF EXISTS "deadline",
  DROP COLUMN IF EXISTS "videoLength",
  DROP COLUMN IF EXISTS "editingStyle",
  DROP COLUMN IF EXISTS "referenceLinks";

ALTER TABLE "AgencyProject" ALTER COLUMN "status" SET DEFAULT 'active';
```

Then revert `schema.prisma` and run `npx prisma generate`.

### B. Git rollback

```bash
git checkout -- rendorax-backend/prisma/schema.prisma
git rm -r rendorax-backend/prisma/migrations/20260704161500_ops_core_phase1
# Apply SQL rollback (§8A) if db push was applied
```

### C. Data safety

- No rows deleted
- No `agencyProjectId` values set — rollback is lossless for data

---

## 9. Known follow-ups (not WP1)

| Item | Work package |
|------|--------------|
| Baseline `_prisma_migrations` for `migrate deploy` | Future ops |
| `POST /projects` status `"active"` in code | WP3 |
| `agencyProjectId` on upload/list | WP4 |
| Backfill default projects | WP5 |
| `client_invoices.agency_project_id` | WP2 |

---

## 10. WP readiness update

| WP | Status after WP1 |
|----|------------------|
| WP1 | **Complete** |
| WP2 | **Ready** |
| WP3 | **Ready** |
| WP4 | **Ready** (column exists) |
| WP5 | **Ready** (schema supports backfill) |

---

**WP1 complete. Stopped per scope. Awaiting approval for WP2.**
