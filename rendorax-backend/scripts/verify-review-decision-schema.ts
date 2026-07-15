import "../src/lib/loadEnv";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  try {
    const enumCheck = await pool.query(
      `SELECT e.enumlabel
       FROM pg_type t
       JOIN pg_enum e ON t.oid = e.enumtypid
       WHERE t.typname = 'ReviewDecisionStatus'
       ORDER BY e.enumsortorder`,
    );

    const columns = await pool.query(
      `SELECT column_name, data_type, udt_name, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'ReviewVersionDecision'
       ORDER BY ordinal_position`,
    );

    const indexes = await pool.query(
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = 'ReviewVersionDecision'`,
    );

    const fks = await pool.query(
      `SELECT tc.constraint_name, kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name,
              rc.delete_rule, rc.update_rule
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
       JOIN information_schema.referential_constraints AS rc
         ON rc.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_name = 'ReviewVersionDecision'`,
    );

    const rowCount = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "ReviewVersionDecision"`,
    );

    const mediaAssetCount = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "MediaAsset"`,
    );

    console.log(JSON.stringify({
      enumValues: enumCheck.rows.map((r) => r.enumlabel),
      columns: columns.rows,
      indexes: indexes.rows,
      foreignKeys: fks.rows,
      reviewDecisionRows: rowCount.rows[0]?.count,
      mediaAssetRows: mediaAssetCount.rows[0]?.count,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
