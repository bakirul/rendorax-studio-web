export const PROJECT_REQUEST_TYPES = [
  "Commercial",
  "TV Program",
  "Promo",
  "Trailer",
  "Localization",
  "Subtitles",
  "Graphics Package",
  "Other",
] as const;

export type ProjectRequestType = (typeof PROJECT_REQUEST_TYPES)[number];

export type ProjectRequestStatus =
  | "submitted"
  | "needs_clarification"
  | "under_review"
  | "quoted"
  | "approved"
  | "rejected"
  | "converted_to_project";

export type ProjectProposalStatus =
  | "draft"
  | "sent"
  | "changes_requested"
  | "approved"
  | "rejected";

export type ProjectRequestOrganization = {
  id: string;
  name: string;
  primaryContactUserId?: string;
};

export type ProjectRequestSubmitter = {
  id: string;
  email: string;
  displayName: string | null;
  role?: string;
};

export type ConvertedAgencyProjectSummary = {
  id: string;
  title: string;
  status: string;
  archivedAt?: string | null;
};

export type ProjectRequestSummary = {
  id: string;
  title: string;
  projectType: string;
  status: ProjectRequestStatus;
  deadlineAt: string | null;
  createdAt: string;
  updatedAt: string;
  convertedAgencyProjectId?: string | null;
  convertedAgencyProject?: ConvertedAgencyProjectSummary | null;
  organization: { id: string; name: string };
  submittedBy: {
    id: string;
    email: string;
    displayName: string | null;
  };
};

export type ProjectRequestDetail = ProjectRequestSummary & {
  organizationId: string;
  submittedByUserId: string;
  description: string;
  referenceLinks: string | null;
  deliverables: string;
  budgetRange: string | null;
  adminNote: string | null;
  convertedAt?: string | null;
  convertedByUserId?: string | null;
  organization: ProjectRequestOrganization;
  submittedBy: ProjectRequestSubmitter;
  convertedBy?: ProjectRequestSubmitter | null;
};

export type ProjectProposal = {
  id: string;
  requestId: string;
  createdByUserId: string;
  approvedByUserId: string | null;
  version: number;
  estimatedCostCents: number;
  currency: string;
  timelineText: string;
  deliverablesText: string;
  notes: string | null;
  termsText: string | null;
  status: ProjectProposalStatus;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    email: string;
    displayName: string | null;
  };
  approvedBy?: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
};

export type SubmitProjectRequestInput = {
  title: string;
  projectType: string;
  description: string;
  deliverables: string;
  referenceLinks?: string;
  deadlineAt?: string;
  budgetRange?: string;
};

export type UpdateProjectRequestStatusInput = {
  status: ProjectRequestStatus;
  adminNote?: string;
};

export type CreateProposalInput = {
  estimatedCostCents: number;
  currency?: string;
  timelineText: string;
  deliverablesText: string;
  notes?: string;
  termsText?: string;
};

export type RespondProposalInput = {
  action: "approve" | "request_changes" | "reject";
  note?: string;
};

export function getProjectRequestStatusLabel(
  status: ProjectRequestStatus | null | undefined,
): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "needs_clarification":
      return "Needs Clarification";
    case "under_review":
      return "Under Review";
    case "quoted":
      return "Quoted";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "converted_to_project":
      return "Project Created";
    default:
      return "Unknown";
  }
}

export function getProjectRequestStatusClass(
  status: ProjectRequestStatus | null | undefined,
): string {
  switch (status) {
    case "submitted":
      return "text-sky-300 border-sky-400/30 bg-sky-400/10";
    case "under_review":
      return "text-gold-primary border-gold-primary/30 bg-gold-primary/10";
    case "needs_clarification":
      return "text-amber-300 border-amber-400/30 bg-amber-400/10";
    case "quoted":
      return "text-violet-300 border-violet-400/30 bg-violet-400/10";
    case "approved":
      return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
    case "rejected":
      return "text-red-400 border-red-500/30 bg-red-500/10";
    case "converted_to_project":
      return "text-emerald-300 border-emerald-400/40 bg-emerald-400/15";
    default:
      return "text-text-gray border-white/10 bg-white/5";
  }
}

export function getProposalStatusLabel(
  status: ProjectProposalStatus | null | undefined,
): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "changes_requested":
      return "Changes Requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "Unknown";
  }
}

export function getProposalStatusClass(
  status: ProjectProposalStatus | null | undefined,
): string {
  switch (status) {
    case "draft":
      return "text-gray-400 border-white/15 bg-white/5";
    case "sent":
      return "text-violet-300 border-violet-400/30 bg-violet-400/10";
    case "changes_requested":
      return "text-amber-300 border-amber-400/30 bg-amber-400/10";
    case "approved":
      return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
    case "rejected":
      return "text-red-400 border-red-500/30 bg-red-500/10";
    default:
      return "text-text-gray border-white/10 bg-white/5";
  }
}

export function formatProjectRequestDate(
  iso: string | null | undefined,
): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatProposalCurrency(
  cents: number,
  currency = "USD",
): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export async function listProjectRequests(params?: {
  status?: ProjectRequestStatus;
  organizationId?: string;
}): Promise<ProjectRequestSummary[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.organizationId) query.set("organizationId", params.organizationId);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const res = await fetch(`/api/agency/project-requests${suffix}`, {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to list project requests",
    );
  }
  return Array.isArray(data.requests) ? data.requests : [];
}

export async function fetchProjectRequest(
  id: string,
): Promise<ProjectRequestDetail> {
  const res = await fetch(
    `/api/agency/project-requests/${encodeURIComponent(id)}`,
    { method: "GET", cache: "no-store" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load project request",
    );
  }
  return data.request as ProjectRequestDetail;
}

export async function submitProjectRequest(
  input: SubmitProjectRequestInput,
): Promise<ProjectRequestDetail> {
  const res = await fetch("/api/agency/project-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to submit project request",
    );
  }
  return data.request as ProjectRequestDetail;
}

export async function updateProjectRequestStatus(
  id: string,
  input: UpdateProjectRequestStatusInput,
): Promise<ProjectRequestDetail> {
  const res = await fetch(
    `/api/agency/project-requests/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to update project request status",
    );
  }
  return data.request as ProjectRequestDetail;
}

export async function listProposals(
  requestId: string,
): Promise<ProjectProposal[]> {
  const res = await fetch(
    `/api/agency/project-requests/${encodeURIComponent(requestId)}/proposals`,
    { method: "GET", cache: "no-store" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to list proposals",
    );
  }
  return Array.isArray(data.proposals) ? data.proposals : [];
}

export async function createProposal(
  requestId: string,
  input: CreateProposalInput,
): Promise<ProjectProposal> {
  const res = await fetch(
    `/api/agency/project-requests/${encodeURIComponent(requestId)}/proposals`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to create proposal",
    );
  }
  return data.proposal as ProjectProposal;
}

export async function updateProposalDraft(
  requestId: string,
  proposalId: string,
  input: CreateProposalInput,
): Promise<ProjectProposal> {
  const res = await fetch(
    `/api/agency/project-requests/${encodeURIComponent(requestId)}/proposals/${encodeURIComponent(proposalId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to update proposal",
    );
  }
  return data.proposal as ProjectProposal;
}

export async function sendProposal(
  requestId: string,
  proposalId: string,
): Promise<{ proposal: ProjectProposal; request: ProjectRequestDetail }> {
  const res = await fetch(
    `/api/agency/project-requests/${encodeURIComponent(requestId)}/proposals/${encodeURIComponent(proposalId)}/send`,
    { method: "PATCH" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to send proposal",
    );
  }
  return {
    proposal: data.proposal as ProjectProposal,
    request: data.request as ProjectRequestDetail,
  };
}

export async function respondToProposal(
  requestId: string,
  proposalId: string,
  input: RespondProposalInput,
): Promise<{ proposal: ProjectProposal; request: ProjectRequestDetail }> {
  const res = await fetch(
    `/api/agency/project-requests/${encodeURIComponent(requestId)}/proposals/${encodeURIComponent(proposalId)}/respond`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to respond to proposal",
    );
  }
  return {
    proposal: data.proposal as ProjectProposal,
    request: data.request as ProjectRequestDetail,
  };
}

export async function convertProjectRequest(id: string): Promise<{
  request: ProjectRequestDetail;
  project: {
    id: string;
    title: string;
    status: string;
    clientId: string | null;
  };
}> {
  const res = await fetch(
    `/api/agency/project-requests/${encodeURIComponent(id)}/convert`,
    { method: "POST" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to convert request to project",
    );
  }
  return {
    request: data.request as ProjectRequestDetail,
    project: data.project as {
      id: string;
      title: string;
      status: string;
      clientId: string | null;
    },
  };
}

/** Admin request status actions — no direct Approve (Proposal is source of truth). */
export function getAdminStatusActions(
  status: ProjectRequestStatus,
): Array<{
  status: ProjectRequestStatus;
  label: string;
  noteRequired: boolean;
}> {
  switch (status) {
    case "submitted":
      return [
        { status: "under_review", label: "Start Review", noteRequired: false },
        {
          status: "needs_clarification",
          label: "Request Clarification",
          noteRequired: true,
        },
        { status: "rejected", label: "Reject", noteRequired: true },
      ];
    case "under_review":
      return [
        {
          status: "needs_clarification",
          label: "Request Clarification",
          noteRequired: true,
        },
        { status: "rejected", label: "Reject", noteRequired: true },
      ];
    case "needs_clarification":
      return [
        { status: "under_review", label: "Start Review", noteRequired: false },
        { status: "rejected", label: "Reject", noteRequired: true },
      ];
    case "quoted":
      return [{ status: "rejected", label: "Reject", noteRequired: true }];
    default:
      return [];
  }
}
