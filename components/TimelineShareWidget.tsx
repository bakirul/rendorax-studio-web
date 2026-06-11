"use client";
import React from "react";

interface TimelineShareWidgetProps {
  cinemaVideoRef: React.RefObject<HTMLVideoElement>;
}

const TimelineShareWidget = React.memo(({ cinemaVideoRef }: TimelineShareWidgetProps) => {
  return (
    <div className="flex-1 h-full w-full bg-black relative flex items-center justify-center animate-fade-in">
      <video
        ref={cinemaVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 bg-black/85 text-[#d4af37] text-[10px] px-3.5 py-2 rounded-lg border border-[#d4af37]/45 backdrop-blur-md z-10 flex items-center gap-2.5 font-bold tracking-widest uppercase shadow-2xl select-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span>Cinema Mode: Live Editing Share</span>
      </div>
    </div>
  );
});

TimelineShareWidget.displayName = "TimelineShareWidget";

export default TimelineShareWidget;
