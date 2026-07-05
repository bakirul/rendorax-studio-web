# Operations Core — Gap Analysis

**Created:** 2026-07-04  
**Type:** Inspection only — no implementation, no refactor, no deploy  
**Goal:** Define what is required to manage real clients, real projects, and internal production team **before marketing/scale**

**Architecture preserved:** Supabase = auth + metadata tables · R2 + Prisma `MediaAsset` = media bytes/index · Express backend on `:4000`

**Stabilized locally (per checklist):** Auth, upload, R2 playback, comments, reviewer identity/avatar, notifications, compare, timeline markers, export, admin login, admin client discovery Phase 1

**Related:** `review-collaboration-layer-map.md`, `legacy-supabase-tables-migration-plan.md`, `admin-dashboard-qa-issue-map.md`, `timeline-sharing-production-readiness.md`

---

## Executive summary

| Operations pillar | Overall status | Blocker |
|-------------------|----------------|---------|
| **Client management** | **Partial** | No company/org model; client = auth `userId` / storage UUID; no invites |
| **Project management** | **Partial / Broken** | **Two disconnected models** — Supabase `project_status` (per user) vs Prisma `AgencyProject` (unused in UI) |
| **Team management** | **Partial** | Only `admin` \| `editor` \| `client`; no specialty roles |
| **Assignment workflow** | **Missing** (UI) / **Partial** (API) | `Task` model exists; **no dashboard/admin UI**; no comment→task link |
| **Feedback routing** | **Partial** | Compile & Send broadcasts; **no** department/assignee routing |
| **Work status system** | **Partial** | Admin pipeline strings + `TaskStatus` enum; **no** comment lifecycle |
| **Admin HQ ops view** | **Partial** | Per-client vault + phase + billing; **no** workload/queue dashboards |

**Verdict:** Review/collaboration layer is **locally strong**; **operations core is not** — agency Prisma layer is API-only dead code; admin HQ uses legacy Supabase tables keyed by `user_id`, not unified projects.

---

## 1. Client management

### 1.1 Intended vs implemented

| Capability | Status | Evidence |
|------------|--------|----------|
| **Client / company model** | **Missing** | No `Company`, `Organization`, or `ClientAccount` in `schema.prisma` or Supabase SQL |
| **Client contacts** | **Missing** | No contact persons, billing contact, or PM fields beyond brief columns in `project_status_details` (P1, read-only in admin) |
| **Client reviewers** | **Partial** | Any authenticated user can comment on `file_name`; `user_id` on `video_comments` — no reviewer roster |
| **Invite flow** | **Missing** | No invite API, token, or email; `/access` is login-only (`review-collaboration-layer-map.md` §1) |
| **Client discovery (admin)** | **Partial** | Phase 1: `GET /api/media/clients` → distinct `MediaAsset.userId` (`media.routes.ts` groupBy) |
| **Client ↔ auth user link** | **Partial** | `AgencyProject.clientId` → Prisma `User.id` (Supabase auth UUID); **not used in admin UI** |
| **Client display name** | **Partial** | Admin shows `Client_{uuid[0:8]}...`; `User.displayName` optional, not shown in HQ |

### 1.2 Data sources today

```text
Admin sidebar client key  →  MediaAsset.userId  (R2/Prisma index)
Agency client link        →  AgencyProject.clientId  →  User.id  (unused in UI)
Admin phase/billing/brief →  project_* tables keyed by user_id  (P1 Supabase)
Comments                  →  video_comments keyed by file_name  (no project_id)
```

### 1.3 Gap summary

| Item | Working | Partial | Missing | Broken |
|------|---------|---------|---------|--------|
| Client UUID discovery | ✓ (admin) | | | |
| Company / org | | | ✓ | |
| Contacts | | | ✓ | |
| Invites | | | ✓ | |
| Multi-reviewer roster | | ✓ | | |
| Client email/name in HQ | | ✓ | | |

---

## 2. Project management

### 2.1 Dual project systems (critical drift)

| System | Storage | Key | UI | Status |
|--------|---------|-----|-----|--------|
| **Legacy admin pipeline** | Supabase `project_status` | `user_id` (one row per client user) | `/admin` phase buttons | **Partial** — P1 tables **not applied** in project `bviltofeuqsibbgancby` (checklist §14) |
| **Agency projects** | Prisma `AgencyProject` | `id` UUID | **None** | **Missing** UI — API only |
| **Portfolio showcase** | Prisma `Project` | `id` | Marketing `/portfolio` | **Working** — unrelated to client ops |
| **Media assets** | Prisma `MediaAsset` | `userId` | `/dashboard` vault | **Working** — not linked to `AgencyProject.id` |

**There is no single “project” record** tying client, assets, comments, status, and tasks.

### 2.2 Capability matrix

| Capability | Status | Evidence |
|------------|--------|----------|
| **Project model** | **Partial** | `AgencyProject` exists; admin uses `project_status` per **user**, not project |
| **Project status** | **Partial** | Admin strings: Awaiting Assets → Ready for Review (`page.tsx` L38–43); `AgencyProject.status` free text default `"active"` |
| **Project assets** | **Partial** | `MediaAsset.userId` scopes vault; **no** `projectId` on `MediaAsset` |
| **Review sessions** | **Missing** | Ephemeral Socket.io only (`timeline-sharing-production-readiness.md`) |
| **Delivery status** | **Partial** | Invoice `Paid`/`Unpaid`; admin pipeline “Ready for Review”; **no** delivered/archived enum |
| **Brief / requirements** | **Partial** | `project_status_details` — admin read-only; no client form writes |

### 2.3 Gap summary

| Item | Working | Partial | Missing | Broken |
|------|---------|---------|---------|--------|
| Portfolio `Project` (marketing) | ✓ | | | |
| Client production project | | ✓ | | ✓ (split models) |
| Asset↔project link | | | ✓ | |
| Review session persistence | | | ✓ | |
| P1 admin tables (new Supabase) | | | | ✓ (not created) |

---

## 3. Team management

### 3.1 Roles in code

**Supabase JWT** (`app_metadata.role`) — gates `/admin`, `isEditor`, agency mapping:

```3:8:rendorax-backend/src/lib/agencyUsers.ts
export function mapSupabaseRoleToAgencyRole(role: string | undefined): AgencyRole {
  if (role === "admin") return "admin";
  if (role === "client") return "client";
  return "editor";
}
```

**Prisma `AgencyRole` enum:** `admin` | `editor` | `client` only (`schema.prisma` L117–122).

### 3.2 Role participation matrix

| Role (product) | Modeled? | Dashboard | Admin HQ | Agency API |
|----------------|----------|-----------|----------|------------|
| **Admin** | ✓ | ✓ | ✓ | Full task list |
| **Editor** | ✓ | ✓ | ✗ | Own tasks + create project/task |
| **Client** | ✓ | ✓ | ✗ | Assigned + client projects (read tasks) |
| **Producer** | **Missing** | — | — | — |
| **Colorist** | **Missing** | — | — | — |
| **GFX/VFX** | **Missing** | — | — | — |
| **Audio engineer** | **Missing** | — | — | — |
| **Reviewer** (internal) | **Missing** | Treated as `editor` or `client` | — | — |

### 3.3 Team roster

| Capability | Status |
|------------|--------|
| Prisma `User` table | **Partial** — upsert on first agency API call (`ensureAgencyUser`); no admin UI to list/manage |
| User CRUD API | **Missing** |
| Team assignment to client | **Missing** — only `AgencyProject.ownerId` + `clientId` |
| Department field | **Missing** |

### 3.4 Gap summary

| Item | Working | Partial | Missing | Broken |
|------|---------|---------|---------|--------|
| admin / editor / client | ✓ | | | |
| Specialty roles | | | ✓ | |
| Team roster UI | | | ✓ | |
| Prisma User sync | | ✓ | | |

---

## 4. Assignment workflow

### 4.1 Prisma `Task` model (exists, unwired)

```168:185:rendorax-backend/prisma/schema.prisma
model Task {
  id          String        @id @default(uuid())
  title       String
  description String?
  status      TaskStatus    @default(todo)
  dueDate     DateTime?
  projectId   String
  assigneeId  String?
  ...
}
```

**`TaskStatus`:** `todo` | `in_progress` | `in_review` | `done`

### 4.2 API surface

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/agency/projects` | POST | **Working** (backend + Next proxy) |
| `/api/agency/projects` | GET | **Missing** |
| `/api/agency/tasks` | GET | **Working** — role-filtered |
| `/api/agency/tasks` | POST | **Working** — requires `assigneeId` |
| `/api/agency/tasks/:id` | PATCH/DELETE | **Missing** |

**Frontend usage:** **Zero** — no imports of agency API in `app/dashboard/page.tsx` or `app/admin/page.tsx` (grep confirms proxy routes only).

### 4.3 Assignment gaps

| Capability | Status |
|------------|--------|
| Project → team member | **Partial** — `Task.assigneeId` via API only |
| Asset → responsible person | **Missing** |
| Comment → task / note | **Missing** — `video_comments` has no `task_id` |
| Department ownership | **Missing** |
| Due dates | **Partial** — `Task.dueDate` only |
| Priorities | **Missing** — no field on `Task` |

### 4.4 Gap summary

| Item | Working | Partial | Missing | Broken |
|------|---------|---------|---------|--------|
| Task create/fetch API | ✓ | | | |
| Task UI | | | ✓ | |
| Comment→assignment | | | ✓ | |
| Priority / department | | | ✓ | |
| Task update/complete API | | | ✓ | |

---

## 5. Feedback routing

### 5.1 Current paths

| Path | Status | Files |
|------|--------|-------|
| Timestamp comment create | **Working** | `useLiveComments.ts` → `video_comments` |
| Realtime comment broadcast | **Working** | `new-comment` / `comment-added` |
| **Notify Team** (summary) | **Working** (local) | `POST /api/notify` — count + filename |
| **Compile & Send** (full notes) | **Working** (local) | `compiledNotes` in email/Discord |
| Route to editor/colorist/audio/VFX | **Missing** | No assignee or department in notify payload |
| Per-comment ownership | **Missing** | Comments owned by author only |
| Status update on routing | **Missing** | No comment status column |

### 5.2 Notify payload (evidence)

`handleNotifyTeam` / `handleCompileAndSend` send `fileName`, `userEmail`, `totalComments`, optional `compiledNotes` — **no** `assigneeId`, `department`, or `projectId` (`useLiveComments.ts`).

### 5.3 Gap summary

| Item | Working | Partial | Missing | Broken |
|------|---------|---------|---------|--------|
| Comment capture | ✓ | | | |
| Team broadcast notify | ✓ | | | |
| Department routing | | | ✓ | |
| Comment→task automation | | | ✓ | |
| Assignee notify | | | ✓ | |

---

## 6. Work status system

### 6.1 Desired lifecycle vs codebase

| State (requested) | Implemented? | Where |
|-------------------|--------------|-------|
| **received** | **Missing** | — |
| **assigned** | **Partial** | `TaskStatus.todo` (agency, no UI) |
| **in progress** | **Partial** | `TaskStatus.in_progress`; admin “Ingesting”, “Offline Edit”, etc. |
| **incorporated** | **Missing** | — |
| **ready for review** | **Partial** | Admin `project_status` option “Ready for Review” |
| **approved** | **Missing** | — |
| **delivered** | **Missing** | Invoice paid ≠ delivery; no delivery record |

### 6.2 Additional status surfaces

| Surface | Values | Scoped to |
|---------|--------|-----------|
| Admin `project_status` | 6 pipeline strings | `user_id` (client) |
| `Task.status` | 4 enum values | Task row |
| `client_invoices.status` | Unpaid / Paid | Invoice |
| `MediaAsset.processingStatus` | queued → ready/failed | Transcode pipeline |
| `video_comments` | *(none)* | — |

**No unified workflow engine** — statuses are siloed and semantically inconsistent.

### 6.3 Gap summary

| Item | Working | Partial | Missing | Broken |
|------|---------|---------|---------|--------|
| Admin pipeline labels | | ✓ | | |
| Task enum | | ✓ | | |
| Comment lifecycle | | | ✓ | |
| End-to-end delivery state | | | ✓ | |
| P1 `project_status` (ops DB) | | | | ✓ (table missing) |

---

## 7. Admin HQ — what it must show first

### 7.1 Currently implemented (`app/admin/page.tsx`)

| Panel | Data source | Status |
|-------|-------------|--------|
| **Vault Directories** | `GET /api/media/clients` | **Partial** — UUID + asset count; Phase 1 |
| **Project Phase Control** | `project_status` | **Broken** until P1 SQL |
| **Billing & Finances** | `client_invoices` | **Broken** until P1 SQL |
| **Project Requirements (brief)** | `project_status_details` | **Broken** until P1 SQL |
| **Vault Assets** | `GET /api/media/assets?userId=` | **Partial** — asset load issues traced separately |
| **Preview + review notes** | `video_comments` | **Partial** — query alignment (ADM-007) |
| **HQ Communications** | Embedded live widgets | **Partial** — comm strip restored 2026-07-04 |

### 7.2 Operations views **not** implemented

| View (priority for ops) | Status | Needed data |
|-------------------------|--------|-------------|
| **Client list with names/companies** | **Missing** | Company model + contact |
| **Active projects** | **Missing** | `AgencyProject` or unified project table |
| **Team workload** | **Missing** | `Task` grouped by `assigneeId` |
| **Pending reviews** | **Missing** | Comments + session state + “ready for review” |
| **Overdue tasks** | **Missing** | `Task.dueDate < now()` query + UI |
| **Delivery queue** | **Missing** | Delivery status + asset approval |

### 7.3 Recommended Admin HQ priority (inspection recommendation — not implemented)

1. **Client directory** — name, company, active project count, last activity (union MediaAsset + AgencyProject + P1 status).
2. **Active projects board** — title, client, phase, due date, assignee.
3. **Pending reviews** — assets in “Ready for Review” + open comment count.
4. **Team workload** — tasks by assignee / overdue.
5. **Delivery queue** — approved → deliver → invoice link.

Existing per-client drill-down (phase, billing, assets) remains **secondary** once list views exist.

---

## 8. Existing code, models, and APIs

### 8.1 Prisma (`rendorax-backend/prisma/schema.prisma`)

| Model | Purpose | Wired to UI? |
|-------|---------|--------------|
| `MediaAsset` | R2 index, `userId` | ✓ Dashboard + Admin assets |
| `MediaFolder` | Virtual folders | ✓ Dashboard |
| `MediaProcessingJob` | Transcode queue | ✓ Pipeline |
| `User` | Agency team member | ✗ API upsert only |
| `AgencyProject` | Client project | ✗ API only |
| `Task` | Assignment unit | ✗ API only |
| `Project` | Marketing portfolio | ✓ Website (not ops) |
| `Message` | Contact form | ✓ `/api/contact` |

### 8.2 Supabase legacy tables

| Table | Priority | Applied (bviltofeuqsibbgancby)? | Used by |
|-------|----------|----------------------------------|---------|
| `video_comments` | P0 | **Yes** (local verified) | Dashboard + Admin preview |
| `video_metadata` | P0 | **Yes** (local) | Picture lock |
| `project_status` | P1 | **No** (checklist) | Admin phase |
| `project_status_details` | P1 | **No** | Admin brief |
| `client_invoices` | P1 | **No** | Admin billing |
| `user_roles` | P2 | **No** | **Unused** in app code |

### 8.3 Backend routes (`rendorax-backend/index.ts`)

| Mount | Purpose |
|-------|---------|
| `/api/media/*` | Assets, clients, folders, transcode |
| `/api/storage/*` | R2 presign/list |
| `/api/agency/*` | Projects + tasks |
| `/api/upload` | Upload pipeline |
| Socket.io | Comments sync, timeline share, live call |

### 8.4 Frontend routes (ops-relevant)

| Route | Role |
|-------|------|
| `app/dashboard/page.tsx` | Client vault, review, comments, export, timeline share |
| `app/admin/page.tsx` | HQ per-client ops (legacy Supabase) |
| `app/api/agency/projects/route.ts` | POST proxy only |
| `app/api/agency/tasks/route.ts` | GET + POST proxy |
| `app/api/notify/route.ts` | Email/Discord notifications |

### 8.5 Available but not wired

| Asset | Status |
|-------|--------|
| Agency project/task API | **Dead code from UX perspective** |
| `GET /api/agency/projects` | **Does not exist** |
| `utils/agencyBackend.ts` | Proxy helper — no UI consumer |
| `src/lib/api.ts` `GET /api/projects` | Portfolio — **unused** in frontend |
| `websocket/server.ts` | **Orphan** — not started by `index.ts` |
| Prisma `User.displayName` | Not populated from admin |

---

## 9. Consolidated gap register

### 9.1 Client management

| Gap | Status |
|-----|--------|
| Company / org entity | **Missing** |
| Contacts | **Missing** |
| Invite flow | **Missing** |
| Client display (name/email) | **Partial** |
| Admin client discovery | **Working** (MediaAsset userId) |

### 9.2 Project management

| Gap | Status |
|-----|--------|
| Unified project record | **Missing** |
| Legacy `project_status` per user | **Partial** / **Broken** (P1 not applied) |
| `AgencyProject` UI | **Missing** |
| MediaAsset ↔ project FK | **Missing** |
| Review session DB | **Missing** |
| Delivery tracking | **Missing** |

### 9.3 Team management

| Gap | Status |
|-----|--------|
| Core 3 roles | **Working** |
| Specialty roles (producer, colorist, VFX, audio) | **Missing** |
| Team admin UI | **Missing** |

### 9.4 Assignment workflow

| Gap | Status |
|-----|--------|
| Task API | **Partial** |
| Task UI | **Missing** |
| Comment→task | **Missing** |
| Priority / department | **Missing** |

### 9.5 Feedback routing

| Gap | Status |
|-----|--------|
| Capture + compile | **Working** |
| Department / assignee routing | **Missing** |

### 9.6 Work status

| Gap | Status |
|-----|--------|
| Unified lifecycle | **Missing** |
| Siloed partial statuses | **Partial** |

### 9.7 Admin HQ

| Gap | Status |
|-----|--------|
| Per-client panels | **Partial** |
| Ops dashboards (workload, queue) | **Missing** |
| P1 tables | **Broken** (not created) |

---

## 10. Recommended roadmap

### Phase 1 — Minimum viable operations system

**Goal:** One coherent client → project → asset → task → status path for internal team + one client; Admin HQ shows real ops lists.

**Duration estimate:** 3–5 weeks

| Order | Deliverable | Files / APIs | Dependencies | Risks |
|-------|-------------|--------------|--------------|-------|
| **1.1** | Apply Supabase **P1 SQL** (`project_status`, `project_status_details`, `client_invoices`) | `legacy-supabase-tables-migration-plan.md`, `supabase-p1-admin-legacy-tables.sql` | Ops approval | Admin still user-scoped |
| **1.2** | **Unify client identity** — admin sidebar: `userId` + email from Supabase admin API or `User` table | `admin/page.tsx`, optional `GET /api/media/clients` enrich | P1 optional | PII exposure — admin only |
| **1.3** | **Wire AgencyProject** — `GET /api/agency/projects`, create from admin | `agency.routes.ts`, `app/api/agency/projects/route.ts`, `admin/page.tsx` | Prisma migrate | Parallel with legacy status |
| **1.4** | Link `MediaAsset` → `agencyProjectId` (nullable FK) | `schema.prisma`, upload/save paths | 1.3 | Migration |
| **1.5** | **Admin: Active projects** list + link to client | `admin/page.tsx` | 1.3 | Minimal UI |
| **1.6** | **Admin: Task list** — create/assign from HQ | `admin/page.tsx`, agency tasks API | 1.3 | |
| **1.7** | **Task PATCH** — status, due date | `agency.routes.ts` | 1.6 | |
| **1.8** | Map admin `project_status` strings to `AgencyProject.status` or deprecate one | Product decision | 1.3 | Dual-write period |

**Phase 1 exit criteria:**
- [ ] Admin sees named clients + active projects
- [ ] Tasks assignable with due dates
- [ ] P1 billing/phase/brief functional
- [ ] Assets scoped to project (optional FK)

**No redesign:** Keep single-page admin; add panels/sections only.

---

### Phase 2 — Agency-scale workflow

**Goal:** Multi-role team, feedback routing, client reviewers, delivery queue, timeline share Phase 2–3 hooks.

**Duration estimate:** 6–10 weeks

| Order | Deliverable | Files / APIs | Dependencies | Risks |
|-------|-------------|--------------|--------------|-------|
| **2.1** | Extend roles — `producer`, `colorist`, `audio`, `vfx`, `reviewer` | `schema.prisma`, Supabase `app_metadata` convention, `agencyUsers.ts` | Product sign-off | Auth migration |
| **2.2** | **Client invite** — magic link / email → Supabase user `client` role | New API + `app/access` | Supabase Auth | Security |
| **2.3** | **Client company** model + contacts | Prisma or Supabase | 2.2 | |
| **2.4** | **Comment → Task** — convert timestamp note to assigned task | `useLiveComments.ts`, agency API | Phase 1 tasks | |
| **2.5** | **Feedback routing** — notify assignee by department | `/api/notify`, task metadata | 2.1, 2.4 | |
| **2.6** | **Comment status** column + UI (received → incorporated → approved) | Supabase migration, `CommentsPanel` | P0 stable | |
| **2.7** | **Admin HQ dashboards** — workload, overdue, pending reviews, delivery queue | `admin/page.tsx` | Phase 1 | |
| **2.8** | **`ReviewSession`** + share links | Per `timeline-sharing-production-readiness.md` Phase 3 | Timeline Phase 2 | |
| **2.9** | Consolidate socket connections | `useLiveComments`, `GlobalLiveWidget` | Timeline stable | |
| **2.10** | Client-scoped RLS on `video_comments` | Supabase SQL | Security review | |

**Phase 2 exit criteria:**
- [ ] Producer assigns colorist/audio/VFX tasks from comments
- [ ] Client invites 2+ reviewers to project
- [ ] Admin sees team workload and overdue queue
- [ ] Delivery state tracked per project

---

### Phase 3 — Automation / AI layer

**Goal:** Reduce manual routing; quality checks; ops analytics — **after** Phase 1–2 data model is stable.

**Duration estimate:** 8+ weeks (ongoing)

| Order | Deliverable | Examples | Dependencies |
|-------|-------------|----------|--------------|
| **3.1** | **AI comment triage** — suggest department + priority | Gemini on `comment_text` | Phase 2 routing |
| **3.2** | **AI quality check** — technical flags on upload | Resolution, loudness, duration vs brief | `project_status_details`, `MediaAsset` metadata |
| **3.3** | **Auto task creation** from comment patterns | Webhook on insert | 2.4 |
| **3.4** | **Session-end automation** — compile + route + status bump | Notify + task update | ReviewSession |
| **3.5** | **Ops analytics** — cycle time, review rounds, delivery SLA | Read models / views | Historical data |
| **3.6** | **Brief intake** — client form → `project_status_details` | Dashboard or public form | 2.3 |
| **3.7** | **Invoice automation** — milestone triggers | `client_invoices` + project status | P1 billing |

**Phase 3 exit criteria:**
- [ ] AI suggests assignee for ≥70% of comments (human confirm)
- [ ] Quality flags surface on upload without manual checklist
- [ ] Ops metrics dashboard for leadership

---

## 11. Critical path before marketing / scale

| Priority | Action | Why |
|----------|--------|-----|
| **P0** | Apply P1 Supabase SQL | Unblocks admin phase/billing/brief |
| **P0** | Wire `AgencyProject` + `Task` to Admin HQ | Ops cannot run on review tool alone |
| **P0** | Single project model decision | Stop dual `user_id` vs `AgencyProject` drift |
| **P1** | Client invite + company | Real multi-user clients |
| **P1** | Comment→task + routing | Post-production feedback loop |
| **P1** | Specialty roles | Producer/colorist/audio/VFX workflow |
| **P2** | Timeline sharing Phase 2–3 | Live review ops (parallel track) |
| **P2** | Production deploy backend + env | APIs unreachable without it |

---

## 12. File index

| File | Operations relevance |
|------|---------------------|
| `rendorax-backend/prisma/schema.prisma` | Agency + media models |
| `rendorax-backend/src/routes/agency.routes.ts` | Project/task API |
| `rendorax-backend/src/lib/agencyUsers.ts` | Role mapping |
| `rendorax-backend/src/routes/media.routes.ts` | Admin client discovery |
| `rendorax-frontend/app/admin/page.tsx` | HQ ops UI |
| `rendorax-frontend/app/dashboard/page.tsx` | Client review UI |
| `rendorax-frontend/hooks/useLiveComments.ts` | Comments + notify |
| `rendorax-frontend/app/api/notify/route.ts` | Team notifications |
| `rendorax-frontend/app/api/agency/*` | Agency proxies |
| `legacy-supabase-tables-migration-plan.md` | P0/P1 table specs |
| `admin-dashboard-qa-issue-map.md` | ADM-001–017 |
| `review-collaboration-layer-map.md` | Collaboration vs ops gaps |
| `timeline-sharing-production-readiness.md` | Review session gaps |

---

## 13. Manual verification recommended

1. Confirm P1 tables exist in Supabase (`to_regclass` or PostgREST probe).
2. `POST /api/agency/projects` + `GET /api/agency/tasks` with admin JWT (API-only smoke).
3. Admin HQ: client discovery + asset panel with backend up.
4. Confirm no UI imports `agencyBackend` outside proxy routes.

---

**Inspection complete. No code changed. Awaiting approval before Phase 1 operations implementation.**
