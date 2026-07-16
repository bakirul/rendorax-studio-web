-- Phase 2: Project Proposal + quoted request status.
-- Additive only.

ALTER TYPE "ProjectRequestStatus" ADD VALUE IF NOT EXISTS 'quoted';

CREATE TYPE "ProjectProposalStatus" AS ENUM (
  'draft',
  'sent',
  'changes_requested',
  'approved',
  'rejected'
);

CREATE TABLE "ProjectProposal" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "estimatedCostCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "timelineText" TEXT NOT NULL,
  "deliverablesText" TEXT NOT NULL,
  "notes" TEXT,
  "termsText" TEXT,
  "status" "ProjectProposalStatus" NOT NULL DEFAULT 'draft',
  "sentAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectProposal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectProposal_requestId_version_key"
  ON "ProjectProposal"("requestId", "version");

CREATE INDEX "ProjectProposal_requestId_status_idx"
  ON "ProjectProposal"("requestId", "status");

ALTER TABLE "ProjectProposal"
  ADD CONSTRAINT "ProjectProposal_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "ProjectRequest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectProposal"
  ADD CONSTRAINT "ProjectProposal_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProjectProposal"
  ADD CONSTRAINT "ProjectProposal_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
