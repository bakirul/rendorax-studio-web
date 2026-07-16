/**
 * Editor staffing specializations — metadata only, not auth roles.
 * Auth roles remain: admin | editor | client.
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

const ALLOWED = new Set<string>(EDITOR_SPECIALIZATIONS);

export function isEditorSpecialization(
  value: string,
): value is EditorSpecialization {
  return ALLOWED.has(value);
}

/** Normalize / validate specialization for editor provisioning. */
export function resolveEditorSpecialization(
  raw: unknown,
): { ok: true; value: EditorSpecialization } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: DEFAULT_EDITOR_SPECIALIZATION };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "specialization must be a string" };
  }
  const trimmed = raw.trim();
  if (!isEditorSpecialization(trimmed)) {
    return {
      ok: false,
      error: `specialization must be one of: ${EDITOR_SPECIALIZATIONS.join(", ")}`,
    };
  }
  return { ok: true, value: trimmed };
}
