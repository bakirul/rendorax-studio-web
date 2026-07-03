# Comment & Review — Manual Validation Checklist

**Created:** 2026-07-03  
**Purpose:** Verify whether the current comment/review workflow is **usable as-is** before any fixes.  
**Source:** `comment-review-workflow-map.md`  
**Status:** ⏳ Not yet executed

**Do not treat failures as bugs until this checklist is complete.** Record actual behavior; decide fixes only after all P0–P2 cases are run.

---

## Pre-flight (complete before test cases)

| # | Prerequisite | Done? | Notes |
|---|--------------|-------|-------|
| P1 | Frontend running (`npm run dev` or production URL) | ☐ | |
| P2 | Backend running with Socket.io (`rendorax-backend`, `NEXT_PUBLIC_BACKEND_URL` matches) | ☐ | Required for TC-7 realtime only |
| P3 | Logged in as test client user (dashboard `/dashboard`) | ☐ | |
| P4 | At least one **video** asset uploaded (R2/CDN) visible in Cloud bin | ☐ | |
| P5 | Same asset visible in Vault bin (or upload via Upload File) | ☐ | For TC-4 |
| P6 | DevTools open → **Network** tab (filter: `supabase`, `rest/v1`) | ☐ | For failure diagnosis |
| P7 | Confirm `video_comments` table exists in Supabase (Table Editor or SQL) | ☐ | If missing, expect all CRUD tests to fail |
| P8 | Record test asset `MediaAsset.fileName` from API/network: `_______________` | ☐ | Used to interpret Cloud vs Vault keys |

**Tester:** _______________  
**Environment:** ☐ Local dev  ☐ Staging  ☐ Production  
**Date:** _______________  
**Browser(s):** _______________

---

## How to use this document

For each test case, fill in:

| Field | Instruction |
|-------|-------------|
| **Actual Result** | What happened during the test |
| **Pass / Fail** | Pass = matches Expected Result; Fail = any deviation |
| **Notes** | Console errors, Supabase status codes, screenshots refs |

**Suggested order:** TC-1 → TC-2 → TC-3 → TC-4 → TC-5 → TC-6 → TC-7 (optional) → TC-8

---

## 1. Basic comment creation

### TC-1.1 — Open video and add comment at playback position

| | |
|---|---|
| **ID** | TC-1.1 |
| **Priority** | P0 |

**Steps:**
1. Go to dashboard → **Cloud** bin (or Vault if Cloud unavailable).
2. Click a **video** asset to open preview.
3. Confirm video loads in player (MP4 or HLS).
4. Press Play; let playback reach approximately **0:10** (or any non-zero position).
5. In Comments panel, type: `TEST-TC-1.1 basic comment`.
6. Click **Post Comment**.

**Expected Result:**
- Comment appears in the list immediately.
- Timestamp button shows ~`0:10` (minute:second format).
- Comment text matches what was typed.
- Video pauses after posting (insert captures `currentTime` then pauses).
- No console error `Supabase insert error`.
- Network: Supabase `POST` to `video_comments` returns **201** (or 200 with row).

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-1.2 — Comments panel state with video selected

| | |
|---|---|
| **ID** | TC-1.2 |
| **Priority** | P1 |

**Steps:**
1. With video preview open (from TC-1.1), observe Comments panel header and form.
2. Check **Live Sync** indicator (green/red dot).

**Expected Result:**
- Panel is **not** disabled (textarea placeholder: “Leave a comment…”).
- **Post Comment** enabled when text is entered.
- Live Sync shows **Live** (green) if backend Socket.io is reachable; **Offline** (red) if backend down — both are acceptable for TC-1.1 to pass if comment still saves.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

## 2. Comment persistence

### TC-2.1 — Full page reload

| | |
|---|---|
| **ID** | TC-2.1 |
| **Priority** | P0 |

**Steps:**
1. After TC-1.1, note the comment text and timestamp.
2. **Hard refresh** the browser (Ctrl+Shift+R / Cmd+Shift+R).
3. Log in again if session expired.
4. Re-open the **same video** from the **same bin** used in TC-1.1.

**Expected Result:**
- Comment `TEST-TC-1.1 basic comment` still appears.
- Timestamp unchanged.
- Comments loaded via Supabase `GET` on `video_comments?file_name=eq.<name>`.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-2.2 — Navigate away and back (no full reload)

| | |
|---|---|
| **ID** | TC-2.2 |
| **Priority** | P1 |

**Steps:**
1. With comments visible on Video A, select a **different** asset (image or video B).
2. Re-select **Video A**.

**Expected Result:**
- Comments for Video A reload and include TC-1.1 comment.
- Video B did not show Video A’s comments while selected.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

## 3. Timestamp jump

### TC-3.1 — Click comment timestamp

| | |
|---|---|
| **ID** | TC-3.1 |
| **Priority** | P0 |

**Steps:**
1. Open the video from TC-1.1.
2. Scrub or play to a **different** position (e.g. start or 0:30).
3. Click the **gold timestamp link** on the TC-1.1 comment (~0:10).

**Expected Result:**
- Player `currentTime` moves to ~**0:10** (±1 s).
- Playback **starts** after seek.
- If second user connected (TC-7), other client may also seek — optional.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-3.2 — Timestamp after HLS ready (if applicable)

| | |
|---|---|
| **ID** | TC-3.2 |
| **Priority** | P2 |

**Steps:**
1. Use an asset that was recently uploaded (went from MP4 during processing → HLS when `ready`).
2. Add comment `TEST-TC-3.2 hls seek` at a known position.
3. Reload; click timestamp.

**Expected Result:**
- Seek still works on HLS playback (or MP4 if still on mezzanine).
- No player error overlay.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail  ☐ N/A (no HLS asset)

**Notes:**

---

## 4. Cloud vs Vault consistency

> **Inspector note:** Both bins should key comments as `MediaAsset.fileName` (e.g. `clip.mp4`). Vault grid shows `{timestamp}_clip.mp4` but preview strips the prefix. Mismatch here indicates a **fix is needed**.

### TC-4.1 — Cloud → Vault

| | |
|---|---|
| **ID** | TC-4.1 |
| **Priority** | P0 |

**Steps:**
1. **Cloud** bin: open test video.
2. Add comment: `TEST-TC-4.1 from-cloud`.
3. Note `previewFile.name` if visible in React devtools, or infer from grid label: `_______________`.
4. Switch to **Vault** bin (same folder/user).
5. Open the **same** video (same underlying asset / same display name).

**Expected Result:**
- `TEST-TC-4.1 from-cloud` **visible** in Vault Comments panel.
- TC-1.1 comment also visible if same asset.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-4.2 — Vault → Cloud

| | |
|---|---|
| **ID** | TC-4.2 |
| **Priority** | P0 |

**Steps:**
1. **Vault** bin: open same test video.
2. Add comment: `TEST-TC-4.2 from-vault`.
3. Switch to **Cloud** bin.
4. Open the same video.

**Expected Result:**
- `TEST-TC-4.2 from-vault` **visible** in Cloud Comments panel.
- All prior test comments for this asset visible in both directions.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-4.3 — Record file_name key (diagnostic)

| | |
|---|---|
| **ID** | TC-4.3 |
| **Priority** | P1 |

**Steps:**
1. In Supabase Table Editor (or SQL), query `video_comments` for test comments.
2. Record `file_name` values for TC-4.1 and TC-4.2 rows.

**Expected Result:**
- Both rows use the **same** `file_name` string (typically `MediaAsset.fileName` without upload timestamp prefix).
- Example: `Pakorawala.mp4` not `1730123456789_Pakorawala.mp4`.

**Actual Result:**

| Comment | `file_name` in DB |
|---------|-------------------|
| TC-4.1 | |
| TC-4.2 | |
| TC-1.1 | |

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

## 5. Edit comment

### TC-5.1 — Edit and persist

| | |
|---|---|
| **ID** | TC-5.1 |
| **Priority** | P1 |

**Steps:**
1. Open test video with existing comments.
2. Hover a comment → click **Edit** (pencil).
3. In browser prompt, change text to: `TEST-TC-5.1 edited`.
4. Confirm prompt.
5. **Reload page** and re-open same video.

**Expected Result:**
- UI updates immediately after edit.
- After reload, text is `TEST-TC-5.1 edited` (not original).
- Supabase `PATCH`/`update` on `video_comments` succeeds.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-5.2 — Cancel edit

| | |
|---|---|
| **ID** | TC-5.2 |
| **Priority** | P2 |

**Steps:**
1. Click Edit on a comment.
2. Press **Cancel** on prompt (or Esc).

**Expected Result:**
- Comment text unchanged.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

## 6. Delete comment

### TC-6.1 — Delete and persist

| | |
|---|---|
| **ID** | TC-6.1 |
| **Priority** | P1 |

**Steps:**
1. Create a throwaway comment: `TEST-TC-6.1 delete-me`.
2. Click **Delete** (trash) → type `Delete` in confirmation prompt.
3. Confirm comment removed from list.
4. **Reload page** and re-open same video.

**Expected Result:**
- Comment gone from UI immediately.
- After reload, `TEST-TC-6.1 delete-me` does **not** return.
- Supabase `DELETE` succeeds.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-6.2 — Delete cancel

| | |
|---|---|
| **ID** | TC-6.2 |
| **Priority** | P2 |

**Steps:**
1. Click Delete → enter anything other than `Delete`.

**Expected Result:**
- Alert: confirmation failed; comment remains.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

## 7. Realtime basic test

> **Requires:** Backend Socket.io running; `NEXT_PUBLIC_BACKEND_URL` correct. Skip if P2 backend not available — mark N/A.

### TC-7.1 — New comment appears without refresh

| | |
|---|---|
| **ID** | TC-7.1 |
| **Priority** | P2 |

**Steps:**
1. **Browser A** and **Browser B** (or incognito): log in as same or different users.
2. Both open dashboard → same bin → **same video**.
3. Confirm both show **Live Sync** green (if backend up).
4. **Browser A only:** add comment `TEST-TC-7.1 realtime`.
5. **Browser B:** wait 5 s **without** refreshing.

**Expected Result:**
- Browser B shows new comment **without** manual refresh (via `comment-added` socket event).
- If backend offline: **N/A** — comment still persists on A after reload (TC-2.1).

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail  ☐ N/A

**Notes:**

---

### TC-7.2 — Timestamp click sync (optional)

| | |
|---|---|
| **ID** | TC-7.2 |
| **Priority** | P3 |

**Steps:**
1. Both browsers on same video (TC-7.1 setup).
2. **Browser A:** click a comment timestamp link.

**Expected Result:**
- **Browser B** player seeks to same time (socket `video-seek` / `video-play`).
- Known gap: **play/pause from transport controls** does not sync — not a failure here.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail  ☐ N/A

**Notes:**

---

## 8. Negative cases

### TC-8.1 — No video selected

| | |
|---|---|
| **ID** | TC-8.1 |
| **Priority** | P1 |

**Steps:**
1. Dashboard with **no** asset preview open (empty player state).
2. Observe Comments panel.

**Expected Result:**
- Placeholder: “Select a video to view or add comments” or “No feedback yet.” with disabled form.
- Textarea disabled; **Post Comment** not submittable.
- No Supabase insert attempted.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-8.2 — Empty comment

| | |
|---|---|
| **ID** | TC-8.2 |
| **Priority** | P1 |

**Steps:**
1. Open a video.
2. Leave comment textarea **empty** (or whitespace only).
3. Attempt **Post Comment**.

**Expected Result:**
- Button disabled or submit does nothing.
- No new row in `video_comments`.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-8.3 — Network / API failure visible

| | |
|---|---|
| **ID** | TC-8.3 |
| **Priority** | P2 |

**Steps:**
1. Open video with DevTools → Network.
2. Optionally throttle Offline or block `*.supabase.co` (one request).
3. Attempt to post comment: `TEST-TC-8.3 fail`.

**Expected Result:**
- Comment does **not** appear in list (or disappears if optimistic path fails).
- Console shows `Supabase insert error` (or network failure).
- User sees no dedicated toast — **note UX gap** if silent failure.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail  ☐ Skipped

**Notes:**

---

### TC-8.4 — Logged-out access

| | |
|---|---|
| **ID** | TC-8.4 |
| **Priority** | P1 |

**Steps:**
1. Log out (or open `/dashboard` in private window without login).
2. Attempt to reach dashboard.

**Expected Result:**
- Redirect to login (`/access`) or no dashboard comment UI.
- No unauthenticated comment insert possible.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail

**Notes:**

---

### TC-8.5 — Non-video asset selected

| | |
|---|---|
| **ID** | TC-8.5 |
| **Priority** | P2 |

**Steps:**
1. Select an **image** asset in gallery.

**Expected Result:**
- Comments panel disabled (`playerControlsDisabled`).
- No comment fetch for image preview.

**Actual Result:**

**Pass / Fail:** ☐ Pass  ☐ Fail  ☐ N/A

**Notes:**

---

## Summary scorecard

| Section | Tests | Pass | Fail | N/A |
|---------|-------|------|------|-----|
| 1. Basic creation | 2 | | | |
| 2. Persistence | 2 | | | |
| 3. Timestamp jump | 2 | | | |
| 4. Cloud vs Vault | 3 | | | |
| 5. Edit | 2 | | | |
| 6. Delete | 2 | | | |
| 7. Realtime | 2 | | | |
| 8. Negative | 5 | | | |
| **Total** | **20** | | | |

**Overall workflow usable as-is?** ☐ Yes  ☐ Partial  ☐ No

---

## Final section (complete after all tests)

### Blockers found

_List anything that prevents basic client review (comment + persist + seek). Leave blank until tested._

| # | Blocker | Test ID(s) | Severity |
|---|---------|------------|----------|
| 1 | | | ☐ P0 ☐ P1 ☐ P2 |
| 2 | | | ☐ P0 ☐ P1 ☐ P2 |
| 3 | | | ☐ P0 ☐ P1 ☐ P2 |

**Common blockers from inspection (check if observed):**

- [ ] `video_comments` table missing in Supabase project
- [ ] Supabase RLS denies insert/select (401/403 in Network tab)
- [ ] Cloud ↔ Vault comment split (TC-4.1 or TC-4.2 fail)
- [ ] Backend Socket.io unreachable (TC-7 N/A only — not a CRUD blocker)
- [ ] Video preview does not load (playback issue — fix before comment tests)

---

### Safe next fix recommendation

_Complete after scorecard. Prioritize smallest change that unblocks P0 failures._

| If this failed… | Likely cause (from workflow map) | Smallest safe fix direction |
|-----------------|----------------------------------|----------------------------|
| TC-1.1, TC-2.1 | Table/RLS missing | Create `video_comments` + policies in Supabase |
| TC-4.1 / TC-4.2 | `file_name` key mismatch | Unify `previewFile.name` to stable key (e.g. `assetId` or canonical `fileName`) in `useLiveComments` + preview handlers |
| TC-7.1 | Socket only | Verify `NEXT_PUBLIC_BACKEND_URL`; not required for solo review |
| TC-5.1 / TC-6.1 | RLS update/delete | Add author-scoped RLS policies |
| TC-8.3 silent fail | No user-facing error | Optional: toast on Supabase error in `handleAddComment` |

**Recommended fix order (do not implement until checklist reviewed):**

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

### Cloud / Vault comment mismatch — implementation needed?

**Answer after TC-4.1, TC-4.2, and TC-4.3:**

| Outcome | Recommendation |
|---------|----------------|
| TC-4.1 **and** TC-4.2 **Pass**; same `file_name` in TC-4.3 | **No implementation required** for key unification — document as verified behavior |
| Either TC-4.1 or TC-4.2 **Fail** | **Yes — implementation required** — unify comment key across `handleCloudAssetPreview` and `handlePreview` (and migrate or alias legacy `file_name` rows) |
| Pass in UI but different `file_name` in DB | **Investigate** — may cause admin (`user_id` filter) or notify mismatches later |

**Tester decision:**

☐ **No fix needed** — Cloud and Vault share comments for same asset (recorded `file_name`: _______________)

☐ **Fix needed** — comments do not cross bins (describe): _______________________________________________

☐ **Inconclusive** — retest with fresh asset after noting `MediaAsset.fileName`: _______________

---

## Optional follow-up tests (out of scope for “basic usable”)

Not required for go/no-go; track in separate pass if needed:

- [ ] **Notify Team** — `POST /api/notify` delivers email/Discord (TC-NOTIFY)
- [ ] **Download Report** — `.txt` export contains comments
- [ ] **Compile & Send** — note: API currently ignores `compiledNotes` (workflow map §6)
- [ ] **Picture lock** — vault lock read/write key mismatch; R2 vs `client-vault` storage
- [ ] **Admin portal** — client comments visible with `user_id` filter
- [ ] **Author-only edit** — second user editing first user’s comment (security)

---

## References

- `comment-review-workflow-map.md` — full architecture and risk analysis
- `r2-playback-review-map.md` — playback + comment integration
- `rendorax-project-checklist.md` §14 — unverified Supabase legacy tables

**No code was modified to create this checklist.**
