import { Router } from "express";
import type { Response } from "express";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/requireAuth";
import { ensureAgencyUser, mapSupabaseRoleToAgencyRole } from "../lib/agencyUsers";
import { ARCHIVED_PROJECT_WORKSPACE_ERROR } from "../lib/agencyProjectAccess";
import { getAccessibleClientIdsForMember } from "../lib/clientOrganizationMembers";
import { resolveEditorSpecialization } from "../lib/editorSpecializations";
import { getSupabaseAdminClient } from "../lib/supabaseAdmin";
import reviewDecisionsRouter from "./review-decisions.routes";
import videoCommentsRouter from "./video-comments.routes";
import pictureLockRouter from "./picture-lock.routes";
import masterDeliveryRouter from "./master-delivery.routes";
import projectRequestsRouter from "./project-requests.routes";
import clientOrganizationRouter from "./client-organization.routes";
import timelineRequestsRouter from "./timeline-requests.routes";

const router = Router();

router.use(requireAuth);

function getPrisma(req: AuthenticatedRequest): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

function isAdminRole(role: string | undefined): boolean {
  return role === "admin";
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || !EMAIL_FORMAT.test(email)) return null;
  return email;
}

function isDuplicateAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already been registered") ||
    lower.includes("already registered") ||
    lower.includes("user already exists") ||
    lower.includes("email address has already been registered")
  );
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

router.get("/me", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;
  res.json(actor);
});

router.get("/projects", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const prisma = getPrisma(req);
  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  const includeArchived =
    isAdminRole(req.user?.role) &&
    String(req.query.includeArchived ?? "").toLowerCase() === "true";

  let where: Prisma.AgencyProjectWhereInput;
  if (role === "admin") {
    where = {};
  } else if (role === "client") {
    const clientIds = await getAccessibleClientIdsForMember(prisma, actor.id);
    where = { clientId: { in: clientIds } };
  } else {
    where = { ownerId: actor.id };
  }

  if (!includeArchived) {
    where = { ...where, archivedAt: null };
  }

  try {
    const projects = await prisma.agencyProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, email: true, displayName: true, role: true } },
        client: { select: { id: true, email: true, displayName: true, role: true } },
        _count: { select: { tasks: true, assets: true } },
      },
    });

    res.json({ projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/users", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  if (!isAdminRole(req.user?.role)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const prisma = getPrisma(req);

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        specialization: true,
      },
      orderBy: { email: "asc" },
    });

    res.json({ users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

const PROVISIONABLE_ROLES = new Set(["client", "editor"]);

router.post("/users", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  if (!isAdminRole(req.user?.role)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    console.error("[agency] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL is not configured");
    res.status(503).json({ error: "User provisioning unavailable" });
    return;
  }

  const body = req.body ?? {};
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const requestedRole =
    typeof body.role === "string" ? body.role.trim().toLowerCase() : "client";

  if (!displayName) {
    res.status(400).json({ error: "displayName is required" });
    return;
  }

  if (!email) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ error: "password must be at least 6 characters" });
    return;
  }

  if (!PROVISIONABLE_ROLES.has(requestedRole)) {
    res.status(400).json({
      error: 'role must be "client" or "editor"',
    });
    return;
  }

  const provisionRole = requestedRole as "client" | "editor";
  const roleLabel = provisionRole === "editor" ? "Editor" : "Client";

  let specialization: string | null = null;
  if (provisionRole === "editor") {
    const resolved = resolveEditorSpecialization(body.specialization);
    if (!resolved.ok) {
      res.status(400).json({ error: resolved.error });
      return;
    }
    specialization = resolved.value;
  } else if (
    body.specialization !== undefined &&
    body.specialization !== null &&
    String(body.specialization).trim() !== ""
  ) {
    res.status(400).json({
      error: "specialization is only allowed when role is editor",
    });
    return;
  }

  const prisma = getPrisma(req);

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const userMetadata: Record<string, string> = { full_name: displayName };
  if (specialization) {
    userMetadata.specialization = specialization;
  }

  const { data: createData, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
      app_metadata: { role: provisionRole },
    });

  if (createError || !createData.user?.id) {
    const message = createError?.message ?? `Failed to create ${roleLabel.toLowerCase()}`;
    if (isDuplicateAuthError(message)) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }
    console.error(`Failed to create ${roleLabel.toLowerCase()}:`, message);
    res.status(502).json({
      error: `Failed to provision ${roleLabel.toLowerCase()} account`,
    });
    return;
  }

  const supabaseUserId = createData.user.id;

  try {
    const user = await prisma.user.upsert({
      where: { id: supabaseUserId },
      create: {
        id: supabaseUserId,
        email,
        displayName,
        role: provisionRole,
        specialization,
      },
      update: {
        email,
        displayName,
        role: provisionRole,
        specialization,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        specialization: true,
      },
    });

    console.info(
      `[agency] ${roleLabel} provisioned by admin ${actor.id}: user ${user.id} role=${user.role}`,
    );

    res.status(201).json({ user });
  } catch (error) {
    console.error(
      `Failed to sync Prisma user after ${roleLabel.toLowerCase()} creation:`,
      error,
    );
    await supabaseAdmin.auth.admin.deleteUser(supabaseUserId).catch((deleteError) => {
      console.error("Failed to roll back Supabase user after Prisma error:", deleteError);
    });
    res.status(500).json({
      error: `Failed to save ${roleLabel.toLowerCase()} record`,
    });
  }
});

router.post("/projects", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  if (role === "client") {
    res.status(403).json({ error: "Clients cannot create projects" });
    return;
  }

  const { title, description, clientId, status } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Project title is required" });
    return;
  }

  const prisma = getPrisma(req);

  if (clientId !== undefined && clientId !== null) {
    if (typeof clientId !== "string" || !clientId.trim()) {
      res.status(400).json({ error: "clientId must be a non-empty string" });
      return;
    }

    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client) {
      res.status(404).json({ error: "Client user not found" });
      return;
    }

    if (client.role !== "client") {
      res.status(400).json({ error: "Selected user is not a client" });
      return;
    }
  }

  try {
    const project = await prisma.agencyProject.create({
      data: {
        title: title.trim(),
        description:
          typeof description === "string" ? description.trim() || null : null,
        status: typeof status === "string" && status.trim() ? status.trim() : "Awaiting Assets",
        ownerId: actor.id,
        clientId:
          typeof clientId === "string" && clientId.trim() ? clientId.trim() : null,
      },
      include: {
        owner: { select: { id: true, email: true, displayName: true, role: true } },
        client: { select: { id: true, email: true, displayName: true, role: true } },
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Failed to create agency project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

const ALLOWED_PROJECT_STATUSES = new Set([
  "Awaiting Assets",
  "Ingesting",
  "Offline Edit",
  "Color Grading",
  "Audio & Master",
  "Ready for Review",
  "Ready for Final Delivery",
  "Delivered",
]);

const projectResponseInclude = {
  owner: { select: { id: true, email: true, displayName: true, role: true } },
  client: { select: { id: true, email: true, displayName: true, role: true } },
  _count: { select: { tasks: true, assets: true } },
} satisfies Prisma.AgencyProjectInclude;

router.patch("/projects/:id", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  if (role === "client") {
    res.status(403).json({ error: "Clients cannot update project status" });
    return;
  }

  const projectId = String(req.params.id).trim();
  const { status } = req.body ?? {};

  if (typeof status !== "string" || !status.trim()) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  const nextStatus = status.trim();
  if (!ALLOWED_PROJECT_STATUSES.has(nextStatus)) {
    res.status(400).json({
      error:
        "status must be one of: Awaiting Assets, Ingesting, Offline Edit, Color Grading, Audio & Master, Ready for Review, Ready for Final Delivery, Delivered",
    });
    return;
  }

  const prisma = getPrisma(req);
  const project = await prisma.agencyProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (project.archivedAt) {
    res.status(409).json({ error: ARCHIVED_PROJECT_WORKSPACE_ERROR });
    return;
  }

  if (!isAdminRole(req.user?.role)) {
    const isOwner = project.ownerId === actor.id;
    let hasAssignedTask = false;

    if (!isOwner) {
      const assignedTask = await prisma.task.findFirst({
        where: { projectId: project.id, assigneeId: actor.id },
        select: { id: true },
      });
      hasAssignedTask = assignedTask !== null;
    }

    if (!isOwner && !hasAssignedTask) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  try {
    const updated = await prisma.agencyProject.update({
      where: { id: projectId },
      data: { status: nextStatus },
      include: projectResponseInclude,
    });

    res.json(updated);
  } catch (error) {
    console.error("Failed to update project status:", error);
    res.status(500).json({ error: "Failed to update project status" });
  }
});

router.patch(
  "/projects/:id/archive",
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    if (!isAdminRole(req.user?.role)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const projectId = String(req.params.id).trim();
    if (!projectId) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    const prisma = getPrisma(req);

    try {
      const project = await prisma.agencyProject.findUnique({
        where: { id: projectId },
        select: { id: true, archivedAt: true },
      });

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      if (project.archivedAt) {
        res.status(409).json({ error: "Project is already archived" });
        return;
      }

      const updated = await prisma.agencyProject.update({
        where: { id: projectId },
        data: { archivedAt: new Date() },
        include: projectResponseInclude,
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to archive project:", error);
      res.status(500).json({ error: "Failed to archive project" });
    }
  },
);

router.patch(
  "/projects/:id/restore",
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    if (!isAdminRole(req.user?.role)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const projectId = String(req.params.id).trim();
    if (!projectId) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    const prisma = getPrisma(req);

    try {
      const project = await prisma.agencyProject.findUnique({
        where: { id: projectId },
        select: { id: true, archivedAt: true },
      });

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      if (!project.archivedAt) {
        res.status(409).json({ error: "Project is not archived" });
        return;
      }

      const updated = await prisma.agencyProject.update({
        where: { id: projectId },
        data: { archivedAt: null },
        include: projectResponseInclude,
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to restore project:", error);
      res.status(500).json({ error: "Failed to restore project" });
    }
  },
);

router.post("/tasks", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  if (role === "client") {
    res.status(403).json({ error: "Clients cannot create tasks" });
    return;
  }

  const { projectId, title, description, assigneeId, dueDate, status } =
    req.body ?? {};

  if (typeof projectId !== "string" || !projectId.trim()) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Task title is required" });
    return;
  }

  if (typeof assigneeId !== "string" || !assigneeId.trim()) {
    res.status(400).json({ error: "assigneeId is required" });
    return;
  }

  const prisma = getPrisma(req);
  const project = await prisma.agencyProject.findUnique({
    where: { id: projectId.trim() },
  });

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (project.archivedAt) {
    res.status(409).json({ error: ARCHIVED_PROJECT_WORKSPACE_ERROR });
    return;
  }

  if (role !== "admin" && project.ownerId !== actor.id) {
    res.status(403).json({ error: "You can only add tasks to projects you own" });
    return;
  }

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId.trim() },
  });
  if (!assignee) {
    res.status(404).json({ error: "Assignee user not found" });
    return;
  }

  if (assignee.role !== "editor" && assignee.role !== "admin") {
    res.status(400).json({ error: "Selected user cannot be assigned tasks" });
    return;
  }

  let parsedDueDate: Date | null = null;
  if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
    const candidate = new Date(dueDate);
    if (Number.isNaN(candidate.getTime())) {
      res.status(400).json({ error: "dueDate must be a valid ISO date string" });
      return;
    }
    parsedDueDate = candidate;
  }

  const allowedStatuses = new Set(["todo", "in_progress", "in_review", "done"]);
  const nextStatus =
    typeof status === "string" && allowedStatuses.has(status) ? status : "todo";

  try {
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description:
          typeof description === "string" ? description.trim() || null : null,
        projectId: project.id,
        assigneeId: assignee.id,
        dueDate: parsedDueDate,
        status: nextStatus as Prisma.TaskCreateInput["status"],
      },
      include: {
        project: { select: { id: true, title: true, status: true } },
        assignee: { select: { id: true, email: true, displayName: true, role: true, specialization: true } },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Failed to create task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

const ALLOWED_TASK_STATUSES = new Set([
  "todo",
  "in_progress",
  "in_review",
  "done",
]);

const TASK_NEXT_STATUS: Record<string, string | null> = {
  todo: "in_progress",
  in_progress: "in_review",
  in_review: "done",
  done: null,
};

const taskResponseInclude = {
  project: {
    select: {
      id: true,
      title: true,
      status: true,
      client: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
  },
  assignee: {
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      specialization: true,
    },
  },
} satisfies Prisma.TaskInclude;

router.get("/tasks", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const prisma = getPrisma(req);
  const role = mapSupabaseRoleToAgencyRole(req.user?.role);

  let where: Prisma.TaskWhereInput;
  if (role === "admin") {
    where = { project: { archivedAt: null } };
  } else if (role === "client") {
    const clientIds = await getAccessibleClientIdsForMember(prisma, actor.id);
    where = {
      AND: [
        { project: { archivedAt: null } },
        {
          OR: [
            { assigneeId: actor.id },
            { project: { clientId: { in: clientIds } } },
          ],
        },
      ],
    };
  } else {
    where = {
      assigneeId: actor.id,
      project: { archivedAt: null },
    };
  }

  try {
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: taskResponseInclude,
    });

    res.json({ tasks, role });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.patch("/tasks/:id", async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  if (role === "client") {
    res.status(403).json({ error: "Clients cannot update task status" });
    return;
  }

  const taskId = String(req.params.id);
  const { status } = req.body ?? {};

  if (typeof status !== "string" || !ALLOWED_TASK_STATUSES.has(status)) {
    res.status(400).json({
      error: "status must be one of: todo, in_progress, in_review, done",
    });
    return;
  }

  const prisma = getPrisma(req);
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { id: true, archivedAt: true } } },
  });

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (task.project.archivedAt) {
    res.status(409).json({ error: ARCHIVED_PROJECT_WORKSPACE_ERROR });
    return;
  }

  if (!isAdminRole(req.user?.role) && task.assigneeId !== actor.id) {
    res.status(403).json({ error: "You can only update tasks assigned to you" });
    return;
  }

  if (!isAdminRole(req.user?.role)) {
    const expectedNext = TASK_NEXT_STATUS[task.status];
    if (!expectedNext || status !== expectedNext) {
      res.status(400).json({
        error: `Invalid status transition. Tasks in "${task.status}" can only advance to "${expectedNext ?? "none"}".`,
      });
      return;
    }
  }

  try {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: status as Prisma.TaskUpdateInput["status"] },
      include: taskResponseInclude,
    });

    res.json(updated);
  } catch (error) {
    console.error("Failed to update task status:", error);
    res.status(500).json({ error: "Failed to update task status" });
  }
});

router.use("/review-decisions", reviewDecisionsRouter);
router.use("/picture-lock", pictureLockRouter);
router.use("/video-comments", videoCommentsRouter);
router.use("/master-delivery", masterDeliveryRouter);
router.use("/project-requests", projectRequestsRouter);
router.use("/client-organization", clientOrganizationRouter);
router.use("/timeline-requests", timelineRequestsRouter);

export default router;
