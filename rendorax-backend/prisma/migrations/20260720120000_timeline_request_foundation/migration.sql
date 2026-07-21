-- Phase 2A Slice 2: TimelineRequest foundation (additive only).
-- Persists async request lifecycle; live playback host state remains ephemeral.

CREATE TYPE "TimelineRequestStatus" AS ENUM (
  'pending',
  'accepted',
  'active',
  'ended',
  'declined',
  'cancelled'
);

CREATE TABLE "TimelineRequest" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "agencyProjectId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "assignedEditorId" TEXT,
  "acceptedById" TEXT,
  "status" "TimelineRequestStatus" NOT NULL DEFAULT 'pending',
  "message" TEXT,
  "reviewRoomId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "declineReason" TEXT,

  CONSTRAINT "TimelineRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TimelineRequest_requesterId_createdAt_idx"
  ON "TimelineRequest"("requesterId", "createdAt");

CREATE INDEX "TimelineRequest_assetId_status_idx"
  ON "TimelineRequest"("assetId", "status");

CREATE INDEX "TimelineRequest_agencyProjectId_status_createdAt_idx"
  ON "TimelineRequest"("agencyProjectId", "status", "createdAt");

CREATE INDEX "TimelineRequest_status_createdAt_idx"
  ON "TimelineRequest"("status", "createdAt");

ALTER TABLE "TimelineRequest"
  ADD CONSTRAINT "TimelineRequest_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TimelineRequest"
  ADD CONSTRAINT "TimelineRequest_agencyProjectId_fkey"
  FOREIGN KEY ("agencyProjectId") REFERENCES "AgencyProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TimelineRequest"
  ADD CONSTRAINT "TimelineRequest_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TimelineRequest"
  ADD CONSTRAINT "TimelineRequest_assignedEditorId_fkey"
  FOREIGN KEY ("assignedEditorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TimelineRequest"
  ADD CONSTRAINT "TimelineRequest_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
