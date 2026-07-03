export const COMMENTS_SIDEBAR_STORAGE_KEY = "rendorax-comments-sidebar-width";

export const COMMENTS_SIDEBAR_MIN_PX = 20;
export const COMMENTS_SIDEBAR_MAX_PX = 500;
export const COMMENTS_SIDEBAR_DEFAULT_PX = 350;

export function clampCommentsSidebarWidth(width: number): number {
  return Math.max(
    COMMENTS_SIDEBAR_MIN_PX,
    Math.min(COMMENTS_SIDEBAR_MAX_PX, Math.round(width)),
  );
}

export function loadPersistedCommentsSidebarWidth(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(COMMENTS_SIDEBAR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;
    return clampCommentsSidebarWidth(parsed);
  } catch {
    return null;
  }
}

export function persistCommentsSidebarWidth(width: number): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      COMMENTS_SIDEBAR_STORAGE_KEY,
      String(clampCommentsSidebarWidth(width)),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}
