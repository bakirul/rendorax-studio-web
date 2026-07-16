export type ClientOrganizationRole =
  | "primary_contact"
  | "reviewer"
  | "stakeholder"
  | "approver"
  | "observer";

export type ClientOrganizationMemberStatus =
  | "invited"
  | "active"
  | "removed";

export type OrgCapabilities = {
  submitRequest: boolean;
  respondProposal: boolean;
  comment: boolean;
  revisionRequest: boolean;
  approveReview: boolean;
  downloadMaster: boolean;
  manageMembers: boolean;
};

export type ClientOrganizationSummary = {
  id: string;
  name: string;
  primaryContactUserId: string;
  primaryContact?: {
    id: string;
    email: string;
    displayName: string | null;
  };
};

export type OrgMember = {
  id: string;
  organizationId: string;
  userId: string | null;
  email: string;
  displayName: string | null;
  role: ClientOrganizationRole;
  status: ClientOrganizationMemberStatus;
  invitedAt: string;
  acceptedAt: string | null;
};

export type OrgInvitation = {
  id: string;
  email: string;
  displayName: string | null;
  role: ClientOrganizationRole;
  expiresAt: string;
  createdAt: string;
};

export type ClientOrganizationResponse = {
  organization: ClientOrganizationSummary;
  currentMember: {
    id: string;
    role: ClientOrganizationRole;
    status: ClientOrganizationMemberStatus;
    email: string;
    displayName: string | null;
    capabilities: OrgCapabilities;
  } | null;
  members: OrgMember[];
  invitations: OrgInvitation[];
};

export const INVITABLE_ROLES: ClientOrganizationRole[] = [
  "reviewer",
  "stakeholder",
  "approver",
  "observer",
];

export function getOrgRoleLabel(role: ClientOrganizationRole): string {
  switch (role) {
    case "primary_contact":
      return "Primary Contact";
    case "reviewer":
      return "Reviewer";
    case "stakeholder":
      return "Stakeholder";
    case "approver":
      return "Approver";
    case "observer":
      return "Observer";
    default:
      return role;
  }
}

export async function fetchClientOrganization(
  organizationId?: string,
): Promise<ClientOrganizationResponse> {
  const query = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : "";
  const res = await fetch(`/api/agency/client-organization${query}`, {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load organization",
    );
  }
  return data as ClientOrganizationResponse;
}

export async function inviteOrgMember(input: {
  email: string;
  displayName?: string;
  role: ClientOrganizationRole;
  organizationId?: string;
}): Promise<{
  invitation: OrgInvitation;
  inviteUrl: string;
  emailSent: boolean;
  emailDeliveryNote?: string;
}> {
  const res = await fetch("/api/agency/client-organization/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to invite member",
    );
  }
  return data;
}

export async function resendOrgInvitation(id: string): Promise<{
  invitation: OrgInvitation;
  inviteUrl: string;
  emailSent: boolean;
}> {
  const res = await fetch(
    `/api/agency/client-organization/invitations/${encodeURIComponent(id)}/resend`,
    { method: "POST" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to resend invitation",
    );
  }
  return data;
}

export async function revokeOrgInvitation(id: string): Promise<void> {
  const res = await fetch(
    `/api/agency/client-organization/invitations/${encodeURIComponent(id)}/revoke`,
    { method: "PATCH" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to revoke invitation",
    );
  }
}

export async function updateOrgMemberRole(
  id: string,
  role: ClientOrganizationRole,
): Promise<void> {
  const res = await fetch(
    `/api/agency/client-organization/members/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to update member",
    );
  }
}

export async function removeOrgMember(id: string): Promise<void> {
  const res = await fetch(
    `/api/agency/client-organization/members/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to remove member",
    );
  }
}

export async function validateInviteToken(token: string): Promise<{
  status: string;
  organizationName?: string;
  email?: string;
  role?: ClientOrganizationRole;
  displayName?: string | null;
  accountExists?: boolean;
  error?: string;
}> {
  const res = await fetch(
    `/api/agency/client-organization/invitations/accept?token=${encodeURIComponent(token)}`,
    { method: "GET", cache: "no-store" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      status: data.status || "invalid",
      error: typeof data.error === "string" ? data.error : "Invalid invitation",
    };
  }
  return data;
}

export async function acceptInvite(input: {
  token: string;
  password: string;
  displayName?: string;
}): Promise<{ success: boolean; email: string }> {
  const res = await fetch("/api/agency/client-organization/invitations/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to accept invitation",
    );
  }
  return data;
}
