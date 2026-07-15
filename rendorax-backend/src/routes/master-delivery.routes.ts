import { Router } from "express";
import type { Response } from "express";
import type {
  AgencyRole,
  MasterDeliveryEventType,
  PrismaClient,
} from "@prisma/client";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/requireAuth";
import {
  ensureAgencyUser,
  mapSupabaseRoleToAgencyRole,
} from "../lib/agencyUsers";
import { generatePresignedDownloadUrl } from "../lib/r2";

const router = Router();

router.use(requireAuth);

const DELIVERY_FOLDER = "05_MASTER_DELIVERY";
const REVIEW_FOLDER = "03_REVIEW";
/** Soft access window — no schema field; computed from active event createdAt. */
const MASTER_DELIVERY_ACCESS_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const ALLOWED_EVENT_TYPES = new Set<MasterDeliveryEventType>([
  "delivered",
  "replaced",
  "restored",
  "expired",
]);

const ACTIVE_DELIVERY_EVENT_TYPES = new Set<MasterDeliveryEventType>([
  "delivered",
  "replaced",
  "restored",
]);

const actorSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
} as const;

const assetSummarySelect = {
  id: true,
  fileName: true,
  folder: true,
  mimeType: true,
  createdAt: true,
} as const;

const eventInclude = {
  actor: { select: actorSelect },
  mediaAsset: { select: assetSummarySelect },
  sourceReviewAsset: { select: assetSummarySelect },
} as const;

function getPrisma(req: AuthenticatedRequest): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

function isAdminRole(role: string | undefined): boolean {
  return role === "admin";
}

function isClientRole(role: string | undefined): boolean {
  return role === "client";
}

function folderMatches(
  folder: string | null | undefined,
  prefix: string,
): boolean {
  const value = folder?.trim();
  if (!value) return false;
  return value === prefix || value.startsWith(`${prefix}/`);
}

function isMasterDeliveryAsset(asset: {
  agencyProjectId: string | null;
  folder: string | null;
}): boolean {
  if (!asset.agencyProjectId) return false;
  return folderMatches(asset.folder, DELIVERY_FOLDER);
}

function isReviewVersionAsset(asset: {
  agencyProjectId: string | null;
  folder: string | null;
}): boolean {
  if (!asset.agencyProjectId) return false;
  return folderMatches(asset.folder, REVIEW_FOLDER);
}

type ProjectAccessResult =
  | { ok: true; projectId: string }
  | { ok: false; status: 403 | 404; error: string };

async function assertProjectAccess(
  prisma: PrismaClient,
  req: AuthenticatedRequest,
  projectId: string,
): Promise<ProjectAccessResult> {
  const actorId = req.user?.id;
  if (!actorId) {
    return { ok: false, status: 403, error: "Unauthorized" };
  }

  const project = await prisma.agencyProject.findUnique({
    where: { id: projectId.trim() },
    select: { id: true, ownerId: true, clientId: true },
  });

  if (!project) {
    return { ok: false, status: 404, error: "Project not found" };
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

function serializeAssetSummary(
  asset: {
    id: string;
    fileName: string;
    folder: string | null;
    mimeType?: string;
    createdAt?: Date;
  } | null,
) {
  if (!asset) return null;
  return {
    id: asset.id,
    fileName: asset.fileName,
    folder: asset.folder,
    ...(asset.mimeType !== undefined ? { mimeType: asset.mimeType } : {}),
    ...(asset.createdAt
      ? { createdAt: asset.createdAt.toISOString() }
      : {}),
  };
}

function serializeEvent(event: {
  id: string;
  mediaAssetId: string;
  agencyProjectId: string;
  actorId: string;
  actorRole: AgencyRole;
  eventType: MasterDeliveryEventType;
  sourceReviewAssetId: string | null;
  note: string | null;
  createdAt: Date;
  actor: {
    id: string;
    email: string;
    displayName: string | null;
    role: AgencyRole;
  };
  mediaAsset: {
    id: string;
    fileName: string;
    folder: string | null;
    mimeType: string;
    createdAt: Date;
  };
  sourceReviewAsset: {
    id: string;
    fileName: string;
    folder: string | null;
    mimeType: string;
    createdAt: Date;
  } | null;
}) {
  return {
    id: event.id,
    mediaAssetId: event.mediaAssetId,
    agencyProjectId: event.agencyProjectId,
    actorId: event.actorId,
    actorRole: event.actorRole,
    eventType: event.eventType,
    sourceReviewAssetId: event.sourceReviewAssetId,
    note: event.note,
    createdAt: event.createdAt.toISOString(),
    status:
      event.eventType === "expired" ? ("expired" as const) : ("delivered" as const),
    actor: {
      id: event.actor.id,
      email: event.actor.email,
      displayName: event.actor.displayName,
      role: event.actor.role,
    },
    mediaAsset: serializeAssetSummary(event.mediaAsset),
    sourceReviewAsset: serializeAssetSummary(event.sourceReviewAsset),
  };
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

function canCreateEventType(
  role: AgencyRole,
  eventType: MasterDeliveryEventType,
): boolean {
  if (role === "client") return false;
  if (role === "admin") return true;
  // editor
  return (
    eventType === "delivered" ||
    eventType === "replaced" ||
    eventType === "restored"
  );
}

/**
 * GET /api/agency/master-delivery/download?mediaAssetId=
 * Delivery-aware short-lived signed download (not permanent CDN).
 */
router.get("/download", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const mediaAssetId = String(req.query.mediaAssetId ?? "").trim();
  if (!mediaAssetId) {
    res.status(400).json({ error: "mediaAssetId query parameter is required" });
    return;
  }

  const prisma = getPrisma(req);

  try {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: {
        id: true,
        fileName: true,
        objectKey: true,
        agencyProjectId: true,
        folder: true,
      },
    });

    if (!asset) {
      res.status(404).json({ error: "Media asset not found" });
      return;
    }

    if (!asset.agencyProjectId) {
      res.status(403).json({
        error: "This asset is not linked to a project",
      });
      return;
    }

    if (!isMasterDeliveryAsset(asset)) {
      res.status(400).json({
        error:
          "Download requires a project-linked asset in 05_MASTER_DELIVERY",
      });
      return;
    }

    const access = await assertProjectAccess(
      prisma,
      req,
      asset.agencyProjectId,
    );
    if (!access.ok) {
      res.status(access.status).json({ error: access.error });
      return;
    }

    const latest = await prisma.masterDeliveryEvent.findFirst({
      where: { agencyProjectId: access.projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        mediaAssetId: true,
        eventType: true,
        createdAt: true,
      },
    });

    if (!latest) {
      res.status(404).json({
        error: "No Master Delivery is registered for this project",
      });
      return;
    }

    if (latest.eventType === "expired") {
      res.status(403).json({
        error: "This Master Delivery has expired and is no longer available to download",
      });
      return;
    }

    if (!ACTIVE_DELIVERY_EVENT_TYPES.has(latest.eventType)) {
      res.status(403).json({
        error: "No active Master Delivery is available to download",
      });
      return;
    }

    if (latest.mediaAssetId !== asset.id) {
      res.status(403).json({
        error:
          "Only the current active Master Delivery can be downloaded",
      });
      return;
    }

    const expiresAt = new Date(
      latest.createdAt.getTime() + MASTER_DELIVERY_ACCESS_DAYS * MS_PER_DAY,
    );
    const now = new Date();

    if (now.getTime() >= expiresAt.getTime()) {
      res.status(403).json({
        error: `This Master Delivery access window ended on ${expiresAt.toISOString()} (${MASTER_DELIVERY_ACCESS_DAYS} days after delivery)`,
      });
      return;
    }

    const objectKey = asset.objectKey?.trim();
    if (!objectKey) {
      res.status(400).json({
        error: "Master Delivery asset is missing object storage key",
      });
      return;
    }

    const downloadUrl = await generatePresignedDownloadUrl(
      objectKey,
      asset.fileName,
    );

    try {
      await prisma.masterDeliveryDownloadEvent.create({
        data: {
          masterDeliveryEventId: latest.id,
          mediaAssetId: asset.id,
          agencyProjectId: access.projectId,
          actorId: actor.id,
          actorRole: actor.role,
          eventType: "access_granted",
        },
      });
    } catch (auditError) {
      console.error(
        "Failed to record master delivery download access grant:",
        auditError,
      );
    }

    res.json({
      downloadUrl,
      fileName: asset.fileName,
      mediaAssetId: asset.id,
      expiresAt: expiresAt.toISOString(),
      deliveredAt: latest.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to create master delivery download URL:", error);
    res.status(500).json({ error: "Failed to create master delivery download" });
  }
});

function emptyDownloadAccess() {
  return {
    count: 0,
    firstGrantedAt: null as string | null,
    lastGrantedAt: null as string | null,
    hasAccessGrant: false,
  };
}

async function buildDownloadAccessSummary(
  prisma: PrismaClient,
  masterDeliveryEventId: string | null | undefined,
) {
  if (!masterDeliveryEventId) {
    return emptyDownloadAccess();
  }

  const agg = await prisma.masterDeliveryDownloadEvent.aggregate({
    where: {
      masterDeliveryEventId,
      eventType: "access_granted",
    },
    _count: { _all: true },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });

  const count = agg._count._all;
  if (count === 0) {
    return emptyDownloadAccess();
  }

  return {
    count,
    firstGrantedAt: agg._min.createdAt?.toISOString() ?? null,
    lastGrantedAt: agg._max.createdAt?.toISOString() ?? null,
    hasAccessGrant: true,
  };
}

/**
 * GET /api/agency/master-delivery?agencyProjectId=
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const agencyProjectId = String(req.query.agencyProjectId ?? "").trim();
  if (!agencyProjectId) {
    res
      .status(400)
      .json({ error: "agencyProjectId query parameter is required" });
    return;
  }

  const prisma = getPrisma(req);
  const access = await assertProjectAccess(prisma, req, agencyProjectId);
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }

  try {
    const history = await prisma.masterDeliveryEvent.findMany({
      where: { agencyProjectId: access.projectId },
      orderBy: { createdAt: "desc" },
      include: eventInclude,
    });

    const current = history[0] ? serializeEvent(history[0]) : null;
    const downloadAccess = await buildDownloadAccessSummary(
      prisma,
      history[0]?.id,
    );

    res.json({
      current,
      history: history.map(serializeEvent),
      downloadAccess,
    });
  } catch (error) {
    console.error("Failed to fetch master delivery events:", error);
    res.status(500).json({ error: "Failed to fetch master delivery state" });
  }
});

/**
 * POST /api/agency/master-delivery
 */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const mediaAssetId = String(req.body?.mediaAssetId ?? "").trim();
  const eventType = req.body?.eventType as MasterDeliveryEventType | undefined;
  const sourceReviewAssetIdRaw =
    typeof req.body?.sourceReviewAssetId === "string"
      ? req.body.sourceReviewAssetId.trim()
      : "";
  const sourceReviewAssetId = sourceReviewAssetIdRaw || null;
  const note =
    typeof req.body?.note === "string" ? req.body.note.trim() : undefined;

  if (!mediaAssetId) {
    res.status(400).json({ error: "mediaAssetId is required" });
    return;
  }

  if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
    res.status(400).json({
      error:
        'eventType must be one of: "delivered", "replaced", "restored", "expired"',
    });
    return;
  }

  const actorRole = mapSupabaseRoleToAgencyRole(req.user?.role);

  if (!canCreateEventType(actorRole, eventType)) {
    res.status(403).json({
      error: `Role "${actorRole}" cannot create Master Delivery event "${eventType}"`,
    });
    return;
  }

  if (eventType === "expired" && !note) {
    res.status(400).json({ error: "note is required for expired" });
    return;
  }

  const prisma = getPrisma(req);
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    select: {
      id: true,
      agencyProjectId: true,
      folder: true,
      fileName: true,
      mimeType: true,
      createdAt: true,
    },
  });

  if (!asset) {
    res.status(404).json({ error: "Media asset not found" });
    return;
  }

  if (!isMasterDeliveryAsset(asset)) {
    res.status(400).json({
      error:
        "Master Delivery events require a project-linked asset in 05_MASTER_DELIVERY",
    });
    return;
  }

  const access = await assertProjectAccess(
    prisma,
    req,
    asset.agencyProjectId!,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }

  if (sourceReviewAssetId) {
    const source = await prisma.mediaAsset.findUnique({
      where: { id: sourceReviewAssetId },
      select: { id: true, agencyProjectId: true, folder: true },
    });

    if (!source) {
      res.status(400).json({ error: "sourceReviewAssetId not found" });
      return;
    }

    if (source.agencyProjectId !== access.projectId) {
      res.status(400).json({
        error: "sourceReviewAssetId must belong to the same project",
      });
      return;
    }

    if (!isReviewVersionAsset(source)) {
      res.status(400).json({
        error:
          "sourceReviewAssetId must be a project-linked Review Version (03_REVIEW)",
      });
      return;
    }
  }

  try {
    const latest = await prisma.masterDeliveryEvent.findFirst({
      where: { agencyProjectId: access.projectId },
      orderBy: { createdAt: "desc" },
      select: { mediaAssetId: true, eventType: true },
    });

    const hasPriorActiveDelivery =
      latest != null && ACTIVE_DELIVERY_EVENT_TYPES.has(latest.eventType);

    if (eventType === "replaced") {
      if (!hasPriorActiveDelivery) {
        res.status(400).json({
          error:
            "replaced requires a prior delivered, replaced, or restored event",
        });
        return;
      }
      if (latest!.mediaAssetId === asset.id) {
        res.status(409).json({
          error: "replaced requires a different MediaAsset than the current delivery",
        });
        return;
      }
    }

    if (eventType === "restored") {
      const priorAppearance = await prisma.masterDeliveryEvent.findFirst({
        where: {
          agencyProjectId: access.projectId,
          mediaAssetId: asset.id,
          eventType: { in: ["delivered", "replaced", "restored"] },
        },
        select: { id: true },
      });

      if (!priorAppearance) {
        res.status(400).json({
          error:
            "restored requires a delivery asset that previously appeared in this project's history",
        });
        return;
      }

      if (
        latest &&
        ACTIVE_DELIVERY_EVENT_TYPES.has(latest.eventType) &&
        latest.mediaAssetId === asset.id
      ) {
        res.status(409).json({
          error: "Target delivery asset is already the current delivery",
        });
        return;
      }
    }

    if (eventType === "delivered") {
      if (
        latest &&
        ACTIVE_DELIVERY_EVENT_TYPES.has(latest.eventType) &&
        latest.mediaAssetId === asset.id
      ) {
        res.status(409).json({
          error: "This asset is already the current Master Delivery",
        });
        return;
      }
    }

    if (eventType === "expired") {
      if (!latest || latest.eventType === "expired") {
        res.status(409).json({
          error: "No active Master Delivery to expire",
        });
        return;
      }
      // Expire the current delivery asset (latest), regardless of posted mediaAssetId mismatch?
      // Spec says target delivery asset must be valid master folder asset.
      // Prefer requiring posted mediaAssetId to match current for clarity.
      if (latest.mediaAssetId !== asset.id) {
        res.status(400).json({
          error:
            "expired must target the current Master Delivery mediaAssetId",
        });
        return;
      }
    }

    const created = await prisma.masterDeliveryEvent.create({
      data: {
        mediaAssetId: asset.id,
        agencyProjectId: access.projectId,
        actorId: actor.id,
        actorRole,
        eventType,
        sourceReviewAssetId,
        note: note || null,
      },
      include: eventInclude,
    });

    res.status(201).json({
      event: serializeEvent(created),
      current: serializeEvent(created),
    });
  } catch (error) {
    console.error("Failed to create master delivery event:", error);
    res.status(500).json({ error: "Failed to create master delivery event" });
  }
});

export default router;
