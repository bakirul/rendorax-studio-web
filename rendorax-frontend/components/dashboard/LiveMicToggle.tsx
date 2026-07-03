"use client";

import React from "react";
import { useGlobalStore } from "@/store/useGlobalStore";

interface LiveMicToggleProps {
  disabled?: boolean;
  compact?: boolean;
}

export default function LiveMicToggle({
  disabled = false,
  compact = false,
}: LiveMicToggleProps) {
  const { isMicActive, setIsMicActive } = useGlobalStore();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setIsMicActive(!isMicActive)}
      className={`transition-all rounded-full flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40 ${
        compact
          ? `px-3 py-1.5 text-[10px] font-medium border border-white/10 bg-black/50 text-gray-400 hover:text-white hover:bg-zinc-800 ${
              isMicActive ? "text-gray-300" : ""
            }`
          : `w-full px-4 py-2 text-[11px] font-bold tracking-wide border ${
              isMicActive
                ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                : "bg-black/40 text-white/70 border-white/10 hover:bg-black/60 hover:text-white"
            }`
      }`}
      title={
        isMicActive
          ? "Disable live mic translation"
          : "Enable live mic translation"
      }
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {isMicActive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            isMicActive ? "bg-red-500" : "bg-white/30"
          }`}
        />
      </span>
      <span className="truncate">
        {isMicActive ? "Mic On" : "Live Mic"}
      </span>
    </button>
  );
}
