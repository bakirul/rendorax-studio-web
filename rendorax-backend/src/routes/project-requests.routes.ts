import { Router } from "express";
import type { Response } from "express";
import type {
  Prisma,
  PrismaClient,
  ProjectRequestStatus,
  User,
} from "@prisma/client";
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
  findActiveMembership,
  findActiveMembershipForOrg,
  orgRoleHasCapability,
} from "../lib/clientOrganizationMembers";
import {
  canTransitionProjectRequestStatus,
  isProjectRequestStatus,
  parseAdminNote,
  parseProjectRequestCreateBody,
  statusRequiresAdminNote,
} from "../lib/projectRequests";
import {
  parseProposalCreateBody,
  parseProposalRespondBody,
} from "../lib/projectProposals";

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

async function resolveClientOrgContext(
  prisma: PrismaClient,
  actor: User,
) {
  const membership = await findActiveMembership(prisma, actor.id);
  if (membership) {
    return {
      organizationId: membership.organizationId,
      organization: membership.organization,
      memberRole: membership.role,
    };
  }
  const organization = await ensureClientOrganizationForPrimaryContact(
    prisma,
    actor,
  );
  const ensured = await findActiveMembership(prisma, actor.id);
  return {
    organizationId: organization.id,
    organization,
    memberRole: ensured?.role ?? ("primary_contact" as const),
  };
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
  convertedAgencyProject: {
    select: {
      id: true,
      title: true,
      status: true,
      archivedAt: true,
    },
  },
  convertedBy: { select: submitterSelect },
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
    convertedAgencyProjectId: request.convertedAgencyProjectId,
    convertedAt: request.convertedAt?.toISOString() ?? null,
    convertedByUserId: request.convertedByUserId,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    organization: request.organization,
    submittedBy: request.submittedBy,
    convertedAgencyProject: request.convertedAgencyProject
      ? {
          id: request.convertedAgencyProject.id,
          title: request.convertedAgencyProject.title,
          status: request.convertedAgencyProject.status,
          archivedAt:
            request.convertedAgencyProject.archivedAt?.toISOString() ?? null,
        }
      : null,
    convertedBy: request.convertedBy,
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
    convertedAgencyProjectId: request.convertedAgencyProjectId,
    convertedAgencyProject: request.convertedAgencyProject
      ? {
          id: request.convertedAgencyProject.id,
          title: request.convertedAgencyProject.title,
          status: request.convertedAgencyProject.status,
        }
      : null,
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
    const ctx = await resolveClientOrgContext(prisma, actor);
    if (!orgRoleHasCapability(ctx.memberRole, "submit_request")) {
      res.status(403).json({
        error: "Your organization role cannot submit project requests",
      });
      return;
    }

    const created = await prisma.projectRequest.create({
      data: {
        organizationId: ctx.organizationId,
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
      const ctx = await resolveClientOrgContext(prisma, actor);
      where = { organizationId: ctx.organizationId };
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
      const ctx = await resolveClientOrgContext(prisma, actor);
      if (request.organizationId !== ctx.organizationId) {
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
 * POST /api/agency/project-requests/:id/convert
 * Admin only. Creates AgencyProject from an approved request (atomic).
 */
router.post(
  "/:id/convert",
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

    const prisma = getPrisma(req);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.projectRequest.findUnique({
          where: { id: requestId },
          include: {
            organization: { select: organizationSelect },
          },
        });

        if (!existing) {
          return { kind: "not_found" as const };
        }

        if (
          existing.status === "converted_to_project" ||
          existing.convertedAgencyProjectId
        ) {
          return { kind: "already_converted" as const };
        }

        if (existing.status === "rejected") {
          return { kind: "rejected" as const };
        }

        if (existing.status !== "approved") {
          return { kind: "not_approved" as const };
        }

        const approvedProposal = await tx.projectProposal.findFirst({
          where: {
            requestId,
            status: "approved",
          },
          select: { id: true },
        });

        if (!approvedProposal) {
          return { kind: "no_approved_proposal" as const };
        }

        const project = await tx.agencyProject.create({
          data: {
            title: existing.title,
            description: existing.description,
            referenceLinks: existing.referenceLinks,
            deadline: existing.deadlineAt,
            clientId: existing.organization.primaryContactUserId,
            ownerId: actor.id,
            status: "Awaiting Assets",
          },
          include: {
            owner: {
              select: { id: true, email: true, displayName: true, role: true },
            },
            client: {
              select: { id: true, email: true, displayName: true, role: true },
            },
          },
        });

        const updatedCount = await tx.projectRequest.updateMany({
          where: {
            id: requestId,
            status: "approved",
            convertedAgencyProjectId: null,
          },
          data: {
            status: "converted_to_project",
            convertedAgencyProjectId: project.id,
            convertedAt: new Date(),
            convertedByUserId: actor.id,
          },
        });

        if (updatedCount.count !== 1) {
          throw new Error("CONVERSION_RACE");
        }

        const request = await tx.projectRequest.findUniqueOrThrow({
          where: { id: requestId },
          include: requestInclude,
        });

        return {
          kind: "ok" as const,
          request,
          project,
        };
      });

      if (result.kind === "not_found") {
        res.status(404).json({ error: "Project request not found" });
        return;
      }
      if (result.kind === "already_converted") {
        res.status(409).json({ error: "Already converted" });
        return;
      }
      if (result.kind === "rejected") {
        res.status(409).json({ error: "Rejected requests cannot be converted" });
        return;
      }
      if (result.kind === "not_approved") {
        res.status(409).json({
          error: "Only approved requests can be converted to a project",
        });
        return;
      }
      if (result.kind === "no_approved_proposal") {
        res.status(409).json({
          error: "An approved proposal is required before conversion",
        });
        return;
      }

      res.status(201).json({
        request: serializeRequest(result.request),
        project: result.project,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "CONVERSION_RACE") {
        res.status(409).json({ error: "Already converted" });
        return;
      }
      console.error("Failed to convert project request:", error);
      res.status(500).json({ error: "Failed to convert project request" });
    }
  },
);

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

const proposalCreatorSelect = {
  id: true,
  email: true,
  displayName: true,
} as const;

const proposalInclude = {
  createdBy: { select: proposalCreatorSelect },
  approvedBy: { select: proposalCreatorSelect },
} satisfies Prisma.ProjectProposalInclude;

function serializeProposal(
  proposal: Prisma.ProjectProposalGetPayload<{ include: typeof proposalInclude }>,
) {
  return {
    id: proposal.id,
    requestId: proposal.requestId,
    createdByUserId: proposal.createdByUserId,
    approvedByUserId: proposal.approvedByUserId,
    version: proposal.version,
    estimatedCostCents: proposal.estimatedCostCents,
    currency: proposal.currency,
    timelineText: proposal.timelineText,
    deliverablesText: proposal.deliverablesText,
    notes: proposal.notes,
    termsText: proposal.termsText,
    status: proposal.status,
    sentAt: proposal.sentAt?.toISOString() ?? null,
    respondedAt: proposal.respondedAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    createdBy: proposal.createdBy,
    approvedBy: proposal.approvedBy,
  };
}

async function assertCanAccessRequest(
  prisma: PrismaClient,
  req: AuthenticatedRequest,
  res: Response,
  actor: User,
  requestId: string,
): Promise<{
  request: Prisma.ProjectRequestGetPayload<{ include: typeof requestInclude }>;
  role: "admin" | "client" | "editor";
} | null> {
  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  if (role === "editor") {
    res.status(403).json({ error: "Editors cannot access project requests" });
    return null;
  }

  const request = await prisma.projectRequest.findUnique({
    where: { id: requestId },
    include: requestInclude,
  });

  if (!request) {
    res.status(404).json({ error: "Project request not found" });
    return null;
  }

  if (role === "client") {
    const ctx = await resolveClientOrgContext(prisma, actor);
    if (request.organizationId !== ctx.organizationId) {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }
  } else if (!isAdminRole(req.user?.role)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return { request, role: role === "admin" ? "admin" : "client" };
}

/**
 * GET /api/agency/project-requests/:id/proposals
 */
router.get(
  "/:id/proposals",
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    const requestId = String(req.params.id ?? "").trim();
    if (!requestId) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const prisma = getPrisma(req);
    const access = await assertCanAccessRequest(
      prisma,
      req,
      res,
      actor,
      requestId,
    );
    if (!access) return;

    try {
      const proposals = await prisma.projectProposal.findMany({
        where: { requestId },
        orderBy: { version: "desc" },
        include: proposalInclude,
      });
      res.json({ proposals: proposals.map(serializeProposal) });
    } catch (error) {
      console.error("Failed to list proposals:", error);
      res.status(500).json({ error: "Failed to list proposals" });
    }
  },
);

/**
 * POST /api/agency/project-requests/:id/proposals
 * Admin only — creates next draft version.
 */
router.post(
  "/:id/proposals",
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

    const parsed = parseProposalCreateBody(req.body);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const prisma = getPrisma(req);

    try {
      const request = await prisma.projectRequest.findUnique({
        where: { id: requestId },
      });
      if (!request) {
        res.status(404).json({ error: "Project request not found" });
        return;
      }
      if (
        request.status === "rejected" ||
        request.status === "approved" ||
        request.status === "converted_to_project"
      ) {
        res.status(409).json({
          error:
            "Cannot create a proposal for an approved, converted, or rejected request",
        });
        return;
      }

      const approved = await prisma.projectProposal.findFirst({
        where: { requestId, status: "approved" },
        select: { id: true },
      });
      if (approved) {
        res.status(409).json({
          error: "Request already has an approved proposal",
        });
        return;
      }

      const existingDraft = await prisma.projectProposal.findFirst({
        where: { requestId, status: "draft" },
        select: { id: true, version: true },
      });
      if (existingDraft) {
        res.status(409).json({
          error:
            "A draft proposal already exists. Update or send it before creating a revision.",
          proposalId: existingDraft.id,
        });
        return;
      }

      const latest = await prisma.projectProposal.findFirst({
        where: { requestId },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const version = (latest?.version ?? 0) + 1;

      const created = await prisma.projectProposal.create({
        data: {
          requestId,
          createdByUserId: actor.id,
          version,
          estimatedCostCents: parsed.data.estimatedCostCents,
          currency: parsed.data.currency,
          timelineText: parsed.data.timelineText,
          deliverablesText: parsed.data.deliverablesText,
          notes: parsed.data.notes,
          termsText: parsed.data.termsText,
          status: "draft",
        },
        include: proposalInclude,
      });

      res.status(201).json({ proposal: serializeProposal(created) });
    } catch (error) {
      console.error("Failed to create proposal:", error);
      res.status(500).json({ error: "Failed to create proposal" });
    }
  },
);

/**
 * PATCH /api/agency/project-requests/:id/proposals/:proposalId
 * Admin only — update draft content.
 */
router.patch(
  "/:id/proposals/:proposalId",
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    if (!isAdminRole(req.user?.role)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const requestId = String(req.params.id ?? "").trim();
    const proposalId = String(req.params.proposalId ?? "").trim();
    if (!requestId || !proposalId) {
      res.status(400).json({ error: "id and proposalId are required" });
      return;
    }

    const parsed = parseProposalCreateBody(req.body);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const prisma = getPrisma(req);

    try {
      const proposal = await prisma.projectProposal.findFirst({
        where: { id: proposalId, requestId },
      });
      if (!proposal) {
        res.status(404).json({ error: "Proposal not found" });
        return;
      }
      if (proposal.status !== "draft") {
        res.status(409).json({
          error: "Only draft proposals can be edited",
        });
        return;
      }

      const updated = await prisma.projectProposal.update({
        where: { id: proposalId },
        data: {
          estimatedCostCents: parsed.data.estimatedCostCents,
          currency: parsed.data.currency,
          timelineText: parsed.data.timelineText,
          deliverablesText: parsed.data.deliverablesText,
          notes: parsed.data.notes,
          termsText: parsed.data.termsText,
        },
        include: proposalInclude,
      });

      res.json({ proposal: serializeProposal(updated) });
    } catch (error) {
      console.error("Failed to update proposal draft:", error);
      res.status(500).json({ error: "Failed to update proposal" });
    }
  },
);

/**
 * PATCH /api/agency/project-requests/:id/proposals/:proposalId/send
 * Admin only.
 */
router.patch(
  "/:id/proposals/:proposalId/send",
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    if (!isAdminRole(req.user?.role)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const requestId = String(req.params.id ?? "").trim();
    const proposalId = String(req.params.proposalId ?? "").trim();
    if (!requestId || !proposalId) {
      res.status(400).json({ error: "id and proposalId are required" });
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
      if (
        request.status === "rejected" ||
        request.status === "approved" ||
        request.status === "converted_to_project"
      ) {
        res.status(409).json({
          error:
            "Cannot send a proposal for an approved, converted, or rejected request",
        });
        return;
      }

      const proposal = await prisma.projectProposal.findFirst({
        where: { id: proposalId, requestId },
      });
      if (!proposal) {
        res.status(404).json({ error: "Proposal not found" });
        return;
      }
      if (proposal.status !== "draft") {
        res.status(409).json({ error: "Only draft proposals can be sent" });
        return;
      }

      const activeSent = await prisma.projectProposal.findFirst({
        where: { requestId, status: "sent" },
        select: { id: true },
      });
      if (activeSent) {
        res.status(409).json({
          error: "Another sent proposal is already active for this request",
        });
        return;
      }

      const [updatedProposal, updatedRequest] = await prisma.$transaction([
        prisma.projectProposal.update({
          where: { id: proposalId },
          data: {
            status: "sent",
            sentAt: new Date(),
          },
          include: proposalInclude,
        }),
        prisma.projectRequest.update({
          where: { id: requestId },
          data: { status: "quoted" },
          include: requestInclude,
        }),
      ]);

      res.json({
        proposal: serializeProposal(updatedProposal),
        request: serializeRequest(updatedRequest),
      });
    } catch (error) {
      console.error("Failed to send proposal:", error);
      res.status(500).json({ error: "Failed to send proposal" });
    }
  },
);

/**
 * PATCH /api/agency/project-requests/:id/proposals/:proposalId/respond
 * Owning Client only.
 */
router.patch(
  "/:id/proposals/:proposalId/respond",
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    const role = mapSupabaseRoleToAgencyRole(req.user?.role);
    if (role !== "client") {
      res.status(403).json({ error: "Only clients can respond to proposals" });
      return;
    }

    const requestId = String(req.params.id ?? "").trim();
    const proposalId = String(req.params.proposalId ?? "").trim();
    if (!requestId || !proposalId) {
      res.status(400).json({ error: "id and proposalId are required" });
      return;
    }

    const parsed = parseProposalRespondBody(req.body);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const prisma = getPrisma(req);

    try {
      const access = await assertCanAccessRequest(
        prisma,
        req,
        res,
        actor,
        requestId,
      );
      if (!access) return;

      const membership = await findActiveMembershipForOrg(
        prisma,
        actor.id,
        access.request.organizationId,
      );
      const memberRole =
        membership?.role ??
        (await resolveClientOrgContext(prisma, actor)).memberRole;
      if (!orgRoleHasCapability(memberRole, "respond_proposal")) {
        res.status(403).json({
          error: "Your organization role cannot approve or reject proposals",
        });
        return;
      }

      const proposal = await prisma.projectProposal.findFirst({
        where: { id: proposalId, requestId },
      });
      if (!proposal) {
        res.status(404).json({ error: "Proposal not found" });
        return;
      }
      if (proposal.status !== "sent") {
        res.status(409).json({
          error: "Only a sent proposal can be responded to",
        });
        return;
      }

      if (access.request.status !== "quoted") {
        res.status(409).json({
          error:
            "Proposal response is only allowed when the request status is quoted",
        });
        return;
      }

      const now = new Date();
      let proposalStatus: "approved" | "changes_requested" | "rejected";
      let requestStatus: ProjectRequestStatus;
      let approvedByUserId: string | null = null;

      if (parsed.action === "approve") {
        proposalStatus = "approved";
        requestStatus = "approved";
        approvedByUserId = actor.id;
      } else if (parsed.action === "request_changes") {
        proposalStatus = "changes_requested";
        requestStatus = "under_review";
      } else {
        proposalStatus = "rejected";
        requestStatus = "rejected";
      }

      const [updatedProposal, updatedRequest] = await prisma.$transaction([
        prisma.projectProposal.update({
          where: { id: proposalId },
          data: {
            status: proposalStatus,
            respondedAt: now,
            approvedByUserId,
            ...(parsed.note
              ? {
                  notes: proposal.notes
                    ? `${proposal.notes}\n\nClient response: ${parsed.note}`
                    : `Client response: ${parsed.note}`,
                }
              : {}),
          },
          include: proposalInclude,
        }),
        prisma.projectRequest.update({
          where: { id: requestId },
          data: {
            status: requestStatus,
            ...(parsed.note && parsed.action !== "approve"
              ? { adminNote: parsed.note }
              : {}),
          },
          include: requestInclude,
        }),
      ]);

      res.json({
        proposal: serializeProposal(updatedProposal),
        request: serializeRequest(updatedRequest),
      });
    } catch (error) {
      console.error("Failed to respond to proposal:", error);
      res.status(500).json({ error: "Failed to respond to proposal" });
    }
  },
);

export default router;
