"use client";

import React from "react";
import { getVideoExtensionLabel } from "@/utils/videoStreaming";

interface VideoThumbnailPlaceholderProps {
  fileName?: string;
  compact?: boolean;
  className?: string;
}

function PlayMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_24px_rgba(212,175,55,0.2)] backdrop-blur-sm"
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={Math.round(size * 0.38)}
        height={Math.round(size * 0.38)}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    </span>
  );
}

/** Premium static placeholder — zero video bytes loaded. */
export default function VideoThumbnailPlaceholder({
  fileName,
  compact = false,
  className = "",
}: VideoThumbnailPlaceholderProps) {
  const extLabel = fileName ? getVideoExtensionLabel(fileName) : "VIDEO";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c0c12] via-[#0a0a0f] to-[#12121a] ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.08)_0%,_transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent" />

      <div className="relative z-[1] flex flex-col items-center gap-2">
        <PlayMark size={compact ? 22 : 36} />
        {!compact && (
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-gray-500">
            {extLabel}
          </span>
        )}
      </div>

      {!compact && (
        <span className="absolute bottom-2 left-1/2 z-[1] -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-gray-400">
          Video
        </span>
      )}

      {compact && (
        <span className="absolute bottom-0.5 left-0.5 z-[1] rounded bg-black/70 px-1 py-px text-[7px] font-bold uppercase tracking-wider text-gray-500">
          {extLabel}
        </span>
      )}
    </div>
  );
}
