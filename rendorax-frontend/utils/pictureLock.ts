export type PictureLockEventType = "locked" | "unlocked";

export type PictureLockActor = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
};

export type PictureLockEvent = {
  id: string;
  mediaAssetId: string;
  agencyProjectId: string;
  actorId: string;
  actorRole: string;
  eventType: PictureLockEventType;
  integrityHash: string | null;
  objectKey: string | null;
  note: string | null;
  createdAt: string;
  actor: PictureLockActor;
};

export type PictureLockResponse = {
  isLocked: boolean;
  latest: PictureLockEvent | null;
  history: PictureLockEvent[];
};

export type CreatePictureLockEventInput = {
  mediaAssetId: string;
  eventType: PictureLockEventType;
  note?: string;
};

export type CreatePictureLockEventResponse = {
  isLocked: boolean;
  event: PictureLockEvent;
};

export function formatPictureLockActor(actor: PictureLockActor): string {
  const displayName = actor.displayName?.trim();
  if (displayName) return displayName;
  return actor.email;
}

export function formatPictureLockTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function shortenIntegrityHash(hash: string | null | undefined): string {
  if (!hash) return "—";
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export async function fetchPictureLock(
  mediaAssetId: string,
): Promise<PictureLockResponse> {
  const query = new URLSearchParams({ mediaAssetId });
  const res = await fetch(`/api/agency/picture-lock?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "Failed to fetch picture lock state";
    throw new Error(message);
  }

  return payload as PictureLockResponse;
}

export async function createPictureLockEvent(
  input: CreatePictureLockEventInput,
): Promise<CreatePictureLockEventResponse> {
  const res = await fetch("/api/agency/picture-lock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "Failed to create picture lock event";
    throw new Error(message);
  }

  return payload as CreatePictureLockEventResponse;
}
