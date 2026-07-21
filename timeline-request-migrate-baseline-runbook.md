# TimelineRequest — Prisma Migrate Baseline Runbook

**Created:** 2026-07-20  
**Type:** Operations runbook only — do **not** execute as part of Slice 2.1  
**Context:** Shared Supabase DB has tables from `prisma db push` but **no** `public._prisma_migrations` table. `prisma migrate deploy` returns **P3005**.

---

## Preconditions

1. Full Postgres backup (Supabase PITR and/or `pg_dump`).
2. Prefer a **staging clone** of the database before touching production history.
3. Confirm `DIRECT_URL` points at the intended database (port 5432 direct, not pooler if CLI requires it).
4. Diff live schema vs `prisma/migrations/*` folders (or introspect) so every folder you mark `--applied` truly matches live objects.
5. Confirm `TimelineRequest` + `TimelineRequestStatus` already exist if marking foundation migration applied (they do after Slice 2 `db push`).
6. Confirm partial unique index `TimelineRequest_requester_asset_open_uidx` exists before marking Slice 2.1 migration applied (or create it first via its SQL file).

---

## Ordered operations (do not skip backup)

1. **Backup** the target database.
2. On the verified environment, from `rendorax-backend/`:
   ```bash
   npx prisma migrate resolve --applied "20250626120000_media_pipeline_phase2"
   ```
   Repeat `--applied` for **every** older migration folder that is already reflected in the live schema (full list under `prisma/migrations/`).
3. Special case — foundation already created by `db push`:
   ```bash
   npx prisma migrate resolve --applied "20260720120000_timeline_request_foundation"
   ```
   Do **not** run that migration’s `CREATE TYPE` / `CREATE TABLE` SQL again.
4. Special case — open unique index (Slice 2.1):
   - If index already applied via `prisma db execute`, mark:
     ```bash
     npx prisma migrate resolve --applied "20260720140000_timeline_request_open_unique_index"
     ```
   - If index is missing, run the SQL file first, then mark `--applied`.
5. Verify:
   ```bash
   npx prisma migrate status
   ```
   Expect up to date / no pending migrations.
6. Thereafter: **new** schema changes only via new migration folders + `npx prisma migrate deploy` (never mark unapplied SQL as applied).

---

## Avoid marking unapplied as applied

Only use `--applied` when the migration’s objects are **verified present**.  
If a folder’s SQL is not in the DB, apply the SQL (or fix drift) first — never mark blindly.

## Rollback

Restore from backup. `migrate resolve --rolled-back` only removes the history row; it does not undo DDL.

## Future policy

- Stop using `db push` against shared/production once baseline is complete.
- Local empty DBs may still use migrate from scratch.
- App deploys that assume schema already exist remain safe only after objects are present; Migrate history is required for automated deploy pipelines.

**Do not include secrets, connection strings, or passwords in copies of this runbook.**
