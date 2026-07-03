"use client";

import React, { useMemo, useState } from "react";
import { sanitizeAbsoluteMediaUrl } from "@/utils/mediaAssets";
import { isHlsPlaybackUrl } from "@/utils/videoStreaming";

interface CommentSceneThumbnailProps {
  playbackUrl?: string | null;
  timestampSeconds: number;
}

function buildSceneThumbnailSrc(
  playbackUrl: string,
  timestampSeconds: number,
): string | null {
  const clean = sanitizeAbsoluteMediaUrl(playbackUrl.trim());
  if (!clean || isHlsPlaybackUrl(clean)) return null;

  const seconds = Math.max(0, timestampSeconds);
  const withoutHash = clean.split("#")[0];
  return `${withoutHash}#t=${seconds.toFixed(2)}`;
}

function ThumbnailPlaceholder() {
  return (
    <div
      aria-hidden
      className="flex h-9 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-[#0a0a0f]"
    >
      <svg
        className="h-3.5 w-3.5 text-[#d4af37]/35"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <rect x="3" y="5" width="18" height="14" rx="1.5" />
        <path d="M10 9.5v5l4.5-2.5L10 9.5z" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function CommentSceneThumbnail({
  playbackUrl,
  timestampSeconds,
}: CommentSceneThumbnailProps) {
  const [failed, setFailed] = useState(false);

  const src = useMemo(() => {
    if (!playbackUrl?.trim()) return null;
    return buildSceneThumbnailSrc(playbackUrl, timestampSeconds);
  }, [playbackUrl, timestampSeconds]);

  if (!src || failed) {
    return <ThumbnailPlaceholder />;
  }

  return (
    <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded border border-white/10 bg-black shadow-inner">
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        className="pointer-events-none h-full w-full object-cover"
        onError={() => setFailed(true)}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          try {
            if (Number.isFinite(timestampSeconds) && timestampSeconds > 0) {
              video.currentTime = timestampSeconds;
            }
          } catch {
            setFailed(true);
          }
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
      />
    </div>
  );
}
