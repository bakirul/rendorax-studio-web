import "../src/lib/loadEnv";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const BASE_URL = process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
const REVIEW_ASSET_ID = "f735565c-4248-4539-86ee-70b1d03d395b";

type TestResult = {
  id: number;
  name: string;
  role: string;
  expected: number;
  actual: number;
  pass: boolean;
  detail?: string;
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
  const candidates = [
    process.env[envKey],
    ...FALLBACK_PASSWORDS,
  ].filter((value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index);

  if (candidates.length === 0) {
    return { token: null, error: "No password candidates configured" };
  }

  for (const password of candidates) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session?.access_token) {
      return { token: data.session.access_token };
    }
  }

  return { token: null, error: "Invalid login credentials for all configured candidates" };
}

async function api(
  token: string,
  method: "GET" | "POST",
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

async function findNonReviewAsset(pool: Pool): Promise<string | null> {
  const result = await pool.query(
    `SELECT id
     FROM "MediaAsset"
     WHERE "agencyProjectId" IS NOT NULL
       AND folder IS NOT NULL
       AND folder <> '03_REVIEW'
       AND folder NOT LIKE '03_REVIEW/%'
     ORDER BY "createdAt" DESC
     LIMIT 1`,
  );
  return result.rows[0]?.id ?? null;
}

async function main() {
  const tokens: Record<string, string> = {};
  const authErrors: Record<string, string> = {};

  for (const account of ACCOUNTS) {
    const result = await signIn(account.email, account.envKey);
    if (result.token) {
      tokens[account.role] = result.token;
    } else {
      authErrors[account.role] = result.error ?? "Unknown auth error";
    }
  }

  const results: TestResult[] = [];

  const record = (
    id: number,
    name: string,
    role: string,
    expected: number,
    actual: number,
    detail?: string,
  ) => {
    results.push({
      id,
      name,
      role,
      expected,
      actual,
      pass: actual === expected,
      detail,
    });
  };

  if (!tokens.client || !tokens.editor || !tokens.admin) {
    console.log(
      JSON.stringify(
        {
          blocked: true,
          reason: "Unable to obtain JWTs for all test accounts",
          authErrors,
          tokensObtained: Object.keys(tokens),
          manualTestPlanRequired: true,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const nonReviewAssetId = await findNonReviewAsset(pool);
  await pool.end();

  const clientToken = tokens.client;
  const editorToken = tokens.editor;
  const adminToken = tokens.admin;

  const t1 = await api(clientToken, "POST", "/api/agency/review-decisions", {
    mediaAssetId: REVIEW_ASSET_ID,
    status: "approved",
  });
  record(1, "Client approves own Review Version", "client", 201, t1.status, JSON.stringify(t1.json));

  const t2 = await api(clientToken, "POST", "/api/agency/review-decisions", {
    mediaAssetId: REVIEW_ASSET_ID,
    status: "revision_requested",
    note: "E2E test: please adjust color grading on intro.",
  });
  record(2, "Client requests revision with note", "client", 201, t2.status, JSON.stringify(t2.json));

  const t3 = await api(clientToken, "POST", "/api/agency/review-decisions", {
    mediaAssetId: REVIEW_ASSET_ID,
    status: "submitted_for_review",
  });
  record(3, "Client attempts submitted_for_review", "client", 403, t3.status, JSON.stringify(t3.json));

  const t4 = await api(editorToken, "POST", "/api/agency/review-decisions", {
    mediaAssetId: REVIEW_ASSET_ID,
    status: "submitted_for_review",
  });
  record(4, "Editor submits assigned Review Version", "editor", 201, t4.status, JSON.stringify(t4.json));

  const t5 = await api(editorToken, "POST", "/api/agency/review-decisions", {
    mediaAssetId: REVIEW_ASSET_ID,
    status: "approved",
  });
  record(5, "Editor attempts approval", "editor", 403, t5.status, JSON.stringify(t5.json));

  const t6 = await api(adminToken, "POST", "/api/agency/review-decisions", {
    mediaAssetId: REVIEW_ASSET_ID,
    status: "admin_override",
  });
  record(6, "Admin override without note", "admin", 400, t6.status, JSON.stringify(t6.json));

  const t7 = await api(adminToken, "POST", "/api/agency/review-decisions", {
    mediaAssetId: REVIEW_ASSET_ID,
    status: "admin_override",
    note: "E2E test: admin override for workflow verification.",
  });
  record(7, "Admin override with note", "admin", 201, t7.status, JSON.stringify(t7.json));

  if (!nonReviewAssetId) {
    record(
      8,
      "Decision on non-review asset",
      "client",
      400,
      0,
      "SKIPPED — no project-linked non-review asset found",
    );
  } else {
    const t8 = await api(clientToken, "POST", "/api/agency/review-decisions", {
      mediaAssetId: nonReviewAssetId,
      status: "approved",
    });
    record(8, "Decision on non-review asset", "client", 400, t8.status, JSON.stringify(t8.json));
  }

  const t9 = await api(clientToken, "GET", `/api/agency/review-decisions?mediaAssetId=${REVIEW_ASSET_ID}`);
  record(9, "GET latest + history", "client", 200, t9.status);

  let historyOrderPass = false;
  let historyDetail = "GET failed";
  if (t9.status === 200 && t9.json && typeof t9.json === "object") {
    const payload = t9.json as {
      latest?: { createdAt?: string } | null;
      history?: Array<{ createdAt?: string; status?: string }>;
    };
    const history = payload.history ?? [];
    const timestamps = history.map((row) => row.createdAt ?? "");
    const sorted = [...timestamps].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    historyOrderPass = timestamps.length > 0 && timestamps.join("|") === sorted.join("|");
    historyDetail = JSON.stringify({
      count: history.length,
      latestStatus: payload.latest?.createdAt ?? null,
      firstHistoryStatus: history[0]?.status ?? null,
      orderNewestFirst: historyOrderPass,
    });
  }
  record(10, "History order newest first", "client", 200, historyOrderPass ? 200 : 409, historyDetail);

  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        reviewAssetId: REVIEW_ASSET_ID,
        nonReviewAssetId,
        results,
        summary: {
          total: results.length,
          passed: results.filter((row) => row.pass).length,
          failed: results.filter((row) => !row.pass).length,
        },
        e2eTestHistoryNote:
          "Append-only ReviewVersionDecision rows created by this script should be treated as E2E test audit history.",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
