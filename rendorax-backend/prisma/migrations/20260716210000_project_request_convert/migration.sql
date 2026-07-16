-- Phase 4: Approved ProjectRequest → AgencyProject conversion (additive only)

ALTER TYPE "public"."ProjectRequestStatus" ADD VALUE IF NOT EXISTS 'converted_to_project';

ALTER TABLE "public"."ProjectRequest"
  ADD COLUMN IF NOT EXISTS "convertedAgencyProjectId" TEXT,
  ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "convertedByUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectRequest_convertedAgencyProjectId_key"
  ON "public"."ProjectRequest"("convertedAgencyProjectId");

CREATE INDEX IF NOT EXISTS "ProjectRequest_convertedByUserId_idx"
  ON "public"."ProjectRequest"("convertedByUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectRequest_convertedAgencyProjectId_fkey'
  ) THEN
    ALTER TABLE "public"."ProjectRequest"
      ADD CONSTRAINT "ProjectRequest_convertedAgencyProjectId_fkey"
      FOREIGN KEY ("convertedAgencyProjectId") REFERENCES "public"."AgencyProject"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectRequest_convertedByUserId_fkey'
  ) THEN
    ALTER TABLE "public"."ProjectRequest"
      ADD CONSTRAINT "ProjectRequest_convertedByUserId_fkey"
      FOREIGN KEY ("convertedByUserId") REFERENCES "public"."User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
