"use client";

import type { GalleryViewMode } from "@/hooks/useGalleryViewStyles";

interface GalleryViewModeToggleProps {
  viewMode: GalleryViewMode;
  onChange: (mode: GalleryViewMode) => void;
  className?: string;
  /** Slightly smaller tap targets for dense Admin headers. */
  compact?: boolean;
}

const MODES: Array<{ mode: GalleryViewMode; title: string; icon: "list" | "sm" | "lg" }> =
  [
    { mode: "list", title: "List View", icon: "list" },
    { mode: "grid-sm", title: "Small Grid", icon: "sm" },
    { mode: "grid-lg", title: "Large Grid", icon: "lg" },
  ];

function ModeIcon({ icon }: { icon: "list" | "sm" | "lg" }) {
  if (icon === "list") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    );
  }

  if (icon === "sm") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="21" />
    </svg>
  );
}

/** Shared List / Small Grid / Large Grid control — same icons as dashboard gallery. */
export default function GalleryViewModeToggle({
  viewMode,
  onChange,
  className = "",
  compact = false,
}: GalleryViewModeToggleProps) {
  return (
    <div
      className={`flex items-center bg-[#050505] border border-white/10 rounded-md p-0.5 shadow-inner ${className}`}
      role="group"
      aria-label="Asset view mode"
    >
      {MODES.map(({ mode, title, icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          title={title}
          aria-pressed={viewMode === mode}
          className={`${compact ? "p-1" : "p-1.5"} rounded transition-all ${
            viewMode === mode
              ? "bg-white/10 text-[#d4af37] shadow-sm"
              : "text-gray-500 hover:text-white hover:bg-white/5"
          }`}
        >
          <ModeIcon icon={icon} />
        </button>
      ))}
    </div>
  );
}
