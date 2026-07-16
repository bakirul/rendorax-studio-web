import { Router } from "express";
import type { Response } from "express";
import type { Prisma, PrismaClient, ProjectRequestStatus } from "@prisma/client";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/requireAuth";
import {
  ensureAgencyUser,
  mapSupabaseRoleToAgencyRole,
} from "../lib/agencyUsers";
import { ensureClientOrganizationForPrimaryContact } from "../lib/clientOrganizations";
import {
  canTransitionProjectRequestStatus,
  isProjectRequestStatus,
  parseAdminNote,
  parseProjectRequestCreateBody,
  statusRequiresAdminNote,
} from "../lib/projectRequests";

const router = Router();

router.use(requireAuth);

function getPrisma(req: AuthenticatedRequest): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

function isAdminRole(role: string | undefined): boolean {
  return role === "admin";
}

async function requireAgencyUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    return await ensureAgencyUser(getPrisma(req), req.user);
  } catch (error) {
    console.error("Failed to sync agency user:", error);
    res.status(400).json({ error: "Unable to resolve authenticated user" });
    return null;
  }
}

const organizationSelect = {
  id: true,
  name: true,
  primaryContactUserId: true,
} as const;

const submitterSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
} as const;

const requestInclude = {
  organization: { select: organizationSelect },
  submittedBy: { select: submitterSelect },
} satisfies Prisma.ProjectRequestInclude;

function serializeRequest(
  request: Prisma.ProjectRequestGetPayload<{ include: typeof requestInclude }>,
) {
  return {
    id: request.id,
    organizationId: request.organizationId,
    submittedByUserId: request.submittedByUserId,
    title: request.title,
    projectType: request.projectType,
    description: request.description,
    referenceLinks: request.referenceLinks,
    deadlineAt: request.deadlineAt?.toISOString() ?? null,
    deliverables: request.deliverables,
    budgetRange: request.budgetRange,
    status: request.status,
    adminNote: request.adminNote,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    organization: request.organization,
    submittedBy: request.submittedBy,
  };
}

function serializeSummary(
  request: Prisma.ProjectRequestGetPayload<{ include: typeof requestInclude }>,
) {
  return {
    id: request.id,
    title: request.title,
    projectType: request.projectType,
    status: request.status,
    deadlineAt: request.deadlineAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    organization: {
      id: request.organization.id,
      name: request.organization.name,
    },
    submittedBy: {
      id: request.submittedBy.id,
      email: request.submittedBy.email,
      displayName: request.submittedBy.displayName,
    },
  };
}

/**
 * POST /api/agency/project-requests
 * Client only — creates a pre-project request (never AgencyProject).
 */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  if (role !== "client") {
    res.status(403).json({ error: "Only clients can submit project requests" });
    return;
  }

  const parsed = parseProjectRequestCreateBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const prisma = getPrisma(req);

  try {
    const organization = await ensureClientOrganizationForPrimaryContact(
      prisma,
      actor,
    );

    const created = await prisma.projectRequest.create({
      data: {
        organizationId: organization.id,
        submittedByUserId: actor.id,
        title: parsed.data.title,
        projectType: parsed.data.projectType,
        description: parsed.data.description,
        referenceLinks: parsed.data.referenceLinks,
        deadlineAt: parsed.data.deadlineAt,
        deliverables: parsed.data.deliverables,
        budgetRange: parsed.data.budgetRange,
        status: "submitted",
      },
      include: requestInclude,
    });

    res.status(201).json({ request: serializeRequest(created) });
  } catch (error) {
    console.error("Failed to create project request:", error);
    res.status(500).json({ error: "Failed to create project request" });
  }
});

/**
 * GET /api/agency/project-requests
 * Client: own org. Admin: all (+ optional filters). Editor: 403.
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  const prisma = getPrisma(req);

  if (role === "editor") {
    res.status(403).json({ error: "Editors cannot access project requests" });
    return;
  }

  try {
    let where: Prisma.ProjectRequestWhereInput = {};

    if (role === "client") {
      const organization = await ensureClientOrganizationForPrimaryContact(
        prisma,
        actor,
      );
      where = { organizationId: organization.id };
    } else if (isAdminRole(req.user?.role)) {
      const statusFilter = String(req.query.status ?? "").trim();
      if (statusFilter) {
        if (!isProjectRequestStatus(statusFilter)) {
          res.status(400).json({ error: "Invalid status filter" });
          return;
        }
        where.status = statusFilter;
      }

      const organizationId = String(req.query.organizationId ?? "").trim();
      if (organizationId) {
        where.organizationId = organizationId;
      }
    } else {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const requests = await prisma.projectRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: requestInclude,
    });

    res.json({ requests: requests.map(serializeSummary) });
  } catch (error) {
    console.error("Failed to list project requests:", error);
    res.status(500).json({ error: "Failed to list project requests" });
  }
});

/**
 * GET /api/agency/project-requests/:id
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  if (role === "editor") {
    res.status(403).json({ error: "Editors cannot access project requests" });
    return;
  }

  const requestId = String(req.params.id ?? "").trim();
  if (!requestId) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const prisma = getPrisma(req);

  try {
    const request = await prisma.projectRequest.findUnique({
      where: { id: requestId },
      include: requestInclude,
    });

    if (!request) {
      res.status(404).json({ error: "Project request not found" });
      return;
    }

    if (role === "client") {
      const organization = await ensureClientOrganizationForPrimaryContact(
        prisma,
        actor,
      );
      if (request.organizationId !== organization.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    } else if (!isAdminRole(req.user?.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    console.error("Failed to fetch project request:", error);
    res.status(500).json({ error: "Failed to fetch project request" });
  }
});

/**
 * PATCH /api/agency/project-requests/:id/status
 * Admin only. Does not create AgencyProject or Proposal.
 */
router.patch(
  "/:id/status",
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    if (!isAdminRole(req.user?.role)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const requestId = String(req.params.id ?? "").trim();
    if (!requestId) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const body = req.body ?? {};
    const nextStatusRaw =
      typeof body.status === "string" ? body.status.trim() : "";
    if (!nextStatusRaw || !isProjectRequestStatus(nextStatusRaw)) {
      res.status(400).json({ error: "Valid status is required" });
      return;
    }
    const nextStatus = nextStatusRaw as ProjectRequestStatus;

    const noteParsed = parseAdminNote(body.adminNote);
    if (!noteParsed.ok) {
      res.status(400).json({ error: noteParsed.error });
      return;
    }

    if (statusRequiresAdminNote(nextStatus) && !noteParsed.value) {
      res.status(400).json({
        error: "adminNote is required for needs_clarification and rejected",
      });
      return;
    }

    const prisma = getPrisma(req);

    try {
      const existing = await prisma.projectRequest.findUnique({
        where: { id: requestId },
        include: requestInclude,
      });

      if (!existing) {
        res.status(404).json({ error: "Project request not found" });
        return;
      }

      if (
        !canTransitionProjectRequestStatus(existing.status, nextStatus)
      ) {
        res.status(409).json({
          error: `Cannot transition from ${existing.status} to ${nextStatus}`,
        });
        return;
      }

      const updated = await prisma.projectRequest.update({
        where: { id: requestId },
        data: {
          status: nextStatus,
          // Preserve prior adminNote when not provided; overwrite when provided.
          ...(noteParsed.value ? { adminNote: noteParsed.value } : {}),
        },
        include: requestInclude,
      });

      res.json({ request: serializeRequest(updated) });
    } catch (error) {
      console.error("Failed to update project request status:", error);
      res.status(500).json({ error: "Failed to update project request status" });
    }
  },
);

export default router;
