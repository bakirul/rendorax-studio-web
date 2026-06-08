// components/DashboardHeader.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// 🚀 FREE-FLOATING DRAGGABLE APPEARANCE PANEL
const DraggableAppearancePanel = ({
  settings,
  onSettingsChange,
  onClose,
}: {
  settings: any;
  onSettingsChange: (k: string, v: any) => void;
  onClose: () => void;
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

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
          <span className="text-gray-300 font-medium">Card Size</span>
          <div className="flex bg-[#121217] rounded-md border border-white/5 p-1">
            {["S", "M", "L"].map((size) => (
              <button
                key={size}
                onClick={() => onSettingsChange("cardSize", size)}
                className={`w-8 py-1 text-xs rounded transition-all ${settings.cardSize === size ? "bg-[#d4af37] text-black font-bold shadow-sm" : "text-gray-500 hover:text-white"}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 font-medium">Aspect Ratio</span>
          <div className="flex bg-[#121217] rounded-md border border-white/5 p-1 gap-1">
            <button
              onClick={() => onSettingsChange("aspectRatio", "video")}
              className={`w-8 h-6 flex items-center justify-center rounded transition-all ${settings.aspectRatio === "video" ? "bg-[#d4af37] text-black" : "text-gray-500 hover:text-white"}`}
              title="16:9"
            >
              <div className="w-5 h-3 border-2 border-current rounded-sm"></div>
            </button>
            <button
              onClick={() => onSettingsChange("aspectRatio", "square")}
              className={`w-8 h-6 flex items-center justify-center rounded transition-all ${settings.aspectRatio === "square" ? "bg-[#d4af37] text-black" : "text-gray-500 hover:text-white"}`}
              title="1:1"
            >
              <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
            </button>
            <button
              onClick={() => onSettingsChange("aspectRatio", "portrait")}
              className={`w-8 h-6 flex items-center justify-center rounded transition-all ${settings.aspectRatio === "portrait" ? "bg-[#d4af37] text-black" : "text-gray-500 hover:text-white"}`}
              title="9:16"
            >
              <div className="w-3 h-5 border-2 border-current rounded-sm"></div>
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 font-medium">Thumbnail Scale</span>
          <div className="flex bg-[#121217] rounded-md border border-white/5 p-1">
            {["Fit", "Fill"].map((scale) => (
              <button
                key={scale}
                onClick={() => onSettingsChange("thumbnailScale", scale)}
                className={`px-4 py-1 text-xs rounded transition-all ${settings.thumbnailScale === scale ? "bg-[#d4af37] text-black font-bold shadow-sm" : "text-gray-500 hover:text-white"}`}
              >
                {scale}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 font-medium">Show Card Info</span>
          <button
            onClick={() =>
              onSettingsChange("showCardInfo", !settings.showCardInfo)
            }
            className={`w-10 h-5 rounded-full relative transition-colors ${settings.showCardInfo ? "bg-[#d4af37]" : "bg-gray-600"}`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${settings.showCardInfo ? "translate-x-5 left-0.5" : "translate-x-1"}`}
            ></div>
          </button>
        </div>
      </div>
    </div>
  );
};

// 🚀 DASHBOARD HEADER EXPORT
export default function DashboardHeader({
  viewSettings,
  setViewSettings,
  handleUpload,
  uploading,
  isSidebarOpen,
  onToggleSidebar,
}: {
  viewSettings: any;
  setViewSettings: React.Dispatch<React.SetStateAction<any>>;
  handleUpload: (files: FileList | null) => Promise<void>;
  uploading: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) {
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/access");
  };

  return (
    <>
      {isAppearanceOpen && (
        <DraggableAppearancePanel
          settings={viewSettings}
          onSettingsChange={(k, v) =>
            setViewSettings((prev: any) => ({ ...prev, [k]: v }))
          }
          onClose={() => setIsAppearanceOpen(false)}
        />
      )}

      <header className="h-14 bg-[#121217] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-40 relative">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="text-gray-400 hover:text-white transition-colors focus:outline-none p-1.5 -ml-1 rounded hover:bg-white/5"
              aria-label="Toggle Sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-black font-bold text-xs shadow-lg">
            K
          </div>
          <h1 className="text-sm font-semibold text-white tracking-wide hidden sm:block">
            Kachna Studio
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAppearanceOpen(true)}
            className="text-[11px] uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-[#d4af37]/10 transition-colors text-white flex items-center gap-2 bg-[#1c1c24] rounded-md shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span className="hidden sm:inline">Appearance</span>
          </button>

          <button
            onClick={() => inputRef.current?.click()}
            className="hidden sm:block text-[11px] uppercase tracking-widest bg-[#d4af37] hover:bg-[#b8952b] text-black px-5 py-2.5 font-bold rounded-md shadow-md"
          >
            Upload File
          </button>

          <button
            onClick={() => inputRef.current?.click()}
            className="sm:hidden text-[11px] bg-[#d4af37] text-black p-2 rounded-md shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </button>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
          <div className="w-px h-6 bg-white/10 mx-1 sm:mx-2"></div>
          <button
            onClick={handleSignOut}
            className="text-xs text-[#d4af37] hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
    </>
  );
}
