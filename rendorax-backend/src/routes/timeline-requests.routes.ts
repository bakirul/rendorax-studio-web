import { Router } from "express";
import type { Response } from "express";
import type {
  Prisma,
  PrismaClient,
  TimelineRequestStatus,
  User,
} from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/requireAuth";
import {
  ensureAgencyUser,
  mapSupabaseRoleToAgencyRole,
} from "../lib/agencyUsers";
import {
  ARCHIVED_PROJECT_WORKSPACE_ERROR,
  assertActiveAgencyProjectAccess,
} from "../lib/agencyProjectAccess";
import {
  getClientOrgRoleForProject,
  orgRoleHasCapability,
} from "../lib/clientOrganizationMembers";

const router = Router();

router.use(requireAuth);

const MESSAGE_MAX_LENGTH = 2000;

const OPEN_STATUSES: TimelineRequestStatus[] = [
  "pending",
  "accepted",
  "active",
];

const OPEN_REQUEST_UNIQUE_INDEX = "TimelineRequest_requester_asset_open_uidx";

const ALL_STATUSES = new Set<TimelineRequestStatus>([
  "pending",
  "accepted",
  "active",
  "ended",
  "declined",
  "cancelled",
]);

/** Mirrors frontend getReviewRoomId asset branch — must stay in sync. */
function deriveReviewRoomId(assetId: string): string {
  return `review:asset:${assetId}`;
}

function getPrisma(req: AuthenticatedRequest): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

function isAdminRole(role: string | undefined): boolean {
  return role === "admin";
}

function isClientRole(role: string | undefined): boolean {
  return role === "client";
}

/**
 * Detect only the open-request partial unique index violation.
 * Prisma P2002 or Postgres 23505 with our index/target fields.
 */
function isOpenRequestUniqueViolation(error: unknown): boolean {
  if (
    error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target;
    if (typeof target === "string") {
      return (
        target.includes(OPEN_REQUEST_UNIQUE_INDEX) ||
        (target.includes("requesterId") && target.includes("assetId"))
      );
    }
    if (Array.isArray(target)) {
      const fields = target.map(String);
      return (
        fields.includes("requesterId") &&
        fields.includes("assetId")
      ) || fields.some((f) => f.includes(OPEN_REQUEST_UNIQUE_INDEX));
    }
    // Some drivers omit target; constrain via message when safe.
    const msg = error.message ?? "";
    return msg.includes(OPEN_REQUEST_UNIQUE_INDEX);
  }

  if (error && typeof error === "object") {
    const maybe = error as {
      code?: string | number;
      constraint?: string;
      message?: string;
    };
    if (
      maybe.code === "23505" ||
      String(maybe.code) === "23505"
    ) {
      const haystack = `${maybe.constraint ?? ""} ${maybe.message ?? ""}`;
      return haystack.includes(OPEN_REQUEST_UNIQUE_INDEX);
    }
  }

  return false;
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

const userSummarySelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
} as const;

const assetSummarySelect = {
  id: true,
  fileName: true,
  folder: true,
  agencyProjectId: true,
} as const;

const projectSummarySelect = {
  id: true,
  title: true,
  status: true,
  archivedAt: true,
} as const;

const requestInclude = {
  requester: { select: userSummarySelect },
  asset: { select: assetSummarySelect },
  agencyProject: { select: projectSummarySelect },
  assignedEditor: { select: userSummarySelect },
  acceptedBy: { select: userSummarySelect },
} satisfies Prisma.TimelineRequestInclude;

type TimelineRequestRow = Prisma.TimelineRequestGetPayload<{
  include: typeof requestInclude;
}>;

function serializeRequest(row: TimelineRequestRow) {
  return {
    id: row.id,
    assetId: row.assetId,
    agencyProjectId: row.agencyProjectId,
    requesterId: row.requesterId,
    assignedEditorId: row.assignedEditorId,
    acceptedById: row.acceptedById,
    status: row.status,
    message: row.message,
    reviewRoomId: row.reviewRoomId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    declinedAt: row.declinedAt?.toISOString() ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    declineReason: row.declineReason,
    requester: row.requester,
    asset: row.asset,
    agencyProject: {
      id: row.agencyProject.id,
      title: row.agencyProject.title,
      status: row.agencyProject.status,
      archivedAt: row.agencyProject.archivedAt?.toISOString() ?? null,
    },
    assignedEditor: row.assignedEditor,
    acceptedBy: row.acceptedBy,
  };
}

function serializeSummary(row: TimelineRequestRow) {
  return {
    id: row.id,
    assetId: row.assetId,
    agencyProjectId: row.agencyProjectId,
    requesterId: row.requesterId,
    status: row.status,
    message: row.message,
    reviewRoomId: row.reviewRoomId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    requester: {
      id: row.requester.id,
      displayName: row.requester.displayName,
      email: row.requester.email,
    },
    asset: {
      id: row.asset.id,
      fileName: row.asset.fileName,
      folder: row.asset.folder,
    },
    agencyProject: {
      id: row.agencyProject.id,
      title: row.agencyProject.title,
      status: row.agencyProject.status,
    },
  };
}

/** Editor project scope: owner OR task assignee (matches assertAgencyProjectAccess). */
async function getEditorAuthorizedProjectIds(
  prisma: PrismaClient,
  editorId: string,
): Promise<string[]> {
  const owned = await prisma.agencyProject.findMany({
    where: { ownerId: editorId, archivedAt: null },
    select: { id: true },
  });
  const assigned = await prisma.task.findMany({
    where: {
      assigneeId: editorId,
      project: { archivedAt: null },
    },
    select: { projectId: true },
    distinct: ["projectId"],
  });
  return [
    ...new Set([
      ...owned.map((p) => p.id),
      ...assigned.map((t) => t.projectId),
    ]),
  ];
}

async function assertCanAccessTimelineRequest(
  prisma: PrismaClient,
  req: AuthenticatedRequest,
  actor: User,
  row: TimelineRequestRow,
): Promise<{ ok: true } | { ok: false; status: 403 | 404 | 409; error: string }> {
  const role = mapSupabaseRoleToAgencyRole(req.user?.role);

  if (isAdminRole(req.user?.role)) {
    return { ok: true };
  }

  if (role === "client") {
    if (row.requesterId !== actor.id) {
      return { ok: false, status: 404, error: "Timeline request not found" };
    }
    const access = await assertActiveAgencyProjectAccess(
      prisma,
      req,
      row.agencyProjectId,
    );
    if (!access.ok) {
      if (access.status === 404 || access.status === 403) {
        return { ok: false, status: 404, error: "Timeline request not found" };
      }
      return { ok: false, status: access.status, error: access.error };
    }
    return { ok: true };
  }

  // Editor
  const access = await assertActiveAgencyProjectAccess(
    prisma,
    req,
    row.agencyProjectId,
  );
  if (!access.ok) {
    if (access.status === 404 || access.status === 403) {
      return { ok: false, status: 404, error: "Timeline request not found" };
    }
    return { ok: false, status: access.status, error: access.error };
  }
  return { ok: true };
}

/**
 * POST /api/agency/timeline-requests
 * Client (with comment capability) or Admin. Creates PENDING only.
 */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);

  if (role === "editor" && !isAdminRole(req.user?.role)) {
    res.status(403).json({
      error: "Editors cannot create timeline requests",
    });
    return;
  }

  if (role !== "client" && !isAdminRole(req.user?.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const body = req.body ?? {};
  const assetId =
    typeof body.assetId === "string" ? body.assetId.trim() : "";
  if (!assetId) {
    res.status(400).json({ error: "assetId is required" });
    return;
  }

  let message: string | null = null;
  if (body.message !== undefined && body.message !== null) {
    if (typeof body.message !== "string") {
      res.status(400).json({ error: "message must be a string" });
      return;
    }
    const trimmed = body.message.trim();
    if (trimmed.length > MESSAGE_MAX_LENGTH) {
      res.status(400).json({
        error: `message must be at most ${MESSAGE_MAX_LENGTH} characters`,
      });
      return;
    }
    message = trimmed || null;
  }

  const prisma = getPrisma(req);

  try {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        agencyProjectId: true,
        fileName: true,
      },
    });

    if (!asset) {
      res.status(404).json({ error: "Media asset not found" });
      return;
    }

    if (!asset.agencyProjectId) {
      res.status(400).json({
        error:
          "Timeline requests require a project-linked media asset",
      });
      return;
    }

    const access = await assertActiveAgencyProjectAccess(
      prisma,
      req,
      asset.agencyProjectId,
    );
    if (!access.ok) {
      if (access.status === 404) {
        res.status(404).json({ error: "Media asset not found" });
        return;
      }
      res.status(access.status).json({ error: access.error });
      return;
    }

    if (isClientRole(req.user?.role)) {
      const project = await prisma.agencyProject.findUnique({
        where: { id: asset.agencyProjectId },
        select: { clientId: true },
      });
      const orgRole = await getClientOrgRoleForProject(
        prisma,
        actor.id,
        project?.clientId,
      );
      if (!orgRole) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      if (!orgRoleHasCapability(orgRole, "comment")) {
        res.status(403).json({
          error:
            "Your organization role cannot request a live timeline session",
        });
        return;
      }
    }

    const reviewRoomId = deriveReviewRoomId(asset.id);

    try {
      const created = await prisma.$transaction(async (tx) => {
        const open = await tx.timelineRequest.findFirst({
          where: {
            assetId: asset.id,
            requesterId: actor.id,
            status: { in: OPEN_STATUSES },
          },
          select: { id: true },
        });
        if (open) {
          return { kind: "duplicate" as const, existingId: open.id };
        }

        const row = await tx.timelineRequest.create({
          data: {
            assetId: asset.id,
            agencyProjectId: asset.agencyProjectId!,
            requesterId: actor.id,
            status: "pending",
            message,
            reviewRoomId,
          },
          include: requestInclude,
        });
        return { kind: "ok" as const, row };
      });

      if (created.kind === "duplicate") {
        res.status(409).json({
          error: "An open timeline request already exists for this asset",
          existingId: created.existingId,
        });
        return;
      }

      res.status(201).json({ request: serializeRequest(created.row) });
    } catch (error) {
      if (isOpenRequestUniqueViolation(error)) {
        const existing = await prisma.timelineRequest.findFirst({
          where: {
            assetId: asset.id,
            requesterId: actor.id,
            status: { in: OPEN_STATUSES },
          },
          select: { id: true },
        });
        res.status(409).json({
          error: "An open timeline request already exists for this asset",
          ...(existing ? { existingId: existing.id } : {}),
        });
        return;
      }
      console.error("Failed to create timeline request:", error);
      res.status(500).json({ error: "Failed to create timeline request" });
    }
  } catch (error) {
    console.error("Failed to create timeline request:", error);
    res.status(500).json({ error: "Failed to create timeline request" });
  }
});

/**
 * GET /api/agency/timeline-requests
 * Role-scoped list. Optional filters: status, assetId, agencyProjectId.
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  const prisma = getPrisma(req);

  const statusRaw = String(req.query.status ?? "").trim();
  let statusFilter: TimelineRequestStatus | undefined;
  if (statusRaw) {
    if (!ALL_STATUSES.has(statusRaw as TimelineRequestStatus)) {
      res.status(400).json({
        error:
          "status must be one of: pending, accepted, active, ended, declined, cancelled",
      });
      return;
    }
    statusFilter = statusRaw as TimelineRequestStatus;
  }

  const assetIdFilter = String(req.query.assetId ?? "").trim() || undefined;
  const projectIdFilter =
    String(req.query.agencyProjectId ?? "").trim() || undefined;

  try {
    let where: Prisma.TimelineRequestWhereInput = {};

    if (isAdminRole(req.user?.role)) {
      where = {};
    } else if (role === "client") {
      where = { requesterId: actor.id };
    } else {
      const projectIds = await getEditorAuthorizedProjectIds(prisma, actor.id);
      if (projectIds.length === 0) {
        res.json({ requests: [] });
        return;
      }
      where = { agencyProjectId: { in: projectIds } };
    }

    if (statusFilter) {
      where = { ...where, status: statusFilter };
    }
    if (assetIdFilter) {
      where = { ...where, assetId: assetIdFilter };
    }
    if (projectIdFilter) {
      if (!isAdminRole(req.user?.role)) {
        const access = await assertActiveAgencyProjectAccess(
          prisma,
          req,
          projectIdFilter,
        );
        if (!access.ok) {
          res.status(access.status).json({ error: access.error });
          return;
        }
      } else {
        const project = await prisma.agencyProject.findUnique({
          where: { id: projectIdFilter },
          select: { id: true, archivedAt: true },
        });
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }
        if (project.archivedAt) {
          res.status(409).json({ error: ARCHIVED_PROJECT_WORKSPACE_ERROR });
          return;
        }
      }
      where = { ...where, agencyProjectId: projectIdFilter };
    }

    const rows = await prisma.timelineRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: requestInclude,
    });

    res.json({ requests: rows.map(serializeSummary) });
  } catch (error) {
    console.error("Failed to list timeline requests:", error);
    res.status(500).json({ error: "Failed to list timeline requests" });
  }
});

/**
 * GET /api/agency/timeline-requests/:id
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const requestId = String(req.params.id ?? "").trim();
  if (!requestId) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const prisma = getPrisma(req);

  try {
    const row = await prisma.timelineRequest.findUnique({
      where: { id: requestId },
      include: requestInclude,
    });

    if (!row) {
      res.status(404).json({ error: "Timeline request not found" });
      return;
    }

    const access = await assertCanAccessTimelineRequest(
      prisma,
      req,
      actor,
      row,
    );
    if (!access.ok) {
      res.status(access.status).json({ error: access.error });
      return;
    }

    res.json({ request: serializeRequest(row) });
  } catch (error) {
    console.error("Failed to fetch timeline request:", error);
    res.status(500).json({ error: "Failed to fetch timeline request" });
  }
});

export default router;
