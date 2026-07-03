"use client";

import React, { useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { downloadSelectedAsZip } from "@/utils/assetDownload";
import { showToast } from "@/store/useToastStore";

interface GalleryBulkActionBarProps {
  label?: string;
}

export default function GalleryBulkActionBar({
  label = "assets",
}: GalleryBulkActionBarProps) {
  const { selectedGalleryAssets, clearGallerySelection } = useDashboardStore();
  const [isZipping, setIsZipping] = useState(false);

  if (selectedGalleryAssets.length === 0) return null;

  const handleZipDownload = async () => {
    setIsZipping(true);
    try {
      await downloadSelectedAsZip(selectedGalleryAssets, `rendorax-${label}`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "ZIP download failed",
        "error",
      );
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d4af37]/25 bg-[#121217]/90 px-3 py-2">
      <p className="text-[11px] font-medium text-gray-300">
        <span className="text-[#d4af37]">{selectedGalleryAssets.length}</span>{" "}
        selected
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={clearGallerySelection}
          className="rounded-md border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 transition-colors hover:border-white/20 hover:text-white"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={isZipping}
          onClick={handleZipDownload}
          className="rounded-md border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#d4af37] transition-colors hover:bg-[#d4af37]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isZipping ? "Preparing…" : "Download Selected as ZIP"}
        </button>
      </div>
    </div>
  );
}
