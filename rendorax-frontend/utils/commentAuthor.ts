export interface CommentAuthorFields {
  author_display_name: string;
  author_avatar_url: string | null;
}

export interface VideoCommentRow {
  id: string;
  file_name: string;
  user_id: string;
  time_stamp: number;
  comment_text: string;
  author_display_name?: string | null;
  author_avatar_url?: string | null;
  created_at?: string;
}

type SessionUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

/** Resolve author fields from Supabase session at comment insert time. */
export function resolveCommentAuthor(user: SessionUserLike): CommentAuthorFields {
  const meta = user.user_metadata ?? {};
  const fullName =
    typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const name = typeof meta.name === "string" ? meta.name.trim() : "";
  const emailLocal = user.email?.split("@")[0]?.trim() ?? "";

  const author_display_name =
    fullName || name || emailLocal || "Reviewer";

  const avatarRaw =
    (typeof meta.avatar_url === "string" ? meta.avatar_url : "") ||
    (typeof meta.picture === "string" ? meta.picture : "");
  const author_avatar_url = avatarRaw.trim() || null;

  return { author_display_name, author_avatar_url };
}

/** Display name for a fetched comment row (legacy rows may lack stored author). */
export function getCommentDisplayName(comment: VideoCommentRow): string {
  const stored = comment.author_display_name?.trim();
  return stored || "Reviewer";
}

/** Initials for avatar fallback (1–2 characters). */
export function getAuthorInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  const word = parts[0] ?? "R";
  return word.slice(0, 2).toUpperCase();
}
