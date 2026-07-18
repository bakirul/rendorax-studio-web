"use client";

import { useState } from "react";
import VaultSidebar from "@/components/VaultSidebar";

type MobileAssetDrawerProps = {
  currentFolder: string;
  activeBin: "root" | "cloud" | "vault";
  allFolders: string[];
  assetCount: number;
  onFolderClick: (folderName: string) => void;
  onClientVaultRootClick: () => void;
  onBinChange: (bin: "cloud" | "vault") => void;
  onCreateFolder: () => void;
  onDeleteFolder: (folderName: string) => void;
};

/**
 * Mobile-only replacement for the permanent/overlay Project Bin sidebar.
 * Renders a compact ~64px trigger ("Assets (N)") that opens the exact same
 * VaultSidebar folder tree inside a bottom sheet. Selecting a folder closes
 * the sheet automatically so the gallery is immediately visible again.
 * Desktop (lg+) is untouched — this whole component is hidden there.
 */
export default function MobileAssetDrawer({
  currentFolder,
  activeBin,
  allFolders,
  assetCount,
  onFolderClick,
  onClientVaultRootClick,
  onBinChange,
  onCreateFolder,
  onDeleteFolder,
}: MobileAssetDrawerProps) {
  const [open, setOpen] = useState(false);

  const handleFolderClick = (folderName: string) => {
    onFolderClick(folderName);
    setOpen(false);
  };

  const handleClientVaultRootClick = () => {
    onClientVaultRootClick();
    setOpen(false);
  };

  return (
    <div className="relative z-30 shrink-0 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Browse project assets and folders"
        className="flex min-h-[64px] w-full items-center justify-between gap-2 border-b border-white/5 bg-[#0a0a0f] px-4 text-left transition-colors active:bg-white/[0.03]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="text-lg" aria-hidden>
            📁
          </span>
          <span className="min-w-0 truncate text-sm font-medium text-gray-200">
            Assets ({assetCount})
          </span>
        </span>
        <span className="shrink-0 text-gray-500" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl border-t border-white/10 bg-[#0a0a0f] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="relative flex shrink-0 items-center justify-center border-b border-white/5 py-2">
              <div className="h-1.5 w-10 rounded-full bg-white/15" aria-hidden />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close asset browser"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-white"
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <VaultSidebar
                currentFolder={currentFolder}
                activeBin={activeBin}
                allFolders={allFolders}
                onFolderClick={handleFolderClick}
                onClientVaultRootClick={handleClientVaultRootClick}
                onBinChange={onBinChange}
                onCreateFolder={onCreateFolder}
                onDeleteFolder={onDeleteFolder}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
