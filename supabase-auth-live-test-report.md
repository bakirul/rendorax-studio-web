## Supabase Auth Live Test Report (post-migration)

**Workspace:** `C:\Users\user\rendorax-studio`  
**Scope:** Inspection-only (no changes applied)  
**Goal:** Confirm frontend + backend auth configuration targets the **new Supabase project** and identify anything that could block **live-site login testing**.

---

## 1. Current Supabase configuration (frontend + backend)

### Frontend (`rendorax-frontend`)

**Configured Supabase project URL**

- `rendorax-frontend/.env`: `NEXT_PUBLIC_SUPABASE_URL` = `https://bviltofeuqsibbgancby.supabase.co`
- `rendorax-frontend/.env.local`: `NEXT_PUBLIC_SUPABASE_URL` = `https://bviltofeuqsibbgancby.supabase.co`

**Configured anon key**

- `rendorax-frontend/.env`: `NEXT_PUBLIC_SUPABASE_ANON_KEY` present (value redacted)
- `rendorax-frontend/.env.local`: `NEXT_PUBLIC_SUPABASE_ANON_KEY` present (value redacted)

**Additional Supabase-related keys in frontend `.env.local`**

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` present
- `SUPABASE_SERVICE_ROLE_KEY` present (server-only)
- `SUPABASE_SECRET_KEY` present (server-only)
- `SUPABASE_WEBHOOK_SECRET` present (server-only)

### Backend (`rendorax-backend`)

**Supabase Auth (JWT validation)**

- `rendorax-backend/.env.local`:
  - `SUPABASE_URL` = `https://bviltofeuqsibbgancby.supabase.co`
  - `SUPABASE_ANON_KEY` present (value redacted)

**Database connection (Prisma)**

- `rendorax-backend/.env.local`:
  - `DATABASE_URL` = pooler host `aws-1-ap-southeast-1.pooler.supabase.com:6543` (value redacted)
  - `DIRECT_URL`   = pooler host `aws-1-ap-southeast-1.pooler.supabase.com:5432` (value redacted)
  - Username format indicates project ref usage: `postgres.bviltofeuqsibbgancby`

**Backend `.env`**

- `rendorax-backend/.env` intentionally contains **no** `DATABASE_URL` / `DIRECT_URL` and no Supabase URL/keys (helps avoid Prisma conflicts).

---

## 2. Which env variables are used for Supabase auth (by code)

### Frontend auth variables (Next.js / Supabase SSR)

These files use:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Session refresh + user lookup (middleware):**
- `rendorax-frontend/utils/supabase/middleware.ts` uses `createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, cookies...)` and calls `supabase.auth.getUser()`.
- `rendorax-frontend/middleware.ts` calls `updateSession()` and uses the returned `user` to gate `/dashboard` and `/admin`.

**Server-side Supabase client:**
- `rendorax-frontend/utils/supabase/server.ts` uses `createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, cookies...)`.

**Client-side Supabase client:**
- `rendorax-frontend/utils/supabase/client.ts` uses `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` (with build-time placeholders only if missing).

**Login page:**
- `rendorax-frontend/app/access/page.tsx` calls `supabase.auth.signInWithPassword({ email, password })`.

### Backend auth variables (Express middleware)

**JWT validation:**
- `rendorax-backend/src/middleware/requireAuth.ts` uses:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- It extracts `Authorization: Bearer <token>` and validates with `supabase.auth.getUser(token)`.

---

## 3. Does frontend Supabase auth point to the new project?

**Yes.** Both `rendorax-frontend/.env` and `rendorax-frontend/.env.local` reference:

- `https://bviltofeuqsibbgancby.supabase.co`

And the frontend auth code exclusively uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 4. Does backend Supabase/service-role/database config point to the new project?

### Backend Supabase Auth

**Yes.** `rendorax-backend/.env.local` has:
- `SUPABASE_URL=https://bviltofeuqsibbgancby.supabase.co`
- `SUPABASE_ANON_KEY` present

### Prisma database connections

**Yes (by project ref + region).**

- Host: `aws-1-ap-southeast-1.pooler.supabase.com`
- Username includes project ref: `postgres.bviltofeuqsibbgancby`

### Service role usage

From inspection:
- Frontend `.env.local` includes `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SECRET_KEY` (server-only).
- Backend runtime auth does **not** require service role; it validates JWTs with `SUPABASE_URL` + `SUPABASE_ANON_KEY`.

Potential footgun (not necessarily a blocker for live login):
- `rendorax-backend/scripts/create-admin.ts` reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. That script expects those vars to be available in the environment when you run it (it even prints an error mentioning “frontend .env.local”). This affects **admin bootstrapping scripts**, not normal login/session behavior.

---

## 5. Is live site authentication ready to test?

**Most likely yes**, assuming Vercel production environment variables have been updated to the new project.

Why:
- The runtime auth flow for the site is driven by `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` and Supabase SSR cookies.
- All local config points to the new project ref.
- Middleware gates `/dashboard` and `/admin` based on `supabase.auth.getUser()` result.

What could still block live testing:
- Vercel Production env vars still pointing to the **old** project (common after migration).
- Supabase Auth project settings missing the correct **Site URL** / **Redirect URLs** for your Vercel domain(s).
- Existing browser cookies from the old project causing confusion until cleared.

---

## 6. Login / logout / session-refresh routes & files involved

### Login

- UI page: `rendorax-frontend/app/access/page.tsx`
  - Calls `supabase.auth.signInWithPassword(...)`
  - Redirects client-side to `/dashboard` on success

### Session refresh (critical for App Router + middleware)

- `rendorax-frontend/middleware.ts`
  - Uses `updateSession()` to refresh cookies and get current user
  - Redirect logic:
    - `/dashboard/*` requires user
    - `/admin/*` requires user + `isAdmin(user)`
    - `/access` redirects to `/dashboard` if already logged in

- `rendorax-frontend/utils/supabase/middleware.ts`
  - Creates SSR Supabase client and runs `supabase.auth.getUser()`

### Logout

- `rendorax-frontend/components/DashboardHeader.tsx`
  - Uses `supabase.auth.signOut()`

### Role checks

- `rendorax-frontend/utils/auth/roles.ts` checks `user.app_metadata.role === "admin"`
- Backend `requireAuth` reads role from `app_metadata.role` as well

---

## 7. Possible mismatch between old and new Supabase refs

I found **no remaining usage** of the old ref (`dimxegxvdbrhguqpvuwe`) in the inspected env files and key auth modules.

Where mismatches could still exist (outside this repo):
- Vercel env vars (Production / Preview / Development scopes)
- Supabase project dashboard settings (Auth → URL Configuration)
- Any external webhook integrations still pointing to old project (e.g. storage webhooks, edge functions, etc.)

---

## 8. Auth callback / redirect URL issues (most likely external setting)

This app’s primary login path is **email/password** (not OAuth), so it does not rely on an explicit `/auth/callback` route in code.

However, Supabase still validates redirects and “site URL” rules in some flows. You should confirm in the **new** Supabase project:

- **Site URL** includes your production domain (e.g. `https://rendorax.com` or `https://www.rendorax.com`).
- **Redirect URLs** include:
  - `https://<your-vercel-domain>/*` (or specific paths you use)
  - `https://rendorax.com/*` and/or `https://www.rendorax.com/*` if applicable
  - `http://localhost:3000/*` for local dev

Also ensure any admin portal domain is covered if it’s hosted separately.

---

## 9. Possible production env issue on Vercel (cannot be directly inspected here)

I cannot read your Vercel dashboard environment variables from this workspace, so treat this as the #1 verification step:

- Confirm **Vercel → Project → Settings → Environment Variables** are updated for:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - (and any server-only Supabase keys used by API routes)
- Confirm they are set for the right environments:
  - **Production**
  - **Preview** (if you use preview deployments)
  - **Development** (optional)

If Production still points to the old project, live login will fail even if local works.

---

## 10. Exact next steps for live authentication testing

### A) Pre-flight (15 minutes, no redeploy required unless env vars are wrong)

1. In Supabase (new project), verify **Auth → URL Configuration**:
   - Site URL = your live domain
   - Redirect URLs include your live domain(s) and Vercel domain(s)
2. In Vercel (production env):
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` contains **`bviltofeuqsibbgancby`**
   - Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is from the **new** project
3. In browser, open the live site in a fresh session:
   - Incognito window or clear cookies for your domain

### B) Live test flow (functional)

1. Visit `https://<live-domain>/access`
2. Attempt login with a known user in the **new** Supabase project
3. Expected:
   - Successful login message
   - Redirect to `/dashboard`
   - Refresh `/dashboard` (hard reload) should stay authenticated (middleware session refresh working)
4. Visit `/admin`:
   - If your user has `app_metadata.role=admin`, expect access
   - Otherwise expect redirect to `/dashboard`
5. Logout from dashboard header and confirm you are redirected back to `/access` when visiting `/dashboard`

### C) Live test flow (API + session validation)

From an authenticated session:
1. Hit a protected Next API route that uses Supabase SSR cookies (example: `/api/notify` with a trivial payload) and confirm it returns 200/expected behavior.
2. Hit a backend-proxy route (example: `/api/agency/tasks`) and confirm it returns 200 (or a structured error if no tasks), indicating Bearer token forwarding works.

### D) If login fails, fastest diagnosis checklist

- If you see **“Invalid login credentials”**: the user does not exist (or password mismatch) in the **new** Supabase project.
- If you see **redirect loops** between `/access` and `/dashboard`: session cookies aren’t being set/refreshed—usually wrong Vercel env vars or a Supabase URL mismatch.
- If `/dashboard` immediately redirects to `/access`: Supabase user lookup is failing in middleware; check production env vars first.

---

## Bottom line

- **Local configuration is consistent**: frontend + backend both point to `bviltofeuqsibbgancby` for Supabase auth, and backend DB URLs match the new project’s pooler host + username format.
- The only remaining unknown is **production configuration outside the repo**: Vercel env vars + Supabase Auth URL configuration.

