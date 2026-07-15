import "../src/lib/loadEnv";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  try {
    const col = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'AgencyProject'
        AND column_name = 'archivedAt'
    `);
    const counts = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT("archivedAt")::int AS archived
      FROM public."AgencyProject"
    `);
    console.log(
      JSON.stringify({ column: col.rows[0] ?? null, counts: counts.rows[0] }, null, 2),
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
