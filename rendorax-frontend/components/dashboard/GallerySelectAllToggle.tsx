"use client";

import React, { useMemo } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { GallerySelectableAsset } from "@/store/useDashboardStore";

interface GallerySelectAllToggleProps {
  visibleAssets: GallerySelectableAsset[];
  className?: string;
}

export default function GallerySelectAllToggle({
  visibleAssets,
  className = "",
}: GallerySelectAllToggleProps) {
  const {
    selectedGalleryAssets,
    setGallerySelection,
    clearGallerySelection,
  } = useDashboardStore();

  const { allSelected, someSelected } = useMemo(() => {
    if (visibleAssets.length === 0) {
      return { allSelected: false, someSelected: false };
    }

    const visibleIds = new Set(visibleAssets.map((asset) => asset.id));
    const selectedVisibleCount = selectedGalleryAssets.filter((asset) =>
      visibleIds.has(asset.id),
    ).length;

    return {
      allSelected: selectedVisibleCount === visibleAssets.length,
      someSelected:
        selectedVisibleCount > 0 &&
        selectedVisibleCount < visibleAssets.length,
    };
  }, [visibleAssets, selectedGalleryAssets]);

  const handleToggle = () => {
    if (allSelected) {
      clearGallerySelection();
      return;
    }
    setGallerySelection(visibleAssets);
  };

  if (visibleAssets.length === 0) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`mb-3 flex items-center gap-2 rounded-md border border-transparent px-1 py-1 text-left transition-colors hover:border-white/5 hover:bg-white/[0.02] ${className}`}
      aria-label={allSelected ? "Deselect all assets" : "Select all assets"}
      aria-pressed={allSelected}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          allSelected
            ? "border-[#d4af37] bg-[#d4af37] text-black"
            : someSelected
              ? "border-[#d4af37]/70 bg-[#d4af37]/30 text-[#d4af37]"
              : "border-white/20 bg-black/60 text-transparent hover:border-[#d4af37]/50"
        }`}
      >
        {allSelected ? (
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
        ) : someSelected ? (
          <span className="h-0.5 w-2.5 rounded-full bg-[#d4af37]" />
        ) : null}
      </span>
      <span className="text-[11px] font-medium tracking-wide text-gray-400 transition-colors group-hover:text-gray-200">
        {allSelected ? "Deselect All" : "Select All"}
      </span>
    </button>
  );
}
