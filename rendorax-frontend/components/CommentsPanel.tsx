import React, { useMemo, useState } from "react";
import LiveTeamMembers, {
  type LiveTeamMember,
} from "@/components/dashboard/LiveTeamMembers";
import CommentAuthorBadge from "@/components/CommentAuthorBadge";
import CommentSceneThumbnail from "@/components/CommentSceneThumbnail";
import {
  getCommentDisplayName,
  type VideoCommentRow,
} from "@/utils/commentAuthor";
import { type DisplayCommentRow } from "@/hooks/useLiveComments";

type CommentFilter = "all" | "open" | "resolved";

interface CommentsPanelProps {
  comments: DisplayCommentRow[];
  newComment: string;
  setNewComment: (val: string) => void;
  handleAddComment: (e: React.FormEvent) => void;
  handleEditComment: (id: string, text: string) => void;
  handleDeleteComment: (id: string) => void;
  handleResolveComment?: (id: string, resolved: boolean) => void;
  handleNotifyTeam: () => void;
  isNotifying: boolean;
  notificationSent: boolean;
  jumpToTime: (time: number) => void;
  playbackUrl?: string | null;
  isLive?: boolean;
  disabled?: boolean;
  disabledPlaceholder?: string;
  liveTeamMembers?: LiveTeamMember[];
  enableTeamInvite?: boolean;
}

function formatResolvedMeta(comment: VideoCommentRow): string | null {
  if (!comment.is_resolved) return null;
  const when = comment.resolved_at
    ? new Date(comment.resolved_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  if (when) return `Resolved · ${when}`;
  return "Resolved";
}

function formatCommentClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CommentsPanel({
  comments,
  newComment,
  setNewComment,
  handleAddComment,
  handleEditComment,
  handleDeleteComment,
  handleResolveComment,
  handleNotifyTeam,
  isNotifying,
  notificationSent,
  jumpToTime,
  playbackUrl,
  isLive = false,
  disabled = false,
  disabledPlaceholder,
  liveTeamMembers = [],
  enableTeamInvite = false,
}: CommentsPanelProps) {
  const [filter, setFilter] = useState<CommentFilter>("all");

  const metrics = useMemo(() => {
    const open = comments.filter((c) => !c.is_resolved).length;
    const resolved = comments.filter((c) => Boolean(c.is_resolved)).length;
    return { open, resolved, total: comments.length };
  }, [comments]);

  const visibleComments = useMemo(() => {
    if (filter === "open") {
      return comments.filter((c) => !c.is_resolved);
    }
    if (filter === "resolved") {
      return comments.filter((c) => Boolean(c.is_resolved));
    }
    return comments;
  }, [comments, filter]);

  return (
    <aside className="z-10 flex h-full w-full shrink-0 flex-col border-l border-white/5 bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-[#121217] px-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-100">
          Review Feedback
        </h3>

        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-zinc-600"}`}
            aria-hidden
          />
          <span className="text-[10px] uppercase tracking-wider text-gray-400">
            {isLive ? "Live Sync" : "Offline"}
          </span>
        </div>
      </div>

      <LiveTeamMembers
        members={liveTeamMembers}
        isLive={isLive}
        enableInvite={enableTeamInvite}
      />

      <div className="flex shrink-0 items-center gap-3 border-b border-white/5 px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-500">
          <span>
            Open{" "}
            <span className="font-semibold text-[#d4af37]">{metrics.open}</span>
          </span>
          <span className="text-zinc-700">·</span>
          <span>
            Resolved{" "}
            <span className="font-semibold text-zinc-300">{metrics.resolved}</span>
          </span>
          <span className="text-zinc-700">·</span>
          <span>
            Total{" "}
            <span className="font-semibold text-white">{metrics.total}</span>
          </span>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="flex shrink-0 items-center gap-1 border-b border-white/5 px-4 py-1.5">
          {(
            [
              ["all", "All"],
              ["open", "Open"],
              ["resolved", "Resolved"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded px-2 py-1 text-[9px] uppercase tracking-widest transition-colors ${
                filter === key
                  ? "bg-[#d4af37]/10 text-[#d4af37]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
        {visibleComments.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs leading-relaxed text-gray-500">
            {disabled
              ? "Select a video to view or add comments"
              : filter !== "all" && comments.length > 0
                ? `No ${filter} comments.`
                : "Leave frame-accurate feedback directly on the review timeline."}
          </div>
        ) : (
          visibleComments.map((comment) => {
            const resolved = Boolean(comment.is_resolved);
            const resolvedMeta = formatResolvedMeta(comment);
            return (
              <div
                key={comment.id}
                className={`group flex items-start justify-between gap-2 rounded-md border border-white/10 bg-[#0c0c12] p-2.5 ${
                  resolved ? "opacity-60" : ""
                }`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  {!disabled && (
                    <CommentSceneThumbnail
                      playbackUrl={playbackUrl}
                      timestampSeconds={comment.time_stamp}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => jumpToTime(comment.time_stamp)}
                      className="mb-1 font-mono text-sm font-semibold text-[#d4af37] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37]"
                    >
                      {formatCommentClock(comment.time_stamp)}
                    </button>
                    <p className="text-sm leading-snug text-zinc-100">
                      {comment.display_text || comment.comment_text}
                    </p>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                      <CommentAuthorBadge
                        displayName={getCommentDisplayName(comment)}
                        avatarUrl={comment.author_avatar_url}
                      />
                      <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                        {getCommentDisplayName(comment)}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-widest ${
                          resolved
                            ? "bg-zinc-700/80 text-zinc-300"
                            : "bg-[#d4af37]/15 text-[#d4af37]"
                        }`}
                      >
                        {resolved ? "Resolved" : "Open"}
                      </span>
                      {comment.translated && (
                        <span className="text-[9px] uppercase tracking-wide text-zinc-500">
                          Translated
                        </span>
                      )}
                      {comment.translationFailed && (
                        <span className="text-[9px] uppercase tracking-wide text-zinc-500">
                          Translation unavailable
                        </span>
                      )}
                    </div>
                    {resolvedMeta && (
                      <p className="mt-1 text-[9px] uppercase tracking-wide text-zinc-500">
                        {resolvedMeta}
                      </p>
                    )}
                    {!disabled && handleResolveComment && (
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleResolveComment(comment.id, !resolved)
                          }
                          className="text-[9px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-[#d4af37]"
                        >
                          {resolved ? "Reopen" : "Resolve"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100">
                  <button
                    onClick={() =>
                      handleEditComment(comment.id, comment.comment_text)
                    }
                    className="rounded p-1 text-zinc-500 transition-colors hover:text-[#d4af37]"
                    title="Edit"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="rounded p-1 text-zinc-500 transition-colors hover:text-red-500"
                    title="Delete"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="shrink-0 border-t border-white/5 bg-[#121217] pb-24">
        <form onSubmit={handleAddComment} className="p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              disabled
                ? disabledPlaceholder ||
                  "Select a video to leave feedback..."
                : "Add frame-accurate feedback…"
            }
            rows={2}
            disabled={disabled}
            className="mb-3 w-full resize-none rounded-md border border-white/10 bg-[#050505] p-3 text-xs text-white outline-none focus:border-[#d4af37] disabled:cursor-not-allowed disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={disabled || !newComment.trim()}
            className={`min-h-[44px] w-full rounded-md py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              !disabled && newComment.trim()
                ? "bg-[#d4af37] text-black hover:bg-[#b8952b]"
                : "cursor-not-allowed bg-gray-800 text-gray-500"
            }`}
          >
            Post Feedback
          </button>
        </form>
        {comments.length > 0 && !disabled && (
          <div className="px-4 pb-4">
            <div className="rounded-lg border border-white/5 bg-[#1c1c24] p-3">
              <p className="mb-2 text-[10px] text-gray-400">
                Once you have finished adding all comments, send a single
                summary alert to the team:
              </p>
              <button
                onClick={handleNotifyTeam}
                disabled={isNotifying}
                className={`min-h-[44px] w-full rounded px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest ${notificationSent ? "bg-green-600 text-white" : "border border-[#d4af37] bg-[#121217] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"}`}
              >
                {isNotifying
                  ? "Sending..."
                  : notificationSent
                    ? "Team Notified"
                    : `Notify Team (${comments.length} Notes)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
