"use client";

import React from "react";
import type { MediaDisplayStatus } from "@/utils/mediaUploadStatus";

interface AssetProcessingBadgeProps {
  status: MediaDisplayStatus;
  compact?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<MediaDisplayStatus["tone"], string> = {
  neutral: "border-white/20 bg-black/70 text-gray-200",
  active: "border-[#d4af37]/40 bg-black/75 text-[#d4af37]",
  success: "border-emerald-500/40 bg-emerald-950/80 text-emerald-300",
  error: "border-red-500/40 bg-red-950/80 text-red-300",
};

export default function AssetProcessingBadge({
  status,
  compact = false,
  className = "",
}: AssetProcessingBadgeProps) {
  return (
    <div
      className={`pointer-events-none flex items-center gap-1.5 rounded border font-bold uppercase tracking-widest backdrop-blur-sm ${TONE_CLASSES[status.tone]} ${
        compact
          ? "px-1.5 py-0.5 text-[8px]"
          : "px-2 py-0.5 text-[9px]"
      } ${className}`}
      title={status.label}
    >
      {status.tone === "active" && !status.isTerminal && (
        <span
          className={`inline-block shrink-0 animate-spin rounded-full border border-current border-t-transparent ${
            compact ? "h-2 w-2" : "h-2.5 w-2.5"
          }`}
          aria-hidden
        />
      )}
      <span className="truncate">{status.label}</span>
      {status.showProgress && status.progress != null && (
        <span className="tabular-nums opacity-80">{status.progress}%</span>
      )}
    </div>
  );
}
