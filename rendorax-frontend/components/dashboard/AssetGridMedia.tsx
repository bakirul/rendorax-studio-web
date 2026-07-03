"use client";

import React, { useEffect, useState } from "react";
import VideoThumbnailPlaceholder from "@/components/dashboard/VideoThumbnailPlaceholder";
import { sanitizeAbsoluteMediaUrl } from "@/utils/mediaAssets";
import {
  getMediaCategoryGridIcon,
  getMediaFileCategory,
} from "@/utils/mediaFileCategory";

export interface AssetGridMediaProps {
  /** Static poster frame (.jpg / .webp) from backend. */
  thumbnailUrl?: string | null;
  /** CDN / vault playback URL — used as a muted metadata poster when no image exists. */
  playbackUrl?: string | null;
  alt: string;
  isVideo?: boolean;
  fileName?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Gallery media cell: static <img> poster, muted <video> metadata frame (videos only), or type icon.
 * Playback only starts in StreamingVideoPlayer on explicit Play.
 */
export default function AssetGridMedia({
  thumbnailUrl,
  playbackUrl,
  alt,
  isVideo = false,
  fileName,
  compact = false,
  className = "",
}: AssetGridMediaProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedThumb = thumbnailUrl?.trim()
    ? sanitizeAbsoluteMediaUrl(thumbnailUrl.trim())
    : undefined;
  const resolvedPlayback = playbackUrl?.trim()
    ? sanitizeAbsoluteMediaUrl(playbackUrl.trim())
    : undefined;

  const category = fileName
    ? getMediaFileCategory(fileName)
    : isVideo
      ? "video"
      : "unknown";

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedThumb, resolvedPlayback]);

  const showImage = Boolean(resolvedThumb) && !imageFailed;

  if (showImage) {
    return (
      <img
        src={resolvedThumb}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`h-full w-full object-cover ${className}`.trim()}
        onError={() => setImageFailed(true)}
      />
    );
  }

  if (category === "image" && resolvedPlayback) {
    return (
      <img
        src={resolvedPlayback}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`h-full w-full object-cover ${className}`.trim()}
        onError={() => setImageFailed(true)}
      />
    );
  }

  if (category === "video" && resolvedPlayback) {
    return (
      <video
        ref={(node) => {
          if (!node) return;
          try {
            node.currentTime = 0.1;
          } catch {
            // Ignore browsers that block early seeking.
          }
        }}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          try {
            video.currentTime = 0.1;
          } catch {
            // Ignore.
          }
        }}
        onSeeked={(event) => {
          event.currentTarget.pause();
        }}
        src={`${resolvedPlayback}#t=0.1`}
        className={`pointer-events-none h-full w-full object-cover ${className}`.trim()}
        preload="metadata"
        muted
        playsInline
        crossOrigin="anonymous"
        aria-label={alt}
      />
    );
  }

  if (category === "video") {
    return (
      <VideoThumbnailPlaceholder
        fileName={fileName}
        compact={compact}
        className={className}
      />
    );
  }

  if (category === "audio" || category === "document") {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#0a0a0f] ${className}`}
        aria-label={alt}
      >
        <span
          className={compact ? "text-xl opacity-70" : "text-3xl opacity-70"}
          aria-hidden="true"
        >
          {getMediaCategoryGridIcon(category)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[#0a0a0f] text-[10px] font-semibold uppercase tracking-widest text-gray-500 ${className}`}
    >
      File
    </div>
  );
}
