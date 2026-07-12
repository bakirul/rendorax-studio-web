"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  copyShareLink,
  downloadFromUrl,
  downloadR2Asset,
} from "@/utils/assetDownload";
import {
  generateSubtitlesForPlayer,
  downloadSrtFile,
} from "@/utils/srtTranscription";
import { isTranscribableMedia } from "@/utils/mediaTypes";
import { showToast } from "@/store/useToastStore";
import { useGlobalStore } from "@/store/useGlobalStore";
import { useDashboardStore, type GallerySelectableAsset } from "@/store/useDashboardStore";
import SubtitleLanguageModal from "@/components/modals/SubtitleLanguageModal";
import { getSelectableAssetPreviewKey } from "@/utils/previewAssetKey";

interface AssetContextMenuProps {
  asset: GallerySelectableAsset;
  shareUrl: string;
  isEditor?: boolean;
  className?: string;
  onRename?: () => void;
  onDelete?: () => void;
}

export default function AssetContextMenu({
  asset,
  shareUrl,
  isEditor = false,
  className = "",
  onRename,
  onDelete,
}: AssetContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [subtitleModalOpen, setSubtitleModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedLanguage = useGlobalStore((state) => state.selectedLanguage);
  const addPreviewSubtitleTrack = useDashboardStore(
    (state) => state.addPreviewSubtitleTrack,
  );
  const previewFile = useDashboardStore((state) => state.previewFile);

  const canGenerateSubtitles = isTranscribableMedia(
    asset.fileName,
    asset.mimeType,
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleDownload = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen(false);
    try {
      if (asset.source === "cloud") {
        await downloadR2Asset(asset.objectKey ?? asset.id, asset.fileName);
      } else if (asset.vaultDownloadUrl) {
        await downloadFromUrl(asset.vaultDownloadUrl, asset.fileName);
      }
      showToast("Download started");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Download failed",
        "error",
      );
    }
  };

  const handleShare = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen(false);
    await copyShareLink(shareUrl);
  };

  const handleGenerateSubtitles = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen(false);
    setSubtitleModalOpen(true);
  };

  const handleConfirmSubtitleLanguage = async (languageCode: string) => {
    setIsTranscribing(true);
    showToast("Initializing transcription engine...");

    try {
      const result = await generateSubtitlesForPlayer(asset, languageCode);
      addPreviewSubtitleTrack(result.assetKey, result.track);
      downloadSrtFile(result.srt, asset.fileName);

      const assetKey = getSelectableAssetPreviewKey(asset);
      const isActivePreview =
        previewFile &&
        (previewFile.previewKey === assetKey ||
          previewFile.assetId === assetKey ||
          previewFile.name === assetKey ||
          previewFile.name === asset.fileName);

      showToast(
        isActivePreview
          ? `${result.label} captions added to player`
          : `${result.label} subtitles ready — preview this file to use CC`,
      );
      setSubtitleModalOpen(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Subtitle generation failed",
        "error",
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <>
      <div ref={menuRef} className={`relative ${className}`} data-no-marquee>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        disabled={isTranscribing}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/70 text-gray-300 transition-colors hover:border-[#d4af37]/40 hover:text-[#d4af37] disabled:cursor-wait disabled:opacity-60"
        aria-label="Asset actions"
      >
        {isTranscribing ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[180px] overflow-hidden rounded-md border border-white/10 bg-[#121217] py-1 shadow-2xl">
          {onRename && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onRename();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-gray-200 transition-colors hover:bg-white/5 hover:text-[#d4af37]"
            >
              Rename
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-gray-200 transition-colors hover:bg-white/5 hover:text-[#d4af37]"
          >
            Download
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-gray-200 transition-colors hover:bg-white/5 hover:text-[#d4af37]"
          >
            Copy Link
          </button>
          {isEditor && canGenerateSubtitles && (
            <button
              type="button"
              disabled={isTranscribing}
              onClick={handleGenerateSubtitles}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-gray-200 transition-colors hover:bg-white/5 hover:text-[#d4af37] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTranscribing ? "Generating…" : "Generate Subtitles (CC)"}
            </button>
          )}
        </div>
      )}
      </div>

      <SubtitleLanguageModal
        isOpen={subtitleModalOpen}
        fileName={asset.fileName}
        defaultLanguage={selectedLanguage}
        isSubmitting={isTranscribing}
        onClose={() => {
          if (!isTranscribing) setSubtitleModalOpen(false);
        }}
        onConfirm={handleConfirmSubtitleLanguage}
      />
    </>
  );
}
