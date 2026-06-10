// components/DashboardHeader.tsx
"use client";
import React, { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AppearanceSettings from "./dashboard/AppearanceSettings";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function DashboardHeader({
  handleUpload,
  uploading,
  onToggleScreenShare,
}: {
  handleUpload: (files: FileList | null) => Promise<void>;
  uploading: boolean;
  onToggleScreenShare?: () => void;
}) {
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const { isSidebarOpen, setIsSidebarOpen, isEditor, isScreenSharing } = useDashboardStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/access");
  };

  return (
    <>
      {isAppearanceOpen && (
        <AppearanceSettings onClose={() => setIsAppearanceOpen(false)} />
      )}

      <header className="h-14 bg-[#121217] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-40 relative">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
          <div className="w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-black font-bold text-xs shadow-lg">
            K
          </div>
          <h1 className="text-sm font-semibold text-white tracking-wide hidden sm:block">
            Kachna Studio
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={useDashboardStore((state) => state.userLanguage)}
            onChange={(e) => useDashboardStore.getState().setUserLanguage(e.target.value)}
            className="bg-[#1c1c24] text-white border border-white/10 px-2 py-1.5 rounded-md shadow-sm text-[11px] uppercase tracking-widest focus:outline-none focus:border-[#d4af37]/50 hover:bg-[#d4af37]/10 transition-colors"
          >
            <option value="en-US">🇺🇸 EN-US</option>
            <option value="bn-BD">🇧🇩 BN-BD</option>
            <option value="es-ES">🇪🇸 ES-ES</option>
            <option value="fr-FR">🇫🇷 FR-FR</option>
          </select>

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

          {isEditor && onToggleScreenShare && (
            <button
              onClick={onToggleScreenShare}
              className={`text-[11px] uppercase tracking-widest px-4 py-2.5 font-bold border transition-all flex items-center gap-2 rounded-md shadow-md ${
                isScreenSharing
                  ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-200"
                  : "bg-[#1c1c24] hover:bg-[#d4af37]/10 border-white/10 text-white"
              }`}
            >
              <span className={`relative flex h-2 w-2 ${isScreenSharing ? "inline-flex" : "hidden"}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>{isScreenSharing ? "Stop Sharing" : "Go Live (Screen Share)"}</span>
            </button>
          )}

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
