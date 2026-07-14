import { Router } from "express";
import type { Response } from "express";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

type VideoCommentRow = {
  id: string;
  file_name: string;
  user_id: string;
  time_stamp: number;
  comment_text: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  created_at: Date | string | null;
  media_asset_id: string | null;
  agency_project_id: string | null;
  is_resolved: boolean;
  resolved_at: Date | string | null;
  resolved_by: string | null;
};

function getPrisma(req: AuthenticatedRequest): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

function isAdminRole(role: string | undefined): boolean {
  return role === "admin";
}

function isClientRole(role: string | undefined): boolean {
  return role === "client";
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

async function canResolveComment(
  prisma: PrismaClient,
  req: AuthenticatedRequest,
  comment: VideoCommentRow,
): Promise<boolean> {
  const actorId = req.user?.id;
  if (!actorId) return false;

  if (comment.user_id === actorId) return true;

  if (isAdminRole(req.user?.role)) return true;

  if (comment.agency_project_id) {
    const access = await assertProjectAccess(
      prisma,
      req,
      comment.agency_project_id,
    );
    return access.ok;
  }

  if (comment.media_asset_id) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: comment.media_asset_id },
      select: { agencyProjectId: true },
    });
    if (asset?.agencyProjectId) {
      const access = await assertProjectAccess(
        prisma,
        req,
        asset.agencyProjectId,
      );
      return access.ok;
    }
  }

  return false;
}

/**
 * GET /api/agency/video-comments/summary?projectIds=id1,id2
 * Must be registered before /:id routes.
 */
router.get("/summary", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const raw = String(req.query.projectIds ?? "").trim();
    const projectIds = raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (projectIds.length === 0) {
      return res
        .status(400)
        .json({ error: "projectIds query parameter is required" });
    }

    const allowed: string[] = [];
    for (const projectId of projectIds) {
      const access = await assertProjectAccess(prisma, req, projectId);
      if (access.ok) allowed.push(access.projectId);
    }

    if (allowed.length === 0) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const rows = await prisma.$queryRaw<VideoCommentRow[]>(
      Prisma.sql`
        SELECT id, file_name, user_id, time_stamp, comment_text,
               author_display_name, author_avatar_url, created_at,
               media_asset_id, agency_project_id, is_resolved,
               resolved_at, resolved_by
        FROM public.video_comments
        WHERE agency_project_id IN (${Prisma.join(allowed)})
        ORDER BY created_at DESC NULLS LAST
      `,
    );

    const byProject: Record<
      string,
      {
        total: number;
        open: number;
        resolved: number;
        latest: VideoCommentRow[];
      }
    > = {};

    for (const id of allowed) {
      byProject[id] = { total: 0, open: 0, resolved: 0, latest: [] };
    }

    for (const row of rows) {
      const pid = row.agency_project_id;
      if (!pid || !byProject[pid]) continue;
      byProject[pid].total += 1;
      if (row.is_resolved) byProject[pid].resolved += 1;
      else byProject[pid].open += 1;
      if (byProject[pid].latest.length < 3) {
        byProject[pid].latest.push(row);
      }
    }

    return res.json({ projects: byProject });
  } catch (error) {
    console.error("Failed to load comment summary:", error);
    return res.status(500).json({ error: "Failed to load feedback summary" });
  }
});

/**
 * PATCH /api/agency/video-comments/:id/resolve
 * body: { resolved: boolean }
 */
router.patch("/:id/resolve", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const commentId = String(req.params.id ?? "").trim();
    if (!commentId) {
      return res.status(400).json({ error: "comment id is required" });
    }

    const resolved = req.body?.resolved;
    if (typeof resolved !== "boolean") {
      return res.status(400).json({ error: "resolved boolean is required" });
    }

    const actorId = req.user?.id;
    if (!actorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const prisma = getPrisma(req);

    const existing = await prisma.$queryRaw<VideoCommentRow[]>`
      SELECT id, file_name, user_id, time_stamp, comment_text,
             author_display_name, author_avatar_url, created_at,
             media_asset_id, agency_project_id, is_resolved,
             resolved_at, resolved_by
      FROM public.video_comments
      WHERE id = ${commentId}::uuid
      LIMIT 1
    `;

    const comment = existing[0];
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const allowed = await canResolveComment(prisma, req, comment);
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = resolved
      ? await prisma.$queryRaw<VideoCommentRow[]>`
          UPDATE public.video_comments
          SET is_resolved = true,
              resolved_at = NOW(),
              resolved_by = ${actorId}::uuid
          WHERE id = ${commentId}::uuid
          RETURNING id, file_name, user_id, time_stamp, comment_text,
                    author_display_name, author_avatar_url, created_at,
                    media_asset_id, agency_project_id, is_resolved,
                    resolved_at, resolved_by
        `
      : await prisma.$queryRaw<VideoCommentRow[]>`
          UPDATE public.video_comments
          SET is_resolved = false,
              resolved_at = NULL,
              resolved_by = NULL
          WHERE id = ${commentId}::uuid
          RETURNING id, file_name, user_id, time_stamp, comment_text,
                    author_display_name, author_avatar_url, created_at,
                    media_asset_id, agency_project_id, is_resolved,
                    resolved_at, resolved_by
        `;

    return res.json(updated[0] ?? null);
  } catch (error) {
    console.error("Failed to resolve video comment:", error);
    return res
      .status(500)
      .json({ error: "Failed to update comment resolve state" });
  }
});

export default router;
