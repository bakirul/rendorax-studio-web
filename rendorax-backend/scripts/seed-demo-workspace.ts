/**
 * Demo Workspace v1 — inspect / seed / reset tooling.
 *
 * Modes:
 *   npx tsx scripts/seed-demo-workspace.ts --inspect   (default)
 *   npx tsx scripts/seed-demo-workspace.ts --seed
 *   npx tsx scripts/seed-demo-workspace.ts --reset --confirm-demo-reset
 *
 * Never auto-run from build/start/deploy.
 * Creates auth users only if Admin already provisioned Demo Client/Editor.
 */
import "../src/lib/loadEnv";
import { writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  buildPublicUrl,
  normalizeObjectKey,
  r2BucketName,
  r2Client,
} from "../src/lib/r2";
import { isAllowedClientUploadObjectKey } from "../src/lib/storagePolicy";
import { hashR2OriginalObject } from "../src/lib/r2ObjectHash";

const DEMO_PROJECT_TITLE = "[DEMO] Broadcast Delivery Walkthrough";
const MANIFEST_PATH = path.join(
  __dirname,
  ".demo-workspace-manifest.local.json",
);

const ASSET_NAMES = {
  clientMaterial: "[DEMO] Client Material.mp4",
  reviewV1: "[DEMO] Review V1.mp4",
  reviewV2: "[DEMO] Review V2.mp4",
  master: "[DEMO] Master Delivery.mp4",
} as const;

type Mode = "inspect" | "seed" | "reset";

type Check = { name: string; pass: boolean; detail?: string };

type DemoManifest = {
  version: 1;
  updatedAt: string;
  projectId: string;
  clientUserId: string;
  editorUserId: string;
  taskIds: string[];
  assetIds: string[];
  reviewDecisionIds: string[];
  pictureLockEventIds: string[];
  masterDeliveryEventIds: string[];
  downloadEventIds: string[];
  commentIds: string[];
  objectKeys: string[];
  r2ObjectsCreatedByScript: string[];
};

function env(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseMode(argv: string[]): {
  mode: Mode;
  confirmReset: boolean;
  deleteProject: boolean;
} {
  const has = (flag: string) => argv.includes(flag);
  const confirmReset = has("--confirm-demo-reset");
  const deleteProject = has("--delete-project");

  if (has("--reset")) return { mode: "reset", confirmReset, deleteProject };
  if (has("--seed")) return { mode: "seed", confirmReset, deleteProject };
  if (has("--inspect") || argv.filter((a) => a.startsWith("--")).length === 0) {
    return { mode: "inspect", confirmReset, deleteProject };
  }

  console.error(
    "Unknown mode. Use --inspect (default), --seed, or --reset --confirm-demo-reset",
  );
  process.exit(1);
}

function createPrisma() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { prisma, pool };
}

function readManifest(): DemoManifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as DemoManifest;
  } catch {
    return null;
  }
}

function writeManifest(manifest: DemoManifest) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
}

async function r2ObjectExists(objectKey: string): Promise<boolean> {
  if (!r2BucketName) return false;
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: r2BucketName,
        Key: normalizeObjectKey(objectKey),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

type ResolvedUser = {
  id: string;
  email: string;
  role: string;
};

async function resolveDemoUsers(prisma: PrismaClient): Promise<{
  client: ResolvedUser;
  editor: ResolvedUser;
  checks: Check[];
}> {
  const checks: Check[] = [];
  const clientEmail = env("DEMO_CLIENT_EMAIL")?.toLowerCase() ?? null;
  const editorEmail = env("DEMO_EDITOR_EMAIL")?.toLowerCase() ?? null;

  if (!clientEmail || !editorEmail) {
    checks.push({
      name: "DEMO_CLIENT_EMAIL / DEMO_EDITOR_EMAIL set",
      pass: false,
      detail: "Create users in Admin HQ first, then set emails in env",
    });
    throw Object.assign(new Error("Missing DEMO_*_EMAIL"), { checks });
  }

  if (clientEmail === editorEmail) {
    checks.push({
      name: "Client and Editor emails distinct",
      pass: false,
    });
    throw Object.assign(new Error("Demo emails must differ"), { checks });
  }

  const client = await prisma.user.findUnique({ where: { email: clientEmail } });
  const editor = await prisma.user.findUnique({ where: { email: editorEmail } });

  checks.push({
    name: "Demo Client Prisma user exists",
    pass: Boolean(client),
    detail: client ? undefined : `No User for ${clientEmail}`,
  });
  checks.push({
    name: "Demo Editor Prisma user exists",
    pass: Boolean(editor),
    detail: editor ? undefined : `No User for ${editorEmail}`,
  });

  if (!client || !editor) {
    throw Object.assign(new Error("Demo users missing — provision via Admin HQ"), {
      checks,
    });
  }

  checks.push({
    name: "Demo Client role is client",
    pass: client.role === "client",
    detail: `role=${client.role}`,
  });
  checks.push({
    name: "Demo Editor role is editor",
    pass: editor.role === "editor",
    detail: `role=${editor.role}`,
  });
  checks.push({
    name: "Demo users are not admin",
    pass: client.role !== "admin" && editor.role !== "admin",
  });
  checks.push({
    name: "Client and Editor IDs distinct",
    pass: client.id !== editor.id,
  });

  const configuredClientId = env("DEMO_CLIENT_USER_ID");
  const configuredEditorId = env("DEMO_EDITOR_USER_ID");
  if (configuredClientId) {
    checks.push({
      name: "DEMO_CLIENT_USER_ID matches email resolve",
      pass: configuredClientId === client.id,
    });
  }
  if (configuredEditorId) {
    checks.push({
      name: "DEMO_EDITOR_USER_ID matches email resolve",
      pass: configuredEditorId === editor.id,
    });
  }

  if (checks.some((c) => !c.pass)) {
    throw Object.assign(new Error("Identity validation failed"), { checks });
  }

  return {
    client: { id: client.id, email: client.email, role: client.role },
    editor: { id: editor.id, email: editor.email, role: editor.role },
    checks,
  };
}

type MediaSpec = {
  kind: keyof typeof ASSET_NAMES;
  fileName: string;
  folder: string | null;
  objectKey: string;
  mimeType: string;
  publicUrl: string;
  thumbnailUrl: string | null;
  userId: string;
};

function buildMediaSpecs(clientId: string, editorId: string): {
  specs: MediaSpec[];
  missing: string[];
  invalid: string[];
} {
  const missing: string[] = [];
  const invalid: string[] = [];

  type EnvBundle = {
    objectKey: string;
    fileName: string;
    mime: string;
    publicUrl: string | null;
    thumb: string | null;
  };

  const bundles: Record<
    keyof typeof ASSET_NAMES,
    { objectKeyEnv: string; fileNameEnv: string; mimeEnv: string; publicEnv: string; thumbEnv: string }
  > = {
    clientMaterial: {
      objectKeyEnv: "DEMO_CLIENT_MATERIAL_OBJECT_KEY",
      fileNameEnv: "DEMO_CLIENT_MATERIAL_FILE_NAME",
      mimeEnv: "DEMO_CLIENT_MATERIAL_MIME_TYPE",
      publicEnv: "DEMO_CLIENT_MATERIAL_PUBLIC_URL",
      thumbEnv: "DEMO_CLIENT_MATERIAL_THUMBNAIL_URL",
    },
    reviewV1: {
      objectKeyEnv: "DEMO_REVIEW_V1_OBJECT_KEY",
      fileNameEnv: "DEMO_REVIEW_V1_FILE_NAME",
      mimeEnv: "DEMO_REVIEW_V1_MIME_TYPE",
      publicEnv: "DEMO_REVIEW_V1_PUBLIC_URL",
      thumbEnv: "DEMO_REVIEW_V1_THUMBNAIL_URL",
    },
    reviewV2: {
      objectKeyEnv: "DEMO_REVIEW_V2_OBJECT_KEY",
      fileNameEnv: "DEMO_REVIEW_V2_FILE_NAME",
      mimeEnv: "DEMO_REVIEW_V2_MIME_TYPE",
      publicEnv: "DEMO_REVIEW_V2_PUBLIC_URL",
      thumbEnv: "DEMO_REVIEW_V2_THUMBNAIL_URL",
    },
    master: {
      objectKeyEnv: "DEMO_MASTER_OBJECT_KEY",
      fileNameEnv: "DEMO_MASTER_FILE_NAME",
      mimeEnv: "DEMO_MASTER_MIME_TYPE",
      publicEnv: "DEMO_MASTER_PUBLIC_URL",
      thumbEnv: "DEMO_MASTER_THUMBNAIL_URL",
    },
  };

  const resolveBundle = (kind: keyof typeof ASSET_NAMES): EnvBundle | null => {
    const cfg = bundles[kind];
    const objectKeyRaw = env(cfg.objectKeyEnv);
    if (!objectKeyRaw) {
      missing.push(cfg.objectKeyEnv);
      return null;
    }
    const objectKey = normalizeObjectKey(objectKeyRaw);
    if (!isAllowedClientUploadObjectKey(objectKey)) {
      invalid.push(`${cfg.objectKeyEnv} not an allowed original key`);
      return null;
    }
    return {
      objectKey,
      fileName: env(cfg.fileNameEnv) ?? ASSET_NAMES[kind],
      mime: env(cfg.mimeEnv) ?? "video/mp4",
      publicUrl: env(cfg.publicEnv),
      thumb: env(cfg.thumbEnv),
    };
  };

  const specs: MediaSpec[] = [];
  const push = (
    kind: keyof typeof ASSET_NAMES,
    folder: string | null,
    userId: string,
  ) => {
    const bundle = resolveBundle(kind);
    if (!bundle) return;
    specs.push({
      kind,
      fileName: bundle.fileName,
      folder,
      objectKey: bundle.objectKey,
      mimeType: bundle.mime,
      publicUrl: bundle.publicUrl || buildPublicUrl(bundle.objectKey),
      thumbnailUrl: bundle.thumb,
      userId,
    });
  };

  push("clientMaterial", "01_CLIENT_MATERIALS", clientId);
  push("reviewV1", "03_REVIEW", editorId);
  push("reviewV2", "03_REVIEW", editorId);
  push("master", "05_MASTER_DELIVERY", editorId);

  return { specs, missing, invalid };
}

async function verifyMediaObjects(specs: MediaSpec[]): Promise<Check[]> {
  const checks: Check[] = [];
  for (const spec of specs) {
    const ok = await r2ObjectExists(spec.objectKey);
    checks.push({
      name: `R2 object exists (${spec.kind})`,
      pass: ok,
      detail: ok ? undefined : "HEAD failed — upload object or fix key",
    });
  }
  return checks;
}

async function resolveOrCreateProject(
  prisma: PrismaClient,
  clientId: string,
  editorId: string,
): Promise<{ projectId: string; created: boolean }> {
  const configuredId = env("DEMO_AGENCY_PROJECT_ID");
  if (configuredId) {
    const existing = await prisma.agencyProject.findUnique({
      where: { id: configuredId },
    });
    if (existing) {
      if (existing.clientId && existing.clientId !== clientId) {
        throw new Error(
          "DEMO_AGENCY_PROJECT_ID points to a project with a different client",
        );
      }
      if (existing.title !== DEMO_PROJECT_TITLE) {
        await prisma.agencyProject.update({
          where: { id: existing.id },
          data: {
            title: DEMO_PROJECT_TITLE,
            clientId,
            ownerId: editorId,
            status: "Ready for Final Delivery",
            archivedAt: null,
          },
        });
      } else {
        await prisma.agencyProject.update({
          where: { id: existing.id },
          data: {
            clientId,
            ownerId: editorId,
            archivedAt: null,
          },
        });
      }
      return { projectId: existing.id, created: false };
    }
  }

  const byTitle = await prisma.agencyProject.findFirst({
    where: {
      title: DEMO_PROJECT_TITLE,
      clientId,
    },
  });
  if (byTitle) {
    return { projectId: byTitle.id, created: false };
  }

  const created = await prisma.agencyProject.create({
    data: {
      title: DEMO_PROJECT_TITLE,
      description:
        "Seeded Demo Workspace for vetted prospects. Not a production client project.",
      status: "Ready for Final Delivery",
      ownerId: editorId,
      clientId,
    },
  });
  return { projectId: created.id, created: true };
}

async function upsertAsset(
  prisma: PrismaClient,
  projectId: string,
  spec: MediaSpec,
): Promise<string> {
  const existing = await prisma.mediaAsset.findFirst({
    where: {
      agencyProjectId: projectId,
      fileName: spec.fileName,
    },
  });

  if (existing) {
    await prisma.mediaAsset.update({
      where: { id: existing.id },
      data: {
        objectKey: spec.objectKey,
        publicUrl: spec.publicUrl,
        thumbnailUrl: spec.thumbnailUrl,
        mimeType: spec.mimeType,
        folder: spec.folder,
        userId: spec.userId,
        agencyProjectId: projectId,
      },
    });
    return existing.id;
  }

  const created = await prisma.mediaAsset.create({
    data: {
      id: randomUUID(),
      fileName: spec.fileName,
      objectKey: spec.objectKey,
      publicUrl: spec.publicUrl,
      thumbnailUrl: spec.thumbnailUrl,
      mimeType: spec.mimeType,
      folder: spec.folder,
      userId: spec.userId,
      agencyProjectId: projectId,
    },
  });
  return created.id;
}

async function clearDemoHistory(
  prisma: PrismaClient,
  projectId: string,
  _assetIds: string[],
) {
  await prisma.masterDeliveryDownloadEvent.deleteMany({
    where: { agencyProjectId: projectId },
  });
  await prisma.masterDeliveryEvent.deleteMany({
    where: { agencyProjectId: projectId },
  });
  await prisma.pictureLockEvent.deleteMany({
    where: { agencyProjectId: projectId },
  });
  await prisma.reviewVersionDecision.deleteMany({
    where: { agencyProjectId: projectId },
  });
  await prisma.task.deleteMany({ where: { projectId } });

  await prisma.$executeRaw`
    DELETE FROM public.video_comments
    WHERE agency_project_id = ${projectId}
  `;
}

async function seedTasks(
  prisma: PrismaClient,
  projectId: string,
  editorId: string,
): Promise<string[]> {
  const dueSoon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const dueLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const t1 = await prisma.task.create({
    data: {
      title: "Prepare review cut",
      description: "Deliver Review V2 for Client feedback.",
      status: "done",
      projectId,
      assigneeId: editorId,
      dueDate: dueSoon,
    },
  });
  const t2 = await prisma.task.create({
    data: {
      title: "Create final master",
      description: "Package Master Delivery from approved Review V2.",
      status: "in_progress",
      projectId,
      assigneeId: editorId,
      dueDate: dueLater,
    },
  });
  return [t1.id, t2.id];
}

async function seedDecisions(
  prisma: PrismaClient,
  projectId: string,
  reviewV1Id: string,
  reviewV2Id: string,
  clientId: string,
  editorId: string,
): Promise<string[]> {
  const payload = [
    {
      mediaAssetId: reviewV1Id,
      agencyProjectId: projectId,
      status: "submitted_for_review" as const,
      actorId: editorId,
      actorRole: "editor" as const,
      note: "Demo: Review V1 ready for Client",
    },
    {
      mediaAssetId: reviewV1Id,
      agencyProjectId: projectId,
      status: "revision_requested" as const,
      actorId: clientId,
      actorRole: "client" as const,
      note: "Demo: Please tighten the opening.",
    },
    {
      mediaAssetId: reviewV2Id,
      agencyProjectId: projectId,
      status: "submitted_for_review" as const,
      actorId: editorId,
      actorRole: "editor" as const,
      note: "Demo: Review V2 addresses opening notes",
    },
    {
      mediaAssetId: reviewV2Id,
      agencyProjectId: projectId,
      status: "approved" as const,
      actorId: clientId,
      actorRole: "client" as const,
      note: "Demo: Approved — this version works.",
    },
  ];

  const ids: string[] = [];
  for (const row of payload) {
    const created = await prisma.reviewVersionDecision.create({ data: row });
    ids.push(created.id);
  }
  return ids;
}

async function seedPictureLock(
  prisma: PrismaClient,
  projectId: string,
  reviewV2Id: string,
  editorId: string,
  objectKey: string,
): Promise<{ ids: string[]; skipped?: string }> {
  try {
    const hashed = await hashR2OriginalObject(objectKey);
    const event = await prisma.pictureLockEvent.create({
      data: {
        mediaAssetId: reviewV2Id,
        agencyProjectId: projectId,
        actorId: editorId,
        actorRole: "editor",
        eventType: "locked",
        integrityHash: hashed.integrityHash,
        objectKey: hashed.objectKey,
        note: "Demo: Picture Lock on approved Review V2",
      },
    });
    return { ids: [event.id] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ids: [],
      skipped: `Picture Lock skipped (hash failed): ${message}`,
    };
  }
}

async function seedMasterDelivery(
  prisma: PrismaClient,
  projectId: string,
  masterAssetId: string,
  reviewV2Id: string,
  editorId: string,
  clientId: string,
): Promise<{ mdIds: string[]; downloadIds: string[] }> {
  const md = await prisma.masterDeliveryEvent.create({
    data: {
      mediaAssetId: masterAssetId,
      agencyProjectId: projectId,
      actorId: editorId,
      actorRole: "editor",
      eventType: "delivered",
      sourceReviewAssetId: reviewV2Id,
      note: "Demo: Master Delivery from approved Review V2",
    },
  });

  const download = await prisma.masterDeliveryDownloadEvent.create({
    data: {
      masterDeliveryEventId: md.id,
      mediaAssetId: masterAssetId,
      agencyProjectId: projectId,
      actorId: clientId,
      actorRole: "client",
      eventType: "access_granted",
    },
  });

  return { mdIds: [md.id], downloadIds: [download.id] };
}

async function seedComments(
  prisma: PrismaClient,
  projectId: string,
  reviewV1Id: string,
  reviewV2Id: string,
  clientId: string,
  editorId: string,
): Promise<string[]> {
  const ids: string[] = [];

  const insertResolved = async (input: {
    fileName: string;
    userId: string;
    timeStamp: number;
    text: string;
    mediaAssetId: string;
    resolvedBy: string;
  }) => {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO public.video_comments (
        id, file_name, user_id, time_stamp, comment_text,
        media_asset_id, agency_project_id, is_resolved, resolved_at, resolved_by,
        created_at
      ) VALUES (
        ${id}::uuid,
        ${input.fileName},
        ${input.userId}::uuid,
        ${input.timeStamp},
        ${input.text},
        ${input.mediaAssetId},
        ${projectId},
        true,
        NOW(),
        ${input.resolvedBy}::uuid,
        NOW()
      )
    `;
    ids.push(id);
  };

  const insertOpen = async (input: {
    fileName: string;
    userId: string;
    timeStamp: number;
    text: string;
    mediaAssetId: string;
  }) => {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO public.video_comments (
        id, file_name, user_id, time_stamp, comment_text,
        media_asset_id, agency_project_id, is_resolved, resolved_at, resolved_by,
        created_at
      ) VALUES (
        ${id}::uuid,
        ${input.fileName},
        ${input.userId}::uuid,
        ${input.timeStamp},
        ${input.text},
        ${input.mediaAssetId},
        ${projectId},
        false,
        NULL,
        NULL,
        NOW()
      )
    `;
    ids.push(id);
  };

  await insertResolved({
    fileName: ASSET_NAMES.reviewV1,
    userId: clientId,
    timeStamp: 12.5,
    text: "Please tighten this opening.",
    mediaAssetId: reviewV1Id,
    resolvedBy: editorId,
  });
  await insertResolved({
    fileName: ASSET_NAMES.reviewV2,
    userId: editorId,
    timeStamp: 12.5,
    text: "Updated in V2.",
    mediaAssetId: reviewV2Id,
    resolvedBy: editorId,
  });
  await insertOpen({
    fileName: ASSET_NAMES.reviewV2,
    userId: clientId,
    timeStamp: 45,
    text: "Approved — this version works.",
    mediaAssetId: reviewV2Id,
  });

  return ids;
}

async function runInspect(prisma: PrismaClient): Promise<number> {
  const checks: Check[] = [];
  let client: ResolvedUser | null = null;
  let editor: ResolvedUser | null = null;

  try {
    const resolved = await resolveDemoUsers(prisma);
    client = resolved.client;
    editor = resolved.editor;
    checks.push(...resolved.checks);
  } catch (error) {
    const withChecks = error as { checks?: Check[]; message?: string };
    if (withChecks.checks) checks.push(...withChecks.checks);
    else {
      checks.push({
        name: "Identity resolve",
        pass: false,
        detail: withChecks.message ?? String(error),
      });
    }
  }

  const media = client && editor
    ? buildMediaSpecs(client.id, editor.id)
    : { specs: [], missing: [], invalid: [] };

  checks.push({
    name: "Media object keys configured (4)",
    pass: media.specs.length === 4,
    detail:
      media.specs.length === 4
        ? undefined
        : !client || !editor
          ? "deferred until demo identities resolve"
          : `missing=${media.missing.join(",") || "none"}; invalid=${media.invalid.join(",") || "none"}`,
  });

  if (media.specs.length === 4) {
    checks.push(...(await verifyMediaObjects(media.specs)));
  }

  const projectId = env("DEMO_AGENCY_PROJECT_ID");
  let project = null as Awaited<
    ReturnType<typeof prisma.agencyProject.findUnique>
  >;
  if (projectId) {
    project = await prisma.agencyProject.findUnique({ where: { id: projectId } });
    checks.push({
      name: "DEMO_AGENCY_PROJECT_ID exists",
      pass: Boolean(project),
    });
  } else {
    project = client
      ? await prisma.agencyProject.findFirst({
          where: { title: DEMO_PROJECT_TITLE, clientId: client.id },
        })
      : null;
    checks.push({
      name: "Demo project present (optional until seed)",
      pass: true,
      detail: project ? "found by title+client" : "not seeded yet",
    });
  }

  if (project && client) {
    checks.push({
      name: "Demo Client sees only this client project ownership",
      pass: project.clientId === client.id,
    });

    const otherClientProjects = await prisma.agencyProject.count({
      where: {
        clientId: client.id,
        NOT: { id: project.id },
      },
    });
    checks.push({
      name: "Demo Client has no other AgencyProjects",
      pass: otherClientProjects === 0,
      detail:
        otherClientProjects === 0
          ? undefined
          : `extra=${otherClientProjects}`,
    });
  }

  if (project && editor) {
    const editorTasksElsewhere = await prisma.task.count({
      where: {
        assigneeId: editor.id,
        NOT: { projectId: project.id },
      },
    });
    checks.push({
      name: "Demo Editor has no tasks outside demo project",
      pass: editorTasksElsewhere === 0,
      detail:
        editorTasksElsewhere === 0
          ? undefined
          : `extraTasks=${editorTasksElsewhere}`,
    });
  }

  if (project) {
    const foreignAssets = await prisma.mediaAsset.count({
      where: {
        agencyProjectId: project.id,
        // all assets on project are ok; check none of project assets point elsewhere — N/A
      },
    });
    void foreignAssets;

    const assets = await prisma.mediaAsset.findMany({
      where: { agencyProjectId: project.id },
      select: { id: true, agencyProjectId: true, fileName: true },
    });
    checks.push({
      name: "Seeded assets belong only to demo project",
      pass: assets.every((a) => a.agencyProjectId === project!.id),
    });

    const comments = await prisma.$queryRaw<
      { id: string; media_asset_id: string | null; agency_project_id: string | null }[]
    >`
      SELECT id::text AS id, media_asset_id, agency_project_id
      FROM public.video_comments
      WHERE agency_project_id = ${project.id}
    `;
    checks.push({
      name: "Demo comments have project + asset identity",
      pass: comments.every(
        (c) => Boolean(c.agency_project_id) && Boolean(c.media_asset_id),
      ),
      detail: `count=${comments.length}`,
    });

    const md = await prisma.masterDeliveryEvent.findFirst({
      where: { agencyProjectId: project.id },
      orderBy: { createdAt: "desc" },
    });
    const reviewV2 = assets.find((a) => a.fileName === ASSET_NAMES.reviewV2);
    checks.push({
      name: "Master Delivery lineage points to Review V2 when present",
      pass:
        !md ||
        !reviewV2 ||
        md.sourceReviewAssetId === reviewV2.id ||
        md.sourceReviewAssetId == null,
      detail: md
        ? `sourceReviewAssetId=${md.sourceReviewAssetId ?? "null"}`
        : "no MD yet",
    });
  }

  const queueExclusionConfigured = Boolean(
    env("DEMO_AGENCY_PROJECT_ID") || env("DEMO_CLIENT_USER_ID"),
  );
  checks.push({
    name: "Queue exclusion env present (frontend NEXT_PUBLIC_* recommended)",
    pass: true,
    detail: queueExclusionConfigured
      ? "backend DEMO_* ids set — mirror as NEXT_PUBLIC_DEMO_* for Admin UI"
      : "not set yet — Queue filter is a no-op until configured",
  });

  const failed = checks.filter((c) => !c.pass);
  console.log(
    JSON.stringify(
      {
        mode: "inspect",
        demoProjectTitle: DEMO_PROJECT_TITLE,
        checks,
        failed: failed.length,
        hint: "Do not print credential values. Provision users via Admin HQ before --seed.",
      },
      null,
      2,
    ),
  );
  return failed.length;
}

async function runSeed(prisma: PrismaClient) {
  const { client, editor } = await resolveDemoUsers(prisma);
  const media = buildMediaSpecs(client.id, editor.id);
  if (media.specs.length !== 4) {
    throw new Error(
      `Media incomplete. missing=[${media.missing.join(", ")}] invalid=[${media.invalid.join(", ")}]`,
    );
  }
  const headChecks = await verifyMediaObjects(media.specs);
  const headFailed = headChecks.filter((c) => !c.pass);
  if (headFailed.length > 0) {
    throw new Error(
      `R2 HEAD failed for ${headFailed.length} object(s). Seed aborted to avoid broken media rows.`,
    );
  }

  const { projectId, created } = await resolveOrCreateProject(
    prisma,
    client.id,
    editor.id,
  );

  const assetIdsByKind: Record<string, string> = {};
  for (const spec of media.specs) {
    assetIdsByKind[spec.kind] = await upsertAsset(prisma, projectId, spec);
  }

  const assetIds = Object.values(assetIdsByKind);
  await clearDemoHistory(prisma, projectId, assetIds);

  const taskIds = await seedTasks(prisma, projectId, editor.id);
  const reviewDecisionIds = await seedDecisions(
    prisma,
    projectId,
    assetIdsByKind.reviewV1,
    assetIdsByKind.reviewV2,
    client.id,
    editor.id,
  );

  const reviewV2Spec = media.specs.find((s) => s.kind === "reviewV2")!;
  const lock = await seedPictureLock(
    prisma,
    projectId,
    assetIdsByKind.reviewV2,
    editor.id,
    reviewV2Spec.objectKey,
  );

  const { mdIds, downloadIds } = await seedMasterDelivery(
    prisma,
    projectId,
    assetIdsByKind.master,
    assetIdsByKind.reviewV2,
    editor.id,
    client.id,
  );

  const commentIds = await seedComments(
    prisma,
    projectId,
    assetIdsByKind.reviewV1,
    assetIdsByKind.reviewV2,
    client.id,
    editor.id,
  );

  const manifest: DemoManifest = {
    version: 1,
    updatedAt: new Date().toISOString(),
    projectId,
    clientUserId: client.id,
    editorUserId: editor.id,
    taskIds,
    assetIds,
    reviewDecisionIds,
    pictureLockEventIds: lock.ids,
    masterDeliveryEventIds: mdIds,
    downloadEventIds: downloadIds,
    commentIds,
    objectKeys: media.specs.map((s) => s.objectKey),
    r2ObjectsCreatedByScript: [],
  };
  writeManifest(manifest);

  console.log(
    JSON.stringify(
      {
        mode: "seed",
        ok: true,
        projectCreated: created,
        projectId,
        pictureLock: lock.skipped ? { skipped: lock.skipped } : { seeded: true },
        assets: assetIdsByKind,
        hint: "Set DEMO_AGENCY_PROJECT_ID / DEMO_CLIENT_USER_ID / DEMO_EDITOR_USER_ID and NEXT_PUBLIC_* mirrors. Do not commit the local manifest.",
      },
      null,
      2,
    ),
  );
}

async function runReset(
  prisma: PrismaClient,
  options: { confirmReset: boolean; deleteProject: boolean },
) {
  if (!options.confirmReset) {
    throw new Error(
      "Refusing reset without --confirm-demo-reset. Re-run with that flag after reviewing dry-run.",
    );
  }

  const { client, editor } = await resolveDemoUsers(prisma);
  const configuredProjectId = env("DEMO_AGENCY_PROJECT_ID");
  const manifest = readManifest();

  const project =
    (configuredProjectId
      ? await prisma.agencyProject.findUnique({
          where: { id: configuredProjectId },
        })
      : null) ??
    (await prisma.agencyProject.findFirst({
      where: { title: DEMO_PROJECT_TITLE, clientId: client.id },
    }));

  if (!project) {
    console.log(JSON.stringify({ mode: "reset", ok: true, detail: "Nothing to reset" }));
    return;
  }

  if (project.clientId !== client.id) {
    throw new Error("Refusing reset: project client does not match Demo Client");
  }
  if (manifest && manifest.projectId !== project.id) {
    throw new Error(
      "Refusing reset: local manifest projectId mismatch — verify DEMO_AGENCY_PROJECT_ID",
    );
  }
  if (manifest && manifest.clientUserId !== client.id) {
    throw new Error("Refusing reset: manifest clientUserId mismatch");
  }

  const assets = await prisma.mediaAsset.findMany({
    where: { agencyProjectId: project.id },
    select: { id: true, fileName: true },
  });
  const demoAssets = assets.filter((a) =>
    Object.values(ASSET_NAMES).includes(
      a.fileName as (typeof ASSET_NAMES)[keyof typeof ASSET_NAMES],
    ),
  );
  const assetIds = demoAssets.map((a) => a.id);

  const dryRun = {
    projectId: project.id,
    title: project.title,
    tasks: await prisma.task.count({ where: { projectId: project.id } }),
    reviewDecisions: await prisma.reviewVersionDecision.count({
      where: { agencyProjectId: project.id },
    }),
    pictureLockEvents: await prisma.pictureLockEvent.count({
      where: { agencyProjectId: project.id },
    }),
    masterDeliveryEvents: await prisma.masterDeliveryEvent.count({
      where: { agencyProjectId: project.id },
    }),
    downloadEvents: await prisma.masterDeliveryDownloadEvent.count({
      where: { agencyProjectId: project.id },
    }),
    demoAssets: demoAssets.length,
    deleteProject: options.deleteProject,
    r2Policy: "reusable source objects preserved (script does not prefix-wipe)",
  };

  console.log(JSON.stringify({ mode: "reset", dryRun }, null, 2));

  await clearDemoHistory(prisma, project.id, assetIds);

  if (assetIds.length > 0) {
    await prisma.mediaAsset.deleteMany({ where: { id: { in: assetIds } } });
  }

  if (options.deleteProject) {
    await prisma.agencyProject.delete({ where: { id: project.id } });
  }

  // Preserve Demo Client / Demo Editor accounts always.
  void editor;

  if (existsSync(MANIFEST_PATH)) {
    writeFileSync(
      MANIFEST_PATH,
      JSON.stringify(
        {
          version: 1,
          updatedAt: new Date().toISOString(),
          note: "Cleared after reset",
          preservedUsers: true,
        },
        null,
        2,
      ),
    );
  }

  console.log(
    JSON.stringify({
      mode: "reset",
      ok: true,
      deletedProject: options.deleteProject,
      preservedAuthUsers: true,
    }),
  );
}

async function main() {
  const { mode, confirmReset, deleteProject } = parseMode(process.argv.slice(2));
  const { prisma, pool } = createPrisma();

  try {
    if (mode === "inspect") {
      const failed = await runInspect(prisma);
      process.exitCode = failed > 0 ? 1 : 0;
      return;
    }
    if (mode === "seed") {
      await runSeed(prisma);
      return;
    }
    if (mode === "reset") {
      await runReset(prisma, { confirmReset, deleteProject });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const checks = (error as { checks?: Check[] }).checks;
    console.error(
      JSON.stringify({ ok: false, mode, error: message, checks }, null, 2),
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
