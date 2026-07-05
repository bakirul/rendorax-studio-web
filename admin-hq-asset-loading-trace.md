# Admin HQ Asset Loading — Inspection Trace

**Created:** 2026-07-04  
**Type:** Inspection only — no code changes, no implementation  
**Symptom:** Admin HQ **Vault Assets** panel shows **"No assets to display"** after client selection  
**Expected:** `MediaAsset` rows exist for the selected client  
**Operator state (reported):** Admin login ✓ · HQ loads ✓ · Client discovery sidebar ✓ · Client UUID visible ✓ · Assets empty ✗

---

## Executive summary

| Item | Finding |
|------|---------|
| **Sidebar `userId` vs `MediaAsset.userId`** | **Same source** — both from Prisma `MediaAsset` (`groupBy` vs `findMany`) |
| **DB state (verified)** | **6 rows** for `1a2f97b5-942e-44ee-9c32-7de0c1c8328d`; all `folder = null` |
| **Frontend asset call** | `fetchMediaAssets({ userId: clientId })` — **no `folder` param** (correct for admin) |
| **Backend admin scoping** | Correct **when** `req.user.role === "admin"` |
| **Exact root cause** | **Silent failure masking** in `fetchClientData` + **unconditional empty state** in Vault Assets UI. Any `fetchMediaAssets` error (401 / 500 / network) is caught and rendered identically to a legitimate empty `200 []`. Because `/api/media/clients` already succeeds, UUID mismatch and missing admin role are **unlikely**; the break is almost certainly an **error or empty response on `GET /api/media/assets`** that the UI does not surface. |
| **Most likely failing request** | `GET {BACKEND_URL}/api/media/assets?userId=1a2f97b5-942e-44ee-9c32-7de0c1c8328d` → non-200 (especially **500** from `serializeMediaAsset`) or masked throw |
| **Minimal safe fix** | (1) Surface asset-load errors in admin UI; (2) gate empty copy on `selectedClient`; (3) harden `GET /assets` serialization so one bad row cannot 500 the list |

---

## 1. `app/admin/page.tsx` — selection and asset flow

### 1.1 Relevant state

| State | Type | Purpose |
|-------|------|---------|
| `clients` | `MediaClientRecord[]` | Sidebar — from `GET /api/media/clients` |
| `selectedClient` | `string \| null` | Set on sidebar click |
| `clientAssets` | `MediaAssetRecord[]` | Vault Assets list |
| `filesLoading` | `boolean` | "Scanning..." spinner during `fetchClientData` |

### 1.2 Client discovery (works — reported PASS)

```88:105:rendorax-frontend/app/admin/page.tsx
  const fetchClientFolders = async () => {
    try {
      const rows = await Promise.race([
        fetchMediaClients(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Client discovery timed out")),
            CLIENT_DISCOVERY_TIMEOUT_MS,
          ),
        ),
      ]);
      if (clientDiscoveryCancelledRef.current) return;
      setClients(rows);
    } catch (error) {
      console.error("Failed to load media clients:", error);
      if (!clientDiscoveryCancelledRef.current) setClients([]);
    }
  };
```

Sidebar render passes `client.userId` into selection:

```342:349:rendorax-frontend/app/admin/page.tsx
              {clients.map((client) => (
                <li key={client.userId}>
                  <button
                    onClick={() => fetchClientData(client.userId)}
                    ...
                  >
                    📁 Client_{client.userId.substring(0, 8)}...
```

Display shows **first 8 chars** of UUID — operator "Client UUID appears" matches this label, not necessarily a full UUID elsewhere.

### 1.3 Asset load on client click

```107:147:rendorax-frontend/app/admin/page.tsx
  const fetchClientData = async (clientId: string) => {
    setFilesLoading(true);
    setSelectedClient(clientId);
    setClientBrief(null);
    setShowInvoiceForm(false);

    // Load vault assets from the media API (R2 + Prisma), scoped to the client userId.
    try {
      const assets = await fetchMediaAssets({ userId: clientId });
      setClientAssets(assets);
    } catch (error) {
      console.error("Failed to load client media assets:", error);
      setClientAssets([]);
    }

    // Load Status / Brief / Invoices (Supabase P1 tables — may 404 independently)
    ...
    setFilesLoading(false);
  };
```

| Observation | Impact |
|---------------|--------|
| `fetchMediaAssets({ userId: clientId })` only | No `folder` filter — should return **all** assets for that user |
| `catch` → `setClientAssets([])` | **Errors look identical to empty data** |
| No `setMessage` on asset failure | Operator sees no toast/banner |
| Supabase P1 calls run **after** assets | Phase/brief/invoice failures do not block asset set |

### 1.4 Vault Assets empty UI

```616:627:rendorax-frontend/app/admin/page.tsx
            <div className="bg-bg-panel border border-white/5 p-6 flex-grow">
              <h2 className="text-lg font-display text-text-white mb-4 border-b border-white/5 pb-4">
                Vault Assets
              </h2>
              {filesLoading ? (
                <div className="text-center py-10 text-gold-primary text-xs uppercase tracking-widest">
                  Scanning...
                </div>
              ) : clientAssets.length === 0 ? (
                <p className="text-center py-10 text-text-gray italic">
                  No assets to display.
                </p>
```

| Observation | Impact |
|---------------|--------|
| Panel is **not** wrapped in `{selectedClient && ...}` | **Before any click**, `clientAssets = []` already shows "No assets to display" |
| Empty condition is only `clientAssets.length === 0` | Cannot distinguish error vs no data vs no selection |

**Confirm click occurred:** If **Project Phase Control** or **Billing** panels appear (`selectedClient &&` gates them), the user clicked and `fetchClientData` ran.

---

## 2. `GET /api/media/assets` — query, auth, filtering

### 2.1 Frontend request builder

```402:426:rendorax-frontend/utils/mediaAssets.ts
export async function fetchMediaAssets(
  params?: FetchMediaAssetsParams,
): Promise<MediaAssetRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.userId) searchParams.set("userId", params.userId);
  if (params?.folder !== undefined) searchParams.set("folder", params.folder);

  const query = searchParams.toString();
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch(
    `/api/media/assets${query ? `?${query}` : ""}`,
    { headers },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to fetch media assets (${res.status})`,
    );
  }

  const data = (await res.json()) as MediaAssetRecord[];
  return data;
}
```

**Admin HQ call shape:**

```http
GET /api/media/assets?userId=1a2f97b5-942e-44ee-9c32-7de0c1c8328d
Authorization: Bearer <supabase_access_token>
```

No `folder` query param → backend does **not** filter by folder.

### 2.2 Auth path (shared with `/clients`)

```20:54:rendorax-backend/src/middleware/requireAuth.ts
export async function requireAuth(...) {
  ...
  const { data, error } = await client.auth.getUser(token);
  ...
  req.user = {
    id: data.user.id,
    email: data.user.email,
    role:
      typeof data.user.app_metadata?.role === "string"
        ? data.user.app_metadata.role
        : undefined,
  };
  next();
}
```

```26:28:rendorax-backend/src/routes/media.routes.ts
function isAdminUser(req: AuthenticatedRequest): boolean {
  return req.user?.role === "admin";
}
```

Frontend admin gate uses the same claim:

```4:6:rendorax-frontend/utils/auth/roles.ts
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.app_metadata?.role === "admin";
}
```

### 2.3 Backend handler — scoping logic

```307:340:rendorax-backend/src/routes/media.routes.ts
router.get("/assets", async (req: AuthenticatedRequest, res: Response) => {
  ...
  const requestedUserId = req.query.userId as string | undefined;
  const folderParam = req.query.folder as string | undefined;
  const normalizedFolder =
    folderParam !== undefined
      ? folderParam.trim().replace(/^\/+|\/+$/g, "") || null
      : undefined;

  const scopedUserId =
    isAdminUser(req) && requestedUserId?.trim()
      ? requestedUserId.trim()
      : authenticatedUserId;

  const assets = await prisma.mediaAsset.findMany({
    where: {
      ...(scopedUserId ? { userId: scopedUserId } : {}),
      ...(normalizedFolder !== undefined ? { folder: normalizedFolder } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(assets.map(serializeMediaAsset));
});
```

| Case | `scopedUserId` | Result for client with 6 assets |
|------|----------------|----------------------------------|
| Admin + `?userId=<client>` | Client UUID | **6 rows** (expected) |
| Admin, no `userId` | Admin's own UUID | 0 rows (admin has no uploads) |
| Non-admin + `?userId=<client>` | **Silently admin's own UUID** | 0 rows — **no 403** (asymmetric vs `/clients`) |
| Non-admin, no `userId` | Own UUID | Own assets only |

**Asymmetry (secondary bug, not primary here):**

```272:282:rendorax-backend/src/routes/media.routes.ts
router.get("/clients", async (req: AuthenticatedRequest, res: Response) => {
  ...
  if (!isAdminUser(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }
```

`/clients` **403** without admin · `/assets` **never 403** for foreign `userId` — it scopes to self instead.

Because sidebar discovery **works**, `isAdminUser(req)` is **true** for the same Bearer token on `/clients`. The same token on `/assets` should scope to the requested client UUID.

### 2.4 Serialization risk (500 path)

`/clients` returns counts only. `/assets` runs `serializeMediaAsset` per row:

```80:113:rendorax-backend/src/routes/media.routes.ts
function serializeMediaAsset<T extends MediaAssetRow>(asset: T): ... {
  const objectKey = asset.objectKey?.trim();
  ...
  if (objectKey) {
    const publicUrl = buildPublicUrl(objectKey);  // throws if key invalid
    ...
  }
  ...
}
```

`buildPublicUrl` throws when `objectKey` normalizes to empty (`rendorax-backend/src/lib/r2.ts`). A single bad row → entire handler **500** → frontend catch → **empty UI**.

---

## 3. Prisma `MediaAsset` — storage and query sources

### 3.1 Schema

```52:78:rendorax-backend/prisma/schema.prisma
model MediaAsset {
  id                String               @id @default(uuid())
  fileName          String
  publicUrl         String
  ...
  folder            String?
  userId            String?
  ...
  @@index([userId])
}
```

`userId` is **nullable** but all current rows are populated.

### 3.2 `assetCount` source vs asset query source

| Endpoint | Prisma query | Filter |
|----------|--------------|--------|
| `GET /api/media/clients` | `mediaAsset.groupBy({ by: ["userId"], where: { userId: { not: null } } })` | Distinct owners |
| `GET /api/media/assets?userId=X` | `mediaAsset.findMany({ where: { userId: X } })` | All assets for owner |

Both read the **same table** on the **same `DATABASE_URL`**. No Supabase Storage involvement.

### 3.3 Database verification (2026-07-04, `rendorax-backend/.env.local` pooler)

```json
{
  "byUser": [
    { "userId": "1a2f97b5-942e-44ee-9c32-7de0c1c8328d", "cnt": 6 }
  ],
  "sample": [
    {
      "id": "8c64753f-f1a9-4578-b6cd-fdb93338c82b",
      "userId": "1a2f97b5-942e-44ee-9c32-7de0c1c8328d",
      "fileName": "entrepreneurship_through_siyb_(shorter).mkv_v1 (1080p).mp4",
      "folder": null
    }
  ]
}
```

---

## 4. Verification matrix — sidebar `userId` == `MediaAsset.userId`

| Check | Result |
|-------|--------|
| Sidebar `client.userId` origin | `GET /api/media/clients` → `groupBy userId` |
| Asset query param | Same string passed to `fetchMediaAssets({ userId: clientId })` |
| DB rows for that UUID | **6** assets, `folder: null` |
| UUID typo in UI | **Unlikely** — click handler uses `client.userId` directly, not truncated display string |
| Wrong UUID | **Ruled out** if sidebar entry came from `/clients` response |
| Admin permission filter blocking list | **Ruled out** if `/clients` returned 200 (requires admin) |
| Backend API mismatch (wrong table) | **Ruled out** — same Prisma model |
| Frontend mapping bug | **Unlikely** — `return res.json()` parsed as `MediaAssetRecord[]` with no transform |

---

## 5. Failure mode classification

| Hypothesis | Likelihood (sidebar works) | How to confirm |
|------------|---------------------------|----------------|
| **A. `fetchMediaAssets` throws** (401 / 500 / network) → catch → `[]` | **High** | DevTools → Network → `assets?userId=...` status; console → `Failed to load client media assets` |
| **B. `GET /assets` returns 500 during `serializeMediaAsset`** | **Medium** | Network 500; backend log `Failed to fetch media assets` |
| **C. Empty UI before client click** (no `selectedClient` gate) | **Medium** (UX) | Phase Control hidden until click |
| **D. `isAdminUser` false on `/assets` only** | **Very low** | Same middleware + JWT as `/clients` |
| **E. `scopedUserId` = admin UUID → `200 []`** | **Very low** if sidebar works | Response body `[]` with 200 |
| **F. `folder` filter excluding rows** | **Ruled out** | Admin call omits `folder`; DB rows have `folder: null` |
| **G. Frontend drops rows after parse** | **Very low** | Response has array length > 0 in Network preview |

---

## 6. API response examples

### 6.1 `GET /api/media/clients` — success (sidebar source)

```http
GET http://localhost:4000/api/media/clients
Authorization: Bearer <admin_jwt>
```

```json
[
  {
    "userId": "1a2f97b5-942e-44ee-9c32-7de0c1c8328d",
    "assetCount": 6
  }
]
```

### 6.2 `GET /api/media/assets` — expected success

```http
GET http://localhost:4000/api/media/assets?userId=1a2f97b5-942e-44ee-9c32-7de0c1c8328d
Authorization: Bearer <admin_jwt>
```

```json
[
  {
    "id": "8c64753f-f1a9-4578-b6cd-fdb93338c82b",
    "fileName": "entrepreneurship_through_siyb_(shorter).mkv_v1 (1080p).mp4",
    "publicUrl": "https://media.rendorax.com/uploads/...",
    "mimeType": "video/mp4",
    "fileSize": 123456789,
    "folder": null,
    "userId": "1a2f97b5-942e-44ee-9c32-7de0c1c8328d",
    "createdAt": "2026-...",
    "updatedAt": "2026-...",
    "processingStatus": "ready"
  }
]
```

(Array length **6** when healthy.)

### 6.3 Failure responses that produce identical UI today

| Status | Body | Operator sees |
|--------|------|---------------|
| **401** | `{ "error": "Unauthorized" }` | "No assets to display." |
| **500** | `{ "error": "Failed to fetch media assets" }` | "No assets to display." |
| **200** | `[]` | "No assets to display." |
| Network error | (fetch throw) | "No assets to display." |

---

## 7. File locations

| File | Role |
|------|------|
| `rendorax-frontend/app/admin/page.tsx` | `fetchClientData`, Vault Assets render, silent catch |
| `rendorax-frontend/utils/mediaAssets.ts` | `fetchMediaAssets`, `fetchMediaClients` |
| `rendorax-frontend/utils/backendAuth.ts` | `getBackendAuthHeaders` → Bearer token |
| `rendorax-frontend/utils/backendFetch.ts` | `BACKEND_URL` + `fetch` |
| `rendorax-frontend/utils/auth/roles.ts` | `isAdmin` (middleware gate) |
| `rendorax-frontend/middleware.ts` | `/admin` route protection |
| `rendorax-backend/src/routes/media.routes.ts` | `GET /clients`, `GET /assets`, `serializeMediaAsset` |
| `rendorax-backend/src/middleware/requireAuth.ts` | JWT → `req.user.role` |
| `rendorax-backend/prisma/schema.prisma` | `MediaAsset` model |
| `rendorax-backend/src/lib/r2.ts` | `buildPublicUrl` (serialization throw risk) |

---

## 8. Minimal safe fix (design only — do not implement yet)

### Fix 1 — Surface asset errors (frontend, `page.tsx`)

In `fetchClientData` catch block, call `setMessage({ type: "error", text: ... })` instead of only `console.error`. Preserves `clientAssets` or leaves prior list — avoids masquerading errors as empty inventory.

### Fix 2 — Gate empty copy on selection (frontend, `page.tsx`)

Change Vault Assets empty branch:

- No client selected → *"Select a client from Vault Directories."*
- Client selected + load failed → error message (Fix 1)
- Client selected + `200 []` → *"No assets to display."*

### Fix 3 — Harden list serialization (backend, `media.routes.ts`)

Wrap `serializeMediaAsset` in try/catch per row (or skip `buildPublicUrl` when `objectKey` invalid) so one corrupt row cannot 500 the entire admin asset list.

### Fix 4 — Admin parity on `/assets` (backend, optional)

Return **403** when `requestedUserId` is present, differs from `authenticatedUserId`, and `!isAdminUser(req)` — matches `/clients` behavior.

### Operator verify (before code)

1. Open DevTools → **Network** on `/admin`.
2. Click sidebar client.
3. Inspect `GET .../api/media/assets?userId=1a2f97b5-942e-44ee-9c32-7de0c1c8328d`:
   - **200 + 6 items** → frontend display bug (unexpected from static review).
   - **200 + []** → capture response; re-check JWT `app_metadata.role` on backend.
   - **401 / 403 / 500** → root cause confirmed; check backend console.
4. Console: search `Failed to load client media assets`.

---

## 9. Related docs

| Doc | Relevance |
|-----|-----------|
| `admin-hq-recovery-phase1.md` | Pre-Phase-1: sidebar empty; assets in DB unreachable |
| `admin-client-discovery-migration-plan.md` | Phase 1 implemented — discovery fixed, assets path unchanged |
| `admin-hq-initialization-hang-trace.md` | Init spinner fix — separate from asset list |
| `admin-dashboard-qa-issue-map.md` | ADM-003 / ADM-004 historical context |

---

**Inspection complete. Awaiting approval before implementation.**
