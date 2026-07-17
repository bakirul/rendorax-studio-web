"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createPictureLockEvent,
  fetchPictureLock,
  formatPictureLockActor,
  formatPictureLockTimestamp,
  shortenIntegrityHash,
  type PictureLockEvent,
  type PictureLockResponse,
} from "@/utils/pictureLock";

export type PictureLockViewerRole = "client" | "editor" | "admin";

interface PictureLockBarProps {
  mediaAssetId: string;
  viewerRole: PictureLockViewerRole;
  compact?: boolean;
}

export default function PictureLockBar({
  mediaAssetId,
  viewerRole,
  compact = false,
}: PictureLockBarProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [latest, setLatest] = useState<PictureLockEvent | null>(null);
  const [history, setHistory] = useState<PictureLockEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockNote, setUnlockNote] = useState("");

  const loadGenerationRef = useRef(0);

  const applyResponse = useCallback((payload: PictureLockResponse) => {
    setIsLocked(payload.isLocked);
    setLatest(payload.latest);
    setHistory(payload.history);
  }, []);

  const loadLockState = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchPictureLock(mediaAssetId);
      if (generation !== loadGenerationRef.current) return;
      applyResponse(payload);
    } catch (loadError) {
      if (generation !== loadGenerationRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load picture lock state",
      );
      setIsLocked(false);
      setLatest(null);
      setHistory([]);
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [applyResponse, mediaAssetId]);

  useEffect(() => {
    setHistoryOpen(false);
    setUnlockOpen(false);
    setUnlockNote("");
    setActionError(null);
    void loadLockState();

    return () => {
      loadGenerationRef.current += 1;
    };
  }, [loadLockState, mediaAssetId]);

  const handleCreate = useCallback(
    async (eventType: "locked" | "unlocked", note?: string) => {
      const generation = loadGenerationRef.current;
      setSubmitting(true);
      setActionError(null);

      try {
        await createPictureLockEvent({
          mediaAssetId,
          eventType,
          note,
        });
        if (generation !== loadGenerationRef.current) return;
        setUnlockOpen(false);
        setUnlockNote("");
        await loadLockState();
      } catch (submitError) {
        if (generation !== loadGenerationRef.current) return;
        setActionError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to update picture lock",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [loadLockState, mediaAssetId],
  );

  const canMutate = viewerRole === "client" || viewerRole === "editor";

  return (
    <div
      className={`w-full shrink-0 ${
        compact
          ? "bg-transparent px-3 py-2 sm:px-4"
          : "border-b border-[#d4af37]/15 bg-[#12121a] px-4 py-3"
      }`}
    >
      <div
        className={`flex gap-2 ${
          compact
            ? "flex-col sm:flex-row sm:items-center sm:justify-between"
            : "flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
        }`}
      >
        <div className={`min-w-0 ${compact ? "space-y-1" : "space-y-2"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Picture Lock
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                isLocked
                  ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  : "bg-white/5 text-gray-300 border-white/10"
              }`}
            >
              {loading ? "Loading…" : isLocked ? "Locked" : "Unlocked"}
            </span>
          </div>

          {!compact && !loading && latest ? (
            <div className="space-y-1 text-xs text-gray-400">
              <p>
                <span className="text-gray-500">By </span>
                <span className="text-gray-200">
                  {formatPictureLockActor(latest.actor)}
                </span>
                <span className="text-gray-500"> · </span>
                <span>{formatPictureLockTimestamp(latest.createdAt)}</span>
              </p>
              {isLocked && latest.integrityHash ? (
                <p className="font-mono text-[11px] text-gray-300">
                  <span className="text-gray-500">Hash: </span>
                  <span title={latest.integrityHash}>
                    {shortenIntegrityHash(latest.integrityHash)}
                  </span>
                </p>
              ) : null}
              {latest.note ? (
                <p className="text-gray-300">
                  <span className="text-gray-500">Note: </span>
                  {latest.note}
                </p>
              ) : null}
            </div>
          ) : null}

          {!compact && !loading && !latest && !error ? (
            <p className="text-xs text-gray-500">
              This Review Version has not been picture-locked yet.
            </p>
          ) : null}

          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          {actionError ? (
            <p className="text-xs text-red-400">{actionError}</p>
          ) : null}
        </div>

        {canMutate ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isLocked ? (
              <button
                type="button"
                disabled={submitting || loading}
                onClick={() => void handleCreate("locked")}
                className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Lock Version
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || loading}
                onClick={() => {
                  setUnlockOpen((open) => !open);
                  setActionError(null);
                }}
                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Unlock Version
              </button>
            )}
          </div>
        ) : null}
      </div>

      {canMutate && unlockOpen && isLocked ? (
        <div
          className={`rounded-lg border border-white/10 bg-black/30 p-3 ${compact ? "mt-2" : "mt-3"}`}
        >
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Unlock reason (required)
          </label>
          <textarea
            value={unlockNote}
            onChange={(event) => setUnlockNote(event.target.value)}
            rows={3}
            placeholder="Why is this version being unlocked?"
            className="w-full resize-y rounded-md border border-white/10 bg-[#121217] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]/40"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={submitting || !unlockNote.trim()}
              onClick={() =>
                void handleCreate("unlocked", unlockNote.trim())
              }
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Unlock
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setUnlockOpen(false);
                setUnlockNote("");
              }}
              className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 transition hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {!loading && history.length > 0 ? (
        <div className={`border-t border-white/5 pt-2 ${compact ? "mt-2" : "mt-3 pt-3"}`}>
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-gray-400 transition hover:text-[#d4af37]"
          >
            <span
              className={`inline-block transition-transform ${historyOpen ? "rotate-90" : ""}`}
            >
              ▸
            </span>
            Lock History ({history.length})
          </button>

          {historyOpen ? (
            <ul className="mt-2 space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-md border border-white/5 bg-black/20 px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        entry.eventType === "locked"
                          ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          : "bg-white/5 text-gray-300 border-white/10"
                      }`}
                    >
                      {entry.eventType === "locked" ? "Locked" : "Unlocked"}
                    </span>
                    <span className="text-gray-500">
                      {formatPictureLockActor(entry.actor)}
                    </span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-500">
                      {formatPictureLockTimestamp(entry.createdAt)}
                    </span>
                  </div>
                  {entry.integrityHash ? (
                    <p className="mt-1 font-mono text-[11px] text-gray-400">
                      {shortenIntegrityHash(entry.integrityHash)}
                    </p>
                  ) : null}
                  {entry.note ? (
                    <p className="mt-1 text-gray-300">{entry.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
