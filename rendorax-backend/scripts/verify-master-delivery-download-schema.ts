import "../src/lib/loadEnv";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  try {
    const counts = await pool.query(`
      SELECT 'MediaAsset' AS name, COUNT(*)::int AS n FROM public."MediaAsset"
      UNION ALL SELECT 'AgencyProject', COUNT(*)::int FROM public."AgencyProject"
      UNION ALL SELECT 'MasterDeliveryEvent', COUNT(*)::int FROM public."MasterDeliveryEvent"
      UNION ALL SELECT 'User', COUNT(*)::int FROM public."User"
      UNION ALL SELECT 'MasterDeliveryDownloadEvent', COUNT(*)::int FROM public."MasterDeliveryDownloadEvent"
    `);

    const schema = await pool.query(`
      SELECT
        EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'MasterDeliveryDownloadEventType'
        ) AS enum_exists,
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'MasterDeliveryDownloadEvent'
        ) AS table_exists
    `);

    console.log(
      JSON.stringify(
        { counts: counts.rows, schema: schema.rows[0] },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
