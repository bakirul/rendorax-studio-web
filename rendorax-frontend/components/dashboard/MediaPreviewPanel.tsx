"use client";

import React from "react";
import {
  getDocumentPreviewSrc,
  getMediaFileCategory,
} from "@/utils/mediaFileCategory";

interface MediaPreviewPanelProps {
  fileName: string;
  previewPlaybackUrl: string;
  /** Pre-built video preview tree — StreamingVideoPlayer block passed unchanged from parent. */
  videoPreview: React.ReactNode;
  imageClassName?: string;
}

export default function MediaPreviewPanel({
  fileName,
  previewPlaybackUrl,
  videoPreview,
  imageClassName = "max-h-full w-full object-contain bg-black rounded-lg border border-white/5",
}: MediaPreviewPanelProps) {
  const category = getMediaFileCategory(fileName);

  if (category === "video") {
    return <>{videoPreview}</>;
  }

  if (category === "audio") {
    return (
      <div className="flex h-full w-full min-h-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border border-white/5 bg-[#0a0a0f] p-8">
        <span className="text-5xl opacity-50" aria-hidden="true">
          🎵
        </span>
        <p className="max-w-md truncate text-sm text-gray-400">{fileName}</p>
        <audio
          controls
          src={previewPlaybackUrl}
          className="w-full max-w-md"
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  if (category === "document") {
    const docSrc = getDocumentPreviewSrc(previewPlaybackUrl, fileName);
    if (docSrc) {
      return (
        <iframe
          src={docSrc}
          title={fileName}
          className="h-full w-full rounded-lg border border-white/10 bg-white"
        />
      );
    }
  }

  if (category === "image") {
    return (
      <div className="flex h-full w-full min-h-0 items-center justify-center">
        <img src={previewPlaybackUrl} alt={fileName} className={imageClassName} />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/10 bg-[#0a0a0f] p-8 text-center">
      <span className="text-4xl opacity-40" aria-hidden="true">
        📁
      </span>
      <p className="text-sm font-medium text-gray-400">
        Preview not available for this file type.
      </p>
      <p className="max-w-md truncate text-xs text-gray-600">{fileName}</p>
    </div>
  );
}
