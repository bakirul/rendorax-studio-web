import { Router } from "express";
import type { Response } from "express";
import type {
  AgencyRole,
  PictureLockEventType,
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
import { assertActiveAgencyProjectAccess } from "../lib/agencyProjectAccess";
import { hashR2OriginalObject } from "../lib/r2ObjectHash";

const router = Router();

router.use(requireAuth);

const REVIEW_FOLDER = "03_REVIEW";

const ALLOWED_EVENT_TYPES = new Set<PictureLockEventType>([
  "locked",
  "unlocked",
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

function serializeEvent(event: {
  id: string;
  mediaAssetId: string;
  agencyProjectId: string;
  actorId: string;
  actorRole: AgencyRole;
  eventType: PictureLockEventType;
  integrityHash: string | null;
  objectKey: string | null;
  note: string | null;
  createdAt: Date;
  actor: {
    id: string;
    email: string;
    displayName: string | null;
    role: AgencyRole;
  };
}) {
  return {
    id: event.id,
    mediaAssetId: event.mediaAssetId,
    agencyProjectId: event.agencyProjectId,
    actorId: event.actorId,
    actorRole: event.actorRole,
    eventType: event.eventType,
    integrityHash: event.integrityHash,
    objectKey: event.objectKey,
    note: event.note,
    createdAt: event.createdAt.toISOString(),
    actor: {
      id: event.actor.id,
      email: event.actor.email,
      displayName: event.actor.displayName,
      role: event.actor.role,
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

function canMutatePictureLock(role: AgencyRole): boolean {
  return role === "client" || role === "editor";
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
      error: "Picture Lock is only available for project-linked Review Versions",
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
    const history = await prisma.pictureLockEvent.findMany({
      where: { mediaAssetId },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: actorSelect } },
    });

    const latest = history[0] ?? null;
    const isLocked = latest?.eventType === "locked";

    res.json({
      isLocked,
      latest: latest ? serializeEvent(latest) : null,
      history: history.map(serializeEvent),
    });
  } catch (error) {
    console.error("Failed to fetch picture lock events:", error);
    res.status(500).json({ error: "Failed to fetch picture lock state" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const mediaAssetId = String(req.body?.mediaAssetId ?? "").trim();
  const eventType = req.body?.eventType as PictureLockEventType | undefined;
  const note =
    typeof req.body?.note === "string" ? req.body.note.trim() : undefined;

  if (!mediaAssetId) {
    res.status(400).json({ error: "mediaAssetId is required" });
    return;
  }

  if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
    res.status(400).json({
      error: 'eventType must be one of: "locked", "unlocked"',
    });
    return;
  }

  const actorRole = mapSupabaseRoleToAgencyRole(req.user?.role);

  if (!canMutatePictureLock(actorRole)) {
    res.status(403).json({
      error: `Role "${actorRole}" cannot create Picture Lock events`,
    });
    return;
  }

  if (eventType === "unlocked" && !note) {
    res.status(400).json({ error: "note is required for unlock" });
    return;
  }

  const prisma = getPrisma(req);
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    select: {
      id: true,
      agencyProjectId: true,
      folder: true,
      objectKey: true,
    },
  });

  if (!asset) {
    res.status(404).json({ error: "Media asset not found" });
    return;
  }

  if (!isReviewVersionAsset(asset)) {
    res.status(400).json({
      error:
        "Picture Lock can only be applied to project-linked Review Versions",
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
    const latest = await prisma.pictureLockEvent.findFirst({
      where: { mediaAssetId },
      orderBy: { createdAt: "desc" },
      select: { eventType: true },
    });

    const isCurrentlyLocked = latest?.eventType === "locked";

    if (eventType === "locked" && isCurrentlyLocked) {
      res.status(409).json({ error: "Review Version is already locked" });
      return;
    }

    if (eventType === "unlocked" && !isCurrentlyLocked) {
      res.status(409).json({ error: "Review Version is already unlocked" });
      return;
    }

    let integrityHash: string | null = null;
    let objectKeySnapshot: string | null = null;

    if (eventType === "locked") {
      const objectKey = asset.objectKey?.trim();
      if (!objectKey) {
        res.status(400).json({
          error: "Media asset is missing an R2 objectKey for integrity hashing",
        });
        return;
      }

      try {
        const hashed = await hashR2OriginalObject(objectKey);
        integrityHash = hashed.integrityHash;
        objectKeySnapshot = hashed.objectKey;
      } catch (hashError) {
        const message =
          hashError instanceof Error
            ? hashError.message
            : "Unable to read R2 object for hashing";
        console.error("Picture Lock R2 hash failed:", hashError);
        res.status(502).json({
          error: `Failed to hash R2 object — lock was not created. ${message}`,
        });
        return;
      }
    }

    const created = await prisma.pictureLockEvent.create({
      data: {
        mediaAssetId: asset.id,
        agencyProjectId: asset.agencyProjectId!,
        actorId: actor.id,
        actorRole,
        eventType,
        integrityHash,
        objectKey: objectKeySnapshot,
        note: note || null,
      },
      include: { actor: { select: actorSelect } },
    });

    res.status(201).json({
      isLocked: eventType === "locked",
      event: serializeEvent(created),
    });
  } catch (error) {
    console.error("Failed to create picture lock event:", error);
    res.status(500).json({ error: "Failed to create picture lock event" });
  }
});

export default router;
