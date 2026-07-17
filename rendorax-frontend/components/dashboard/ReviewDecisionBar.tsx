"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createReviewDecision,
  fetchReviewDecisions,
  formatReviewDecisionActor,
  formatReviewDecisionTimestamp,
  getReviewDecisionStatusLabel,
  type ReviewDecision,
  type ReviewDecisionStatus,
  type ReviewDecisionsResponse,
} from "@/utils/reviewDecisions";

export type ReviewDecisionViewerRole = "client" | "editor" | "admin";

interface ReviewDecisionBarProps {
  mediaAssetId: string;
  viewerRole: ReviewDecisionViewerRole;
  /** When viewerRole is client, gates Approve / Revision from org membership. */
  clientCanApprove?: boolean;
  clientCanRequestRevision?: boolean;
  /** Tighter strip layout for review workspace composition. */
  compact?: boolean;
}

function statusBadgeClass(status: ReviewDecisionStatus | null | undefined): string {
  switch (status) {
    case "approved":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "revision_requested":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "submitted_for_review":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "admin_override":
      return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    default:
      return "bg-white/5 text-gray-300 border-white/10";
  }
}

export default function ReviewDecisionBar({
  mediaAssetId,
  viewerRole,
  clientCanApprove = true,
  clientCanRequestRevision = true,
  compact = false,
}: ReviewDecisionBarProps) {
  const [latest, setLatest] = useState<ReviewDecision | null>(null);
  const [history, setHistory] = useState<ReviewDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [noteRecommendation, setNoteRecommendation] = useState<string | null>(
    null,
  );

  const loadGenerationRef = useRef(0);

  const applyResponse = useCallback((payload: ReviewDecisionsResponse) => {
    setLatest(payload.latest);
    setHistory(payload.history);
  }, []);

  const loadDecisions = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchReviewDecisions(mediaAssetId);
      if (generation !== loadGenerationRef.current) return;
      applyResponse(payload);
    } catch (loadError) {
      if (generation !== loadGenerationRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load review decisions",
      );
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
    setRevisionOpen(false);
    setRevisionNote("");
    setActionError(null);
    setNoteRecommendation(null);
    void loadDecisions();

    return () => {
      loadGenerationRef.current += 1;
    };
  }, [loadDecisions, mediaAssetId]);

  const handleCreate = useCallback(
    async (status: ReviewDecisionStatus, note?: string) => {
      const generation = loadGenerationRef.current;
      setSubmitting(true);
      setActionError(null);
      setNoteRecommendation(null);

      try {
        const response = await createReviewDecision({
          mediaAssetId,
          status,
          note,
        });
        if (generation !== loadGenerationRef.current) return;

        if (response.noteRecommendation) {
          setNoteRecommendation(response.noteRecommendation);
        }
        setRevisionOpen(false);
        setRevisionNote("");
        await loadDecisions();
      } catch (submitError) {
        if (generation !== loadGenerationRef.current) return;
        setActionError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to submit review decision",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [loadDecisions, mediaAssetId],
  );

  const editorAction = useMemo(() => {
    if (viewerRole !== "editor") return null;

    const status = latest?.status;
    if (status === "submitted_for_review") {
      return {
        label: "Awaiting Client Decision",
        disabled: true,
        onClick: undefined,
      };
    }

    if (status === "revision_requested" || status === "admin_override") {
      return {
        label: "Resubmit for Review",
        disabled: false,
        onClick: () => void handleCreate("submitted_for_review"),
      };
    }

    if (status === "approved") {
      return null;
    }

    return {
      label: "Submit for Review",
      disabled: false,
      onClick: () => void handleCreate("submitted_for_review"),
    };
  }, [handleCreate, latest?.status, viewerRole]);

  const statusLabel = getReviewDecisionStatusLabel(latest?.status);

  return (
    <div
      className={`w-full shrink-0 ${
        compact
          ? "bg-transparent px-3 py-2 sm:px-4"
          : "border-b border-[#d4af37]/15 bg-[#14141c] px-4 py-3"
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
              Review Decision
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(latest?.status)}`}
            >
              {loading ? "Loading…" : statusLabel}
            </span>
          </div>

          {!compact && !loading && latest && (
            <div className="space-y-1 text-xs text-gray-400">
              <p>
                <span className="text-gray-500">By </span>
                <span className="text-gray-200">
                  {formatReviewDecisionActor(latest.actor)}
                </span>
                <span className="text-gray-500"> · </span>
                <span>{formatReviewDecisionTimestamp(latest.createdAt)}</span>
              </p>
              {latest.note ? (
                <p className="text-gray-300">
                  <span className="text-gray-500">Note: </span>
                  {latest.note}
                </p>
              ) : null}
            </div>
          )}

          {!compact && !loading && !latest && !error ? (
            <p className="text-xs text-gray-500">
              No review decision recorded yet for this version.
            </p>
          ) : null}

          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : null}
          {actionError ? (
            <p className="text-xs text-red-400">{actionError}</p>
          ) : null}
          {noteRecommendation ? (
            <p className="text-xs text-amber-300/90">{noteRecommendation}</p>
          ) : null}
        </div>

        {viewerRole === "client" &&
        (clientCanApprove || clientCanRequestRevision) ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {clientCanApprove ? (
              <button
                type="button"
                disabled={submitting || loading}
                onClick={() => void handleCreate("approved")}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Approve Version
              </button>
            ) : null}
            {clientCanRequestRevision ? (
              <button
                type="button"
                disabled={submitting || loading}
                onClick={() => {
                  setRevisionOpen((open) => !open);
                  setActionError(null);
                }}
                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Request Revision
              </button>
            ) : null}
          </div>
        ) : null}

        {viewerRole === "client" &&
        !clientCanApprove &&
        !clientCanRequestRevision ? (
          <p className="text-[11px] text-gray-500 shrink-0">
            View-only — your role cannot submit review decisions.
          </p>
        ) : null}

        {editorAction ? (
          <div className="shrink-0">
            <button
              type="button"
              disabled={submitting || loading || editorAction.disabled}
              onClick={editorAction.onClick}
              className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-sky-200 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editorAction.label}
            </button>
          </div>
        ) : null}
      </div>

      {viewerRole === "client" &&
      clientCanRequestRevision &&
      revisionOpen ? (
        <div
          className={`rounded-lg border border-white/10 bg-black/30 p-3 ${compact ? "mt-2" : "mt-3"}`}
        >
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Revision note
          </label>
          <textarea
            value={revisionNote}
            onChange={(event) => setRevisionNote(event.target.value)}
            rows={3}
            placeholder="Describe what should change in this review version."
            className="w-full resize-y rounded-md border border-white/10 bg-[#121217] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]/40"
          />
          <p className="mt-2 text-[11px] text-gray-500">
            A note is recommended so the editor understands what to revise.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                void handleCreate(
                  "revision_requested",
                  revisionNote.trim() || undefined,
                )
              }
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Revision Request
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setRevisionOpen(false);
                setRevisionNote("");
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
            Decision History ({history.length})
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
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(entry.status)}`}
                    >
                      {getReviewDecisionStatusLabel(entry.status)}
                    </span>
                    <span className="text-gray-500">
                      {formatReviewDecisionActor(entry.actor)}
                    </span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-500">
                      {formatReviewDecisionTimestamp(entry.createdAt)}
                    </span>
                  </div>
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
