# Rendorax Studio — Project Checklist & Context Report

> **Generated for:** ChatGPT / AI assistant context upload  
> **Workspace root:** `C:\Users\user\rendorax-studio`  
> **Last updated:** July 20, 2026 (Phase 2A Slice 2.1 TimelineRequest hardening — local)  
> **Do not paste secret values from this file into public channels — variable names only.**

### Current project status (2026-07-20)

**Overall:** Admin HQ and client management are production-verified. Production frontend (Vercel) and backend (Render) are live and healthy. `main` is at commit `34af1c8`. Timeline Sharing Phase 2A Slice 2 (TimelineRequest foundation) implemented locally — not committed.

| Area | Status |
|------|--------|
| Production deployment | **Live** — `34af1c8` deployed; Vercel check success (2026-07-12) |
| Production backend | **Live** — Render `https://rendorax-backend.onrender.com` healthy |
| Admin HQ | **Complete** — Phase 1A/1B, Client Overview Card, Open Tasks KPI, USD billing display |
| Client management | **Complete** — provisioning, professional client list, role assignment validation |
| Dashboard / vault | **Stable** — local QA complete; some production workflows still pending §14 |
| Operations Core WP2+ | **Pending** — WP1 schema complete; next work package not started |
| Timeline Sharing Phase 2A | **Slice 2.1 local** — foundation + partial unique index + 409 race mapping; HTTP E2E blocked (no E2E_* passwords); P3005 baseline still pending |

### Recent milestones (July 2026)

| Date | Milestone | Commit(s) |
|------|-----------|-----------|
| 2026-07-12 | Admin HQ UI bundle deployed and live-verified | `34af1c8` |
| 2026-07-12 | Production verification complete (Vercel + Render + operator Admin HQ QA) | `34af1c8` |
| — | Admin client provisioning complete | `6e37c64` |
| — | Project and task role assignment validation complete | `650c2d7` |

### Feature governance (revised 2026-07-12)

The **2026-07-04 design/UI regression freeze** is **partially superseded** for Admin HQ: the approved admin recovery bundle is committed, deployed, and production-verified.

| Still gated | Unblocked |
|-------------|-----------|
| Operations Core WP2+ (awaiting explicit approval) | Admin HQ UI polish and client management |
| Timeline Sharing Phase 2A Slice 3+ (transitions/UI/Socket); P3005 Migrate baseline | Timeline Sharing Phase 2A Slice 1–2.1 (domain + foundation + open unique index) |
| Broad dashboard redesign | Approved bug fixes and UX clarity on existing surfaces |

**WP1 Prisma schema:** Complete. No schema changes were required for the July 12 Admin HQ UI bundle (`34af1c8`).

---

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
- `timeline-comment-markers-plan.md` — scrubber comment markers (Phase 1 verified local)
- `offline-timeline-marker-export-plan.md` — NLE marker CSV/JSON export (Phase 1 verified local)
- `premiere-xml-marker-export-plan.md` — Premiere Pro xmeml XML export (Phase 2a verified local)
- `timeline-sharing-restoration-blueprint.md` — OTS timeline share restoration (Phase 1 implemented)
- `timeline-sharing-regression-report.md` — live screen share inspection
- `timeline-sharing-production-readiness.md` — Phase 2–4 production readiness audit (2026-07-04)
- `operations-core-gap-analysis.md` — client/project/team ops gaps + Phase 1–3 roadmap (2026-07-04)
- `operations-core-phase1-blueprint.md` — canonical project model, ERD, migration strategy (2026-07-04)
- `operations-core-phase1-implementation-plan.md` — WP0–WP10 implementation plan; approved OC-P1-01–07 (2026-07-04)
- `operations-core-phase1-preflight.md` — WP0 pre-flight; conditional GO for WP1 (2026-07-04)
- `design-regression-freeze-audit.md` — UI regression freeze + recovery plan (2026-07-04)
- `operations-core-wp1-report.md` — WP1 Prisma schema + migration complete (2026-07-04)
- `admin-login-failure-trace.md` — admin auth inspection (login flow, role source)
- `admin-account-setup-guide.md` — Supabase Dashboard operator guide for admin provisioning
- `admin-dashboard-qa-issue-map.md` — admin HQ broken-area inspection (ADM-001–017)
- `admin-hq-recovery-phase1.md` — Phase 1 ops verification (P1 tables, bucket, backend)
- `admin-storage-architecture-review.md` — R2 vs `client-vault` architecture decision
- `admin-client-discovery-migration-plan.md` — MediaAsset client discovery (Phase 1 implemented)
- `admin-hq-initialization-hang-trace.md` — init spinner hang trace + fix (implemented 2026-07-04)
- `admin-hq-asset-loading-trace.md` — Vault Assets empty list inspection (pending fix)
- `admin-hq-design-regression-report.md` — white background + global widgets on `/admin` (pending fix)

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

### Production (verified 2026-07-12)

| Connection | Status | Notes |
|------------|--------|-------|
| Frontend (Vercel) | **Live** | `https://www.rendorax.com`; commit `34af1c8` deployed; Vercel check success |
| Backend (Render) | **Live** | `https://rendorax-backend.onrender.com/api/health` → 200 |
| Frontend → Backend REST | **Verified (production)** | Admin HQ live QA passed; backend healthy |
| Frontend → Backend agency/media API | **Verified (production)** | Client/project/task flows functional on `/admin` |
| Frontend → Backend Socket.io | **Needs verification** | Not re-tested in July 12 production pass |
| Live-site Supabase auth (login/session) | **Verified (production)** | Admin login and `/admin` access confirmed in operator QA |
| R2 media upload/playback | **Needs verification** | Vault asset loading verified on Admin HQ; full dashboard playback not re-tested |
| Backend production hosting | **Deployed (Render)** | No Dockerfile in repo; live on Render |

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

### Frontend (Vercel — live)

| Item | Status |
|------|--------|
| Production URL | `https://www.rendorax.com` |
| Latest production commit | `34af1c8` — Admin HQ UI bundle (2026-07-12) |
| Vercel deployment | **Success** — GitHub commit status verified 2026-07-12 |
| `vercel.json` | **Not present** — relies on Next.js defaults |
| Framework | Next.js 14.2.3 App Router |
| Build command | `npm run build` |
| Env vars | Set all `NEXT_PUBLIC_*` + server secrets in Vercel dashboard |
| `NEXT_PUBLIC_BACKEND_URL` | Points to production Render backend (confirmed by live Admin HQ) |
| `public/_redirects` | Present (`/* /index.html 200`) — Netlify-style, may be legacy/unused on Vercel |

### Backend (Render — live)

| Item | Status |
|------|--------|
| Production URL | `https://rendorax-backend.onrender.com` |
| Health endpoint | `GET /api/health` → 200 |
| Dockerfile | **Not present** in repo |
| Railway / Render / Fly config | **Not present** in repo (deployed manually on Render) |
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
| `npm run build` (frontend) | **Passing (local + production)** | Local build passes; Vercel deploy success on `34af1c8` |
| Agency API UI (Admin HQ) | **Implemented — production verified (2026-07-12)** | Project/task CRUD on `/admin`; editor task view on `/dashboard` still pending |
| UI / design regression freeze | **Partially superseded (2026-07-12)** | Admin HQ recovery bundle shipped and live-verified; WP2+ and Timeline Sharing Phase 2+ still gated |
| Operations core (clients/projects/team) | WP1 done; **WP2+ pending** | Admin client/project/task flows live; next work package not started |
| Backend production hosting | **Deployed (Render)** | Live at `rendorax-backend.onrender.com`; no repo deploy config |
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
| Timeline comment markers (scrubber) | **Resolved — manually verified (local, 2026-07-03)** | `VideoTimelineScrubber` ticks from `video_comments.time_stamp`; tooltip + `jumpToTime`; report: `timeline-comment-markers-plan.md` |
| Offline timeline marker export (CSV + JSON) | **Resolved — manually verified (local, 2026-07-03)** | Vault toolbar **Export Markers**; `exportReviewMarkers.ts`; SMPTE @ 24fps; author via `getCommentDisplayName()`; report: `offline-timeline-marker-export-plan.md` |
| Premiere Pro XML marker export (xmeml) | **Resolved — manually verified (local, 2026-07-03)** | `buildMarkersXmeml()`; File → Import in Premiere; sequence markers; report: `premiere-xml-marker-export-plan.md` |
| Admin login (`admin-studio@kachnamedia.com`) | **Resolved — production verified (2026-07-12)** | `app_metadata.role = admin`; `/admin` accessible; operator QA passed |
| Admin dashboard HQ (functional) | **Complete — production verified (2026-07-12)** | Client discovery, project/task CRUD, phase control, billing, vault assets; commit `34af1c8` |
| Admin HQ visual system | **Complete — production verified (2026-07-12)** | Phase 1A polish, Phase 1B professional client list, Client Overview Card, Open Tasks KPI |
| Admin HQ Vault Assets | **Resolved — production verified (2026-07-12)** | Vault asset loading functional in operator QA; prior empty-list trace superseded |
| Admin client provisioning | **Complete — production verified** | `6e37c64` — Supabase admin user creation + `/api/agency/users` + admin UI |
| Admin professional client list (Phase 1B) | **Complete — production verified** | Search, All/Active/Legacy filters, tiered sort, legacy divider; bundled in `34af1c8` |
| Role assignment validation | **Complete — production verified** | `650c2d7` — project and task assignment role enforcement |
| USD billing display migration | **Complete — production verified** | `34af1c8` — display-only; `Total Amount (USD)`, `$` formatting; no schema/handler changes |

---

## 14. Needs Verification

Items below are **not confirmed** on production as of 2026-07-12. Admin HQ and deployment items verified in July 12 pass are removed.

| Item | Why unverified |
|------|----------------|
| **Frontend → Backend Socket.io (production)** | Not re-tested in July 12 production pass |
| **R2 upload and playback (dashboard production)** | Vault loading verified on Admin HQ; full dashboard upload/playback not re-tested |
| **Vercel Production Supabase env vars** | Dashboard env vars not readable from repo; assumed correct based on live auth |
| **Supabase Auth URL Configuration** | Site URL + Redirect URLs for production domain(s) not re-audited in July 12 pass |
| **Legacy Supabase P0 tables (production)** | `video_comments`, `video_metadata` verified **local dev only** (2026-07-03) |
| **Review notify / compiledNotes (production)** | Verified **local dev only** (2026-07-03) |
| **Comment author + avatar (production)** | Verified **local dev only** (2026-07-03) |
| **Compare workflow (production)** | Verified **local dev only** (2026-07-03) |
| **Offline timeline marker export (production)** | Verified **local dev only** (2026-07-03) |
| **Redis/BullMQ transcode worker (production)** | Optional; requires `REDIS_URL` — not verified live |
| **Admin `app_metadata.role` for non-operator users** | Operator account verified; other users may still lack role |
| **Editor task view on `/dashboard`** | Agency tasks API exists; editor-facing dashboard UI not production-verified |
| **GlobalLiveWidget logged-out visitor flow** | Implemented 2026-07-05; pending manual verify |
| **Timeline Sharing Phase 1** | Implemented; pending two-browser verify |

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
| Timeline comment markers (scrubber) | Resolved |
| Offline timeline marker export (CSV + JSON) | Resolved |
| Premiere Pro XML marker export (xmeml) | Resolved |
| Production deploy / live env | **Verified (2026-07-12)** | Vercel `34af1c8` + Render backend healthy |

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
- [x] **Timeline comment markers (scrubber)** — gold ticks on `VideoTimelineScrubber` from `comments.time_stamp`; tooltip + `jumpToTime` on click. Report: `timeline-comment-markers-plan.md`. **Resolved — manually verified (local, 2026-07-03).**
- [x] **Offline timeline marker export (CSV + JSON)** — vault toolbar **Export Markers**; `exportReviewMarkers.ts` + `handleExportMarkers()`; SMPTE @ 24fps; author, comment, file name, `createdAt`; empty-comment guard; one click → CSV + JSON + XML. Report: `offline-timeline-marker-export-plan.md`. **Resolved — manually verified (local, 2026-07-03).**
- [x] **Premiere Pro XML marker export (Phase 2a)** — xmeml sequence markers; Premiere File → Import; correct timecodes; author in marker comment; CSV/JSON preserved. Report: `premiere-xml-marker-export-plan.md`. **Resolved — manually verified (local, 2026-07-03).**
- [x] **Compare workflow (Cloud CDN)** — V1 (Reference) + V2 (Current) side-by-side; compare dropdown; cloud/R2 + vault compare; initial sync; no ghost/background playback; single player when compare off. Reports: `compare-workflow-regression-report.md`. **Resolved — manually verified (local, 2026-07-03).**

### Documentation

- [x] Auth inspection reports: `supabase-auth-live-test-report.md`, `production-auth-flow-walkthrough.md`
- [x] `AI_TEAM_PROTOCOL.md` added at workspace root
- [x] Documentation protocol: dual source-of-truth (`AI_TEAM_PROTOCOL.md` + this checklist)
- [x] **July 12 documentation sync** — production verification + Admin HQ milestones recorded in this checklist

> **Local vs production:** Dashboard QA items above are **local dev only** unless noted. Admin HQ and deployment verified in **§15a (2026-07-12)**.

---

## 15a. Recent Completed Work — Production Verified (2026-07-12)

Verified by deployment checks, GitHub Vercel commit status, Render health probe, and operator Admin HQ live QA.

### Deployment & infrastructure

- [x] **Production frontend deployed (Vercel)** — `https://www.rendorax.com`; commit `34af1c8` on `main`; Vercel deployment success (2026-07-12)
- [x] **Production backend deployed (Render)** — `https://rendorax-backend.onrender.com/api/health` → 200
- [x] **Production build** — `npm run build` passes locally; Vercel build succeeded for `34af1c8`
- [x] **No deployment issues found** — operator QA and external checks clean

### Client management

- [x] **Admin client provisioning** — `6e37c64`: Supabase admin user creation, `supabaseAdmin.ts`, `/api/agency/users`, admin UI wiring
- [x] **Professional client list (Phase 1B)** — search, All/Active/Legacy filters, tiered sort, legacy divider, improved client cards
- [x] **Role assignment validation** — `650c2d7`: project and task assignment role enforcement

### Admin HQ (`34af1c8` — frontend only; no backend/schema/API changes)

- [x] **Phase 1A UI polish** — client search, scrollable list, asset count badges, empty states
- [x] **Phase 1B professional client list** — see Client management above
- [x] **Client Overview Card** — client-scoped project/task/asset/invoice/phase/last-activity stats
- [x] **Open Tasks KPI** — replaces static "Operational" metric
- [x] **USD billing display migration** — `Total Amount (USD)`, `$` formatting in overview and invoice list; display-only (no schema/handler changes)
- [x] **Admin HQ live verification** — client search/filters, selection, overview card, phase control, billing, vault assets, project/task creation; no console errors reported

> **Commit note:** `34af1c8` message references USD migration; diff bundles Phase 1A + 1B + Client Overview Card + Open Tasks KPI + USD display (~503 insertions in `app/admin/page.tsx`).

---

## 16. Pending Tasks Checklist

Each item appears **once**. Production-specific checks are in §14 unless listed here as actionable work.

### High priority

- [x] Test live-site login/authentication with new Supabase project — **production verified (2026-07-12)** via operator Admin HQ QA
- [ ] Confirm Vercel Production env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `bviltofeuqsibbgancby` (assumed correct; not re-audited from repo)
- [ ] Confirm Supabase Auth URL Configuration (Site URL + Redirect URLs) for production domain(s)
- [x] Deploy backend to a host with WebSocket + FFmpeg support — **live on Render (2026-07-12)**
- [x] Set `NEXT_PUBLIC_BACKEND_URL` in Vercel to production backend URL — **confirmed by live Admin HQ (2026-07-12)**
- [x] Wire agency management UI into **admin** — **production verified (2026-07-12)**; editor task view on `/dashboard` still pending
- [ ] Wire editor task view into `/dashboard` — agency tasks API exists; editor-facing UI not production-verified
- [ ] Seed `User` records in Prisma for existing Supabase auth users
- [x] Verify legacy Supabase **P0** tables in new project (`video_comments`, `video_metadata`) — **local dev, 2026-07-03** via `supabase-p0-legacy-review-tables.sql`
- [x] Apply **P1** `supabase-p1-comment-author-columns.sql` — **local dev, 2026-07-03** (production Supabase still pending)
- [x] **Admin HQ client discovery migration (Phase 1)** — `GET /api/media/clients` + `fetchMediaClients()` — **production verified (2026-07-12)**
- [x] **Admin HQ init hang fix** — non-blocking client discovery + `finally` + 10s timeout — **production verified (2026-07-12)**
- [x] **Admin HQ design restoration (Fix A)** — dark admin background — **production verified (2026-07-12)**
- [x] **Admin HQ comm + loading UX recovery** — embedded comm strip, `clientsLoading`, no full-page spinner — **production verified (2026-07-12)**
- [x] **Admin HQ asset loading** — vault assets functional in operator QA — **production verified (2026-07-12)**; prior trace superseded
- [x] Verify legacy Supabase **P1** tables (`project_status`, `project_status_details`, `client_invoices`) — **production verified (2026-07-12)** via Admin HQ phase/billing/brief flows
- [x] **Admin client provisioning** — `6e37c64` — **production verified (2026-07-12)**
- [x] **Admin HQ Phase 1A UI polish** — **production verified (2026-07-12)** — bundled in `34af1c8`
- [x] **Admin HQ Phase 1B professional client list** — **production verified (2026-07-12)** — bundled in `34af1c8`
- [x] **Client Overview Card** — **production verified (2026-07-12)** — bundled in `34af1c8`
- [x] **Open Tasks KPI** — **production verified (2026-07-12)** — bundled in `34af1c8`
- [x] **USD billing display migration** — **production verified (2026-07-12)** — `34af1c8`; display-only
- [x] **Role assignment validation** — `650c2d7` — **production verified (2026-07-12)**
- [x] **Operations core Phase 1 — WP1** — Prisma schema + migration — `operations-core-wp1-report.md`
- [ ] **Operations core Phase 1 — WP2+** — **Pending** — WP1 complete; resume when explicitly approved
- [ ] ~~Configure Supabase Storage bucket `client-vault` for Admin HQ~~ — **superseded** by client discovery migration (bucket not required for admin; legacy routes only)
- [x] **Admin dashboard HQ fixes** — client discovery, P1 tables, phase/billing/brief — **production verified (2026-07-12)**
- [x] **Timeline Sharing Phase 2A — Slice 1** — domain validation: persistent `TimelineRequest` only; `TimelineSession` deferred (2026-07-20)
- [x] **Timeline Sharing Phase 2A — Slice 2** — `TimelineRequest` Prisma model + additive migration SQL + create/list/get REST + Next proxies — **local verified (2026-07-20)**; no lifecycle transitions, UI, or Socket.IO changes
- [x] **Timeline Sharing Phase 2A — Slice 2.1** — immutable project-snapshot docs; partial unique index `TimelineRequest_requester_asset_open_uidx`; POST unique-violation → 409; baseline runbook (`timeline-request-migrate-baseline-runbook.md`); HTTP script `scripts/test-timeline-requests-api.ts` — **auth matrix blocked** (E2E_* passwords unset); index verified in DB
- [ ] **Timeline Sharing Phase 2A — Slice 3+** — accept/decline/cancel/start/end transitions, UI, Socket notify (awaiting approval)
- [ ] **Timeline Sharing — Phase 2+ (legacy readiness doc)** — collaboration → agency → production per `timeline-sharing-production-readiness.md`
- [ ] **Timeline Sharing (OTS / Live Editing Share) — Phase 1 manual verify** — two-browser Go Live test per `timeline-sharing-restoration-blueprint.md` §10
- [x] **GlobalLiveWidget logged-out visitor flow** — logged-out "Talk to Rendorax" CTA opens existing `ContactForm` in a new `ContactModal` shell instead of redirecting to `/access`; `/access` login flow unchanged; dashboard live session (logged-in) unchanged — **implemented 2026-07-05; pending manual verify**

### Medium priority

- [ ] Remove or archive stale `rendorax-backend/schema.prisma` (root duplicate)
- [ ] Remove orphaned `websocket/server.ts` or document its purpose
- [ ] Add `vercel.json` if custom headers/rewrites needed
- [ ] Add backend deployment config (Dockerfile or platform.toml) — optional; Render already live without repo config
- [ ] Update `.env.example` files with missing vars (`RESEND_API_KEY`, `NEXT_PUBLIC_R2_PUBLIC_URL`, Supabase V2 keys)
- [ ] Migrate admin page from direct Supabase tables to Prisma agency models (optional, long-term)
- [ ] **Timeline Sharing (OTS / Live Editing Share) — Phase 1** — unified `getReviewRoomId()` join contract; `timeline-sharing-restoration-blueprint.md`. **Implemented — pending manual verify (local).** Phase 2: comments in cinema + playhead sync.

### Low priority / polish

- [x] **Offline Editing Timeline Marker Export (Phase 1)** — CSV + JSON via vault **Export Markers**; `offline-timeline-marker-export-plan.md`. **Resolved — manually verified (local, 2026-07-03).**
- [x] **Premiere Pro XML Marker Export (Phase 2a)** — xmeml sequence markers for Premiere import; `premiere-xml-marker-export-plan.md`. **Resolved — manually verified (local, 2026-07-03).**
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
| 2026-07-20 | Phase 2A Slice 2.1 — TimelineRequest hardening | Immutable `agencyProjectId` snapshot invariant documented; partial unique index on open `(requesterId, assetId)`; DB race → 409; P3005 baseline runbook only (not executed); HTTP E2E blocked without E2E passwords |
| 2026-07-20 | Phase 2A Slice 2 — TimelineRequest foundation | Additive `TimelineRequest` + `TimelineRequestStatus`; create/list/get under `/api/agency/timeline-requests`; Next proxies; no transitions/UI/Socket; `TimelineSession` deferred; local `db push` + backend/frontend typecheck pass |
| 2026-07-20 | Phase 2A Slice 1 — TimelineRequest domain only | Persist async request lifecycle; reuse ephemeral Socket.IO host/playback; no TimelineSession today |
| 2026-07-17 | Guide Center docs aligned with homepage Real-Time Collaboration messaging | Documentation-only: `/guide/client/review-comments` pillars + workflow Review link + FAQ; no product/API/homepage changes |
| 2026-07-17 | Guide collaboration copy corrected for translation boundary | Document verified automatic **text** chat/direction translation only; do not claim automatic video/voice/spoken translation until verified |
| 2026-07-17 | Homepage onboarding path clarified for visitors | Compact “How projects begin” after Client Vault; Contact note; no public signup; CTA “Discuss Your Project” |
| 2026-07-17 | Homepage subtle interaction polish | CSS + one-time IntersectionObserver reveals; hover lift on cards; prefers-reduced-motion; no copy/API changes |
| 2026-07-17 | Marketing site mobile layout polish | Safer 320–430px wrapping, touch targets, spacing, journey overflow, nav/menu; no copy/SEO/backend changes |
| 2026-07-17 | Studio Access label + password visibility | Navbar/access role-neutral “Studio Access”; reusable PasswordField on login/reset/invite/admin/private-reel; no auth/backend changes |
| 2026-07-17 | Phase 1 review playback transport sync | Host admin/editor Socket.IO play/pause/seek + late-join state; followers follow; leave-room; ephemeral in-memory host; no Cinema/schema changes |
| 2026-07-17 | Professional Review Workspace Phase 1 UX | Video-dominant preview; Review Summary + status banner + stronger approval; Review Feedback panel; sidebar polish; no workflow/API changes |

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-12 | Production verification complete | Commit `34af1c8` deployed (Vercel success); Render backend healthy; operator Admin HQ live QA passed; no deployment issues |
| 2026-07-12 | Admin HQ UI bundle shipped (`34af1c8`) | Phase 1A polish, Phase 1B client list, Client Overview Card, Open Tasks KPI, USD billing display; frontend-only change to `app/admin/page.tsx`; no backend/schema/API changes |
| 2026-07-12 | Admin client provisioning complete (`6e37c64`) | Supabase admin user creation, `supabaseAdmin.ts`, `/api/agency/users`, admin UI; production-verified |
| 2026-07-12 | Role assignment validation complete (`650c2d7`) | Project and task assignment role enforcement; production-verified |
| 2026-07-12 | Partial thaw of July 4 design/UI freeze for Admin HQ | Admin recovery bundle committed, deployed, and live-verified; WP2+ and Timeline Sharing Phase 2+ remain gated |
| 2026-07-12 | USD billing display migration (display-only) | `BDT`/`৳` labels replaced with `USD`/`$`; historical numeric values unchanged; no schema or handler changes |
| 2026-07-04 | Admin HQ comm + loading UX recovery | Embedded `GlobalLiveWidget` + `ChatbotWidget` on admin; duplicate float suppressed; `clientsLoading` sidebar; spinner removed; build passing |
| 2026-07-04 | Admin HQ design restoration Fix A+B | `bg-bg-body` on admin loading + main; initial widget hide superseded by comm recovery |
| 2026-07-04 | Admin HQ design regression inspected | White canvas root cause documented; `admin-hq-design-regression-report.md` |
| 2026-07-04 | Admin HQ asset loading inspected | Silent error masking on `fetchMediaAssets`; `admin-hq-asset-loading-trace.md` |
| 2026-07-04 | Admin HQ init hang fix implemented | Non-blocking `fetchClientFolders`, `finally setLoading(false)`, 10s timeout; `admin-hq-initialization-hang-trace.md`; pending manual verify |
| 2026-07-04 | Admin HQ client discovery Phase 1 implemented | `GET /api/media/clients`, `fetchMediaClients()`, admin sidebar |
| 2026-07-04 | Admin HQ client discovery migration planned | Superseded by Phase 1 implementation same day |
| 2026-07-04 | Admin storage architecture review | `client-vault` legacy for admin; R2 + Prisma canonical; `admin-storage-architecture-review.md` |
| 2026-07-04 | Admin dashboard QA inspection — issue map before fixes | `admin-dashboard-qa-issue-map.md`; auth resolved; P1 tables + legacy storage drift; preserve single-page admin structure |
| 2026-07-04 | Admin account provisioned via Supabase Dashboard | `admin-studio@kachnamedia.com` + `app_metadata.role`; guides: `admin-account-setup-guide.md`, `admin-login-failure-trace.md` |
| 2026-07-04 | Design/UI regression freeze | Feature work frozen; recovery plan + QA gate — `design-regression-freeze-audit.md` |
| 2026-07-04 | Operations core WP1 | `agencyProjectId` + brief columns; migration `20260704161500_ops_core_phase1`; `operations-core-wp1-report.md` |
| 2026-07-04 | Operations core WP0 pre-flight | P1 tables live; conditional GO for WP1; `operations-core-phase1-preflight.md` |
| 2026-07-04 | Operations core Phase 1 blueprint approved | OC-P1-01–07 locked; implementation plan: `operations-core-phase1-implementation-plan.md` |
| 2026-07-04 | Operations core Phase 1 blueprint | Canonical SoT: `AgencyProject`; ERD + migration strategy; `operations-core-phase1-blueprint.md` |
| 2026-07-04 | Operations core gap analysis | Client/project/team/assignment/feedback/status gaps; Phase 1–3 roadmap; `operations-core-gap-analysis.md` |
| 2026-07-04 | Timeline Sharing production readiness audit | Phase 2–4 roadmap; blockers TS-C01–C06; `timeline-sharing-production-readiness.md` |
| 2026-07-04 | Timeline Sharing Phase 1 — unified review room helper | `utils/reviewRoom.ts`; `getReviewRoomId()` for join/share/sync; pending two-browser verify; blueprint: `timeline-sharing-restoration-blueprint.md` |
| 2026-07-05 | GlobalLiveWidget logged-out visitor flow implemented | Logged-out CTA relabeled "Talk to Rendorax", opens new `ContactModal` wrapping existing `ContactForm` (unchanged fields/backend); no new form, no auth changes, `/access` untouched; logged-in dashboard/admin live session paths untouched; `npm run build` passing; pending manual verify |
| 2026-07-03 | Premiere XML marker export manually verified local | xmeml import in Premiere; sequence markers; author + comment; CSV/JSON preserved; production §14 |
| 2026-07-04 | Premiere XML marker export Phase 2a implemented | `buildMarkersXmeml()`; Export Markers adds .xml; superseded by manual verify |
| 2026-07-03 | Premiere Pro XML marker export — inspection plan (xmeml Phase 2) | `premiere-xml-marker-export-plan.md`; superseded by Phase 2a implementation |
| 2026-07-03 | Offline timeline marker export manually verified local | CSV + JSON; Export Markers toolbar; SMPTE, author, empty guard; production §14; report: `offline-timeline-marker-export-plan.md` |
| 2026-07-03 | Offline timeline marker export Phase 1 (CSV + JSON) | `exportReviewMarkers.ts`, vault toolbar Export Markers; superseded by manual verify same day |
| 2026-07-03 | Offline timeline marker export — inspection plan (CSV/JSON Phase 1) | `offline-timeline-marker-export-plan.md`; not implemented |
| 2026-07-03 | Timeline comment markers manually verified local | `VideoTimelineScrubber` ticks + `jumpToTime`; production §14; report: `timeline-comment-markers-plan.md` |
| 2026-07-03 | Timeline comment markers Phase 1 implemented on scrubber | `VideoTimelineScrubber` + `page.tsx`; superseded by manual verify same day |
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
