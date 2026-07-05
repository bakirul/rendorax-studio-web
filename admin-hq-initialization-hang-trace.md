# Admin HQ Initialization Hang — Inspection Trace

**Status:** Init hang fix **implemented** · loading UX recovery **implemented** (2026-07-04) — **pending manual verify (local)**  
**Symptom:** Pre-fix: indefinite spinner · post-fix: slow perceived load → addressed with shell-first + `clientsLoading`  
**Regression window:** After Admin HQ Client Discovery **Phase 1** (`GET /api/media/clients` + `fetchMediaClients`)

---

## Executive summary

| Item | Finding |
|------|---------|
| **UI gate** | `loading === true` → early return renders spinner text only |
| **`setLoading(false)` location** | Single call — after `await fetchClientFolders()` in `useEffect` |
| **Exact hang condition** | `await fetchClientFolders()` **never settles** (pending Promise) |
| **Phase 1 regression** | Init now awaits `getBackendAuthHeaders()` + `backendFetch` — legacy path used `supabase.storage.list()` only |
| **401 / 403 / empty list** | **Do not** cause hang — errors throw, caught, init completes |
| **Root cause (code)** | Full-page loading blocked on unbounded async chain with **no timeout** and **no `finally`** on init |
| **Likely pending step** | `supabase.auth.getSession()` and/or `fetch(localhost:4000/api/media/clients)` |
| **Risk** | **High** — admin HQ unusable until promise resolves |
| **Minimal safe fix** | Decouple shell render from client fetch (`finally` + show UI immediately or `Promise.race` timeout) |
| **Post-fix state (2026-07-04)** | Full-page spinner **removed**; `clientsLoading` on sidebar only; discovery still background with 10s timeout |

---

## 1. Initialization flow (`app/admin/page.tsx`)

### 1.1 Loading gate

```284:289:rendorax-frontend/app/admin/page.tsx
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gold-primary uppercase tracking-widest text-sm">
        Initializing HQ Command...
      </div>
    );
```

**Only way to exit:** `setLoading(false)`.

### 1.2 Init `useEffect` (current — post-fix)

```70:86:rendorax-frontend/app/admin/page.tsx
  useEffect(() => {
    clientDiscoveryCancelledRef.current = false;

    const loadAdminData = async () => {
      try {
        void fetchClientFolders();
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();

    return () => {
      clientDiscoveryCancelledRef.current = true;
    };
  }, []);
```

| Property | Value |
|----------|-------|
| Blocks on `fetchClientFolders`? | **No** — `void` fire-and-forget |
| `setLoading(false)` | **`finally`** — runs even if `try` throws |
| Client discovery timeout | **10s** `Promise.race` inside `fetchClientFolders` |

### 1.2b Init `useEffect` (pre-fix — superseded)

```67:73:rendorax-frontend/app/admin/page.tsx
  useEffect(() => {
    const loadAdminData = async () => {
      await fetchClientFolders();
      setLoading(false);
    };
    loadAdminData();
  }, []);
```

| Property | Value |
|----------|-------|
| Dependencies | `[]` — runs once per mount (Strict Mode: twice in dev) |
| `Promise.all` | **None** |
| `loadAdminData().catch()` | **None** — unhandled rejection possible but not hang |
| `finally { setLoading(false) }` | **None** |

### 1.3 `fetchClientFolders` (current)

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

- Runs **in background** after shell shows.
- Worst case: **10s** until sidebar populates or empties — **no spinner** during this wait (UX gap).

### 1.4 `selectedClient`

- Not involved in init hang — only set on sidebar click (`fetchClientData`).
- Init does not depend on `selectedClient`.

---

## 2. `fetchMediaClients()` chain

```386:400:rendorax-frontend/utils/mediaAssets.ts
export async function fetchMediaClients(): Promise<MediaClientRecord[]> {
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch("/api/media/clients", { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to fetch media clients (${res.status})`,
    );
  }

  return res.json();
}
```

### Step A — `getBackendAuthHeaders()`

```11:14:rendorax-frontend/utils/backendAuth.ts
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
```

- **New in Phase 1 path** (admin init did not call this before).
- Missing token → **throws** immediately → caught → **not a hang**.
- **`getSession()` pending forever** → **hang**.

### Step B — `backendFetch()`

```3:21:rendorax-frontend/utils/backendFetch.ts
export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;
  try {
    return await fetch(url, init);
  } catch (error) {
    ...
    throw error;
  }
}
```

- Default `NEXT_PUBLIC_BACKEND_URL` = `http://localhost:4000`
- **No timeout** — `fetch` can pend until browser/OS gives up (long) or forever in edge cases.
- Connection refused → **rejects quickly** → caught → **not a hang** (usually).
- Backend handler stuck (e.g. Prisma/DB) → **hang**.

### Step C — Response handling

| Response | Behavior | Hang? |
|----------|----------|-------|
| **200** `[]` | `setClients([])`, init completes | No |
| **401** | Throw → catch | No |
| **403** | Throw → catch | No |
| **500** | Throw → catch | No |
| **Network error** | Throw → catch | No (typical) |
| **Pending fetch** | `await` never completes | **Yes** |

---

## 3. `GET /api/media/clients` (backend)

```272:305:rendorax-backend/src/routes/media.routes.ts
router.get("/clients", async (req: AuthenticatedRequest, res: Response) => {
  ...
  if (!isAdminUser(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const grouped = await prisma.mediaAsset.groupBy({ ... });
  return res.json(clients);
});
```

- Fast path for auth failures — JSON response, no hang on client if reached.
- **Slow/hung path:** `prisma.mediaAsset.groupBy` waiting on DB pooler (same DB as Supabase Postgres).

---

## 4. Phase 1 vs legacy — why regression now

| | **Before Phase 1** | **After Phase 1** |
|---|-------------------|-------------------|
| Init call | `supabase.storage.from("client-vault").list()` | `fetchMediaClients()` |
| Session | Implicit in Supabase storage client | **Explicit** `await getSession()` in `getBackendAuthHeaders` |
| Backend | **Not called** on init | **Required** `GET /api/media/clients` |
| Bucket missing | Returned `[]` quickly | N/A |
| Failure mode | Empty sidebar, **page loaded** | Same if errors throw — **unless promise pending** |

Legacy storage `list()` often completed quickly (200 + `[]` even without bucket). Phase 1 adds **two additional async dependencies** with no timeout on the critical path.

---

## 5. Ruled out causes

| Hypothesis | Verdict |
|------------|---------|
| **Empty client list** | Returns `[]` → resolves → `setLoading(false)` runs |
| **401 Unauthorized** | Throws in `fetchMediaClients` → caught |
| **403 Forbidden** | Throws → caught |
| **Infinite `useEffect` loop** | Deps `[]` — no re-run on state change |
| **`selectedClient` unset** | Does not block init |
| **Exception in `fetchClientFolders` catch** | Would still complete function |
| **`Promise.all` deadlock** | Not used |

---

## 6. Exact condition keeping spinner visible

```text
loading === true
AND
useEffect loadAdminData has not yet reached setLoading(false) on line 70
BECAUSE
await fetchClientFolders() has not settled
BECAUSE
await fetchMediaClients() has not settled
BECAUSE (one or both)
  (A) await supabase.auth.getSession() — pending
  (B) await fetch("http://localhost:4000/api/media/clients") — pending
```

**Formal:**

> `setLoading(false)` is unreachable until `fetchMediaClients()` Promise fulfills or rejects. Phase 1 placed that call on the **sole** path to dismiss the full-page loader, with **no timeout** and **no fallback render**.

---

## 7. Environmental contributors (dev session)

Terminal log around `/admin` visit shows:

- `GET /admin 200` — HTML served
- Prior **`Cannot find module './8948.js'`** webpack chunk error
- **`GET /_next/static/chunks/main-app.js` 404** — client bundle may fail to load/hydrate

If client JS **does not hydrate**, `useEffect` **never runs** → `loading` stays initial `true` → spinner forever.

| Scenario | Mechanism |
|----------|-----------|
| Stale `.next` after `npm run build` + `npm run dev` | Chunk 404 / MODULE_NOT_FOUND |
| Hydration never runs | `useEffect` skipped → permanent `loading=true` |

**Reproduction check:** DevTools → Network → confirm `main-app.js` loads; Console → confirm `useEffect` runs (e.g. log or network call to `/api/media/clients`).

---

## 8. Reproduction path

1. Login as admin (`app_metadata.role = admin`).
2. Middleware allows `GET /admin` (200).
3. Client bundle hydrates; `useEffect` runs.
4. `fetchMediaClients()` → `getSession()` → `fetch /api/media/clients`.
5. **If step 4 never completes** → spinner remains.

**Accelerated repro:**

- Stop backend → usually fast fail (not infinite) — unless browser stalls CORS preflight (unlikely on localhost).
- Block `localhost:4000` in firewall with connection half-open → long hang.
- DB pool hang on `groupBy` → request pending.

**Dev repro (chunk corruption):**

1. Run `npm run build` then `npm run dev` without clearing `.next`.
2. Load `/admin` with 404 on `main-app.js` → possible perpetual spinner without any API call.

---

## 9. Risk level

| Area | Level |
|------|-------|
| Admin HQ usability | **Critical** — full page blocked |
| Data loss | None |
| Auth bypass | None |
| Scope | Admin route only |

---

## 10. Minimal safe fix (implemented 2026-07-04)

### Applied in `app/admin/page.tsx` only

1. **`setLoading(false)` in `finally`** — shell always dismisses spinner even if init throws.
2. **`void fetchClientFolders()`** — client discovery runs in background; does not block shell.
3. **`Promise.race` 10s timeout** on `fetchMediaClients()` — prevents indefinite hang.
4. **`clientDiscoveryCancelledRef`** — skip `setClients` after unmount.

```typescript
const loadAdminData = async () => {
  try {
    void fetchClientFolders();
  } finally {
    setLoading(false);
  }
};
```

**Status:** Implemented — pending manual verify (local). Do not deploy/merge/push until verified.

### Previously recommended (superseded by implementation)

### Fix A — Recommended (smallest UX change)

**Decouple shell from client list** — match pattern used for `filesLoading`:

```typescript
useEffect(() => {
  setLoading(false); // show HQ shell immediately
  void fetchClientFolders(); // sidebar populates async
}, []);
```

- Spinner removed quickly; empty sidebar until clients load.
- Preserves page structure; no redesign.

### Fix B — Defensive `finally` on init (partial)

```typescript
useEffect(() => {
  const loadAdminData = async () => {
    try {
      await fetchClientFolders();
    } finally {
      setLoading(false);
    }
  };
  loadAdminData();
}, []);
```

- Fixes missed `setLoading` on unexpected throws in `loadAdminData`.
- **Does not fix** pending `getSession` / `fetch` hang.

### Fix C — Timeout wrapper (Phase 1 hardening)

```typescript
await Promise.race([
  fetchClientFolders(),
  new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 10_000)),
]);
```

- After timeout → catch → empty clients → shell visible.

### Fix D — Operational (dev only)

- Delete `.next` and restart `npm run dev` if chunk 404s present.
- Ensure backend `npm run start:dev` on `:4000`.

**Recommended combination:** **Fix A** + sidebar empty/loading indicator (optional) + dev `.next` reset if chunks 404.

---

## 11. File reference index

| File | Role in hang |
|------|----------------|
| `rendorax-frontend/app/admin/page.tsx` | `loading` gate L284–289; init L67–73; `setLoading(false)` L70 |
| `rendorax-frontend/utils/mediaAssets.ts` | `fetchMediaClients` L386–400 |
| `rendorax-frontend/utils/backendAuth.ts` | `getSession` L12–14 |
| `rendorax-frontend/utils/backendFetch.ts` | Unbounded `fetch` L10–11 |
| `rendorax-backend/src/routes/media.routes.ts` | `GET /clients` L272–305 |

---

## 12. Verification checklist (for fix validation)

- [x] Code: `/admin` shell not gated on `await fetchClientFolders()` (2026-07-04)
- [x] Code: `setLoading(false)` in `finally` block *(superseded — spinner gate removed 2026-07-04)*
- [x] Code: `clientsLoading` sidebar indicator (2026-07-04)
- [ ] `/admin` shows HQ shell immediately (no full-page spinner)
- [ ] Network: `GET /api/media/clients` appears (success or fail)
- [ ] Sidebar shows "Scanning directories..." while discovery runs
- [ ] Sidebar populates when backend returns clients
- [ ] `main-app.js` loads (no chunk 404)

---

## 13. Recheck — why HQ still feels slow (2026-07-04)

**Operator report:** Initialization/loading still abnormally slow **after** hang fix.

### 13.1 What runs on admin load (ordered)

| # | Call | When | Blocks spinner? | Blocks shell? |
|---|------|------|-----------------|---------------|
| 1 | Middleware `updateSession` → `supabase.auth.getUser()` | Server, before HTML | N/A | Adds server latency |
| 2 | Admin page JS download + hydrate | Client | **Yes** — `loading` initial `true` until `useEffect` | Yes |
| 3 | `loadAdminData` → `finally setLoading(false)` | Client, first paint after hydrate | **Brief** (same tick) | Dismisses spinner |
| 4 | `fetchMediaClients()` → `getSession()` + `GET /api/media/clients` | Background | No | No — but **empty sidebar** |
| 5 | `GlobalLiveWidget` → `getUser()` + socket `io()` | Layout dynamic import | No | Adds client work |
| 6 | `ChatbotWidget` → `hasHydrated` gate | Layout dynamic import | No | Delayed render |
| 7 | P1 Supabase tables | **Not on init** | No | Only on client click (`fetchClientData`) |

**Conclusion:** Full-page spinner should be **short** post-fix. Lingering slowness is likely **(A) hydration**, **(B) empty sidebar until discovery completes**, or **(C) slow `/api/media/clients`**.

### 13.2 Async call timing breakdown

#### `fetchMediaClients()` (background on init)

```text
getBackendAuthHeaders()
  └─ supabase.auth.getSession()     ← can be slow (network refresh)
backendFetch("/api/media/clients")
  └─ requireAuth → getUser(token)   ← second auth round-trip
  └─ prisma.mediaAsset.groupBy      ← DB (usually fast; pooler can lag)
```

| Failure mode | Max wait | UI effect |
|--------------|----------|-----------|
| Backend down / slow | Until OS TCP timeout or **10s race** | Empty sidebar; HQ shell visible |
| `getSession()` slow | Unbounded on background fetch | Empty sidebar longer |
| 401/403 | Immediate throw → catch | Empty sidebar |
| Success | Typically &lt;500ms local | Sidebar populates |

**`fetchMediaClients` timing out?** Possible — 10s cap exists; operator may wait full 10s with **no sidebar loading indicator**.

#### Session calls (duplicate)

| Component | Auth call |
|-----------|-----------|
| Middleware | `getUser()` (cookies) |
| `fetchMediaClients` | `getSession()` |
| `GlobalLiveWidget` | `getUser()` |
| `fetchClientData` (on click) | `getSession()` again via `fetchMediaAssets` |

Three separate client auth touches on a typical admin visit — not sequential with init gate, but adds main-thread and network load.

#### P1 table calls

`project_status`, `project_status_details`, `client_invoices` run **only inside `fetchClientData`** — **sequential** after assets:

```107:146:rendorax-frontend/app/admin/page.tsx
    const assets = await fetchMediaAssets(...);   // await
    const { data: statusData } = await supabase.from("project_status")...
    const { data: briefData } = await supabase.from("project_status_details")...
    const { data: invoiceData } = await supabase.from("client_invoices")...
```

**Not init blockers.** Missing P1 tables return quickly (404/PGRST205) — may add latency on **client select**, not first paint.

### 13.3 Blocking vs non-blocking today

| Step | Blocking? |
|------|-----------|
| `await fetchClientFolders()` on init | **No** (removed) |
| `loading === true` gate | **Yes** until first `useEffect` `finally` |
| Client discovery | Background |
| Widget hide (Fix B) | N/A to spinner — widgets still initialize |

### 13.4 Root causes of *perceived* slow init (ranked)

| Rank | Cause | Evidence |
|------|-------|----------|
| 1 | **Hydration delay** — `loading` starts `true`; spinner until client JS runs | `"use client"` page; no `loading: false` initial |
| 2 | **Sidebar discovery up to 10s** with no `clientsLoading` UI | Empty Vault Directories feels "still loading" |
| 3 | **Slow `GET /api/media/clients`** or `getSession()` | Network tab timing |
| 4 | **Dev cold compile** first `/admin` visit | Next.js dev server |
| 5 | **Layout dynamic widgets** — extra chunks + socket connect | `dynamic(..., { ssr: false })` in `layout.tsx` |
| 6 | **Infinite hang** (pre-fix) | **Ruled out** if `finally` path deployed |

### 13.5 Fix B interaction (communication recheck)

Fix B hides widget **UI** on `/admin` but **does not skip** `getUser()` or socket setup in `GlobalLiveWidget`. **No material init speedup** from Fix B.

### 13.6 Minimal safe loading improvements (pending approval)

| Step | Action | Effect |
|------|--------|--------|
| **L1** | `useState(false)` for `loading` OR remove gate entirely | HQ shell on first paint after hydrate — no "Initializing HQ Command..." |
| **L2** | Add `clientsLoading` + sidebar "Scanning directories..." | Clarifies background discovery vs broken |
| **L3** | Lower discovery timeout 10s → 5s (optional) | Faster fail on dead backend |
| **L4** | Show sidebar skeleton immediately | Reduces perceived wait |
| **L5** | Dev: clear `.next` if chunk 404 | Fixes hydration never running |

**Do not:** await discovery on init again; do not block shell on P1 tables.

### 13.7 Operator DevTools checklist

1. **Network** — time from navigation to `GET /api/media/clients` complete.
2. **Console** — `Client discovery timed out` after 10s?
3. **Performance** — gap between First Contentful Paint and HQ grid visible.
4. **Confirm** — is slowness **spinner text** or **empty sidebar**?

---

*Recheck complete. Loading UX recovery implemented 2026-07-04 — see §14.*

---

## 14. Loading UX recovery (implemented 2026-07-04)

| Change | File |
|--------|------|
| Removed `loading` state + full-page "Initializing HQ Command..." gate | `app/admin/page.tsx` |
| Added `clientsLoading` + "Scanning directories..." in Vault Directories | `app/admin/page.tsx` |
| `fetchClientFolders` sets `clientsLoading` in `finally` | `app/admin/page.tsx` |

**Perceived startup:** HQ grid renders on first paint; only sidebar shows async discovery state.

**Build:** `npm run build` passing (local).

**Pending:** Operator manual verify on running dev server.
