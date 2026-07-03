/** True for http(s) media URLs (R2 CDN, Supabase signed URLs, etc.). */
export function isRemoteMediaUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

/** Cloudflare R2 assets served via the Rendorax media subdomain. */
export function isR2MediaUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "media.rendorax.com" || hostname.endsWith(".r2.cloudflarestorage.com");
  } catch {
    return false;
  }
}

/** True when the playback URL points at an HLS master or media playlist. */
export function isHlsPlaybackUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url.trim());
}

/** Extension label for lightweight list placeholders. */
export function getVideoExtensionLabel(fileName: string): string {
  const match = fileName.match(/\.([a-z0-9]+)$/i);
  return (match?.[1] ?? "VIDEO").toUpperCase();
}
