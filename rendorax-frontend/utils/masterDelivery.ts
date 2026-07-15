export type MasterDeliveryEventType =
  | "delivered"
  | "replaced"
  | "restored"
  | "expired";

/** Soft access window — computed from active event createdAt (no schema field). */
export const MASTER_DELIVERY_ACCESS_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MasterDeliveryActor = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
};

export type MasterDeliveryAssetSummary = {
  id: string;
  fileName: string;
  folder: string | null;
  mimeType?: string;
  createdAt?: string;
};

export type MasterDeliveryEvent = {
  id: string;
  mediaAssetId: string;
  agencyProjectId: string;
  actorId: string;
  actorRole: string;
  eventType: MasterDeliveryEventType;
  sourceReviewAssetId: string | null;
  note: string | null;
  createdAt: string;
  status?: "delivered" | "expired";
  actor: MasterDeliveryActor;
  mediaAsset: MasterDeliveryAssetSummary | null;
  sourceReviewAsset: MasterDeliveryAssetSummary | null;
};

export type MasterDeliveryHistoryResponse = {
  current: MasterDeliveryEvent | null;
  history: MasterDeliveryEvent[];
};

export type CreateMasterDeliveryEventInput = {
  mediaAssetId: string;
  eventType: MasterDeliveryEventType;
  sourceReviewAssetId?: string | null;
  note?: string;
};

export type CreateMasterDeliveryEventResponse = {
  event: MasterDeliveryEvent;
  current: MasterDeliveryEvent;
};

export function formatMasterDeliveryActor(actor: MasterDeliveryActor): string {
  const displayName = actor.displayName?.trim();
  if (displayName) return displayName;
  return actor.email;
}

export function formatMasterDeliveryTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getMasterDeliveryStatusLabel(
  event: MasterDeliveryEvent | null | undefined,
): string {
  if (!event) return "None";
  if (event.eventType === "expired" || event.status === "expired") {
    return "Expired";
  }
  return "Delivered";
}

/** Active current delivery eligible to be replaced by a new upload. */
export function hasActiveMasterDelivery(
  current: MasterDeliveryEvent | null | undefined,
): boolean {
  if (!current) return false;
  return (
    current.eventType === "delivered" ||
    current.eventType === "replaced" ||
    current.eventType === "restored"
  );
}

export function getMasterDeliveryExpiresAt(
  activeEvent: MasterDeliveryEvent | null | undefined,
): Date | null {
  if (!activeEvent || !hasActiveMasterDelivery(activeEvent)) return null;
  const start = new Date(activeEvent.createdAt).getTime();
  if (Number.isNaN(start)) return null;
  return new Date(start + MASTER_DELIVERY_ACCESS_DAYS * MS_PER_DAY);
}

export function formatMasterDeliveryDate(isoOrDate: string | Date): string {
  const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type MasterDeliveryClientAccess = {
  /** High-level UI status for the client panel. */
  status: "waiting" | "available" | "expired";
  canDownload: boolean;
  expiresAt: Date | null;
  daysRemaining: number | null;
  expiredOn: Date | null;
  blockReason: string | null;
};

/**
 * Client access: active event + createdAt+30d; expired event revokes immediately.
 */
export function resolveMasterDeliveryClientAccess(
  current: MasterDeliveryEvent | null | undefined,
  now: Date = new Date(),
): MasterDeliveryClientAccess {
  if (!current) {
    return {
      status: "waiting",
      canDownload: false,
      expiresAt: null,
      daysRemaining: null,
      expiredOn: null,
      blockReason: "No Master Delivery is available yet",
    };
  }

  if (current.eventType === "expired" || current.status === "expired") {
    const expiredOn = new Date(current.createdAt);
    return {
      status: "expired",
      canDownload: false,
      expiresAt: null,
      daysRemaining: 0,
      expiredOn: Number.isNaN(expiredOn.getTime()) ? null : expiredOn,
      blockReason:
        "This Master Delivery has expired and is no longer available to download",
    };
  }

  if (!hasActiveMasterDelivery(current)) {
    return {
      status: "waiting",
      canDownload: false,
      expiresAt: null,
      daysRemaining: null,
      expiredOn: null,
      blockReason: "No active Master Delivery is available",
    };
  }

  const expiresAt = getMasterDeliveryExpiresAt(current);
  if (!expiresAt) {
    return {
      status: "waiting",
      canDownload: false,
      expiresAt: null,
      daysRemaining: null,
      expiredOn: null,
      blockReason: "Unable to resolve delivery expiry",
    };
  }

  const msLeft = expiresAt.getTime() - now.getTime();
  if (msLeft <= 0) {
    return {
      status: "expired",
      canDownload: false,
      expiresAt,
      daysRemaining: 0,
      expiredOn: expiresAt,
      blockReason: `This Master Delivery access window ended on ${formatMasterDeliveryDate(expiresAt)}`,
    };
  }

  const daysRemaining = Math.max(1, Math.ceil(msLeft / MS_PER_DAY));

  return {
    status: "available",
    canDownload: true,
    expiresAt,
    daysRemaining,
    expiredOn: null,
    blockReason: null,
  };
}

export type MasterDeliveryDownloadResponse = {
  downloadUrl: string;
  fileName: string;
  mediaAssetId: string;
  expiresAt: string;
  deliveredAt: string;
};

export async function downloadMasterDelivery(
  mediaAssetId: string,
): Promise<MasterDeliveryDownloadResponse> {
  const query = new URLSearchParams({ mediaAssetId });
  const res = await fetch(
    `/api/agency/master-delivery/download?${query.toString()}`,
    { method: "GET", cache: "no-store" },
  );

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "Failed to download Master Delivery";
    throw new Error(message);
  }

  const downloadUrl =
    typeof payload?.downloadUrl === "string" ? payload.downloadUrl : "";
  if (!downloadUrl) {
    throw new Error("Download URL was not returned");
  }

  return payload as MasterDeliveryDownloadResponse;
}

export async function triggerMasterDeliveryDownload(
  mediaAssetId: string,
): Promise<void> {
  const result = await downloadMasterDelivery(mediaAssetId);
  const anchor = document.createElement("a");
  anchor.href = result.downloadUrl;
  anchor.rel = "noopener";
  anchor.download = result.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function fetchMasterDelivery(
  agencyProjectId: string,
): Promise<MasterDeliveryHistoryResponse> {
  const query = new URLSearchParams({ agencyProjectId });
  const res = await fetch(`/api/agency/master-delivery?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "Failed to fetch master delivery state";
    throw new Error(message);
  }

  return payload as MasterDeliveryHistoryResponse;
}

export async function createMasterDeliveryEvent(
  input: CreateMasterDeliveryEventInput,
): Promise<CreateMasterDeliveryEventResponse> {
  const res = await fetch("/api/agency/master-delivery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mediaAssetId: input.mediaAssetId,
      eventType: input.eventType,
      ...(input.sourceReviewAssetId
        ? { sourceReviewAssetId: input.sourceReviewAssetId }
        : {}),
      ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    }),
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "Failed to create master delivery event";
    throw new Error(message);
  }

  return payload as CreateMasterDeliveryEventResponse;
}
