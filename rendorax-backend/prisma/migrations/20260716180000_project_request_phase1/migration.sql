-- Phase 1: Project Request intake (pre-AgencyProject).
-- Additive only: enum + ClientOrganization + ProjectRequest.

CREATE TYPE "ProjectRequestStatus" AS ENUM (
  'submitted',
  'needs_clarification',
  'under_review',
  'approved',
  'rejected'
);

CREATE TABLE "ClientOrganization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "primaryContactUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientOrganization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientOrganization_primaryContactUserId_key"
  ON "ClientOrganization"("primaryContactUserId");

CREATE INDEX "ClientOrganization_name_idx"
  ON "ClientOrganization"("name");

ALTER TABLE "ClientOrganization"
  ADD CONSTRAINT "ClientOrganization_primaryContactUserId_fkey"
  FOREIGN KEY ("primaryContactUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ProjectRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "submittedByUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "projectType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "referenceLinks" TEXT,
  "deadlineAt" TIMESTAMP(3),
  "deliverables" TEXT NOT NULL,
  "budgetRange" TEXT,
  "status" "ProjectRequestStatus" NOT NULL DEFAULT 'submitted',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectRequest_organizationId_createdAt_idx"
  ON "ProjectRequest"("organizationId", "createdAt");

CREATE INDEX "ProjectRequest_status_createdAt_idx"
  ON "ProjectRequest"("status", "createdAt");

CREATE INDEX "ProjectRequest_submittedByUserId_idx"
  ON "ProjectRequest"("submittedByUserId");

ALTER TABLE "ProjectRequest"
  ADD CONSTRAINT "ProjectRequest_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "ClientOrganization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectRequest"
  ADD CONSTRAINT "ProjectRequest_submittedByUserId_fkey"
  FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
