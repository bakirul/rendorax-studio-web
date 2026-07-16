import type { PrismaClient, User } from "@prisma/client";

function organizationNameForClient(user: User): string {
  const display = user.displayName?.trim();
  if (display) return display;

  const local = user.email.split("@")[0]?.trim();
  if (local) return `${local} Organization`;

  return "Client Organization";
}

/**
 * Phase 1 bootstrap: one ClientOrganization per Client primary contact.
 * Not a multi-member org system.
 */
export async function ensureClientOrganizationForPrimaryContact(
  prisma: PrismaClient,
  user: User,
) {
  const existing = await prisma.clientOrganization.findUnique({
    where: { primaryContactUserId: user.id },
  });
  if (existing) return existing;

  try {
    return await prisma.clientOrganization.create({
      data: {
        name: organizationNameForClient(user),
        primaryContactUserId: user.id,
      },
    });
  } catch (error) {
    // Concurrent first access: another request may have created it.
    const raced = await prisma.clientOrganization.findUnique({
      where: { primaryContactUserId: user.id },
    });
    if (raced) return raced;
    throw error;
  }
}
