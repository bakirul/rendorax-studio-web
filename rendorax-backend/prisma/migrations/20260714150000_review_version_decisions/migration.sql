-- Review Version Decision audit log (append-only)

-- CreateEnum
CREATE TYPE "ReviewDecisionStatus" AS ENUM (
  'submitted_for_review',
  'approved',
  'revision_requested',
  'admin_override'
);

-- CreateTable
CREATE TABLE "ReviewVersionDecision" (
  "id" TEXT NOT NULL,
  "mediaAssetId" TEXT NOT NULL,
  "agencyProjectId" TEXT NOT NULL,
  "status" "ReviewDecisionStatus" NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorRole" "AgencyRole" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReviewVersionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewVersionDecision_mediaAssetId_createdAt_idx"
  ON "ReviewVersionDecision"("mediaAssetId", "createdAt");

CREATE INDEX "ReviewVersionDecision_agencyProjectId_createdAt_idx"
  ON "ReviewVersionDecision"("agencyProjectId", "createdAt");

-- AddForeignKey
ALTER TABLE "ReviewVersionDecision"
  ADD CONSTRAINT "ReviewVersionDecision_mediaAssetId_fkey"
  FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewVersionDecision"
  ADD CONSTRAINT "ReviewVersionDecision_agencyProjectId_fkey"
  FOREIGN KEY ("agencyProjectId") REFERENCES "AgencyProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewVersionDecision"
  ADD CONSTRAINT "ReviewVersionDecision_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
