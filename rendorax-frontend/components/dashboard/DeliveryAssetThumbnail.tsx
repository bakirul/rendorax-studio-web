"use client";

import AssetGridMedia from "@/components/dashboard/AssetGridMedia";
import {
  getMediaPlaybackUrl,
  resolveGalleryThumbnail,
  type MediaAssetRecord,
} from "@/utils/mediaAssets";
import { getMediaFileCategory } from "@/utils/mediaFileCategory";

/** Compact delivery thumbnail using existing gallery poster helpers. */
export default function DeliveryAssetThumbnail({
  asset,
  fileName,
  selected = false,
  className = "",
}: {
  asset?: Pick<
    MediaAssetRecord,
    "fileName" | "mimeType" | "thumbnailUrl" | "objectKey" | "publicUrl" | "playbackUrl" | "playbackObjectKey" | "playbackFormat" | "processingStatus"
  > | null;
  fileName?: string | null;
  selected?: boolean;
  className?: string;
}) {
  const name = (asset?.fileName ?? fileName ?? "").trim() || "Delivery";
  const category = getMediaFileCategory(name);
  const isVideo = category === "video";
  const playbackUrl = asset ? getMediaPlaybackUrl(asset) : "";
  const thumbnailUrl = asset
    ? resolveGalleryThumbnail(asset, playbackUrl)
    : null;

  return (
    <div
      className={`relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded border bg-black/40 ${
        selected
          ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
          : "border-white/10"
      } ${className}`}
    >
      <AssetGridMedia
        thumbnailUrl={thumbnailUrl}
        playbackUrl={
          category === "image" || category === "video" ? playbackUrl : null
        }
        alt={name}
        isVideo={isVideo}
        fileName={name}
        compact
        className="h-full w-full"
      />
    </div>
  );
}
