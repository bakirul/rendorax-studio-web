/**
 * Editor staffing specializations — metadata only, not auth roles.
 * Keep in sync with rendorax-backend/src/lib/editorSpecializations.ts
 */
export const EDITOR_SPECIALIZATIONS = [
  "Video Editor",
  "Sound Editor",
  "SFX Designer",
  "Motion Graphics Designer",
  "VFX Artist",
  "Colorist",
] as const;

export type EditorSpecialization = (typeof EDITOR_SPECIALIZATIONS)[number];

export const DEFAULT_EDITOR_SPECIALIZATION: EditorSpecialization =
  "Video Editor";

export function formatTeamMemberLabel(user: {
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  specialization?: string | null;
}): string {
  const name =
    user.displayName?.trim() || user.email?.trim() || "Team member";

  if (user.role === "admin") {
    return `${name} · Admin`;
  }

  if (user.role === "editor") {
    const spec = user.specialization?.trim();
    return spec ? `${name} · ${spec}` : `${name} · Editor`;
  }

  return name;
}

export function formatAssigneeOptionLabel(user: {
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  specialization?: string | null;
}): string {
  const name =
    user.displayName?.trim() || user.email?.trim() || "Team member";

  if (user.role === "admin") {
    return `${name} — Admin`;
  }

  if (user.role === "editor") {
    const spec = user.specialization?.trim();
    return spec ? `${name} — ${spec}` : `${name} — Editor`;
  }

  return name;
}
