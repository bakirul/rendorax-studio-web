# Rendorax Studio — Project Checklist & Context Report

> **Generated for:** ChatGPT / AI assistant context upload  
> **Workspace root:** `C:\Users\user\rendorax-studio`  
> **Last updated:** July 3, 2026 (compiledNotes notify verified local; production verification pending)  
> **Do not paste secret values from this file into public channels — variable names only.**

### Source of truth (mandatory for all AI agents)

| File | Role |
|------|------|
| `AI_TEAM_PROTOCOL.md` | Agent workflow, rules, and task protocol (**read before any task**) — **present** at workspace root |
| `rendorax-project-checklist.md` | Project state, completed work, known issues, next steps (**update after every approved task**) |

**Agent workflow:**
1. Read both files before starting any task.
2. Follow `AI_TEAM_PROTOCOL.md`.
3. After completing any approved task, update this checklist: completed work, known issues, next steps, and decision log (if applicable).

**Related reports (reference only):**
- `supabase-auth-live-test-report.md` — post-migration auth config inspection
- `production-auth-flow-walkthrough.md` — full login/session/logout flow map
- `compiled-notes-notify-trace.md` — compiledNotes notify inspection, implementation, local verification
- `review-collaboration-layer-map.md` — collaboration layer inspection map

---

## 1. Project Overview

### What we are building

**Rendorax Studio** is a broadcast post-production platform for agencies and enterprise clients. It combines:

- A **marketing website** (portfolio, services, journal, pricing, contact)
- A **client vault / dashboard** (`/dashboard`) for secure video review, frame-accurate comments, live collaboration, and asset management
- An **admin portal** (`/admin`) for studio staff to manage clients, invoices, project status, and media assets
- A **Node.js backend** (Express + Socket.io) for media uploads (Cloudflare R2), FFmpeg transcoding, WebRTC signaling, live translation, and agency project/task APIs
- **Supabase** for authentication, PostgreSQL (Prisma), and legacy tables (`video_metadata`, `video_comments`, `project_status`, etc.)

### Architecture split

| Layer | Folder | Tech | Default port |
|-------|--------|------|--------------|
| Frontend | `rendorax-frontend/` | Next.js 14 App Router, Tailwind, Supabase SSR | 3000 |
| Backend | `rendorax-backend/` | Express 5, Socket.io, Prisma 7, BullMQ, FFmpeg | 4000 |

### Supabase project (current)

- **Project ref:** `bviltofeuqsibbgancby`
- **Region:** ap-southeast-1 (pooler host: `aws-1-ap-southeast-1.pooler.supabase.com`)
- **Important:** Use pooler connection strings for this project — direct `db.*.supabase.co` DNS has failed in local tests

---

## 2. Backend Folder Tree

```
rendorax-backend/
├── index.ts                    # Main entry: Express + Socket.io + Prisma
├── package.json
├── tsconfig.json
├── prisma.config.ts            # Prisma 7 config (DIRECT_URL, external Supabase auth tables)
├── redis.ts                    # Redis client for legacy websocket server
├── schema.prisma               # STALE duplicate — use prisma/schema.prisma instead
├── .env                        # Non-secret defaults only (NO database URLs here)
├── .env.local                  # Secrets: DATABASE_URL, DIRECT_URL, R2, Supabase
├── .env.example
├── prisma/
│   ├── schema.prisma           # Canonical Prisma schema
│   └── migrations/
│       ├── 20250626120000_media_pipeline_phase2/
│       └── 20250630120000_agency_management/
├── scripts/
│   └── create-admin.ts         # Admin user bootstrap script
├── src/
│   ├── lib/                    # R2, FFmpeg, transcription, agency users, env loader
│   ├── middleware/
│   │   └── requireAuth.ts      # Supabase JWT Bearer validation
│   ├── routes/
│   │   ├── agency.routes.ts    # Agency projects & tasks
│   │   ├── media.routes.ts     # MediaAsset CRUD, folders, transcribe
│   │   ├── storage.routes.ts   # R2 multipart presign/download/list
│   │   └── upload.routes.ts    # Legacy presigned URL upload
│   └── workers/
│       └── mediaTranscodeWorker.ts  # BullMQ FFmpeg worker
└── websocket/
    └── server.ts               # Legacy standalone Socket.io (port 3001, NOT wired to index.ts)
```

**Excluded from tree:** `node_modules/`, `dist/`, `.git/`, `generated/`

---

## 3. Frontend Folder Tree

```
rendorax-frontend/
├── app/                        # Next.js App Router (pages + API routes)
│   ├── api/                    # Server-side API routes
│   ├── access/                 # Login page
│   ├── admin/                  # Admin HQ
│   ├── dashboard/              # Client vault (main app)
│   ├── portfolio/, journal/, services/, contact/, etc.
│   ├── layout.tsx, page.tsx, globals.css
│   ├── robots.ts, sitemap.ts
├── components/
│   ├── dashboard/              # 20 vault UI components
│   ├── modals/                 # Upload, rename, move, delete modals
│   ├── portfolio/, journal/, contact/, affiliate/, career/, checklist/
│   └── Navbar, Footer, VideoPlayer, GlobalLiveWidget, etc.
├── hooks/                      # 9 custom hooks (file manager, live comments, LUFS, etc.)
├── utils/
│   ├── supabase/               # client.ts, server.ts, middleware.ts
│   ├── auth/roles.ts           # isAdmin()
│   └── agencyBackend.ts, mediaAssets.ts, r2Upload.ts, etc.
├── store/                      # Zustand stores
├── src/lib/                    # redis.ts, api.ts
├── public/                     # Static assets, audio worklets
├── e2e/                        # Playwright tests
├── middleware.ts               # Next.js auth gate — at project root (`rendorax-frontend/middleware.ts`), NOT inside `app/`
├── next.config.js
├── tailwind.config.ts
├── package.json
├── .env                        # Public placeholders
├── .env.local                  # Real secrets
└── .env.example
```

**Excluded from tree:** `node_modules/`, `.next/`, `.git/`

---

## 4. Important Files & What They Do

### Backend

| File | Purpose |
|------|---------|
| `index.ts` | Express app, CORS, Prisma pool, mounts all `/api/*` routers, Socket.io (video sync, WebRTC, live translation, chat), health check |
| `prisma/schema.prisma` | All DB models (media pipeline + agency management + portfolio) |
| `prisma.config.ts` | Prisma 7 datasource URL (`DIRECT_URL`), external Supabase `auth.*` tables |
| `src/lib/loadEnv.ts` | Loads `.env` then `.env.local` (override). **DB URLs must only be in `.env.local`** |
| `src/middleware/requireAuth.ts` | Validates `Authorization: Bearer <supabase_jwt>` |
| `src/routes/media.routes.ts` | Core media asset API used by dashboard |
| `src/routes/storage.routes.ts` | R2 multipart upload + download |
| `src/routes/agency.routes.ts` | Create projects/tasks, role-based task fetch |
| `src/workers/mediaTranscodeWorker.ts` | Background FFmpeg transcode via BullMQ + Redis |

### Frontend

| File | Purpose |
|------|---------|
| `app/dashboard/page.tsx` | Main client vault (~1800 lines) — gallery, player, comments, live session |
| `app/admin/page.tsx` | Admin client management, invoices, asset review |
| `app/access/page.tsx` | Supabase email/password login |
| `rendorax-frontend/middleware.ts` | Protects `/dashboard` and `/admin`; redirects to `/access` |
| `utils/agencyBackend.ts` | Proxies agency API calls to backend with session JWT |
| `utils/mediaAssets.ts` | Frontend media asset fetch/update helpers |
| `hooks/useFileManager.ts` | Vault file CRUD + R2 uploads |
| `hooks/useLiveComments.ts` | Socket.io live comment sync |
| `components/GlobalLiveWidget.tsx` | Live session widget + socket connection |

---

## 5. Frontend Pages / Routes / Components Summary

### Public marketing pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, features, CTA |
| `/portfolio` | International works showcase (Vimeo embeds) |
| `/portfolio/[slug]` | Individual portfolio case study |
| `/services`, `/services/[slug]` | Service offerings |
| `/journal`, `/journal/[slug]` | Blog/articles |
| `/pricing`, `/career`, `/affiliate`, `/podcast` | Marketing |
| `/contact` | Contact form → Resend email |
| `/checklist` | Production checklist page |
| `/studio` | Studio marketing page |
| `/privacy`, `/terms`, `/refund` | Legal |
| `/private-reel` | Passcode-gated private reel |

### Authenticated pages

| Route | Auth | Description |
|-------|------|-------------|
| `/access` | Public (login) | Supabase sign-in |
| `/dashboard` | Any logged-in user | Client vault |
| `/admin` | `app_metadata.role === "admin"` | Admin HQ |

### Key component groups

- **`components/dashboard/`** — StreamingVideoPlayer, MediaGallery, LiveSessionToolbar, UploadStatusBar, Timeline, Captions, etc.
- **`components/modals/`** — MediaUploadModal, RenameModal, MoveModal, DeleteModal
- **Root components** — Navbar, Footer, CommentsPanel, ChatbotWidget, GlobalLiveWidget

---

## 6. Backend Routes / Controllers Summary

### Express REST (`index.ts` + `src/routes/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/projects` | Yes | Portfolio projects (legacy Prisma `Project` model) |
| POST | `/api/upload/presigned-url` | Yes | Legacy R2 presigned upload URL |
| POST | `/api/media/assets` | Yes | Create media asset record |
| GET | `/api/media/assets` | Yes | List assets (filter by userId, folder) |
| GET | `/api/media/folders` | Yes | List user folders |
| POST | `/api/media/folders` | Yes | Create folder |
| PATCH | `/api/media/assets/:id` | Yes | Update asset (rename, move) |
| DELETE | `/api/media/assets/:id` | Yes | Delete asset + R2 objects |
| DELETE | `/api/media/assets/folder` | Yes | Delete folder contents |
| POST | `/api/media/transcribe` | Yes | Generate SRT via transcription |
| POST | `/api/storage/r2/presign-upload` | Yes | Single presigned upload |
| POST | `/api/storage/r2/multipart/*` | Yes | Multipart upload flow |
| GET | `/api/storage/r2/download` | Yes | Presigned download URL |
| GET | `/api/storage/r2/list` | Yes | List R2 objects |
| POST | `/api/agency/projects` | Yes | Create agency project |
| POST | `/api/agency/tasks` | Yes | Create task + assign user |
| GET | `/api/agency/tasks` | Yes | Fetch tasks (role-filtered) |

### Socket.io (same server, port 4000)

Video room sync, live comments, WebRTC signaling, timeline screen-share, live audio translation (OpenAI Realtime + Gemini), chat messages.

---

## 7. Frontend API Routes (`app/api/`)

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/agency/projects` | POST | Proxy → backend `POST /api/agency/projects` |
| `/api/agency/tasks` | GET, POST | Proxy → backend agency tasks |
| `/api/chat` | POST | Gemini chatbot (auth required) |
| `/api/contact` | POST | Contact form email via Resend |
| `/api/notify` | POST | Upload/review notifications (Discord + Resend) |
| `/api/picture-lock` | POST | Video integrity hash + Supabase `video_metadata` lock |
| `/api/translate-text` | POST | Gemini text translation |
| `/api/upload-chunk` | POST | **DEPRECATED** (returns 410) |
| `/api/video-uploaded` | POST | Supabase webhook → AWS MediaConvert HLS job |

---

## 8. Auth System Summary

### Provider: Supabase Auth

| Layer | Mechanism |
|-------|-----------|
| **Frontend login** | `app/access/page.tsx` — `supabase.auth.signInWithPassword` |
| **Session cookies** | `@supabase/ssr` via `utils/supabase/middleware.ts` + `middleware.ts` |
| **Route protection** | Next.js `rendorax-frontend/middleware.ts` — `/dashboard` (any user), `/admin` (admin only) |
| **Role check** | `user.app_metadata.role` — values: `admin`, `editor`, `client` |
| **Backend API auth** | `requireAuth` middleware — `Authorization: Bearer <access_token>` validated via Supabase `getUser(token)` |
| **Frontend → Backend proxy** | `utils/agencyBackend.ts` — forwards session `access_token` as Bearer header |

### Role behavior

| Role | Dashboard | Admin | Agency tasks API |
|------|-----------|-------|------------------|
| `admin` | Yes | Yes | Sees all tasks |
| `editor` | Yes | No | Sees assigned tasks only |
| `client` | Yes | No | Sees assigned + client-project tasks |

---

## 9. Database Models / Schema

**File:** `rendorax-backend/prisma/schema.prisma`  
**Provider:** PostgreSQL via Supabase (schemas: `public`, `auth`)

### Portfolio & contact

| Model | Table | Purpose |
|-------|-------|---------|
| `Project` | `Project` | Portfolio showcase entries |
| `Message` | `Message` | Contact form messages |

### Media pipeline

| Model | Purpose |
|-------|---------|
| `MediaAsset` | Uploaded file metadata, processing status, playback URLs |
| `MediaProcessingJob` | FFmpeg transcode job tracking |
| `MediaFolder` | Per-user folder paths |

**Enums:** `MediaProcessingStatus`, `MediaPlaybackFormat`

### Agency management

| Model | Purpose |
|-------|---------|
| `User` | Studio team member (`id` = Supabase `auth.users.id`) |
| `AgencyProject` | Agency workflow project (owner + optional client) |
| `Task` | Task under project with assignee |

**Enums:** `AgencyRole` (admin, editor, client), `TaskStatus` (todo, in_progress, in_review, done)

> **Naming note:** Portfolio uses `Project`; agency workflow uses `AgencyProject` to avoid Prisma naming collision.

### Legacy Supabase tables (not in Prisma schema — accessed via Supabase client)

- `video_metadata`, `video_comments`, `project_status`, `project_status_details`, `client_invoices`, `user_roles`

### DB sync commands

```powershell
cd rendorax-backend
npm run db:push          # Quick sync
npx prisma migrate dev   # Tracked migration
npx prisma studio        # GUI explorer
```

---

## 10. Environment Variables Summary

> **Values are NOT listed here. Configure in `.env.local` files only.**

### Frontend (`rendorax-frontend/.env.local`)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Supabase V2 publishable key |
| `NEXT_PUBLIC_BACKEND_URL` | Public | Backend API URL (e.g. `http://localhost:4000`) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public | Google Analytics |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public | R2 CDN base URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Admin Supabase operations |
| `SUPABASE_SECRET_KEY` | Server | Supabase V2 secret key |
| `SUPABASE_WEBHOOK_SECRET` | Server | Webhook verification |
| `GEMINI_API_KEY` | Server | AI chat + translation |
| `GROQ_API_KEY` | Server | Optional AI |
| `RESEND_API_KEY` | Server | Contact/notify emails |
| `PRIVATE_REEL_PASSCODE` | Server | Private reel gate |
| `DISCORD_WEBHOOK_URL` | Server | Upload/review alerts |
| `AWS_*` | Server | MediaConvert HLS proxy (optional) |
| `REDIS_URL` | Server | Optional Redis pub/sub |

### Backend (`rendorax-backend/.env.local`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled Postgres (port 6543) — runtime Prisma adapter |
| `DIRECT_URL` | Direct Postgres (port 5432) — Prisma CLI migrations/db push |
| `SUPABASE_URL` | JWT validation (must match frontend project) |
| `SUPABASE_ANON_KEY` | JWT validation |
| `R2_ACCOUNT_ID` | Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | R2 credentials |
| `R2_SECRET_ACCESS_KEY` | R2 credentials |
| `R2_BUCKET_NAME` | R2 bucket |
| `R2_PUBLIC_URL` | Public media CDN URL |
| `GEMINI_API_KEY` | Translation in Socket.io |
| `GROQ_API_KEY` | Optional |
| `OPENAI_API_KEY` | Live audio translation (Realtime API) |
| `REDIS_URL` | BullMQ transcode queue |
| `PORT` | Server port (default 4000) |

### Critical env rules

1. **`DATABASE_URL` and `DIRECT_URL` must ONLY exist in `rendorax-backend/.env.local`** — never duplicate in `.env` (causes P1000 auth errors when passwords diverge)
2. **Frontend and backend Supabase URLs/keys must reference the same project** (`bviltofeuqsibbgancby`)
3. **Use pooler format** for this project's connection strings (`postgres.bviltofeuqsibbgancby@aws-1-ap-southeast-1.pooler.supabase.com`)
4. **Password special characters** must be URL-encoded in connection strings (e.g. space → `%20`)

---

## 11. Frontend / Backend Connection Status

### Local (verified in dev)

| Connection | Status | Notes |
|------------|--------|-------|
| Frontend → Backend REST | **Working (local)** | `NEXT_PUBLIC_BACKEND_URL` defaults to `http://localhost:4000` |
| Frontend → Backend agency API | **Proxied (local)** | `/api/agency/*` → backend with Bearer JWT |
| Frontend → Backend media API | **Direct fetch (local)** | `utils/mediaAssets.ts`, `utils/r2Upload.ts` |
| Frontend → Backend Socket.io | **Configured (local)** | `GlobalLiveWidget`, `useLiveComments` use `NEXT_PUBLIC_BACKEND_URL` |
| Frontend → Supabase Auth | **Configured (local)** | SSR cookies; env points to `bviltofeuqsibbgancby` |
| Backend → Supabase Auth (JWT) | **Configured (local)** | `requireAuth` uses `SUPABASE_URL` + `SUPABASE_ANON_KEY` |
| Backend → PostgreSQL (Prisma) | **Working (local)** | `npx prisma db push` succeeded against `bviltofeuqsibbgancby` |
| Backend → Cloudflare R2 | **Configured (local)** | Credentials in `rendorax-backend/.env.local` |

### Production

> Not directly verified in this workspace audit. See **§14 Needs Verification**.

| Connection | Status |
|------------|--------|
| Frontend (Vercel) → Backend REST | **Needs verification** |
| Frontend → Backend agency/media API | **Needs verification** |
| Frontend → Backend Socket.io | **Needs verification** |
| Live-site Supabase auth (login/session) | **Needs verification** |
| R2 media upload/playback | **Needs verification** |
| Backend production hosting | **Not deployed** (no Dockerfile/platform config in repo) |

### Local dev startup

```powershell
# Terminal 1 — Backend
cd rendorax-backend
npm run start:dev

# Terminal 2 — Frontend
cd rendorax-frontend
npm run dev
```

---

## 12. Deployment Setup

### Frontend (Vercel — intended)

| Item | Status |
|------|--------|
| `vercel.json` | **Not present** — relies on Next.js defaults |
| Framework | Next.js 14.2.3 App Router |
| Build command | `npm run build` |
| Env vars | Set all `NEXT_PUBLIC_*` + server secrets in Vercel dashboard |
| `NEXT_PUBLIC_BACKEND_URL` | Must point to **production backend URL** (not localhost) |
| `public/_redirects` | Present (`/* /index.html 200`) — Netlify-style, may be legacy/unused on Vercel |

### Backend (hosting TBD)

| Item | Status |
|------|--------|
| Dockerfile | **Not present** |
| Railway / Render / Fly config | **Not present** |
| Build | `npm run build` → `node dist/index.js` |
| Requirements | Long-running process, WebSocket support, FFmpeg binary, optional Redis |
| Port | `PORT` env (default 4000) |
| CORS | Allows `localhost:3000`, `rendorax.com`, `www.rendorax.com` |

### CI

- `rendorax-frontend/.github/workflows/playwright.yml` — Playwright E2E on push/PR to main

---

## 13. Current Build / Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| `app/portfolio/page.tsx` `getWorkKey` type error | **Fixed (local)** | Return type narrowed to `string` |
| `utils/agencyBackend.ts` union narrowing error | **Fixed (local)** | `ok: true as const` / `false as const` discriminant |
| `utils/agencyBackend.ts` top-level `return` | **Fixed (local)** | Logic moved inside `proxyAgencyRequest` |
| Prisma P1000 auth failed | **Fixed (local)** | DB URLs consolidated to `.env.local` only |
| `npm run build` (frontend) | **Passing (local)** | Verified via `npm run build` |
| Agency API UI | **Not implemented** | Backend + proxy routes exist; no dashboard/admin UI |
| Backend production hosting | **Not configured** | No Dockerfile or platform config in repo |
| `websocket/server.ts` (port 3001) | **Orphaned** | Not imported by `index.ts` — legacy |
| `rendorax-backend/schema.prisma` (root) | **Stale** | Use `prisma/schema.prisma` instead |
| `GET /api/projects` in frontend | **Unused** | `src/lib/api.ts` — nothing imports it |
| `app/api/upload-chunk` | **Deprecated** | Returns HTTP 410 |
| QA-002: cloud list not refreshing after Upload File | **Resolved — manually verified (local)** | `page.tsx`: `handleHeaderUpload` + stale-fetch guard; verified 2026-07-03 |
| QA-001: POST /api/media/assets hangs on Redis enqueue (FINALIZING) | **Resolved — manually verified (local)** | Async enqueue + fail-fast producer Redis; verified 2026-07-03 |
| R2 playback processing gap (empty URL during transcode) | **Resolved — manually verified (local)** | `utils/mediaAssets.ts`: mezzanine CDN fallback when processing active; verified 2026-07-03 — MP4 during processing, HLS after `ready`; report: `r2-processing-gap-trace.md` |
| Comment creation failure (PGRST205 / missing `video_comments`) | **Resolved — manually verified (local)** | P0 SQL `supabase-p0-legacy-review-tables.sql`; verified 2026-07-03 — create, persist, timestamps, thumbnails; reports: `comment-create-failure-trace.md`, `comment-review-workflow-map.md` |
| Comment author + avatar (Option A) | **Resolved — manually verified (local, 2026-07-03)** | P1 SQL applied; `author_display_name`, `author_avatar_url`, `resolveCommentAuthor()`, `CommentAuthorBadge`, `CommentsPanel`; name + avatar/initials; reload preserves identity; report: `comment-author-avatar-plan.md` |
| Review Session Complete / compiledNotes notify (`POST /api/notify`) | **Resolved — manually verified (local, 2026-07-03)** | Compile & Send: `compiledNotes` in email **Feedback Notes** + Discord field; timestamps + author names; HTML escape; Notify Team summary-only; report: `compiled-notes-notify-trace.md` |
| Compare workflow (Cloud CDN side-by-side) | **Resolved — manually verified (local, 2026-07-03)** | Fix 1 + 2 in `page.tsx` + `StreamingVideoPlayer.tsx`; V1/V2 side-by-side, cloud + vault compare, initial sync, no ghost playback; report: `compare-workflow-regression-report.md` |

---

## 14. Needs Verification

Items below are **not confirmed** by direct inspection in this workspace. Do not mark complete until tested on production/live.

| Item | Why unverified |
|------|----------------|
| **Vercel production build/deploy** | Reported OK by team; not re-run in this audit |
| **Production frontend → backend API** | `NEXT_PUBLIC_BACKEND_URL` on Vercel may still point to localhost; production backend host not confirmed |
| **Live-site login / logout / session refresh** | New Supabase project (`bviltofeuqsibbgancby`); production auth flow not tested end-to-end |
| **Vercel Production Supabase env vars** | Dashboard env vars not readable from repo; must match `bviltofeuqsibbgancby` |
| **Supabase Auth URL Configuration** | Site URL + Redirect URLs for production domain(s) not confirmed |
| **R2 upload and playback (production)** | Local credentials exist; live CDN/playback not tested |
| **Backend deployed to production** | No hosting config in repo; backend not deployed |
| **Legacy Supabase P1 tables in new project** | `project_status`, `project_status_details`, `client_invoices` — not yet created; see `legacy-supabase-tables-migration-plan.md` |
| **Legacy Supabase P0 tables (production)** | `video_comments`, `video_metadata` verified **local dev only** (2026-07-03); production Supabase not re-tested |
| **Review notify / compiledNotes (production)** | Compile & Send + Notify Team verified **local dev only** (2026-07-03); production Resend/Discord + full notes delivery not re-tested |
| **Comment author + avatar (production)** | Resolved **local dev only** (2026-07-03); production Supabase P1 SQL not re-tested |
| **Compare workflow (production)** | Resolved **local dev only** (2026-07-03); production not tested |
| **Supabase Storage bucket `client-vault`** | Referenced in admin/dashboard code; not confirmed in new project |
| **Redis/BullMQ transcode worker (production)** | Optional; requires `REDIS_URL` — not verified live |
| **Admin `app_metadata.role` for users** | Users may lack `role` after migration — affects `/admin` access |

---

## 15. Recent Completed Work (verified local — 2026-07-03)

Only items confirmed by **local dev** manual verification on 2026-07-03. **Production not covered** — see §14.

### Verification summary (local dashboard QA — 2026-07-03)

| Workflow | Status |
|----------|--------|
| Upload refresh (QA-002) | Resolved |
| FINALIZING hang (QA-001) | Resolved |
| R2 playback during transcode | Resolved |
| Comment create / persist (P0) | Resolved |
| Comment author + avatar (P1) | Resolved |
| Compare workflow (V1/V2) | Resolved |
| Review notify — Notify Team (summary) | Resolved |
| Review notify — Compile & Send (`compiledNotes`) | Resolved |
| Production deploy / live env | **Pending §14** |

### Schema & API (code present)

- [x] Agency Management schema: `User`, `AgencyProject`, `Task` in `prisma/schema.prisma`
- [x] Backend agency routes: `POST /api/agency/projects`, `POST/GET /api/agency/tasks`
- [x] Frontend agency proxy routes: `/api/agency/projects`, `/api/agency/tasks`
- [x] Media pipeline Phase 2: `MediaProcessingJob`, processing enums, FFmpeg worker code

### Local environment & build

- [x] Supabase env files updated to project `bviltofeuqsibbgancby` (frontend + backend `.env.local`)
- [x] Prisma env conflict fix: `DATABASE_URL` / `DIRECT_URL` only in `rendorax-backend/.env.local`
- [x] `npx prisma db push` successful (local, against new database)
- [x] `npm run build` passing (local, frontend)
- [x] TypeScript build fixes: `portfolio/page.tsx`, `agencyBackend.ts`

### Dashboard QA

- [x] **QA-002** — Upload refresh fix: cloud asset list updates after **Upload File** when Cloud bin is visible; stale `loadCloudAssets` responses no longer overwrite newer data (`app/dashboard/page.tsx`, Change A + B). Reports: `qa-002-upload-refresh-trace.md`, `dashboard-qa-issue-map.md`. **Resolved — manually verified (local, 2026-07-03).**
- [x] **QA-001** — FINALIZING hang fix: `POST /api/media/assets` returns `201` immediately after `MediaAsset` create; BullMQ enqueue is fire-and-forget with fail-fast producer Redis + 5s enqueue timeout (`media.routes.ts`, `mediaQueue.ts`, `mediaProcessing.ts`). Report: `qa-001-finalizing-hang-trace.md`. **Resolved — manually verified (local, 2026-07-03).**
- [x] **R2 processing gap** — Playback during transcode: `getMediaPlaybackUrl()` returns mezzanine CDN MP4 while `processingStatus` is active (`queued`/`probing`/`transcoding`/`uploading`); HLS still preferred when `ready` (`utils/mediaAssets.ts`). Report: `r2-processing-gap-trace.md`. **Resolved — manually verified (local, 2026-07-03):** original MP4 plays during processing; HLS takeover after `ready`.
- [x] **Comment creation (P0 legacy tables)** — `video_comments` + `video_metadata` created via `supabase-p0-legacy-review-tables.sql`; PGRST205 resolved. **Resolved — manually verified (local, 2026-07-03):** comment create, persistence, timestamp jump, scene thumbnails. Reports: `comment-create-failure-trace.md`, `comment-review-workflow-map.md`.
- [x] **Comment author + avatar (Option A)** — `author_display_name` / `author_avatar_url` on insert via `resolveCommentAuthor()`; `CommentAuthorBadge` + name in `CommentsPanel`; initials fallback; multi-reviewer identity. SQL: `supabase-p1-comment-author-columns.sql` applied. Report: `comment-author-avatar-plan.md`. **Resolved — manually verified (local, 2026-07-03):** name, avatar/initials, reload preserves identity.
- [x] **Review Session Complete / compiledNotes notify** — `compiledNotes` in `/api/notify`; email **Feedback Notes** + Discord **📝 Compiled Notes** on **Compile & Send**; Notify Team summary-only; HTML escape. Report: `compiled-notes-notify-trace.md`. **Resolved — manually verified (local, 2026-07-03).**
- [x] **Review Session Complete / feedback notify (summary)** — `handleNotifyTeam` → `POST /api/notify` (Discord embed + Resend email with file name + comment count). **Resolved — manually verified (local, 2026-07-03).**
- [x] **Compare workflow (Cloud CDN)** — V1 (Reference) + V2 (Current) side-by-side; compare dropdown; cloud/R2 + vault compare; initial sync; no ghost/background playback; single player when compare off. Reports: `compare-workflow-regression-report.md`. **Resolved — manually verified (local, 2026-07-03).**

> **Local vs production:** Dashboard QA items above (upload, comments, compare, reviewer identity, review notify + compiledNotes, R2 playback) are **local dev only** unless noted. Production — see §14.

### Documentation

- [x] Auth inspection reports: `supabase-auth-live-test-report.md`, `production-auth-flow-walkthrough.md`
- [x] `AI_TEAM_PROTOCOL.md` added at workspace root
- [x] Documentation protocol: dual source-of-truth (`AI_TEAM_PROTOCOL.md` + this checklist)

> **Not listed as completed:** Vercel production deploy, production API connectivity, live auth — see **§14 Needs Verification**.

---

## 16. Pending Tasks Checklist

Each item appears **once**. Production-specific checks are in §14 unless listed here as actionable work.

### High priority

- [ ] Test live-site login/authentication with new Supabase project — see `production-auth-flow-walkthrough.md` §11
- [ ] Confirm Vercel Production env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `bviltofeuqsibbgancby`
- [ ] Confirm Supabase Auth URL Configuration (Site URL + Redirect URLs) for production domain(s)
- [ ] Deploy backend to a host with WebSocket + FFmpeg support (Railway, Render, Fly.io, VPS)
- [ ] Set `NEXT_PUBLIC_BACKEND_URL` in Vercel to production backend URL (after backend is deployed)
- [ ] Wire agency management UI into dashboard/admin (API exists; UI does not)
- [ ] Seed `User` records in Prisma for existing Supabase auth users
- [x] Verify legacy Supabase **P0** tables in new project (`video_comments`, `video_metadata`) — **local dev, 2026-07-03** via `supabase-p0-legacy-review-tables.sql`
- [x] Apply **P1** `supabase-p1-comment-author-columns.sql` — **local dev, 2026-07-03** (production Supabase still pending)
- [ ] Verify legacy Supabase **P1** tables (`project_status`, `project_status_details`, `client_invoices`) — see `legacy-supabase-tables-migration-plan.md`
- [ ] Configure Supabase Storage bucket `client-vault` in new project

### Medium priority

- [ ] Remove or archive stale `rendorax-backend/schema.prisma` (root duplicate)
- [ ] Remove orphaned `websocket/server.ts` or document its purpose
- [ ] Add `vercel.json` if custom headers/rewrites needed
- [ ] Add backend deployment config (Dockerfile or platform.toml)
- [ ] Update `.env.example` files with missing vars (`RESEND_API_KEY`, `NEXT_PUBLIC_R2_PUBLIC_URL`, Supabase V2 keys)
- [ ] Migrate admin page from direct Supabase tables to Prisma agency models (optional, long-term)

### Low priority / polish

- [ ] **AI Quality Check & Improvement Suggestions** — spec + phased rollout; see `review-collaboration-layer-map.md` §8 (not started)
- [ ] Fix missing `/assets/logo.png` (404 in dev logs)
- [ ] Remove deprecated `app/api/upload-chunk` route or redirect
- [ ] Connect `getProjects()` in `src/lib/api.ts` or remove dead code
- [ ] Expand Playwright E2E coverage beyond example + websocket-sync specs
- [ ] Add `RESEND_API_KEY` to `.env.example`

---

## 17. TODO / FIXME Comments in Codebase

**No active `TODO` or `FIXME` developer comments** were found in source `.ts`/`.tsx` files.

Related markers:

| File | Marker |
|------|--------|
| `app/api/upload-chunk/route.ts` | `[DEPRECATED]` — returns 410 |
| `utils/playerAspectRatio.ts` | `@deprecated Use getAspectRatioClasses` |

---

## 18. Notes for ChatGPT

When assisting with this project, keep these constraints in mind:

### Directory rules (strict — from `.cursorrules`)

1. **All Next.js routes/pages/API** go in `rendorax-frontend/app/` — never `src/app/`
2. **Next.js middleware** lives at `rendorax-frontend/middleware.ts` (project root) — not inside `app/`
3. **UI components** → `rendorax-frontend/components/`
4. **Hooks** → `rendorax-frontend/hooks/`
5. **Utils** → `rendorax-frontend/utils/`
6. **Backend entry** → `rendorax-backend/index.ts`
7. **Prisma schema** → `rendorax-backend/prisma/schema.prisma` (only)
8. **Do not restructure folders** — adapt to existing layout

### What NOT to break

- Existing dashboard UI design and Tailwind classes
- Portfolio `Project` model (separate from `AgencyProject`)
- Supabase legacy table usage in admin page
- Socket.io events in `index.ts` (live collaboration depends on them)

### Common pitfalls

1. **Env conflicts:** Never put `DATABASE_URL`/`DIRECT_URL` in both `.env` and `.env.local`
2. **Prisma naming:** `prisma.project` = portfolio; `prisma.agencyProject` = agency workflow
3. **Auth roles:** Set via Supabase `app_metadata.role` (SQL or admin API), not Prisma `User.role` alone
4. **Backend must run** for media uploads, agency API proxies, and Socket.io features
5. **Agency assignees** must exist in Prisma `User` table (auto-upserted on API call for the caller only)

### Quick file lookup

| Need to… | Look at… |
|----------|----------|
| Add a page | `rendorax-frontend/app/<route>/page.tsx` |
| Add frontend API | `rendorax-frontend/app/api/<name>/route.ts` |
| Add backend API | `rendorax-backend/src/routes/<name>.routes.ts` + mount in `index.ts` |
| Change DB schema | `rendorax-backend/prisma/schema.prisma` → `npm run db:push` |
| Change auth rules | `rendorax-frontend/middleware.ts` + `utils/auth/roles.ts` |
| Change media upload | `utils/r2Upload.ts` + `src/routes/storage.routes.ts` |
| Change live collaboration | `rendorax-backend/index.ts` (Socket.io handlers) |

### Tech stack reference

- **Frontend:** Next.js 14.2.3, React 18, Tailwind 3, Supabase SSR, Socket.io client, HLS.js, Zustand, Zod, Resend
- **Backend:** Express 5, Socket.io, Prisma 7 + pg adapter, BullMQ, FFmpeg, Cloudflare R2 (AWS S3 SDK), Supabase JS, Gemini, OpenAI Realtime

---

## 19. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-03 | Collaboration layer map updated: compiledNotes resolved + AI Quality Check roadmap §8 | `review-collaboration-layer-map.md`; production §14 |
| 2026-07-03 | `compiledNotes` notify workflow manually verified local | Compile & Send: email + Discord notes; Notify Team summary-only; production §14; report: `compiled-notes-notify-trace.md` |
| 2026-07-03 | `compiledNotes` notify fix implemented (`/api/notify` + compile format) | Superseded by manual verify same day |
| 2026-07-03 | Comment author + avatar manually verified local (P1 SQL applied) | Production remains §14 |
| 2026-07-03 | Compare workflow + comment author/avatar: local QA complete; PR branch `monorepo-stabilization-2026-07-03` | Production remains §14 |
| 2026-07-03 | Dashboard QA session: QA-001/002, R2 playback gap, P0 comments, review notify verified **local** | Document before GitHub push; production remains §14 |
| 2026-07-03 | Documentation audit: separate local vs production status; add §14 Needs Verification | Avoid marking unverified production assumptions as complete |
| 2026-07-03 | Keep `AgencyProject` separate from portfolio `Project` in Prisma | Avoid breaking existing `GET /api/projects` and portfolio data model |
| 2026-06 | Consolidate `DATABASE_URL` / `DIRECT_URL` only in `rendorax-backend/.env.local` | Prisma injects both `.env` files; duplicate passwords caused P1000 auth failures |
| 2026-06 | Use Supabase pooler host for `bviltofeuqsibbgancby` | Direct `db.*.supabase.co` DNS failed in local tests; pooler + `postgres.<ref>` username works |

---

*End of report.*
