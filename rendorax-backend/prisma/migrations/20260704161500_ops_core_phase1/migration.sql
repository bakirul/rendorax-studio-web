-- Operations Core Phase 1 (WP1)
-- AgencyProject brief fields + MediaAsset.agencyProjectId FK

-- AlterTable
ALTER TABLE "AgencyProject" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "editingStyle" TEXT,
ADD COLUMN     "referenceLinks" TEXT,
ADD COLUMN     "videoLength" TEXT,
ALTER COLUMN "status" SET DEFAULT 'Awaiting Assets';

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "agencyProjectId" TEXT;

-- CreateIndex
CREATE INDEX "MediaAsset_agencyProjectId_idx" ON "MediaAsset"("agencyProjectId");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_agencyProjectId_fkey" FOREIGN KEY ("agencyProjectId") REFERENCES "AgencyProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
