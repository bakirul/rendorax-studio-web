import type { AgencyRole, PrismaClient } from "@prisma/client";

export function mapSupabaseRoleToAgencyRole(
  role: string | undefined,
): AgencyRole {
  if (role === "admin") return "admin";
  if (role === "client") return "client";
  return "editor";
}

export async function ensureAgencyUser(
  prisma: PrismaClient,
  user: { id: string; email?: string; role?: string },
) {
  const email = user.email?.trim();
  if (!email) {
    throw new Error("Authenticated user is missing an email address");
  }

  const role = mapSupabaseRoleToAgencyRole(user.role);

  return prisma.user.upsert({
    where: { id: user.id },
    update: { email, role },
    create: { id: user.id, email, role },
  });
}
