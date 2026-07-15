"use client";

import { useEffect, useRef, useState } from "react";
import CommentsPanel from "@/components/CommentsPanel";
import MediaPreviewPanel from "@/components/dashboard/MediaPreviewPanel";
import StreamingVideoPlayer from "@/components/dashboard/StreamingVideoPlayer";
import { useLiveComments } from "@/hooks/useLiveComments";
import { createClient } from "@/utils/supabase/client";
import { buildPreviewPlayerKey } from "@/utils/previewAssetKey";
import { sanitizeAbsoluteMediaUrl } from "@/utils/mediaAssets";

export type AdminReviewPreviewFile = {
  name: string;
  url: string;
  publicUrl: string;
  isVideo: boolean;
  assetId?: string;
  agencyProjectId?: string | null;
};

interface AdminReviewViewerProps {
  previewFile: AdminReviewPreviewFile;
  classificationLabel?: string | null;
  projectTitle?: string | null;
  onClose: () => void;
}

/**
 * Embedded Admin Review Viewer: reuses MediaPreviewPanel + StreamingVideoPlayer
 * and CommentsPanel via useLiveComments (media_asset_id first).
 */
export default function AdminReviewViewer({
  previewFile,
  classificationLabel,
  projectTitle,
  onClose,
}: AdminReviewViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const {
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
    isLive,
  } = useLiveComments(user, previewFile, videoRef, null);

  const playbackUrl = sanitizeAbsoluteMediaUrl(
    (previewFile.publicUrl ?? previewFile.url ?? "").trim(),
  );

  const showComments = Boolean(previewFile.isVideo);

  return (
    <section
      id="admin-review-viewer"
      className="mt-6 border border-gold-primary/20 bg-bg-panel overflow-hidden"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-primary">
            Admin Review Viewer
          </p>
          <p
            className="mt-1 text-sm text-text-white font-mono truncate max-w-[min(100%,36rem)]"
            title={previewFile.name}
          >
            {previewFile.name}
          </p>
          <p className="mt-1 text-[10px] text-text-gray uppercase tracking-wider truncate">
            {[classificationLabel, projectTitle].filter(Boolean).join(" · ") ||
              "Asset preview"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-text-gray hover:text-white hover:border-white/30 transition-colors"
        >
          Close Viewer
        </button>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[420px] max-h-[min(75vh,820px)]">
        <div className="flex-1 min-w-0 min-h-[280px] lg:min-h-0 bg-black flex flex-col">
          <div className="flex-1 min-h-0 p-2 lg:p-3">
            <MediaPreviewPanel
              fileName={previewFile.name}
              previewPlaybackUrl={playbackUrl}
              imageClassName="max-h-full w-full object-contain m-auto"
              videoPreview={
                <StreamingVideoPlayer
                  key={buildPreviewPlayerKey({
                    ...previewFile,
                    isCdn: true,
                  })}
                  playbackKey={buildPreviewPlayerKey({
                    ...previewFile,
                    isCdn: true,
                  })}
                  ref={videoRef}
                  src={playbackUrl}
                  autoPlay
                  controls
                  className="w-full h-full max-h-full outline-none"
                  videoClassName="object-contain max-h-full"
                />
              }
            />
          </div>
        </div>

        {showComments ? (
          <div className="w-full lg:w-[380px] xl:w-[400px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 h-[360px] lg:h-auto lg:min-h-0 flex flex-col bg-[#0a0a0f]">
            <CommentsPanel
              comments={comments}
              newComment={newComment}
              setNewComment={setNewComment}
              handleAddComment={handleAddComment}
              handleEditComment={handleEditComment}
              handleDeleteComment={handleDeleteComment}
              handleResolveComment={handleResolveComment}
              handleNotifyTeam={handleNotifyTeam}
              isNotifying={isNotifying}
              notificationSent={notificationSent}
              jumpToTime={jumpToTime}
              playbackUrl={playbackUrl}
              isLive={isLive}
              disabled={!user || !previewFile.isVideo}
            />
          </div>
        ) : (
          <div className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 p-6 bg-bg-body">
            <p className="text-[10px] uppercase tracking-widest text-text-gray">
              Comments
            </p>
            <p className="mt-2 text-xs text-text-gray/70 italic">
              Timestamped review comments are available for video assets.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
