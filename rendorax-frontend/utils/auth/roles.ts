import type { User } from "@supabase/supabase-js";

/** Matches Supabase `app_metadata.role` set via SQL (e.g. `'admin'`). */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.app_metadata?.role === "admin";
}
