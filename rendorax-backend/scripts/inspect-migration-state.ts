import "../src/lib/loadEnv";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  try {
    let migrations: { rows: unknown[] } = { rows: [] };
    try {
      migrations = await pool.query(
        `SELECT migration_name, finished_at, applied_steps_count, rolled_back_at
         FROM "_prisma_migrations"
         ORDER BY finished_at NULLS LAST, migration_name`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("=== _prisma_migrations ===");
      console.log(JSON.stringify({ missing: true, error: message }, null, 2));
    }
    if (migrations.rows.length > 0) {
      console.log("=== _prisma_migrations ===");
      console.log(JSON.stringify(migrations.rows, null, 2));
    }

    const reviewTable = await pool.query(
      `SELECT to_regclass('public."ReviewVersionDecision"') AS review_table`,
    );
    const reviewEnum = await pool.query(
      `SELECT to_regtype('public."ReviewDecisionStatus"') AS review_enum`,
    );
    console.log("=== ReviewVersionDecision exists ===");
    console.log(JSON.stringify({ ...reviewTable.rows[0], ...reviewEnum.rows[0] }, null, 2));

    const assets = await pool.query(
      `SELECT ma.id AS "mediaAssetId", ma."fileName", ma.folder, ma."agencyProjectId",
              ma."userId" AS uploader_id, ap.title AS project_title,
              client."email" AS client_email, uploader."email" AS uploader_email
       FROM "MediaAsset" ma
       LEFT JOIN "AgencyProject" ap ON ap.id = ma."agencyProjectId"
       LEFT JOIN "User" client ON client.id = ap."clientId"
       LEFT JOIN "User" uploader ON uploader.id = ma."userId"
       WHERE ma."agencyProjectId" IS NOT NULL
         AND (ma.folder = '03_REVIEW' OR ma.folder LIKE '03_REVIEW/%')
       ORDER BY ma."createdAt" DESC
       LIMIT 10`,
    );
    console.log("=== Review Version assets ===");
    console.log(JSON.stringify(assets.rows, null, 2));

    const nonReviewAssets = await pool.query(
      `SELECT ma.id AS "mediaAssetId", ma."fileName", ma.folder, ma."agencyProjectId"
       FROM "MediaAsset" ma
       WHERE ma."agencyProjectId" IS NOT NULL
         AND ma.folder IS NOT NULL
         AND ma.folder <> '03_REVIEW'
         AND ma.folder NOT LIKE '03_REVIEW/%'
       ORDER BY ma."createdAt" DESC
       LIMIT 5`,
    );
    console.log("=== Non-review project assets ===");
    console.log(JSON.stringify(nonReviewAssets.rows, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
