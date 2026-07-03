"use client";
import React, { useState } from "react";

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (destinationPath: string) => void;
  currentPath: string;
  folders: string[]; // List of available folder paths
}

export default function MoveModal({ isOpen, onClose, onConfirm, currentPath, folders }: MoveModalProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  if (!isOpen) return null;

  // Root is always an option
  const allOptions = ["", ...folders.filter(f => f !== currentPath)];

  const isChanged = selectedFolder !== currentPath;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md font-sans">
      <div className="bg-[#121217] border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all flex flex-col max-h-[80vh]">
        <h3 className="text-lg font-semibold text-white mb-2">Move File</h3>
        <p className="text-xs text-gray-400 mb-6">Select a destination folder.</p>
        
        <div className="flex-1 overflow-y-auto mb-6 bg-black/30 border border-white/5 rounded-md p-2 custom-scrollbar">
          {allOptions.map(folder => (
            <button
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className={`w-full text-left px-3 py-2.5 rounded text-xs font-medium mb-1 transition-colors flex items-center gap-3 ${
                selectedFolder === folder
                  ? "bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30"
                  : "text-gray-300 hover:bg-white/5 border border-transparent"
              }`}
            >
              <span className="text-lg">{folder === "" ? "🏠" : "📂"}</span>
              <span className="truncate">{folder === "" ? "CLIENT VAULT (Root)" : folder}</span>
            </button>
          ))}
        </div>
        
        <div className="flex justify-end gap-3 pt-2 border-t border-white/5 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (isChanged) onConfirm(selectedFolder);
            }}
            disabled={!isChanged}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              isChanged 
                ? "bg-[#d4af37] text-black hover:bg-[#b8952b] shadow-lg" 
                : "bg-white/5 text-gray-500 cursor-not-allowed"
            }`}
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
}
