"use client";
import React, { useState, useEffect } from "react";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName: string;
}

export default function RenameModal({ isOpen, onClose, onConfirm, currentName }: RenameModalProps) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const isChanged = newName.trim() !== "" && newName.trim() !== currentName;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md font-sans">
      <div className="bg-[#121217] border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
        <h3 className="text-lg font-semibold text-white mb-2">Rename File</h3>
        <p className="text-xs text-gray-400 mb-6">Enter a new name for this asset.</p>
        
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full bg-black/50 border border-white/10 p-3 rounded-md text-white text-sm focus:border-[#d4af37] focus:outline-none transition-colors mb-6"
          placeholder="New file name"
        />
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (isChanged) onConfirm(newName.trim());
            }}
            disabled={!isChanged}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              isChanged 
                ? "bg-[#d4af37] text-black hover:bg-[#b8952b] shadow-lg" 
                : "bg-white/5 text-gray-500 cursor-not-allowed"
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
