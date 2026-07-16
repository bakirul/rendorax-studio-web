/**
 * Verifies Project Request Phase 1 schema presence without mutating data.
 */
import "../src/lib/loadEnv";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

type Case = { name: string; pass: boolean; detail?: string };

async function main() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const results: Case[] = [];

  try {
    const [userCount, projectCount, orgCount, requestCount] = await Promise.all([
      prisma.user.count(),
      prisma.agencyProject.count(),
      prisma.clientOrganization.count(),
      prisma.projectRequest.count(),
    ]);

    results.push({
      name: "User count readable",
      pass: typeof userCount === "number",
      detail: String(userCount),
    });
    results.push({
      name: "AgencyProject count readable (unchanged model)",
      pass: typeof projectCount === "number",
      detail: String(projectCount),
    });
    results.push({
      name: "ClientOrganization table readable",
      pass: typeof orgCount === "number",
      detail: String(orgCount),
    });
    results.push({
      name: "ProjectRequest table readable",
      pass: typeof requestCount === "number",
      detail: String(requestCount),
    });

    const enumProbe = await prisma.$queryRawUnsafe<Array<{ typname: string }>>(
      `SELECT typname FROM pg_type WHERE typname = 'ProjectRequestStatus'`,
    );
    results.push({
      name: "ProjectRequestStatus enum exists",
      pass: enumProbe.length === 1,
      detail: enumProbe[0]?.typname ?? "missing",
    });

    const failed = results.filter((r) => !r.pass).length;
    console.log(
      JSON.stringify(
        {
          results,
          counts: {
            users: userCount,
            agencyProjects: projectCount,
            clientOrganizations: orgCount,
            projectRequests: requestCount,
          },
          failed,
        },
        null,
        2,
      ),
    );
    process.exitCode = failed > 0 ? 1 : 0;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main();
