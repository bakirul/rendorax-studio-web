/**
 * Demo Workspace v1 — configuration helpers (IDs from env only; never hardcode).
 * Missing env → no-op filters so production Admin continues normally.
 */

function trimId(value: string | undefined | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Prefer NEXT_PUBLIC_ for client bundles; fall back for SSR if set. */
export function getDemoAgencyProjectId(): string | null {
  return (
    trimId(process.env.NEXT_PUBLIC_DEMO_AGENCY_PROJECT_ID) ??
    trimId(process.env.DEMO_AGENCY_PROJECT_ID)
  );
}

export function getDemoClientUserId(): string | null {
  return (
    trimId(process.env.NEXT_PUBLIC_DEMO_CLIENT_USER_ID) ??
    trimId(process.env.DEMO_CLIENT_USER_ID)
  );
}

export function getDemoEditorUserId(): string | null {
  return (
    trimId(process.env.NEXT_PUBLIC_DEMO_EDITOR_USER_ID) ??
    trimId(process.env.DEMO_EDITOR_USER_ID)
  );
}

export type DemoProjectLike = {
  id: string;
  clientId?: string | null;
  client?: unknown;
};

function readLinkedClientId(project: DemoProjectLike): string {
  if (typeof project.clientId === "string" && project.clientId.trim()) {
    return project.clientId.trim();
  }
  if (project.client && typeof project.client === "object" && "id" in project.client) {
    const id = (project.client as { id?: unknown }).id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return "";
}

/** True when project matches demo project id or demo client id. */
export function isDemoWorkspaceProject(project: DemoProjectLike): boolean {
  const demoProjectId = getDemoAgencyProjectId();
  const demoClientId = getDemoClientUserId();
  const projectId = project.id.trim();
  const clientId = readLinkedClientId(project);

  if (demoProjectId && projectId && projectId === demoProjectId) return true;
  if (demoClientId && clientId && clientId === demoClientId) return true;
  return false;
}

export function excludeDemoWorkspaceProjects<T extends DemoProjectLike>(
  projects: T[],
): T[] {
  if (!getDemoAgencyProjectId() && !getDemoClientUserId()) {
    return projects;
  }
  return projects.filter((project) => !isDemoWorkspaceProject(project));
}

export function isDemoWorkspaceProjectId(projectId: string | null | undefined): boolean {
  const demoProjectId = getDemoAgencyProjectId();
  if (!demoProjectId || typeof projectId !== "string") return false;
  return projectId.trim() === demoProjectId;
}
