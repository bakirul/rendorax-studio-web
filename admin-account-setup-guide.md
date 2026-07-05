# Admin Account Setup — Operator Guide (Supabase Dashboard)

**Created:** 2026-07-04  
**Type:** Documentation only — no code changes, no script execution, no password resets  
**Target account:** `admin-studio@kachnamedia.com`  
**Target password (new user only):** `KachnaStudio2026#`  
**Target Supabase project:** `bviltofeuqsibbgancby`  
**Related inspection:** `admin-login-failure-trace.md`

---

## Before you start

| Rule | Why |
|------|-----|
| Work only in project **`bviltofeuqsibbgancby`** | Wrong project = user created in the wrong place; login still fails |
| Do **not** run `create-admin.ts` or other repo scripts for this procedure | This guide uses Dashboard only |
| Do **not** reset an existing user’s password as part of this guide | If the user already exists, verify identity and role first; password changes are a separate, explicit decision |
| Set **`app_metadata.role`**, not only `user_metadata` | Rendorax middleware reads `app_metadata.role === "admin"` for `/admin` |

**Dashboard URL:** [https://supabase.com/dashboard](https://supabase.com/dashboard)

---

## Step 1 — Confirm the correct Supabase project

1. Open the Supabase Dashboard and select the Rendorax Studio project.
2. Go to **Project Settings** (gear icon) → **General**.
3. Under **Project ID** / **Reference ID**, confirm the value is:

   ```
   bviltofeuqsibbgancby
   ```

4. Optional cross-check — **Project Settings** → **API**:
   - **Project URL** should be: `https://bviltofeuqsibbgancby.supabase.co`

5. Confirm your **local or deployed app** uses the same project:
   - Frontend env: `NEXT_PUBLIC_SUPABASE_URL=https://bviltofeuqsibbgancby.supabase.co`
   - If the app points at a different project ref, login will fail even after a correct Dashboard setup.

**Stop here if the reference ID does not match.** Switch to the correct project before continuing.

---

## Step 2 — Check whether `admin-studio@kachnamedia.com` exists

### Option A — Authentication UI (recommended first)

1. Go to **Authentication** → **Users**.
2. Use the search box and enter:

   ```
   admin-studio@kachnamedia.com
   ```

3. Record what you find:

   | Result | Next step |
   |--------|-----------|
   | **No user** | Continue to **Step 3** (create user) |
   | **User found** | Skip to **Step 5** (verify/set `app_metadata`) and **Step 6** (login test). Do **not** change password unless a separate password-recovery process is approved |

### Option B — SQL Editor (read-only check)

1. Go to **SQL Editor** → **New query**.
2. Run:

   ```sql
   SELECT
     id,
     email,
     email_confirmed_at,
     created_at,
     raw_app_meta_data->>'role' AS app_role,
     raw_user_meta_data->>'role' AS user_role
   FROM auth.users
   WHERE email = 'admin-studio@kachnamedia.com';
   ```

3. Interpret results:

   | Rows returned | Meaning |
   |---------------|---------|
   | **0 rows** | User does not exist → **Step 3** |
   | **1 row** | User exists → note `id`, `email_confirmed_at`, and `app_role` → **Step 5** |

---

## Step 3 — Create the user (only if missing)

> Skip this step if Step 2 found an existing user.

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Fill in:

   | Field | Value |
   |-------|-------|
   | **Email address** | `admin-studio@kachnamedia.com` |
   | **Password** | `KachnaStudio2026#` |
   | **Auto Confirm User?** | **Yes** (enabled) |

3. Click **Create user**.
4. Copy the new **User UID** from the user detail page — you may need it for verification or Prisma sync later.

**Why Auto Confirm:** The app has no signup or email-confirmation flow. Unconfirmed users may be blocked from `signInWithPassword` depending on Auth settings.

---

## Step 4 — Password

For a **newly created** user (Step 3), the password is already set to:

```
KachnaStudio2026#
```

### If the user already existed before this guide

- **Do not** change the password here unless an authorized operator explicitly approves a password reset.
- Test login with the known password first.
- If login fails with `Invalid login credentials`, treat password recovery as a **separate** procedure (Dashboard **Send password recovery** or an approved reset workflow).

---

## Step 5 — Set `app_metadata.role` to `admin`

Rendorax requires this exact shape in **app metadata** (not user metadata alone):

```json
{
  "role": "admin"
}
```

### Option A — User detail page (if available)

1. **Authentication** → **Users** → open `admin-studio@kachnamedia.com`.
2. Find **App Metadata** or **Raw App Meta Data**.
3. Set or merge:

   ```json
   {
     "role": "admin"
   }
   ```

4. Save.

### Option B — SQL Editor (reliable)

1. **SQL Editor** → **New query**.
2. Run:

   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   WHERE email = 'admin-studio@kachnamedia.com';
   ```

3. Verify:

   ```sql
   SELECT
     email,
     raw_app_meta_data->>'role' AS app_role
   FROM auth.users
   WHERE email = 'admin-studio@kachnamedia.com';
   ```

   Expected: `app_role` = `admin`.

### Optional — `user_metadata` (not sufficient alone)

The repo bootstrap script also sets `user_metadata.role`. The app’s `/admin` gate does **not** use this field, but setting it keeps metadata consistent:

```json
{
  "role": "admin"
}
```

### After changing metadata

Existing sessions may still carry the old JWT. The operator should **sign out** (or use an incognito window) and **sign in again** so the new `app_metadata` is present in the token.

---

## Step 6 — Verify login in the app

Use a **private/incognito** window to avoid stale cookies.

### 6.1 Confirm app environment

Before testing, confirm the running app’s `NEXT_PUBLIC_SUPABASE_URL` targets `bviltofeuqsibbgancby` (local `.env.local` or production Vercel env).

### 6.2 Test `/access` (login)

1. Open the app login page: **`/access`**  
   Example local: `http://localhost:3000/access`
2. Enter:

   | Field | Value |
   |-------|-------|
   | Email | `admin-studio@kachnamedia.com` |
   | Password | `KachnaStudio2026#` |

3. Submit.

   | Expected | Failure signal |
   |----------|----------------|
   | No error on the form; redirect toward dashboard | `Invalid login credentials` → wrong project, wrong password, or user missing |
   | | `Email not confirmed` → enable Auto Confirm or confirm user in Dashboard |

### 6.3 Test `/dashboard`

1. After login, you should land on **`/dashboard`** (or be redirected there).
2. Expected: dashboard loads; you are not bounced back to `/access`.
3. If redirected to `/access?redirectTo=/dashboard`: session cookies not set — check Supabase **Authentication** → **URL Configuration** (Site URL / redirect URLs) for your deployment domain.

### 6.4 Test `/admin`

1. Navigate to **`/admin`**.
2. Expected: Admin HQ page loads.

   | Result | Likely cause |
   |--------|----------------|
   | **Admin page loads** | `app_metadata.role` is correct |
   | **Redirect to `/dashboard`** | `app_metadata.role` is missing or not `"admin"` → repeat Step 5, then sign out and sign in again |

### 6.5 Quick checklist

- [ ] Project ref is `bviltofeuqsibbgancby`
- [ ] User `admin-studio@kachnamedia.com` exists and is confirmed
- [ ] `raw_app_meta_data.role` = `admin`
- [ ] `/access` login succeeds
- [ ] `/dashboard` loads without redirect loop
- [ ] `/admin` loads (not redirected to dashboard)

### Optional — Prisma `User` row

Login does **not** require a Prisma row. After first use of agency APIs, `ensureAgencyUser()` may create one automatically. No Dashboard action is required for basic login and `/admin` access.

---

## Step 7 — `admin-studio@kachnamedia.com` vs `admin-studio@rendorax.com`

These are **two different admin identities**. Only the account that exists in project `bviltofeuqsibbgancby` with the correct password and `app_metadata.role` will work.

| | **`admin-studio@kachnamedia.com`** | **`admin-studio@rendorax.com`** |
|---|-----------------------------------|--------------------------------|
| **Purpose in this guide** | **Target operator account** — the email you are provisioning for Kachna Media studio access | **Repo bootstrap default** — hardcoded in `rendorax-backend/scripts/create-admin.ts` |
| **Default password in repo** | `KachnaStudio2026#` (operator-chosen for this guide) | `RendoraxStudio2026#` (script default) |
| **Referenced in codebase** | Not in bootstrap script; suitable as production/studio admin email | Created if someone runs `create-admin.ts` unchanged |
| **Domain meaning** | `kachnamedia.com` — aligns with studio/brand operator email | `rendorax.com` — product/project domain in dev bootstrap |
| **Can both exist?** | Yes — they are separate Supabase Auth users with separate UUIDs | Same |
| **Which should you use?** | Use **`admin-studio@kachnamedia.com`** if that is the agreed production admin for studio operators | Use **`admin-studio@rendorax.com`** only if that is the account you intentionally created via the bootstrap script |

### Practical guidance

1. **Pick one canonical admin email** for operators and document it in your runbook (avoid maintaining two admins with different passwords unless required).
2. If `admin-studio@rendorax.com` already exists from an old script run but operators expect `admin-studio@kachnamedia.com`, that does **not** mean they are the same user — create or fix the **kachnamedia** account per this guide.
3. Migrating to project `bviltofeuqsibbgancby` did **not** copy users from older Supabase projects; either email must be **explicitly created** in the new project.
4. For `/admin` access, **both** accounts would need `app_metadata.role = "admin"` independently.

---

## Troubleshooting (operator)

| Symptom | Check |
|---------|--------|
| `Invalid login credentials` | Correct project? User exists? Password matches? |
| Login OK, `/admin` → `/dashboard` | `app_metadata.role` not `admin`; re-login after metadata fix |
| Redirect loop `/access` ↔ `/dashboard` | Site URL / cookie domain; try incognito |
| Works locally, fails in production | Vercel env vars must use `bviltofeuqsibbgancby` keys |

---

## What this guide does not do

- Does not modify application code
- Does not run `create-admin.ts` or other automation
- Does not reset passwords on existing users
- Does not deploy or change Vercel/Render configuration

For architecture and failure analysis, see **`admin-login-failure-trace.md`**.

---

*End of operator guide.*
