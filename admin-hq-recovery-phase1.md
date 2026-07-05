# Admin HQ Recovery — Phase 1

**Created:** 2026-07-04  
**Type:** Inspection + operations verification only — no code changes, no redesign  
**Source:** `admin-dashboard-qa-issue-map.md` (ADM-001 through ADM-004)  
**Supabase project:** `bviltofeuqsibbgancby`  
**Environment:** Local dev (`NEXT_PUBLIC_BACKEND_URL=http://localhost:4000`)

---

## Executive summary

| Issue | Verification result | Status |
|-------|---------------------|--------|
| **ADM-001** P1 legacy tables | **Not present** in PostgreSQL or PostgREST | **OPEN — ops blocker** |
| **ADM-002** `client-vault` bucket | **Bucket does not exist**; no storage policies | **OPEN — ops blocker** |
| **ADM-003** Storage vs R2 client discovery | **6 `MediaAsset` rows** for 1 user; **0** storage folders — sidebar cannot list that user | **OPEN — data + architecture** |
| **ADM-004** Backend connectivity | Backend **healthy** on `:4000`; media API **401 without JWT** (expected) | **Infra OK** — assets blocked until client selectable |

**Bottom line:** Phase 1 ops work is **not complete**. Admin HQ page loads, but **Vault Directories**, **Project Phase**, **Billing**, and **Brief** cannot function until P1 SQL + `client-vault` bucket are applied. **Vault Assets** has data in Prisma but is **unreachable in UI** because the sidebar is empty.

---

## Verification method

| Layer | How verified | When |
|-------|--------------|------|
| PostgREST (browser-equivalent) | Node fetch with `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 2026-07-04 |
| PostgreSQL canonical | Direct query via `DATABASE_URL` pooler (`rendorax-backend/.env.local`) | 2026-07-04 |
| Storage API | `GET /storage/v1/bucket/client-vault`, `POST .../object/list/client-vault` | 2026-07-04 |
| Backend | `GET http://localhost:4000/api/health`, `GET /api/media/assets` (no auth) | 2026-07-04 |

No application code was modified. A temporary local verification script was used and removed after the run.

---

## 1. P1 tables existence

### 1.1 PostgreSQL (`to_regclass`) — authoritative

| Table | Exists | ADM |
|-------|--------|-----|
| `project_status` | **No** | ADM-001 |
| `project_status_details` | **No** | ADM-001 |
| `client_invoices` | **No** | ADM-001 |
| `video_comments` (P0 ref) | **Yes** | — |
| `video_metadata` (P0 ref) | **Yes** | — |

### 1.2 PostgREST (anon key — matches admin browser client)

| Table | HTTP | Code | Message |
|-------|------|------|---------|
| `project_status` | 404 | `PGRST205` | Could not find the table `public.project_status` in the schema cache |
| `project_status_details` | 404 | `PGRST205` | Could not find the table `public.project_status_details` in the schema cache |
| `client_invoices` | 404 | `PGRST205` | Could not find the table `public.client_invoices` in the schema cache |
| `video_comments` | 200 | — | Table reachable (`0` rows returned in probe) |
| `video_metadata` | 200 | — | Table reachable (`0` rows in probe) |

### 1.3 ADM-001 verdict

**CONFIRMED OPEN.**

- P0 SQL (`supabase-p0-legacy-review-tables.sql`) was applied previously — P0 tables exist.
- P1 admin tables were **never applied** — no `supabase-p1-admin-tables.sql` file exists in repo; proposal SQL is in `legacy-supabase-tables-migration-plan.md` §Safe SQL migration script.
- **Operator action (not done in this pass):** Run P1 portion of that script in Supabase SQL Editor for `bviltofeuqsibbgancby`, then `NOTIFY pgrst, 'reload schema'`.

### 1.4 Panels blocked by ADM-001

| Panel | Network call on client select | Expected until P1 applied |
|-------|------------------------------|---------------------------|
| **Project Phase Control** | `GET/POST rest/v1/project_status` | Default status only; upsert fails (`PGRST205`) |
| **Billing & Finances** | `GET/POST rest/v1/client_invoices` | Empty list; create → "Invoice generation failed." |
| **Project Requirements (brief)** | `GET rest/v1/project_status_details` | Panel hidden (`clientBrief` stays null) |

**Failure type:** **Missing data / missing tables** — not application logic bugs.

---

## 2. `client-vault` bucket

### 2.1 PostgreSQL `storage` schema

| Check | Result |
|-------|--------|
| Row in `storage.buckets` where `name = 'client-vault'` | **None** |
| Rows in `storage.objects` where `bucket_id = 'client-vault'` | **0** |
| RLS policies on `storage.objects` referencing `client-vault` | **None** |

### 2.2 Storage REST API

| Request | Status | Body / behavior |
|---------|--------|-----------------|
| `GET /storage/v1/bucket/client-vault` | 400 | `"Bucket not found"` |
| `POST /storage/v1/object/list/client-vault` (anon JWT) | 200 | `[]` (empty — no folders) |
| `GET /storage/v1/bucket` (anon) | 200 | `[]` — no buckets visible to anon |

### 2.3 Admin page behavior (`fetchClientFolders`)

```73:76:rendorax-frontend/app/admin/page.tsx
  const fetchClientFolders = async () => {
    const { data } = await supabase.storage.from("client-vault").list();
    if (data) setClients(data.filter((item) => !item.metadata));
  };
```

- Errors from `list()` are **ignored** — only `data` is read.
- With no bucket / empty list → `clients = []` → **Vault Directories sidebar empty**.

### 2.4 ADM-002 verdict

**CONFIRMED OPEN.**

- Bucket **does not exist** in project `bviltofeuqsibbgancby`.
- Policies from `update_rls_policy.sql` are **not applied** (no matching policies in `pg_policies`).
- **Operator action (not done in this pass):**
  1. Supabase Dashboard → Storage → Create bucket `client-vault` (private recommended).
  2. Run `update_rls_policy.sql` (or equivalent) so authenticated users can `list` the bucket.

### 2.5 Panels blocked by ADM-002

| Panel | Blocked? | Notes |
|-------|----------|-------|
| **Vault Directories** | **Yes** | Primary blocker — no folders to click |
| **All downstream panels** | **Effectively yes** | `selectedClient` never set without sidebar click |

**Failure type:** **Missing infrastructure** — not code defect in list filter logic.

---

## 3. Backend connectivity & MediaAsset loading

### 3.1 Environment

| Variable | Value (local) | Match project? |
|----------|---------------|----------------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` | Local dev ✓ |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bviltofeuqsibbgancby.supabase.co` | ✓ |
| Backend `SUPABASE_URL` | Same host | ✓ |
| Backend process | `npm run start:dev` active | ✓ |

### 3.2 API probes

| Endpoint | Auth | Status | Result |
|----------|------|--------|--------|
| `GET /api/health` | None | **200** | `{"status":"Studio Backend is Running"}` |
| `GET /api/media/assets` | None | **401** | `{"error":"Unauthorized"}` — **expected** |
| `GET /api/media/assets?userId={uuid}` | None | **401** | Same — requires Bearer JWT from admin session |

### 3.3 Prisma `MediaAsset` data (direct DB)

| Metric | Value |
|--------|-------|
| Total assets | **6** |
| Distinct `userId` values | **1** |
| Top user | `1a2f97b5-942e-44ee-9c32-7de0c1c8328d` (6 assets) |

Backend admin scoping (code, unchanged):

```288:291:rendorax-backend/src/routes/media.routes.ts
    const scopedUserId =
      isAdminUser(req) && requestedUserId?.trim()
        ? requestedUserId.trim()
        : authenticatedUserId;
```

With a valid **admin JWT**, `GET /api/media/assets?userId=1a2f97b5-942e-44ee-9c32-7de0c1c8328d` **should return 6 assets** — not exercised in this pass (no browser admin session token captured).

### 3.4 ADM-004 verdict

**Infra resolved; functional path blocked by ADM-002/003.**

- Backend is **reachable** and **running**.
- `NEXT_PUBLIC_BACKEND_URL` is correct for local dev.
- Media API auth gate works (401 without token).
- **Cannot confirm end-to-end asset load in admin UI** because no client appears in sidebar.
- Redis connection errors appear in backend logs (`ECONNREFUSED :6379`) — **does not block** `GET /api/media/assets` list; affects transcode queue only.

### 3.5 ADM-003 verdict (related)

**CONFIRMED OPEN.**

| Discovery path | State |
|----------------|-------|
| Supabase Storage folders | **0** — bucket missing |
| Prisma `MediaAsset.userId` | **1 user with 6 files** |
| Admin UI | Only uses storage folders — **never queries distinct `userId` from backend** |

Even after ADM-002 bucket creation, sidebar stays empty until **folders named with auth user UUIDs** exist in storage — R2-only uploads do not create them.

**Failure type:** **Architecture / missing data** — code assumes storage folders; media lives in Prisma/R2.

---

## 4. Admin page network trace

### 4.1 On initial `/admin` load

| # | Request | Purpose | Expected result (current env) | Panel impact | Failure cause |
|---|---------|---------|------------------------------|--------------|---------------|
| 1 | `POST /storage/v1/object/list/client-vault` | Vault Directories | **200 `[]`** | Sidebar empty | **ADM-002** missing bucket |
| 2 | (none) | — | — | Loading spinner clears | — |

No calls to P1 tables or backend until a client is selected.

### 4.2 On client select (if sidebar had entries)

| # | Request | Panel | Expected (current env) | Failure type |
|---|---------|-------|------------------------|--------------|
| 1 | `GET {BACKEND}/api/media/assets?userId={id}` | Vault Assets | **200** + JSON array (with admin JWT) | **Data** if wrong UUID; **blocked** today — no select |
| 2 | `GET /rest/v1/project_status?user_id=eq.{id}` | Project Phase | **404 PGRST205** | **Missing table — ADM-001** |
| 3 | `GET /rest/v1/project_status_details?user_id=eq.{id}` | Brief | **404 PGRST205** | **Missing table — ADM-001** |
| 4 | `GET /rest/v1/client_invoices?user_id=eq.{id}` | Billing | **404 PGRST205** | **Missing table — ADM-001** |

### 4.3 On status change / invoice create

| Action | Request | Expected (current env) | Failure type |
|--------|---------|------------------------|--------------|
| Phase button click | `POST /rest/v1/project_status` upsert | **404 PGRST205** | **ADM-001** |
| Deploy invoice | `POST /rest/v1/client_invoices` insert | **404 PGRST205** | **ADM-001** |
| Status upsert error handling | Code checks `if (!error)` only | **No user-visible error** | **Code — ADM-005** (out of Phase 1 scope) |

### 4.4 On video preview (if assets loaded)

| Request | Panel | Expected | Failure type |
|---------|-------|----------|--------------|
| `GET /rest/v1/video_comments?file_name=eq.{name}&user_id=eq.{id}` | Client Review Notes | **200** (P0 exists) | **Data** if no comments; **Code** if `file_name` key mismatch (ADM-007) |

### 4.5 Panel failure classification

| Panel | Primary blocker | Missing data vs code |
|-------|-----------------|----------------------|
| **Vault Directories** | ADM-002 + ADM-003 | **Missing data / infra** |
| **Project Phase Control** | ADM-001 (no client select today) | **Missing data** |
| **Billing & Finances** | ADM-001 | **Missing data** |
| **Project Requirements** | ADM-001 (+ no brief seed) | **Missing data** |
| **Vault Assets** | ADM-002/003 (cannot select client) | **Missing data / arch**; backend OK (ADM-004) |
| **Client Review Notes** | Depends on preview | **Data** (P0 OK); possible **code** key mismatch later |
| **Page chrome / widgets** | — | **Code/UX** (ADM-008+) — out of Phase 1 scope |

---

## 5. ADM-001–004 resolution matrix

| ID | Title | Phase 1 verification | Resolved? | What remains |
|----|-------|----------------------|-----------|--------------|
| **ADM-001** | P1 tables missing | Postgres + PostgREST **confirm absent** | **No** | Apply P1 SQL + RLS from `legacy-supabase-tables-migration-plan.md` |
| **ADM-002** | `client-vault` missing | Bucket **not in** `storage.buckets`; API 404 | **No** | Create bucket + `update_rls_policy.sql` |
| **ADM-003** | Storage vs R2 drift | 0 folders; **6 assets / 1 user** in Prisma | **No** | Ops: seed folder `1a2f97b5-942e-44ee-9c32-7de0c1c8328d` **or** later code fallback (§8 item 7 in issue map) |
| **ADM-004** | Backend / media API | Health **200**; assets **401** without JWT; 6 rows in DB | **Partial** | Operator: select client after ADM-002/003; confirm 200 + 6 assets in Network tab |

---

## 6. Operator checklist (Phase 1 ops — not executed here)

Execute in order. **No code changes.**

### Step A — P1 tables (ADM-001)

1. Open Supabase SQL Editor → project `bviltofeuqsibbgancby`.
2. Run P1 section from `legacy-supabase-tables-migration-plan.md` (tables 3–5 + RLS).
3. Reload PostgREST schema (`NOTIFY pgrst, 'reload schema';` or Dashboard API reload).
4. Re-verify:

   ```sql
   SELECT to_regclass('public.project_status'),
          to_regclass('public.project_status_details'),
          to_regclass('public.client_invoices');
   ```

   All three should be non-null.

### Step B — `client-vault` bucket (ADM-002)

1. Storage → New bucket → name: `client-vault`.
2. Run `update_rls_policy.sql` for authenticated list/upload policies.
3. Re-verify:

   ```sql
   SELECT name FROM storage.buckets WHERE name = 'client-vault';
   ```

### Step C — Client discoverability (ADM-003 workaround)

**Option C1 (ops only):** Create storage folder prefix matching Prisma user:

- Folder name: `1a2f97b5-942e-44ee-9c32-7de0c1c8328d` (placeholder object or empty prefix acceptable if list API returns folder entries).

**Option C2 (later code):** `MediaAsset` distinct `userId` fallback — tracked as issue map §8 item 7; **not Phase 1 ops**.

### Step D — Backend + admin UI smoke test (ADM-004)

1. Confirm backend: `curl http://localhost:4000/api/health`
2. Login as admin → `/admin`
3. Select client folder → Network tab:
   - `GET /api/media/assets?userId=1a2f97b5-...` → **200**, body length 6
   - P1 `GET` calls → **200** (empty rows OK)
4. Click phase status → `POST project_status` → **201**
5. Create test invoice → **201**

---

## 7. Secondary finding (not ADM-001–004)

| Item | Observation | Impact on Phase 1 |
|------|-------------|-------------------|
| `SUPABASE_SERVICE_ROLE_KEY` in frontend `.env.local` | PostgREST returns **401 Invalid API key** when used as Bearer | Does **not** block admin page panels (browser uses anon + user JWT). Affects server routes like `picture-lock`. |
| Redis `:6379` | Backend logs `ECONNREFUSED` | Does **not** block asset list API |
| P0 tables empty | `0` comment/metadata rows in probe | Review notes empty until dashboard comments exist |

---

## 8. Recommended next step after Phase 1 ops

When Steps A–D pass:

1. Mark **ADM-001**, **ADM-002** closed in tracker.
2. Mark **ADM-004** closed after authenticated media load confirmed.
3. **ADM-003** — closed if folder seeded; otherwise schedule small code fallback (preserve admin page structure).
4. Proceed to **Phase 2** from issue map §8: error surfacing (ADM-005/010), admin header (ADM-008) — **only after operator approves**.

---

## 9. Related documents

- `admin-dashboard-qa-issue-map.md` — full ADM-001–017 register
- `legacy-supabase-tables-migration-plan.md` — P1 SQL proposal
- `update_rls_policy.sql` — storage policies for `client-vault`
- `admin-account-setup-guide.md` — admin auth (resolved)
- `supabase-p0-legacy-review-tables.sql` — already applied (P0)

---

*End of Phase 1 recovery report. Inspection and verification only — no code, SQL, or infrastructure was modified.*
