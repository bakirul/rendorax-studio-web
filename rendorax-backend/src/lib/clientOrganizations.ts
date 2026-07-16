import type { PrismaClient, User } from "@prisma/client";
import { ensurePrimaryContactMembership } from "./clientOrganizationMembers";

function organizationNameForClient(user: User): string {
  const display = user.displayName?.trim();
  if (display) return display;

  const local = user.email.split("@")[0]?.trim();
  if (local) return `${local} Organization`;

  return "Client Organization";
}

/**
 * One ClientOrganization per Client primary contact.
 * Also ensures an active primary_contact membership row.
 */
export async function ensureClientOrganizationForPrimaryContact(
  prisma: PrismaClient,
  user: User,
) {
  let organization = await prisma.clientOrganization.findUnique({
    where: { primaryContactUserId: user.id },
  });

  if (!organization) {
    try {
      organization = await prisma.clientOrganization.create({
        data: {
          name: organizationNameForClient(user),
          primaryContactUserId: user.id,
        },
      });
    } catch (error) {
      const raced = await prisma.clientOrganization.findUnique({
        where: { primaryContactUserId: user.id },
      });
      if (!raced) throw error;
      organization = raced;
    }
  }

  await ensurePrimaryContactMembership(prisma, organization.id, user);
  return organization;
}
