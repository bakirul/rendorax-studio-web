// components/VaultSidebar.tsx
import React from "react";

interface SidebarProps {
  currentFolder: string;
  folders: any[];
  onFolderClick: (folderName: string) => void;
  onRootClick: () => void;
  onCreateFolder: () => void;
  onDeleteFolder: (folderName: string) => void;
}

export default function VaultSidebar({ 
  currentFolder, folders, onFolderClick, onRootClick, onCreateFolder, onDeleteFolder 
}: SidebarProps) {
  const pathParts = currentFolder ? currentFolder.split("/") : [];

  return (
    <aside className="w-full h-full bg-[#0a0a0f] flex flex-col shrink-0">
      <div className="h-14 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Directories</h3>
        <button onClick={onCreateFolder} className="text-[#d4af37] hover:text-white transition-colors" title="New Folder">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        <button onClick={onRootClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${currentFolder === "" ? "bg-[#d4af37]/10 text-[#d4af37]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
          <span className="text-lg">🏠</span> Root Vault
        </button>

        {pathParts.map((part, idx) => {
          const path = pathParts.slice(0, idx + 1).join("/");
          return (
            <div key={path} className="pl-4 mt-1">
              <button onClick={() => onFolderClick(path)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${currentFolder === path ? "bg-[#d4af37]/10 text-[#d4af37]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                <span className="text-lg">📂</span> {part}
              </button>
            </div>
          );
        })}

        {folders.length > 0 && (
          <div className={`pt-3 ${currentFolder ? "pl-8" : "pl-4"}`}>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2 px-3">Subfolders</p>
            {folders.map((f) => (
              <div key={f.name} className="group/folder flex items-center justify-between rounded-md text-xs font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors pr-2">
                <button onClick={() => onFolderClick(f.name)} className="flex-1 flex items-center gap-3 px-3 py-2 text-left truncate">
                  <span className="text-lg">📁</span> <span className="truncate">{f.name}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(f.name); }} className="opacity-0 group-hover/folder:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all" title="Delete Folder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}