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

**Resolution (2026-07-05):** Secret inspection completed. `create-admin.ts` sanitized (hardcoded credentials replaced with env vars / CLI args). `_tmp-keys.mjs` deleted from working tree. `.gitignore` updated to ignore `scripts/_tmp-*.{mjs,ts,js}`. `create-admin.ts` committed with Group E (backend `.gitignore` change). `_tmp-keys.mjs` no longer exists. **Group F is resolved.**

---

### Group G — Global Language Selector Extraction (Planned / Not Implemented)

**Status:** Planned — not yet implemented, not in working tree  
**Source:** `GLOBAL_LANGUAGE_COMMUNICATION_AUDIT.md` (2026-07-05)

**Purpose:** Extract the language selector from `DashboardHeader.tsx` into a reusable component and render it on `/admin` and wherever live communication tools appear, so users outside `/dashboard` can select their preferred language for real-time translation.

**Problem:** The translation engine (3 pathways: OpenAI Realtime audio, Gemini speech-to-text, Gemini chat text) is global — it runs wherever `LiveSessionWidget` renders, including admin and all authenticated pages. However, the language selector (`<select>` with 20 languages) is hardcoded inside `DashboardHeader.tsx`, which only renders on `/dashboard`. Without the selector, `useGlobalStore().selectedLanguage` stays at the default `"en-US"` on all other pages, effectively locking translation to English outside the dashboard.

**This is a pre-existing architectural limitation, not caused by any Group B/C/D change.**

**Planned files (4):**

| File | Status | Planned Change |
|------|--------|----------------|
| `rendorax-frontend/components/LanguageSelector.tsx` | New | Extracted `LANGUAGES` array + `<select>` from `DashboardHeader.tsx`. Standalone component reading/writing `useGlobalStore().selectedLanguage` |
| `rendorax-frontend/components/DashboardHeader.tsx` | Modified | Replace inline `LANGUAGES` array + `<select>` with `<LanguageSelector />` import. Drop-in replacement, zero behavior change |
| `rendorax-frontend/app/admin/page.tsx` | Modified | Render `<LanguageSelector />` in Admin HQ header row (beside existing admin tools) |
| `rendorax-frontend/components/dashboard/LiveSessionToolbar.tsx` | Modified (optional) | Render `<LanguageSelector compact />` inside toolbar for global coverage on non-dashboard pages |

**Risk level:** Low (additive, pure refactor + new render points)  
**Safe to commit:** N/A — no code exists yet  
**Manual verification required:** Yes — verify language selector appears and functions on `/admin`; verify dashboard behavior unchanged  
**Blocks on:** Group B committed (admin page must be committed before modifying it further)

**What this group does NOT do:**
- Does not add translation features for logged-out visitors (by design — visitors use the contact form)
- Does not persist `selectedLanguage` across sessions (localStorage/cookie — separate scope)
- Does not auto-detect browser language (separate decision)
- Does not duplicate the `LANGUAGES` array (extraction eliminates the only copy)

**Recommended commit message (when implemented):** `Extract global language selector from DashboardHeader; add to Admin HQ and LiveSessionToolbar`

---

### Group/File Cross-Reference Matrix

| File | A (Docs) | B (Admin) | C (Visitor) | D (Timeline) | E (Ops) | F (Hold) | G (Language — Planned) |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `AI_TEAM_PROTOCOL.md` | **A** | | | | | | |
| `MODEL_SELECTION_MATRIX.md` | **A** | | | | | | |
| `ADMIN_HQ_CURRENT_STATE.md` | **A** | | | | | | |
| `GIT_DESIGN_STATE_VERIFICATION.md` | **A** | | | | | | |
| `BRANCH_DAMAGE_TIMELINE_AUDIT.md` | **A** | | | | | | |
| `admin-*.md` (7 files) | **A** | | | | | | |
| `design-regression-freeze-audit.md` | **A** | | | | | | |
| `operations-core-*.md` (4 files) | **A** | | | | | | |
| `supabase-p1-admin-legacy-tables.sql` | **A** | | | | | | |
| `rendorax-project-checklist.md` | **A** | | | | | | |
| `app/admin/page.tsx` | | **B** | | | | | **G** |
| `media.routes.ts` | | **B** | | | | | |
| `utils/mediaAssets.ts` | | **B** | | | | | |
| `ChatbotWidget.tsx` | | **B** | | | | | |
| `GlobalLiveWidget.tsx` | | **B** + C | | | | | |
| `contact/ContactModal.tsx` | | | **C** | | | | |
| `utils/reviewRoom.ts` | | | | **D** | | | |
| `app/dashboard/page.tsx` | | | | **D** | | | |
| `hooks/useLiveComments.ts` | | | | **D** | | | |
| `timeline-sharing-regression-report.md` | | | | **D** | | | |
| `timeline-sharing-production-readiness.md` | **A** | | | | | | |
| `timeline-sharing-restoration-blueprint.md` | **A** | | | | | | |
| `prisma/schema.prisma` | | | | | **E** | | |
| `prisma/migrations/...` (2 files) | | | | | **E** | | |
| `scripts/create-admin.ts` | | | | | | **F** ✅ | |
| `scripts/_tmp-keys.mjs` | | | | | | **F** ✅ | |
| `components/LanguageSelector.tsx` | | | | | | | **G** (new) |
| `components/DashboardHeader.tsx` | | | | | | | **G** |
| `dashboard/LiveSessionToolbar.tsx` | | | | | | | **G** (optional) |

---

## Recommended Commit Order

| Order | Group | Status | Commit Message | Files | Risk | Depends On |
|-------|-------|--------|----------------|-------|------|------------|
| **1** | **A** | ✅ Committed `53c1f85` | `Document admin operations and timeline recovery audits` | 22 files (all `.md` + `.sql` docs) | None | Nothing |
| **2** | **E** | ✅ Committed `fd2b3e3` | `Add operations core WP1 schema migration` | 3 files (`schema.prisma`, migration SQL, lock) + backend `.gitignore` | Medium-High | Nothing |
| **3** | **B** | ⏸️ HOLD — pending manual browser verification | `Admin HQ recovery: dark background, Phase 1 client discovery, init hang fix, embedded comm strip` | 5 files (`admin/page.tsx`, `media.routes.ts`, `mediaAssets.ts`, `ChatbotWidget.tsx`, `GlobalLiveWidget.tsx`) | Medium | Group E ✅ |
| **4** | **C** | ⏸️ Pending manual verify (modal opens, form submits, close methods) | `Add ContactModal shell for visitor lead capture from GlobalLiveWidget` | 1 file (`ContactModal.tsx`) | Low | Group B committed first |
| **5** | **D** | ⏸️ Pending two-browser Go Live test | `Timeline sharing Phase 1: unified review room ID contract and join helper` | 4 files (`reviewRoom.ts`, `dashboard/page.tsx`, `useLiveComments.ts`, `timeline-sharing-regression-report.md`) | Medium | Nothing (independent) |
| **6** | **F** | ✅ Resolved — sanitized + deleted + `.gitignore` updated | N/A — no standalone commit needed | 0 files remaining | Resolved | N/A |
| **7** | **G** | 📋 Planned — not yet implemented | `Extract global language selector from DashboardHeader; add to Admin HQ and LiveSessionToolbar` | ~4 files (`LanguageSelector.tsx`, `DashboardHeader.tsx`, `admin/page.tsx`, `LiveSessionToolbar.tsx`) | Low | Group B committed first |

### Why this order

1. **Group A first** ✅ — docs have zero risk, zero runtime impact, cleared the noise for application commits.
2. **Group E second** ✅ — Prisma schema already applied to DB. Committing aligned Git with the live database.
3. **Group B third** ⏸️ — largest, most interconnected application change. Depends on Group E (committed). **Blocked on operator manual browser verification:** `/admin` dark background, client sidebar, embedded widgets, asset loading. See `ADMIN_HQ_GROUP_B_VERIFY.md` for the 10-item checklist.
4. **Group C fourth** ⏸️ — `ContactModal.tsx` is imported by `GlobalLiveWidget.tsx` (committed in Group B). Cannot be committed until Group B is committed first. Also requires manual modal verification.
5. **Group D fifth** ⏸️ — fully independent of Groups B/C. Could be committed in any position from 3rd onward. Requires two-browser Go Live test per `timeline-sharing-restoration-blueprint.md` §10.
6. **Group F resolved** ✅ — `create-admin.ts` sanitized (env vars + CLI args). `_tmp-keys.mjs` deleted. `.gitignore` rule added. Changes absorbed into Group E commit.
7. **Group G last** 📋 — purely additive future work. No files exist in working tree yet. Cannot begin until Group B is committed (modifies `admin/page.tsx`). Does not block any other group.

### Hard constraints

- **B before C** — `ContactModal.tsx` depends on `GlobalLiveWidget.tsx` importing it (committed in B)
- **B before G** — Group G modifies `admin/page.tsx` which must be committed in B first
- **D independent** — can be committed at any position from 3rd onward
- **G last** — planned future work, no code exists yet

### Current blockers

| Group | Blocker | Action Required |
|-------|---------|-----------------|
| B | Manual browser verification not yet completed | Operator tests `/admin` in real browser (10-item checklist in `ADMIN_HQ_GROUP_B_VERIFY.md`) |
| C | Depends on B + own manual verify | Operator tests contact modal (open, submit, Esc/backdrop/X close) |
| D | Two-browser Go Live test not yet completed | Operator runs two-browser screen share test |
| G | Not yet implemented | Operator approves scope, then implementation can begin |

---

## Pre-Commit Checklist (per group)

| Group | Pre-commit check | Status |
|-------|------------------|--------|
| A | Skim docs for accidentally pasted secrets or credentials → none expected | ✅ Committed |
| E | `npx prisma generate && npx tsc` in backend → already confirmed 2026-07-04 | ✅ Committed |
| B | `npm run build` passes after staging Group B files → confirmed 2026-07-05. **Manual browser verify required** (see `ADMIN_HQ_GROUP_B_VERIFY.md`) | ⏸️ Pending verify |
| C | `npm run build` passes with ContactModal + Group B → confirmed 2026-07-05. **Manual modal verify required** | ⏸️ Pending verify |
| D | `npm run build` passes with reviewRoom + dashboard + useLiveComments → must verify. **Two-browser Go Live test required** | ⏸️ Pending verify |
| F | Inspect `_tmp-keys.mjs` for secrets; inspect `create-admin.ts` for hardcoded credentials | ✅ Resolved |
| G | Extract `LanguageSelector` from `DashboardHeader.tsx`; verify selector renders on `/admin` and `/dashboard` without regression; `npm run build` passes | 📋 Planned |

---

---

## Revision History

| Date | Change |
|------|--------|
| 2026-07-05 (initial) | Groups A–F defined. 38 files classified. Commit order established. |
| 2026-07-05 (post-commit) | Groups A + E committed (`53c1f85`, `fd2b3e3`). Group F resolved (sanitized + deleted). |
| 2026-07-05 (language audit) | Group G added per `GLOBAL_LANGUAGE_COMMUNICATION_AUDIT.md`. No reclassification of Groups B/C/D — language selector gap is pre-existing, not caused by uncommitted changes. |

---

No files staged. No commits made. No pushes. No code modified. Report only.
