## Production Auth Flow Walkthrough (Frontend + Backend)

**Workspace:** `C:\Users\user\rendorax-studio`  
**Mode:** Inspection-only (no code/env changes, no redeploy)  
**Context:** Supabase project was migrated to **`bviltofeuqsibbgancby`**; remaining task is validating live-site login/auth.

---

## 1. Login button

### A) Primary “Client Login” button (global navigation)

- **Location:** Top navigation bar
- **File:** `rendorax-frontend/components/Navbar.tsx`
- **UI element:** Link labeled **“Client Login”**
- **Route:** Sends user to **`/access`**

### B) Secondary “Start Live Session” CTA (if unauthenticated)

- **Location:** Floating widget bottom-left (global live widget)
- **File:** `rendorax-frontend/components/GlobalLiveWidget.tsx`
- **Behavior:** If no Supabase user, shows a button that alerts then routes to **`/access`**

---

## 2. Login form

- **Page route:** `/access`
- **File:** `rendorax-frontend/app/access/page.tsx`
- **Handler function:** `handleLogin`
- **Supabase method used:** `supabase.auth.signInWithPassword({ email, password })`
- **Success behavior:** shows “Authentication successful…” then `router.push("/dashboard")` (client-side)

---

## 3. Signup form

**No signup form is present in this codebase** (at least in the inspected frontend files).

- No usage found of:
  - `supabase.auth.signUp(...)`
  - `signInWithOAuth(...)`
  - `exchangeCodeForSession(...)`
- Implication: Users are likely provisioned manually (or via Supabase dashboard / SQL / admin tooling), and only **login** is exposed in the UI.

If you expect signup to exist, it is currently **not implemented** as a page/component in `rendorax-frontend/`.

---

## 4. Supabase client config (frontend)

### Browser (client-side) Supabase client

- **File:** `rendorax-frontend/utils/supabase/client.ts`
- **Factory:** `createClient()`
- **Uses env vars:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Notes:**
  - If env vars are missing at build-time, it logs a warning and uses placeholder values (meant to avoid build crashes). In production, Vercel must supply the real env vars.

### Server (server components / API routes) Supabase client

- **File:** `rendorax-frontend/utils/supabase/server.ts`
- **Factory:** `createClient()`
- **Uses env vars:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Cookie integration:** Uses Next `cookies()` + `createServerClient(...)` to persist/refresh session cookies.

### Middleware session refresh helper

- **File:** `rendorax-frontend/utils/supabase/middleware.ts`
- **Function:** `updateSession(request)`
- **Uses env vars:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Core call:** `supabase.auth.getUser()` (server-side check based on cookies)

---

## 5. Auth callback

**No explicit auth callback route exists** in the current frontend (no `/auth/callback`, no code-exchange handler).

Evidence:
- No matches found for:
  - `/auth/callback`
  - `exchangeCodeForSession`
  - `signInWithOAuth`

**What this means:**
- The app is currently using **email/password login** (not OAuth) and relies on Supabase SSR cookies.
- For OAuth in the future, you’d likely need to add a callback route; for the current flow it is not required.

---

## 6. Middleware / session check (route protection)

### Middleware file

- **File:** `rendorax-frontend/middleware.ts`
- **Session source:** `updateSession(request)` from `utils/supabase/middleware.ts`
- **Session check:** `const { user } = await updateSession(request);`

### Protected routes

- **`/dashboard`** (and subpaths): requires **any authenticated user**
  - If unauthenticated → redirects to `/access?redirectTo=/dashboard...`
- **`/admin`** (and subpaths): requires **authenticated** + **admin role**
  - If unauthenticated → redirects to `/access?redirectTo=/admin...`
  - If authenticated but not admin → redirects to `/dashboard`

### Redirect destination logic

- If user tries to visit `/access` while authenticated:
  - Redirects to `redirectTo` query param (if present) else `/dashboard`
  - Prevents non-admin from landing on admin route

---

## 7. Login success redirect

Two layers contribute:

### Client-side redirect after login

- **File:** `rendorax-frontend/app/access/page.tsx`
- **On success:** `router.push("/dashboard")`

### Middleware redirect if user hits `/access` while already logged in

- **File:** `rendorax-frontend/middleware.ts`
- **Redirects to:** `redirectTo` or `/dashboard`

**Net result:** login success lands on **`/dashboard`**.

---

## 8. Logout flow

- **Component:** Dashboard header sign-out button
- **File:** `rendorax-frontend/components/DashboardHeader.tsx`
- **Handler function:** `handleSignOut`
- **Supabase method used:** `supabase.auth.signOut()`
- **After logout:**
  - Clears some global state (mic/live session/socket)
  - `router.push("/access")`
  - `router.refresh()`

Also, if an unauthenticated user interacts with the live widget:
- `GlobalLiveWidget.tsx` routes them to `/access`

---

## 9. Backend auth verification (JWT/session)

### Primary backend auth middleware

- **File:** `rendorax-backend/src/middleware/requireAuth.ts`
- **Env vars used:**
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- **Verification method:**
  1. Expects `Authorization: Bearer <token>`
  2. Calls `supabase.auth.getUser(token)`
  3. On success, sets `req.user = { id, email, role }` (role from `app_metadata.role`)

### Backend routes that require auth

Router-wide (all endpoints in these routers are protected):
- `rendorax-backend/src/routes/media.routes.ts` (`router.use(requireAuth)`)
- `rendorax-backend/src/routes/storage.routes.ts` (`router.use(requireAuth)`)
- `rendorax-backend/src/routes/upload.routes.ts` (`router.use(requireAuth)`)
- `rendorax-backend/src/routes/agency.routes.ts` (`router.use(requireAuth)`)

Single route protected at mount site:
- `rendorax-backend/index.ts`: `GET /api/projects` uses `requireAuth`

### Frontend → backend auth header bridging

The frontend does **not** share Supabase cookies with the backend directly. Instead it:

- Reads the current session on the Next.js server (using Supabase SSR cookies)
- Extracts the Supabase `access_token`
- Sends it to the backend as `Authorization: Bearer <access_token>`

**File:** `rendorax-frontend/utils/agencyBackend.ts`

- `getBackendAuthHeaders()` calls `supabase.auth.getSession()` using the server client (`utils/supabase/server.ts`)
- If session missing, it returns a JSON `Response` with `401`
- If session exists, it proxies the request to:
  - `${NEXT_PUBLIC_BACKEND_URL}/api/agency${path}`
  - with `Authorization: Bearer ${session.access_token}`

This matches backend expectations in `requireAuth.ts`.

---

## 10. Possible production risks (live)

### A) Redirect URL mismatch (Supabase dashboard setting)

Even with email/password login, misconfigured Auth URL settings can cause unexpected behavior in some flows.

**Where to check:** Supabase (new project) → **Auth → URL Configuration**

Risks:
- Site URL missing your production domain
- Redirect URLs missing your production domain and Vercel domain(s)

### B) Old Supabase project ref still set in Vercel Production env

Local files are updated, but live auth depends on Vercel env vars at runtime.

**Must match new project:**
- `NEXT_PUBLIC_SUPABASE_URL` should contain `bviltofeuqsibbgancby`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be the new project’s anon key

If these are wrong in Production scope, you’ll see:
- login seemingly succeeds but middleware still sees no user
- redirects back to `/access`

### C) Cookie/session issues

Common causes after switching projects:
- Browser still has old Supabase cookies (from old project) → clear cookies or use incognito
- Mixed domains (`rendorax.com` vs `www.rendorax.com` vs Vercel domain) can cause cookies to be set on one domain but tested on another

### D) Middleware mismatch / “redirectTo” behavior

The middleware uses `redirectTo` query parameter and clamps admin-only destinations for non-admins. If a user is not `app_metadata.role === "admin"`, `/admin` will always redirect to `/dashboard`.

### E) Backend auth mismatch

Backend validates the JWT against:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

If backend prod env is still pointing to the old Supabase project, backend API calls that require `requireAuth` will return `401`.

### F) Missing role metadata in the new project

Admin access depends on:
- `user.app_metadata.role === "admin"`

After migration, users may exist without `app_metadata.role` set, causing `/admin` redirects even if the email/password is correct.

---

## 11. Final live-test checklist (production)

> Use a fresh session (Incognito) to avoid stale cookies.

### A) Test signup

**Expected:** Not possible from UI (no signup form implemented).

To confirm:
- Visit `/access` and look for a “Sign up” / “Create account” flow (none exists in code).

If you need signup in production, it must be added later; for now, testing should be done with a **pre-created** user in the new Supabase project.

### B) Test login

1. Open `https://<your-live-domain>/access`
2. Enter credentials for a user that exists in **new** Supabase project `bviltofeuqsibbgancby`
3. Click **Authenticate**

**Success confirmation:**
- UI shows success message and redirects to `/dashboard`
- Hard refresh on `/dashboard` stays authenticated (middleware sees user)

### C) Test protected dashboard access

1. In the same session, open `https://<your-live-domain>/dashboard`

**Success confirmation:**
- You are not redirected to `/access`

**Failure symptoms:**
- Redirect to `/access?redirectTo=%2Fdashboard` indicates middleware did not see a user session

### D) Test logout

1. From `/dashboard`, click **Sign Out** in the header

**Success confirmation:**
- Redirect to `/access`
- Visiting `/dashboard` again redirects back to `/access`

### E) Test admin gating (if applicable)

1. Open `https://<your-live-domain>/admin`

Expected:
- If `app_metadata.role === "admin"` → you stay on `/admin`
- Otherwise → redirect to `/dashboard`

### F) Test backend-proxy auth (agency API)

From an authenticated browser session:

1. Request `GET https://<your-live-domain>/api/agency/tasks`

Expected:
- 200 with JSON payload (even if `tasks` is empty), or a structured 4xx error if policy blocks

If you get 401 here but the dashboard is logged in:
- backend production env may still be pointing to old Supabase project (JWT verification mismatch)


