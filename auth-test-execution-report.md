# Production Authentication — Test Execution Report

> **Project:** Rendorax Studio  
> **Supabase project ref:** `bviltofeuqsibbgancby`  
> **Report type:** Test execution template (fill in Actual Result / Pass-Fail during live testing)  
> **Mode:** Inspection and testing guidance only — no code/env/deploy changes from this document

---

## Test Environment

| Field | Value |
|-------|-------|
| **Tester name** | |
| **Test date** | |
| **Production URL** | e.g. `https://rendorax.com` or Vercel URL |
| **Browser / version** | |
| **Session type** | Incognito / fresh profile recommended |
| **Test user email** | (do not paste password) |
| **Test user role** | `admin` / `editor` / `client` / unknown |
| **Backend URL (production)** | From Vercel `NEXT_PUBLIC_BACKEND_URL` |

---

## Pre-flight Checklist (complete before tests)

| # | Check | Done? | Notes |
|---|-------|-------|-------|
| 1 | Vercel Production `NEXT_PUBLIC_SUPABASE_URL` contains `bviltofeuqsibbgancby` | ☐ | |
| 2 | Vercel Production `NEXT_PUBLIC_SUPABASE_ANON_KEY` is from new Supabase project | ☐ | |
| 3 | Supabase Auth → URL Configuration: Site URL matches production domain | ☐ | |
| 4 | Supabase Auth → Redirect URLs include production domain(s) | ☐ | |
| 5 | Test user exists in **new** Supabase project (`auth.users`) | ☐ | |
| 6 | Browser cookies cleared or incognito window used | ☐ | |
| 7 | Backend running at production `NEXT_PUBLIC_BACKEND_URL` (if testing API proxy) | ☐ | |
| 8 | Dashboard upload QA (QA-001 / QA-002) — separate local verification | ☑ | **Resolved — manually verified (local, 2026-07-03).** Not production. See `qa-001-finalizing-hang-trace.md`, `qa-002-upload-refresh-trace.md`. |

---

## 1. Logged-Out Access Test

### TC-1.1 — Direct `/dashboard` access while logged out

| Field | Detail |
|-------|--------|
| **Test Case** | Open production URL `/dashboard` in a fresh/incognito session (no Supabase cookies). |
| **Steps** | 1. Clear site cookies or use incognito.<br>2. Navigate to `https://<production-domain>/dashboard`.<br>3. Observe final URL and page content. |
| **Expected Result** | Redirect to `/access?redirectTo=%2Fdashboard` (or equivalent encoded path). Login page (“Client Vault”) is shown. Dashboard content is **not** visible. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Middleware: `rendorax-frontend/middleware.ts` gates `/dashboard` via `updateSession()` + `getUser()`. |

### TC-1.2 — Direct `/admin` access while logged out

| Field | Detail |
|-------|--------|
| **Test Case** | Open production URL `/admin` while logged out. |
| **Steps** | 1. Fresh/incognito session.<br>2. Navigate to `https://<production-domain>/admin`. |
| **Expected Result** | Redirect to `/access?redirectTo=%2Fadmin`. Admin portal is **not** visible. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | |

### TC-1.3 — Public route still accessible while logged out

| Field | Detail |
|-------|--------|
| **Test Case** | Open `/` or `/portfolio` while logged out. |
| **Steps** | Navigate to homepage or portfolio. |
| **Expected Result** | Page loads normally (no redirect to `/access`). |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Sanity check — middleware only protects `/dashboard` and `/admin`. |

---

## 2. Login Test

### TC-2.1 — Valid credentials (existing user)

| Field | Detail |
|-------|--------|
| **Test Case** | Log in with an existing user in the **new** Supabase project. |
| **Steps** | 1. Go to `/access`.<br>2. Enter valid email + password.<br>3. Click **Authenticate**.<br>4. Wait for redirect. |
| **Expected Result** | Success message (“Authentication successful…”). Redirect to `/dashboard` within ~1.5s. No error banner. Supabase auth cookies set (e.g. `sb-*-auth-token` pattern). |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Login handler: `app/access/page.tsx` → `supabase.auth.signInWithPassword()`. |

### TC-2.2 — `/access` while already logged in

| Field | Detail |
|-------|--------|
| **Test Case** | Visit `/access` after successful login. |
| **Steps** | 1. Complete TC-2.1.<br>2. Navigate to `/access` manually. |
| **Expected Result** | Redirect to `/dashboard` (or `redirectTo` param if present). Login form not shown. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Middleware redirects authenticated users away from `/access`. |

### TC-2.3 — Login with `redirectTo` query param

| Field | Detail |
|-------|--------|
| **Test Case** | Login from `/access?redirectTo=/dashboard` after being redirected from protected route. |
| **Steps** | 1. Start logged out, visit `/dashboard` → land on `/access?redirectTo=...`.<br>2. Log in successfully. |
| **Expected Result** | After login, user lands on `/dashboard` (original destination). |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Client redirect is to `/dashboard` fixed in `access/page.tsx`; middleware may also handle if user hits `/access` while authenticated. |

---

## 3. Session Persistence Test

### TC-3.1 — Hard refresh on `/dashboard`

| Field | Detail |
|-------|--------|
| **Test Case** | Verify session survives page reload. |
| **Steps** | 1. Log in successfully.<br>2. On `/dashboard`, hard refresh (Ctrl+Shift+R / Cmd+Shift+R). |
| **Expected Result** | User remains on `/dashboard`. No redirect to `/access`. Dashboard loads with user context. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Depends on Supabase SSR cookie refresh in `utils/supabase/middleware.ts`. |

### TC-3.2 — Navigate away and return

| Field | Detail |
|-------|--------|
| **Test Case** | Session persists across in-tab navigation. |
| **Steps** | 1. Logged in on `/dashboard`.<br>2. Go to `/portfolio`.<br>3. Return to `/dashboard`. |
| **Expected Result** | `/dashboard` loads without re-login. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | |

### TC-3.3 — Close and reopen browser (same session)

| Field | Detail |
|-------|--------|
| **Test Case** | Session persists after closing and reopening browser (non-incognito). |
| **Steps** | 1. Log in on `/dashboard`.<br>2. Close all browser windows.<br>3. Reopen browser, go directly to `/dashboard`. |
| **Expected Result** | User still authenticated (cookie not expired). `/dashboard` loads without `/access` redirect. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Cookie `maxAge` / Supabase session TTL applies. Failure here may indicate cookie domain or `SameSite` issues. |

### TC-3.4 — New incognito window after login (negative control)

| Field | Detail |
|-------|--------|
| **Test Case** | Confirm session is **not** shared across isolated profiles. |
| **Steps** | 1. Log in in normal window.<br>2. Open new incognito window.<br>3. Visit `/dashboard`. |
| **Expected Result** | Redirect to `/access` (no shared session). |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Expected fail-to-authenticate in incognito — confirms isolation works. |

---

## 4. Protected Route Test

### TC-4.1 — `/dashboard` (any authenticated user)

| Field | Detail |
|-------|--------|
| **Test Case** | Authenticated user can access dashboard. |
| **Steps** | 1. Log in as any valid user.<br>2. Visit `/dashboard`. |
| **Expected Result** | Dashboard loads. No redirect to `/access`. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | |

### TC-4.2 — `/admin` (admin role)

| Field | Detail |
|-------|--------|
| **Test Case** | User with `app_metadata.role === "admin"` can access `/admin`. |
| **Steps** | 1. Log in as admin user.<br>2. Visit `/admin`. |
| **Expected Result** | Admin portal loads. No redirect to `/dashboard` or `/access`. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Role check: `utils/auth/roles.ts` → `isAdmin()`. |

### TC-4.3 — `/admin` (non-admin user)

| Field | Detail |
|-------|--------|
| **Test Case** | Non-admin authenticated user is blocked from `/admin`. |
| **Steps** | 1. Log in as `editor` or `client` (no admin role).<br>2. Visit `/admin`. |
| **Expected Result** | Redirect to `/dashboard`. Admin UI not shown. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | |

### TC-4.4 — Deep link to nested protected path

| Field | Detail |
|-------|--------|
| **Test Case** | Subpath under `/dashboard` (if any) respects auth. |
| **Steps** | Visit any `/dashboard/*` path while logged out, then while logged in. |
| **Expected Result** | Logged out → `/access?redirectTo=...`. Logged in → page loads. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail ☐ N/A |
| **Notes** | |

---

## 5. Logout Test

### TC-5.1 — Sign out from dashboard header

| Field | Detail |
|-------|--------|
| **Test Case** | User can log out via dashboard UI. |
| **Steps** | 1. Log in, open `/dashboard`.<br>2. Click **Sign Out** in `DashboardHeader`.<br>3. Observe redirect. |
| **Expected Result** | Redirect to `/access`. `supabase.auth.signOut()` clears session. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Handler: `components/DashboardHeader.tsx` → `handleSignOut`. |

### TC-5.2 — Post-logout `/dashboard` access

| Field | Detail |
|-------|--------|
| **Test Case** | Session invalidated after logout. |
| **Steps** | 1. Complete TC-5.1.<br>2. Navigate to `/dashboard` (or refresh if still on page). |
| **Expected Result** | Redirect to `/access?redirectTo=%2Fdashboard`. Dashboard not accessible. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | |

### TC-5.3 — Post-logout API access

| Field | Detail |
|-------|--------|
| **Test Case** | Authenticated API routes reject logged-out session. |
| **Steps** | 1. After logout, call `GET /api/agency/tasks` (browser DevTools → Network, or fetch from console while on site). |
| **Expected Result** | `401` with `{ "error": "Unauthorized" }` (no valid session / Bearer token). |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Proxy: `utils/agencyBackend.ts` → `getBackendAuthHeaders()`. |

---

## 6. Frontend → Backend Token Flow

### TC-6.1 — Bearer token present on agency API proxy

| Field | Detail |
|-------|--------|
| **Test Case** | Frontend forwards Supabase `access_token` to backend. |
| **Steps** | 1. Log in on production.<br>2. Open DevTools → Network.<br>3. Trigger request to `/api/agency/tasks` (or call directly).<br>4. Inspect request to backend (or Next.js route response). |
| **Expected Result** | Next.js route obtains session via `supabase.auth.getSession()`. Outbound backend request includes `Authorization: Bearer <jwt>`. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Cannot see backend headers from browser if proxied server-side; check Next route returns 200/structured JSON, not 401. |

### TC-6.2 — Authenticated agency API response

| Field | Detail |
|-------|--------|
| **Test Case** | `GET /api/agency/tasks` succeeds when logged in. |
| **Steps** | 1. Logged in.<br>2. `GET https://<production-domain>/api/agency/tasks`. |
| **Expected Result** | HTTP `200`. JSON body includes `{ "tasks": [...], "role": "..." }` (tasks may be empty array). |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Backend validates JWT via `requireAuth` + `SUPABASE_URL` / `SUPABASE_ANON_KEY` on backend host. |

### TC-6.3 — Backend JWT validation (production backend)

| Field | Detail |
|-------|--------|
| **Test Case** | Production backend accepts tokens issued by new Supabase project. |
| **Steps** | 1. Obtain `access_token` from logged-in session (Application → Cookies or `supabase.auth.getSession()` in console).<br>2. `curl -H "Authorization: Bearer <token>" https://<backend>/api/agency/tasks`. |
| **Expected Result** | HTTP `200` (not `401` / `503`). |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail ☐ N/A |
| **Notes** | Skip if production backend not deployed. `503` = backend Supabase env missing. `401` = JWT/project mismatch. |

### TC-6.4 — Media API authenticated call (optional)

| Field | Detail |
|-------|--------|
| **Test Case** | Dashboard media fetch works with auth (indirect token flow). |
| **Steps** | 1. Log in.<br>2. Open `/dashboard`.<br>3. Observe Network calls to backend `/api/media/assets` (or equivalent). |
| **Expected Result** | Requests return `200` (or empty list), not `401`. Assets load or empty state shows. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail ☐ N/A |
| **Notes** | Requires production backend + `NEXT_PUBLIC_BACKEND_URL` not pointing to localhost. **Local dashboard upload (QA-001 FINALIZING, QA-002 list refresh): resolved and manually verified 2026-07-03** — does not substitute for this production check. |

### TC-6.5 — Dashboard upload flow (local QA reference)

| Field | Detail |
|-------|--------|
| **Test Case** | Post-login upload completes and list refreshes (local dev scope). |
| **Status** | **Resolved — manually verified (local, 2026-07-03)** |
| **Scope** | QA-001 (FINALIZING / `POST /api/media/assets` returns `201`) + QA-002 (asset list without page refresh). |
| **Production** | ☐ Not verified — run separately when production backend is deployed. |
| **Reports** | `qa-001-finalizing-hang-trace.md`, `qa-002-upload-refresh-trace.md` |

---

## 7. Failure Scenarios

### TC-7.1 — Invalid credentials

| Field | Detail |
|-------|--------|
| **Test Case** | Wrong email or password rejected. |
| **Steps** | 1. Go to `/access`.<br>2. Enter invalid email/password.<br>3. Click **Authenticate**. |
| **Expected Result** | Error message displayed (Supabase error text). No redirect to `/dashboard`. No auth cookies set. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | |

### TC-7.2 — Empty / malformed login form

| Field | Detail |
|-------|--------|
| **Test Case** | HTML5 validation prevents empty submit. |
| **Steps** | 1. Leave email or password empty.<br>2. Attempt submit. |
| **Expected Result** | Browser validation blocks submit (`required` fields). |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | |

### TC-7.3 — Expired / manually cleared session

| Field | Detail |
|-------|--------|
| **Test Case** | Access protected route after session removed. |
| **Steps** | 1. Log in.<br>2. DevTools → Application → Cookies → delete Supabase auth cookies.<br>3. Refresh `/dashboard` or visit `/admin`. |
| **Expected Result** | Redirect to `/access?redirectTo=...`. Treated as unauthenticated. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | Simulates expired session without waiting for TTL. |

### TC-7.4 — Missing token on API route

| Field | Detail |
|-------|--------|
| **Test Case** | API proxy rejects unauthenticated request. |
| **Steps** | 1. Logged out (or incognito).<br>2. `GET /api/agency/tasks`. |
| **Expected Result** | HTTP `401`. Body: `{ "error": "Unauthorized" }`. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail |
| **Notes** | |

### TC-7.5 — User exists in old project only (migration negative)

| Field | Detail |
|-------|--------|
| **Test Case** | Credentials from **old** Supabase project fail on production. |
| **Steps** | 1. Use email/password from pre-migration project (not migrated).<br>2. Attempt login on production `/access`. |
| **Expected Result** | “Invalid login credentials” (or equivalent). No access to `/dashboard`. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail ☐ N/A |
| **Notes** | Confirms production points to new project, not old `dimxegxvdbrhguqpvuwe`. |

### TC-7.6 — Admin route without `app_metadata.role`

| Field | Detail |
|-------|--------|
| **Test Case** | User without admin role cannot access `/admin`. |
| **Steps** | 1. Log in as user with no `app_metadata.role` set.<br>2. Visit `/admin`. |
| **Expected Result** | Redirect to `/dashboard`. |
| **Actual Result** | |
| **Pass / Fail** | ☐ Pass ☐ Fail ☐ N/A |
| **Notes** | Common after migration if roles not re-applied in Supabase. |

---

## Summary

| Section | Total cases | Pass | Fail | N/A | Blocked |
|---------|-------------|------|------|-----|---------|
| 1. Logged-out access | 3 | | | | |
| 2. Login | 3 | | | | |
| 3. Session persistence | 4 | | | | |
| 4. Protected routes | 4 | | | | |
| 5. Logout | 3 | | | | |
| 6. Frontend → Backend token | 4 | | | | |
| 7. Failure scenarios | 6 | | | | |
| **Total** | **27** | | | | |

---

## Overall Result

| Field | Value |
|-------|-------|
| **Production auth status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Blocking issues** | |
| **Follow-up actions** | |

---

## Reference (code paths — do not modify during test)

| Area | File |
|------|------|
| Login UI | `rendorax-frontend/app/access/page.tsx` |
| Route protection | `rendorax-frontend/middleware.ts` |
| Session refresh | `rendorax-frontend/utils/supabase/middleware.ts` |
| Logout | `rendorax-frontend/components/DashboardHeader.tsx` |
| API proxy + Bearer | `rendorax-frontend/utils/agencyBackend.ts` |
| Backend JWT check | `rendorax-backend/src/middleware/requireAuth.ts` |
| Admin role | `rendorax-frontend/utils/auth/roles.ts` |

**Related docs:** `production-auth-flow-walkthrough.md`, `supabase-auth-live-test-report.md`, `qa-001-finalizing-hang-trace.md`, `qa-002-upload-refresh-trace.md`

---

*Template — fill Actual Result and Pass/Fail during live production testing.*
