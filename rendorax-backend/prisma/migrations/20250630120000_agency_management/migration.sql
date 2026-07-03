-- Agency Management: User, AgencyProject, Task
-- Apply with: npx prisma db push  OR  npx prisma migrate dev

CREATE TYPE "public"."AgencyRole" AS ENUM ('admin', 'editor', 'client');
CREATE TYPE "public"."TaskStatus" AS ENUM ('todo', 'in_progress', 'in_review', 'done');

CREATE TABLE IF NOT EXISTS "public"."User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT,
  "role" "public"."AgencyRole" NOT NULL DEFAULT 'editor',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "public"."User" ("email");

CREATE TABLE IF NOT EXISTS "public"."AgencyProject" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "ownerId" TEXT NOT NULL,
  "clientId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgencyProject_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgencyProject_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AgencyProject_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "public"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgencyProject_ownerId_idx" ON "public"."AgencyProject" ("ownerId");
CREATE INDEX IF NOT EXISTS "AgencyProject_clientId_idx" ON "public"."AgencyProject" ("clientId");
CREATE INDEX IF NOT EXISTS "AgencyProject_status_idx" ON "public"."AgencyProject" ("status");

CREATE TABLE IF NOT EXISTS "public"."Task" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "public"."TaskStatus" NOT NULL DEFAULT 'todo',
  "dueDate" TIMESTAMP(3),
  "projectId" TEXT NOT NULL,
  "assigneeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Task_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."AgencyProject"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Task_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "public"."Task" ("projectId");
CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "public"."Task" ("assigneeId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "public"."Task" ("status");
