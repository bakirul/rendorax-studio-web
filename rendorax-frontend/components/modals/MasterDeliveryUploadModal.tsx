"use client";

import React, { useState } from "react";
import MediaUploader from "@/components/MediaUploader";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import type { R2UploadResult } from "@/utils/r2Upload";

export type MasterDeliverySourceOption = {
  id: string;
  fileName: string;
};

interface MasterDeliveryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceOptions: MasterDeliverySourceOption[];
  defaultSourceReviewAssetId?: string | null;
  projectRequired?: boolean;
  onUploadSuccess: (
    result: R2UploadResult,
    file: File,
    meta: { sourceReviewAssetId: string | null },
  ) => void | Promise<MediaAssetRecord | void>;
}

export default function MasterDeliveryUploadModal({
  isOpen,
  onClose,
  sourceOptions,
  defaultSourceReviewAssetId = null,
  projectRequired = false,
  onUploadSuccess,
}: MasterDeliveryUploadModalProps) {
  const [sourceReviewAssetId, setSourceReviewAssetId] = useState<string>(
    defaultSourceReviewAssetId ?? "",
  );

  React.useEffect(() => {
    if (!isOpen) return;
    setSourceReviewAssetId(defaultSourceReviewAssetId ?? "");
  }, [isOpen, defaultSourceReviewAssetId]);

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
              Master Delivery
            </p>
            <h2 className="mt-1 text-sm font-semibold text-white">
              Upload Master Delivery
            </h2>
            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
              Upload the final delivery file for this project. Optionally link
              the source Review Version for lineage.
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

        {projectRequired ? (
          <p className="mb-4 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            Select an active project before uploading Master Delivery.
          </p>
        ) : (
          <div className="mb-4">
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
              Source Review Version
            </label>
            <select
              value={sourceReviewAssetId}
              onChange={(e) => setSourceReviewAssetId(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-[#d4af37]"
            >
              <option value="">No source version</option>
              {sourceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.fileName}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[10px] text-gray-600">
              Optional. Approval / Picture Lock is not required in this phase.
            </p>
          </div>
        )}

        <MediaUploader
          disabled={projectRequired}
          onUploadSuccess={(result, file) =>
            onUploadSuccess(result, file, {
              sourceReviewAssetId: sourceReviewAssetId.trim() || null,
            })
          }
          onFinished={onClose}
        />
      </div>
    </div>
  );
}
