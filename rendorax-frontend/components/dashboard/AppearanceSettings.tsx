"use client";
import React, { useState, useEffect, useRef } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function AppearanceSettings({
  onClose,
}: {
  onClose: () => void;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const { viewSettings, setViewSettings } = useDashboardStore();

  useEffect(() => {
    setPosition({ x: window.innerWidth / 2 - 144, y: 60 });
    setMounted(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!mounted) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed w-72 bg-[#1c1c24]/95 backdrop-blur-xl border border-[#d4af37]/40 shadow-[0_30px_60px_rgba(0,0,0,0.9)] rounded-lg text-sm select-none z-[100] overflow-hidden transition-shadow"
    >
      <div
        onMouseDown={handleMouseDown}
        className="cursor-move bg-gradient-to-r from-black/80 to-black/40 p-2.5 border-b border-white/10 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d4af37"
            strokeWidth="2"
          >
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
          <span className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest">
            Appearance settings
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-400 p-1 bg-white/5 hover:bg-white/10 rounded transition-colors"
          title="Close Panel"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-gray-300 font-medium">Aspect Ratio</span>
          <div className="flex bg-[#121217] rounded-md border border-white/5 p-1 gap-1">
            <button
              onClick={() => setViewSettings({ aspectRatio: "video" })}
              className={`w-8 h-6 flex items-center justify-center rounded transition-all ${viewSettings.aspectRatio === "video" ? "bg-[#d4af37] text-black" : "text-gray-500 hover:text-white"}`}
              title="16:9"
            >
              <div className="w-5 h-3 border-2 border-current rounded-sm"></div>
            </button>
            <button
              onClick={() => setViewSettings({ aspectRatio: "square" })}
              className={`w-8 h-6 flex items-center justify-center rounded transition-all ${viewSettings.aspectRatio === "square" ? "bg-[#d4af37] text-black" : "text-gray-500 hover:text-white"}`}
              title="1:1"
            >
              <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
            </button>
            <button
              onClick={() => setViewSettings({ aspectRatio: "portrait" })}
              className={`w-8 h-6 flex items-center justify-center rounded transition-all ${viewSettings.aspectRatio === "portrait" ? "bg-[#d4af37] text-black" : "text-gray-500 hover:text-white"}`}
              title="9:16"
            >
              <div className="w-3 h-5 border-2 border-current rounded-sm"></div>
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 font-medium">Thumbnail Fit</span>
          <div className="flex bg-[#121217] rounded-md border border-white/5 p-1">
            {["Fit", "Fill"].map((scale) => (
              <button
                key={scale}
                onClick={() => setViewSettings({ thumbnailScale: scale })}
                className={`px-4 py-1 text-xs rounded transition-all ${viewSettings.thumbnailScale === scale ? "bg-[#d4af37] text-black font-bold shadow-sm" : "text-gray-500 hover:text-white"}`}
              >
                {scale}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-300 font-medium">Thumbnail Size</span>
            <span className="text-[10px] font-bold tabular-nums text-[#d4af37]">
              {viewSettings.thumbnailSizePercent ?? 100}%
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={200}
            step={5}
            value={viewSettings.thumbnailSizePercent ?? 100}
            onChange={(event) =>
              setViewSettings({
                thumbnailSizePercent: Number(event.target.value),
              })
            }
            style={{
              ["--thumb-size-progress" as string]: `${
                (((viewSettings.thumbnailSizePercent ?? 100) - 20) / 180) * 100
              }%`,
            }}
            className="thumbnail-size-slider w-full"
            aria-label="Thumbnail size"
          />
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
            <span>20%</span>
            <span>100%</span>
            <span>200%</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 font-medium">Show Card Info</span>
          <button
            onClick={() =>
              setViewSettings({ showCardInfo: !viewSettings.showCardInfo })
            }
            className={`w-10 h-5 rounded-full relative transition-colors ${viewSettings.showCardInfo ? "bg-[#d4af37]" : "bg-gray-600"}`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${viewSettings.showCardInfo ? "translate-x-5 left-0.5" : "translate-x-1"}`}
            ></div>
          </button>
        </div>
      </div>
    </div>
  );
}
