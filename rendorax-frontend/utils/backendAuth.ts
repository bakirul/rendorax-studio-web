import { createClient } from "@/utils/supabase/client";

export async function getBackendAuthHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token?.trim();
  if (!token) {
    console.error("[auth] Missing Supabase session access_token for backend API call.", {
      hasSession: Boolean(session),
      userId: session?.user?.id,
    });
    throw new Error("Unauthorized: missing session token");
  }

  headers.Authorization = `Bearer ${token}`;

  return headers;
}
