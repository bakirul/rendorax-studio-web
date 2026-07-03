"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useGalleryMarqueeSelection } from "@/hooks/useGalleryMarqueeSelection";
import type { GallerySelectableAsset } from "@/store/useDashboardStore";

interface GallerySelectionContextValue {
  visibleAssets: GallerySelectableAsset[];
}

const GallerySelectionContext = createContext<GallerySelectionContextValue>({
  visibleAssets: [],
});

export function useGallerySelectionContext() {
  return useContext(GallerySelectionContext);
}

interface GalleryMarqueeContainerProps {
  visibleAssets: GallerySelectableAsset[];
  containerClass: string;
  gridStyle?: CSSProperties;
  children: ReactNode;
}

export default function GalleryMarqueeContainer({
  visibleAssets,
  containerClass,
  gridStyle,
  children,
}: GalleryMarqueeContainerProps) {
  const { containerRef, marqueeBox, isDragging, handleMouseDown } =
    useGalleryMarqueeSelection(visibleAssets);

  const contextValue = useMemo(
    () => ({
      visibleAssets,
    }),
    [visibleAssets],
  );

  return (
    <GallerySelectionContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={`relative ${containerClass} ${isDragging ? "select-none" : ""}`}
        style={gridStyle}
        onMouseDown={handleMouseDown}
      >
        {children}

        {marqueeBox && (
          <div
            className="pointer-events-none fixed z-40 border border-[#d4af37]/70 bg-[#d4af37]/15 shadow-[0_0_24px_rgba(212,175,55,0.12)]"
            style={{
              left: marqueeBox.left,
              top: marqueeBox.top,
              width: marqueeBox.width,
              height: marqueeBox.height,
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </GallerySelectionContext.Provider>
  );
}
