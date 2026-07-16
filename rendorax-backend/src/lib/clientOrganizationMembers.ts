import { createHash, randomBytes } from "crypto";
import type {
  ClientOrganizationRole,
  PrismaClient,
  User,
} from "@prisma/client";

export const INVITE_EXPIRY_DAYS = 7;

export const INVITABLE_ORG_ROLES = [
  "reviewer",
  "stakeholder",
  "approver",
  "observer",
] as const;

export type InvitableOrgRole = (typeof INVITABLE_ORG_ROLES)[number];

export function isInvitableOrgRole(value: string): value is InvitableOrgRole {
  return (INVITABLE_ORG_ROLES as readonly string[]).includes(value);
}

export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function generateInviteToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: hashInviteToken(rawToken) };
}

export function inviteExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export function normalizeInviteEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export type OrgCapability =
  | "submit_request"
  | "respond_proposal"
  | "comment"
  | "revision_request"
  | "approve_review"
  | "download_master"
  | "manage_members";

const ROLE_CAPABILITIES: Record<ClientOrganizationRole, Set<OrgCapability>> = {
  primary_contact: new Set([
    "submit_request",
    "respond_proposal",
    "comment",
    "revision_request",
    "approve_review",
    "download_master",
    "manage_members",
  ]),
  reviewer: new Set(["comment", "revision_request"]),
  stakeholder: new Set([
    "submit_request",
    "comment",
    "revision_request",
  ]),
  approver: new Set([
    "submit_request",
    "respond_proposal",
    "comment",
    "revision_request",
    "approve_review",
    "download_master",
  ]),
  observer: new Set([]),
};

export function orgRoleHasCapability(
  role: ClientOrganizationRole,
  capability: OrgCapability,
): boolean {
  return ROLE_CAPABILITIES[role].has(capability);
}

export async function findActiveMembership(
  prisma: PrismaClient,
  userId: string,
) {
  return prisma.clientOrganizationMember.findFirst({
    where: {
      userId,
      status: "active",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          primaryContactUserId: true,
        },
      },
    },
    orderBy: { acceptedAt: "desc" },
  });
}

export async function findActiveMembershipForOrg(
  prisma: PrismaClient,
  userId: string,
  organizationId: string,
) {
  return prisma.clientOrganizationMember.findFirst({
    where: {
      userId,
      organizationId,
      status: "active",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          primaryContactUserId: true,
        },
      },
    },
  });
}

/** Primary contact user IDs whose orgs the actor can access as an active member. */
export async function getAccessibleClientIdsForMember(
  prisma: PrismaClient,
  userId: string,
): Promise<string[]> {
  const memberships = await prisma.clientOrganizationMember.findMany({
    where: { userId, status: "active" },
    select: {
      organization: { select: { primaryContactUserId: true } },
    },
  });
  const ids = new Set<string>([userId]);
  for (const m of memberships) {
    ids.add(m.organization.primaryContactUserId);
  }
  return [...ids];
}

/**
 * Client may access a project if they are the canonical clientId
 * or an active member of the org whose primary contact owns the project.
 */
export async function clientCanAccessProjectClientId(
  prisma: PrismaClient,
  actorId: string,
  projectClientId: string | null | undefined,
): Promise<boolean> {
  if (!projectClientId) return false;
  if (projectClientId === actorId) return true;

  const membership = await prisma.clientOrganizationMember.findFirst({
    where: {
      userId: actorId,
      status: "active",
      organization: { primaryContactUserId: projectClientId },
    },
    select: { id: true, role: true },
  });
  return Boolean(membership);
}

export async function getClientOrgRoleForProject(
  prisma: PrismaClient,
  actorId: string,
  projectClientId: string | null | undefined,
): Promise<ClientOrganizationRole | null> {
  if (!projectClientId) return null;
  if (projectClientId === actorId) {
    const asPrimary = await prisma.clientOrganizationMember.findFirst({
      where: {
        userId: actorId,
        status: "active",
        role: "primary_contact",
        organization: { primaryContactUserId: actorId },
      },
      select: { role: true },
    });
    return asPrimary?.role ?? "primary_contact";
  }

  const membership = await prisma.clientOrganizationMember.findFirst({
    where: {
      userId: actorId,
      status: "active",
      organization: { primaryContactUserId: projectClientId },
    },
    select: { role: true },
  });
  return membership?.role ?? null;
}

export async function ensurePrimaryContactMembership(
  prisma: PrismaClient,
  organizationId: string,
  primary: User,
) {
  const email = primary.email.trim().toLowerCase();
  const existing = await prisma.clientOrganizationMember.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email,
      },
    },
  });

  if (existing) {
    if (
      existing.status !== "active" ||
      existing.role !== "primary_contact" ||
      existing.userId !== primary.id
    ) {
      return prisma.clientOrganizationMember.update({
        where: { id: existing.id },
        data: {
          userId: primary.id,
          displayName: primary.displayName,
          role: "primary_contact",
          status: "active",
          acceptedAt: existing.acceptedAt ?? new Date(),
          removedAt: null,
        },
      });
    }
    return existing;
  }

  return prisma.clientOrganizationMember.create({
    data: {
      organizationId,
      userId: primary.id,
      email,
      displayName: primary.displayName,
      role: "primary_contact",
      status: "active",
      invitedByUserId: primary.id,
      acceptedAt: new Date(),
    },
  });
}
