# Premiere Pro XML Marker Export — Inspection & Phase 2 Plan

**Created:** 2026-07-03  
**Type:** Inspection + Phase 2a implementation  
**Prerequisite:** Offline Editing Timeline Marker Export Phase 1 — **Resolved — manually verified (local, 2026-07-03)**  
**Status:** Resolved — manually verified (local, 2026-07-03)  
**Production:** Verification pending (§14)

**Goal:** Safest Phase 2 plan to export timestamped review comments as Adobe Premiere Pro–importable XML markers, without breaking existing CSV/JSON export.

---

## Executive summary

| Question | Answer |
|----------|--------|
| Safest XML format for Premiere? | **FCP 7 `xmeml` version 4** (`.xml`) — Premiere’s long-standing import interchange format |
| Avoid `fcpxml`? | **Yes** — FCP X format requires conversion (XtoCC, Resolve) before Premiere import |
| Marker-only without media? | **Possible but unverified** — sequence-level `<marker>` elements are valid in xmeml DTD; Premiere may require minimal `<media>` / empty track in practice |
| DB / API changes? | **No** for Phase 2a |
| UI change? | **Minimal** — add XML to existing **Export Markers** download bundle (3rd file) or optional `format: 'xml'` path |
| FPS default | **24** (`ntsc=FALSE`, `timebase=24`) — matches Phase 1 + dashboard `useFrameAccurateVideo` |
| Start TC | **00:00:00:00** — player-relative; document limitation |

---

## 1. Current export implementation (Phase 1)

### Util: `rendorax-frontend/utils/exportReviewMarkers.ts`

| Function | Purpose |
|----------|---------|
| `buildMarkerRows(comments, fileName, fps=24)` | Sort by `time_stamp`; map to `MarkerExportRow` |
| `buildMarkersCsv(rows)` | RFC 4180 CSV with header `Timecode,Seconds,Author,Comment,FileName,CreatedAt` |
| `buildMarkersJson(rows)` | JSON array; camelCase keys |
| `cleanExportFileName(fileName)` | Strip vault `userId_` prefix |
| `buildMarkersFilename(fileName, ext)` | `Rendorax_Markers_{asset}_{YYYYMMDD-HHmmss}.{ext}` — **ext typed `'csv' \| 'json'` only today** |
| `downloadTextFile(content, filename, mimeType)` | Client blob download |

### Timecode

- SMPTE via `formatSMPTE(seconds, fps)` in `utils/timecode.ts`
- Frame index for XML: `Math.floor(seconds * fps)` — **same math** as SMPTE frame component

### Author

- `getCommentDisplayName(comment)` from `utils/commentAuthor.ts` — **do not duplicate**

### Hook: `useLiveComments.ts`

```309:344:rendorax-frontend/hooks/useLiveComments.ts
  const handleExportMarkers = (format?: "csv" | "json") => {
    // ...
    exportCsv();
    window.setTimeout(exportJson, 150);
  };
```

- Empty guard: `alert("No comments to export.")`
- Source: in-memory `comments` from Supabase `video_comments`

### UI: vault toolbar only

```1564:1576:rendorax-frontend/app/dashboard/page.tsx
Report → Export Markers → Send
```

- Gate: `previewFile.isVideo && !previewFile.isCdn`
- One click → CSV + JSON (150ms stagger)

---

## 2. Premiere Pro XML options

### Format comparison

| Format | Premiere import | Marker support | Recommendation |
|--------|-----------------|----------------|----------------|
| **FCP 7 xmeml** (`.xml`, `version="4"`) | **File → Import** — native | `<marker>` with `<in>`, `<out>`, `<name>`, `<comment>` | **Phase 2 choice** |
| FCP X fcpxml | Requires converter | Different schema (`marker` attributes) | **Avoid** |
| Premiere `.prproj` | Native project | Opaque binary/XML mix | **Out of scope** |
| OTIO | Beta import in some Premiere builds | Not marker-focused | **Future / optional** |
| CSV markers | Manual / third-party | N/A | **Phase 1 fallback** (verified) |

### xmeml marker semantics (Premiere-compatible)

Per [Apple FCP XML Elements](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/FinalCutPro_XML/Elements/Elements.html) and [FCPCafe xmeml analysis](https://fcp.cafe/developer-case-studies/fcpxml/):

| Element | Required | Meaning |
|---------|----------|---------|
| `<marker>` | Yes | Point or range on **clip** or **sequence** |
| `<name>` | Yes | Marker label (short) |
| `<comment>` | Optional | Longer note — **best place for author + full comment** |
| `<in>` | Yes | Frame offset from parent start (0-based) |
| `<out>` | Yes | End frame; **`-1`** = point marker (no duration) |

**Sequence-level vs clip-level:**

| Placement | Import behavior | Relink risk |
|-----------|-----------------|-------------|
| **`<sequence><marker>`** | Sequence markers on imported timeline | **Lower** — no clip media required |
| `<clipitem><marker>` | Clip markers on referenced media | **Higher** — expects `<file><pathurl>` |

**Recommendation:** Phase 2a uses **sequence-level markers** inside a minimal sequence shell. Phase 2b (if import fails lab test) adds optional placeholder `clipitem` with filename-only `pathurl`.

### Required sequence fields (xmeml v4)

| Field | Phase 2 value | Source |
|-------|---------------|--------|
| `sequence/name` | `Rendorax Review - {displayFileName}` | `cleanExportFileName()` |
| `sequence/duration` | `max(marker.in) + 1` or last frame + 24 | Derived from comments |
| `sequence/rate/timebase` | `24` | Default fps |
| `sequence/rate/ntsc` | `FALSE` | Non-drop 24fps |
| `sequence/timecode/string` | `00:00:00:00` | Assumption |
| `sequence/timecode/frame` | `0` | Assumption |
| `sequence/timecode/displayformat` | `NDF` | Non-drop |
| `marker/in` | `floor(time_stamp * fps)` | `time_stamp` |
| `marker/out` | `-1` | Point marker |
| `marker/name` | Truncated comment (≤80 chars) | `comment_text` |
| `marker/comment` | `{author}: {comment_text}` | `getCommentDisplayName()` + text |

### Can comments export as sequence markers without media relinking?

**Inspection answer:** **Likely yes for review workflow**, with caveats:

1. xmeml DTD allows `sequence` with `marker` children **without** mandatory `media`.
2. Premiere documentation states imported FCP7 XML **retains sequence markers** ([Adobe Help](https://helpx.adobe.com/premiere-pro/using/importing-xml-project-files-final.html)).
3. **Risk:** Some Premiere versions may expect `media/video/track` even for empty sequences — include **minimal empty track** if import fails in manual test.
4. Editors can import marker sequence, then **copy markers** to their working sequence (standard offline review workflow).
5. **No automatic bind** to hero media in Rendorax vault — by design for Phase 2a.

---

## 3. Data requirements

### Available today (no DB change)

| Rendorax field | XML use |
|----------------|---------|
| `time_stamp` | `marker/in` frame index |
| `comment_text` | `marker/name` (+ `comment`) |
| `author_display_name` | Via `getCommentDisplayName()` → `marker/comment` prefix |
| `file_name` | `sequence/name` suffix |
| `created_at` | Optional XML comment header only (not in xmeml marker schema) |

### Missing / not wired

| Field | Impact | Phase 2 handling |
|-------|--------|----------------|
| Source fps | Frame index accuracy | Default **24**; Phase 2.5: `MediaAsset.frameRate` when cloud asset selected |
| Sequence start TC | Offset if broadcast TC | Assume **00:00:00:00**; document in import guide |
| Clip / sequence duration | `sequence/duration` | Compute from max comment frame + 1 second padding |
| Hero media path | Clip relinking | **Omit** in Phase 2a (sequence markers only) |
| Project name | Bin naming | Derive from `file_name` |
| Drop-frame flag | 29.97 DF vs NDF | **NDF only** in Phase 2; `ntsc=TRUE` + `timebase=30` deferred to Phase 2.5 |

---

## 4. Safe assumptions for Phase 2

| Assumption | Value | Rationale |
|------------|-------|-----------|
| FPS | **24** | Matches Phase 1 CSV/JSON and dashboard SMPTE display |
| NTSC flag | **FALSE** | Simple integer fps; avoids 29.97 DF complexity |
| Start timecode | **00:00:00:00** | HTML5 player `currentTime` origin |
| Marker duration | **Point marker** (`out=-1`) | Review notes are instants, not ranges |
| Sequence name | `Rendorax Review - {cleanFileName}` | Human-readable in Premiere bin |
| Marker name | First 80 chars of `comment_text` | xmeml / Premiere UI truncation safety |
| Marker comment | `{author}: {comment_text}` | Preserves author when name truncated |
| XML version | **xmeml version 4** | Broad Premiere compatibility |

---

## 5. XML output design

### Proposed schema (minimal sequence + sequence markers)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence id="rendorax-review-1">
    <name>Rendorax Review - promo_v1.mp4</name>
    <duration>1536</duration>
    <rate>
      <timebase>24</timebase>
      <ntsc>FALSE</ntsc>
    </rate>
    <timecode>
      <rate>
        <timebase>24</timebase>
        <ntsc>FALSE</ntsc>
      </rate>
      <string>00:00:00:00</string>
      <frame>0</frame>
      <displayformat>NDF</displayformat>
    </timecode>
    <in>-1</in>
    <out>-1</out>
    <marker>
      <name>Brighten face</name>
      <comment>Client A: Brighten face</comment>
      <in>360</in>
      <out>-1</out>
    </marker>
    <marker>
      <name>Trim the intro</name>
      <comment>Reviewer: Trim the intro</comment>
      <in>1500</in>
      <out>-1</out>
    </marker>
    <!-- Optional fallback if Premiere rejects marker-only sequence: -->
    <!--
    <media>
      <video>
        <track />
      </video>
    </media>
    -->
  </sequence>
</xmeml>
```

**Frame math example:** `time_stamp=15.0`, fps=24 → `in=360` → SMPTE `00:00:15:00` ✓

### Escaping requirements

Implement `escapeXmlText(value: string)`:

| Character | Entity |
|-----------|--------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` (if used in attributes — prefer text nodes) |

- Strip or replace invalid XML control chars (`\x00-\x08`, etc.)
- UTF-8 encoding declaration on file

### Filename convention

```
Rendorax_Markers_{asset}_{YYYYMMDD-HHmmss}.xml
```

Reuse `sanitizeAssetSegment()` + timestamp logic from `buildMarkersFilename()` — extend `ext` union to `'csv' | 'json' | 'xml'`.

### MIME type

`application/xml` or `text/xml;charset=utf-8`

---

## 6. Compatibility risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Premiere rejects marker-only XML | **High** | Manual lab test; add empty `<media><video><track/></video></media>` fallback |
| FPS mismatch (24 vs 25/29.97 source) | **High** | Document; Phase 2.5 wire `MediaAsset.frameRate` |
| Drop-frame 29.97 treated as 24 NDF | **High** | Phase 2 = 24 NDF only; defer DF/NDF table to Phase 2.5 |
| Markers import as clip vs sequence | **Medium** | Use sequence-level `<marker>`; verify in QA |
| Media relink dialog | **Medium** | Phase 2a omits `<file>` — should not prompt |
| Duplicate markers on re-import | **Low** | Editor imports once per review round |
| Special characters break XML | **Low** | `escapeXmlText()` |
| Premiere version differences | **Medium** | Test CC 2024 + 2025; note version in QA report |
| Client privacy in XML | **Medium** | Same as CSV/JSON — vault-only export gate |
| Third download blocked by browser | **Low** | Stagger XML after JSON (~300ms); document popup blocker |

### Drop-frame note

For **29.97 DF**, xmeml uses `timebase=30` + `ntsc=TRUE` with DF timecode strings (`;` separators). **Do not implement in Phase 2a** — incorrect DF math is worse than documented 24fps assumption.

---

## 7. Minimal safe Phase 2 implementation proposal

### Scope

- **Add** `buildMarkersXmeml(rows, options)` to existing `exportReviewMarkers.ts`
- **Add** `secondsToFrame(seconds, fps)` helper (or export from `timecode.ts`)
- **Extend** `buildMarkersFilename(..., 'xml')`
- **Extend** `handleExportMarkers()` — third download with stagger:

  ```
  CSV → +150ms → JSON → +150ms → XML
  ```

- **Preserve** CSV/JSON output byte-for-byte behavior
- **No** DB, API, backend, or UI layout changes
- **Update** button `title` tooltip: “Download CSV, JSON, and Premiere XML”

### Files (future)

| File | Change |
|------|--------|
| `utils/exportReviewMarkers.ts` | `buildMarkersXmeml()`, `escapeXmlText()`, extend filename ext |
| `hooks/useLiveComments.ts` | Call XML builder in `handleExportMarkers()` |
| `app/dashboard/page.tsx` | Tooltip only (optional) |
| `premiere-xml-marker-export-plan.md` | Status after implementation |
| `offline-timeline-marker-export-plan.md` | Phase 2 pointer |

### Phase 2b (only if lab test fails)

- Add placeholder `clipitem` with `file/name` = display filename, `pathurl` = `file://localhost/{encodedName}`
- Markers on **sequence** still preferred over clip markers
- Optional UI: separate “Premiere XML only” if triple-download is blocked

### Phase 2.5 (later)

- FPS from `MediaAsset.frameRate` when `previewFile` is cloud asset with `assetId`
- 29.97 / 25 fps with correct `ntsc` + DF/NDF
- Sequence start offset field (DB or user input)

---

## 8. Manual test plan (Premiere Pro)

**Environment:** Local dashboard + Premiere Pro CC (note version in test log)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Add 3+ timestamped comments on vault video | Comments visible on scrubber |
| 2 | Click **Export Markers** | CSV + JSON + XML download |
| 3 | Open XML in text editor | Valid UTF-8, `xmeml version="4"`, markers sorted by `in` |
| 4 | Premiere: **File → Import** → select `.xml` | No parse error |
| 5 | Check Project panel | New sequence `Rendorax Review - …` |
| 6 | Open sequence in timeline | Sequence markers visible at correct positions |
| 7 | Spot-check timecode | Compare XML `in` / fps vs comment `time_stamp` |
| 8 | Open marker comment | Author + full text in comment field |
| 9 | Relink dialog | **Should not appear** (Phase 2a) |
| 10 | Compare with Phase 1 CSV SMPTE column | Same positions at 24fps |

**Fail criteria → Phase 2b:**

- Import error / empty sequence
- Markers missing or at wrong frames
- Forced media relink

---

## 9. Relationship to Phase 1

| Phase | Deliverable | Status |
|-------|-------------|--------|
| Phase 1 | CSV + JSON | **Resolved — manually verified (local, 2026-07-03)** |
| Phase 2a | Premiere xmeml XML (sequence markers) | **Resolved — manually verified (local, 2026-07-03)** |
| Phase 2b | XML with media fallback | Contingent on lab test |
| Phase 2.5 | Dynamic fps / DF / cloud asset | Future |

**Resolve CSV preset** remains separate (not covered by this plan).

---

## Related documents

- `offline-timeline-marker-export-plan.md` — Phase 1 + roadmap
- `timeline-comment-markers-plan.md` — on-player markers
- `utils/exportReviewMarkers.ts` — current export util
- `utils/timecode.ts` — SMPTE helpers
- [Adobe: Importing XML from Final Cut Pro](https://helpx.adobe.com/premiere-pro/using/importing-xml-project-files-final.html)
- [Apple: FCP XML Elements](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/FinalCutPro_XML/Elements/Elements.html)

---

---

## Phase 2a implementation summary

| Item | Detail |
|------|--------|
| Functions | `buildMarkersXmeml()`, `escapeXmlText()`, `resolveExportFps()` in `exportReviewMarkers.ts` |
| Format | FCP 7 xmeml version 4; sequence-level `<marker>` elements |
| FPS | Default 24; uses `previewFile.frameRate` when present |
| Download | **Export Markers** → CSV (+150ms) → JSON (+300ms) → XML |
| Filename | `Rendorax_Markers_{asset}_{YYYYMMDD-HHmmss}.xml` |
| Media | Empty `<media><video><track/></video></media>` shell to reduce Premiere import rejection |

---

*Phase 2a implemented 2026-07-03 — **Resolved — manually verified (local, 2026-07-03):** Premiere File → Import; sequence markers at correct timecodes; author + comment in marker comment field; CSV/JSON unchanged. Production verification pending.*

*End of plan.*
