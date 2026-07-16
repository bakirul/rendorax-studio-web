import { Router } from "express";
import type { Response } from "express";
import type {
  AgencyRole,
  PrismaClient,
  ReviewDecisionStatus,
} from "@prisma/client";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/requireAuth";
import {
  ensureAgencyUser,
  mapSupabaseRoleToAgencyRole,
} from "../lib/agencyUsers";
import { assertActiveAgencyProjectAccess } from "../lib/agencyProjectAccess";

const router = Router();

router.use(requireAuth);

const REVIEW_FOLDER = "03_REVIEW";

const ALLOWED_STATUSES = new Set<ReviewDecisionStatus>([
  "submitted_for_review",
  "approved",
  "revision_requested",
  "admin_override",
]);

const CLIENT_STATUSES = new Set<ReviewDecisionStatus>([
  "approved",
  "revision_requested",
]);

const EDITOR_STATUSES = new Set<ReviewDecisionStatus>([
  "submitted_for_review",
]);

const ADMIN_STATUSES = new Set<ReviewDecisionStatus>([
  "submitted_for_review",
  "admin_override",
]);

const actorSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
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

function isReviewVersionAsset(asset: {
  agencyProjectId: string | null;
  folder: string | null;
}): boolean {
  if (!asset.agencyProjectId) return false;

  const folder = asset.folder?.trim();
  if (!folder) return false;

  return (
    folder === REVIEW_FOLDER || folder.startsWith(`${REVIEW_FOLDER}/`)
  );
}

function serializeDecision(
  decision: {
    id: string;
    mediaAssetId: string;
    agencyProjectId: string;
    status: ReviewDecisionStatus;
    actorId: string;
    actorRole: AgencyRole;
    note: string | null;
    createdAt: Date;
    actor: {
      id: string;
      email: string;
      displayName: string | null;
      role: AgencyRole;
    };
  },
) {
  return {
    id: decision.id,
    mediaAssetId: decision.mediaAssetId,
    agencyProjectId: decision.agencyProjectId,
    status: decision.status,
    actorId: decision.actorId,
    actorRole: decision.actorRole,
    note: decision.note,
    createdAt: decision.createdAt.toISOString(),
    actor: {
      id: decision.actor.id,
      email: decision.actor.email,
      displayName: decision.actor.displayName,
      role: decision.actor.role,
    },
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

function canCreateStatus(
  role: AgencyRole,
  status: ReviewDecisionStatus,
): boolean {
  if (role === "client") return CLIENT_STATUSES.has(status);
  if (role === "editor") return EDITOR_STATUSES.has(status);
  if (role === "admin") return ADMIN_STATUSES.has(status);
  return false;
}

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const mediaAssetId = String(req.query.mediaAssetId ?? "").trim();
  if (!mediaAssetId) {
    res.status(400).json({ error: "mediaAssetId query parameter is required" });
    return;
  }

  const prisma = getPrisma(req);
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    select: { id: true, agencyProjectId: true, folder: true },
  });

  if (!asset) {
    res.status(404).json({ error: "Media asset not found" });
    return;
  }

  if (!isReviewVersionAsset(asset)) {
    res.status(400).json({
      error: "Decisions are only available for project-linked Review Versions",
    });
    return;
  }

  const access = await assertActiveAgencyProjectAccess(
    prisma,
    req,
    asset.agencyProjectId!,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }

  try {
    const history = await prisma.reviewVersionDecision.findMany({
      where: { mediaAssetId },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: actorSelect } },
    });

    const latest = history[0] ?? null;

    res.json({
      latest: latest ? serializeDecision(latest) : null,
      history: history.map(serializeDecision),
    });
  } catch (error) {
    console.error("Failed to fetch review decisions:", error);
    res.status(500).json({ error: "Failed to fetch review decisions" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const mediaAssetId = String(req.body?.mediaAssetId ?? "").trim();
  const status = req.body?.status as ReviewDecisionStatus | undefined;
  const note =
    typeof req.body?.note === "string" ? req.body.note.trim() : undefined;

  if (!mediaAssetId) {
    res.status(400).json({ error: "mediaAssetId is required" });
    return;
  }

  if (!status || !ALLOWED_STATUSES.has(status)) {
    res.status(400).json({
      error:
        "status must be one of: submitted_for_review, approved, revision_requested, admin_override",
    });
    return;
  }

  const actorRole = mapSupabaseRoleToAgencyRole(req.user?.role);

  if (!canCreateStatus(actorRole, status)) {
    res.status(403).json({
      error: `Role "${actorRole}" cannot create status "${status}"`,
    });
    return;
  }

  if (status === "admin_override" && !note) {
    res.status(400).json({ error: "note is required for admin_override" });
    return;
  }

  const prisma = getPrisma(req);
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    select: { id: true, agencyProjectId: true, folder: true },
  });

  if (!asset) {
    res.status(404).json({ error: "Media asset not found" });
    return;
  }

  if (!isReviewVersionAsset(asset)) {
    res.status(400).json({
      error: "Decisions can only be created for project-linked Review Versions",
    });
    return;
  }

  const access = await assertActiveAgencyProjectAccess(
    prisma,
    req,
    asset.agencyProjectId!,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }

  try {
    const created = await prisma.reviewVersionDecision.create({
      data: {
        mediaAssetId: asset.id,
        agencyProjectId: asset.agencyProjectId!,
        status,
        actorId: actor.id,
        actorRole,
        note: note || null,
      },
      include: { actor: { select: actorSelect } },
    });

    const responseBody: Record<string, unknown> = {
      decision: serializeDecision(created),
    };

    if (status === "revision_requested" && !note) {
      responseBody.noteRecommendation =
        "Consider including a revision note so the editor understands what to change.";
    }

    res.status(201).json(responseBody);
  } catch (error) {
    console.error("Failed to create review decision:", error);
    res.status(500).json({ error: "Failed to create review decision" });
  }
});

export default router;
