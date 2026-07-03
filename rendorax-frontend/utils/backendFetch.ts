export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;

  try {
    return await fetch(url, init);
  } catch (error) {
    console.error("[backendFetch] Network request failed:", {
      url,
      method: init?.method ?? "GET",
      backendUrl: BACKEND_URL,
      error,
    });
    throw error;
  }
}
