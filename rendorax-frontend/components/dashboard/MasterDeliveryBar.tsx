"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createMasterDeliveryEvent,
  fetchMasterDelivery,
  formatMasterDeliveryActor,
  formatMasterDeliveryTimestamp,
  getMasterDeliveryStatusLabel,
  type MasterDeliveryEvent,
  type MasterDeliveryHistoryResponse,
} from "@/utils/masterDelivery";

export type PendingMasterDeliveryRegister = {
  mediaAssetId: string;
  agencyProjectId: string;
  sourceReviewAssetId: string | null;
  fileName?: string;
};

interface MasterDeliveryBarProps {
  agencyProjectId: string;
  /** Opens the Master Delivery upload modal (deliver or replace). */
  onUploadRequest?: () => void;
  pendingRegister?: PendingMasterDeliveryRegister | null;
  onPendingRegisterCleared?: () => void;
  onRegistered?: () => void;
}

export default function MasterDeliveryBar({
  agencyProjectId,
  onUploadRequest,
  pendingRegister = null,
  onPendingRegisterCleared,
  onRegistered,
}: MasterDeliveryBarProps) {
  const [current, setCurrent] = useState<MasterDeliveryEvent | null>(null);
  const [history, setHistory] = useState<MasterDeliveryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const loadGenerationRef = useRef(0);

  const applyResponse = useCallback((payload: MasterDeliveryHistoryResponse) => {
    setCurrent(payload.current);
    setHistory(payload.history ?? []);
  }, []);

  const loadState = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchMasterDelivery(agencyProjectId);
      if (generation !== loadGenerationRef.current) return;
      applyResponse(payload);
    } catch (loadError) {
      if (generation !== loadGenerationRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load master delivery state",
      );
      setCurrent(null);
      setHistory([]);
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [agencyProjectId, applyResponse]);

  useEffect(() => {
    setHistoryOpen(false);
    setRetryError(null);
    void loadState();
    return () => {
      loadGenerationRef.current += 1;
    };
  }, [loadState]);

  const handleRetryRegister = useCallback(async () => {
    if (!pendingRegister) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const existing = await fetchMasterDelivery(pendingRegister.agencyProjectId);
      const eventType =
        existing.current &&
        (existing.current.eventType === "delivered" ||
          existing.current.eventType === "replaced" ||
          existing.current.eventType === "restored")
          ? "replaced"
          : "delivered";

      await createMasterDeliveryEvent({
        mediaAssetId: pendingRegister.mediaAssetId,
        eventType,
        sourceReviewAssetId: pendingRegister.sourceReviewAssetId,
      });
      onPendingRegisterCleared?.();
      await loadState();
      onRegistered?.();
    } catch (err) {
      setRetryError(
        err instanceof Error ? err.message : "Failed to register delivery event",
      );
    } finally {
      setRetrying(false);
    }
  }, [
    pendingRegister,
    loadState,
    onPendingRegisterCleared,
    onRegistered,
  ]);

  const statusLabel = getMasterDeliveryStatusLabel(current);
  const hasCurrent = Boolean(current);
  const uploadLabel = hasCurrent && statusLabel !== "Expired"
    ? "Replace Delivery"
    : "Upload Master Delivery";

  return (
    <div className="w-full border-b border-[#d4af37]/15 bg-[#121217] px-3 py-2.5 lg:px-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
            Master Delivery
          </p>
          {loading ? (
            <p className="mt-1 text-[11px] text-gray-500">Loading…</p>
          ) : error ? (
            <p className="mt-1 text-[11px] text-red-400">{error}</p>
          ) : current ? (
            <div className="mt-1 min-w-0 space-y-0.5 text-[11px]">
              <p className="truncate text-white" title={current.mediaAsset?.fileName}>
                {current.mediaAsset?.fileName ?? current.mediaAssetId}
              </p>
              <p className="text-gray-400">
                Status:{" "}
                <span
                  className={
                    statusLabel === "Expired"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                >
                  {statusLabel}
                </span>
                {" · "}
                {formatMasterDeliveryActor(current.actor)}
                {" · "}
                {formatMasterDeliveryTimestamp(current.createdAt)}
              </p>
              {current.sourceReviewAsset ? (
                <p className="truncate text-gray-500" title={current.sourceReviewAsset.fileName}>
                  Source Review: {current.sourceReviewAsset.fileName}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-gray-500">
              No Master Delivery registered yet.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {history.length > 0 ? (
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#d4af37] transition-colors"
            >
              {historyOpen ? "Hide history" : `History (${history.length})`}
            </button>
          ) : null}
          {onUploadRequest ? (
            <button
              type="button"
              onClick={onUploadRequest}
              className="text-[9px] uppercase tracking-widest border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37] px-2.5 py-1 hover:bg-[#d4af37] hover:text-black transition-colors"
            >
              {uploadLabel}
            </button>
          ) : null}
        </div>
      </div>

      {pendingRegister ? (
        <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
          <p className="text-[11px] text-amber-100">
            Uploaded file is saved under Master Delivery but the delivery event
            was not registered
            {pendingRegister.fileName ? ` (${pendingRegister.fileName})` : ""}.
          </p>
          <button
            type="button"
            disabled={retrying}
            onClick={() => void handleRetryRegister()}
            className="mt-1.5 text-[9px] uppercase tracking-widest text-amber-200 hover:text-white disabled:opacity-50"
          >
            {retrying ? "Retrying…" : "Retry Register Delivery"}
          </button>
          {retryError ? (
            <p className="mt-1 text-[10px] text-red-300">{retryError}</p>
          ) : null}
        </div>
      ) : null}

      {historyOpen && history.length > 0 ? (
        <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto border-t border-white/5 pt-2">
          {history.map((event) => (
            <li key={event.id} className="text-[10px] text-gray-400 leading-snug">
              <span className="text-[#d4af37]/90 uppercase tracking-wide">
                {event.eventType}
              </span>
              {" · "}
              <span className="text-gray-300 truncate inline-block max-w-[12rem] align-bottom" title={event.mediaAsset?.fileName}>
                {event.mediaAsset?.fileName ?? event.mediaAssetId}
              </span>
              {" · "}
              {formatMasterDeliveryActor(event.actor)}
              {" · "}
              {formatMasterDeliveryTimestamp(event.createdAt)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
