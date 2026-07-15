-- Master Delivery download access audit (append-only access_granted)

-- CreateEnum
CREATE TYPE "MasterDeliveryDownloadEventType" AS ENUM (
  'access_granted'
);

-- CreateTable
CREATE TABLE "MasterDeliveryDownloadEvent" (
  "id" TEXT NOT NULL,
  "masterDeliveryEventId" TEXT NOT NULL,
  "mediaAssetId" TEXT NOT NULL,
  "agencyProjectId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorRole" "AgencyRole" NOT NULL,
  "eventType" "MasterDeliveryDownloadEventType" NOT NULL DEFAULT 'access_granted',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MasterDeliveryDownloadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasterDeliveryDownloadEvent_masterDeliveryEventId_createdAt_idx"
  ON "MasterDeliveryDownloadEvent"("masterDeliveryEventId", "createdAt");

CREATE INDEX "MasterDeliveryDownloadEvent_mediaAssetId_createdAt_idx"
  ON "MasterDeliveryDownloadEvent"("mediaAssetId", "createdAt");

CREATE INDEX "MasterDeliveryDownloadEvent_agencyProjectId_createdAt_idx"
  ON "MasterDeliveryDownloadEvent"("agencyProjectId", "createdAt");

CREATE INDEX "MasterDeliveryDownloadEvent_actorId_createdAt_idx"
  ON "MasterDeliveryDownloadEvent"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "MasterDeliveryDownloadEvent"
  ADD CONSTRAINT "MasterDeliveryDownloadEvent_masterDeliveryEventId_fkey"
  FOREIGN KEY ("masterDeliveryEventId") REFERENCES "MasterDeliveryEvent"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MasterDeliveryDownloadEvent"
  ADD CONSTRAINT "MasterDeliveryDownloadEvent_mediaAssetId_fkey"
  FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MasterDeliveryDownloadEvent"
  ADD CONSTRAINT "MasterDeliveryDownloadEvent_agencyProjectId_fkey"
  FOREIGN KEY ("agencyProjectId") REFERENCES "AgencyProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MasterDeliveryDownloadEvent"
  ADD CONSTRAINT "MasterDeliveryDownloadEvent_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
