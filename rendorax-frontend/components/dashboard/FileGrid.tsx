"use client";
import React, { useCallback, useMemo } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { GallerySelectableAsset } from "@/store/useDashboardStore";
import { useGalleryViewStyles } from "@/hooks/useGalleryViewStyles";
import AssetContextMenu from "@/components/dashboard/AssetContextMenu";
import GallerySelectCheckbox from "@/components/dashboard/GallerySelectCheckbox";
import GallerySelectAllToggle from "@/components/dashboard/GallerySelectAllToggle";
import GalleryMarqueeContainer from "@/components/dashboard/GalleryMarqueeContainer";
import AssetGridMedia from "@/components/dashboard/AssetGridMedia";
import AssetProcessingBadge from "@/components/dashboard/AssetProcessingBadge";
import { inferMimeTypeFromFileName } from "@/utils/mediaTypes";
import { isMediaAssetVideo, type MediaAssetRecord } from "@/utils/mediaAssets";
import { resolveAssetDisplayStatus } from "@/utils/mediaUploadStatus";

interface FileGridProps {
  filteredFiles: any[];
  currentFolder?: string;
  fileUrls: Record<string, string>;
  thumbnailUrls?: Record<string, string>;
  vaultAssetsByName?: Record<string, MediaAssetRecord>;
  onPreview: (fileName: string) => void;
  onRenameFile: (fileName: string) => void;
  onDeleteFile: (fileName: string) => void;
  onMoveFile?: (fileName: string) => void;
}

export default function FileGrid({
  filteredFiles,
  currentFolder,
  fileUrls,
  thumbnailUrls = {},
  vaultAssetsByName = {},
  onPreview,
  onRenameFile,
  onDeleteFile,
  onMoveFile,
}: FileGridProps) {
  const {
    previewFile,
    selectGalleryRange,
    toggleGalleryAssetSelection,
    setGallerySelectionAnchorId,
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
    (item: { id?: string; name: string; metadata?: { size?: number } }, originalName: string, fileUrl?: string): GallerySelectableAsset => ({
      id: item.id ?? item.name,
      source: "vault",
      fileName: originalName,
      fileSize: item.metadata?.size ?? null,
      mimeType: inferMimeTypeFromFileName(originalName),
      vaultDownloadUrl: fileUrl,
      previewKey: item.name,
    }),
    [],
  );

  const files = (filteredFiles || []).filter((item) => item?.name);

  const visibleSelectableAssets = useMemo(
    () =>
      files
        .filter((item) => item.id)
        .map((item) => {
          const originalName = item.name.substring(item.name.indexOf("_") + 1);
          return toSelectableAsset(item, originalName, fileUrls?.[item.name]);
        }),
    [files, fileUrls, toSelectableAsset],
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

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#0a0a0f]/60 px-6 py-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-gray-400">
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
            aria-hidden="true"
          >
            <rect width="20" height="5" x="2" y="3" rx="1" />
            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
            <path d="M10 12h4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-300">
          No Vault Local Storage assets in this folder
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Upload to Local Storage saves files to the active directory.
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

      {files.map((item) => {
        const originalName = item.name.substring(item.name.indexOf("_") + 1);
        const isVideoFile = isMediaAssetVideo({
          fileName: originalName,
          mimeType: item.metadata?.mimetype,
        });
        const isImage = item.metadata?.mimetype?.startsWith("image/");
        const isSelected = previewFile?.name === item.name;
        const fileUrl = fileUrls?.[item.name];
        const thumbnailUrl = thumbnailUrls?.[item.name];
        const selectable = toSelectableAsset(item, originalName, fileUrl);
        const isSelectableFile = Boolean(item.id);
        const processingBadge = resolveAssetDisplayStatus(
          vaultAssetsByName[item.name] ?? {},
        );
        const selectableProps = isSelectableFile
          ? {
              "data-gallery-selectable": true,
              "data-gallery-asset-id": selectable.id,
            }
          : {};

        if (viewMode === 'list') {
          return (
            <div
              key={item.id ?? item.name}
              {...selectableProps}
              className={`bg-[#121217] rounded-md border flex items-center gap-3 p-2 relative group cursor-pointer hover:bg-white/5 transition-colors ${isSelected ? "border-[#d4af37]" : "border-white/5"}`}
              onClick={(e) =>
                isSelectableFile
                  ? handleCardPointerSelect(e, selectable, () => onPreview(item.name))
                  : onPreview(item.name)
              }
            >
              {isSelectableFile && <GallerySelectCheckbox asset={selectable} />}
              <div className="w-16 h-10 bg-[#0a0a0f] flex items-center justify-center shrink-0 rounded overflow-hidden mr-4 relative">
                {fileUrl ? (
                  <AssetGridMedia
                    thumbnailUrl={thumbnailUrl ?? (isImage ? fileUrl : null)}
                    playbackUrl={fileUrl}
                    alt={originalName}
                    isVideo={Boolean(isVideoFile)}
                    fileName={originalName}
                    compact
                    className="object-cover"
                  />
                ) : (
                  <div className="w-4 h-4 border border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
                )}
                {processingBadge && (
                  <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-0.5">
                    <AssetProcessingBadge status={processingBadge} compact />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-200 truncate">{originalName}</p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-4 pr-2">
                <button onClick={(e) => { e.stopPropagation(); onMoveFile?.(item.name); }} className="p-1.5 text-gray-400 hover:text-[#3b82f6] transition-colors rounded hover:bg-white/10" title="Move">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRenameFile(item.name); }} className="p-1.5 text-gray-400 hover:text-[#d4af37] transition-colors rounded hover:bg-white/10" title="Rename">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteFile(item.name); }} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded hover:bg-red-500/20" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
                {fileUrl && (
                  <AssetContextMenu asset={selectable} shareUrl={fileUrl} />
                )}
              </div>
            </div>
          );
        }

        // Grid View (sm or lg)
        return (
          <div
            key={item.id ?? item.name}
            {...selectableProps}
            className={`bg-[#121217] rounded-lg border overflow-hidden relative group cursor-pointer transition-all duration-300 ease-in-out ${isSelected ? "border-[#d4af37]" : "border-white/5"}`}
            onClick={(e) =>
              isSelectableFile
                ? handleCardPointerSelect(e, selectable, () => onPreview(item.name))
                : onPreview(item.name)
            }
          >
            <div
              className={`w-full bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden ${aspectClass}`}
            >
              <div className="absolute left-2 top-2 z-20">
                {isSelectableFile && <GallerySelectCheckbox asset={selectable} />}
              </div>
              {fileUrl && (
                <div className="absolute right-2 top-2 z-20">
                  <AssetContextMenu asset={selectable} shareUrl={fileUrl} />
                </div>
              )}
              {fileUrl ? (
                <AssetGridMedia
                  thumbnailUrl={thumbnailUrl ?? (isImage ? fileUrl : null)}
                  playbackUrl={fileUrl}
                  alt={originalName}
                  isVideo={Boolean(isVideoFile)}
                  fileName={originalName}
                  className={objectFitClass}
                />
              ) : (
                <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
              )}
              {processingBadge && (
                <div className="absolute bottom-2 left-2 z-20">
                  <AssetProcessingBadge status={processingBadge} />
                </div>
              )}
            </div>

            {showCardInfo && (
              <div className="p-3 border-t border-white/5 relative group/card">
                <p className={`truncate pr-16 ${viewMode === 'grid-sm' ? 'text-[10px]' : 'text-xs'}`}>{originalName}</p>
                <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity bg-[#121217] pl-2 rounded-tl-md">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveFile?.(item.name);
                    }}
                    className="p-1 text-gray-400 hover:text-[#3b82f6] transition-colors"
                    title="Move"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameFile(item.name);
                    }}
                    className="p-1 text-gray-400 hover:text-[#d4af37] transition-colors"
                    title="Rename"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(item.name);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      </GalleryMarqueeContainer>
    </div>
  );
}
