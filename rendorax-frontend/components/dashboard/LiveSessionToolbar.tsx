"use client";

import React from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useGlobalStore } from "@/store/useGlobalStore";
import LiveMicToggle from "@/components/dashboard/LiveMicToggle";

export default function LiveSessionToolbar() {
  const isLiveSessionActive = useGlobalStore((state) => state.isLiveSessionActive);
  const setIsLiveSessionActive = useGlobalStore(
    (state) => state.setIsLiveSessionActive,
  );
  const setIsLiveMinimized = useDashboardStore((state) => state.setIsLiveMinimized);

  const handleJoinLiveVideoCall = () => {
    setIsLiveSessionActive(true);
    setIsLiveMinimized(false);
  };

  return (
    <div className="flex items-center gap-2">
      <LiveMicToggle compact disabled={!isLiveSessionActive} />
      <button
        type="button"
        onClick={handleJoinLiveVideoCall}
        className={`text-[10px] font-medium px-3 py-1.5 border border-white/10 transition-all flex items-center gap-1.5 rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-zinc-800 ${
          isLiveSessionActive ? "text-gray-300" : ""
        }`}
      >
        <span className="relative flex h-1.5 w-1.5">
          {isLiveSessionActive && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              isLiveSessionActive ? "bg-green-500" : "bg-white/30"
            }`}
          />
        </span>
        <span className="hidden md:inline">
          {isLiveSessionActive ? "Live Call Active" : "Join Live Video Call"}
        </span>
        <span className="md:hidden">{isLiveSessionActive ? "Live" : "Join Call"}</span>
      </button>
    </div>
  );
}
