// components/DashboardHeader.tsx
"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AppearanceSettings from "./dashboard/AppearanceSettings";
import MediaUploadModal from "./modals/MediaUploadModal";
import LiveSessionToolbar from "./dashboard/LiveSessionToolbar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useGlobalStore } from "@/store/useGlobalStore";
import type { R2UploadResult } from "@/utils/r2Upload";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import type { ClientUploadSession } from "@/utils/mediaUploadStatus";
import UploadStatusBar from "@/components/dashboard/UploadStatusBar";

const LANGUAGES = [
  { code: "en-US", label: "🇺🇸 EN-US" },
  { code: "bn-BD", label: "🇧🇩 BN-BD" },
  { code: "es-ES", label: "🇪🇸 ES-ES" },
  { code: "fr-FR", label: "🇫🇷 FR-FR" },
  { code: "de-DE", label: "🇩🇪 DE-DE" },
  { code: "zh-CN", label: "🇨🇳 ZH-CN" },
  { code: "ja-JP", label: "🇯🇵 JA-JP" },
  { code: "ru-RU", label: "🇷🇺 RU-RU" },
  { code: "pt-BR", label: "🇧🇷 PT-BR" },
  { code: "it-IT", label: "🇮🇹 IT-IT" },
  { code: "ko-KR", label: "🇰🇷 KO-KR" },
  { code: "ar-SA", label: "🇸🇦 AR-SA" },
  { code: "hi-IN", label: "🇮🇳 HI-IN" },
  { code: "tr-TR", label: "🇹🇷 TR-TR" },
  { code: "nl-NL", label: "🇳🇱 NL-NL" },
  { code: "pl-PL", label: "🇵🇱 PL-PL" },
  { code: "vi-VN", label: "🇻🇳 VI-VN" },
  { code: "th-TH", label: "🇹🇭 TH-TH" },
  { code: "id-ID", label: "🇮🇩 ID-ID" },
  { code: "sv-SE", label: "🇸🇪 SV-SE" },
];

export default function DashboardHeader({
  handleUpload,
  uploading,
  uploadSession,
  onToggleScreenShare,
  onR2UploadSuccess,
  activeProjectId,
  onOpenMasterDeliveryUpload,
}: {
  handleUpload: (files: FileList | null) => Promise<void>;
  uploading: boolean;
  uploadSession?: ClientUploadSession | null;
  onToggleScreenShare?: () => void;
  onR2UploadSuccess: (
    result: R2UploadResult,
    file: File,
  ) => void | Promise<MediaAssetRecord | void>;
  activeProjectId?: string;
  onOpenMasterDeliveryUpload?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const { isSidebarOpen, setIsSidebarOpen, isEditor, isScreenSharing } = useDashboardStore();
  const selectedLanguage = useGlobalStore((state) => state.selectedLanguage);
  const setSelectedLanguage = useGlobalStore((state) => state.setSelectedLanguage);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isR2ModalOpen, setIsR2ModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canUploadMasterDelivery = Boolean(
    isEditor && activeProjectId?.trim() && onOpenMasterDeliveryUpload,
  );

  React.useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    useGlobalStore.setState({ isMicActive: false, isLiveSessionActive: false, socketConnection: null });
    router.push("/access");
    router.refresh();
  };

  return (
    <>
      {isAppearanceOpen && (
        <AppearanceSettings onClose={() => setIsAppearanceOpen(false)} />
      )}

      <MediaUploadModal
        isOpen={isR2ModalOpen}
        onClose={() => setIsR2ModalOpen(false)}
        onUploadSuccess={onR2UploadSuccess}
      />

      <div className="shrink-0 z-40 relative">
        <header className="h-14 bg-[#121217] border-b border-white/5 flex items-center justify-between px-6">
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
          <div className="flex items-center gap-2">
            <Image
              alt="Rendorax Logo"
              className="object-contain"
              height={32}
              src="/assets/logo.svg"
              width={32}
            />
            <h1 className="text-sm font-semibold text-white tracking-wide hidden sm:block">
              Rendorax Studio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 max-md:min-w-0 max-md:max-w-[calc(100vw-5.5rem)] max-md:overflow-x-auto max-md:custom-scrollbar">
          {hasHydrated && (
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-gray-900 bg-white dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 px-2 py-1.5 rounded-md shadow-sm text-[11px] uppercase tracking-widest focus:outline-none focus:border-[#d4af37]/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-gray-900 bg-white dark:bg-gray-800 dark:text-white">
                  {lang.label}
                </option>
              ))}
            </select>
          )}

          <LiveSessionToolbar />

          <Link
            href="/guide"
            className="text-[11px] uppercase tracking-widest border border-white/10 bg-[#1c1c24] text-white hover:bg-[#d4af37]/10 hover:border-[#d4af37]/40 px-4 py-2 transition-colors flex items-center gap-2 rounded-md shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="hidden sm:inline">Help</span>
          </Link>

          <button
            onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
            className={`text-[11px] uppercase tracking-widest border px-4 py-2 transition-colors flex items-center gap-2 rounded-md shadow-sm ${
              isAppearanceOpen
                ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
                : "border-white/10 bg-[#1c1c24] text-white hover:bg-[#d4af37]/10"
            }`}
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
              aria-label={isScreenSharing ? "Stop Sharing" : "Go Live (Screen Share)"}
              className={`text-[11px] uppercase tracking-widest px-4 py-2.5 font-bold border transition-all flex items-center gap-2 rounded-md shadow-md max-md:px-2.5 max-md:py-2 ${
                isScreenSharing
                  ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-200"
                  : "bg-[#1c1c24] hover:bg-[#d4af37]/10 border-white/10 text-white"
              }`}
            >
              <span className={`relative flex h-2 w-2 shrink-0 ${isScreenSharing ? "inline-flex" : "hidden"}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="md:hidden shrink-0"
              >
                <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z" />
                <rect x="3" y="6" width="12" height="12" rx="2" ry="2" />
              </svg>
              <span className="hidden md:inline">
                {isScreenSharing ? "Stop Sharing" : "Go Live (Screen Share)"}
              </span>
            </button>
          )}

          <button
            onClick={() => setIsR2ModalOpen(true)}
            className="hidden sm:flex text-[11px] uppercase tracking-[0.2em] border border-[#d4af37]/40 bg-[#1c1c24] hover:bg-[#d4af37]/10 text-[#d4af37] px-4 py-2.5 font-bold rounded-md shadow-[0_0_20px_rgba(212,175,55,0.08)] hover:shadow-[0_0_25px_rgba(212,175,55,0.18)] transition-all items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
            Upload Review Version
          </button>

          <button
            onClick={() => setIsR2ModalOpen(true)}
            className="sm:hidden flex items-center justify-center border border-[#d4af37]/40 bg-[#1c1c24] text-[#d4af37] p-2 rounded-md shadow-[0_0_15px_rgba(212,175,55,0.1)]"
            aria-label="Upload Review Version"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
          </button>

          {isEditor && onOpenMasterDeliveryUpload ? (
            <>
              <button
                type="button"
                disabled={!canUploadMasterDelivery}
                onClick={onOpenMasterDeliveryUpload}
                title={
                  canUploadMasterDelivery
                    ? "Upload Master Delivery"
                    : "Select an active project to upload Master Delivery"
                }
                className="hidden sm:flex text-[11px] uppercase tracking-[0.2em] border border-emerald-500/35 bg-[#1c1c24] hover:bg-emerald-500/10 text-emerald-300/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1c1c24] px-4 py-2.5 font-bold rounded-md transition-all items-center gap-2"
              >
                Upload Master Delivery
              </button>
              <button
                type="button"
                disabled={!canUploadMasterDelivery}
                onClick={onOpenMasterDeliveryUpload}
                aria-label="Upload Master Delivery"
                title={
                  canUploadMasterDelivery
                    ? "Upload Master Delivery"
                    : "Select an active project to upload Master Delivery"
                }
                className="sm:hidden flex items-center justify-center border border-emerald-500/35 bg-[#1c1c24] text-emerald-300/90 disabled:opacity-40 disabled:cursor-not-allowed p-2 rounded-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
            </>
          ) : null}

          <button
            onClick={() => inputRef.current?.click()}
            className="hidden sm:block text-[11px] uppercase tracking-widest bg-[#d4af37] hover:bg-[#b8952b] text-black px-5 py-2.5 font-bold rounded-md shadow-md"
          >
            Upload Asset
          </button>

          <button
            onClick={() => inputRef.current?.click()}
            className="sm:hidden text-[11px] bg-[#d4af37] text-black p-2 rounded-md shadow-md"
            aria-label="Upload Asset"
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
            aria-label="Sign Out"
            className="text-xs text-[#d4af37] hover:text-white transition-colors flex items-center gap-1.5 shrink-0 max-md:p-1.5 max-md:rounded-md max-md:hover:bg-white/5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="md:hidden shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>
      {uploadSession && <UploadStatusBar session={uploadSession} />}
      </div>
    </>
  );
}
