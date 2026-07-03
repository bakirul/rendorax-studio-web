"use client";
import React, { useCallback, useEffect, useMemo } from "react";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import {
  getMediaPlaybackUrl,
  isMediaAssetProcessing,
  resolveGalleryThumbnail,
  isMediaAssetVideo,
} from "@/utils/mediaAssets";
import { resolveAssetDisplayStatus } from "@/utils/mediaUploadStatus";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { GallerySelectableAsset } from "@/store/useDashboardStore";
import { useGalleryViewStyles } from "@/hooks/useGalleryViewStyles";
import AssetContextMenu from "@/components/dashboard/AssetContextMenu";
import AssetGridMedia from "@/components/dashboard/AssetGridMedia";
import AssetProcessingBadge from "@/components/dashboard/AssetProcessingBadge";
import GallerySelectCheckbox from "@/components/dashboard/GallerySelectCheckbox";
import GallerySelectAllToggle from "@/components/dashboard/GallerySelectAllToggle";
import GalleryMarqueeContainer from "@/components/dashboard/GalleryMarqueeContainer";

interface CloudAssetGalleryProps {
  assets: MediaAssetRecord[];
  loading?: boolean;
  searchQuery?: string;
  onPreviewAsset?: (asset: MediaAssetRecord) => void;
  onDeleteAsset?: (asset: MediaAssetRecord) => void;
  onRenameAsset?: (asset: MediaAssetRecord) => void;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export default function CloudAssetGallery({
  assets,
  loading = false,
  searchQuery = "",
  onPreviewAsset,
  onDeleteAsset,
  onRenameAsset,
}: CloudAssetGalleryProps) {
  const {
    previewFile,
    selectGalleryRange,
    toggleGalleryAssetSelection,
    setGallerySelectionAnchorId,
    setPreviewFile,
  } = useDashboardStore();
  const {
    aspectClass,
    objectFitClass,
    containerClass,
    gridStyle,
    showCardInfo,
    viewMode,
  } = useGalleryViewStyles();

  const toSelectableAsset = useCallback(
    (asset: MediaAssetRecord): GallerySelectableAsset => ({
      id: asset.id,
      source: "cloud",
      fileName: asset.fileName,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType,
      objectKey: asset.objectKey ?? undefined,
      publicUrl: getMediaPlaybackUrl(asset),
      previewKey: asset.id,
    }),
    [],
  );

  const filtered = assets.filter((asset) =>
    asset.fileName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const visibleSelectableAssets = useMemo(
    () => filtered.map((asset) => toSelectableAsset(asset)),
    [filtered, toSelectableAsset],
  );

  useEffect(() => {
    if (!previewFile?.isCdn || !previewFile.assetId) return;

    const asset = assets.find((item) => item.id === previewFile.assetId);
    if (!asset) return;

    const resolvedUrl = getMediaPlaybackUrl(asset);
    if (!resolvedUrl) return;

    const currentUrl = (previewFile.publicUrl ?? previewFile.url ?? "").trim();
    if (currentUrl === resolvedUrl) return;

    setPreviewFile({
      ...previewFile,
      url: resolvedUrl,
      publicUrl: resolvedUrl,
    });
  }, [assets, previewFile, setPreviewFile]);

  const handleAssetPreview = useCallback(
    (event: React.MouseEvent, asset: MediaAssetRecord) => {
      event.stopPropagation();
      const resolvedUrl = getMediaPlaybackUrl(asset);
      const isProcessing = isMediaAssetProcessing(asset);
      if (!resolvedUrl && !isProcessing) {
        console.error("Cloud asset is missing a playback URL:", asset);
        return;
      }
      onPreviewAsset?.({
        ...asset,
        publicUrl: resolvedUrl,
      });
    },
    [onPreviewAsset],
  );

  const isAssetSelected = useCallback(
    (asset: MediaAssetRecord) =>
      previewFile?.assetId === asset.id ||
      previewFile?.name === asset.fileName,
    [previewFile],
  );

  const handleCardPointerSelect = useCallback(
    (
      event: React.MouseEvent,
      selectable: GallerySelectableAsset,
      onDefault?: () => void,
    ) => {
      if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        selectGalleryRange(visibleSelectableAssets, selectable.id);
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        toggleGalleryAssetSelection(selectable);
        setGallerySelectionAnchorId(selectable.id);
        return;
      }

      setGallerySelectionAnchorId(selectable.id);
      onDefault?.();
    },
    [
      selectGalleryRange,
      setGallerySelectionAnchorId,
      toggleGalleryAssetSelection,
      visibleSelectableAssets,
    ],
  );

  const renderPlayOverlay = (asset: MediaAssetRecord, compact = false) => (
    <button
      type="button"
      data-no-marquee
      onClick={(e) => handleAssetPreview(e, asset)}
      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all duration-300 group-hover:opacity-100"
      aria-label={`Play ${asset.fileName}`}
    >
      <span
        className={`flex items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#d4af37]/20 text-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.25)] backdrop-blur-sm transition-transform group-hover:scale-105 ${
          compact ? "h-8 w-8" : "h-14 w-14"
        }`}
      >
        <PlayIcon size={compact ? 14 : 22} />
      </span>
    </button>
  );

  const renderContextMenu = (
    asset: MediaAssetRecord,
    selectable: GallerySelectableAsset,
    playbackUrl: string,
  ) => (
    <AssetContextMenu
      asset={selectable}
      shareUrl={playbackUrl}
      onRename={onRenameAsset ? () => onRenameAsset(asset) : undefined}
      onDelete={onDeleteAsset ? () => onDeleteAsset(asset) : undefined}
    />
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#0a0a0f]/60 px-6 py-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#d4af37]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-300">No cloud assets in this folder</p>
        <p className="mt-1 text-xs text-gray-500">
          Upload to Cloud saves files to the active directory.
        </p>
      </div>
    );
  }

  return (
    <div>
      <GallerySelectAllToggle visibleAssets={visibleSelectableAssets} />
      <GalleryMarqueeContainer
        visibleAssets={visibleSelectableAssets}
        containerClass={containerClass}
        gridStyle={gridStyle}
      >
      {filtered.map((asset) => {
        const playbackUrl = getMediaPlaybackUrl(asset);
        const isVideo = isMediaAssetVideo(asset);
        const isImage = asset.mimeType.startsWith("image/");
        const isSelected = isAssetSelected(asset);
        const selectable = toSelectableAsset(asset);
        const thumbnailUrl = resolveGalleryThumbnail(asset, playbackUrl);
        const processingBadge = resolveAssetDisplayStatus(asset);

        if (viewMode === "list") {
          return (
            <div
              key={asset.id}
              data-gallery-selectable
              data-gallery-asset-id={asset.id}
              className={`group flex items-center gap-3 rounded-md border bg-[#121217] p-3 transition-colors hover:bg-white/[0.02] ${
                isSelected
                  ? "border-[#d4af37]"
                  : "border-white/5 hover:border-[#d4af37]/20"
              } cursor-pointer`}
              onClick={(e) =>
                handleCardPointerSelect(e, selectable, () =>
                  handleAssetPreview(e, asset),
                )
              }
            >
              <GallerySelectCheckbox asset={selectable} />
              <div className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0a0a0f]">
                <AssetGridMedia
                  thumbnailUrl={thumbnailUrl}
                  playbackUrl={playbackUrl}
                  alt={asset.fileName}
                  isVideo={isVideo}
                  fileName={asset.fileName}
                  compact
                  className={objectFitClass}
                />
                {processingBadge && (
                  <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-0.5">
                    <AssetProcessingBadge status={processingBadge} compact />
                  </div>
                )}
                {isVideo && renderPlayOverlay(asset, true)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-200">
                  {asset.fileName}
                </p>
                {showCardInfo && (
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    {formatBytes(asset.fileSize)} · {formatDate(asset.createdAt)}
                  </p>
                )}
              </div>
              {isVideo && (
                <button
                  type="button"
                  data-no-marquee
                  onClick={(e) => handleAssetPreview(e, asset)}
                  className="shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-300 transition-all hover:border-[#d4af37]/40 hover:text-[#d4af37]"
                >
                  Play
                </button>
              )}
              {renderContextMenu(asset, selectable, playbackUrl)}
            </div>
          );
        }

        return (
          <div
            key={asset.id}
            data-gallery-selectable
            data-gallery-asset-id={asset.id}
            className={`group overflow-hidden rounded-lg border bg-[#121217] transition-all duration-300 ease-in-out ${
              isSelected
                ? "border-[#d4af37]"
                : "border-white/5 hover:border-[#d4af37]/30"
            } cursor-pointer`}
            onClick={(e) =>
              handleCardPointerSelect(e, selectable, () =>
                handleAssetPreview(e, asset),
              )
            }
          >
            <div
              className={`relative w-full overflow-hidden bg-[#0a0a0f] flex items-center justify-center ${aspectClass}`}
            >
              <div className="absolute left-2 top-2 z-20">
                <GallerySelectCheckbox asset={selectable} />
              </div>
              <div className="absolute right-2 top-2 z-20">
                {renderContextMenu(asset, selectable, playbackUrl)}
              </div>
              <AssetGridMedia
                thumbnailUrl={thumbnailUrl}
                playbackUrl={playbackUrl}
                alt={asset.fileName}
                isVideo={isVideo}
                fileName={asset.fileName}
                className={objectFitClass}
              />
              {processingBadge && (
                <div className="absolute bottom-8 left-2 z-20">
                  <AssetProcessingBadge status={processingBadge} />
                </div>
              )}
              {isVideo && renderPlayOverlay(asset)}
              <div className="absolute bottom-2 left-2 rounded border border-[#d4af37]/30 bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#d4af37]">
                CDN
              </div>
            </div>
            {showCardInfo && (
              <div className="border-t border-white/5 p-3">
                <p
                  className={`truncate text-gray-200 ${viewMode === "grid-sm" ? "text-[10px]" : "text-xs"}`}
                  title={asset.fileName}
                >
                  {asset.fileName}
                </p>
                <p className="mt-1 text-[10px] text-gray-500">
                  {formatBytes(asset.fileSize)} · {formatDate(asset.createdAt)}
                </p>
              </div>
            )}
          </div>
        );
      })}
      </GalleryMarqueeContainer>
    </div>
  );
}
