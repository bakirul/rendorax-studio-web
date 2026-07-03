import type { CSSProperties } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import {
  GALLERY_ASPECT_CLASS,
  normalizeAspectRatioSetting,
} from "@/utils/playerAspectRatio";

const GRID_LG_BASE_PX = 240;
const GRID_SM_BASE_PX = 140;

function scaledGridMinWidth(basePx: number, sizePercent: number): number {
  return Math.round(basePx * (sizePercent / 100));
}

export function useGalleryViewStyles() {
  const { viewSettings, viewMode } = useDashboardStore();
  const normalizedAspect = normalizeAspectRatioSetting(viewSettings.aspectRatio);
  const thumbnailSizePercent = viewSettings.thumbnailSizePercent ?? 100;

  const aspectClass = GALLERY_ASPECT_CLASS[normalizedAspect];

  const objectFitClass =
    viewSettings.thumbnailScale === "Fill" ? "object-cover" : "object-contain";

  const playerSizeClass =
    normalizedAspect === "video" || normalizedAspect === "dci"
      ? "w-full h-auto max-h-full"
      : "h-full w-auto max-w-full";

  let containerClass =
    "grid gap-6 transition-all duration-300 ease-in-out";
  let gridStyle: CSSProperties = {};

  if (viewMode === "list") {
    containerClass =
      "flex flex-col gap-2 transition-all duration-300 ease-in-out";
  } else if (viewMode === "grid-sm") {
    const minWidth = scaledGridMinWidth(GRID_SM_BASE_PX, thumbnailSizePercent);
    gridStyle = {
      gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
    };
  } else {
    const minWidth = scaledGridMinWidth(GRID_LG_BASE_PX, thumbnailSizePercent);
    gridStyle = {
      gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
    };
  }

  return {
    viewSettings,
    viewMode,
    aspectClass,
    objectFitClass,
    playerSizeClass,
    containerClass,
    gridStyle,
    thumbnailSizePercent,
    showCardInfo: viewSettings.showCardInfo,
  };
}
