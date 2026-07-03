import { createClient } from "@/utils/supabase/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type BackendAuthHeadersResult =
  | { ok: true; headers: HeadersInit }
  | { ok: false; status: number; error: string };

export async function getBackendAuthHeaders(): Promise<BackendAuthHeadersResult> {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  return {
    ok: true as const,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  };
}

export async function proxyAgencyRequest(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const auth = await getBackendAuthHeaders();
  if (!auth.ok) {
    const errorResponse = auth as {
      ok: false;
      status: number;
      error: string;
    };

    return new Response(JSON.stringify({ error: errorResponse.error }), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return fetch(`${BACKEND_URL}/api/agency${path}`, {
    ...init,
    headers: {
      ...auth.headers,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}
