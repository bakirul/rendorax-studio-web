"use client";

import React from "react";
import MediaUploader from "@/components/MediaUploader";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import type { R2UploadResult } from "@/utils/r2Upload";

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (
    result: R2UploadResult,
    file: File,
  ) => void | Promise<MediaAssetRecord | void>;
}

export default function MediaUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: MediaUploadModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-white/10 bg-[#121217] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
              Review Versions
            </p>
            <h2 className="mt-1 text-sm font-semibold text-white">
              Upload Review Version
            </h2>
            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
              Upload a project-linked version for client review, comments,
              comparison, and approval.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-gray-500 transition-colors hover:border-white/20 hover:text-white"
            aria-label="Close upload modal"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <MediaUploader
          onUploadSuccess={onUploadSuccess}
          onFinished={onClose}
        />
      </div>
    </div>
  );
}
