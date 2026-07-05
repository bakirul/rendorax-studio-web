# Timeline Sharing — Production Readiness Audit

**Created:** 2026-07-04  
**Type:** Inspection only — no implementation, no refactor, no deploy  
**Scope:** OTS (over-the-shoulder) live editing share, review room sync, comments, markers, exports, team roles  
**Phase 1 status:** **Implemented** — `utils/reviewRoom.ts`, unified `getReviewRoomId()` join contract — **pending two-browser manual verify**

**Related docs:** `timeline-sharing-restoration-blueprint.md`, `timeline-sharing-regression-report.md`, `review-collaboration-layer-map.md`

---

## Executive summary

| Area | Production-ready? | Summary |
|------|-------------------|---------|
| **OTS screen share (WebRTC)** | **Partial** | Editor → client cinema stream works in code; LAN-oriented; no TURN guarantee |
| **Session ownership** | **Missing** | No host record; first `admin-started-timeline-share` wins; `isEditor` = JWT `admin` \| `editor` only |
| **Session participation** | **Partial** | Multi-viewer WebRTC mesh per client-ready; no cap; no invite; manual same-room coordination |
| **Room architecture** | **Partial** | Asset/file/folder string rooms; no DB session; collision/orphan risks |
| **Playback sync** | **Broken / Partial** | Socket listeners exist; **emitters missing** from play/pause/scrubber |
| **Comments in cinema** | **Missing** | Full workspace unmounted when `isLiveStreaming` |
| **Timeline markers** | **Partial** | Scrubber markers work in review mode; not synced live; hidden in cinema |
| **Exports (CSV/JSON/XML)** | **Working** (review mode) | No conflict with live sessions; unavailable during cinema |
| **Team roles** | **Partial** | Only `admin` / `editor` / `client` in auth + agency schema |
| **Infrastructure** | **Partial** | Active Socket.io in `index.ts`; duplicate client sockets; orphan `websocket/server.ts`; TURN optional |

**Verdict:** Timeline Sharing is **not production-ready** for a post-production team. Phase 1 stabilizes room identity; **Phase 2 (collaboration-ready)** is the minimum bar for team review during live share.

---

## 1. Session ownership

### 1.1 Who owns a live session today?

| Role (product) | Owner in code? | Evidence |
|----------------|----------------|----------|
| **Editor** | **De facto owner** | Only `isEditor` users see **Go Live** (`DashboardHeader.tsx` L168); `startScreenShare` runs locally |
| **Admin** | **Same as editor** | `isEditor = app_metadata.role === "admin" \|\| "editor"` (`page.tsx` L595–598) |
| **Producer** | **Not modeled** | No `producer` in `AgencyRole` or `app_metadata` |
| **Client reviewer** | **Viewer only** | Receives `admin-started-timeline-share`; initiates `timeline-client-ready` |

**No server-side session owner.** Backend relays `admin-started-timeline-share` with `editorSocketId` but does not persist host, validate host, or reject a second sharer.

```182:185:rendorax-backend/index.ts
  socket.on("admin-started-timeline-share", (data: { roomId: string; editorSocketId: string }) => {
    socket.to(data.roomId).emit("admin-started-timeline-share", data);
  });
```

### 1.2 Ownership model status

| Capability | Status |
|------------|--------|
| Persisted `hostUserId` | **Missing** |
| Host transfer / co-host | **Missing** |
| Host-only stop (forced) | **Partial** — only editor who started can stop locally; no remote kill |
| Agency project owner ↔ session | **Missing** — `AgencyProject` has no `reviewSessionId` |
| Admin HQ override | **Missing** — `/admin` has no timeline share controls |

---

## 2. Session participation

### 2.1 Participant types

| Participant | Can join today? | How |
|-------------|-----------------|-----|
| **Internal editor/admin** | **Yes** (host) | Go Live + screen capture |
| **Internal team (non-editor JWT)** | **Viewer only** | Must be in same Socket room; receives cinema UI |
| **Client reviewer** | **Viewer** | Same — must open matching asset / room |
| **Anonymous / link guest** | **No** | No share token or guest auth |

### 2.2 Limits

| Limit | Current behavior |
|-------|------------------|
| Max viewers | **Unbounded** — one `Peer` per `timeline-client-ready` on editor |
| Max concurrent sharers per room | **Unbounded** — no server mutex (collision risk) |
| Same user, multiple tabs | **Untested** — duplicate socket IDs possible |
| Global live call vs timeline share | **Competes** — `getUserMedia` / display capture locks noted in `startScreenShare` (display `audio: false` comment) |

### 2.3 Participation blockers

1. Both parties must join **identical** `getReviewRoomId()` (same `assetId` or normalized filename).
2. Viewer without preview open may land in `review:folder:*` or `global-lobby` — **will not receive share**.
3. No invite URL — manual coordination only.

---

## 3. Room architecture

### 3.1 Room creation

```28:48:rendorax-frontend/utils/reviewRoom.ts
export function getReviewRoomId(previewFile?, currentFolder?): string {
  if (assetId) return `review:asset:${assetId}`;
  if (name) return `review:file:${normalizeReviewFileKey(name)}`;
  if (folder) return `review:folder:${folder}`;
  return "global-lobby";
}
```

| Room type | Key pattern | When used |
|-----------|-------------|-----------|
| Asset-based | `review:asset:{uuid}` | Preferred — cloud + vault with `previewFile.assetId` |
| File-based | `review:file:{normalized}` | Fallback — vault prefix stripped |
| Folder-based | `review:folder:{path}` | No preview open |
| Global | `global-lobby` | Fallback — **collides with live session lobby** |

**Join:** `socket.emit("join-video-room", roomId)` → `socket.join(room)` (raw string, no prefix).

### 3.2 Lifecycle

| Stage | Mechanism |
|-------|-----------|
| **Create** | Implicit on first `join-video-room` |
| **Start share** | `admin-started-timeline-share` → viewers `setIsLiveStreaming(true)` |
| **WebRTC** | Per-viewer `timeline-client-ready` → offer/answer |
| **Stop** | `admin-stopped-timeline-share` + local track stop |
| **Cleanup** | `disconnect` → `timeline-user-disconnected` to all joined rooms |

**Gaps:** No TTL, no empty-room teardown, no server registry of active shares.

### 3.3 Collision risks

| Risk | Severity | Detail |
|------|----------|--------|
| Two editors Go Live same room | **High** | Both emit `admin-started`; viewers may attach to wrong peer |
| `global-lobby` overlap | **Medium** | Timeline + `GlobalLiveWidget` `join-lobby` share name space |
| File vs asset room mismatch | **Medium** | Editor on cloud `assetId`, viewer on vault filename-only preview |
| Orphan `websocket/server.ts` | **Low (ops)** | Uses `video_${fileId}` — different from active server if ever started |

### 3.4 Asset-based vs session-based

| Model | Status |
|-------|--------|
| **Asset-based rooms (Phase 1)** | **Implemented** |
| **Session-based rooms (`review:session:{uuid}`)** | **Missing** — Phase 3 |
| **Project-based rooms** | **Missing** — Phase 3 |

---

## 4. Playback synchronization

Backend relays `video-play`, `video-pause`, `video-seek` by `data.room` (`index.ts` L93–106).

### 4.1 Status matrix

| Control | Emit from UI? | Receive handler? | Status |
|---------|---------------|------------------|--------|
| **Play** | **No** (`handleTogglePlay` local only) | **Yes** (`useLiveComments`) | **Missing emit** |
| **Pause** | **No** | **Yes** | **Missing emit** |
| **Seek (scrubber)** | **No** (`VideoTimelineScrubber` local only) | **Yes** (`handleVideoSeek`) | **Missing emit** |
| **Marker click → jump** | **Partial** (`jumpToTime` emits seek + play) | **Yes** | **Partial** |
| **±5s buttons** | **No** | N/A | **Missing** |
| **Playback speed** | **No** | N/A | **Missing** |
| **Cinema mode (OTS stream)** | N/A | N/A | **Not applicable** — shared pixels, not asset player |

### 4.2 Cinema vs asset player

During `isLiveStreaming`, the **asset `videoRef` player is unmounted**. Sync targets `videoRef` in `useLiveComments` — irrelevant to cinema WebRTC stream. Playhead sync applies only when **both users are in normal review layout** on the same asset.

### 4.3 Feedback-loop risk (Phase 2)

Listeners apply remote events without origin guard. Emitting from `handleTogglePlay` without debounce/echo suppression may cause loops — noted in blueprint.

---

## 5. Comment visibility

| Mode | Comments UI | Socket `comment-added` | Add comment |
|------|-------------|------------------------|-------------|
| **Normal review** | `CommentsPanel` visible | **Works** | **Works** |
| **Live sharing (cinema)** | **Unmounted** | Would work if UI existed | **Unreachable** |
| **Cinema + split view** | **Not implemented** | N/A | Phase 2 |

```1247:1249:rendorax-frontend/app/dashboard/page.tsx
        {isLiveStreaming ? (
          <TimelineShareWidget ... />
        ) : (
```

**Root cause of “comments disappear in cinema mode”:** intentional full-workspace swap — not a socket bug.

**Comment storage:** Supabase `video_comments` keyed by `file_name` (not `reviewRoomId`). Socket broadcast uses `fileId: getReviewRoomId()` — aligned for room join, separate from DB key.

---

## 6. Timeline markers

### 6.1 Scrubber markers (review mode)

| Feature | Status | Evidence |
|---------|--------|----------|
| Comment ticks on scrubber | **Working** | `VideoTimelineScrubber` + `comments` prop |
| Click marker → `jumpToTime` | **Working** | `onMarkerClick={jumpToTime}` |
| Marker tooltip | **Working** | Local UI |

### 6.2 Live synchronization

| Feature | Status |
|---------|--------|
| Broadcast marker navigation to room | **Missing** — only `jumpToTime` emits seek/play |
| Shared marker state over socket | **Missing** |
| Markers visible in cinema | **Missing** — scrubber unmounted |
| Markers on editor NLE screen (OTS) | **N/A** — WebRTC shows editor desktop pixels |

### 6.3 Compatibility with Phase 2 playhead sync

Marker click already calls `jumpToTime` → emits `video-seek` + `video-play`. Once play/pause/scrubber emitters exist, marker navigation **partially shares** playhead — still no dedicated marker event.

---

## 7. Export compatibility

| Export | Entry | Live session conflict? |
|--------|-------|------------------------|
| **CSV** | `handleExportMarkers` → `buildMarkersCsv` | **None** — reads local `comments` state |
| **JSON** | `buildMarkersJson` | **None** |
| **Premiere XML** | `buildMarkersXmeml` | **None** |
| **Compile & Send / Notify** | `/api/notify` | **None** |

**Caveat:** During cinema mode, export UI is **unreachable** (comments panel unmounted). Exports work in review mode before/after share — not **during** live session.

**No file locking** — comments can be added/exported while another user shares a different layout on same asset.

---

## 8. Team workflow compatibility

### 8.1 Auth roles (`app_metadata.role`)

| Role | Go Live (host) | View cinema | Comment (review mode) | Dashboard access |
|------|----------------|-------------|----------------------|------------------|
| **admin** | **Yes** | **Yes** | **Yes** | `/admin` + `/dashboard` |
| **editor** | **Yes** | **Yes** | **Yes** | `/dashboard` |
| **client** | **No** | **Yes** (if same room) | **Yes** | `/dashboard` |

### 8.2 Product roles (not in schema)

| Role | Participate today? | Gap |
|------|------------------|-----|
| **Producer** | **No distinct role** | Map to `editor` or extend `AgencyRole` |
| **Colorist** | **No** | Same |
| **GFX/VFX** | **No** | Same |
| **Audio Engineer** | **No** | Same |
| **Client Reviewer** | **Partial** | `client` JWT; no invite; must self-navigate to asset |

### 8.3 Agency layer (`prisma/schema.prisma`)

- `AgencyRole`: `admin`, `editor`, `client` only
- `AgencyProject` / `Task` — **no** review session linkage
- Agency API exists; **dashboard has no agency UI** for task-assigned review

---

## 9. Infrastructure

### 9.1 Active stack (`rendorax-backend/index.ts`)

| Component | Usage |
|-----------|--------|
| **Socket.io** | Single server on `:4000` with Express |
| **simple-peer** | Timeline OTS + `LiveSessionWidget` calls |
| **WebRTC** | `getDisplayMedia` + peer mesh |
| **STUN** | Google + Cloudflare (`webrtcConfig.ts`) |
| **TURN** | **Optional** — `NEXT_PUBLIC_TURN_*` env; **required for many production NAT scenarios** |

### 9.2 Duplicate / orphan paths

| Item | Status |
|------|--------|
| `rendorax-backend/websocket/server.ts` | **Orphan** — `video_${fileId}` rooms, `sync-timecode`; not imported by `index.ts` |
| **Dual Socket.io clients per dashboard tab** | **Active** — `useLiveComments` + `GlobalLiveWidget` each call `io()` |
| Timeline vs live-call events | **Separated** — `timeline-webrtc-*` vs `webrtc-offer`; ICE on live-call only |
| `receive-translated-speech` | **Global broadcast** — `io.emit` (L349), not room-scoped — privacy/leak risk |

### 9.3 E2E / ops

| Item | Status |
|------|--------|
| `e2e/websocket-sync.spec.ts` | Tests `video-play` relay; screen share **not** covered; may be skipped |
| Production `NEXT_PUBLIC_BACKEND_URL` | Checklist: **unverified** on Vercel |
| Backend deploy | Checklist: **not deployed** |

---

## 10. Production readiness — issue register

### 10.1 Critical blockers (must fix before production team use)

| ID | Issue | Evidence |
|----|-------|----------|
| **TS-C01** | Comments unavailable during live share | Cinema layout unmounts `CommentsPanel` |
| **TS-C02** | No play/pause/scrub sync from player controls | Emitters missing; listeners only |
| **TS-C03** | No session ownership / mutex | Multiple hosts possible; no persisted session |
| **TS-C04** | No share links / invites | Manual same-asset coordination |
| **TS-C05** | TURN not guaranteed | `webrtcConfig.ts` optional TURN |
| **TS-C06** | Viewer room mismatch silent failure | Client without matching `previewFile` |

### 10.2 High-risk issues

| ID | Issue |
|----|-------|
| **TS-H01** | Duplicate Socket.io connections per tab |
| **TS-H02** | `receive-translated-speech` global `io.emit` |
| **TS-H03** | Timeline WebRTC: no ICE trickle / candidate path |
| **TS-H04** | `global-lobby` namespace collision with live widgets |
| **TS-H05** | Phase 1 not manually verified (two-browser) |
| **TS-H06** | No role beyond admin/editor/client for post-production disciplines |

### 10.3 Nice-to-have improvements

| ID | Item |
|----|------|
| **TS-N01** | Consolidate dashboard to single socket context |
| **TS-N02** | Archive `websocket/server.ts` |
| **TS-N03** | Re-enable E2E for play/seek + cinema smoke |
| **TS-N04** | Session-end → auto `compiledNotes` notify |
| **TS-N05** | Feature flag for Go Live |
| **TS-N06** | Dev room indicator UI |

---

## 11. Implementation roadmap

### Phase 2 — Collaboration-ready

**Goal:** Post-production team can run a live OTS review with **comments visible**, **basic playhead sync**, and **reliable WebRTC** on production networks.

**Exit criteria:**
- Client comments during live share (split-view layout)
- Play/pause/seek sync on asset player (±0.5s)
- TURN configured and verified off-LAN
- Two-browser + off-LAN manual pass documented

| Order | Task | Files | APIs | UI | Risks | Dependencies |
|-------|------|-------|------|-----|-------|--------------|
| **2.1** | Split-view cinema — cinema + comments (optional narrow scrubber) | `app/dashboard/page.tsx` | — | Layout branch L1247+ | Mobile regression | Phase 1 verify |
| **2.2** | Emit `video-play` / `video-pause` / `video-seek` from `handleTogglePlay`, scrubber, ±5s | `page.tsx`, `VideoTimelineScrubber.tsx`, `useLiveComments.ts` | Socket events | Player controls | Echo loops — debounce | 2.1 optional |
| **2.3** | Enforce `assetId` on vault preview for stable rooms | `page.tsx` preview handlers | — | — | Legacy files without asset | MediaAsset index |
| **2.4** | TURN production config | `webrtcConfig.ts`, Vercel env | — | — | Cost, credential rotation | Ops |
| **2.5** | Active sharer mutex per room | `rendorax-backend/index.ts` | Socket | Toast on reject | Reconnect edge cases | — |
| **2.6** | Scope `receive-translated-speech` to room | `index.ts` | Socket | `TimelineShareWidget` | Live call regression | — |
| **2.7** | Peer cleanup audit | `page.tsx` | `timeline-user-disconnected` | — | Orphan peers | — |
| **2.8** | E2E play/seek sync | `e2e/websocket-sync.spec.ts` | — | — | Flaky CI | 2.2 |

**Estimated effort:** 1–2 weeks  
**DB changes:** None  
**Architecture change:** None (layout branch only)

---

### Phase 3 — Agency-ready

**Goal:** Sessions tied to **agency projects**, **shareable join URLs**, **invite flow**, and **role-aware participation** for client + internal team.

**Exit criteria:**
- `ReviewSession` persisted; host + status
- `/dashboard?review={sessionId}` auto-join
- Email/notify invite with link
- Agency project ↔ session (API minimum; UI optional)
- 5+ participant stress test

| Order | Task | Files | APIs | UI | Risks | Dependencies |
|-------|------|-------|------|-----|-------|--------------|
| **3.1** | `ReviewSession` + `ReviewParticipant` models | `prisma/schema.prisma` | Migration | — | Prod migration | — |
| **3.2** | Session CRUD API | `rendorax-backend` routes, `app/api/` proxy | `POST/GET/DELETE /api/review/sessions` | — | AuthZ | 3.1 |
| **3.3** | Room key `review:session:{id}` | `utils/reviewRoom.ts`, `useLiveComments.ts` | Socket | — | Comment mapping | 3.2 |
| **3.4** | Share link + deep link handler | `app/dashboard/page.tsx`, new util | — | Session banner | Guest auth | 3.2, Supabase |
| **3.5** | Invite via `/api/notify` or dedicated route | `app/api/notify/route.ts` | Email | Invite modal (minimal) | Token security | 3.4 |
| **3.6** | `AgencyProject.reviewSessionId` linkage | `schema.prisma`, agency routes | Agency API | Agency panel (minimal) | Scope creep | Agency UI backlog |
| **3.7** | Extend `AgencyRole` or metadata for producer/colorist/audio/GFX | `schema.prisma`, auth | — | Role badges | Product decision | — |
| **3.8** | Single dashboard socket context | `useLiveComments.ts`, `GlobalLiveWidget.tsx` | — | — | Regression | Phase 2 stable |
| **3.9** | Archive `websocket/server.ts` | `rendorax-backend/websocket/` | — | — | Dev confusion | — |
| **3.10** | Role-aware cinema controls (host vs viewer) | `TimelineShareWidget.tsx`, store | — | Host chrome | UX | 3.2 |

**Estimated effort:** 4–8 weeks  
**DB changes:** Yes  
**Architecture change:** Additive session layer (no R2/Supabase comment schema change required initially)

---

### Phase 4 — Production-ready

**Goal:** Operable at scale for broadcast post-production — monitoring, hardening, compliance, full team workflow, CI proof.

**Exit criteria:**
- Production deploy checklist complete (frontend + backend + TURN)
- Load test: N viewers, M concurrent rooms
- Security review: room join auth, invite tokens, RLS
- Runbook: incident, session stuck, forced stop
- All TS-C01–C06 closed

| Order | Task | Files | APIs | UI | Risks | Dependencies |
|-------|------|-------|------|-----|-------|--------------|
| **4.1** | Authorize `join-video-room` / share events (JWT or session token) | `index.ts` middleware | Socket auth | — | Breaking change | Phase 3 sessions |
| **4.2** | Redis adapter for Socket.io horizontal scale | `index.ts` | — | — | Infra cost | Production hosting |
| **4.3** | Session recording / audit log (optional) | New table or logs | API | Admin view | Storage | 3.1 |
| **4.4** | Forced session end (admin/host) | `index.ts`, API | `POST .../sessions/:id/end` | Host controls | Abuse | 3.2 |
| **4.5** | Marker sync events (optional) | `useLiveComments.ts`, `index.ts` | `marker-navigate` | Scrubber | Complexity | 2.2 |
| **4.6** | Export during live (read-only panel) | `page.tsx` | — | Split view | UX | 2.1 |
| **4.7** | Full E2E: cinema + comment + sync | `e2e/` | — | — | CI stability | 2.x, 3.x |
| **4.8** | Production env verification | Vercel, backend host | Health | — | Misconfigured URL | Ops |
| **4.9** | Client reviewer scoped RLS on `video_comments` | Supabase SQL | PostgREST | — | Migration | Security review |
| **4.10** | Observability — room metrics, WebRTC failures | Backend logging | — | — | PII in logs | — |

**Estimated effort:** 3–6 weeks (after Phase 3)  
**DB changes:** Possible (audit, RLS)  
**Architecture change:** Socket auth + optional Redis — **no** change to R2 media path

---

## 12. Phase dependency graph

```text
Phase 1 (done) ──► Phase 2 Collaboration-ready
                         │
                         ▼
                   Phase 3 Agency-ready
                         │
                         ▼
                   Phase 4 Production-ready
```

**Parallel safe:** 2.4 TURN ops can start during Phase 2 dev. Phase 1 manual verify should complete before Phase 2 merge.

---

## 13. File index (evidence)

| File | Role |
|------|------|
| `rendorax-frontend/utils/reviewRoom.ts` | Room ID + join helper |
| `rendorax-frontend/app/dashboard/page.tsx` | Go Live, WebRTC, cinema gate, `isEditor` |
| `rendorax-frontend/components/TimelineShareWidget.tsx` | Cinema UI |
| `rendorax-frontend/hooks/useLiveComments.ts` | Socket, comments, sync listeners, `jumpToTime` emit |
| `rendorax-frontend/components/dashboard/VideoTimelineScrubber.tsx` | Markers (local) |
| `rendorax-frontend/utils/exportReviewMarkers.ts` | CSV/JSON/XML export |
| `rendorax-frontend/utils/webrtcConfig.ts` | STUN/TURN |
| `rendorax-frontend/components/DashboardHeader.tsx` | Go Live button gate |
| `rendorax-backend/index.ts` | Active Socket.io hub |
| `rendorax-backend/websocket/server.ts` | **Orphan** alternate server |
| `rendorax-backend/prisma/schema.prisma` | Agency models (no ReviewSession) |

---

## 14. Manual verification recommended (before Phase 2 kickoff)

1. **Phase 1 two-browser test** — blueprint §10 (`timeline-sharing-restoration-blueprint.md`).
2. **Room mismatch test** — viewer on different asset → confirm no cinema (documents TS-C06).
3. **Comment during share** — confirm panel absent (documents TS-C01).
4. **Play/pause two-browser** — confirm no sync (documents TS-C02).
5. **Export markers** — CSV/JSON/XML in review mode (confirms no live conflict).

---

**Inspection complete. No code changed. Awaiting approval before Phase 2 implementation.**
