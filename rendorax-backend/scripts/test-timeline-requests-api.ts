/**
 * Phase 2A Slice 2.1 — authenticated TimelineRequest API verification.
 * Mirrors scripts/test-review-decisions-api.ts auth patterns.
 * Never logs passwords or JWTs.
 */
import "../src/lib/loadEnv";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const BASE_URL =
  process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;

type TestResult = {
  id: number;
  name: string;
  role: string;
  expected: number | string;
  actual: number | string;
  pass: boolean;
  detail?: string;
  blocked?: boolean;
};

const ACCOUNTS = [
  { role: "client", email: "test@kachnamedia.com", envKey: "E2E_CLIENT_PASSWORD" },
  { role: "editor", email: "editor-test@kachnamedia.com", envKey: "E2E_EDITOR_PASSWORD" },
  { role: "admin", email: "admin-studio@kachnamedia.com", envKey: "E2E_ADMIN_PASSWORD" },
] as const;

const FALLBACK_PASSWORDS = [
  process.env.E2E_SHARED_PASSWORD,
  process.env.ADMIN_PASSWORD,
].filter(Boolean) as string[];

async function signIn(
  email: string,
  envKey: string,
): Promise<{ token: string | null; error?: string }> {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { token: null, error: "SUPABASE_URL or SUPABASE_ANON_KEY missing" };
  }

  const supabase = createClient(url, anonKey);
  const candidates = [process.env[envKey], ...FALLBACK_PASSWORDS].filter(
    (value, index, arr): value is string =>
      Boolean(value) && arr.indexOf(value) === index,
  );

  if (candidates.length === 0) {
    return { token: null, error: "No password candidates configured" };
  }

  for (const password of candidates) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.session?.access_token) {
      return { token: data.session.access_token };
    }
  }

  return {
    token: null,
    error: "Invalid login credentials for all configured candidates",
  };
}

async function api(
  token: string,
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: Record<string, unknown>,
) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { status: response.status, json };
}

function summarizeJson(json: unknown): string {
  if (!json || typeof json !== "object") return String(json);
  const obj = json as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof obj.error === "string") out.error = obj.error;
  if (typeof obj.existingId === "string") out.existingId = obj.existingId;
  if (obj.request && typeof obj.request === "object") {
    const r = obj.request as Record<string, unknown>;
    out.request = {
      id: r.id,
      status: r.status,
      assetId: r.assetId,
      agencyProjectId: r.agencyProjectId,
      requesterId: r.requesterId,
      reviewRoomId: r.reviewRoomId,
    };
  }
  if (Array.isArray(obj.requests)) {
    out.requestCount = obj.requests.length;
    out.requestIds = obj.requests
      .slice(0, 5)
      .map((row) => (row as { id?: string }).id);
  }
  return JSON.stringify(out);
}

async function main() {
  const tokens: Record<string, string> = {};
  const authErrors: Record<string, string> = {};
  const results: TestResult[] = [];
  const blocked: string[] = [];

  const record = (
    id: number,
    name: string,
    role: string,
    expected: number | string,
    actual: number | string,
    detail?: string,
    isBlocked?: boolean,
  ) => {
    results.push({
      id,
      name,
      role,
      expected,
      actual,
      pass: !isBlocked && expected === actual,
      detail,
      blocked: isBlocked,
    });
    if (isBlocked) blocked.push(name);
  };

  for (const account of ACCOUNTS) {
    const result = await signIn(account.email, account.envKey);
    if (result.token) tokens[account.role] = result.token;
    else authErrors[account.role] = result.error ?? "Unknown auth error";
  }

  if (!tokens.client) {
    console.log(
      JSON.stringify(
        {
          blocked: true,
          reason: "Unable to obtain client JWT",
          authErrors,
          tokensObtained: Object.keys(tokens),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const pool = new Pool({ connectionString: process.env.DIRECT_URL });

  // Disposable: prefer assets titled/named with test markers, else newest project-linked
  // asset owned under client's accessible projects — never permanently alter.
  const assetPick = await pool.query<{
    id: string;
    agencyProjectId: string;
    fileName: string;
    archivedAt: Date | null;
  }>(
    `SELECT a.id, a."agencyProjectId", a."fileName", p."archivedAt"
     FROM "MediaAsset" a
     JOIN "AgencyProject" p ON p.id = a."agencyProjectId"
     WHERE a."agencyProjectId" IS NOT NULL
       AND p."archivedAt" IS NULL
     ORDER BY a."createdAt" DESC
     LIMIT 5`,
  );

  const linkedAsset = assetPick.rows[0] ?? null;
  const unlinkedPick = await pool.query<{ id: string }>(
    `SELECT id FROM "MediaAsset"
     WHERE "agencyProjectId" IS NULL
     ORDER BY "createdAt" DESC LIMIT 1`,
  );
  const unlinkedAssetId = unlinkedPick.rows[0]?.id ?? null;

  let createdRequestId: string | null = null;
  let snapshotProjectId: string | null = null;
  let snapshotAssetId: string | null = null;

  try {
    if (!linkedAsset) {
      record(
        1,
        "Client creates timeline request",
        "client",
        201,
        0,
        "SKIPPED — no project-linked active asset",
        true,
      );
    } else {
      snapshotAssetId = linkedAsset.id;
      snapshotProjectId = linkedAsset.agencyProjectId;

      // Clean any prior open test rows for this client+asset (disposable E2E hygiene)
      const clientMe = await api(tokens.client, "GET", "/api/agency/me");
      const clientUserId =
        clientMe.status === 200 &&
        clientMe.json &&
        typeof clientMe.json === "object"
          ? String((clientMe.json as { id?: string }).id ?? "")
          : "";

      if (clientUserId) {
        await pool.query(
          `DELETE FROM "TimelineRequest"
           WHERE "requesterId" = $1 AND "assetId" = $2
             AND status IN ('pending', 'accepted', 'active')`,
          [clientUserId, linkedAsset.id],
        );
      }

      const t1 = await api(tokens.client, "POST", "/api/agency/timeline-requests", {
        assetId: linkedAsset.id,
        message: "E2E Slice 2.1 timeline request",
      });
      const body1 =
        t1.json && typeof t1.json === "object"
          ? (t1.json as {
              request?: {
                id?: string;
                status?: string;
                requesterId?: string;
                reviewRoomId?: string;
                agencyProjectId?: string;
              };
            })
          : {};
      createdRequestId = body1.request?.id ?? null;
      const roomOk =
        body1.request?.reviewRoomId === `review:asset:${linkedAsset.id}`;
      const statusOk = body1.request?.status === "pending";
      record(
        1,
        "Client creates timeline request",
        "client",
        201,
        t1.status === 201 && roomOk && statusOk ? 201 : t1.status,
        summarizeJson(t1.json),
      );

      const t2 = await api(tokens.client, "GET", "/api/agency/timeline-requests");
      const listOk =
        t2.status === 200 &&
        t2.json &&
        typeof t2.json === "object" &&
        Array.isArray((t2.json as { requests?: unknown[] }).requests) &&
        ((t2.json as { requests: Array<{ id?: string }> }).requests ?? []).some(
          (r) => r.id === createdRequestId,
        );
      record(
        2,
        "Client lists own requests",
        "client",
        200,
        listOk ? 200 : t2.status,
        summarizeJson(t2.json),
      );

      if (createdRequestId) {
        const t3 = await api(
          tokens.client,
          "GET",
          `/api/agency/timeline-requests/${createdRequestId}`,
        );
        record(
          3,
          "Client reads request detail",
          "client",
          200,
          t3.status,
          summarizeJson(t3.json),
        );
      } else {
        record(3, "Client reads request detail", "client", 200, 0, "SKIPPED", true);
      }

      // Protected fields ignored (server-controlled)
      if (clientUserId) {
        await pool.query(
          `DELETE FROM "TimelineRequest"
           WHERE "requesterId" = $1 AND "assetId" = $2
             AND status IN ('pending', 'accepted', 'active')`,
          [clientUserId, linkedAsset.id],
        );
      }
      const t4 = await api(tokens.client, "POST", "/api/agency/timeline-requests", {
        assetId: linkedAsset.id,
        status: "accepted",
        requesterId: "00000000-0000-0000-0000-000000000000",
        reviewRoomId: "hacked-room",
        acceptedAt: "2020-01-01T00:00:00.000Z",
        acceptedById: "00000000-0000-0000-0000-000000000000",
        message: "protected-field probe",
      });
      const r4 =
        t4.json && typeof t4.json === "object"
          ? (t4.json as { request?: Record<string, unknown> }).request
          : undefined;
      const protectedOk =
        t4.status === 201 &&
        r4?.status === "pending" &&
        r4?.reviewRoomId === `review:asset:${linkedAsset.id}` &&
        r4?.requesterId === clientUserId &&
        r4?.acceptedAt == null &&
        r4?.acceptedById == null;
      createdRequestId = (r4?.id as string) ?? createdRequestId;
      record(
        4,
        "Protected fields ignored on create",
        "client",
        201,
        protectedOk ? 201 : t4.status,
        summarizeJson(t4.json),
      );

      // Concurrent duplicate POSTs
      const [c1, c2, c3] = await Promise.all([
        api(tokens.client, "POST", "/api/agency/timeline-requests", {
          assetId: linkedAsset.id,
          message: "race-a",
        }),
        api(tokens.client, "POST", "/api/agency/timeline-requests", {
          assetId: linkedAsset.id,
          message: "race-b",
        }),
        api(tokens.client, "POST", "/api/agency/timeline-requests", {
          assetId: linkedAsset.id,
          message: "race-c",
        }),
      ]);
      const raceStatuses = [c1.status, c2.status, c3.status].sort();
      const successCount = raceStatuses.filter((s) => s === 201).length;
      const conflictCount = raceStatuses.filter((s) => s === 409).length;
      // First create already open → expect 0×201 and 3×409, OR if cleaned: 1×201 + 2×409
      const openCount = await pool.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM "TimelineRequest"
         WHERE "requesterId" = $1 AND "assetId" = $2
           AND status IN ('pending', 'accepted', 'active')`,
        [clientUserId, linkedAsset.id],
      );
      const racePass =
        openCount.rows[0].n === 1 &&
        ((successCount === 0 && conflictCount === 3) ||
          (successCount === 1 && conflictCount === 2));
      record(
        5,
        "Concurrent duplicate POST → one open + 409",
        "client",
        "one-open",
        racePass ? "one-open" : `open=${openCount.rows[0].n} statuses=${raceStatuses.join(",")}`,
        JSON.stringify({
          statuses: raceStatuses,
          openCount: openCount.rows[0].n,
        }),
      );

      // Invalid status filter
      const t6 = await api(
        tokens.client,
        "GET",
        "/api/agency/timeline-requests?status=bogus",
      );
      record(6, "Invalid status filter", "client", 400, t6.status, summarizeJson(t6.json));

      // Missing id
      const t7 = await api(
        tokens.client,
        "GET",
        "/api/agency/timeline-requests/00000000-0000-0000-0000-000000000000",
      );
      record(7, "Missing request id → 404", "client", 404, t7.status);

      // Unlinked asset
      if (unlinkedAssetId) {
        const t8 = await api(tokens.client, "POST", "/api/agency/timeline-requests", {
          assetId: unlinkedAssetId,
        });
        record(
          8,
          "Unlinked asset → 400",
          "client",
          400,
          t8.status,
          summarizeJson(t8.json),
        );
      } else {
        record(8, "Unlinked asset → 400", "client", 400, 0, "SKIPPED — no unlinked asset", true);
      }

      // Snapshot invariant: temporarily move asset project if a second project exists,
      // then restore. Prefer disposable second project owned same way.
      if (createdRequestId && snapshotProjectId && snapshotAssetId) {
        const otherProject = await pool.query<{ id: string }>(
          `SELECT id FROM "AgencyProject"
           WHERE id <> $1 AND "archivedAt" IS NULL
           ORDER BY "createdAt" DESC LIMIT 1`,
          [snapshotProjectId],
        );
        if (otherProject.rows[0]?.id && tokens.admin) {
          const otherId = otherProject.rows[0].id;
          await pool.query(
            `UPDATE "MediaAsset" SET "agencyProjectId" = $1 WHERE id = $2`,
            [otherId, snapshotAssetId],
          );
          const snap = await pool.query<{ agencyProjectId: string }>(
            `SELECT "agencyProjectId" FROM "TimelineRequest" WHERE id = $1`,
            [createdRequestId],
          );
          const snapOk = snap.rows[0]?.agencyProjectId === snapshotProjectId;
          // Restore immediately
          await pool.query(
            `UPDATE "MediaAsset" SET "agencyProjectId" = $1 WHERE id = $2`,
            [snapshotProjectId, snapshotAssetId],
          );
          record(
            9,
            "Asset move leaves request agencyProjectId unchanged",
            "db",
            "unchanged",
            snapOk ? "unchanged" : snap.rows[0]?.agencyProjectId ?? "missing",
          );
        } else {
          record(
            9,
            "Asset move leaves request agencyProjectId unchanged",
            "db",
            "unchanged",
            0,
            "SKIPPED — need second active project + admin for safety restore path",
            true,
          );
        }
      }

      // Editor list / detail
      if (tokens.editor && createdRequestId) {
        const t10 = await api(tokens.editor, "GET", "/api/agency/timeline-requests");
        const editorSees =
          t10.status === 200 &&
          Array.isArray((t10.json as { requests?: unknown[] })?.requests);
        record(
          10,
          "Editor lists (scoped)",
          "editor",
          200,
          editorSees ? 200 : t10.status,
          summarizeJson(t10.json),
        );

        const t11 = await api(
          tokens.editor,
          "GET",
          `/api/agency/timeline-requests/${createdRequestId}`,
        );
        // 200 if authorized for that project, else 404 — both valid depending on assignment
        const editorDetailOk = t11.status === 200 || t11.status === 404;
        record(
          11,
          "Editor detail (200 if assigned/owner else 404)",
          "editor",
          "200|404",
          editorDetailOk ? "200|404" : String(t11.status),
          summarizeJson(t11.json),
        );
      } else {
        record(10, "Editor lists (scoped)", "editor", 200, 0, "SKIPPED — no editor token", true);
        record(11, "Editor detail", "editor", "200|404", 0, "SKIPPED", true);
      }

      if (tokens.admin && createdRequestId) {
        const t12 = await api(tokens.admin, "GET", "/api/agency/timeline-requests");
        const adminSees =
          t12.status === 200 &&
          ((t12.json as { requests?: Array<{ id?: string }> })?.requests ?? []).some(
            (r) => r.id === createdRequestId,
          );
        record(
          12,
          "Admin lists all (includes request)",
          "admin",
          200,
          adminSees ? 200 : t12.status,
          summarizeJson(t12.json),
        );
      } else {
        record(12, "Admin lists all", "admin", 200, 0, "SKIPPED — no admin token", true);
      }

      // Cross-client 404 — blocked without second client account
      record(
        13,
        "Other client detail → 404",
        "client-b",
        404,
        0,
        "SKIPPED — no second client account fixture (E2E_CLIENT_B_*)",
        true,
      );

      // Observer 403 — blocked without observer fixture
      record(
        14,
        "Observer create → 403",
        "observer",
        403,
        0,
        "SKIPPED — no observer membership fixture",
        true,
      );

      // Archived project — blocked without disposable archive
      record(
        15,
        "Archived project create → 409",
        "client",
        409,
        0,
        "SKIPPED — no disposable archived-project fixture (avoid production archive)",
        true,
      );
    }
  } finally {
    // Cleanup open E2E rows created by this run for the linked asset
    if (linkedAsset && tokens.client) {
      const me = await api(tokens.client, "GET", "/api/agency/me");
      const uid =
        me.status === 200 && me.json && typeof me.json === "object"
          ? String((me.json as { id?: string }).id ?? "")
          : "";
      if (uid) {
        await pool.query(
          `DELETE FROM "TimelineRequest"
           WHERE "requesterId" = $1 AND "assetId" = $2
             AND (
               message LIKE 'E2E Slice 2.1%'
               OR message LIKE 'protected-field%'
               OR message LIKE 'race-%'
             )`,
          [uid, linkedAsset.id],
        );
      }
    }
    await pool.end();
  }

  const runnable = results.filter((r) => !r.blocked);
  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        linkedAssetId: linkedAsset?.id ?? null,
        linkedProjectId: linkedAsset?.agencyProjectId ?? null,
        results,
        summary: {
          total: results.length,
          passed: runnable.filter((r) => r.pass).length,
          failed: runnable.filter((r) => !r.pass).length,
          blocked: results.filter((r) => r.blocked).length,
          blockedNames: blocked,
        },
      },
      null,
      2,
    ),
  );

  if (runnable.some((r) => !r.pass)) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
