"use client";

import type { ReactNode } from "react";
import AssetGridMedia from "@/components/dashboard/AssetGridMedia";
import DeliveryAssetThumbnail from "@/components/dashboard/DeliveryAssetThumbnail";
import {
  type GalleryViewMode,
  useGalleryViewStyles,
} from "@/hooks/useGalleryViewStyles";
import {
  getMediaPlaybackUrl,
  resolveGalleryThumbnail,
  type MediaAssetRecord,
} from "@/utils/mediaAssets";
import { getMediaFileCategory } from "@/utils/mediaFileCategory";

export type AdminAssetGalleryItem = {
  asset: MediaAssetRecord;
  /** Extra badges under the title (Master Delivery, Unlinked, etc.). */
  badges?: ReactNode;
  /** Attribution / secondary line. */
  subtitle?: ReactNode;
  /** Right-side actions for list mode (also shown under grid cards). */
  actions?: ReactNode;
};

interface AdminAssetGalleryProps {
  items: AdminAssetGalleryItem[];
  viewMode: GalleryViewMode;
  onPreview: (asset: MediaAssetRecord) => void;
  emptyLabel?: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Admin media collection using shared gallery view styles.
 * Pass admin-local viewMode so Dashboard Zustand mode stays decoupled.
 */
export default function AdminAssetGallery({
  items,
  viewMode,
  onPreview,
  emptyLabel = "No assets found.",
}: AdminAssetGalleryProps) {
  const {
    containerClass,
    gridStyle,
    aspectClass,
    objectFitClass,
    showCardInfo,
  } = useGalleryViewStyles({ viewMode });

  if (items.length === 0) {
    return (
      <p className="text-center py-8 text-text-gray italic text-xs">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={containerClass} style={gridStyle}>
      {items.map(({ asset, badges, subtitle, actions }) => {
        const playbackUrl = getMediaPlaybackUrl(asset);
        const thumbnailUrl = resolveGalleryThumbnail(asset, playbackUrl);
        const isVideo = getMediaFileCategory(asset.fileName) === "video";

        if (viewMode === "list") {
          return (
            <div
              key={asset.id}
              className="flex flex-wrap justify-between items-center gap-3 p-3 sm:p-4 border border-white/5 bg-bg-body hover:border-gold-primary/20 transition-all min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                <button
                  type="button"
                  onClick={() => onPreview(asset)}
                  className="shrink-0 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-primary/40"
                  title="Preview"
                >
                  <DeliveryAssetThumbnail
                    asset={asset}
                    fileName={asset.fileName}
                  />
                </button>
                <div className="overflow-hidden min-w-0">
                  <button
                    type="button"
                    onClick={() => onPreview(asset)}
                    className="text-left w-full min-w-0"
                    title={asset.fileName}
                  >
                    <p className="text-text-white text-sm font-mono truncate max-w-[min(100%,20rem)] hover:text-gold-primary transition-colors">
                      {asset.fileName}
                    </p>
                  </button>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {showCardInfo ? (
                      <p className="text-text-gray text-[10px] uppercase tracking-wider">
                        {formatBytes(asset.fileSize)}
                      </p>
                    ) : null}
                    {badges}
                  </div>
                  {subtitle ? (
                    <div className="text-[10px] text-text-gray mt-1 truncate max-w-[min(100%,24rem)]">
                      {subtitle}
                    </div>
                  ) : null}
                </div>
              </div>
              {actions ? (
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {actions}
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <div
            key={asset.id}
            className="group overflow-hidden rounded-lg border border-white/5 bg-bg-body hover:border-gold-primary/25 transition-all min-w-0"
          >
            <button
              type="button"
              onClick={() => onPreview(asset)}
              className={`relative w-full overflow-hidden bg-[#0a0a0f] flex items-center justify-center ${aspectClass}`}
              title={asset.fileName}
            >
              <AssetGridMedia
                thumbnailUrl={thumbnailUrl}
                playbackUrl={playbackUrl}
                alt={asset.fileName}
                isVideo={isVideo}
                fileName={asset.fileName}
                className={objectFitClass}
              />
              {isVideo ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
                  <span className="rounded-full border border-[#d4af37]/50 bg-black/70 p-2 text-[#d4af37]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </span>
                </span>
              ) : null}
            </button>
            <div className="p-2.5 space-y-1.5 min-w-0">
              <button
                type="button"
                onClick={() => onPreview(asset)}
                className="block w-full text-left min-w-0"
                title={asset.fileName}
              >
                <p
                  className={`truncate text-text-white hover:text-gold-primary transition-colors ${
                    viewMode === "grid-sm" ? "text-[10px]" : "text-xs"
                  }`}
                >
                  {asset.fileName}
                </p>
              </button>
              {showCardInfo ? (
                <p className="text-[9px] text-text-gray uppercase tracking-wider">
                  {formatBytes(asset.fileSize)}
                </p>
              ) : null}
              {badges ? (
                <div className="flex flex-wrap gap-1">{badges}</div>
              ) : null}
              {subtitle ? (
                <div className="text-[9px] text-text-gray truncate">{subtitle}</div>
              ) : null}
              {actions ? (
                <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-white/5">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
