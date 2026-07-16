import type { PrismaClient } from "@prisma/client";
import type { AuthenticatedRequest } from "../middleware/requireAuth";

export const ARCHIVED_PROJECT_WORKSPACE_ERROR =
  "This project is archived and cannot be used as an active workspace.";

export type AgencyProjectAccessResult =
  | { ok: true; projectId: string }
  | { ok: false; status: 403 | 404 | 409; error: string };

function isAdminRole(role: string | undefined): boolean {
  return role === "admin";
}

function isClientRole(role: string | undefined): boolean {
  return role === "client";
}

export type AssertAgencyProjectAccessOptions = {
  /**
   * When true, archived projects are allowed (Admin archive listing/restore only).
   * Active workspace APIs must leave this false/undefined.
   */
  allowArchived?: boolean;
};

/**
 * Role-scoped project access for active workspace APIs.
 * Rejects archived projects with 409 unless allowArchived is set.
 */
export async function assertAgencyProjectAccess(
  prisma: PrismaClient,
  req: AuthenticatedRequest,
  projectId: string,
  options: AssertAgencyProjectAccessOptions = {},
): Promise<AgencyProjectAccessResult> {
  const actorId = req.user?.id;
  if (!actorId) {
    return { ok: false, status: 403, error: "Unauthorized" };
  }

  const trimmed = projectId.trim();
  if (!trimmed) {
    return { ok: false, status: 404, error: "Project not found" };
  }

  const project = await prisma.agencyProject.findUnique({
    where: { id: trimmed },
    select: { id: true, ownerId: true, clientId: true, archivedAt: true },
  });

  if (!project) {
    return { ok: false, status: 404, error: "Project not found" };
  }

  if (!options.allowArchived && project.archivedAt) {
    return {
      ok: false,
      status: 409,
      error: ARCHIVED_PROJECT_WORKSPACE_ERROR,
    };
  }

  if (isClientRole(req.user?.role)) {
    if (project.clientId !== actorId) {
      return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true, projectId: project.id };
  }

  if (isAdminRole(req.user?.role)) {
    return { ok: true, projectId: project.id };
  }

  const isProjectOwner = project.ownerId === actorId;
  const assignedTask = await prisma.task.findFirst({
    where: { assigneeId: actorId, projectId: project.id },
    select: { id: true },
  });

  if (!isProjectOwner && !assignedTask) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, projectId: project.id };
}

/** Convenience alias for active workspace routes. */
export async function assertActiveAgencyProjectAccess(
  prisma: PrismaClient,
  req: AuthenticatedRequest,
  projectId: string,
): Promise<AgencyProjectAccessResult> {
  return assertAgencyProjectAccess(prisma, req, projectId, {
    allowArchived: false,
  });
}
