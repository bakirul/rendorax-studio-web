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
      UNION ALL SELECT 'ReviewVersionDecision', COUNT(*)::int FROM public."ReviewVersionDecision"
      UNION ALL SELECT 'PictureLockEvent', COUNT(*)::int FROM public."PictureLockEvent"
      UNION ALL SELECT 'User', COUNT(*)::int FROM public."User"
    `);

    const schema = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'MasterDeliveryEventType'
      ) AS enum_exists,
      EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'MasterDeliveryEvent'
      ) AS table_exists
    `);

    let columns: unknown[] = [];
    let indexes: unknown[] = [];
    let fks: unknown[] = [];
    let deliveryCount: number | null = null;

    if (schema.rows[0]?.table_exists) {
      const cols = await pool.query(`
        SELECT column_name, data_type, udt_name, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'MasterDeliveryEvent'
        ORDER BY ordinal_position
      `);
      columns = cols.rows;

      const idx = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'MasterDeliveryEvent'
        ORDER BY indexname
      `);
      indexes = idx.rows;

      const fk = await pool.query(`
        SELECT conname, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
        WHERE conrelid = 'public."MasterDeliveryEvent"'::regclass
          AND contype = 'f'
        ORDER BY conname
      `);
      fks = fk.rows;

      const n = await pool.query(
        `SELECT COUNT(*)::int AS n FROM public."MasterDeliveryEvent"`,
      );
      deliveryCount = n.rows[0]?.n ?? 0;
    }

    console.log(
      JSON.stringify(
        {
          counts: counts.rows,
          schema: schema.rows[0],
          deliveryCount,
          columns,
          indexes,
          fks,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
