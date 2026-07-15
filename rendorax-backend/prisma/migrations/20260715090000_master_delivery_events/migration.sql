-- Master Delivery event log (append-only)

-- CreateEnum
CREATE TYPE "MasterDeliveryEventType" AS ENUM (
  'delivered',
  'replaced',
  'restored',
  'expired'
);

-- CreateTable
CREATE TABLE "MasterDeliveryEvent" (
  "id" TEXT NOT NULL,
  "mediaAssetId" TEXT NOT NULL,
  "agencyProjectId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorRole" "AgencyRole" NOT NULL,
  "eventType" "MasterDeliveryEventType" NOT NULL,
  "sourceReviewAssetId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MasterDeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasterDeliveryEvent_mediaAssetId_createdAt_idx"
  ON "MasterDeliveryEvent"("mediaAssetId", "createdAt");

CREATE INDEX "MasterDeliveryEvent_agencyProjectId_createdAt_idx"
  ON "MasterDeliveryEvent"("agencyProjectId", "createdAt");

CREATE INDEX "MasterDeliveryEvent_sourceReviewAssetId_idx"
  ON "MasterDeliveryEvent"("sourceReviewAssetId");

-- AddForeignKey
ALTER TABLE "MasterDeliveryEvent"
  ADD CONSTRAINT "MasterDeliveryEvent_mediaAssetId_fkey"
  FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MasterDeliveryEvent"
  ADD CONSTRAINT "MasterDeliveryEvent_agencyProjectId_fkey"
  FOREIGN KEY ("agencyProjectId") REFERENCES "AgencyProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MasterDeliveryEvent"
  ADD CONSTRAINT "MasterDeliveryEvent_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MasterDeliveryEvent"
  ADD CONSTRAINT "MasterDeliveryEvent_sourceReviewAssetId_fkey"
  FOREIGN KEY ("sourceReviewAssetId") REFERENCES "MediaAsset"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
