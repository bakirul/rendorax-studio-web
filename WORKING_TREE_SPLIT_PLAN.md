# Working Tree Split Plan

**Date:** 2026-07-05  
**Type:** Inspection / git organization  
**Recommended Model:** Opus 4.6 HIGH  
**Reason:** Classifying 38 dirty files across 6 logical groups, evaluating cross-group dependencies, and determining safe commit order requires the deepest reasoning model.  
**Task Type:** Inspection Only

**Safety backup:** `backup/uncommitted-admin-ops-2026-07-05` at commit `955c6b4`

---

## Current Working Tree Inventory

**11 modified files** (tracked, unstaged):

| # | File | +/− Lines |
|---|------|-----------|
| 1 | `AI_TEAM_PROTOCOL.md` | +35/−0 |
| 2 | `rendorax-backend/prisma/schema.prisma` | +19/−11 |
| 3 | `rendorax-backend/src/routes/media.routes.ts` | +35/−0 |
| 4 | `rendorax-frontend/app/admin/page.tsx` | +70/−33 |
| 5 | `rendorax-frontend/app/dashboard/page.tsx` | +19/−9 |
| 6 | `rendorax-frontend/components/ChatbotWidget.tsx` | +30/−3 |
| 7 | `rendorax-frontend/components/GlobalLiveWidget.tsx` | +38/−27 |
| 8 | `rendorax-frontend/hooks/useLiveComments.ts` | +13/−7 |
| 9 | `rendorax-frontend/utils/mediaAssets.ts` | +21/−0 |
| 10 | `rendorax-project-checklist.md` | +78/−7 |
| 11 | `timeline-sharing-regression-report.md` | +5/−5 |

**27 untracked files:**

| # | File |
|---|------|
| 12 | `ADMIN_HQ_CURRENT_STATE.md` |
| 13 | `BRANCH_DAMAGE_TIMELINE_AUDIT.md` |
| 14 | `GIT_DESIGN_STATE_VERIFICATION.md` |
| 15 | `MODEL_SELECTION_MATRIX.md` |
| 16 | `admin-account-setup-guide.md` |
| 17 | `admin-client-discovery-migration-plan.md` |
| 18 | `admin-dashboard-qa-issue-map.md` |
| 19 | `admin-hq-asset-loading-trace.md` |
| 20 | `admin-hq-design-regression-report.md` |
| 21 | `admin-hq-initialization-hang-trace.md` |
| 22 | `admin-hq-recovery-phase1.md` |
| 23 | `admin-login-failure-trace.md` |
| 24 | `admin-storage-architecture-review.md` |
| 25 | `design-regression-freeze-audit.md` |
| 26 | `operations-core-gap-analysis.md` |
| 27 | `operations-core-phase1-blueprint.md` |
| 28 | `operations-core-phase1-implementation-plan.md` |
| 29 | `operations-core-phase1-preflight.md` |
| 30 | `operations-core-wp1-report.md` |
| 31 | `rendorax-backend/prisma/migrations/20260704161500_ops_core_phase1/migration.sql` |
| 32 | `rendorax-backend/prisma/migrations/migration_lock.toml` |
| 33 | `rendorax-backend/scripts/create-admin.ts` |
| 34 | `rendorax-backend/scripts/_tmp-keys.mjs` |
| 35 | `rendorax-frontend/components/contact/ContactModal.tsx` |
| 36 | `rendorax-frontend/utils/reviewRoom.ts` |
| 37 | `supabase-p1-admin-legacy-tables.sql` |
| 38 | `timeline-sharing-production-readiness.md` |
| 39 | `timeline-sharing-restoration-blueprint.md` |

---

## Group Classification

### Group A — Documentation & Governance

**Purpose:** Inspection reports, audit documents, governance policies, and project checklist updates. Zero runtime impact.

**Files (22):**

| File | Status | Note |
|------|--------|------|
| `AI_TEAM_PROTOCOL.md` | Modified | +35 lines: Model Selection Policy section |
| `MODEL_SELECTION_MATRIX.md` | New | Model profiles and task-type matrix |
| `ADMIN_HQ_CURRENT_STATE.md` | New | Admin HQ capability verdicts |
| `GIT_DESIGN_STATE_VERIFICATION.md` | New | Git state inspection report |
| `BRANCH_DAMAGE_TIMELINE_AUDIT.md` | New | Branch commit timeline audit |
| `admin-account-setup-guide.md` | New | Admin provisioning guide |
| `admin-client-discovery-migration-plan.md` | New | Discovery migration plan + Phase 1 record |
| `admin-dashboard-qa-issue-map.md` | New | ADM-001–017 issue map |
| `admin-hq-asset-loading-trace.md` | New | Asset loading failure trace |
| `admin-hq-design-regression-report.md` | New | White-background root cause + Fix A/B record |
| `admin-hq-initialization-hang-trace.md` | New | Init hang root cause + fix record |
| `admin-hq-recovery-phase1.md` | New | Phase 1 ops verification |
| `admin-login-failure-trace.md` | New | Auth/login inspection |
| `admin-storage-architecture-review.md` | New | R2 vs client-vault decision |
| `design-regression-freeze-audit.md` | New | UI freeze + recovery plan |
| `operations-core-gap-analysis.md` | New | Ops gaps + roadmap |
| `operations-core-phase1-blueprint.md` | New | ERD + migration strategy |
| `operations-core-phase1-implementation-plan.md` | New | WP0–WP10 plan |
| `operations-core-phase1-preflight.md` | New | WP0 pre-flight |
| `operations-core-wp1-report.md` | New | WP1 completion report |
| `supabase-p1-admin-legacy-tables.sql` | New | P1 table creation script (not auto-executed) |
| `rendorax-project-checklist.md` | Modified | Task tracking updates across all groups |

**Risk level:** None  
**Safe to commit:** Yes  
**Manual verification required:** No  
**Recommended commit message:** `Add inspection reports, governance docs, and admin/ops documentation (2026-07-04–05)`

**Note on `rendorax-project-checklist.md`:** This file contains tracking entries for all groups (admin, ops, timeline, visitor flow). It can be committed in Group A since all referenced work either already exists in the working tree or is documented. No code-specific tracking breaks if committed ahead of the code.

---

### Group B — Admin HQ Recovery (Phase 1 discovery, init hang fix, dark background, embedded widgets)

**Purpose:** Replaces legacy `supabase.storage.from("client-vault").list()` with `GET /api/media/clients`; fixes init spinner hang; adds `bg-bg-body` dark background; embeds `GlobalLiveWidget` and `ChatbotWidget` inside admin instead of floating.

**Files (5):**

| File | Status | Change Summary |
|------|--------|----------------|
| `rendorax-frontend/app/admin/page.tsx` | Modified (+70/−33) | `clientsLoading` state, `fetchMediaClients()`, dark bg classes, embedded comm strip, no full-page spinner |
| `rendorax-backend/src/routes/media.routes.ts` | Modified (+35/−0) | New `GET /api/media/clients` admin-only endpoint |
| `rendorax-frontend/utils/mediaAssets.ts` | Modified (+21/−0) | New `fetchMediaClients()` + `MediaClientRecord` type |
| `rendorax-frontend/components/ChatbotWidget.tsx` | Modified (+30/−3) | `isEmbedded` prop; admin route suppression of root floating instance |
| `rendorax-frontend/components/GlobalLiveWidget.tsx` | Modified (partial — admin-related lines only) | `isAdmin && !isEmbedded` guard; `isEmbedded && isAdmin` toolbar logic |

**Risk level:** Medium  
**Safe to commit:** Yes — after noting cross-group dependency below  
**Manual verification required:** Yes — pending `/admin` manual verify (dark background, client sidebar, embedded widgets)

**Cross-group dependency:** `GlobalLiveWidget.tsx` contains changes from **both Group B** (admin embedding) and **Group C** (visitor contact flow). These changes are in the same file but in **separate code paths** (`isAdmin` branch vs `!user` branch). They must be committed together as a single file. **Decision: commit `GlobalLiveWidget.tsx` in Group B** since the admin embedding was the larger/earlier change, and note Group C's visitor flow is included.

**Similarly, `ChatbotWidget.tsx`** has the `isEmbedded` prop (Group B) in the same file. No Group C changes exist in ChatbotWidget.

**Recommended commit message:** `Admin HQ recovery: dark background, Phase 1 client discovery, init hang fix, embedded comm strip`

---

### Group C — GlobalLiveWidget Visitor Contact Flow

**Purpose:** Logged-out visitors clicking "Talk to Rendorax" open the existing `ContactForm` in a modal overlay instead of being redirected to `/access`.

**Files (1):**

| File | Status | Change Summary |
|------|--------|----------------|
| `rendorax-frontend/components/contact/ContactModal.tsx` | New | Thin modal shell wrapping existing `ContactForm` (Esc/backdrop close, body scroll lock) |

**Risk level:** Low  
**Safe to commit:** Yes  
**Manual verification required:** Yes — pending manual verify (modal opens, form submits, all close methods work)

**Cross-group note:** The `GlobalLiveWidget.tsx` changes that wire this modal (`showContactModal` state, `ContactModal` import, `!user` branch rewrite) live in Group B's file. `ContactModal.tsx` is the only standalone Group C file. It can be committed independently since it's a new component with no dependencies on uncommitted code — `ContactForm` already exists in the committed codebase.

**Recommended commit message:** `Add ContactModal shell for visitor lead capture from GlobalLiveWidget`

---

### Group D — Timeline Sharing Phase 1 / Review Room

**Purpose:** Unifies room ID generation into `getReviewRoomId()` so dashboard screen share, comment socket rooms, and viewer cinema mode all use the same room key. Adds `emitJoinReviewRoom()` helper. Fixes useEffect dependency array for re-join on asset change.

**Files (4):**

| File | Status | Change Summary |
|------|--------|----------------|
| `rendorax-frontend/utils/reviewRoom.ts` | New | `getReviewRoomId()` + `emitJoinReviewRoom()` — canonical room ID helper |
| `rendorax-frontend/app/dashboard/page.tsx` | Modified (+19/−9) | `getReviewRoomId` replaces inline `previewFile?.name \|\| currentFolder \|\| "global-lobby"`; self-echo guard on cinema listener; useEffect deps updated |
| `rendorax-frontend/hooks/useLiveComments.ts` | Modified (+13/−7) | `getReviewRoomId` + `emitJoinReviewRoom` replace inline room logic; `previewFile?.assetId` added to deps |
| `timeline-sharing-regression-report.md` | Modified (+5/−5) | Status updates reflecting Phase 1 stabilization |

**Risk level:** Medium  
**Safe to commit:** Yes  
**Manual verification required:** Yes — pending two-browser Go Live test (per `timeline-sharing-restoration-blueprint.md` §10)

**Dependency:** `reviewRoom.ts` must be committed in this group (or before) since `dashboard/page.tsx` and `useLiveComments.ts` both import it at runtime.

**Recommended commit message:** `Timeline sharing Phase 1: unified review room ID contract and join helper`

---

### Group E — Operations Core WP1 / Prisma / Migration

**Purpose:** Adds `agencyProjectId` FK to `MediaAsset`, brief fields + status default to `AgencyProject`. WP1 schema-only — no application code references new fields.

**Files (3):**

| File | Status | Change Summary |
|------|--------|----------------|
| `rendorax-backend/prisma/schema.prisma` | Modified (+19/−11) | `agencyProjectId` on MediaAsset, `deadline`/`videoLength`/`editingStyle`/`referenceLinks` on AgencyProject, `assets` relation, status default change |
| `rendorax-backend/prisma/migrations/20260704161500_ops_core_phase1/migration.sql` | New | DDL: ALTER TABLE + FK + index |
| `rendorax-backend/prisma/migrations/migration_lock.toml` | New | Prisma migration lock (postgresql) |

**Risk level:** Medium-High (schema changes are architecture-locked and Auto-Mode-banned)  
**Safe to commit:** Yes — aligns Git with the database (columns already exist via `prisma db push`)  
**Manual verification required:** No — already applied to DB and backend build passes. Committing resolves the Git/DB mismatch, which is safer than leaving it uncommitted.

**Critical note:** The database already has these columns. NOT committing this group leaves an invisible mismatch where `schema.prisma` in Git disagrees with the live database. Committing is the safer path.

**Recommended commit message:** `Operations Core WP1: Prisma schema + migration for agencyProjectId and project brief fields`

---

### Group F — Hold / Needs Manual Review

**Purpose:** Files that should not be committed without explicit operator decision.

**Files (2):**

| File | Status | Concern |
|------|--------|---------|
| `rendorax-backend/scripts/create-admin.ts` | New (untracked) | Admin user creation script — existed before on disk (2026-06-18 timestamp) but was never tracked. May contain hardcoded credentials or be a development-only utility. **Inspect before committing.** |
| `rendorax-backend/scripts/_tmp-keys.mjs` | New (untracked) | Filename suggests temporary/secret key material. **Must inspect for secrets before any commit.** |

**Risk level:** Unknown until inspected  
**Safe to commit:** **No — must inspect first**  
**Manual verification required:** Yes — check for hardcoded secrets, API keys, passwords  

**Recommended action:** Inspect both files. If `_tmp-keys.mjs` contains secrets, add to `.gitignore` and do not commit. If `create-admin.ts` is a clean utility script, it can be added to Group A or Group E.

---

### Group/File Cross-Reference Matrix

| File | Group A (Docs) | Group B (Admin) | Group C (Visitor) | Group D (Timeline) | Group E (Ops) | Group F (Hold) |
|------|:-:|:-:|:-:|:-:|:-:|:-:|
| `AI_TEAM_PROTOCOL.md` | **A** | | | | | |
| `MODEL_SELECTION_MATRIX.md` | **A** | | | | | |
| `ADMIN_HQ_CURRENT_STATE.md` | **A** | | | | | |
| `GIT_DESIGN_STATE_VERIFICATION.md` | **A** | | | | | |
| `BRANCH_DAMAGE_TIMELINE_AUDIT.md` | **A** | | | | | |
| `admin-*.md` (7 files) | **A** | | | | | |
| `design-regression-freeze-audit.md` | **A** | | | | | |
| `operations-core-*.md` (4 files) | **A** | | | | | |
| `supabase-p1-admin-legacy-tables.sql` | **A** | | | | | |
| `rendorax-project-checklist.md` | **A** | | | | | |
| `app/admin/page.tsx` | | **B** | | | | |
| `media.routes.ts` | | **B** | | | | |
| `utils/mediaAssets.ts` | | **B** | | | | |
| `ChatbotWidget.tsx` | | **B** | | | | |
| `GlobalLiveWidget.tsx` | | **B** + C | | | | |
| `contact/ContactModal.tsx` | | | **C** | | | |
| `utils/reviewRoom.ts` | | | | **D** | | |
| `app/dashboard/page.tsx` | | | | **D** | | |
| `hooks/useLiveComments.ts` | | | | **D** | | |
| `timeline-sharing-regression-report.md` | | | | **D** | | |
| `timeline-sharing-production-readiness.md` | **A** | | | | | |
| `timeline-sharing-restoration-blueprint.md` | **A** | | | | | |
| `prisma/schema.prisma` | | | | | **E** | |
| `prisma/migrations/...` (2 files) | | | | | **E** | |
| `scripts/create-admin.ts` | | | | | | **F** |
| `scripts/_tmp-keys.mjs` | | | | | | **F** |

---

## Recommended Commit Order

| Order | Group | Commit Message | Files | Risk | Depends On |
|-------|-------|----------------|-------|------|------------|
| **1** | **A** | `Add inspection reports, governance docs, and admin/ops documentation (2026-07-04–05)` | 22 files (all `.md` + `.sql` docs) | None | Nothing |
| **2** | **E** | `Operations Core WP1: Prisma schema + migration for agencyProjectId and project brief fields` | 3 files (`schema.prisma`, migration SQL, lock) | Medium-High | Nothing (resolves DB/Git mismatch) |
| **3** | **B** | `Admin HQ recovery: dark background, Phase 1 client discovery, init hang fix, embedded comm strip` | 5 files (`admin/page.tsx`, `media.routes.ts`, `mediaAssets.ts`, `ChatbotWidget.tsx`, `GlobalLiveWidget.tsx`) | Medium | Group E committed (schema defines `MediaAsset` model used by `media.routes.ts`) |
| **4** | **C** | `Add ContactModal shell for visitor lead capture from GlobalLiveWidget` | 1 file (`ContactModal.tsx`) | Low | Group B committed (GlobalLiveWidget imports ContactModal) |
| **5** | **D** | `Timeline sharing Phase 1: unified review room ID contract and join helper` | 4 files (`reviewRoom.ts`, `dashboard/page.tsx`, `useLiveComments.ts`, `timeline-sharing-regression-report.md`) | Medium | Nothing (independent of Groups B/C/E) |
| **6** | **F** | *Do not commit* — inspect first, then decide | 2 files (`create-admin.ts`, `_tmp-keys.mjs`) | Unknown | Operator inspection |

### Why this order

1. **Group A first** because docs have zero risk, zero runtime impact, and clear the noise so subsequent commits are application-code-only.
2. **Group E second** because the Prisma schema is already applied to the database. Committing aligns Git with the live DB. If this is committed after Group B, there's a window where `media.routes.ts` references `MediaAsset` fields that the committed schema doesn't describe. Harmless at runtime (Prisma Client is already generated) but Git-inaccurate.
3. **Group B third** because it's the largest, most interconnected application change. Depends on schema being committed (Group E) so that `media.routes.ts` changes are consistent with the schema in the same commit history.
4. **Group C fourth** because `ContactModal.tsx` is imported by `GlobalLiveWidget.tsx` (committed in Group B). The import already exists in the committed code after Group B — this commit adds the file that satisfies it.
5. **Group D fifth** because it is fully independent of all other groups. Could be committed in any position from 2nd onward. Placing it last keeps the admin-focused commits together.
6. **Group F last (or never)** because these files need human inspection for secrets before any commit decision.

### Alternative order (if operator prefers E after B)

Groups D, E, and the A→B→C sequence are internally independent. The only hard constraint is:
- **A before everything** (noise reduction)
- **B before C** (ContactModal.tsx depends on GlobalLiveWidget importing it)
- **F last** (needs inspection)

Groups D and E can be inserted anywhere after A without breaking dependencies.

---

## Pre-Commit Checklist (per group)

| Group | Pre-commit check |
|-------|------------------|
| A | Skim docs for accidentally pasted secrets or credentials → none expected |
| B | `npm run build` passes after staging Group B files → already confirmed 2026-07-05 |
| C | `npm run build` passes with ContactModal + Group B → already confirmed 2026-07-05 |
| D | `npm run build` passes with reviewRoom + dashboard + useLiveComments → must verify |
| E | `npx prisma generate && npx tsc` in backend → already confirmed 2026-07-04 |
| F | Inspect `_tmp-keys.mjs` for secrets; inspect `create-admin.ts` for hardcoded credentials |

---

No files staged. No commits made. No pushes. No code modified. Report only.
