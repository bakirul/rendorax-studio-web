import React from "react";
import CommentSceneThumbnail from "@/components/CommentSceneThumbnail";

interface CommentsPanelProps {
  comments: any[];
  newComment: string;
  setNewComment: (val: string) => void;
  handleAddComment: (e: React.FormEvent) => void;
  handleEditComment: (id: string, text: string) => void;
  handleDeleteComment: (id: string) => void;
  handleNotifyTeam: () => void;
  isNotifying: boolean;
  notificationSent: boolean;
  jumpToTime: (time: number) => void;
  playbackUrl?: string | null;
  isLive?: boolean;
  disabled?: boolean;
}

export default function CommentsPanel({
  comments,
  newComment,
  setNewComment,
  handleAddComment,
  handleEditComment,
  handleDeleteComment,
  handleNotifyTeam,
  isNotifying,
  notificationSent,
  jumpToTime,
  playbackUrl,
  isLive = false,
  disabled = false,
}: CommentsPanelProps) {
  return (
    <aside className="w-full bg-[#121217] flex flex-col h-full border-l border-white/5 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10">
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0 bg-[#121217]">
        <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-widest">
          Comments
        </h3>

        {/* Real-time Status Indicator */}
        <div className="flex items-center space-x-2">
          <div
            className={`h-2 w-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
          ></div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            {isLive ? "Live Sync" : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
            {disabled
              ? "Select a video to view or add comments"
              : "No feedback yet."}
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="group my-2 flex items-start justify-between gap-2 rounded border border-zinc-800/50 bg-zinc-900/60 p-2"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                {!disabled && (
                  <CommentSceneThumbnail
                    playbackUrl={playbackUrl}
                    timestampSeconds={comment.time_stamp}
                  />
                )}
                <div className="min-w-0 text-sm">
                <button
                  onClick={() => jumpToTime(comment.time_stamp)}
                  className="text-[#d4af37] font-mono mr-2 hover:underline focus:outline-none"
                >
                  {Math.floor(comment.time_stamp / 60)}:
                  {("0" + Math.floor(comment.time_stamp % 60)).slice(-2)}
                </button>
                <span className="text-zinc-200">{comment.comment_text}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={() =>
                    handleEditComment(comment.id, comment.comment_text)
                  }
                  className="text-zinc-500 hover:text-[#d4af37] p-1 rounded transition-colors"
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
                  className="text-zinc-500 hover:text-red-500 p-1 rounded transition-colors"
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
          ))
        )}
      </div>

      <div className="shrink-0 bg-[#121217] border-t border-white/5 pb-24">
        <form onSubmit={handleAddComment} className="p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              disabled
                ? "Select a video to leave a comment..."
                : "Leave a comment..."
            }
            rows={2}
            disabled={disabled}
            className="w-full bg-[#050505] border border-white/10 rounded-md p-3 text-xs text-white outline-none focus:border-[#d4af37] resize-none mb-3 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={disabled || !newComment.trim()}
            className={`w-full py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${
              !disabled && newComment.trim()
                ? "bg-[#d4af37] hover:bg-[#b8952b] text-black"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            Post Comment
          </button>
        </form>
        {comments.length > 0 && !disabled && (
          <div className="px-4 pb-4">
            <div className="p-3 border border-white/5 bg-[#1c1c24] rounded-lg">
              <p className="text-[10px] text-gray-400 mb-2">
                Once you have finished adding all comments, send a single
                summary alert to the team:
              </p>
              <button
                onClick={handleNotifyTeam}
                disabled={isNotifying}
                className={`w-full py-2.5 px-4 rounded text-[10px] font-bold uppercase tracking-widest ${notificationSent ? "bg-green-600 text-white" : "bg-[#121217] border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"}`}
              >
                {isNotifying
                  ? "Sending..."
                  : notificationSent
                    ? "✓ Team Notified!"
                    : `Notify Team (${comments.length} Notes)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
