"use client";
import React, { useState, useEffect } from "react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assetName: string;
  isFolder?: boolean;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, assetName, isFolder = false }: DeleteModalProps) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = confirmText === assetName;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md font-sans">
      <div className="bg-[#121217] border border-red-500/20 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Delete {isFolder ? "Folder" : "Asset"}</h3>
        </div>
        
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          This action cannot be undone. This will permanently delete the {isFolder ? "folder and ALL its contents" : "file"}. 
          To confirm deletion, type the exact name below: <br/>
          <strong className="text-white select-all block mt-2 p-2 bg-black/50 border border-white/5 rounded font-mono">{assetName}</strong>
        </p>
        
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full bg-black/50 border border-red-500/30 p-3 rounded-md text-white text-sm focus:border-red-500 focus:outline-none transition-colors mb-6 font-mono placeholder:font-sans"
          placeholder="Type name here"
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
              if (isMatched) onConfirm();
            }}
            disabled={!isMatched}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              isMatched 
                ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                : "bg-white/5 text-gray-500 cursor-not-allowed"
            }`}
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
