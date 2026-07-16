import { Router } from "express";
import type { Response } from "express";
import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { transcribeMediaToSrt } from "../lib/transcription";
import { isAllowedClientUploadObjectKey, isAllowedTranscribeFileUrl } from "../lib/storagePolicy";
import {
  buildThumbnailObjectKey,
  buildPublicUrl,
  deleteR2Object,
} from "../lib/r2";
import {
  buildHlsProxyRoot,
  buildWebProxyMp4ObjectKey,
} from "../lib/mediaProxyKeys";
import { deleteR2Prefix } from "../lib/r2Upload";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/requireAuth";
import { enqueueMediaTranscodeJob } from "../lib/mediaProcessing";
import { ARCHIVED_PROJECT_WORKSPACE_ERROR } from "../lib/agencyProjectAccess";

const router = Router();

router.use(requireAuth);

function isAdminUser(req: AuthenticatedRequest): boolean {
  return req.user?.role === "admin";
}

function isClientUser(req: AuthenticatedRequest): boolean {
  return req.user?.role === "client";
}

function isEditorUser(req: AuthenticatedRequest): boolean {
  return req.user?.role === "editor";
}

function canTranscribeMedia(req: AuthenticatedRequest): boolean {
  return isAdminUser(req) || isEditorUser(req);
}

function normalizeFolderValue(
  folder: unknown,
): string | null | undefined {
  if (folder === undefined) return undefined;
  if (folder === null) return null;
  if (typeof folder !== "string") return undefined;
  return folder.trim().replace(/^\/+|\/+$/g, "") || null;
}

function normalizeFileNameValue(fileName: unknown): string | null {
  if (typeof fileName !== "string") return null;
  const trimmed = fileName.trim();
  if (!trimmed || trimmed.includes("/") || trimmed.includes("\\")) {
    return null;
  }
  return trimmed;
}

type ProjectLinkValidationResult =
  | { ok: true; projectId: string }
  | { ok: false; status: 403 | 400 | 404 | 409; error: string };

async function validateAgencyProjectLink(
  prisma: PrismaClient,
  req: AuthenticatedRequest,
  projectId: string,
  assetUserId: string | null,
): Promise<ProjectLinkValidationResult> {
  const actorId = req.user?.id;
  if (!actorId) {
    return { ok: false, status: 403, error: "Unauthorized" };
  }

  const trimmedProjectId = projectId.trim();
  const project = await prisma.agencyProject.findUnique({
    where: { id: trimmedProjectId },
    select: { id: true, ownerId: true, clientId: true, archivedAt: true },
  });

  if (!project) {
    return { ok: false, status: 404, error: "Project not found" };
  }

  if (project.archivedAt) {
    return {
      ok: false,
      status: 409,
      error: ARCHIVED_PROJECT_WORKSPACE_ERROR,
    };
  }

  if (isClientUser(req)) {
    return {
      ok: false,
      status: 403,
      error: "Clients cannot link assets to projects",
    };
  }

  if (isAdminUser(req)) {
    if (assetUserId) {
      const assetOwner = await prisma.user.findUnique({
        where: { id: assetUserId },
        select: { role: true },
      });
      if (assetOwner?.role === "client" && project.clientId !== assetUserId) {
        return {
          ok: false,
          status: 400,
          error:
            "Project must belong to the same client as this vault asset",
        };
      }
    }
    return { ok: true, projectId: project.id };
  }

  const isProjectOwner = project.ownerId === actorId;
  const assignedTask = await prisma.task.findFirst({
    where: { assigneeId: actorId, projectId: project.id },
    select: { id: true },
  });

  if (!isProjectOwner && !assignedTask) {
    return {
      ok: false,
      status: 403,
      error: "You can only link assets to projects you are assigned to",
    };
  }

  return { ok: true, projectId: project.id };
}

async function assertCanFilterByAgencyProject(
  prisma: PrismaClient,
  req: AuthenticatedRequest,
  projectId: string,
): Promise<ProjectLinkValidationResult> {
  const actorId = req.user?.id;
  if (!actorId) {
    return { ok: false, status: 403, error: "Unauthorized" };
  }

  const project = await prisma.agencyProject.findUnique({
    where: { id: projectId.trim() },
    select: { id: true, ownerId: true, clientId: true, archivedAt: true },
  });

  if (!project) {
    return { ok: false, status: 404, error: "Project not found" };
  }

  if (project.archivedAt) {
    return {
      ok: false,
      status: 409,
      error: ARCHIVED_PROJECT_WORKSPACE_ERROR,
    };
  }

  if (isClientUser(req)) {
    if (project.clientId !== actorId) {
      return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true, projectId: project.id };
  }

  if (isAdminUser(req)) {
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

async function findAccessibleAsset(
  prisma: PrismaClient,
  assetId: string,
  req: AuthenticatedRequest,
) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return { error: "Media asset not found", status: 404 as const, asset: null };
  }

  const authenticatedUserId = req.user?.id;
  if (!authenticatedUserId) {
    return { error: "Unauthorized", status: 401 as const, asset: null };
  }

  if (!isAdminUser(req) && asset.userId !== authenticatedUserId) {
    return { error: "Forbidden", status: 403 as const, asset: null };
  }

  return { error: null, status: 200 as const, asset };
}

type MediaAssetRow = {
  publicUrl: string;
  objectKey?: string | null;
  thumbnailUrl?: string | null;
  mimeType: string;
  playbackObjectKey?: string | null;
  playbackFormat?: string | null;
  processingStatus?: string | null;
};

function serializeMediaAsset<T extends MediaAssetRow>(asset: T): T & {
  playbackUrl?: string | null;
} {
  const objectKey = asset.objectKey?.trim();
  const playbackObjectKey = asset.playbackObjectKey?.trim();

  let serialized = { ...asset } as T & { playbackUrl?: string | null };

  if (objectKey) {
    const publicUrl = buildPublicUrl(objectKey);
    let thumbnailUrl = asset.thumbnailUrl;

    if (asset.mimeType.startsWith("video/")) {
      thumbnailUrl =
        thumbnailUrl?.trim() ||
        buildPublicUrl(buildThumbnailObjectKey(objectKey));
    }

    serialized = {
      ...asset,
      publicUrl,
      thumbnailUrl,
    };
  }

  if (
    playbackObjectKey &&
    asset.processingStatus === "ready" &&
    asset.playbackFormat === "hls"
  ) {
    serialized.playbackUrl = buildPublicUrl(playbackObjectKey);
  }

  return serialized;
}

async function bestEffortDeleteR2Asset(asset: {
  objectKey?: string | null;
  mimeType: string;
  id?: string;
  proxyVersion?: number | null;
}): Promise<void> {
  const objectKey = asset.objectKey?.trim();
  if (!objectKey || !isAllowedClientUploadObjectKey(objectKey)) {
    return;
  }

  await deleteR2Object(objectKey).catch((error) => {
    console.warn("[media] R2 object delete failed (continuing with DB delete):", {
      assetId: asset.id,
      objectKey,
      error,
    });
  });

  if (!asset.mimeType.startsWith("video/")) {
    return;
  }

  const thumbnailKey = buildThumbnailObjectKey(objectKey);
  if (!isAllowedClientUploadObjectKey(thumbnailKey)) {
    return;
  }

  await deleteR2Object(thumbnailKey).catch((error) => {
    console.warn("[media] R2 thumbnail delete failed (continuing):", {
      assetId: asset.id,
      thumbnailKey,
      error,
    });
  });

  if (asset.id) {
    const proxyVersion = asset.proxyVersion ?? 1;
    await Promise.all([
      deleteR2Prefix(buildHlsProxyRoot(asset.id, proxyVersion)).catch((error) => {
        console.warn("[media] R2 HLS proxy delete failed (continuing):", {
          assetId: asset.id,
          error,
        });
      }),
      deleteR2Object(buildWebProxyMp4ObjectKey(asset.id, proxyVersion)).catch(
        (error) => {
          console.warn("[media] R2 MP4 proxy delete failed (continuing):", {
            assetId: asset.id,
            error,
          });
        },
      ),
    ]);
  }
}

router.post("/assets", async (req: AuthenticatedRequest, res: Response) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileName, thumbnailUrl, mimeType, folder, fileSize, objectKey, agencyProjectId } =
      req.body as {
        fileName?: string;
        publicUrl?: string;
        thumbnailUrl?: string | null;
        mimeType?: string;
        folder?: string | null;
        fileSize?: number;
        objectKey?: string;
        agencyProjectId?: string | null;
      };

    if (!fileName || !mimeType) {
      return res.status(400).json({
        error: "fileName and mimeType are required",
      });
    }

    const normalizedObjectKey = objectKey?.trim().replace(/^\/+/, "") || null;
    if (!normalizedObjectKey || !isAllowedClientUploadObjectKey(normalizedObjectKey)) {
      return res.status(400).json({
        error:
          "objectKey is required and must start with uploads/, thumbnails/, or projects/",
      });
    }

    const resolvedPublicUrl = buildPublicUrl(normalizedObjectKey);

    const normalizedFolder =
      folder === null || folder === undefined
        ? null
        : typeof folder === "string"
          ? folder.trim().replace(/^\/+|\/+$/g, "") || null
          : null;

    const MAX_INT32 = 2_147_483_647;
    const normalizedFileSize =
      typeof fileSize === "number" && Number.isFinite(fileSize)
        ? Math.min(Math.round(fileSize), MAX_INT32)
        : null;

    let resolvedAgencyProjectId: string | null = null;
    if (typeof agencyProjectId === "string" && agencyProjectId.trim()) {
      const linkCheck = isClientUser(req)
        ? await assertCanFilterByAgencyProject(
            prisma,
            req,
            agencyProjectId.trim(),
          )
        : await validateAgencyProjectLink(
            prisma,
            req,
            agencyProjectId.trim(),
            authenticatedUserId,
          );
      if (!linkCheck.ok) {
        return res.status(linkCheck.status).json({ error: linkCheck.error });
      }
      resolvedAgencyProjectId = linkCheck.projectId;
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        fileName,
        publicUrl: resolvedPublicUrl,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        objectKey: normalizedObjectKey,
        mimeType,
        userId: authenticatedUserId,
        folder: normalizedFolder,
        fileSize: normalizedFileSize,
        agencyProjectId: resolvedAgencyProjectId,
      },
    });

    // Do not block the HTTP response on Redis/BullMQ — enqueue runs in the background.
    void enqueueMediaTranscodeJob(prisma, {
      assetId: asset.id,
      userId: authenticatedUserId,
      mimeType,
      objectKey: normalizedObjectKey,
    })
      .then((processingJob) => {
        if (processingJob) {
          console.log("[media] Transcode job enqueued (async):", {
            assetId: asset.id,
            jobId: processingJob.id,
            status: processingJob.status,
          });
        }
      })
      .catch((enqueueError) => {
        console.warn(
          "[media] Media asset saved; transcode queue unavailable; continuing without blocking response.",
          { assetId: asset.id, enqueueError },
        );
      });

    return res.status(201).json({
      ...serializeMediaAsset(asset),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save media asset";
    console.error("Failed to save media asset:", error);
    return res.status(500).json({
      error: "Failed to save media asset",
      details: process.env.NODE_ENV === "production" ? undefined : message,
    });
  }
});

router.get("/clients", async (req: AuthenticatedRequest, res: Response) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isAdminUser(req)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const grouped = await prisma.mediaAsset.groupBy({
      by: ["userId"],
      where: { userId: { not: null } },
      _count: { id: true },
    });

    const clients = grouped
      .filter(
        (row): row is typeof row & { userId: string } => row.userId != null,
      )
      .map((row) => ({
        userId: row.userId,
        assetCount: row._count.id,
      }))
      .sort((a, b) => b.assetCount - a.assetCount);

    return res.json(clients);
  } catch (error) {
    console.error("Failed to fetch media clients:", error);
    return res.status(500).json({ error: "Failed to fetch media clients" });
  }
});

router.get("/assets", async (req: AuthenticatedRequest, res: Response) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const requestedUserId = req.query.userId as string | undefined;
    const agencyProjectIdParam = req.query.agencyProjectId as string | undefined;
    const folderParam = req.query.folder as string | undefined;
    const normalizedFolder =
      folderParam !== undefined
        ? folderParam.trim().replace(/^\/+|\/+$/g, "") || null
        : undefined;

    let where: Prisma.MediaAssetWhereInput;

    if (isClientUser(req)) {
      // Clients see (A) deliverables linked to their projects and (B) their own
      // unlinked staging uploads before a project exists. Other clients' assets,
      // unrelated projects, and editor-owned unlinked assets stay excluded.
      where = {
        OR: [
          {
            agencyProjectId: { not: null },
            agencyProject: { clientId: authenticatedUserId },
          },
          {
            userId: authenticatedUserId,
            agencyProjectId: null,
          },
        ],
      };
    } else {
      const scopedUserId =
        isAdminUser(req) && requestedUserId?.trim()
          ? requestedUserId.trim()
          : authenticatedUserId;

      where = {
        ...(scopedUserId ? { userId: scopedUserId } : {}),
      };
    }

    if (typeof agencyProjectIdParam === "string" && agencyProjectIdParam.trim()) {
      const filterCheck = await assertCanFilterByAgencyProject(
        prisma,
        req,
        agencyProjectIdParam.trim(),
      );
      if (!filterCheck.ok) {
        return res.status(filterCheck.status).json({ error: filterCheck.error });
      }
      if (isAdminUser(req) || isEditorUser(req)) {
        // Project-scoped Admin/Editor: all assets linked to the project,
        // regardless of uploader userId.
        where = { agencyProjectId: filterCheck.projectId };
      } else {
        where.agencyProjectId = filterCheck.projectId;
      }
    }

    if (normalizedFolder !== undefined) {
      where.folder = normalizedFolder;
    }

    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.json(assets.map(serializeMediaAsset));
  } catch (error) {
    console.error("Failed to fetch media assets:", error);
    return res.status(500).json({ error: "Failed to fetch media assets" });
  }
});

router.get("/folders", async (req: AuthenticatedRequest, res: Response) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const requestedUserId = req.query.userId as string | undefined;
    const scopedUserId =
      isAdminUser(req) && requestedUserId?.trim()
        ? requestedUserId.trim()
        : authenticatedUserId;

    const [assetFolders, virtualFolders] = await Promise.all([
      prisma.mediaAsset.findMany({
        where: { userId: scopedUserId, folder: { not: null } },
        select: { folder: true },
        distinct: ["folder"],
        orderBy: { folder: "asc" },
      }),
      prisma.mediaFolder.findMany({
        where: { userId: scopedUserId },
        select: { path: true },
        orderBy: { path: "asc" },
      }),
    ]);

    const folderSet = new Set<string>();
    for (const row of assetFolders) {
      if (row.folder) folderSet.add(row.folder);
    }
    for (const row of virtualFolders) {
      if (row.path) folderSet.add(row.path);
    }

    return res.json(Array.from(folderSet).sort());
  } catch (error) {
    console.error("Failed to fetch media folders:", error);
    return res.status(500).json({ error: "Failed to fetch media folders" });
  }
});

router.post("/folders", async (req: AuthenticatedRequest, res: Response) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const folderPath = normalizeFolderValue(
      (req.body as { path?: string }).path,
    );
    if (!folderPath) {
      return res.status(400).json({ error: "path is required" });
    }

    const folder = await prisma.mediaFolder.upsert({
      where: {
        userId_path: {
          userId: authenticatedUserId,
          path: folderPath,
        },
      },
      create: {
        userId: authenticatedUserId,
        path: folderPath,
      },
      update: {},
    });

    return res.status(201).json({ path: folder.path });
  } catch (error) {
    console.error("Failed to create media folder:", error);
    return res.status(500).json({ error: "Failed to create media folder" });
  }
});

router.patch("/assets/:id", async (req: AuthenticatedRequest, res: Response) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  try {
    const assetId = String(req.params.id ?? "").trim();
    if (!assetId) {
      return res.status(400).json({ error: "Asset id is required" });
    }

    const access = await findAccessibleAsset(prisma, assetId, req);
    if (!access.asset) {
      return res.status(access.status).json({ error: access.error });
    }

    const { fileName, folder, agencyProjectId } = req.body as {
      fileName?: string;
      folder?: string | null;
      agencyProjectId?: string | null;
    };

    const normalizedFileName = normalizeFileNameValue(fileName);
    const normalizedFolder = normalizeFolderValue(folder);

    if (fileName !== undefined && !normalizedFileName) {
      return res.status(400).json({ error: "Invalid fileName" });
    }

    if (folder !== undefined && normalizedFolder === undefined) {
      return res.status(400).json({ error: "Invalid folder" });
    }

    if (
      fileName === undefined &&
      folder === undefined &&
      agencyProjectId === undefined
    ) {
      return res.status(400).json({
        error: "fileName, folder, or agencyProjectId is required",
      });
    }

    let resolvedAgencyProjectId: string | null | undefined = undefined;
    if (agencyProjectId !== undefined) {
      if (agencyProjectId === null) {
        resolvedAgencyProjectId = null;
      } else if (typeof agencyProjectId === "string" && agencyProjectId.trim()) {
        const linkCheck = isClientUser(req)
          ? await assertCanFilterByAgencyProject(
              prisma,
              req,
              agencyProjectId.trim(),
            )
          : await validateAgencyProjectLink(
              prisma,
              req,
              agencyProjectId.trim(),
              access.asset.userId,
            );
        if (!linkCheck.ok) {
          return res.status(linkCheck.status).json({ error: linkCheck.error });
        }
        resolvedAgencyProjectId = linkCheck.projectId;
      } else {
        return res.status(400).json({ error: "Invalid agencyProjectId" });
      }
    }

    const updated = await prisma.mediaAsset.update({
      where: { id: access.asset.id },
      data: {
        ...(normalizedFileName ? { fileName: normalizedFileName } : {}),
        ...(folder !== undefined ? { folder: normalizedFolder ?? null } : {}),
        ...(resolvedAgencyProjectId !== undefined
          ? { agencyProjectId: resolvedAgencyProjectId }
          : {}),
      },
    });

    return res.json(serializeMediaAsset(updated));
  } catch (error) {
    console.error("Failed to update media asset:", error);
    return res.status(500).json({ error: "Failed to update media asset" });
  }
});

router.delete("/assets/folder", async (req: AuthenticatedRequest, res: Response) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const folderPath = normalizeFolderValue(
      (req.body as { folderPath?: string }).folderPath,
    );
    if (!folderPath) {
      return res.status(400).json({ error: "folderPath is required" });
    }

    const assets = await prisma.mediaAsset.findMany({
      where: {
        userId: authenticatedUserId,
        OR: [
          { folder: folderPath },
          { folder: { startsWith: `${folderPath}/` } },
        ],
      },
    });

    await Promise.all(assets.map((asset) => bestEffortDeleteR2Asset(asset)));

    if (assets.length > 0) {
      await prisma.mediaAsset.deleteMany({
        where: { id: { in: assets.map((asset) => asset.id) } },
      });
    }

    await prisma.mediaFolder.deleteMany({
      where: {
        userId: authenticatedUserId,
        OR: [
          { path: folderPath },
          { path: { startsWith: `${folderPath}/` } },
        ],
      },
    });

    return res.json({ deletedCount: assets.length });
  } catch (error) {
    console.error("Failed to delete media assets in folder:", error);
    return res.status(500).json({ error: "Failed to delete folder assets" });
  }
});

router.delete("/assets/:id", async (req: AuthenticatedRequest, res: Response) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  try {
    const assetId = String(req.params.id ?? "").trim();
    if (!assetId) {
      return res.status(400).json({ error: "Asset id is required" });
    }

    const access = await findAccessibleAsset(prisma, assetId, req);
    if (!access.asset) {
      return res.status(access.status).json({ error: access.error });
    }

    await bestEffortDeleteR2Asset(access.asset);

    await prisma.mediaAsset.delete({ where: { id: access.asset.id } });

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete media asset:", error);
    return res.status(500).json({ error: "Failed to delete media asset" });
  }
});

router.post("/transcribe", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!canTranscribeMedia(req)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { assetId, fileUrl, language } = req.body as {
      assetId?: string;
      fileUrl?: string;
      language?: string;
    };

    if (!assetId || !fileUrl) {
      return res.status(400).json({
        error: "assetId and fileUrl are required",
      });
    }

    if (!isAllowedTranscribeFileUrl(fileUrl)) {
      return res.status(400).json({
        error: "fileUrl host is not allowed for transcription",
      });
    }

    const targetLanguage = language?.trim() || "en";

    const { srt } = await transcribeMediaToSrt({
      fileUrl,
      language: targetLanguage,
    });

    return res.json({
      success: true,
      assetId,
      language: targetLanguage,
      srt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to transcribe media asset";

    console.error("[API/MEDIA/TRANSCRIBE] Failed:", {
      reason: message,
      error,
    });

    return res.status(500).json({ error: message });
  }
});

export default router;
