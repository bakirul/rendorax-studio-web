"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { GallerySelectableAsset } from "@/store/useDashboardStore";
import {
  applyMarqueeSelection,
  domRectToViewport,
  normalizeViewportRect,
  rectsIntersect,
  type ViewportRect,
} from "@/utils/gallerySelection";

const DRAG_THRESHOLD_PX = 4;

interface CardSnapshot {
  id: string;
  rect: ViewportRect;
}

interface DragState {
  startX: number;
  startY: number;
  toggleMode: boolean;
  baseSelection: GallerySelectableAsset[];
  snapshots: CardSnapshot[];
}

export interface MarqueeBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "button, a, input, textarea, select, [data-no-marquee], [data-gallery-selectable]",
    ),
  );
}

function collectCardSnapshots(container: HTMLElement): CardSnapshot[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    "[data-gallery-selectable][data-gallery-asset-id]",
  );

  return Array.from(nodes).map((node) => ({
    id: node.dataset.galleryAssetId ?? "",
    rect: domRectToViewport(node.getBoundingClientRect()),
  }));
}

function getIntersectingIds(
  marquee: ViewportRect,
  snapshots: CardSnapshot[],
): Set<string> {
  const ids = new Set<string>();
  for (const snapshot of snapshots) {
    if (snapshot.id && rectsIntersect(marquee, snapshot.rect)) {
      ids.add(snapshot.id);
    }
  }
  return ids;
}

export function useGalleryMarqueeSelection(
  visibleAssets: GallerySelectableAsset[],
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
  const [marqueeBox, setMarqueeBox] = useState<MarqueeBox | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const setGallerySelection = useDashboardStore(
    (state) => state.setGallerySelection,
  );

  const applySelectionForPoint = useCallback(
    (clientX: number, clientY: number) => {
      const drag = dragStateRef.current;
      const container = containerRef.current;
      if (!drag || !container) return;

      const marquee = normalizeViewportRect(
        drag.startX,
        drag.startY,
        clientX,
        clientY,
      );
      const intersectingIds = getIntersectingIds(marquee, drag.snapshots);
      const nextSelection = applyMarqueeSelection(
        intersectingIds,
        visibleAssets,
        drag.baseSelection,
        drag.toggleMode,
      );

      setGallerySelection(nextSelection);
      setMarqueeBox({
        left: marquee.left,
        top: marquee.top,
        width: marquee.right - marquee.left,
        height: marquee.bottom - marquee.top,
      });
    },
    [setGallerySelection, visibleAssets],
  );

  const scheduleSelectionUpdate = useCallback(
    (clientX: number, clientY: number) => {
      pendingPointRef.current = { x: clientX, y: clientY };
      if (rafRef.current !== null) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const point = pendingPointRef.current;
        if (!point) return;
        applySelectionForPoint(point.x, point.y);
      });
    },
    [applySelectionForPoint],
  );

  const endDrag = useCallback(() => {
    dragStateRef.current = null;
    pendingPointRef.current = null;
    setMarqueeBox(null);
    setIsDragging(false);
    document.body.style.removeProperty("user-select");

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;

      const container = containerRef.current;
      if (!container) return;

      const toggleMode = event.ctrlKey || event.metaKey;
      const baseSelection = useDashboardStore.getState().selectedGalleryAssets;

      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        toggleMode,
        baseSelection,
        snapshots: collectCardSnapshots(container),
      };
    },
    [],
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;

      const deltaX = Math.abs(event.clientX - drag.startX);
      const deltaY = Math.abs(event.clientY - drag.startY);

      if (!isDragging && deltaX < DRAG_THRESHOLD_PX && deltaY < DRAG_THRESHOLD_PX) {
        return;
      }

      if (!isDragging) {
        setIsDragging(true);
        document.body.style.userSelect = "none";
      }

      scheduleSelectionUpdate(event.clientX, event.clientY);
    };

    const handleMouseUp = () => {
      if (dragStateRef.current) {
        endDrag();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      endDrag();
    };
  }, [endDrag, isDragging, scheduleSelectionUpdate]);

  return {
    containerRef,
    marqueeBox,
    isDragging,
    handleMouseDown,
  };
}
