/**
 * Controlled checks for assertActiveAgencyProjectAccess / allowArchived.
 * Temporarily archives one active project, asserts 409, then restores it.
 */
import "../src/lib/loadEnv";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ARCHIVED_PROJECT_WORKSPACE_ERROR,
  assertAgencyProjectAccess,
  assertActiveAgencyProjectAccess,
} from "../src/lib/agencyProjectAccess";
import type { AuthenticatedRequest } from "../src/middleware/requireAuth";

function mockReq(user: {
  id: string;
  role: string;
}): AuthenticatedRequest {
  return { user } as AuthenticatedRequest;
}

type Case = {
  name: string;
  pass: boolean;
  detail?: string;
};

async function main() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const results: Case[] = [];
  let restored = false;
  let subjectId: string | null = null;

  try {
    const subject = await prisma.agencyProject.findFirst({
      where: { archivedAt: null },
      select: { id: true, ownerId: true, clientId: true },
      orderBy: { createdAt: "desc" },
    });

    if (!subject) {
      console.log(
        JSON.stringify(
          {
            results: [
              {
                name: "active project fixture",
                pass: false,
                detail: "No active AgencyProject row",
              },
            ],
            failed: 1,
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }

    subjectId = subject.id;

    await prisma.agencyProject.update({
      where: { id: subject.id },
      data: { archivedAt: new Date() },
    });

    const adminReq = mockReq({ id: subject.ownerId, role: "admin" });

    const blocked = await assertActiveAgencyProjectAccess(
      prisma,
      adminReq,
      subject.id,
    );
    results.push({
      name: "Admin active access on archived → 409",
      pass:
        !blocked.ok &&
        blocked.status === 409 &&
        blocked.error === ARCHIVED_PROJECT_WORKSPACE_ERROR,
      detail: JSON.stringify(blocked),
    });

    const allowed = await assertAgencyProjectAccess(
      prisma,
      adminReq,
      subject.id,
      { allowArchived: true },
    );
    results.push({
      name: "Admin allowArchived on archived → ok",
      pass: allowed.ok === true,
      detail: JSON.stringify(allowed),
    });

    if (subject.clientId) {
      const clientBlocked = await assertActiveAgencyProjectAccess(
        prisma,
        mockReq({ id: subject.clientId, role: "client" }),
        subject.id,
      );
      results.push({
        name: "Client active access on archived → 409",
        pass:
          !clientBlocked.ok &&
          clientBlocked.status === 409 &&
          clientBlocked.error === ARCHIVED_PROJECT_WORKSPACE_ERROR,
        detail: JSON.stringify(clientBlocked),
      });
    }

    await prisma.agencyProject.update({
      where: { id: subject.id },
      data: { archivedAt: null },
    });
    restored = true;

    const afterRestore = await assertActiveAgencyProjectAccess(
      prisma,
      adminReq,
      subject.id,
    );
    results.push({
      name: "After restore active access → ok",
      pass: afterRestore.ok === true && afterRestore.projectId === subject.id,
      detail: JSON.stringify(afterRestore),
    });

    const missing = await assertActiveAgencyProjectAccess(
      prisma,
      mockReq({ id: "00000000-0000-0000-0000-000000000001", role: "admin" }),
      "00000000-0000-0000-0000-000000000099",
    );
    results.push({
      name: "Missing project → 404",
      pass: !missing.ok && missing.status === 404,
      detail: JSON.stringify(missing),
    });

    const failed = results.filter((r) => !r.pass);
    console.log(
      JSON.stringify(
        { subjectId: subject.id, restored, results, failed: failed.length },
        null,
        2,
      ),
    );
    if (failed.length > 0) process.exitCode = 1;
  } catch (error) {
    if (subjectId && !restored) {
      await prisma.agencyProject.update({
        where: { id: subjectId },
        data: { archivedAt: null },
      });
      restored = true;
    }
    throw error;
  } finally {
    if (subjectId && !restored) {
      await prisma.agencyProject.update({
        where: { id: subjectId },
        data: { archivedAt: null },
      });
    }
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
