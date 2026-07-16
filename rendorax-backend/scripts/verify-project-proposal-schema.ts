/**
 * Verifies Project Proposal Phase 2 schema presence without mutating data.
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
    const [requestCount, proposalCount, projectCount] = await Promise.all([
      prisma.projectRequest.count(),
      prisma.projectProposal.count(),
      prisma.agencyProject.count(),
    ]);

    results.push({
      name: "ProjectRequest readable",
      pass: typeof requestCount === "number",
      detail: String(requestCount),
    });
    results.push({
      name: "ProjectProposal readable",
      pass: typeof proposalCount === "number",
      detail: String(proposalCount),
    });
    results.push({
      name: "AgencyProject unchanged readable",
      pass: typeof projectCount === "number",
      detail: String(projectCount),
    });

    const enumProbe = await prisma.$queryRawUnsafe<
      Array<{ enumlabel: string }>
    >(
      `SELECT e.enumlabel
       FROM pg_type t
       JOIN pg_enum e ON t.oid = e.enumtypid
       WHERE t.typname = 'ProjectRequestStatus'
       ORDER BY e.enumsortorder`,
    );
    const labels = enumProbe.map((r) => r.enumlabel);
    results.push({
      name: "quoted status on ProjectRequestStatus",
      pass: labels.includes("quoted"),
      detail: labels.join(","),
    });

    const propEnum = await prisma.$queryRawUnsafe<
      Array<{ typname: string }>
    >(`SELECT typname FROM pg_type WHERE typname = 'ProjectProposalStatus'`);
    results.push({
      name: "ProjectProposalStatus enum exists",
      pass: propEnum.length === 1,
      detail: propEnum[0]?.typname ?? "missing",
    });

    const failed = results.filter((r) => !r.pass).length;
    console.log(
      JSON.stringify(
        {
          results,
          counts: {
            projectRequests: requestCount,
            projectProposals: proposalCount,
            agencyProjects: projectCount,
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
