/**
 * Backfill media_asset_id / agency_project_id on video_comments only when
 * file_name maps to exactly one MediaAsset globally.
 * Skips: global-lobby, duplicate filenames, unmatched / deleted assets.
 */
import "../src/lib/loadEnv";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    const before = await pool.query<{
      id: string;
      file_name: string;
      media_asset_id: string | null;
    }>(
      `SELECT id, file_name, media_asset_id
       FROM public.video_comments
       ORDER BY created_at ASC NULLS LAST`,
    );

    const dupNames = await pool.query<{ fileName: string; cnt: string }>(
      `SELECT "fileName" AS "fileName", COUNT(*)::text AS cnt
       FROM public."MediaAsset"
       GROUP BY "fileName"
       HAVING COUNT(*) > 1`,
    );
    const ambiguousNames = new Set(dupNames.rows.map((r) => r.fileName));

    const uniqueAssets = await pool.query<{
      id: string;
      fileName: string;
      agencyProjectId: string | null;
    }>(
      `SELECT ma.id, ma."fileName" AS "fileName", ma."agencyProjectId" AS "agencyProjectId"
       FROM public."MediaAsset" ma
       INNER JOIN (
         SELECT "fileName"
         FROM public."MediaAsset"
         GROUP BY "fileName"
         HAVING COUNT(*) = 1
       ) uniq ON uniq."fileName" = ma."fileName"`,
    );
    const byExactName = new Map(
      uniqueAssets.rows.map((r) => [r.fileName, r] as const),
    );

    let exactBackfilled = 0;
    let ambiguousSkipped = 0;
    let unmatchedSkipped = 0;
    let alreadyMapped = 0;
    let lobbySkipped = 0;
    const backfilledIds: string[] = [];
    const ambiguousSkippedNames = new Set<string>();
    const unmatchedSkippedNames = new Set<string>();

    for (const row of before.rows) {
      if (row.media_asset_id) {
        alreadyMapped += 1;
        continue;
      }

      const name = row.file_name ?? "";
      if (name === "global-lobby") {
        lobbySkipped += 1;
        continue;
      }

      if (ambiguousNames.has(name)) {
        ambiguousSkipped += 1;
        ambiguousSkippedNames.add(name);
        continue;
      }

      const match = byExactName.get(name);
      if (!match) {
        unmatchedSkipped += 1;
        unmatchedSkippedNames.add(name);
        continue;
      }

      await pool.query(
        `UPDATE public.video_comments
         SET media_asset_id = $1,
             agency_project_id = $2
         WHERE id = $3
           AND media_asset_id IS NULL`,
        [match.id, match.agencyProjectId, row.id],
      );
      exactBackfilled += 1;
      backfilledIds.push(row.id);
    }

    console.log(
      JSON.stringify(
        {
          totalComments: before.rows.length,
          exactRowsBackfilled: exactBackfilled,
          backfilledIds,
          alreadyMapped,
          ambiguousRowsSkipped: ambiguousSkipped,
          ambiguousFileNames: [...ambiguousSkippedNames],
          unmatchedRowsSkipped: unmatchedSkipped,
          unmatchedFileNames: [...unmatchedSkippedNames],
          lobbySkipped,
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
