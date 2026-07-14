-- Picture Lock event log (append-only)

-- CreateEnum
CREATE TYPE "PictureLockEventType" AS ENUM (
  'locked',
  'unlocked'
);

-- CreateTable
CREATE TABLE "PictureLockEvent" (
  "id" TEXT NOT NULL,
  "mediaAssetId" TEXT NOT NULL,
  "agencyProjectId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorRole" "AgencyRole" NOT NULL,
  "eventType" "PictureLockEventType" NOT NULL,
  "integrityHash" TEXT,
  "objectKey" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PictureLockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PictureLockEvent_mediaAssetId_createdAt_idx"
  ON "PictureLockEvent"("mediaAssetId", "createdAt");

CREATE INDEX "PictureLockEvent_agencyProjectId_createdAt_idx"
  ON "PictureLockEvent"("agencyProjectId", "createdAt");

-- AddForeignKey
ALTER TABLE "PictureLockEvent"
  ADD CONSTRAINT "PictureLockEvent_mediaAssetId_fkey"
  FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PictureLockEvent"
  ADD CONSTRAINT "PictureLockEvent_agencyProjectId_fkey"
  FOREIGN KEY ("agencyProjectId") REFERENCES "AgencyProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PictureLockEvent"
  ADD CONSTRAINT "PictureLockEvent_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
