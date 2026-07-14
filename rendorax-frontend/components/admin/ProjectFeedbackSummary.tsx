"use client";

import { useEffect, useRef, useState } from "react";
import {
  getCommentDisplayName,
  type VideoCommentRow,
} from "@/utils/commentAuthor";
import {
  fetchProjectFeedbackSummaries,
  formatFeedbackTimecode,
  type ProjectFeedbackSummary,
} from "@/utils/projectFeedbackSummary";

interface ProjectFeedbackSummaryProps {
  projectId: string;
  onSummaryLoaded?: (summary: ProjectFeedbackSummary) => void;
}

const EMPTY: ProjectFeedbackSummary = {
  total: 0,
  open: 0,
  resolved: 0,
  latest: [],
};

function formatFeedbackDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAssetShortName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) return "Unknown asset";
  // Soft-shorten very long review filenames for the compact card line
  return trimmed.length > 42 ? `${trimmed.slice(0, 40)}…` : trimmed;
}

function LatestFeedbackRow({ comment }: { comment: VideoCommentRow }) {
  const actor = getCommentDisplayName(comment);
  const timecode = formatFeedbackTimecode(comment.time_stamp ?? 0);
  const assetName = comment.file_name?.trim() || "Unknown asset";
  const resolved = Boolean(comment.is_resolved);

  return (
    <div className="min-w-0">
      <p className="text-[11px] text-zinc-300 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <span className="text-text-white font-medium truncate max-w-[10rem]" title={actor}>
          {actor}
        </span>
        <span className="text-zinc-600">·</span>
        <span
          className={`text-[9px] uppercase tracking-widest ${
            resolved ? "text-zinc-400" : "text-gold-primary"
          }`}
        >
          {resolved ? "Resolved" : "Open"}
        </span>
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-400 flex flex-wrap items-baseline gap-x-1.5">
        <span className="truncate max-w-[16rem]" title={assetName}>
          {formatAssetShortName(assetName)}
        </span>
        <span className="text-zinc-600">·</span>
        <span className="font-mono text-gold-primary/90">{timecode}</span>
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-200 line-clamp-2">
        “{comment.comment_text}”
      </p>
      <p className="mt-0.5 text-[9px] uppercase tracking-widest text-text-gray">
        {formatFeedbackDate(comment.created_at)}
      </p>
    </div>
  );
}

export default function ProjectFeedbackSummary({
  projectId,
  onSummaryLoaded,
}: ProjectFeedbackSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProjectFeedbackSummary>(EMPTY);
  const [expanded, setExpanded] = useState(false);
  const loadGenerationRef = useRef(0);
  const onSummaryLoadedRef = useRef(onSummaryLoaded);
  onSummaryLoadedRef.current = onSummaryLoaded;

  useEffect(() => {
    const generation = ++loadGenerationRef.current;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const map = await fetchProjectFeedbackSummaries([projectId]);
        if (cancelled || generation !== loadGenerationRef.current) return;
        const next = map[projectId] ?? EMPTY;
        setSummary(next);
        onSummaryLoadedRef.current?.(next);
      } catch (err) {
        if (cancelled || generation !== loadGenerationRef.current) return;
        setSummary(EMPTY);
        onSummaryLoadedRef.current?.(EMPTY);
        setError(
          err instanceof Error ? err.message : "Failed to load feedback summary",
        );
      } finally {
        if (!cancelled && generation === loadGenerationRef.current) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const latestVisible = expanded
    ? summary.latest.slice(0, 3)
    : summary.latest.slice(0, 1);
  const canExpand = summary.latest.length > 1;

  return (
    <div className="border-t border-white/5 px-4 py-2.5 bg-black/10">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-gray">
          Feedback Summary
        </p>
        {loading && (
          <span className="text-[9px] uppercase tracking-widest text-zinc-500">
            Loading…
          </span>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-[11px] text-red-400/90">{error}</p>
      ) : (
        <>
          <p className="mt-1.5 text-[11px] text-zinc-400">
            Total{" "}
            <span className="tabular-nums text-text-white">{summary.total}</span>
            {" · "}
            Open{" "}
            <span className="tabular-nums text-gold-primary">{summary.open}</span>
            {" · "}
            Resolved{" "}
            <span className="tabular-nums text-zinc-200">{summary.resolved}</span>
          </p>

          {summary.latest.length > 0 ? (
            <div className="mt-2 space-y-2.5">
              <p className="text-[9px] uppercase tracking-widest text-text-gray">
                Latest Feedback
              </p>
              {latestVisible.map((comment) => (
                <LatestFeedbackRow key={comment.id} comment={comment} />
              ))}
              {canExpand && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-gold-primary transition-colors"
                >
                  {expanded
                    ? "Show less"
                    : `Show ${Math.min(3, summary.latest.length) - 1} more`}
                </button>
              )}
            </div>
          ) : (
            !loading && (
              <p className="mt-1.5 text-[11px] text-zinc-500 italic">
                No project-linked feedback yet.
              </p>
            )
          )}
        </>
      )}
    </div>
  );
}
