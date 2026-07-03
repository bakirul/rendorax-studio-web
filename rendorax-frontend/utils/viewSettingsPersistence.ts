import type { ViewSettings } from "@/store/useDashboardStore";

export const VIEW_SETTINGS_STORAGE_KEY = "rendorax-view-settings";

export function loadPersistedViewSettings(): Partial<ViewSettings> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(VIEW_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ViewSettings>;
    if (
      parsed.thumbnailSizePercent != null &&
      (parsed.thumbnailSizePercent < 20 || parsed.thumbnailSizePercent > 200)
    ) {
      parsed.thumbnailSizePercent = 100;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function persistViewSettings(settings: ViewSettings): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      VIEW_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}
