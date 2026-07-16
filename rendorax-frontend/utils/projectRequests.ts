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

export type ProjectRequestSummary = {
  id: string;
  title: string;
  projectType: string;
  status: ProjectRequestStatus;
  deadlineAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  organization: ProjectRequestOrganization;
  submittedBy: ProjectRequestSubmitter;
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
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
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

/** Admin action buttons mapped to allowed transitions. */
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
        { status: "approved", label: "Approve", noteRequired: false },
        { status: "rejected", label: "Reject", noteRequired: true },
      ];
    case "needs_clarification":
      return [
        { status: "under_review", label: "Start Review", noteRequired: false },
        { status: "rejected", label: "Reject", noteRequired: true },
      ];
    default:
      return [];
  }
}
