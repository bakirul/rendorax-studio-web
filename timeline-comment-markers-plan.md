# Timeline Comment Markers — Inspection & Minimal Implementation Plan

**Created:** 2026-07-03  
**Updated:** 2026-07-03 (Phase 1 **Resolved — manually verified (local, 2026-07-03)**)  
**Type:** Inspection + Phase 1 implementation record  
**Goal:** Smallest safe way to render existing `video_comments.time_stamp` values as markers on the dashboard video scrubber.

---

## Implementation status (Phase 1 — 2026-07-03)

| Item | Status |
|------|--------|
| Optional `comments` + `onMarkerClick` props | **Implemented** |
| Gold marker ticks at `(time_stamp / duration) * 100%` | **Implemented** |
| Hidden until `duration > 0` | **Implemented** |
| Tooltip: `MM:SS — truncated comment text` | **Implemented** |
| Marker click → `jumpToTime` (seek + play + socket) | **Implemented** |
| Scrubber drag unchanged | **Implemented** |
| `npm run build` | **Passed** |
| Manual verify local | **Resolved — manually verified (2026-07-03)** |
| Production verify | **Pending §14** |

**Files changed:** `components/dashboard/VideoTimelineScrubber.tsx`, `app/dashboard/page.tsx`

---
- `video_comments.time_stamp` (`double precision`, seconds)
- Video duration from `HTMLVideoElement.duration` (already tracked in scrubber)
- `VideoTimelineScrubber` component
- `jumpToTime` from `useLiveComments` (seek + play + socket sync)

---

## 1. Files involved

| File | Role today | Change scope (future) |
|------|------------|------------------------|
| `rendorax-frontend/components/dashboard/VideoTimelineScrubber.tsx` | Range scrubber; local seek only | **Primary** — marker overlay + optional `onMarkerClick` |
| `rendorax-frontend/app/dashboard/page.tsx` | Mounts scrubber; owns `comments`, `jumpToTime` | Pass `comments` + `jumpToTime` into scrubber |
| `rendorax-frontend/hooks/useLiveComments.ts` | Loads comments; defines `jumpToTime` | **No change required** (reuse callback) |
| `rendorax-frontend/utils/commentAuthor.ts` | `VideoCommentRow` type | Optional: tooltip label via `getCommentDisplayName` |
| `rendorax-frontend/components/CommentsPanel.tsx` | Timecode buttons → `jumpToTime` | **No change** — parallel entry point |
| `rendorax-frontend/app/globals.css` | `.video-timeline-scrubber` styles | Optional: `.timeline-comment-marker` class |
| `supabase-p0-legacy-review-tables.sql` | `video_comments` schema | **No change** |
| `rendorax-frontend/app/admin/page.tsx` | Admin `jumpToTime`; **no** scrubber | Out of scope for minimal plan |

**Not in scope (inspection):**
- Cinema / timeline screen share layout (`isLiveStreaming` hides scrubber) — see `timeline-sharing-regression-report.md`
- Compare mode second player (markers target main `videoRef` only — matches comment `file_name` on `previewFile`)

---

## 2. Current scrubber architecture

### Component structure

```102:136:rendorax-frontend/components/dashboard/VideoTimelineScrubber.tsx
  return (
    <div className="...">
      <div className="mb-2 flex ...">  {/* current / duration clock */}
      <input
        type="range"
        ...
        className="video-timeline-scrubber w-full"
        style={{ ["--scrub-progress" as string]: `${progress}%` }}
      />
    </div>
  );
```

| Aspect | Behavior |
|--------|----------|
| **Duration source** | `videoRef.current.duration` via `loadedmetadata`, `durationchange`, `timeupdate` |
| **Current time** | Synced from video; paused updates while scrubbing (`isScrubbingRef`) |
| **Seek** | `seekTo()` sets `video.currentTime` only — **no** Socket.io |
| **Reset on asset change** | `mediaKey` prop resets duration/time to 0 |
| **Disabled** | When `disabled={true}` — dashboard passes `playerControlsDisabled` (= `!previewFile?.isVideo`) |
| **Styling** | Native range + CSS gradient `--scrub-progress` in `globals.css` (6px track, gold thumb) |

### Dashboard wiring

```1655:1664:rendorax-frontend/app/dashboard/page.tsx
                          <VideoTimelineScrubber
                            videoRef={videoRef}
                            disabled={playerControlsDisabled}
                            mediaKey={
                              previewFile?.publicUrl ??
                              previewFile?.url ??
                              ""
                            }
                          />
```

- `videoRef` → main `StreamingVideoPlayer` element (not compare column).
- `comments` live in same page via `useLiveComments` but are **not** passed to scrubber today.

### Existing jump-to-comment behavior

```327:336:rendorax-frontend/hooks/useLiveComments.ts
  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      if (socket && previewFile?.name) {
        socket.emit("video-seek", { room: previewFile.name, currentTime: time });
        socket.emit("video-play", { room: previewFile.name, currentTime: time });
      }
    }
  };
```

Comments panel uses the same callback on timecode click (`CommentsPanel.tsx` L89).

**Important:** Scrubber’s internal `seekTo` does **not** match `jumpToTime` (no play, no socket). Markers should call **`jumpToTime`**, not `seekTo`.

---

## 3. Comment data shape (marker inputs)

From `VideoCommentRow` / `video_comments`:

| Field | Use for markers |
|-------|-----------------|
| `id` | React key; disambiguate overlaps |
| `time_stamp` | Position: `(time_stamp / duration) * 100%` |
| `comment_text` | Tooltip / `aria-label` (truncated) |
| `author_display_name` | Optional tooltip enrichment |

Comments are already:
- Fetched ordered by `time_stamp` ascending (`useLiveComments.fetchComments`)
- Scoped to `previewFile.name` (same asset as scrubber’s video)
- Updated live via socket `comment-added` + local insert

**No new tables or APIs required.**

---

## 4. Marker rendering approach (recommended)

### Pattern: overlay on range track

Native `<input type="range">` cannot host child DOM nodes inside the track. **Smallest safe pattern:**

1. Wrap the range in `position: relative` container (same width as today).
2. Add a **marker rail** `position: absolute; left: 0; right: 0; top: [aligned to 6px track]; height: 6px; pointer-events: none` on the container.
3. For each comment, render a **clickable tick**:
   - `left: ${(time_stamp / duration) * 100}%`
   - `transform: translateX(-50%)`
   - `pointer-events: auto` on the tick only
   - Visual: 2–3px wide gold/red vertical bar above track (Premiere-style dot)

4. Hide markers when `disabled`, `duration <= 0`, or `!Number.isFinite(duration)`.

### Position formula

```ts
const percent = Math.min(100, Math.max(0, (comment.time_stamp / duration) * 100));
```

Clamp `time_stamp` to `[0, duration]` if slightly past end (floating point / short edits).

### Overlapping comments

Multiple rows at same `time_stamp` → **single tick** with `title` listing count, or stack with 1px horizontal offset. Minimal approach: **one tick per comment** (may visually merge if &lt; ~0.5% apart).

### Live updates

Pass `comments` array from parent; scrubber re-renders when `comments` or `duration` changes. No scrubber-internal fetch.

### Optional props (minimal API)

```ts
interface VideoTimelineScrubberProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  disabled?: boolean;
  mediaKey?: string;
  comments?: ReadonlyArray<Pick<VideoCommentRow, "id" | "time_stamp" | "comment_text" | "author_display_name">>;
  onMarkerClick?: (timeSeconds: number) => void;
}
```

Parent wiring:

```tsx
<VideoTimelineScrubber
  videoRef={videoRef}
  disabled={playerControlsDisabled}
  mediaKey={...}
  comments={comments}
  onMarkerClick={jumpToTime}
/>
```

**Single file component change + one callsite** (`page.tsx`) — smallest diff.

---

## 5. Click behavior

| Action | Behavior |
|--------|----------|
| **Marker click** | `onMarkerClick(comment.time_stamp)` → `jumpToTime` |
| **Effect** | Seek main player, play, emit `video-seek` + `video-play` to room |
| **Scrubber drag** | Unchanged — still uses internal `seekTo` (no socket today) |
| **Keyboard** | Optional later: marker buttons `type="button"` with `aria-label` |

**Do not** duplicate seek logic inside scrubber beyond delegating to `onMarkerClick`.

Tooltip: `title={`${formatClock(time_stamp)} — ${truncatedText}`}` on marker button.

---

## 6. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `duration === 0` until metadata | **Medium** | Hide markers until `duration > 0`; same gate as range `max` |
| HLS / live edge duration | **Low–Medium** | If `duration` is `Infinity`, skip markers (scrubber already uses `duration > 0` check) |
| Marker click vs range drag | **Low** | `stopPropagation` on marker `pointerdown`; adequate hit target (min 12×12px) |
| Comments past video end | **Low** | Clamp percent to 100% |
| Compare mode | **Low** | Comments bind to `previewFile`; scrubber binds to main `videoRef` — consistent |
| Cinema mode | **N/A** | Scrubber unmounted when `isLiveStreaming` — markers unavailable during screen share |
| Socket desync on scrub drag | **Pre-existing** | Not introduced by markers; marker path reuses fixed `jumpToTime` |
| Many comments (50+) | **Low** | DOM ticks still fine; optional cap or cluster in later phase |
| Admin portal | **N/A** | No scrubber there today |

---

## 7. Minimal implementation plan

### Phase 0 — Inspection (complete)

This document. No code.

### Phase 1 — Dashboard markers only

| Step | Task | Status |
|------|------|--------|
| 1 | Add optional `comments` + `onMarkerClick` props | **Done** |
| 2 | Marker rail + tick buttons over range | **Done** |
| 3 | Pass `comments` and `jumpToTime` | **Done** |
| 4 | Manual verify local | **Resolved — manually verified (2026-07-03)** |
| 5 | `npm run build` | **Done** |

**Out of scope Phase 1:** admin scrubber, socket on manual scrub, marker clustering, selected-comment highlight.

### Phase 2 — Polish (optional)

- Highlight tick nearest `currentTime` during playback
- `getCommentDisplayName` in tooltip
- Selected comment scroll sync from sidebar hover
- Emit socket on scrubber `seekTo` (separate from markers)

### Phase 3 — Admin (optional)

- Reuse `VideoTimelineScrubber` on `/admin` preview with `clientComments` + local `jumpToTime` (no socket)

---

## 8. Manual verification steps (after implementation)

1. Open dashboard → vault or cloud **video** preview.
2. Add 2+ comments at different timecodes.
3. Confirm gold ticks appear on scrubber after video metadata loads (duration &gt; 0).
4. Click tick → playhead jumps, video plays, comments panel time matches.
5. Open second browser (same asset) → click marker → peer receives `video-seek` / `video-play` (existing socket behavior).
6. Switch asset → markers clear and repopulate for new file.
7. Non-video preview → scrubber disabled, no markers.

**Production:** repeat after deploy — pending §14 checklist.

---

## 9. Local vs production

| Item | Local | Production |
|------|-------|------------|
| Comment data (`video_comments`) | Verified P0 SQL | Pending §14 |
| Scrubber component | Present | Same code path |
| Comment markers | **Resolved — manually verified (local, 2026-07-03)** | Pending §14 |
| `jumpToTime` socket sync | Works if backend :4000 up | Unknown |

---

## Related documents

- `timeline-sharing-regression-report.md` — scrubber hidden in cinema mode
- `comment-review-workflow-map.md` — `jumpToTime` + socket
- `comment-author-avatar-plan.md` — `VideoCommentRow`
- `review-collaboration-layer-map.md` §7 — marker feasibility note

---

*End of plan. Phase 1 **Resolved — manually verified (local, 2026-07-03):** gold ticks at comment timestamps; tooltip; click → `jumpToTime`; scrubber drag unchanged. Production verification pending §14.*
