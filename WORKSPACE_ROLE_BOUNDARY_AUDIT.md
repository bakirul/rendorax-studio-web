# Workspace Role Boundary Audit

**Date:** 2026-07-06  
**Type:** Senior Architecture Inspection  
**Recommended Model:** Opus 4.6 HIGH  
**Task Type:** Inspection Only — no implementation, no refactor, no deployment

---

## 1. Current State

### 1.1 `/dashboard` — What It Actually Is

**Verdict: Mixed Editor Workspace + Client Review Portal**

The `/dashboard` route is a single 1,935-line monolithic page component that serves **both** the editor/admin production workspace **and** the client review experience. There is no separate client-facing view.

**What it currently does:**

| Capability | Owner | Notes |
|-----------|-------|-------|
| Media vault browsing (Supabase Storage + R2 CDN) | Editor + Client | Same UI for both roles |
| Media upload (vault + R2) | Editor + Client | Both can upload |
| Video preview with frame-accurate SMPTE timecode | Editor | Professional NLE-grade controls |
| Video comparison (A/B side-by-side) | Editor | Behind feature flag `enable_compare_mode` |
| Picture Lock (SHA-256 immutability) | Editor | Behind feature flag `enable_picture_lock` |
| Post-production phase tracker (6 stages) | Editor | `POST_PROD_STAGES` — Ingest → Final Master |
| Timestamped comments panel | Editor + Client | Shared comment system, same UI |
| Comment report download / marker export | Editor | Export CSV, JSON, Premiere XML |
| Screen share ("Over-the-Shoulder" timeline share) | Editor → Client | WebRTC OTS with talkback audio |
| Cinema mode (receive editor's screen) | Client | `TimelineShareWidget` renders received stream |
| Live session (video/audio call + chat) | Editor + Client | `GlobalLiveWidget` → `LiveSessionWidget` |
| LUFS audio loudness metering | Editor | Professional broadcast standard tool |
| Language selector (translation) | Editor + Client | `DashboardHeader` `<select>` with 20 languages |
| Appearance settings | Editor | Display customization |

**Role determination logic:**

```
isEditor = session.user.app_metadata?.role === "admin" || 
           session.user.app_metadata?.role === "editor"
```

This single boolean controls:
- Whether "Go Live" screen share button appears in header
- Whether `TimelineShareWidget` receives translations (TTS/subtitles)
- Whether `useLiveMicTranslation` activates speech capture

**There is no separate client view.** A client with `role !== "admin" && role !== "editor"` sees the exact same dashboard minus the screen share button. They see the same SMPTE timecode controls, LUFS meter, post-production phase selector, picture lock button, etc. — all tools designed for professional editors.

---

### 1.2 `/admin` — What It Actually Is

**Verdict: Operations HQ + Billing Panel + Asset Oversight**

The `/admin` route is locked behind middleware (`isAdmin` check on `app_metadata.role === "admin"`). Non-admin users are redirected to `/dashboard`.

**What it currently does:**

| Capability | Notes |
|-----------|-------|
| Client list (media API discovery) | Lists all users who have uploaded assets |
| Client asset browsing | View any client's R2 assets |
| Asset preview (full-screen modal) | Video player + client comments viewer |
| Asset download / share link / delete | Full CRUD on any client's assets |
| Project Phase Control | 6 status stages (same as dashboard but admin-side) |
| Project Brief viewer | Read-only view of `project_status_details` |
| Billing & Finances | Invoice creation, status tracking (Paid/Unpaid), deletion |
| Embedded ChatbotWidget | AI assistant in header |
| Embedded GlobalLiveWidget | Live session tools in "HQ Communications" footer |

**What it does NOT have:**
- No task assignment or tracking
- No team management
- No project timeline or Gantt view
- No language selector (translation locked to English — per language audit)
- No multi-project view
- No editor workload distribution

---

### 1.3 Current Route Map

| Route | Auth Required | Role Guard | Purpose |
|-------|:---:|:---:|---------|
| `/` | No | None | Marketing homepage |
| `/access` | No | Redirect if logged in | Login page |
| `/dashboard` | Yes | Any authenticated user | Mixed editor/client workspace |
| `/admin` | Yes | `admin` only | Operations HQ |
| `/portfolio` | No | None | Public portfolio showcase |
| `/portfolio/[slug]` | No | None | Portfolio item detail |
| `/studio` | No | None | Public studio info |
| `/services` | No | None | Public services page |
| `/pricing` | No | None | Public pricing page |
| `/contact` | No | None | Public contact form |
| `/journal` | No | None | Blog/journal listing |
| `/journal/[slug]` | No | None | Blog post detail |
| `/podcast` | No | None | Podcast page |
| `/career` | No | None | Career/jobs page |
| `/affiliate` | No | None | Affiliate program page |
| `/checklist` | No | None | Public checklist page |
| `/private-reel` | No | None | Private reel page |
| `/privacy` | No | None | Privacy policy |
| `/terms` | No | None | Terms of service |
| `/refund` | No | None | Refund policy |

---

## 2. Intended State — Business Role Definitions

### 2.1 Roles That Should Exist

Based on the Prisma `AgencyRole` enum, Supabase `app_metadata.role`, and the stated business requirements, here are the roles Rendorax Studio needs:

| Role | Prisma `AgencyRole` | Supabase `app_metadata.role` | Description |
|------|:---:|:---:|-------------|
| **Owner/Admin** | `admin` | `"admin"` | Studio owner. Full platform access. Billing, team management, all clients, all projects. |
| **Producer/PM** | — (missing) | — (missing) | Project manager. Assigns tasks, tracks deadlines, manages client communication. Not an editor. |
| **Editor** | `editor` | `"editor"` | Post-production editor. Edits video, manages vault, uses NLE tools. Primary production user. |
| **Colorist** | — (missing) | — (missing) | Color grading specialist. Needs preview player, scopes, LUT management. Subset of editor tools. |
| **GFX/VFX Designer** | — (missing) | — (missing) | Motion graphics / VFX. Needs asset vault, preview, possibly different tool panel. |
| **Audio/Sound Editor** | — (missing) | — (missing) | Audio post-production. Needs LUFS meter, waveform display, audio-focused preview. |
| **Client** | `client` | `"client"` (or unset) | External client. Reviews deliverables, leaves feedback, approves work, views invoices. |
| **Client Reviewer** | — (missing) | — (missing) | Invited by client. Review-only access to specific assets. No vault access. |

### 2.2 Current vs. Required

| Role | Exists in Prisma | Exists in Supabase | Has Dedicated UI | Status |
|------|:---:|:---:|:---:|--------|
| Admin | `admin` | `"admin"` | `/admin` | **Partial** — HQ exists but lacks task/team management |
| Editor | `editor` | `"editor"` | `/dashboard` (mixed) | **Partial** — tools exist but shared with client |
| Client | `client` | — (defaults to nothing) | `/dashboard` (same as editor) | **Missing** — no dedicated client experience |
| Producer/PM | — | — | — | **Missing entirely** |
| Colorist | — | — | — | **Missing entirely** |
| GFX/VFX | — | — | — | **Missing entirely** |
| Audio Editor | — | — | — | **Missing entirely** |
| Client Reviewer | — | — | — | **Missing entirely** |

**Critical observation:** Prisma defines `AgencyRole { admin, editor, client }` but the application barely uses Prisma for role checks. All runtime role logic is based on `supabase.auth.getUser() → app_metadata.role`. The Prisma `User.role` field exists but is not consulted by the dashboard or admin pages.

---

## 3. Boundary Violations

### 3.1 `/dashboard` Boundary Violations

| Violation | Severity | Detail |
|-----------|----------|--------|
| **Client sees editor tools** | High | SMPTE timecode, LUFS meter, picture lock, post-production phase selector, marker export, report download — these are all visible to non-editor users |
| **Client can change production stage** | High | The `projectStage` `<select>` dropdown is not role-gated. A client could change the phase from "Color Grading" to "Final Master" |
| **Client sees vault structure** | Medium | Clients see the full `VaultSidebar` with folder tree, Cloud Delivery tab, and vault tab — identical to the editor view |
| **Editor/Client share same comment flow** | Low | Not necessarily wrong, but there's no distinction between "client feedback" and "internal editor notes". All comments are in one stream |
| **Screen share is the only role-gated feature** | High | The `Go Live` button checks `isEditor` but everything else is visible to all authenticated users |

### 3.2 `/admin` Boundary Violations

| Violation | Severity | Detail |
|-----------|----------|--------|
| **No language selector** | Medium | Admin cannot select language for translation (identified in language audit) |
| **Client discovery uses generic userId** | Low | Client list shows raw UUIDs (`Client_a1b2c3d4...`) — no human-readable names |
| **Invoice system uses Supabase direct** | Medium | `client_invoices` table accessed via direct `supabase.from()` — no Prisma model, no backend validation |
| **Project Brief uses Supabase direct** | Medium | `project_status_details` and `project_status` — direct Supabase queries, no Prisma models |
| **No AgencyProject integration** | High | Admin does not use the Prisma `AgencyProject` model at all. The `project_status` Supabase table and the `AgencyProject` Prisma model are two parallel systems that don't talk to each other |
| **No Task model usage** | High | Prisma defines `Task { todo, in_progress, in_review, done }` but no UI exists anywhere to create, assign, or track tasks |

### 3.3 Cross-Workspace Violations

| Violation | Severity | Detail |
|-----------|----------|--------|
| **Two parallel project systems** | High | `project_status` (Supabase direct) used by both dashboard and admin for phase tracking. `AgencyProject` (Prisma) exists in schema but is unused by any page |
| **Comments stored in Supabase, assets in Prisma** | Medium | `video_comments` table (Supabase) ↔ `MediaAsset` (Prisma) — cross-system data join |
| **No shared project context** | High | Dashboard and admin don't share a project concept. Admin sees "clients" (by userId). Dashboard sees "folders" (by path). Neither uses `AgencyProject` |

---

## 4. Route Ownership Table — Current vs. Intended

| Route | Current Owner | Current Users | Intended Owner | Intended Users |
|-------|---------------|---------------|----------------|----------------|
| `/dashboard` | Mixed | All authenticated | **Editor Workspace** | Admin, Editor, Colorist, Audio, GFX/VFX |
| `/admin` | Admin | Admin only | **Operations HQ** | Admin, Producer/PM |
| `/access` | Auth | All | Auth | All (unchanged) |
| `/review` (does not exist) | — | — | **Client Review Portal** | Client, Client Reviewer |
| `/tasks` (does not exist) | — | — | **Team Task Board** | Admin, Producer/PM, Editor |
| Marketing routes | Public | Public | Public | Public (unchanged) |

---

## 5. Role → Workspace Matrix

| Role | `/dashboard` (Production) | `/admin` (Operations) | `/review` (Client Portal) | `/tasks` (Team Board) | Marketing |
|------|:---:|:---:|:---:|:---:|:---:|
| **Admin** | Full access | Full access | Read-only oversight | Full access | Public |
| **Producer/PM** | View-only | Project/task management | Read-only oversight | Full access | Public |
| **Editor** | Full production tools | No access | No access | Own tasks only | Public |
| **Colorist** | Color tools subset | No access | No access | Own tasks only | Public |
| **Audio Editor** | Audio tools subset | No access | No access | Own tasks only | Public |
| **GFX/VFX** | Asset + preview tools | No access | No access | Own tasks only | Public |
| **Client** | No access | No access | Full review + feedback | No access | Public |
| **Client Reviewer** | No access | No access | View + comment only | No access | Public |

---

## 6. Workspace Definitions

### 6A. Client Review Portal (`/review` — does not exist yet)

| Property | Value |
|----------|-------|
| **User roles** | Client, Client Reviewer |
| **Main purpose** | View deliverables, leave timestamped feedback, approve/reject cuts, view invoices |
| **Screens/routes** | `/review`, `/review/[projectId]`, `/review/[projectId]/[assetId]` |
| **What belongs here** | Video player (simplified), timestamped comments, approval workflow, invoice/billing viewer (read-only), live session (to talk to editor), translated communication |
| **What must NOT belong** | SMPTE timecode controls, LUFS meter, picture lock, post-production phase changer, vault folder tree, upload capability, marker export, file management (rename/move/delete), appearance settings |
| **Current code files involved** | `CommentsPanel.tsx`, `StreamingVideoPlayer.tsx`, `MediaPreviewPanel.tsx`, `TimelineShareWidget.tsx` (cinema mode receiver), `LiveSessionWidget.tsx`, `GlobalLiveWidget.tsx` (logged-in path) |
| **Current mismatches** | These components currently live in `/dashboard` and are shared with the editor. No standalone review route exists |

### 6B. Production Workspace (`/dashboard` — exists, needs narrowing)

| Property | Value |
|----------|-------|
| **User roles** | Admin, Editor, Colorist, Audio Editor, GFX/VFX Designer |
| **Main purpose** | Professional post-production: edit, color, audio, preview, manage vault, screen share, collaborate |
| **Screens/routes** | `/dashboard` (current), potentially `/dashboard/[projectId]` for multi-project |
| **What belongs here** | Vault sidebar, file grid, video player with SMPTE/frame controls, LUFS meter, comparison mode, picture lock, post-production phases, comment panel (internal notes), screen share (Go Live), upload, language selector, timeline scrubber, marker export, report generation |
| **What must NOT belong** | Invoice creation/management, client billing, team task assignment (belongs in `/tasks` or `/admin`), client-facing simplified review UI |
| **Current code files involved** | `app/dashboard/page.tsx`, `VaultSidebar.tsx`, `DashboardHeader.tsx`, `FileGrid.tsx`, `CloudAssetGallery.tsx`, `VideoTimelineScrubber.tsx`, `StreamingVideoPlayer.tsx`, `LUFSMeter.tsx`, `CommentsPanel.tsx`, `MediaPreviewPanel.tsx`, `TimelineShareWidget.tsx`, `LiveSessionToolbar.tsx`, `LiveMicToggle.tsx` |
| **Current mismatches** | Client users currently see all these professional tools. The `isEditor` flag only gates the screen share button — everything else is exposed |

### 6C. Admin / Operations HQ (`/admin` — exists, needs expansion)

| Property | Value |
|----------|-------|
| **User roles** | Admin, Producer/PM |
| **Main purpose** | Client management, project oversight, billing, team coordination, business operations |
| **Screens/routes** | `/admin` (current), potentially `/admin/projects`, `/admin/team`, `/admin/billing` |
| **What belongs here** | Client list (with real names, not UUIDs), project overview per client, phase control, billing/invoices, project brief management, team member list, task assignment, asset oversight (read-only browsing of any client's vault), language selector, live communication tools |
| **What must NOT belong** | NLE editing tools, LUFS meter, frame-accurate timecode, picture lock, vault file management (create/rename/move/delete), upload workflow |
| **Current code files involved** | `app/admin/page.tsx`, `GlobalLiveWidget.tsx` (embedded), `ChatbotWidget.tsx` (embedded), `mediaAssets.ts` (`fetchMediaClients`), `media.routes.ts` (`GET /api/media/clients`) |
| **Current mismatches** | Admin page works but uses Supabase-direct queries for `project_status`, `project_status_details`, and `client_invoices` — bypassing the Prisma `AgencyProject` and `Task` models entirely. No language selector. No team management |

### 6D. Team Task Workspace (`/tasks` — does not exist yet)

| Property | Value |
|----------|-------|
| **User roles** | Admin, Producer/PM (full), Editor/Colorist/Audio/GFX (own tasks) |
| **Main purpose** | Task assignment, tracking, status updates, deadline management |
| **Screens/routes** | `/tasks`, `/tasks/[projectId]` |
| **What belongs here** | Task board (kanban or list), task assignment, status transitions (`todo` → `in_progress` → `in_review` → `done`), deadline tracking, project grouping |
| **What must NOT belong** | Video editing tools, media preview, vault management, billing |
| **Current code files involved** | Prisma `Task` model (defined but unused), Prisma `AgencyProject` model (defined but unused) |
| **Current mismatches** | The entire Prisma Task + AgencyProject system is defined in schema but has zero frontend UI. No API routes serve task data |

---

## 7. Global Systems — Cross-Workspace Behavior Rules

### 7.1 GlobalLiveWidget

| Context | Current Behavior | Correct Behavior |
|---------|-----------------|-------------------|
| `/dashboard` (editor) | Embedded in sidebar (desktop), floating (mobile) | Keep as-is |
| `/dashboard` (client) | Same as editor | Should be available but simplified — client uses this to talk to editor during review |
| `/admin` | Embedded in "HQ Communications" footer | Keep as-is |
| `/review` (future) | Does not exist | Should be available — client's primary way to call the editor |
| Marketing (logged in) | Floating in bottom-left | Keep as-is (rare case) |
| Marketing (logged out) | "Talk to Rendorax" → ContactModal | Keep as-is |

**Rule:** GlobalLiveWidget should remain global. Its current scoping logic (admin embedding, visitor contact flow) is correct. No changes needed.

### 7.2 ChatbotWidget

| Context | Current Behavior | Correct Behavior |
|---------|-----------------|-------------------|
| All pages | Mounted in `app/layout.tsx` globally | Keep global |
| `/admin` | Embedded in header, root floating suppressed | Keep as-is |
| `/review` (future) | Would render floating (default) | Should render — client AI assistant |

**Rule:** ChatbotWidget should remain global. No changes needed.

### 7.3 Language Selector / Translation

| Context | Current Behavior | Correct Behavior |
|---------|-----------------|-------------------|
| `/dashboard` | `<select>` in `DashboardHeader` | Keep |
| `/admin` | Missing | Must add (Group G planned) |
| `/review` (future) | Does not exist | Must include — clients select their language |
| Marketing | Not available | Not needed |

**Rule:** When `/review` is created, it must include a language selector. Group G extraction (from `WORKING_TREE_SPLIT_PLAN.md`) will make this component reusable.

### 7.4 Notifications

| Current | Correct |
|---------|---------|
| `showToast()` exists via `useToastStore` | Sufficient for now. Future: server-side notification system for task assignments, review requests, invoice alerts |

### 7.5 Timeline Sharing (Screen Share / Cinema Mode)

| Context | Current Behavior | Correct Behavior |
|---------|-----------------|-------------------|
| Editor on `/dashboard` | "Go Live" starts screen share; WebRTC stream to room | Keep as-is |
| Client on `/dashboard` | Receives cinema mode if editor is sharing | Should move to `/review` when it exists — client watches editor's screen there |
| `/admin` | Not available | Not needed in admin — this is a production/review tool |

**Rule:** Timeline sharing is a Production ↔ Review feature. It should exist on `/dashboard` (sender) and `/review` (receiver). Not on `/admin`.

### 7.6 Comments

| Context | Current Behavior | Correct Behavior |
|---------|-----------------|-------------------|
| `/dashboard` | `CommentsPanel` — live socket comments, timestamped | Keep for internal editor notes |
| `/admin` | Read-only view of `video_comments` in preview modal | Keep for oversight |
| `/review` (future) | Does not exist | Must have — this is the client's primary feedback mechanism |

**Rule:** Comments are cross-workspace but role-scoped. Editors write internal notes. Clients write review feedback. Admin views both. Currently, all comments go into the same `video_comments` table with no role tagging — this is a future data model concern, not an immediate code change.

### 7.7 Media Playback

| Context | Current Behavior | Correct Behavior |
|---------|-----------------|-------------------|
| `/dashboard` | Full NLE player: SMPTE, frame step, speed, LUFS, comparison, picture lock, caption tracks | Keep for editor |
| `/admin` | Simplified player in full-screen modal | Keep for oversight |
| `/review` (future) | Does not exist | Simplified player + comment panel — no SMPTE/LUFS/comparison/lock |

**Rule:** The player component (`StreamingVideoPlayer`) is already decoupled and reusable. The surrounding tooling (timecode, LUFS, etc.) is in the dashboard page, not in the player component. This is correct architecture — the player is clean, the page wraps it with role-appropriate controls.

---

## 8. Architecture Rules — What to Preserve

| Rule | Current State | Verdict |
|------|--------------|---------|
| Supabase = auth + database + metadata | Auth works. Some direct Supabase queries bypass Prisma | **Keep Supabase for auth. Migrate direct queries to Prisma over time** |
| Prisma = operations / business models | Schema defined (`User`, `AgencyProject`, `Task`, `MediaAsset`) but only `MediaAsset` and `MediaProcessingJob` are actually used | **Keep. Start using `AgencyProject` and `Task` when building `/tasks`** |
| R2 = all media / video / object storage | Fully implemented via `media.routes.ts` and `mediaAssets.ts` | **Keep. No changes needed** |
| Dashboard structure | 1,935-line monolith | **Keep for now — do not refactor until review portal is created** |
| Existing review workflow | Comments + socket.io live comments + marker export | **Keep. This is production-ready functionality** |
| Middleware auth guards | `/admin` → admin only, `/dashboard` → any auth user | **Keep. Add `/review` guard when it exists** |

---

## 9. What to Keep (Do Not Touch)

| Item | Reason |
|------|--------|
| `/dashboard` page structure | Working production workspace. Refactoring now would risk breaking verified functionality |
| `/admin` page structure | Working operations HQ. Pending Group B verification |
| Middleware role guards | Clean, correct, extensible |
| `GlobalLiveWidget` scoping logic | Well-designed conditional rendering |
| `LiveSessionWidget` + translation engine | 3-pathway translation system is complete and functional |
| `VaultSidebar` component | Clean, role-agnostic — can be reused or excluded per workspace |
| `CommentsPanel` component | Clean, reusable — can be placed in review portal |
| `StreamingVideoPlayer` component | Clean, decoupled — already reusable |
| Prisma schema | Correctly models the business domain. `AgencyProject` + `Task` are ready for use |
| R2 media pipeline | Fully operational upload → process → playback chain |

---

## 10. What to Move Later (After Current Commits Are Done)

| Item | From | To | Priority |
|------|------|----|----------|
| Client-facing review experience | Hardcoded in `/dashboard` | New `/review` route | High |
| Task management UI | Nonexistent | New `/tasks` route or `/admin/tasks` sub-route | Medium |
| Invoice/billing to Prisma | Direct Supabase queries in `/admin` | Prisma `Invoice` model + API routes | Medium |
| Project Brief to Prisma | Direct Supabase `project_status_details` | Prisma `AgencyProject` brief fields (already exist in schema) | Medium |
| Project Phase to Prisma | Direct Supabase `project_status` | Prisma `AgencyProject.status` (already exists in schema) | Medium |
| Language selector extraction | `DashboardHeader.tsx` | Standalone `LanguageSelector.tsx` (Group G in split plan) | Low |
| Producer/PM role | Not defined | Add to `AgencyRole` enum + Supabase `app_metadata` | Low (future) |
| Specialized roles (Colorist, Audio, GFX) | Not defined | Add to `AgencyRole` enum with feature-flag gating | Low (future) |

---

## 11. What Not to Touch Now

| Item | Reason |
|------|--------|
| Prisma `AgencyRole` enum | Adding roles requires migration + Supabase metadata sync. Do this when building task management |
| Dashboard page refactoring | 1,935 lines is large but working. Splitting it into sub-components is a separate task with regression risk |
| Comment data model | Adding role tags or separating internal/external comments is a data migration task. Not urgent |
| Supabase-to-Prisma migration of direct queries | The `project_status`, `project_status_details`, and `client_invoices` tables work. Migrating to Prisma is correct but not urgent |
| Multi-project support | Dashboard currently has no project concept (it's folder-based). Adding `AgencyProject` integration is a feature, not a fix |
| Client display names | Admin shows `Client_a1b2c3d4...` because `MediaClientRecord` only has `userId`. Fixing this requires a user lookup — improvement, not a boundary fix |

---

## 12. Recommended Next Implementation — ONE TASK ONLY

### Create a Read-Only Client Review Route (`/review`)

**Why this is the single highest-priority task:**

1. It resolves the most severe boundary violation: clients currently see professional NLE editing tools they should never interact with (SMPTE, LUFS, picture lock, phase selector, marker export).
2. It is the lowest-risk architectural change: it adds a new route without modifying existing ones.
3. It reuses existing components: `StreamingVideoPlayer`, `CommentsPanel`, `GlobalLiveWidget`, `ChatbotWidget`, and `LanguageSelector` (after Group G) are all already built.
4. It does not require Prisma schema changes, database migrations, or new backend APIs.
5. It creates the foundation for proper workspace separation without touching `/dashboard` or `/admin`.

**Scope:**

| Item | Detail |
|------|--------|
| Route | `/review` (or `/review/[assetId]` if asset-specific) |
| Auth | Middleware: require auth, allow `client` role (or any non-admin/editor) |
| Components to reuse | `StreamingVideoPlayer`, `CommentsPanel`, `GlobalLiveWidget`, `ChatbotWidget` |
| Components to exclude | `VaultSidebar`, `DashboardHeader`, `VideoTimelineScrubber` (NLE controls), `LUFSMeter`, picture lock, comparison mode, upload, appearance settings, marker export |
| New components needed | Simplified review header (asset name + language selector + navigation), review asset list (filtered to "Ready for Review" status only) |
| Data source | `fetchMediaAssets({ userId: currentUser.id })` — client sees their own assets only |
| Comments | `useLiveComments` hook — works as-is, already scoped to user/asset |
| Live session | `GlobalLiveWidget` — works as-is from root layout |
| Translation | Needs Group G `LanguageSelector` extraction first (or inline a temporary selector) |

**What this task does NOT do:**
- Does not modify `/dashboard` (editor keeps everything)
- Does not modify `/admin`
- Does not add new Prisma models
- Does not change auth flow
- Does not require new backend routes

**Prerequisites:**
- Complete Groups B, C, D commits (per `WORKING_TREE_SPLIT_PLAN.md`)
- Complete Group G (language selector extraction) — or defer and add selector inline

---

## Appendix: Component Placement Rules

### Which components belong where

| Component | Dashboard (Production) | Admin (Ops HQ) | Review (Client) | Marketing |
|-----------|:---:|:---:|:---:|:---:|
| `StreamingVideoPlayer` | Yes | Yes (modal) | Yes | No |
| `VideoTimelineScrubber` | Yes | No | No | No |
| `LUFSMeter` | Yes | No | No | No |
| `CommentsPanel` | Yes (internal notes) | Yes (read-only) | Yes (client feedback) | No |
| `VaultSidebar` | Yes | No | No | No |
| `DashboardHeader` | Yes | No | No | No |
| `FileGrid` / `CloudAssetGallery` | Yes | No | Simplified asset list | No |
| `GlobalLiveWidget` | Yes (embedded sidebar) | Yes (embedded comm footer) | Yes (floating or embedded) | Yes (contact modal) |
| `ChatbotWidget` | Yes (floating) | Yes (embedded header) | Yes (floating) | Yes (floating) |
| `LanguageSelector` | Yes (header) | Yes (needed — Group G) | Yes (needed) | No |
| `LiveSessionToolbar` | Yes (header) | Yes (embedded) | No (use GlobalLiveWidget directly) | No |
| `TimelineShareWidget` | Yes (cinema sender) | No | Yes (cinema receiver) | No |
| `ContactModal` | No | No | No | Yes (logged-out only) |
| `MediaPreviewPanel` | Yes | Yes (modal) | Yes | No |

---

## Appendix: Parallel Data Systems — Current State

The codebase has two parallel data systems that need eventual unification:

| Concept | Supabase Direct (current) | Prisma (defined but unused by UI) |
|---------|--------------------------|-----------------------------------|
| Project | `project_status` table | `AgencyProject` model |
| Project brief | `project_status_details` table | `AgencyProject.deadline`, `.videoLength`, `.editingStyle`, `.referenceLinks` fields |
| Project status | `project_status.status` column | `AgencyProject.status` field (default: "Awaiting Assets") |
| Tasks | Does not exist | `Task` model with `TaskStatus { todo, in_progress, in_review, done }` |
| User/Team | `auth.users` only | `User` model with `AgencyRole { admin, editor, client }` |
| Invoices | `client_invoices` table | No Prisma model |
| Comments | `video_comments` table | No Prisma model |
| Media assets | — | `MediaAsset` model (actively used) |
| Folders | — | `MediaFolder` model (actively used) |

This parallel system is the root cause of why `/admin` and `/dashboard` feel disconnected — they read from different data sources for what should be the same concepts.

**Resolution path (future, not now):** Migrate `project_status` → `AgencyProject.status`, `project_status_details` → `AgencyProject` brief fields, create `Invoice` Prisma model, create `Comment` Prisma model. This unifies the data layer and makes cross-workspace features consistent.

---

No code modified. No files staged. No commits made. No pushes performed.
