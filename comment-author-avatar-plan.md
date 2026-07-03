# Comment Author + Avatar — Inspection Plan

**Inspection date:** 2026-07-03  
**Status:** **Implemented — pending manual verify (local, 2026-07-03)** — production not verified  
**Goal:** Show commenter **display name** and **avatar** in the dashboard comments sidebar for multi-reviewer workflows.

### Feature summary

| Piece | Status |
|-------|--------|
| `author_display_name` column | ✅ SQL + insert |
| `author_avatar_url` column | ✅ SQL + insert |
| `resolveCommentAuthor()` | ✅ Session → name/avatar at insert |
| `CommentAuthorBadge` | ✅ Image or initials fallback |
| `CommentsPanel` author display | ✅ Name row above timestamp |
| Multi-reviewer support | ✅ Per-row denormalized author |
| Name fallback order | `full_name` → `name` → email local-part → `"Reviewer"` |

**Related:** `comment-review-workflow-map.md`, `comment-create-failure-trace.md`, `supabase-p0-legacy-review-tables.sql`

---

## Executive summary

Comments already store **`user_id`** on every row, but the UI **never reads or displays it**. `CommentsPanel` renders only scene thumbnail, timestamp, and `comment_text`.

There is **no `profiles` table**, **no avatar field** on Prisma `User`, and **no safe way** to query `auth.users` from the browser. The safest fit for the current architecture is:

1. **Denormalize author display fields on `video_comments` at insert time** (`author_display_name`, `author_avatar_url`), populated from the Supabase session (`user_metadata` / `email`).
2. **Render** name + avatar (or initials fallback) in `CommentsPanel` with minimal layout change.
3. **Optional later:** `public.profiles` table for editable names/avatars + backfill script for legacy rows.

**Not recommended as primary path:** Prisma `User` (incomplete population, no avatar) or frontend `auth.users` queries (blocked by Supabase API design).

---

## 1. Current comment data

### `video_comments` table (P0 SQL)

Defined in `supabase-p0-legacy-review-tables.sql`:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `uuid` PK | Edit/delete/socket dedupe |
| `file_name` | `text` | Scope key (= `previewFile.name`) |
| `user_id` | `uuid` FK → `auth.users` | Author identity |
| `time_stamp` | `double precision` | Seconds from `<video>.currentTime` |
| `comment_text` | `text` | Note body |
| `created_at` | `timestamptz` | Audit (not shown in UI today) |

**Missing for author UI:** no `author_display_name`, `author_avatar_url`, or join to a profile table.

### RLS (current)

| Policy | Rule |
|--------|------|
| `SELECT` | Any **authenticated** user can read **all** rows (`USING (true)`) |
| `INSERT` | `user_id = auth.uid()` |
| `UPDATE` / `DELETE` | Own rows only (`user_id = auth.uid()`) |

Multi-reviewer visibility is **already intended** at the data layer (all authenticated users see all comments for a `file_name`).

### `useLiveComments` (`hooks/useLiveComments.ts`)

| Operation | Query | Author data |
|-----------|-------|-------------|
| **Fetch** | `.from("video_comments").select("*").eq("file_name", fileName)` | Returns `user_id`; **not used in UI** |
| **Insert** | Sets `user_id: user.id` only | No name/avatar stored |
| **Socket** | Emits full `insertedComment` on `new-comment` | Receiver merges by `id`; partial type in handler |

```165:175:rendorax-frontend/hooks/useLiveComments.ts
    const { data, error } = await supabase
      .from("video_comments")
      .insert([
        {
          file_name: previewFile.name,
          user_id: user.id,
          time_stamp: currentTime,
          comment_text: commentTextToSend,
        },
      ])
      .select();
```

### `CommentsPanel` (`components/CommentsPanel.tsx`)

Each comment row (~61–127):

- `CommentSceneThumbnail` (optional when video selected)
- Timestamp button → `jumpToTime`
- `comment_text`
- Edit/delete on hover

**No author name, no avatar, no `user_id` reference.**

### Admin (`app/admin/page.tsx`)

Same pattern: `select("*")` by `file_name` + `user_id` filter for selected client — displays timestamp + text only (~774–788).

---

## 2. Available user / profile data

### Supabase auth session (dashboard)

Loaded in `app/dashboard/page.tsx` via `supabase.auth.getSession()` → `setUser(session.user)`.

| Field | Available | Used for comments today |
|-------|-----------|-------------------------|
| `user.id` | Yes | Stored as `user_id` on insert |
| `user.email` | Yes | Notify API only |
| `user.user_metadata` | Yes | RBAC in other hooks; **not** read for display name |
| `user.app_metadata.role` | Yes | Editor/admin gate |
| `user.user_metadata.avatar_url` / `picture` | **Maybe** (OAuth providers) | Not used |
| `user.user_metadata.full_name` / `name` | **Maybe** | Not used |

`create-admin.ts` only sets `user_metadata.role` and `app_metadata.role` — **no display name or avatar** for admin provisioned users.

### Prisma `User` (`prisma/schema.prisma`)

```134:147:rendorax-backend/prisma/schema.prisma
model User {
  id             String          @id
  email          String          @unique
  displayName    String?
  role           AgencyRole      @default(editor)
  ...
}
```

| Fact | Implication |
|------|-------------|
| `id` matches Supabase `auth.users.id` | Could theoretically join |
| `displayName` optional | Often **empty** — only upserted via agency API routes |
| **No `avatarUrl`** | Cannot source avatars from Prisma today |
| Not used by comment flow | Parallel system; comment writes bypass backend |

### `public.profiles` / `user_roles`

| Table | Status |
|-------|--------|
| `profiles` | **Does not exist** in repo SQL or migrations |
| `user_roles` | Listed in `prisma.config.ts` only — **no app usage** |

### Browser `auth.users` access

**Not available** via PostgREST with anon/authenticated JWT. Clients cannot `select` from `auth.users` directly. Resolving other reviewers’ emails/names requires either:

- Denormalized fields on `video_comments`, or
- A **`public` profile table** with RLS, or
- A **server API** using service role / admin API.

---

## 3. Best data source (recommendation)

| Option | Verdict | Why |
|--------|---------|-----|
| **A. Denormalize on `video_comments`** | **Recommended (Phase 1)** | Matches direct Supabase insert/fetch; no extra queries; works with Socket.io broadcast; no service role in browser |
| **B. `public.profiles` + join** | **Good Phase 2** | Normalized, editable display names; requires SQL + sync on login/signup |
| **C. Prisma `User`** | **Not recommended** | Incomplete data, no avatar, comments don’t use backend |
| **D. Supabase `user_metadata` only (no DB)** | **Insufficient** | Can style **current** user on insert, but **cannot** resolve other users’ metadata for existing rows without server |
| **E. Next.js API batch resolve** | **Fallback** | `GET /api/comment-authors?ids=` with service role; extra latency; no migration but more moving parts |

### Recommended architecture

**Phase 1 (minimal safe):** Add nullable columns to `video_comments`, set at insert from session helper, render in `CommentsPanel`.

**Phase 2 (optional):** Add `public.profiles` synced from auth; backfill `video_comments` or migrate reads to join `profiles` for live updates when users change display name.

---

## 4. Required UI behavior

| Requirement | Approach |
|-------------|----------|
| Show avatar | `<img>` when `author_avatar_url` truthy; else initials circle |
| Show display name | `author_display_name` above timestamp/text |
| Fallback name | `email` local-part → `"Reviewer"` |
| Fallback avatar | Initials from display name (1–2 chars), existing gold/zinc palette |
| Preserve layout | Add **small author row** above existing timestamp line; keep thumbnail left, edit/delete right |
| Multi-user | Each row uses **its own** denormalized fields (or profile join later) |

**Suggested row structure (no redesign):**

```text
[thumb]  (avatar) Display Name
         00:42  Comment text...
                              [edit][delete]
```

---

## 5. Data loading strategy

### Constraints

- **Do not** expose service role in frontend.
- **Do not** query `auth.users` from browser.
- **Preserve** direct Supabase client writes (no mandatory backend proxy for create).

### Phase 1 loading

1. **Fetch:** unchanged `select("*")` — new columns included automatically.
2. **Insert:** extend payload with `author_display_name`, `author_avatar_url` from `resolveCommentAuthor(user)`.
3. **Socket:** `new-comment` already spreads `insertedComment` — new fields propagate if present.
4. **Legacy rows** (null author columns): UI fallback `"Reviewer"` + initials `"?"` or first letter of `"R"`.

### Phase 2 loading (profiles)

```typescript
.select(`
  *,
  author:profiles!user_id ( display_name, avatar_url )
`)
```

Requires `profiles.id` = `auth.users.id` FK and RLS allowing authenticated read of display fields.

### Session helper (new util, proposed)

```typescript
// utils/commentAuthor.ts (proposed)
export function resolveCommentAuthor(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  const displayName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0] ||
    "Reviewer";
  const avatarUrl =
    (meta.avatar_url as string) ||
    (meta.picture as string) ||
    null;
  return { author_display_name: displayName, author_avatar_url: avatarUrl };
}
```

---

## 6. Risk analysis

| Risk | Severity | Mitigation |
|------|----------|------------|
| **RLS on new columns** | Low | Columns on same table; existing SELECT policy covers them |
| **Cross-client comment visibility** | Medium (by design) | Already true — author labels **improve** clarity; do not add email to UI unless product wants it |
| **Stale denormalized names** | Low | Acceptable for v1; Phase 2 profiles fix |
| **Missing profile data** | Medium | Fallbacks; backfill script for old rows |
| **OAuth vs email users** | Low | Helper checks `avatar_url` / `picture` metadata keys |
| **Socket partial payload** | Low | Ensure emit sends full inserted row (already does) |
| **Performance** | Low | No N+1; single `select("*")` |
| **Admin page parity** | Low | Same columns benefit admin client notes panel |
| **Privacy / GDPR** | Low–Medium | Store display name only; avoid persisting full email in comment row unless required |

---

## 7. Minimal safe implementation proposal

**Do not implement until approved.**

### Option A — Recommended (SQL + frontend, no backend required)

#### Database (SQL migration — new file, e.g. `supabase-p1-comment-author-columns.sql`)

```sql
ALTER TABLE public.video_comments
  ADD COLUMN IF NOT EXISTS author_display_name text,
  ADD COLUMN IF NOT EXISTS author_avatar_url text;
```

Optional one-time backfill (service role script / SQL Editor):

```sql
-- Example: set null names to generic label (cannot read auth.users from SQL without admin)
UPDATE public.video_comments
SET author_display_name = 'Reviewer'
WHERE author_display_name IS NULL;
```

For real backfill of historical comments, use a **one-off Node script** with `SUPABASE_SERVICE_ROLE_KEY` + `auth.admin.getUserById(user_id)` per distinct `user_id`.

#### Files likely to change

| File | Change |
|------|--------|
| `supabase-p1-comment-author-columns.sql` | **New** — column migration |
| `utils/commentAuthor.ts` | **New** — `resolveCommentAuthor`, `getAuthorInitials` |
| `hooks/useLiveComments.ts` | Insert author fields; optional comment type |
| `components/CommentsPanel.tsx` | Author row (avatar + name); fallbacks |
| `components/CommentAuthorBadge.tsx` | **New** (optional) — small avatar/initials component |
| `app/admin/page.tsx` | Optional — same author display for parity |
| `comment-review-workflow-map.md` | Doc update after verify |
| `rendorax-project-checklist.md` | Track item |

**Not required for v1:** backend routes, Prisma schema, env changes.

#### Frontend-only?

**Almost** — still needs **SQL migration** for new columns. Insert/fetch/render can stay client-side.

#### Test steps (local)

1. Apply SQL migration on dev Supabase project.
2. User A posts comment → sidebar shows A’s name + avatar/initials.
3. User B (different browser/session) posts on same video → both comments show distinct authors.
4. Legacy comment (null author columns) → shows `"Reviewer"` + initials fallback.
5. Socket live sync: second client sees author on incoming `comment-added`.
6. Edit/delete still work; timestamp jump + thumbnail unchanged.
7. Notify / compile / download report unchanged.
8. Admin client notes panel (optional check).

---

### Option B — Profiles table (larger, normalized)

#### Database

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);
-- RLS: authenticated SELECT for all; UPDATE own row only
```

Plus: upsert profile on dashboard login (`page.tsx` or auth callback).

#### Files

All of Option A **plus** profile sync hook, join in `fetchComments`, migration SQL.

**Use when:** users need to **edit** display name/avatar in-app.

---

### Option C — API resolver only (no SQL)

`app/api/comments/authors/route.ts` — POST `{ userIds: string[] }` → service role batch lookup → `{ [id]: { name, avatarUrl } }`.

**Downsides:** extra request per preview load, caching logic needed, still no historical snapshot if auth user deleted.

---

## Comparison matrix

| Criterion | A Denormalize | B Profiles | C API |
|-----------|---------------|------------|-------|
| Matches current Supabase-direct flow | ✅ | ✅ | ⚠️ |
| Shows other reviewers | ✅ | ✅ | ✅ |
| SQL migration | Small | Medium | None |
| Backend work | None | Optional sync | Required |
| Service role in browser | ❌ No | ❌ No | ❌ No (server only) |
| Name updates propagate | ❌ | ✅ | ✅ |
| Implementation size | **Small** | Medium | Medium |

---

## Approval gate

| Step | Status |
|------|--------|
| Inspection | ✅ Complete |
| Recommended approach | **Option A** — denormalized `author_*` columns + session helper + `CommentsPanel` |
| SQL migration | ✅ `supabase-p1-comment-author-columns.sql` (apply in Supabase before test) |
| Implementation | ✅ Complete (2026-07-03) |
| Manual verification | ⏳ **Pending (local)** — feature working per team QA; formal sign-off pending |
| Production verification | ⏳ Pending |

---

## Implementation summary (2026-07-03)

### Files changed

| File | Change |
|------|--------|
| `supabase-p1-comment-author-columns.sql` | **New** — `author_display_name`, `author_avatar_url` nullable columns |
| `rendorax-frontend/utils/commentAuthor.ts` | **New** — `resolveCommentAuthor`, `getCommentDisplayName`, `getAuthorInitials`, `VideoCommentRow` |
| `rendorax-frontend/components/CommentAuthorBadge.tsx` | **New** — avatar image or initials fallback |
| `rendorax-frontend/hooks/useLiveComments.ts` | Insert author fields from session; typed comments |
| `rendorax-frontend/components/CommentsPanel.tsx` | Author badge + name row above timestamp |

### Behavior

- **Insert:** `full_name` → `name` → email local-part → `"Reviewer"`; avatar from `avatar_url` or `picture`.
- **Display:** Stored `author_display_name` / `author_avatar_url`; legacy null → `"Reviewer"` + initials.
- **Unchanged:** `user_id`, `comment_text`, `time_stamp`, scene thumbnails, edit/delete, socket sync.

### Manual test (after SQL apply)

1. Run `supabase-p1-comment-author-columns.sql` in Supabase SQL Editor.
2. Post comment as User A → name + avatar/initials visible.
3. Second session User B on same video → distinct authors.
4. Legacy comments → `"Reviewer"` fallback.
5. Timestamp jump + thumbnail still work.

---

## References (code)

| Piece | Path |
|-------|------|
| P0 table DDL | `supabase-p0-legacy-review-tables.sql` |
| Comment hook | `rendorax-frontend/hooks/useLiveComments.ts` |
| Comment UI | `rendorax-frontend/components/CommentsPanel.tsx` |
| Scene thumbnail | `rendorax-frontend/components/CommentSceneThumbnail.tsx` |
| Session user | `rendorax-frontend/app/dashboard/page.tsx` (~561–586) |
| Socket relay | `rendorax-backend/index.ts` (`new-comment` / `comment-added`) |
| Prisma User | `rendorax-backend/prisma/schema.prisma` |
| Workflow map | `comment-review-workflow-map.md` |
