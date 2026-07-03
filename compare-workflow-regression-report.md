# Compare Workflow Regression Report

**Inspection date:** 2026-07-03  
**Status:** **Second fix implemented — pending manual verify (local, 2026-07-03)** — **not production-verified**  
**Verification scope:** Local dev only until manual QA passes. First manual pass failed; second fix (layout + sync + teardown) awaiting retest.  
**Problem:** Dashboard previously showed **V1 (Reference)** vs **V2 (Current)** side-by-side; only a single player appeared while compare controls existed on Cloud/CDN preview.

**Related:** `r2-playback-review-map.md` §Compare mode, `dashboard-qa-issue-map.md` QA-009

---

## Executive summary

Compare mode is **not removed** and **not disabled by feature flags**. Side-by-side rendering is **intentionally gated** in `app/dashboard/page.tsx` by:

```typescript
flags?.enable_compare_mode && isCompareMode && !previewFile.isCdn
```

**Cloud Delivery preview** always sets `previewFile.isCdn: true` (`handleCloudAssetPreview`). Therefore the second player (`V1 (Reference)`) **never mounts** when reviewing from the **Cloud** bin — even if the user selects a file from the **Compare...** dropdown and `isCompareMode` becomes `true`.

This is the **primary root cause** of the reported regression given the R2 migration workflow (upload → Cloud bin → preview from CDN gallery).

Compare **can still work** when previewing from **Vault** (`activeBin` is `"vault"` or `"root"` path with vault gallery) because `handlePreview` sets `isCdn: activeBin === "cloud"` → `false` on vault.

| Question | Answer |
|----------|--------|
| Is compare mode disabled? | **No** — `enable_compare_mode` defaults `true` |
| Is compare component unreachable? | **No** — inline JSX in `page.tsx` |
| Is compare state never set? | **Can be set** — dropdown calls `setIsCompareMode(true)` |
| Is compare renderer removed? | **No** — gated by `!previewFile.isCdn` |
| Why no side-by-side now? | **Most likely:** preview from **Cloud** bin (`isCdn: true`) |

---

## 1. Compare feature architecture

### Components (no dedicated Compare package)

Compare is implemented **inline** in the dashboard page — not a separate component file.

| Piece | File | Role |
|-------|------|------|
| **Main player (V2 Current)** | `app/dashboard/page.tsx` | `StreamingVideoPlayer` + `videoRef` |
| **Reference player (V1)** | `app/dashboard/page.tsx` | Second `StreamingVideoPlayer` + `compareVideoRef` |
| **Compare dropdown** | `app/dashboard/page.tsx` | `<select onChange={handleSelectCompare}>` |
| **Player shell** | `components/dashboard/MediaPreviewPanel.tsx` | Wraps `videoPreview` slot only |
| **Video element** | `components/dashboard/StreamingVideoPlayer.tsx` | Both main and compare instances |
| **Feature gate** | `hooks/useFeatureFlags.ts` | `enable_compare_mode` |
| **State** | `store/useDashboardStore.ts` | `compareFile`, `isCompareMode` |
| **Compare URL source** | `hooks/useFileManager.ts` | `getSignedUrl` → `fileUrls` (vault keys) |

### Side-by-side layout location

```1497:1547:rendorax-frontend/app/dashboard/page.tsx
                            <div
                              className={`... ${flags?.enable_compare_mode && isCompareMode && !previewFile.isCdn ? "flex-col sm:flex-row gap-4" : "flex-col"} ...`}
                            >
                              <div>  {/* V2 (Current) — always when video preview open */}
                                {flags?.enable_compare_mode && isCompareMode && !previewFile.isCdn && (
                                  <span> V2 (Current) </span>
                                )}
                                <StreamingVideoPlayer ref={videoRef} src={previewPlaybackUrl} ... />
                              </div>

                              {flags?.enable_compare_mode && isCompareMode && !previewFile.isCdn && compareFile && (
                                <div>  {/* V1 (Reference) — SECOND player */}
                                  <span> V1 (Reference) </span>
                                  <StreamingVideoPlayer ref={compareVideoRef} src={compareFile.url} muted ... />
                                </div>
                              )}
                            </div>
```

**Layout:** `flex-col` on small screens; `sm:flex-row` side-by-side when all gates pass.

---

## 2. Compare trigger flow

```mermaid
flowchart TD
  subgraph ui [Toolbar]
    DD["Compare... dropdown"]
  end

  subgraph handler [handleSelectCompare]
    GN["getSignedUrl(fileName)"]
    SF["setCompareFile({ name, url })"]
    SM["setIsCompareMode(true)"]
  end

  subgraph gates [Render gates]
    F["enable_compare_mode"]
    M["isCompareMode"]
    C["!previewFile.isCdn"]
    CF["compareFile != null"]
  end

  subgraph render [Player area]
    V2["V2 StreamingVideoPlayer — main"]
    V1["V1 StreamingVideoPlayer — compare"]
  end

  DD --> GN --> SF --> SM
  F --> M --> C --> CF
  CF --> V1
  V2 --> always when preview open
  C -->|"isCdn true (Cloud)"| BLOCK["V1 block — single player"]
```

### Compare dropdown

- **Where:** Preview toolbar when `previewFile.isVideo` and `flags?.enable_compare_mode` (~line 1392).
- **Label:** First option `Compare...` (empty value clears compare).
- **Options:** `allVideoFiles` — vault grid file names (`{timestamp}_{fileName}`), display stripped prefix.
- **Filter bug (minor):** `.filter((f) => f.name !== previewFile.name)` compares vault **full** name to preview **display** name — current asset may remain in list.

### Compare button

There is **no separate Compare button** — only the **dropdown** triggers compare. Clearing compare = select empty `Compare...` option.

### Asset selection logic (`handleSelectCompare`)

```806:819:rendorax-frontend/app/dashboard/page.tsx
  const handleSelectCompare = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fileName = e.target.value;
    if (!fileName) {
      setIsCompareMode(false);
      setCompareFile(null);
      return;
    }
    const url = await getSignedUrl(fileName);
    if (url) {
      setCompareFile({ name: fileName, url });
      setIsCompareMode(true);
    }
  };
```

- **Reference (V1)** URL comes from `fileUrls[vaultFileName]` via `getSignedUrl` — **vault name keys only**.
- **No cloud asset picker** — dropdown is always built from `vaultItems` video files, not `cloudAssets`.
- If `getSignedUrl` returns `undefined` (missing `fileUrls` entry), compare state **never sets** — silent failure.

---

## 3. State management

### Zustand (`store/useDashboardStore.ts`)

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `compareFile` | `{ name, url } \| null` | `null` | **V1 (Reference)** playback |
| `isCompareMode` | `boolean` | `false` | User selected a compare target |
| `previewFile` | `FileData` | `null` | **V2 (Current)** asset + `isCdn` flag |

### V2 (Current) — main preview

| Bin | Setter | `isCdn` |
|-----|--------|---------|
| **Cloud** | `handleCloudAssetPreview` | **`true` (always)** |
| **Vault** | `handlePreview` | `activeBin === "cloud"` → **`false`** on vault/root |

```947:955:rendorax-frontend/app/dashboard/page.tsx
      setPreviewFile({
        name: asset.fileName,
        url: playbackUrl,
        publicUrl: playbackUrl,
        isVideo,
        isCdn: true,
        assetId: asset.id,
        previewKey: asset.id,
      });
```

```778:786:rendorax-frontend/app/dashboard/page.tsx
    setPreviewFile({
      name: displayName,
      url,
      publicUrl: url,
      isVideo,
      isCdn: activeBin === "cloud",
      assetId: asset?.id,
      previewKey: asset?.id ?? fileName,
    });
```

### V1 (Reference) — compare target

Stored in `compareFile` with vault-style `name` + CDN URL from `fileUrls`.

### What enables side-by-side

**All** must be true:

1. `flags.enable_compare_mode === true`
2. `isCompareMode === true`
3. `previewFile.isCdn === false` ← **blocks Cloud**
4. `compareFile !== null` with valid `url`

### State resets

| Event | Effect |
|-------|--------|
| Bin switch (`activeBin` change) | `setPreviewFile(null)`, `setCompareFile(null)`, `setIsCompareMode(false)` |
| New cloud preview | `setIsCompareMode(false)`, `setCompareFile(null)` |
| New vault preview | Same |
| Empty compare dropdown | Clears compare |

### Playback sync (when both players exist)

`useEffect` (~669–698) syncs play/pause/seek/rate from `videoRef` → `compareVideoRef` when `isCompareMode && enable_compare_mode`.

---

## 4. Regression analysis

### Is compare mode disabled?

**No.** `useFeatureFlags.ts` defaults `enable_compare_mode: true` (dev simulation always true).

### Is compare component unreachable?

**No.** Renderer is in the live `page.tsx` tree under `MediaPreviewPanel` → `videoPreview`.

### Is compare state never set?

**It can be set** via dropdown when `getSignedUrl` returns a URL. User may have `isCompareMode === true` in React state while UI still shows one player.

### Is compare renderer removed from layout?

**No.** Second player block exists but **conditions fail** when `previewFile.isCdn === true`.

### Workflow shift (why it feels like a regression)

| Before (typical) | After R2 migration |
|------------------|-------------------|
| Vault / Supabase Storage preview | **Cloud Delivery** primary |
| `isCdn` often `false` on vault path | Cloud preview **`isCdn: true` always** |
| Side-by-side available | **Side-by-side blocked** by `!previewFile.isCdn` |
| R2 upload success → `setActiveBin("cloud")` | Users land in Cloud bin by default |

Documented previously in `r2-playback-review-map.md`:

> **Compare mode unavailable on cloud** — `!previewFile.isCdn` guard — Low (by design)

### Secondary issues (vault path)

If compare fails even on **Vault** bin:

| Issue | Effect |
|-------|--------|
| `getSignedUrl` empty | `isCompareMode` never set |
| `allVideoFiles` empty | Dropdown has no options |
| Mobile viewport | `flex-col` stacks vertically until `sm:` breakpoint — may look “single column” |

---

## 5. Exact files involved

| File | Responsibility |
|------|----------------|
| `rendorax-frontend/app/dashboard/page.tsx` | Compare dropdown, handlers, dual-player JSX, sync effect, `allVideoFiles` |
| `rendorax-frontend/store/useDashboardStore.ts` | `compareFile`, `isCompareMode`, `previewFile`, `activeBin` |
| `rendorax-frontend/hooks/useFeatureFlags.ts` | `enable_compare_mode` |
| `rendorax-frontend/hooks/useFileManager.ts` | `fileUrls`, `getSignedUrl`, `vaultItems` |
| `rendorax-frontend/components/dashboard/StreamingVideoPlayer.tsx` | Both video elements |
| `rendorax-frontend/components/dashboard/MediaPreviewPanel.tsx` | Video preview wrapper |
| `rendorax-frontend/components/VaultSidebar.tsx` | `activeBin` cloud vs vault (indirect) |
| `rendorax-frontend/components/dashboard/CloudAssetGallery.tsx` | Cloud preview entry (`isCdn: true`) |
| `rendorax-frontend/components/dashboard/FileGrid.tsx` | Vault preview entry → `handlePreview` |

---

## 6. Evidence

### Code path that **should** activate side-by-side

1. User on **Vault** bin (`activeBin !== "cloud"`).
2. Open video → `handlePreview` → `previewFile.isCdn === false`.
3. Toolbar **Compare...** → pick another vault video.
4. `handleSelectCompare` → `getSignedUrl` → `setCompareFile` + `setIsCompareMode(true)`.
5. Render: `enable_compare_mode && isCompareMode && !previewFile.isCdn && compareFile` → **two** `StreamingVideoPlayer` instances, `sm:flex-row`.

### Why it **does not** activate today (Cloud path — most common)

1. User on **Cloud** bin (default after R2 upload / cloud-first workflow).
2. Open video → `handleCloudAssetPreview` → **`previewFile.isCdn: true`**.
3. User selects **Compare...** → `isCompareMode` may become `true`, `compareFile` set.
4. Render gate **`!previewFile.isCdn`** → **false** → V1 block skipped; layout stays `flex-col` single column.
5. Only **V2** player visible — compare dropdown still shown (misleading).

### Proof in code (single gate)

```1503:1528:rendorax-frontend/app/dashboard/page.tsx
                                {flags?.enable_compare_mode &&
                                  isCompareMode &&
                                  !previewFile.isCdn && (
                                    <span ...>V2 (Current)</span>
                                  )}
                                ...
                              {flags?.enable_compare_mode &&
                                isCompareMode &&
                                !previewFile.isCdn &&
                                compareFile && (
```

When `previewFile.isCdn === true`, both the **V2 label** and **entire V1 column** are suppressed.

---

## 7. Minimal safe fix proposal (no implementation)

### Recommended fix (smallest behavior restore)

**Option A — Remove `!previewFile.isCdn` gate from compare render** (3 condition sites in `page.tsx` ~1498, 1503–1505, 1525–1527).

- Allow side-by-side when `isCompareMode && compareFile` regardless of bin.
- **Also required for Cloud:** extend `handleSelectCompare` to resolve reference URL from `cloudAssets` / `getMediaPlaybackUrl` when main preview is cloud (dropdown still vault-only today).

**Option B — Set `isCdn: false` for all R2-backed previews** (QA-009 direction).

- Removes cloud block without dropdown changes if compare targets remain vault-only.
- May affect other `isCdn` consumers — verify picture lock / labels.

**Option C — Cloud-aware compare only** (slightly larger).

- When `previewFile.isCdn`, populate compare dropdown from `cloudAssets` (exclude current `assetId`).
- Resolve V1 URL via `getMediaPlaybackUrl(asset)`.
- Remove `!previewFile.isCdn` render gate.

### Suggested minimal path

**Option C** is the correct product fix for Cloud-first workflow; **Option A alone** is incomplete (dropdown still vault-keyed).

**Files to touch (when approved):**

| File | Change |
|------|--------|
| `app/dashboard/page.tsx` | Remove or narrow `!previewFile.isCdn`; cloud compare dropdown + URL resolver |
| Optionally `hooks/useFileManager.ts` | Shared `resolvePlaybackUrlForAsset(asset)` if duplicating URL logic |

**Do not redesign:** Keep V1/V2 labels, existing `StreamingVideoPlayer`, Zustand shape.

### Verification after fix

1. **Cloud:** Open video A → Compare → video B → two players, V1/V2 labels, synced play.
2. **Vault:** Same test — no regression.
3. Bin switch clears compare.
4. Mobile: stacked layout acceptable; desktop side-by-side at `sm+`.

---

## Diagnostic checklist (confirm before coding)

| Step | Cloud bin | Vault bin |
|------|-----------|-----------|
| React: `previewFile.isCdn` | Expect `true` | Expect `false` |
| React: `isCompareMode` after dropdown | May be `true` | May be `true` |
| React: `compareFile` | May be set | May be set |
| DOM: count `<video>` in main preview | **1** | **2** if compare selected |
| Network: compare URL loads | Check `compareFile.url` | Same |

---

## Approval gate

| Step | Status |
|------|--------|
| Inspection | ✅ Complete |
| Root cause | `!previewFile.isCdn` blocked compare render; CDN toolbar lacked compare dropdown; dropdown was vault-URL only |
| Implementation | ✅ **Done** — `app/dashboard/page.tsx` (2026-07-03) |
| Manual verification | ⏳ **Pending** — first pass failed; second fix implemented, not yet tested |

### Implementation summary

**File:** `rendorax-frontend/app/dashboard/page.tsx`

1. Removed `!previewFile.isCdn` from compare layout / V1 / V2 label gates.
2. Added `compareVideoOptions` — cloud assets via `getMediaPlaybackUrl`, vault via `fileUrls`.
3. Updated `handleSelectCompare` — `cloud:{assetId}` and `vault:{vaultFileName}` value prefixes.
4. Added compare dropdown to **CDN Preview** toolbar (was vault-toolbar only).
5. Shared `renderCompareSelect()` for vault and CDN toolbars.

**Unchanged:** V1/V2 labels, dual `StreamingVideoPlayer` layout, sync effect, feature flag, single-player when compare off.

---

## Manual Verification Failed — Second Trace

**Trace date:** 2026-07-03  
**Status:** Fixed attempt implemented — **manual verification failed** (not verified)  
**Method:** Static code inspection of the implemented fix in `rendorax-frontend/app/dashboard/page.tsx` only. No runtime DevTools session in this pass.

### Observed vs expected

| Expected | Observed (manual QA) |
|----------|----------------------|
| Select V2 (Current) in preview | Main player shows |
| Select V1 (Reference) from Compare dropdown | Dropdown present; selection does not produce two players |
| Two `StreamingVideoPlayer` instances side by side | **Single player only** (first pass) |
| Both URLs load; main controls sync reference | Not reached |

> **Follow-up observation (same QA session):** Selecting a compare target **does** visually change/load something, but the **main (V2) video keeps playing** in the background. User cannot tell which player is active. This suggests compare state **may** update in some paths while playback lifecycle and layout remain broken — see §“Background Playback / Old Source Not Reset” below.

### Exact failed condition (most likely)

**`isCompareMode` and `compareFile` never become truthy after dropdown selection**, so the V1 render gate at lines 1571–1573 never passes and only the V2 column mounts.

The implemented fix **did remove** the old `!previewFile.isCdn` blocker (lines 1546, 1551, 1571–1573). Render logic is now correct **if** compare state is set. Manual failure therefore points to **compare state not being set** (or being set then immediately cleared — no code path clears compare on dropdown select; only new preview / bin switch clears it).

**Primary failure chain:**

```text
User selects Compare option
  → handleSelectCompare (806–842)
  → early return OR url === ""
  → if (url) block skipped (838–841)
  → compareFile stays null, isCompareMode stays false
  → V1 block not rendered → one player visible
```

### Ten-point inspection checklist

| # | Question | Result | Evidence |
|---|----------|--------|----------|
| 1 | Compare dropdown visible on active toolbar? | **Yes (when gates pass)** | CDN toolbar: `previewFile.isVideo && previewFile.isCdn` + `flags?.enable_compare_mode` → `renderCompareSelect()` (~1358–1389). Vault toolbar: `!previewFile.isCdn` + same flag (~1394, 1453–1455). |
| 2 | Does selecting an item call `handleSelectCompare`? | **Yes** | `<select onChange={handleSelectCompare}>` in `renderCompareSelect()` (~1124–1127). |
| 3 | Is `compareFile` actually set? | **Only if handler succeeds** | Set only inside `if (url)` (~838–840). Six silent exit paths before that (see below). |
| 4 | Does `compareFile` contain a valid URL? | **Only when set** | Cloud: `getMediaPlaybackUrl(asset)`. Vault: `getSignedUrl(key)` → `fileUrls` ref. Empty `url` → state never updated. |
| 5 | Is `isCompareMode` true after selection? | **Only when `compareFile` is set** | Set with `compareFile` in same `if (url)` block (~840). No separate toggle. |
| 6 | Are side-by-side render conditions all true? | **Requires compare state** | Layout row: `enable_compare_mode && isCompareMode` (~1546). V1 player: `enable_compare_mode && isCompareMode && compareFile` (~1571–1573). `!previewFile.isCdn` **removed** — no longer blocks Cloud. |
| 7 | Are both players mounting in the DOM? | **No (when state unset)** | V2 always mounts when `previewFile` is video (~1556–1568). V1 mounts only when checklist #5–6 pass (~1571–1591). Manual QA = one `<video>` → V1 block not mounting. |
| 8 | Is CSS/layout hiding the second player? | **Possible secondary issue** | V2 wrapper has `flex-1`; V1 wrapper does **not** (~1548 vs 1574–1575). On `sm:flex-row`, V1 can shrink to ~0 width (`min-w-0`, default `flex-shrink: 1`). Would affect visibility **only if** compare state is already true. |
| 9 | Does `compareVideoRef` receive a video element? | **Only if V1 mounts** | `ref={compareVideoRef}` on second `StreamingVideoPlayer` (~1583). Sync effect (~669–698) no-ops without both refs. |
| 10 | Does `previewFile` stay V2 while `compareFile` becomes V1? | **Yes by design** | `handleSelectCompare` does not mutate `previewFile`. Main = current preview; compare = dropdown target. Labels: V2 on main (~1551–1554), V1 on reference (~1577–1578). |

### `handleSelectCompare` silent exit paths

```806:842:rendorax-frontend/app/dashboard/page.tsx
  const handleSelectCompare = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    if (!value) {
      setIsCompareMode(false);
      setCompareFile(null);
      return;
    }

    const colonIndex = value.indexOf(":");
    if (colonIndex === -1) return;

    const source = value.slice(0, colonIndex);
    const key = value.slice(colonIndex + 1);
    // ...
    if (source === "cloud") {
      const asset = cloudAssets.find((item) => item.id === key);
      if (!asset) return;
      url = getMediaPlaybackUrl(asset);
    } else if (source === "vault") {
      const resolved = await getSignedUrl(key);
      if (!resolved) return;
      url = resolved;
    } else {
      return;
    }

    if (url) {
      setCompareFile({ name: compareName, url });
      setIsCompareMode(true);
    }
  };
```

| Exit | Condition | User-visible feedback |
|------|-----------|------------------------|
| A | `value` empty | Clears compare (intentional) |
| B | No `:` in value | Silent |
| C | `source === "cloud"` but asset not in `cloudAssets` | Silent |
| D | `getMediaPlaybackUrl(asset)` returns `""` | Silent |
| E | `source === "vault"` and `getSignedUrl` returns `undefined` | Silent |
| F | Unknown `source` | Silent |

**No toast, no console.error, no UI change** on D/E — matches “dropdown works but still one player.”

### Why vault-path selection often fails on Cloud bin (high-probability)

`compareVideoOptions` lists **both** cloud and vault entries for the same folder (~1105–1121):

```1105:1121:rendorax-frontend/app/dashboard/page.tsx
  const compareVideoOptions = useMemo(() => {
    const cloudOptions = cloudAssets
      .filter((asset) => getMediaFileCategory(asset.fileName) === "video")
      .filter((asset) => asset.id !== previewFile?.assetId)
      .map((asset) => ({
        value: `cloud:${asset.id}`,
        label: asset.fileName,
      }));

    const vaultOptions = allVideoFiles
      .filter((file) => file.id !== previewFile?.assetId)
      .map((file) => ({
        value: `vault:${file.name}`,
        label: file.name.substring(file.name.indexOf("_") + 1),
      }));

    return [...cloudOptions, ...vaultOptions];
  }, [cloudAssets, allVideoFiles, previewFile?.assetId]);
```

Vault URL resolution uses `getSignedUrl` → `fileUrlByVaultNameRef` only (`useFileManager.ts` ~337–338). That map is populated in `fetchFiles` **only when `getMediaPlaybackUrl(asset)` was truthy at fetch time** (~111–116). If the asset was processing or URL-missing during `fetchFiles`, the vault key is **absent** from `fileUrls`.

On **Cloud bin**, `useMediaProcessingPoll` → `refreshMonitoredAssets` calls **`loadCloudAssets` only**, not `fetchFiles` (~1022–1028). So `fileUrls` can remain stale while `cloudAssets` updates. User may pick the **vault** duplicate row (same display label) → `getSignedUrl` returns `undefined` → **silent failure**.

Cloud-path selection (`cloud:{assetId}`) uses live `cloudAssets` + `getMediaPlaybackUrl` and should work **if** the user picks the cloud option and URL resolves.

### Other contributing factors

| Factor | Effect |
|--------|--------|
| **Only one video in folder** | `compareVideoOptions` empty after excluding `previewFile.assetId` — only “Compare...” placeholder; workflow impossible |
| **`defaultValue=""` on compare `<select>`** (~1127) | Visual selection resets to placeholder on re-render; does **not** clear Zustand state, but makes it hard to confirm selection in UI |
| **Viewport &lt; `sm` (640px)** | `flex-col` stacks players vertically (~1546) — not side-by-side, but two players should still appear if state is set |
| **V1 column missing `flex-1`** (~1574–1575) | On `sm+`, reference column may collapse to zero width even when mounted — looks like one player; check DOM for second `<video>` with ~0 width |

### What the first fix did fix vs what remains broken

| Item | First fix | Still broken? |
|------|-----------|---------------|
| `!previewFile.isCdn` render gate | Removed | **Fixed in code** |
| CDN toolbar compare dropdown | Added | **Fixed in code** |
| Cloud URL in handler | `getMediaPlaybackUrl` | **Works only if `url` truthy and user picks `cloud:` option** |
| Vault URL on Cloud bin | Still `getSignedUrl` / stale `fileUrls` | **Likely broken** |
| Silent handler failure | Unchanged | **Broken** |
| Equal-width side-by-side layout | Unchanged | **May be broken** (secondary) |

### Files / functions involved

| File | Function / region | Role in failure |
|------|-------------------|-----------------|
| `app/dashboard/page.tsx` | `handleSelectCompare` (~806–842) | Sets or fails to set compare state |
| `app/dashboard/page.tsx` | `compareVideoOptions` (~1105–1122) | Dropdown options; duplicate cloud/vault rows |
| `app/dashboard/page.tsx` | `renderCompareSelect` (~1124–1137) | Dropdown UI; uncontrolled `defaultValue` |
| `app/dashboard/page.tsx` | V1 render gate (~1571–1591) | Second player mount |
| `app/dashboard/page.tsx` | Compare flex layout (~1545–1575) | Side-by-side layout; V1 missing `flex-1` |
| `hooks/useFileManager.ts` | `getSignedUrl` (~337–338) | Vault-only ref lookup; no `getMediaPlaybackUrl` fallback |
| `hooks/useFileManager.ts` | `fetchFiles` (~101–131) | Populates `fileUrls`; skips entries when URL empty at fetch time |
| `utils/mediaAssets.ts` | `getMediaPlaybackUrl` (~132–173) | Cloud compare URL resolver |
| `store/useDashboardStore.ts` | `compareFile`, `isCompareMode` | State that must be true for V1 mount |

### Minimal safe follow-up fix proposal (no implementation)

**Goal:** Make compare selection reliably set `compareFile` + `isCompareMode`, then ensure V1 is visible side-by-side. **Scope:** `page.tsx` only preferred; one-line fallback may touch `useFileManager.ts` only if necessary.

1. **Vault branch fallback in `handleSelectCompare`** (highest priority)  
   When `getSignedUrl(key)` is falsy, resolve via `vaultAssetsByName[key]` or `getVaultAssetRecord(key)` and `getMediaPlaybackUrl(asset)` — same resolver as cloud path. Avoids stale `fileUrls` on Cloud bin.

2. **User-visible failure feedback**  
   If URL still empty after resolution, `console.error` + brief toast (“Could not load reference video”) so QA is not silent.

3. **Prefer cloud options when `previewFile.isCdn`** (optional, smallest UX fix)  
   In `compareVideoOptions`, when main preview is CDN, return `cloudOptions` only (or dedupe vault rows that map to the same `assetId`). Reduces wrong-path selection.

4. **Layout: add `flex-1` to V1 column wrapper** (~1574)  
   Match V2 wrapper so `sm:flex-row` splits width ~50/50; add `min-w-0` (already present).

5. **Controlled compare `<select>`**  
   `value={compareFile ? \`cloud|vault:...\` : ""}` or track `compareSelection` in state so selection persists visually and empty re-mount does not confuse QA.

**Do not:** redesign toolbar, change backend, refactor player/comment/upload logic, or mark verified until manual QA confirms two players + sync.

### DevTools confirmation steps (for next manual pass)

1. Open Cloud bin → preview video A (V2).
2. Compare dropdown → pick reference (note whether label appears once or twice).
3. React/Zustand: `isCompareMode`, `compareFile`, `compareFile.url`.
4. DOM: count `<video>` under preview panel; inspect V1 wrapper computed width.
5. If state is false after select → Network/console: retry with `cloud:` option vs `vault:` option.

---

### Manual Verification Failed — Background Playback / Old Source Not Reset

**Trace date:** 2026-07-03 (follow-up to second trace)  
**New manual observation:** Selecting a compare video causes a **visible load/change**, but the **previous / background video continues playing**. User cannot clearly identify which video is active.  
**Method:** Static inspection of `page.tsx`, `StreamingVideoPlayer.tsx`, `previewAssetKey.ts`. No code changes.

#### Reconciliation with first second-trace finding

Both observations can coexist:

| Symptom | Likely explanation |
|---------|-------------------|
| “Only one player” | V1 column has no `flex-1` → ~0 width on `sm:flex-row`; or compare state never set on vault-path failure |
| “Something loads on compare select” | `compareFile` / `isCompareMode` **did** update; compare `StreamingVideoPlayer` mounts and shows buffering/loads new `src` |
| “Background video keeps playing” | **Main (V2) is never paused** on compare select; autoplay/sync keep it running while compare loads separately |

Compare selection **does not replace** the main preview — it adds (or swaps) a reference player. If layout hides V1 or labels are missed, the user perceives one dominant playing video plus a partial UI change.

---

#### 1. When `previewFile` changes

| Question | Finding |
|----------|---------|
| Is main `StreamingVideoPlayer` remounted? | **Yes**, when `previewPlayerKey` changes (~1557–1558). Key built in `buildPreviewPlayerKey` as `{scope}-{identity}-{playbackUrl}` (`utils/previewAssetKey.ts` ~17–29). Changes on new asset **or** URL update (e.g. processing poll: mezzanine → HLS). |
| Unique key? | **Yes** — React `key={previewPlayerKey}` on component + `playbackKey={previewPlayerKey}` passed inside. Inner `<video>` also keyed by `remountKey` (`StreamingVideoPlayer.tsx` ~147, ~288). |
| Previous video paused/unloaded? | **Not explicitly.** `handleCloudAssetPreview` / `handlePreview` replace `previewFile` and clear compare (~787–788, ~978–979) but **do not call `videoRef.current.pause()`**. Teardown relies on React unmount + `StreamingVideoPlayer` effect cleanup. Cleanup destroys HLS (`hlsInstance?.destroy()`) but **does not `pause()` or clear `src`** (~256–259). Orphan/ghost audio during HLS teardown is possible. |
| Autoplay on new preview | **Yes** — dedicated effect (~614–667) calls `video.play()` when `previewPlayerKey` changes. |

**Compare select does not change `previewFile`** — main player key and `src` stay on V2; main playback continues uninterrupted.

---

#### 2. When `compareFile` changes

| Question | Finding |
|----------|---------|
| Is compare `StreamingVideoPlayer` remounted? | **Yes**, when `comparePlayerKey` changes (~1581–1582). Key: `` `compare-${compareFile.name}-${compareFile.url}` `` (~1146–1148). Switching compare targets changes key → full remount. |
| Unique key per asset/URL? | **Partially** — includes `name` + `url` but **not `assetId`**. Two assets with same `fileName` + resolved URL could collide (edge case). URL change alone remounts. |
| Old compare paused/unloaded? | **Not explicitly.** `handleSelectCompare` (~806–842) only updates Zustand; **no pause** of `compareVideoRef` or `videoRef` before swap. Old compare instance unmounts via React `key` change; same weak HLS cleanup as main (destroy only, no `pause()`). |
| Main affected on compare change? | **No** — `previewFile` untouched; main keeps playing. Matches “background video continues.” |

---

#### 3. `StreamingVideoPlayer` behavior

| Question | Finding |
|----------|---------|
| HLS cleanup? | **Partial** — `useEffect` cleanup sets `cancelled = true` and `hlsInstance?.destroy()` (~256–259). No `video.pause()`, `video.removeAttribute('src')`, or `video.load()` in cleanup. |
| Reset `src` on file change? | **Yes (in-place)** — effect re-runs on `[remountKey, sanitizedSrc, ...]` (~260). `attachSource` starts with `video.removeAttribute("src")` then attaches new HLS or progressive `src` (~200–245). Applies when `src` changes **without** parent `key` change. |
| Pause previous playback on URL change? | **No explicit pause** before swap. Depends on browser/`load()` after `removeAttribute`. |
| `React.memo` wrapper | Component is memoized (~351) but parent **`key` forces remount** when keys change — memo bypassed for asset switches. |

**Risk:** Rapid compare switches or URL key updates while main is playing can leave a **brief overlap** where old HLS is destroyed asynchronously while main audio continues — user hears “old” playback from the **main** player (unmuted), not necessarily a leaked compare element.

---

#### 4. Active player clarity

| Question | Finding |
|----------|---------|
| V1 / V2 labels visible? | **Only when `isCompareMode` is true.** V2 label on main column (~1551–1554). V1 label on compare column (~1577–1578). If `isCompareMode` false, **no labels** — single-player appearance. |
| Visual “which is current”? | **Weak** — small corner badges only (gold “V2 (Current)”, gray “V1 (Reference)”). No border, focus ring, or size emphasis beyond layout. Main column has `flex-1`; compare may be invisible (0 width) on desktop. |
| Audio from both? | **By design: main only.** Compare has `muted` (~1587). Main has **no** `muted`. User hears **V2 main audio** even when compare is loading/playing visually. Compare sync uses silent reference. |
| Controls target | **Main only** — `VideoTimelineScrubber`, Play/Pause, ±5s, frame step, LUFS meter all use `videoRef` (~1600–1601, ~584–610, ~546–548). Compare is slave via sync effect. |

**UX gap:** User sees compare buffering/loading (visual change) while **hearing uninterrupted main audio** → feels like “old video still playing behind the new one.”

---

#### 5. Sync logic

| Question | Finding |
|----------|---------|
| Play/pause/seek control both? | **Intended** — `handleTogglePlay` (~585–610) drives both refs. Sync `useEffect` (~669–698) mirrors main → compare on `play`, `pause`, `seeked`, `ratechange`. |
| Old video playing behind new compare? | **Yes (main)** — compare select does not pause main. Main can play full-size while compare loads in a collapsed/narrow column. **Not** a second hidden compare element in normal React flow — main is the “background” playback. |
| Initial sync on compare mount? | **Missing** — sync effect only registers listeners; **no** `comp.currentTime = main.currentTime` or play-state sync on mount. If main is already playing when compare appears, compare stays at **t ≈ 0, paused** until next main `play`/`seeked` event. |
| `compareVideoRef` correctness | **Timing risk** — effect bails if `!comp` (~672). Runs after paint when deps change (`compareFile`, `isCompareMode`, …). If compare video mounts slower than effect (buffering), first run may skip; **re-runs when `compareFile` changes**, not when ref attaches. Switching compare targets updates ref to **new** element; old listeners removed on cleanup. |
| Scrubber seek | `VideoTimelineScrubber` sets `videoRef.current.currentTime` only (~70–78 in `VideoTimelineScrubber.tsx`). Compare catches up on main `seeked` **if** sync listeners are attached. |

**Failure mode matching observation:**

```text
Main V2 playing (unmuted, flex-1, full attention)
  → user picks compare reference
  → compareFile set, compare player mounts + loads (visible change)
  → main NEVER paused
  → compare muted, starts at 0, may not sync until user seeks/plays again
  → user: “background video keeps playing; can’t tell what’s active”
```

---

#### 6. Minimal safe fix proposal (playback / clarity — no implementation)

Extends the second-trace proposal. **Preserve** existing layout, labels, and toolbar design.

| # | Change | File | Rationale |
|---|--------|------|-----------|
| 1 | **Explicit teardown in `StreamingVideoPlayer` cleanup** — `video.pause(); video.removeAttribute('src'); video.load();` then `hls.destroy()` | `StreamingVideoPlayer.tsx` | Stop ghost HLS/audio on remount or `src` change |
| 2 | **Initial sync on compare attach** — when `compareFile` / `comparePlayerKey` changes and both refs exist: set `comp.currentTime = main.currentTime`; if `!main.paused`, `comp.play()` (muted) | `page.tsx` sync effect (~669–698) | Reference frame aligns with current; avoids “two different moments” |
| 3 | **Pause main optional?** — **Do not** pause main on compare select (would break review flow). Instead ensure V1 visible (`flex-1`) + labels | `page.tsx` layout (~1574) | Clarity without changing “V2 stays current” semantics |
| 4 | **On compare swap in `handleSelectCompare`** — before `setCompareFile`, `compareVideoRef.current?.pause()` (best-effort) | `page.tsx` (~838) | Belt-and-suspenders before remount |
| 5 | **Strengthen `comparePlayerKey`** — include `assetId` or option `value` (`cloud:uuid` / `vault:name`) | `page.tsx` (~1146–1148) | Guaranteed unique remount per selection |
| 6 | **Keep compare `muted`** | Already set (~1587) | Prevent dual audio; preserve |
| 7 | **Retry sync bind** — if `!compareVideoRef.current` on effect run, `requestAnimationFrame` retry (same pattern as main autoplay ~648–658) | `page.tsx` | Ensures sync attaches after compare video mounts |

**Do not:** redesign player chrome, add new toolbars, or change which asset is “current.”

---

#### Exact failed condition (this observation)

**Main (V2) playback is intentionally continuous across compare selection, while compare mount does not perform initial time/play sync and may be visually hidden.** User perceives the **unchanged playing main video** as “old/background” footage behind a partial compare load — not necessarily a leaked DOM `<video>`.

Secondary: **incomplete HLS teardown** on remount may contribute to ghost playback when **switching main preview** or compare URL keys, but the reported compare-dropdown symptom is **most consistent with main continuing to play + weak V1 visibility**.

#### Files / functions (playback trace)

| File | Region | Role |
|------|--------|------|
| `app/dashboard/page.tsx` | `handleSelectCompare` (~806–842) | Sets compare state; no playback teardown |
| `app/dashboard/page.tsx` | `previewPlayerKey` / `comparePlayerKey` (~126–128, ~1146–1148) | Remount keys |
| `app/dashboard/page.tsx` | Autoplay effect (~614–667) | Auto-plays main on preview change |
| `app/dashboard/page.tsx` | Sync effect (~669–698) | Event-only mirror; no initial sync |
| `app/dashboard/page.tsx` | `handleTogglePlay` (~585–610) | Dual play/pause when user acts |
| `app/dashboard/page.tsx` | Player layout (~1545–1591) | V2 `flex-1`, V1 not; label gates |
| `components/dashboard/StreamingVideoPlayer.tsx` | `useEffect` attach/cleanup (~186–260) | HLS lifecycle; weak pause on teardown |
| `utils/previewAssetKey.ts` | `buildPreviewPlayerKey` (~17–29) | Main key includes URL → remount on URL poll |
| `components/dashboard/VideoTimelineScrubber.tsx` | seek handler (~70–78) | Main-only scrub; compare via `seeked` sync |

### Approval gate (updated)

| Step | Status |
|------|--------|
| First inspection | ✅ Complete |
| First fix implemented | ✅ `page.tsx` (2026-07-03) |
| Second trace + background playback trace | ✅ Complete |
| Second fix implemented | ✅ `page.tsx` + `StreamingVideoPlayer.tsx` (2026-07-03) |
| Build (second fix) | ✅ Passed |
| Manual verification | ⏳ **Pending** — first pass failed; second fix not yet tested |

---

## Second fix implementation summary (2026-07-03)

**Scope:** Compare/player only — no upload, comments, auth, backend, or UI redesign.

### Files changed

| File | Changes |
|------|---------|
| `rendorax-frontend/app/dashboard/page.tsx` | V1 column `flex-1`; `comparePlayerKey` useMemo; `resetCompareVideoElement`; compare swap/clear teardown; sync effect with initial time/play sync + rAF ref retry |
| `rendorax-frontend/components/dashboard/StreamingVideoPlayer.tsx` | `teardownVideoElement` on cleanup and empty src; pause before source attach |

### Before / after

| Behavior | Before | After |
|----------|--------|--------|
| V1 column width (desktop `sm+`) | No `flex-1` — could collapse to ~0 width | `flex-1` matches V2 — ~50/50 side-by-side |
| Mobile layout | `flex-col` stack | Unchanged (`flex-col sm:flex-row`) |
| Compare mount sync | Event listeners only; compare at t≈0 | Initial `currentTime` + play if main playing; retry until ref ready |
| Compare swap / clear | No teardown before state update | `resetCompareVideoElement()` pauses + clears src |
| Player unmount / src change | HLS `destroy()` only | Pause, remove `src`, `load()`, then HLS destroy |
| Main player role | Primary, unmuted | Unchanged |
| Compare muted | Yes | Unchanged |
| Compare off | Single player | Unchanged |
| Play/pause/seek sync | Main → compare events | Preserved + initial sync on mount |

### Verification checklist (for manual QA)

1. Cloud bin → preview V2 → Compare → V1 → two players side by side on desktop.
2. Main playing → select compare → reference seeks to same time and plays (muted).
3. Switch compare target → no ghost audio from previous reference.
4. Clear compare → single player; reference stopped.
5. Mobile → stacked layout still works.
