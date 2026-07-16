import { Router } from "express";
import type { Response } from "express";
import type {
  ClientOrganizationRole,
  PrismaClient,
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
  generateInviteToken,
  inviteExpiresAt,
  isInvitableOrgRole,
  normalizeInviteEmail,
  orgRoleHasCapability,
} from "../lib/clientOrganizationMembers";

const router = Router();

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

function buildInviteUrl(rawToken: string): string {
  const base =
    process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/access/invite?token=${encodeURIComponent(rawToken)}`;
}

async function resolveManagedOrganization(
  prisma: PrismaClient,
  actor: User,
  req: AuthenticatedRequest,
  res: Response,
  organizationIdHint?: string,
) {
  if (isAdminRole(req.user?.role)) {
    if (organizationIdHint) {
      const org = await prisma.clientOrganization.findUnique({
        where: { id: organizationIdHint },
      });
      if (!org) {
        res.status(404).json({ error: "Organization not found" });
        return null;
      }
      return org;
    }
    res.status(400).json({ error: "organizationId is required for admin" });
    return null;
  }

  const role = mapSupabaseRoleToAgencyRole(req.user?.role);
  if (role !== "client") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  const membership = await findActiveMembership(prisma, actor.id);
  if (!membership) {
    // Primary contact bootstrap path
    const org = await ensureClientOrganizationForPrimaryContact(prisma, actor);
    return org;
  }

  if (!orgRoleHasCapability(membership.role, "manage_members")) {
    res.status(403).json({ error: "Only the Primary Contact can manage members" });
    return null;
  }

  return membership.organization;
}

/**
 * GET /api/agency/client-organization
 */
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const actor = await requireAgencyUser(req, res);
  if (!actor) return;

  const prisma = getPrisma(req);
  const role = mapSupabaseRoleToAgencyRole(req.user?.role);

  try {
    if (isAdminRole(req.user?.role)) {
      const organizationId = String(req.query.organizationId ?? "").trim();
      if (!organizationId) {
        res.status(400).json({ error: "organizationId is required" });
        return;
      }
      const organization = await prisma.clientOrganization.findUnique({
        where: { id: organizationId },
        include: {
          primaryContact: {
            select: { id: true, email: true, displayName: true },
          },
        },
      });
      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }
      const members = await prisma.clientOrganizationMember.findMany({
        where: {
          organizationId,
          status: { in: ["active", "invited"] },
        },
        orderBy: [{ status: "asc" }, { invitedAt: "desc" }],
      });
      const invitations = await prisma.clientOrganizationInvitation.findMany({
        where: {
          organizationId,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({
        organization: {
          id: organization.id,
          name: organization.name,
          primaryContactUserId: organization.primaryContactUserId,
          primaryContact: organization.primaryContact,
        },
        currentMember: null,
        members,
        invitations,
      });
      return;
    }

    if (role !== "client") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    let membership = await findActiveMembership(prisma, actor.id);
    let organization;
    if (!membership) {
      organization = await ensureClientOrganizationForPrimaryContact(
        prisma,
        actor,
      );
      membership = await findActiveMembership(prisma, actor.id);
    } else {
      organization = membership.organization;
    }

    if (!organization || !membership) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const fullOrg = await prisma.clientOrganization.findUnique({
      where: { id: organization.id },
      include: {
        primaryContact: {
          select: { id: true, email: true, displayName: true },
        },
      },
    });

    const members = await prisma.clientOrganizationMember.findMany({
      where: {
        organizationId: organization.id,
        status: { in: ["active", "invited"] },
      },
      orderBy: [{ status: "asc" }, { invitedAt: "desc" }],
    });

    const canManage = orgRoleHasCapability(membership.role, "manage_members");
    const invitations = canManage
      ? await prisma.clientOrganizationInvitation.findMany({
          where: {
            organizationId: organization.id,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    res.json({
      organization: {
        id: fullOrg!.id,
        name: fullOrg!.name,
        primaryContactUserId: fullOrg!.primaryContactUserId,
        primaryContact: fullOrg!.primaryContact,
      },
      currentMember: {
        id: membership.id,
        role: membership.role,
        status: membership.status,
        email: membership.email,
        displayName: membership.displayName,
        capabilities: {
          submitRequest: orgRoleHasCapability(membership.role, "submit_request"),
          respondProposal: orgRoleHasCapability(
            membership.role,
            "respond_proposal",
          ),
          comment: orgRoleHasCapability(membership.role, "comment"),
          revisionRequest: orgRoleHasCapability(
            membership.role,
            "revision_request",
          ),
          approveReview: orgRoleHasCapability(membership.role, "approve_review"),
          downloadMaster: orgRoleHasCapability(
            membership.role,
            "download_master",
          ),
          manageMembers: canManage,
        },
      },
      members,
      invitations,
    });
  } catch (error) {
    console.error("Failed to load client organization:", error);
    res.status(500).json({ error: "Failed to load organization" });
  }
});

/**
 * POST /api/agency/client-organization/invitations
 */
router.post(
  "/invitations",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    const email = normalizeInviteEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ error: "A valid email is required" });
      return;
    }

    const roleRaw =
      typeof req.body?.role === "string" ? req.body.role.trim() : "";
    if (!isInvitableOrgRole(roleRaw)) {
      res.status(400).json({
        error: `role must be one of: ${["reviewer", "stakeholder", "approver", "observer"].join(", ")}`,
      });
      return;
    }

    const displayName =
      typeof req.body?.displayName === "string"
        ? req.body.displayName.trim() || null
        : null;

    const organizationIdHint =
      typeof req.body?.organizationId === "string"
        ? req.body.organizationId.trim()
        : undefined;

    const prisma = getPrisma(req);
    const organization = await resolveManagedOrganization(
      prisma,
      actor,
      req,
      res,
      organizationIdHint,
    );
    if (!organization) return;

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.role !== "client") {
        res.status(400).json({
          error: "Cannot invite admin or editor accounts into a client organization",
        });
        return;
      }

      const activeMember = await prisma.clientOrganizationMember.findFirst({
        where: {
          organizationId: organization.id,
          email,
          status: "active",
        },
      });
      if (activeMember) {
        res.status(409).json({ error: "This email is already an active member" });
        return;
      }

      const otherOrgActive = await prisma.clientOrganizationMember.findFirst({
        where: {
          email,
          status: "active",
          NOT: { organizationId: organization.id },
        },
      });
      if (otherOrgActive) {
        res.status(409).json({
          error: "This email already belongs to another client organization",
        });
        return;
      }

      await prisma.clientOrganizationInvitation.updateMany({
        where: {
          organizationId: organization.id,
          email,
          acceptedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      const { rawToken, tokenHash } = generateInviteToken();
      const invitation = await prisma.clientOrganizationInvitation.create({
        data: {
          organizationId: organization.id,
          invitedByUserId: actor.id,
          email,
          displayName,
          role: roleRaw,
          tokenHash,
          expiresAt: inviteExpiresAt(),
        },
      });

      const member = await prisma.clientOrganizationMember.upsert({
        where: {
          organizationId_email: {
            organizationId: organization.id,
            email,
          },
        },
        create: {
          organizationId: organization.id,
          email,
          displayName,
          role: roleRaw,
          status: "invited",
          invitedByUserId: actor.id,
        },
        update: {
          displayName,
          role: roleRaw,
          status: "invited",
          invitedByUserId: actor.id,
          invitedAt: new Date(),
          removedAt: null,
          acceptedAt: null,
          userId: null,
        },
      });

      const inviteUrl = buildInviteUrl(rawToken);

      res.status(201).json({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          displayName: invitation.displayName,
          role: invitation.role,
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.createdAt.toISOString(),
        },
        member,
        organizationName: organization.name,
        inviterName: actor.displayName || actor.email,
        inviteUrl,
        emailSent: false,
        emailDeliveryNote:
          "Email delivery not configured on the API. Use the invite link or send via the frontend mailer.",
      });
    } catch (error) {
      console.error("Failed to create invitation:", error);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  },
);

/**
 * POST /api/agency/client-organization/invitations/:id/resend
 */
router.post(
  "/invitations/:id/resend",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    const invitationId = String(req.params.id ?? "").trim();
    if (!invitationId) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const prisma = getPrisma(req);

    try {
      const existing = await prisma.clientOrganizationInvitation.findUnique({
        where: { id: invitationId },
      });
      if (!existing) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      const organization = await resolveManagedOrganization(
        prisma,
        actor,
        req,
        res,
        existing.organizationId,
      );
      if (!organization) return;

      if (existing.organizationId !== organization.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      await prisma.clientOrganizationInvitation.update({
        where: { id: invitationId },
        data: { revokedAt: new Date() },
      });

      const { rawToken, tokenHash } = generateInviteToken();
      const invitation = await prisma.clientOrganizationInvitation.create({
        data: {
          organizationId: existing.organizationId,
          invitedByUserId: actor.id,
          email: existing.email,
          displayName: existing.displayName,
          role: existing.role,
          tokenHash,
          expiresAt: inviteExpiresAt(),
        },
      });

      res.json({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          displayName: invitation.displayName,
          role: invitation.role,
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.createdAt.toISOString(),
        },
        organizationName: organization.name,
        inviterName: actor.displayName || actor.email,
        inviteUrl: buildInviteUrl(rawToken),
        emailSent: false,
        emailDeliveryNote:
          "Email delivery not configured on the API. Use the invite link or send via the frontend mailer.",
      });
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      res.status(500).json({ error: "Failed to resend invitation" });
    }
  },
);

/**
 * PATCH /api/agency/client-organization/invitations/:id/revoke
 */
router.patch(
  "/invitations/:id/revoke",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    const invitationId = String(req.params.id ?? "").trim();
    const prisma = getPrisma(req);

    try {
      const existing = await prisma.clientOrganizationInvitation.findUnique({
        where: { id: invitationId },
      });
      if (!existing) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      const organization = await resolveManagedOrganization(
        prisma,
        actor,
        req,
        res,
        existing.organizationId,
      );
      if (!organization) return;

      const updated = await prisma.clientOrganizationInvitation.update({
        where: { id: invitationId },
        data: { revokedAt: new Date() },
      });

      await prisma.clientOrganizationMember.updateMany({
        where: {
          organizationId: existing.organizationId,
          email: existing.email,
          status: "invited",
        },
        data: { status: "removed", removedAt: new Date() },
      });

      res.json({
        invitation: {
          id: updated.id,
          revokedAt: updated.revokedAt?.toISOString() ?? null,
        },
      });
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
      res.status(500).json({ error: "Failed to revoke invitation" });
    }
  },
);

/**
 * GET /api/agency/client-organization/invitations/accept?token=
 */
router.patch(
  "/members/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    const memberId = String(req.params.id ?? "").trim();
    const roleRaw =
      typeof req.body?.role === "string" ? req.body.role.trim() : "";
    if (!isInvitableOrgRole(roleRaw)) {
      res.status(400).json({
        error: "role must be reviewer, stakeholder, approver, or observer",
      });
      return;
    }

    const prisma = getPrisma(req);

    try {
      const member = await prisma.clientOrganizationMember.findUnique({
        where: { id: memberId },
      });
      if (!member || member.status === "removed") {
        res.status(404).json({ error: "Member not found" });
        return;
      }
      if (member.role === "primary_contact") {
        res.status(400).json({ error: "Cannot change Primary Contact role" });
        return;
      }

      const organization = await resolveManagedOrganization(
        prisma,
        actor,
        req,
        res,
        member.organizationId,
      );
      if (!organization) return;

      const updated = await prisma.clientOrganizationMember.update({
        where: { id: memberId },
        data: { role: roleRaw as ClientOrganizationRole },
      });

      res.json({ member: updated });
    } catch (error) {
      console.error("Failed to update member:", error);
      res.status(500).json({ error: "Failed to update member" });
    }
  },
);

/**
 * DELETE /api/agency/client-organization/members/:id
 * Soft-remove.
 */
router.delete(
  "/members/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const actor = await requireAgencyUser(req, res);
    if (!actor) return;

    const memberId = String(req.params.id ?? "").trim();
    const prisma = getPrisma(req);

    try {
      const member = await prisma.clientOrganizationMember.findUnique({
        where: { id: memberId },
      });
      if (!member || member.status === "removed") {
        res.status(404).json({ error: "Member not found" });
        return;
      }
      if (member.role === "primary_contact" || member.userId === actor.id) {
        res.status(400).json({
          error: "Primary Contact cannot be removed",
        });
        return;
      }

      const organization = await resolveManagedOrganization(
        prisma,
        actor,
        req,
        res,
        member.organizationId,
      );
      if (!organization) return;

      const updated = await prisma.clientOrganizationMember.update({
        where: { id: memberId },
        data: {
          status: "removed",
          removedAt: new Date(),
        },
      });

      await prisma.clientOrganizationInvitation.updateMany({
        where: {
          organizationId: member.organizationId,
          email: member.email,
          acceptedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      res.json({ member: updated });
    } catch (error) {
      console.error("Failed to remove member:", error);
      res.status(500).json({ error: "Failed to remove member" });
    }
  },
);

export default router;
