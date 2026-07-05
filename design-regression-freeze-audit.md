# Design / UI Regression Freeze + Recovery Audit

**Created:** 2026-07-04  
**Status:** **FEATURE WORK FROZEN** — pending operator review of recovery plan  
**Type:** Inspection only — no implementation, no refactor, no deploy, no migrations, no WP2+

**Trigger:** Recent operations/admin work may have degraded visual structure and UX consistency across `/dashboard` and `/admin`.

**Related:** `admin-hq-design-regression-report.md`, `admin-hq-initialization-hang-trace.md`, `admin-hq-asset-loading-trace.md`, `timeline-sharing-production-readiness.md`, `operations-core-wp1-report.md`

---

## Executive summary

| Surface | Visual regression from recent ops work? | Functional regression? | Verdict |
|---------|----------------------------------------|------------------------|---------|
| **`/dashboard`** | **No material CSS/layout diff** in uncommitted changes | Timeline share socket logic changed (behavior, not chrome) | **Stable shell** — pre-existing cinema-mode gaps remain |
| **`/admin`** | **Improved** (dark background) + **layout shifts** (embedded comm strip, no full-page spinner) | Client discovery + asset loading issues persist | **Mixed** — theme fixed; comm placement + loading UX need QA |
| **Global widgets** | Admin: duplicate float suppressed, embedded copies added | Dashboard/marketing: unchanged | **Intentional admin change** — verify embedded placement |
| **Operations WP1** | **No UI impact** | None | **Confirmed isolated** |

**Freeze scope:** All feature work (WP2+, operations UI, timeline Phase 2, admin ops wiring) **stopped** until this plan is reviewed and recovery QA passes.

**Primary finding:** The **white admin page** was a **pre-existing** defect (missing `bg-bg-body`), not caused by client discovery or WP1. **Uncommitted admin fixes address it.** Remaining risks are **communication widget placement**, **perceived slow loading**, and **empty asset panel** (functional trace, not theme).

---

## 1. Dashboard visual structure (`/dashboard`)

### 1.1 Shell (committed baseline + inspection)

| Region | File | Classes / pattern | Status |
|--------|------|-------------------|--------|
| Root `<main>` | `app/dashboard/page.tsx` ~L1218 | `h-screen w-full bg-[#050505] text-gray-300 font-sans flex flex-col overflow-hidden` | **Intact** |
| Header | `DashboardHeader` | `bg-[#050505] border-b border-white/5` | **Intact** |
| Workspace | `#main-workspace-container` | `flex flex-1 overflow-hidden` | **Intact** |
| Vault sidebar | `VaultSidebar` | `bg-[#0a0a0f] border-r`; footer embeds `GlobalLiveWidget` | **Intact** |
| Player area | Preview section | `bg-[#050505]`, compare split when `isCompareMode` | **Intact** |
| Comments panel | `CommentsPanel` ~L1816 | Right sidebar `bg-[#121217]`, resizable | **Intact** in normal review mode |
| Compare mode | ~L1453–1658 | Gated by `flags?.enable_compare_mode` | **Intact** (committed earlier) |
| Timeline markers / export | ~L1581 `Export Markers` | `handleExportMarkers` via `useLiveComments` | **Intact** in normal review mode |

### 1.2 Uncommitted changes affecting dashboard

**File:** `app/dashboard/page.tsx` (+28 lines in diff)

| Change | Visual impact | Functional impact |
|--------|---------------|-------------------|
| `getReviewRoomId` / `emitJoinReviewRoom` for timeline share | **None** | Socket room IDs unified (`reviewRoom.ts`) |
| `admin-started-timeline-share` handler guards | **None** | Ignores self-events; room ID match |
| `useEffect` deps include `previewFile?.assetId` | **None** | Listener rebind on asset change |

**Also:** `hooks/useLiveComments.ts` — review room join + `new-comment` `fileId` uses `reviewRoomId` instead of raw `fileName`. **No CSS changes.**

**Verdict:** Dashboard **visual structure not degraded** by recent uncommitted work.

### 1.3 Pre-existing dashboard UX gaps (not from ops work)

| ID | Issue | File | Risk | Revert? |
|----|-------|------|------|---------|
| **DR-D01** | Cinema mode (`isLiveStreaming`) **replaces entire workspace** — comments, compare, export **unmounted** | `dashboard/page.tsx` L1247–1248 | **High** (live review) | **No** — separate timeline Phase 2 track (`timeline-sharing-production-readiness.md` TS-C01) |
| **DR-D02** | Global `ChatbotWidget` floats `fixed bottom-6 right-6` on dashboard (in addition to sidebar live tools) | `layout.tsx`, `ChatbotWidget.tsx` | **Low** (overlap clutter) | **Optional** — hide float on dashboard when sidebar embed exists |
| **DR-D03** | `body` has no global dark bg — only page-level | `app/layout.tsx` | **Low** on dashboard (has own bg) | **No** for dashboard-only fix |

---

## 2. Admin visual structure (`/admin`)

### 2.1 Committed baseline (HEAD)

| Element | State |
|---------|-------|
| Root `<main>` | **No** `bg-bg-body` — white canvas |
| Loading | Full-page spinner gate (`Initializing HQ Command...`) |
| Client list | Supabase Storage `client-vault` folders |
| Global widgets | Root layout float **on top of** admin (duplicate clutter) |

### 2.2 Uncommitted changes (working tree — not merged)

**Source:** `git diff HEAD -- rendorax-frontend/app/admin/page.tsx` (+103 lines)

| Change | Visual / UX effect |
|--------|-------------------|
| **`bg-bg-body text-text-gray font-main`** on `<main>` | **Fixes white background** (Fix A) |
| **Removed** full-page `loading` spinner gate | Page renders immediately; sidebar shows **"Scanning directories..."** |
| **`clientsLoading`** inline state in sidebar | Perceived slow load up to **10s** timeout |
| **Client keys** `client.userId` vs `client.name` | Same sidebar layout; data source changed |
| **HQ Communications** footer in sidebar | `<GlobalLiveWidget isEmbedded={true} />` |
| **Header** `<ChatbotWidget isEmbedded />` | Compact AI launcher beside status line |

### 2.3 Panel inventory (current uncommitted)

| Panel | Classes | Status |
|-------|---------|--------|
| Vault Directories | `bg-bg-panel border-white/5` + comm footer | **Dark** — footer adds height |
| Project Phase | `bg-bg-panel` | **Unchanged styling** |
| Billing | `bg-bg-panel` | **Unchanged styling** |
| Brief | `bg-bg-panel` (conditional) | Hidden when no legacy brief row |
| Vault Assets | `bg-bg-panel` | **Unchanged styling** |
| Preview modal | `bg-bg-panel` / `bg-bg-body` | **Unchanged styling** |

### 2.4 Admin regressions / risks

| ID | Symptom | File | Likely cause | Risk | Minimal fix | Revert? |
|----|---------|------|--------------|------|-------------|---------|
| **DR-A01** | White page background | `admin/page.tsx` (HEAD) | Missing `bg-bg-body` on `<main>` | **High** (visual) | **Keep** uncommitted Fix A | **Do not revert** Fix A |
| **DR-A02** | Global widgets overlapping admin panels | `layout.tsx` + widgets (HEAD) | Root float on all routes | **Medium** | **Keep** `isAdmin && !isEmbedded → null` + embedded copies | **Do not revert** suppression; **do not** revert to blanket hide (broke comm) |
| **DR-A03** | Communication tools “missing” (intermediate Fix B) | `GlobalLiveWidget.tsx`, `ChatbotWidget.tsx` | Blanket `/admin` return null | **High** | **Already replaced** with embedded pattern | **N/A** if uncommitted comm recovery kept |
| **DR-A04** | HQ feels slow on first load | `admin/page.tsx` | `fetchMediaClients` up to 10s; widgets still auth+socket on mount | **Medium** | Inline sidebar loading only (done); optional reduce timeout / cache | **Do not** restore full-page spinner without operator approval |
| **DR-A05** | Vault Assets empty while clients listed | `admin/page.tsx` `fetchClientData` | Silent catch → `setClientAssets([])` | **High** (functional) | See `admin-hq-asset-loading-trace.md` | **Separate fix** — not a theme regression |
| **DR-A06** | Admin layout “detached” vs dashboard | `admin/page.tsx` | `max-w-7xl` marketing column vs full-bleed dashboard | **Low** (design debt) | Optional admin chrome only — **not required for recovery** | **No** |
| **DR-A07** | Embedded comm strip cramped on narrow sidebar | `admin/page.tsx` L355–360 | Footer inside `lg:col-span-1` column | **Low–Medium** | Tune padding / move to header bar per design report §11.4 | **No revert** — placement tune only |
| **DR-A08** | AI panel opens `top-24 right-6` when embedded | `ChatbotWidget.tsx` L170–174 | Embedded window positioning | **Low** | Adjust embedded `getWindowClassName` for admin | **No** |

---

## 3. Global layout and widgets

### 3.1 `app/layout.tsx`

```54:65:rendorax-frontend/app/layout.tsx
      <body className={`${manrope.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <GoogleAnalytics ... />
        <ChatbotWidget />
        <GlobalLiveWidget />
      </body>
```

| Property | Value |
|----------|-------|
| Page background | **Not set** on `<body>` |
| Route branching | **None** |
| Admin layout | **No** `app/admin/layout.tsx` |

### 3.2 `GlobalLiveWidget.tsx` (uncommitted)

| Route | Root instance (`layout`) | Embedded instance |
|-------|--------------------------|-------------------|
| `/dashboard` | Fixed bottom-left (mobile); desktop uses sidebar embed | `VaultSidebar` footer |
| `/admin` | **`return null`** | Admin sidebar **HQ Communications** |
| Other routes | Fixed bottom-left + `LiveSessionToolbar` | — |

### 3.3 `ChatbotWidget.tsx` (uncommitted)

| Route | Root instance | Embedded |
|-------|---------------|----------|
| `/admin` | **`return null`** | Header row launcher |
| Other routes | Fixed bottom-right float | — |

### 3.4 Design tokens

**File:** `tailwind.config.ts` — `bg-body: #050505`, `bg-panel: #0a0a0a`, gold palette.

Dashboard uses **hardcoded** `#050505` / `#121217` in places; admin uses **token** classes (`bg-bg-body`, `bg-bg-panel`). **Visual parity is close but not identical** — pre-existing inconsistency.

---

## 4. Recent change inventory (UI relevance)

| Change area | Committed? | UI impact | Notes |
|-------------|------------|-----------|-------|
| Compare workflow fixes | **Yes** (prior commits) | Player layout when compare on | Stabilized — no revert |
| Timeline markers + export | **Yes** | Export button in player chrome | Stabilized — no revert |
| Premiere XML export | **Yes** | None | |
| Admin client discovery | **Uncommitted** | Sidebar data + loading copy | No panel CSS change |
| Admin init / loading | **Uncommitted** | Removes full-page spinner | UX tradeoff |
| Admin comm recovery | **Uncommitted** | Embedded widgets + suppress float | **Required** per operator |
| Admin Fix A (dark bg) | **Uncommitted** | **Fixes white page** | Keep |
| `reviewRoom.ts` + dashboard/comments socket | **Uncommitted** | **None** (behavior) | |
| `fetchMediaClients` API | **Uncommitted** | None directly | Backend route only |
| **Operations WP1** schema | **Uncommitted** (backend) | **None** | Prisma only — confirmed |

---

## 5. Regression register (consolidated)

| ID | Area | Severity | Caused by recent ops? | Action |
|----|------|----------|------------------------|--------|
| DR-A01 | Admin white background | High | Exposed by reaching HQ; **not introduced** by discovery | **Keep Fix A** |
| DR-A02 | Widget overlap on admin | Medium | Pre-existing + layout | **Keep embedded pattern** |
| DR-A03 | Hidden comm tools | High | Intermediate Fix B | **Fixed** in uncommitted — verify manually |
| DR-A04 | Slow admin first paint | Medium | Discovery timeout + hydration | QA; optional timeout tune |
| DR-A05 | Empty Vault Assets | High | Asset fetch error masking | **Separate trace** — not UI freeze blocker |
| DR-A06 | Admin vs dashboard shell mismatch | Low | Architectural | Defer |
| DR-A07 | Cramped comm footer | Low–Med | New embed placement | Tune after QA |
| DR-D01 | Comments gone in cinema mode | High | Pre-existing timeline design | Timeline Phase 2 — **not this recovery** |
| DR-D02 | Duplicate AI float on dashboard | Low | Global layout | Optional polish |
| DR-D03 | No body-level theme | Low | Root layout | Defer global theme |

---

## 6. Safe recovery plan

### Phase 0 — Freeze (now)

- **Stop:** WP2+, operations Admin wiring, new dashboard features, merges of uncommitted admin work until QA sign-off.
- **Allow:** Inspection, manual QA, documentation, checklist updates.
- **WP1 schema:** Complete but **no further backend feature routes** until UI plan approved.

### Phase 1 — Establish visual baseline (operator, ~30 min)

Manual checklist on **local** `npm run dev` with **uncommitted admin changes present**:

| # | Check |
|---|-------|
| 1 | `/dashboard` — dark full-screen shell, sidebar, player, comments column |
| 2 | `/dashboard` — compare toggle, dual player layout |
| 3 | `/dashboard` — Export Markers button visible with preview open |
| 4 | `/dashboard` — scrubber markers (if comments exist) |
| 5 | `/admin` — **dark** page background (not white) |
| 6 | `/admin` — sidebar lists clients after scan |
| 7 | `/admin` — **HQ Communications** shows mic / live session in sidebar footer |
| 8 | `/admin` — **Rendorax AI** launcher in header opens chat |
| 9 | `/admin` — **no** duplicate floating widgets bottom-left/right |
| 10 | Marketing page — widgets still float (sanity) |

Record pass/fail per row before any new feature work.

### Phase 2 — Keep / do not revert

| Item | Reason |
|------|--------|
| Admin `bg-bg-body` (Fix A) | Fixes DR-A01 |
| Embedded `GlobalLiveWidget` + `ChatbotWidget` on admin | Fixes DR-A03; operator requirement |
| Root widget suppress on `/admin` when not embedded | Prevents DR-A02 duplicate float |
| Client discovery via media API | Functional — not visual regression |
| Dashboard `reviewRoom` socket changes | Behavior fix — no visual harm |

### Phase 3 — Targeted fixes (after Phase 1 QA — minimal scope)

| Priority | Fix | File | Effort |
|----------|-----|------|--------|
| P0 | Vault Assets error surfacing + empty-state gate | `admin/page.tsx` | Small — `admin-hq-asset-loading-trace.md` |
| P1 | Tune embedded comm footer spacing / optional header bar | `admin/page.tsx`, widgets | Small |
| P1 | Embedded AI window position on admin | `ChatbotWidget.tsx` | Small |
| P2 | Optional: suppress root `ChatbotWidget` on `/dashboard` (sidebar has live tools) | `ChatbotWidget.tsx` | Tiny |
| **Defer** | Cinema mode comments panel | `dashboard/page.tsx` | Timeline Phase 2 |
| **Defer** | Admin `max-w-7xl` shell redesign | — | Out of scope |

### Phase 4 — Resume feature work (gate)

Resume **only after:**

1. Phase 1 QA documented (pass or accepted known failures).
2. Operator approves recovery plan.
3. DR-A05 fix approved or explicitly deferred.
4. Uncommitted admin UI changes **committed as a single recovery commit** (recommended) before WP2.

---

## 7. Revert guidance (if QA fails badly)

| Scenario | Revert target | Command / action |
|----------|---------------|------------------|
| Admin comm broken | `ChatbotWidget.tsx`, `GlobalLiveWidget.tsx`, `admin/page.tsx` widget sections | `git checkout HEAD --` those hunks only |
| White page returns | Do **not** full revert admin page — restore only `bg-bg-body` classes | Surgical |
| Dashboard timeline broken | `dashboard/page.tsx`, `useLiveComments.ts`, `utils/reviewRoom.ts` | `git checkout HEAD --` those files |
| **Never revert** | WP1 `schema.prisma` for UI reasons | WP1 has zero UI coupling |

---

## 8. Files inspected

| File | Role |
|------|------|
| `rendorax-frontend/app/layout.tsx` | Global widget mount |
| `rendorax-frontend/app/dashboard/page.tsx` | Dashboard shell |
| `rendorax-frontend/app/admin/page.tsx` | Admin HQ |
| `rendorax-frontend/components/GlobalLiveWidget.tsx` | Live session |
| `rendorax-frontend/components/ChatbotWidget.tsx` | AI assistant |
| `rendorax-frontend/components/VaultSidebar.tsx` | Dashboard embed reference |
| `rendorax-frontend/hooks/useLiveComments.ts` | Comments + markers |
| `rendorax-frontend/tailwind.config.ts` | Design tokens |
| `rendorax-backend/prisma/schema.prisma` | WP1 — no UI |

---

## 9. Conclusion

Recent **operations and admin functional work** did **not** break the **dashboard visual system**. The main **visible** admin issue (white background) is **addressed in uncommitted Fix A**. Communication widgets were briefly **hidden** by an intermediate fix and are **restored via embedded placement** in the working tree — **pending manual verify**.

**WP1 Prisma schema changes do not affect UI.**

**Recommendation:** **Freeze features** → run **Phase 1 QA** → apply **Phase 3 P0 asset loading fix** → **commit admin recovery as one unit** → then resume WP2.

---

**Inspection complete. No code changed. Feature work frozen pending operator review.**
