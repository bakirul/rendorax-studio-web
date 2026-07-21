-- Phase 2A Slice 2.1: DB-level open TimelineRequest uniqueness.
-- Additive only. Partial unique index (not represented in Prisma schema DSL).

CREATE UNIQUE INDEX "TimelineRequest_requester_asset_open_uidx"
  ON "public"."TimelineRequest" ("requesterId", "assetId")
  WHERE "status" IN ('pending', 'accepted', 'active');
