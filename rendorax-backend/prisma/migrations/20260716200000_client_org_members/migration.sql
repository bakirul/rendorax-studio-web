-- Phase: Client organization members + invitations (additive).

CREATE TYPE "ClientOrganizationRole" AS ENUM (
  'primary_contact',
  'reviewer',
  'stakeholder',
  'approver',
  'observer'
);

CREATE TYPE "ClientOrganizationMemberStatus" AS ENUM (
  'invited',
  'active',
  'removed'
);

CREATE TABLE "ClientOrganizationMember" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "displayName" TEXT,
  "role" "ClientOrganizationRole" NOT NULL,
  "status" "ClientOrganizationMemberStatus" NOT NULL DEFAULT 'invited',
  "invitedByUserId" TEXT NOT NULL,
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "removedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientOrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientOrganizationMember_organizationId_email_key"
  ON "ClientOrganizationMember"("organizationId", "email");

CREATE INDEX "ClientOrganizationMember_userId_idx"
  ON "ClientOrganizationMember"("userId");

CREATE INDEX "ClientOrganizationMember_organizationId_status_idx"
  ON "ClientOrganizationMember"("organizationId", "status");

ALTER TABLE "ClientOrganizationMember"
  ADD CONSTRAINT "ClientOrganizationMember_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "ClientOrganization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientOrganizationMember"
  ADD CONSTRAINT "ClientOrganizationMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClientOrganizationMember"
  ADD CONSTRAINT "ClientOrganizationMember_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ClientOrganizationInvitation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT,
  "role" "ClientOrganizationRole" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClientOrganizationInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientOrganizationInvitation_tokenHash_key"
  ON "ClientOrganizationInvitation"("tokenHash");

CREATE INDEX "ClientOrganizationInvitation_organizationId_email_idx"
  ON "ClientOrganizationInvitation"("organizationId", "email");

CREATE INDEX "ClientOrganizationInvitation_expiresAt_idx"
  ON "ClientOrganizationInvitation"("expiresAt");

ALTER TABLE "ClientOrganizationInvitation"
  ADD CONSTRAINT "ClientOrganizationInvitation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "ClientOrganization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientOrganizationInvitation"
  ADD CONSTRAINT "ClientOrganizationInvitation_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Bootstrap active primary_contact membership for existing organizations.
INSERT INTO "ClientOrganizationMember" (
  "id",
  "organizationId",
  "userId",
  "email",
  "displayName",
  "role",
  "status",
  "invitedByUserId",
  "invitedAt",
  "acceptedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  o."id",
  o."primaryContactUserId",
  u."email",
  u."displayName",
  'primary_contact'::"ClientOrganizationRole",
  'active'::"ClientOrganizationMemberStatus",
  o."primaryContactUserId",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ClientOrganization" o
INNER JOIN "User" u ON u."id" = o."primaryContactUserId"
WHERE NOT EXISTS (
  SELECT 1
  FROM "ClientOrganizationMember" m
  WHERE m."organizationId" = o."id"
    AND lower(m."email") = lower(u."email")
);
