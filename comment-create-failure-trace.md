# Comment Create Failure — Focused Trace

**Inspection date:** 2026-07-03  
**Reported symptom:** Timestamp jump works; existing comments load; **new comment creation fails**. Previously worked before recent fixes.  
**Root cause (confirmed):** `PGRST205` — missing `public.video_comments` in new Supabase project.  
**Resolution:** P0 SQL applied (`supabase-p0-legacy-review-tables.sql`) — **Resolved — manually verified (local dev, 2026-07-03)** — production Supabase not re-tested  
**Scope:** Comment **write** path — inspection + DB fix (no app code changes)  
**Related:** `comment-review-workflow-map.md`, `comment-review-validation-checklist.md`, `legacy-supabase-tables-migration-plan.md`, `r2-processing-gap-trace.md`

**Verification (local, 2026-07-03):** `video_comments` and `video_metadata` tables created; PGRST205 resolved; comment create, persistence, and timestamp jump working; comment scene thumbnails visible.

---

## Executive summary

Comment creation is a **single client-side path**: `CommentsPanel` form → `handleAddComment` → Supabase `insert` on `video_comments`. There is **no** Next.js API route for writes.

**Read path works** → `previewFile.name`, Supabase `SELECT`, auth session, and `videoRef` for seek are all functional.

**Write path can fail silently** in application code: textarea clears on submit **before** insert completes; failures only log to `console.error` with **no UI feedback**. A **successful insert with empty `.select()`** (common RLS pattern) also produces **no list update** and no error.

**Recent fixes (QA-001, QA-002, R2 processing-gap)** do **not** modify `useLiveComments`, `CommentsPanel`, or `previewFile.name`. The processing-gap change **indirectly** increases dashboard re-renders (playback URL updates, 8s processing poll) but does not change insert payload or guards.

**Most likely failure layer (ranked):**

| Rank | Layer | Failure mode |
|------|-------|----------------|
| 1 | **Supabase RLS / schema** | `INSERT` denied or row not returned on `.select()` — read policy still allows old rows |
| 2 | **Frontend silent handling** | Error logged only; or `data.length === 0` with no error — user sees cleared textarea, no comment |
| 3 | **Early-return guard** | `!videoRef.current` — **unlikely** if timestamp jump works on same preview |
| 4 | **`previewFile.name` undefined** | **Unlikely** if fetch by same key shows existing comments |

**Cannot confirm exact runtime failure point without DevTools Network + Console during one failed submit** — see §5 diagnostic steps.

---

## 1. Exact comment creation flow

```
User types in CommentsPanel textarea (newComment state)
        ↓
User clicks "Post Comment" (type=submit)
        ↓
<form onSubmit={handleAddComment}>   [CommentsPanel.tsx:132]
        ↓
handleAddComment(e)                  [useLiveComments.ts:156]
  e.preventDefault()
        ↓
GUARD (silent return if any fail):    [line 158]
  newComment.trim()
  previewFile
  videoRef.current
  user
        ↓
setNewComment("")                    [line 161] ← textarea cleared BEFORE insert
currentTime = videoRef.current.currentTime
videoRef.current.pause()
        ↓
supabase.from("video_comments").insert([{
  file_name: previewFile.name,
  user_id: user.id,
  time_stamp: currentTime,
  comment_text: commentTextToSend,
}]).select()
        ↓
SUCCESS branch (line 176):
  data.length > 0 → setComments(sorted append)
  optional socket.emit("new-comment", ...)
        ↓
FAILURE branch (line 187):
  error → console.error("Supabase insert error:", error)
  NO else branch for: !error && (!data || data.length === 0)
```

### Component wiring

| Step | File | Detail |
|------|------|--------|
| Form | `components/CommentsPanel.tsx` | `disabled={playerControlsDisabled}` on textarea + submit |
| Submit handler | `hooks/useLiveComments.ts` | `handleAddComment` — not memoized |
| Hook init | `app/dashboard/page.tsx:292` | `useLiveComments(user, previewFile, videoRef, currentFolder)` |
| Disabled gate | `page.tsx:1062` | `playerControlsDisabled = !previewFile?.isVideo` |

### Required fields for insert

| Field | Source | Required in code? |
|-------|--------|-------------------|
| `file_name` | `previewFile.name` | Yes — no fallback |
| `user_id` | `user.id` | Yes — guard checks `user` |
| `time_stamp` | `videoRef.current.currentTime` | Yes — not validated (can be `0`, `NaN` if media broken) |
| `comment_text` | trimmed textarea | Yes — guard `newComment.trim()` |
| `id` | DB default | Not sent |

---

## 2. Failure point analysis

### Branch A — Guard silent return (line 158)

```typescript
if (!newComment.trim() || !previewFile || !videoRef.current || !user)
  return;
```

| Guard | Likely if symptom is… | Notes |
|-------|----------------------|-------|
| `!newComment.trim()` | Submit button disabled anyway | Button `disabled={disabled \|\| !newComment.trim()}` |
| `!previewFile` | No video / panel disabled | Conflicts with “existing comments read” |
| `!videoRef.current` | Submit does nothing, **no** network request | **Conflicts with timestamp jump** unless jump tested on different surface |
| `!user` | No network request | Conflicts with authenticated read |

**Verdict:** Low probability **if** timestamp jump and comment list work on the **same** dashboard preview session.

**Edge case:** `videoRef.current` null at submit but set when clicking comment timestamp (timing after player remount). Possible during MP4→HLS URL swap (processing-gap); retest submit **after** playback stable.

---

### Branch B — Supabase insert error (line 165–187)

```typescript
const { data, error } = await supabase.from("video_comments").insert([...]).select();
if (!error && data && data.length > 0) { /* update UI */ }
else if (error) console.error("Supabase insert error:", error);
```

| Outcome | UI behavior | Console | Network |
|---------|-------------|---------|---------|
| `error` set (403, 401, 23502, etc.) | Textarea **already cleared**; no new row | `Supabase insert error:` + object | `POST .../video_comments` **4xx/5xx** |
| `error` null, `data` **[]** | Same silent failure | **Nothing** | **201** with empty body or `[]` |
| Success | Comment appears | — | **201** with row JSON |

**Verdict:** **Highest-probability code-level failure surface** — especially **silent empty `data`** after insert (RLS `SELECT` on new row blocked).

**Read works + write fails** strongly suggests **asymmetric RLS** (SELECT allowed on existing rows, INSERT denied or RETURNING blocked).

---

### Branch C — Refetch overwrites optimistic UI (secondary)

```typescript
const supabase = createClient(); // new instance every hook render
const fetchComments = useCallback(..., [supabase]);
useEffect(() => { void fetchComments(previewFile.name); }, [previewFile?.name, previewFile?.isVideo, fetchComments]);
```

- `createClient()` runs **every render** → `fetchComments` identity changes → effect may re-run on **any** parent re-render (e.g. processing poll, URL sync from R2 fix).
- Does **not** block insert; can **race** UI update if insert succeeds but refetch runs before row visible.
- **Does not explain** persistence failure after **full page reload** if insert never committed.

**Verdict:** UX/race contributor, not root cause if reload also missing new comment.

---

### Branch D — `previewFile.name` / Cloud vs Vault

| Bin | `previewFile.name` at insert |
|-----|------------------------------|
| Cloud | `asset.fileName` |
| Vault | `displayName` (strip `{timestamp}_` prefix) |

For current R2 assets both equal `MediaAsset.fileName`. **Fetch and insert use the same `previewFile.name`** — if old comments load, name is valid and consistent.

**`previewFile.name` undefined?** Not in normal paths; would insert `file_name: undefined` or skip type safety. Would **not** explain loading existing rows keyed to a real name unless old rows used a different key (then new insert uses correct key but appears “missing” when comparing to wrong expectation).

**Playback URL changes:** `buildPreviewPlayerKey` includes URL → player remount on MP4→HLS. Does **not** change `previewFile.name` or insert payload. **No direct identity break.**

---

## 3. Dependency on recent fixes

| Change | Touches comment write? | Indirect effect |
|--------|------------------------|-----------------|
| **QA-001** (async transcode enqueue) | **No** | Backend only |
| **QA-002** (cloud list refresh) | **No** | More `cloudAssets` updates → more re-renders |
| **R2 processing-gap** (`getMediaPlaybackUrl` mezzanine fallback) | **No** | Non-empty `previewPlaybackUrl` sooner; `CloudAssetGallery` URL sync runs; `useMediaProcessingPoll` may keep polling while `processingStatus` active → **more frequent re-renders** |

**Conclusion:** No line-level regression in comment create code from these fixes. Correlation in time may be **environment** (Supabase RLS migration), **testing on processing asset** (player remount), or **increased re-render noise** — not a direct code break in insert logic.

---

## 4. Browser console errors to expect

| Scenario | Console output |
|----------|----------------|
| RLS insert denied | `Supabase insert error:` `{ code: "42501", message: "new row violates row-level security policy..." }` |
| Not authenticated | `401` / JWT error on insert |
| Missing table | `42P01` / relation does not exist |
| NOT NULL violation | `23502` + column name |
| Guard early return | **None** |
| Insert OK, empty `.select()` | **None** |
| Invalid `time_stamp` (NaN) | Possible `22P02` or constraint error |

**Also check:** No `Supabase insert error` but textarea clears → inspect Network response body (§5).

---

## 5. Network requests involved

On **Post Comment** (if guard passes):

| Request | Method | URL pattern | Success | Failure |
|---------|--------|-------------|---------|---------|
| Comment insert | `POST` | `{SUPABASE_URL}/rest/v1/video_comments?select=*` | **201** + JSON array with row | **401/403/4xx** |
| (Parallel) Comment fetch | `GET` | `.../video_comments?file_name=eq.{name}&order=time_stamp.asc` | **200** | May re-fire on re-renders |

**Headers:** `apikey`, `Authorization: Bearer <user_jwt>`, `Prefer: return=representation`

**Diagnosis checklist (run once during failed submit):**

1. Does `POST video_comments` appear?
   - **No** → guard failed (`videoRef`, `user`, etc.) — breakpoint line 158
   - **Yes** → note status + response body
2. Status **403** → RLS INSERT policy
3. Status **201** + `[]` → RLS blocks `RETURNING` / `.select()`
4. Status **201** + row → frontend state race; check immediate `GET` overwrite
5. After fail, hard reload + reopen video — is row in Supabase Table Editor?

---

## 6. Layer classification

| Layer | Read works | Write broken | Fits? |
|-------|------------|--------------|-------|
| **Frontend guard** | ✓ | Only if `videoRef` null at submit | Unlikely |
| **Frontend silent error handling** | ✓ | Hides Supabase errors from user | **Always** (UX) |
| **Supabase RLS INSERT** | ✓ | SELECT ≠ INSERT permissions | **Most likely** |
| **Supabase schema** | ✓ | NOT NULL / FK on insert only | Possible |
| **Data mapping (`file_name`)** | ✓ | Same key for read/write | Unlikely |
| **QA/R2 playback fixes** | — | No code path change | **Unlikely direct cause** |

---

## 7. Answers to specific inspection questions

| Question | Answer |
|----------|--------|
| Could `previewFile.name` be undefined? | **Rare**; existing comments loading implies a stable string key. Not guarded explicitly. |
| Could playback URL changes affect comment identity? | **No** — identity is `previewFile.name`, not URL. URL changes remount player only. |
| Could insert silently fail? | **Yes** — empty `data` with no `error`; or `error` only in console; textarea always clears. |
| Missing error handling? | **Yes** — no toast/alert; no `else` for empty success; text cleared before confirm. |
| Is insert error hidden? | **From user yes** (console only); visible in DevTools Network tab. |

---

## 8. Minimal safe fix proposal (do not implement yet)

Apply in order after §5 confirms root cause:

### If Network shows 403 / RLS on INSERT

**Fix:** Supabase dashboard — add policy on `video_comments`:

- `INSERT` for `authenticated` where `user_id = auth.uid()`
- Ensure `SELECT` includes `auth.uid() = user_id` OR project-scoped rule matching product intent

**Scope:** Supabase only — no frontend deploy required.

### If Network shows 201 + row but UI empty

**Fix (frontend, minimal):**

1. After insert, if `data.length === 0`, call `fetchComments(previewFile.name)` once.
2. Move `setNewComment("")` to **after** confirmed success.

**File:** `hooks/useLiveComments.ts` — `handleAddComment` only.

### If guard / `videoRef` timing

**Fix (frontend, minimal):**

1. On failed guard, optional `console.warn` with which clause failed (dev only).
2. Or allow `time_stamp: 0` fallback when `videoRef.current` missing (only if product accepts) — **not recommended** if jump requires ref.

### If silent UX regardless

**Fix (frontend, minimal):**

```typescript
// Pseudocode — not implemented
if (error) { showToast(error.message); restore draft text }
else if (!data?.length) { showToast("Comment could not be saved"); restore draft }
```

**File:** `hooks/useLiveComments.ts` + small toast utility if one exists.

### Stabilize refetch (optional, separate)

Memoize Supabase client (`useMemo(() => createClient(), [])`) to stop `fetchComments` effect firing every parent re-render — reduces race noise after R2 URL polling.

---

## 9. Recommended next step before any fix

1. Reproduce one failed **Post Comment** with DevTools open.
2. Record **Network** `POST video_comments` status + response body.
3. Record **Console** for `Supabase insert error`.
4. Check Supabase **Table Editor** for row after failed submit + page reload.
5. Fill **Actual Result** on TC-1.1 in `comment-review-validation-checklist.md`.

| Network result | Action |
|----------------|--------|
| No POST | Investigate guard / `videoRef` |
| POST 403 | Fix RLS INSERT |
| POST 201 + `[]` | Fix RLS `SELECT` on insert **or** refetch after insert |
| POST 201 + row, UI empty | Refetch race / `setComments` bug |
| POST 201 + row in DB after reload, UI empty on submit | Frontend success branch only |

---

## Key code references

```156:188:rendorax-frontend/hooks/useLiveComments.ts
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !previewFile || !videoRef.current || !user)
      return;
    const commentTextToSend = newComment.trim();
    setNewComment("");
    const currentTime = videoRef.current.currentTime;
    videoRef.current.pause();

    const { data, error } = await supabase
      .from("video_comments")
      .insert([{ file_name: previewFile.name, user_id: user.id, time_stamp: currentTime, comment_text: commentTextToSend }])
      .select();
    if (!error && data && data.length > 0) { /* ... */ }
    else if (error) console.error("Supabase insert error:", error);
  };
```

```131:156:rendorax-frontend/components/CommentsPanel.tsx
        <form onSubmit={handleAddComment} className="p-4">
          ...
          <button type="submit" disabled={disabled || !newComment.trim()}>
            Post Comment
          </button>
```

```947:955:rendorax-frontend/app/dashboard/page.tsx
      setPreviewFile({
        name: asset.fileName,
        url: playbackUrl,
        ...
      });
```

```778:786:rendorax-frontend/app/dashboard/page.tsx
    setPreviewFile({
      name: displayName,
      url,
      ...
    });
```

---

## Approval gate

| Step | Status |
|------|--------|
| Inspection | ✅ Complete |
| Root cause | ✅ Missing `video_comments` / `video_metadata` — PGRST205 |
| Fix | ✅ P0 SQL (`supabase-p0-legacy-review-tables.sql`) — tables + RLS |
| Manual verification | ✅ **Resolved — manually verified (local, 2026-07-03)** |

### Manual verification (local, 2026-07-03)

- `video_comments` table created
- `video_metadata` table created
- PGRST205 resolved
- Comment creation working
- Comment persistence working
- Timestamp comments working
- Comment scene thumbnails visible

**No application code was modified for this resolution.**
