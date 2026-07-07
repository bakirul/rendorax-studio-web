# Operations Core Execution Order

**Date:** 2026-07-06  
**Goal:** Client → Project → Assignment → Work → Feedback → Delivery  
**Rule:** Each step makes the next step possible. Nothing else.

---

## Pre-condition

Complete pending Git commits (Groups B, C, D from `WORKING_TREE_SPLIT_PLAN.md`) and Group G (language selector extraction). These are already-written code that must be committed before new work begins.

---

## Step 1 — Sync Prisma User on Login

**What:** When a user logs into `/dashboard` or `/admin`, call `POST /api/agency/users/sync` (or call `ensureAgencyUser` via an existing route) so the Prisma `User` table has every authenticated user with their correct `AgencyRole`.

**Why:** The `AgencyProject` model requires `ownerId` and `clientId` that reference `User.id`. No project can be created until users exist in Prisma. Currently, `ensureAgencyUser` only runs when someone hits an `/api/agency/*` endpoint — most users have never triggered it.

**Files touched:**
- `rendorax-backend/src/routes/agency.routes.ts` — add `GET /api/agency/me` endpoint that calls `ensureAgencyUser` and returns the user record
- `rendorax-frontend/app/dashboard/page.tsx` — call `/api/agency/me` on mount (after auth check succeeds)
- `rendorax-frontend/app/admin/page.tsx` — call `/api/agency/me` on mount

**What becomes possible:** Every authenticated user exists in Prisma `User` table with `id`, `email`, `role`. Admin can now look up users to assign as project clients or task assignees.

---

## Step 2 — Project CRUD on Admin

**What:** Add a "Projects" panel to `/admin` that lists all `AgencyProject` records and allows creating new projects with `POST /api/agency/projects`. Admin selects a client from the Prisma `User` table (role=client) when creating a project.

**Why:** This is the **Client → Project** link. Without it, admin manages clients by browsing raw userId folders — there is no project concept connecting a client to their work.

**Files touched:**
- `rendorax-backend/src/routes/agency.routes.ts` — add `GET /api/agency/projects` (list all for admin, own for editor, assigned for client), `GET /api/agency/users` (list users for client picker)
- `rendorax-frontend/app/admin/page.tsx` — add project list panel, create project form, client selector dropdown

**What becomes possible:** Admin creates a project, assigns a client. The project has a title, status, deadline, and brief fields. The existing `AgencyProject.status` replaces the parallel `project_status` Supabase table.

---

## Step 3 — Task Assignment on Admin

**What:** When admin views a project, show its tasks and allow creating new tasks with `POST /api/agency/tasks`. Admin picks an assignee (role=editor) from the Prisma `User` table.

**Why:** This is the **Project → Assignment** link. The backend route already exists and works. The missing piece is a UI to call it.

**Files touched:**
- `rendorax-frontend/app/admin/page.tsx` — add task list under each project, create task form with assignee picker, status badge display
- `rendorax-backend/src/routes/agency.routes.ts` — add `PATCH /api/agency/tasks/:id` for status updates

**What becomes possible:** Admin creates tasks within a project and assigns them to editors. Each task has a status (`todo` → `in_progress` → `in_review` → `done`), a due date, and an assignee. This is the **Assignment** step.

---

## Step 4 — Editor Task View on Dashboard

**What:** Add a task indicator to `/dashboard` that shows the logged-in editor their assigned tasks via `GET /api/agency/tasks`. Editor can update task status (e.g., `todo` → `in_progress` → `in_review`).

**Why:** This is the **Assignment → Work** link. The editor needs to know what they're working on and mark progress. Without this, assignments exist in admin but the editor never sees them.

**Files touched:**
- `rendorax-frontend/app/dashboard/page.tsx` — add task status widget (minimal: task title, project name, status toggle)
- `rendorax-backend/src/routes/agency.routes.ts` — `PATCH /api/agency/tasks/:id` (from Step 3, reused here)

**What becomes possible:** Editor sees assigned work, marks it in-progress, marks it ready for review. Admin sees status changes reflected in the project view. This is the **Work** step.

---

## Step 5 — Link Assets to Projects

**What:** When an editor uploads or manages assets on `/dashboard`, allow tagging them to an `AgencyProject` via the existing `MediaAsset.agencyProjectId` FK. When admin views a project, show its linked assets instead of (or alongside) browsing by raw userId folder.

**Why:** This is what connects **Work → Feedback**. Currently, assets live in folders by userId. Projects exist in Prisma. They don't talk to each other. The `agencyProjectId` column already exists on `MediaAsset` (added in WP1) — it just needs to be written to and queried.

**Files touched:**
- `rendorax-backend/src/routes/media.routes.ts` — accept `agencyProjectId` in `POST /assets` and `PATCH /assets/:id`
- `rendorax-frontend/app/dashboard/page.tsx` — project selector when uploading or in asset context menu
- `rendorax-frontend/app/admin/page.tsx` — query assets by `agencyProjectId` instead of (or in addition to) userId

**What becomes possible:** Assets belong to projects. Admin views a project and sees its deliverables. Client feedback (comments) is contextually tied to a project's assets, not floating in a userId folder. This completes the **Feedback** loop.

---

## Step 6 — Client Sees Own Project Assets

**What:** On `/dashboard`, when the logged-in user has role=client, filter their view to show only assets from their assigned `AgencyProject` records. Hide editor-only tools (SMPTE, LUFS, picture lock, phase selector, marker export) behind the existing `isEditor` check — extend it to cover all editor-only controls, not just the screen share button.

**Why:** This is the **Feedback → Delivery** link. The client sees only what's been delivered to them (assets tagged to their project), leaves comments, and the cycle completes. This also closes the highest-severity boundary violation from the workspace audit (clients seeing editor tools).

**Files touched:**
- `rendorax-frontend/app/dashboard/page.tsx` — expand `isEditor` gating to cover phase selector, picture lock, LUFS, marker export, report download; filter asset view to project-scoped assets when user is client
- `rendorax-frontend/components/DashboardHeader.tsx` — hide editor-only header controls when `!isEditor`

**What becomes possible:** The full cycle works: Client → Project → Assignment → Work → Feedback → Delivery. Clients see a clean review experience. Editors see production tools. Admin manages the pipeline.

---

## Summary

| Step | North Star Link | Backend Exists? | Frontend Exists? |
|------|----------------|:---:|:---:|
| 1. Sync User on Login | Prerequisite | Partial (`ensureAgencyUser` exists, no dedicated endpoint) | No |
| 2. Project CRUD on Admin | Client → Project | Partial (`POST /projects` exists, no list) | No |
| 3. Task Assignment on Admin | Project → Assignment | Partial (`POST /tasks` + `GET /tasks` exist, no status update) | No |
| 4. Editor Task View | Assignment → Work | Yes (`GET /tasks` scoped by role) | No |
| 5. Link Assets to Projects | Work → Feedback | Partial (`agencyProjectId` FK exists, not written to) | No |
| 6. Client Asset Filtering | Feedback → Delivery | Yes (data model supports it) | No |

Six steps. Each unlocks the next. No new routes created. No redesigns. No optional features.

---

No code modified. No files staged. No commits made. No pushes performed.
