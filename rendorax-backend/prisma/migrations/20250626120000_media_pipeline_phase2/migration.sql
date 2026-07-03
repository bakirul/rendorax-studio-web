-- Phase 2: additive media pipeline schema (zero-downtime)
-- Apply with: npx prisma db push  OR  prisma migrate deploy

CREATE TYPE "public"."MediaProcessingStatus" AS ENUM (
  'queued',
  'probing',
  'transcoding',
  'uploading',
  'ready',
  'failed'
);

CREATE TYPE "public"."MediaPlaybackFormat" AS ENUM (
  'hls',
  'progressive',
  'none'
);

ALTER TABLE "public"."MediaAsset"
  ADD COLUMN IF NOT EXISTS "durationMs" INTEGER,
  ADD COLUMN IF NOT EXISTS "width" INTEGER,
  ADD COLUMN IF NOT EXISTS "height" INTEGER,
  ADD COLUMN IF NOT EXISTS "frameRate" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "playbackObjectKey" TEXT,
  ADD COLUMN IF NOT EXISTS "playbackFormat" "public"."MediaPlaybackFormat",
  ADD COLUMN IF NOT EXISTS "processingStatus" "public"."MediaProcessingStatus",
  ADD COLUMN IF NOT EXISTS "proxyVersion" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "MediaAsset_processingStatus_idx"
  ON "public"."MediaAsset" ("processingStatus");

CREATE TABLE IF NOT EXISTS "public"."MediaProcessingJob" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "status" "public"."MediaProcessingStatus" NOT NULL DEFAULT 'queued',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "workerId" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaProcessingJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaProcessingJob_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "public"."MediaAsset"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MediaProcessingJob_assetId_idx"
  ON "public"."MediaProcessingJob" ("assetId");

CREATE INDEX IF NOT EXISTS "MediaProcessingJob_status_idx"
  ON "public"."MediaProcessingJob" ("status");

CREATE INDEX IF NOT EXISTS "MediaProcessingJob_createdAt_idx"
  ON "public"."MediaProcessingJob" ("createdAt");
