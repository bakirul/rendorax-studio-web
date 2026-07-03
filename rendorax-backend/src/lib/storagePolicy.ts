const CLIENT_UPLOAD_PREFIXES = ["uploads/", "thumbnails/", "projects/"] as const;

const INTERNAL_STORAGE_PREFIXES = [
  "uploads/",
  "thumbnails/",
  "projects/",
  "proxies/",
] as const;

function normalizeObjectKey(objectKey: string): string {
  return objectKey.replace(/^\/+/, "").trim();
}

function matchesAllowedPrefix(
  normalized: string,
  prefixes: readonly string[],
): boolean {
  if (!normalized || normalized.includes("..") || normalized.includes("\\")) {
    return false;
  }

  return prefixes.some((prefix) => normalized.startsWith(prefix));
}

/** Keys clients may register via presign / POST /api/media/assets. */
export function isAllowedClientUploadObjectKey(objectKey: string): boolean {
  return matchesAllowedPrefix(
    normalizeObjectKey(objectKey),
    CLIENT_UPLOAD_PREFIXES,
  );
}

/** Keys workers and internal services may read/write (includes transcoded proxies). */
export function isAllowedR2ObjectKey(objectKey: string): boolean {
  return matchesAllowedPrefix(
    normalizeObjectKey(objectKey),
    INTERNAL_STORAGE_PREFIXES,
  );
}

function addHostnameFromUrl(hosts: Set<string>, rawUrl: string | undefined): void {
  if (!rawUrl?.trim()) return;
  try {
    hosts.add(new URL(rawUrl.trim()).hostname.toLowerCase());
  } catch {
    // ignore malformed env URLs
  }
}

function getAllowedTranscribeHostnames(): Set<string> {
  const hosts = new Set<string>(["media.rendorax.com"]);

  addHostnameFromUrl(hosts, process.env.R2_PUBLIC_URL);
  addHostnameFromUrl(hosts, process.env.R2_PUBLIC_DOMAIN);
  addHostnameFromUrl(hosts, process.env.SUPABASE_URL);

  return hosts;
}

const ALLOWED_TRANSCRIBE_HOST_SUFFIXES = [".supabase.co", ".r2.cloudflarestorage.com"];

export function isAllowedTranscribeFileUrl(fileUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowedHosts = getAllowedTranscribeHostnames();

  if (allowedHosts.has(hostname)) {
    return true;
  }

  return ALLOWED_TRANSCRIBE_HOST_SUFFIXES.some((suffix) =>
    hostname.endsWith(suffix),
  );
}
