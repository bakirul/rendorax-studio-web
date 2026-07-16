import { Router } from "express";
import type { Response } from "express";
import type { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import type { AuthenticatedRequest } from "../middleware/requireAuth";
import { hashInviteToken } from "../lib/clientOrganizationMembers";
import { getSupabaseAdminClient } from "../lib/supabaseAdmin";

const router = Router();

function getPrisma(req: AuthenticatedRequest): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

/**
 * GET /api/agency/client-organization/invitations/accept?token=
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const rawToken = String(req.query.token ?? "").trim();
  if (!rawToken) {
    res.status(400).json({ error: "token is required" });
    return;
  }

  const prisma = getPrisma(req);
  const tokenHash = hashInviteToken(rawToken);

  try {
    const invitation = await prisma.clientOrganizationInvitation.findUnique({
      where: { tokenHash },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      res.status(404).json({ error: "Invalid invitation", status: "invalid" });
      return;
    }
    if (invitation.revokedAt) {
      res.status(410).json({ error: "Invitation revoked", status: "revoked" });
      return;
    }
    if (invitation.acceptedAt) {
      res
        .status(410)
        .json({ error: "Invitation already accepted", status: "accepted" });
      return;
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      res.status(410).json({ error: "Invitation expired", status: "expired" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true, role: true },
    });

    res.json({
      status: "valid",
      organizationName: invitation.organization.name,
      email: invitation.email,
      role: invitation.role,
      displayName: invitation.displayName,
      expiresAt: invitation.expiresAt.toISOString(),
      accountExists: Boolean(existingUser),
    });
  } catch (error) {
    console.error("Failed to validate invitation:", error);
    res.status(500).json({ error: "Failed to validate invitation" });
  }
});

/**
 * POST /api/agency/client-organization/invitations/accept
 */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const rawToken =
    typeof req.body?.token === "string" ? req.body.token.trim() : "";
  if (!rawToken) {
    res.status(400).json({ error: "token is required" });
    return;
  }

  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  if (!password || password.length < 8) {
    res.status(400).json({ error: "password must be at least 8 characters" });
    return;
  }

  const displayName =
    typeof req.body?.displayName === "string"
      ? req.body.displayName.trim()
      : "";

  const prisma = getPrisma(req);
  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    res.status(503).json({ error: "Auth provisioning unavailable" });
    return;
  }

  const anonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!anonKey || !supabaseUrl) {
    res.status(503).json({ error: "Auth verification unavailable" });
    return;
  }

  const tokenHash = hashInviteToken(rawToken);
  let createdAuthUserId: string | null = null;

  try {
    const invitation = await prisma.clientOrganizationInvitation.findUnique({
      where: { tokenHash },
      include: { organization: true },
    });

    if (!invitation || invitation.revokedAt) {
      res.status(410).json({ error: "Invitation is invalid or revoked" });
      return;
    }
    if (invitation.acceptedAt) {
      res.status(410).json({ error: "Invitation already accepted" });
      return;
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      res.status(410).json({ error: "Invitation expired" });
      return;
    }

    const email = invitation.email;
    const existingPrisma = await prisma.user.findUnique({ where: { email } });
    if (existingPrisma && existingPrisma.role !== "client") {
      res.status(400).json({
        error: "This email belongs to a non-client account",
      });
      return;
    }

    let userId: string;

    if (existingPrisma) {
      const anon = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: signInError } = await anon.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        res.status(401).json({
          error: "Account exists. Enter the correct password to accept.",
        });
        return;
      }
      userId = existingPrisma.id;
      if (displayName) {
        await prisma.user.update({
          where: { id: userId },
          data: { displayName },
        });
      }
    } else {
      const { data: createData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: displayName || invitation.displayName || email,
          },
          app_metadata: { role: "client" },
        });

      if (createError || !createData.user?.id) {
        const message = createError?.message ?? "Failed to create account";
        if (message.toLowerCase().includes("already")) {
          res.status(409).json({
            error:
              "An auth account already exists for this email. Use that password to accept.",
          });
          return;
        }
        res.status(502).json({ error: "Failed to provision account" });
        return;
      }

      createdAuthUserId = createData.user.id;
      userId = createData.user.id;

      await prisma.user.create({
        data: {
          id: userId,
          email,
          displayName: displayName || invitation.displayName,
          role: "client",
        },
      });
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.clientOrganizationInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: now },
      }),
      prisma.clientOrganizationMember.upsert({
        where: {
          organizationId_email: {
            organizationId: invitation.organizationId,
            email,
          },
        },
        create: {
          organizationId: invitation.organizationId,
          userId,
          email,
          displayName: displayName || invitation.displayName,
          role: invitation.role,
          status: "active",
          invitedByUserId: invitation.invitedByUserId,
          acceptedAt: now,
        },
        update: {
          userId,
          displayName: displayName || invitation.displayName,
          role: invitation.role,
          status: "active",
          acceptedAt: now,
          removedAt: null,
        },
      }),
    ]);

    res.json({
      success: true,
      email,
      organizationId: invitation.organizationId,
      role: invitation.role,
    });
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin
        .deleteUser(createdAuthUserId)
        .catch(() => undefined);
    }
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

export default router;
