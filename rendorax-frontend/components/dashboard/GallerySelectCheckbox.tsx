"use client";

import React from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { GallerySelectableAsset } from "@/store/useDashboardStore";
import { useGallerySelectionContext } from "@/components/dashboard/GalleryMarqueeContainer";

interface GallerySelectCheckboxProps {
  asset: GallerySelectableAsset;
  className?: string;
}

export default function GallerySelectCheckbox({
  asset,
  className = "",
}: GallerySelectCheckboxProps) {
  const {
    selectedGalleryAssets,
    toggleGalleryAssetSelection,
    setGallerySelectionAnchorId,
    selectGalleryRange,
  } = useDashboardStore();
  const { visibleAssets } = useGallerySelectionContext();
  const checked = selectedGalleryAssets.some((item) => item.id === asset.id);

  return (
    <button
      type="button"
      data-no-marquee
      onClick={(event) => {
        event.stopPropagation();

        if (event.shiftKey) {
          selectGalleryRange(visibleAssets, asset.id);
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          toggleGalleryAssetSelection(asset);
          setGallerySelectionAnchorId(asset.id);
          return;
        }

        toggleGalleryAssetSelection(asset);
        setGallerySelectionAnchorId(asset.id);
      }}
      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
        checked
          ? "border-[#d4af37] bg-[#d4af37] text-black"
          : "border-white/20 bg-black/60 text-transparent hover:border-[#d4af37]/50"
      } ${className}`}
      aria-label={checked ? "Deselect asset" : "Select asset"}
      aria-pressed={checked}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </button>
  );
}
