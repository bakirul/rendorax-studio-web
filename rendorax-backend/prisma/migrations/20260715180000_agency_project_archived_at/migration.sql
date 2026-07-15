-- Soft archive for AgencyProject (lifecycle flag, not phase)

ALTER TABLE "AgencyProject"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "AgencyProject_archivedAt_idx"
  ON "AgencyProject"("archivedAt");
