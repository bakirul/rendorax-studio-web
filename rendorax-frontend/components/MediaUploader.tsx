"use client";

import React, { useCallback, useRef, useState } from "react";
import { uploadMediaToR2, type R2UploadResult } from "@/utils/r2Upload";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import {
  resolveAssetDisplayStatus,
  resolveUploadDisplayStatus,
} from "@/utils/mediaUploadStatus";
import AssetProcessingBadge from "@/components/dashboard/AssetProcessingBadge";

export type MediaUploadState = "idle" | "uploading" | "success" | "error";

const ACCEPTED_MIME_PREFIXES = ["video/", "image/"];
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024 * 1024 * 1024; // 5 TB — R2 multipart limit

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isAcceptedMedia(file: File): boolean {
  return ACCEPTED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));
}

export interface MediaUploaderProps {
  onUploadSuccess: (
    result: R2UploadResult,
    file: File,
  ) => void | Promise<MediaAssetRecord | void>;
  onUploadError?: (error: string) => void;
  onFinished?: () => void;
  className?: string;
  disabled?: boolean;
  maxSizeBytes?: number;
}

export default function MediaUploader({
  onUploadSuccess,
  onUploadError,
  onFinished,
  className = "",
  disabled = false,
  maxSizeBytes = DEFAULT_MAX_BYTES,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MediaUploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [savedAsset, setSavedAsset] = useState<MediaAssetRecord | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setError(null);
    setSelectedFile(null);
    setPublicUrl(null);
    setSavedAsset(null);
    setIsDragOver(false);
    setIsFinalizing(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!isAcceptedMedia(file)) {
        return "Only video and image files are supported.";
      }
      if (file.size > maxSizeBytes) {
        return `File exceeds the ${formatBytes(maxSizeBytes)} limit.`;
      }
      return null;
    },
    [maxSizeBytes],
  );

  const startUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setState("error");
        setError(validationError);
        onUploadError?.(validationError);
        return;
      }

      setSelectedFile(file);
      setState("uploading");
      setProgress(0);
      setIsFinalizing(false);
      setError(null);
      setPublicUrl(null);
      setSavedAsset(null);

      const reportProgress = (value: number) => {
        setProgress(value);
        if (value >= 100) {
          setIsFinalizing(true);
        }
      };

      try {
        const result = await uploadMediaToR2(file, reportProgress);
        setPublicUrl(result.publicUrl);
        const asset = await onUploadSuccess(result, file);
        if (asset) {
          setSavedAsset(asset);
        }
        setState("success");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed unexpectedly.";
        setState("error");
        setError(message);
        onUploadError?.(message);
      }
    },
    [onUploadError, onUploadSuccess, validateFile],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || disabled || state === "uploading")
        return;
      startUpload(files[0]);
    },
    [disabled, startUpload, state],
  );

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (disabled || state === "uploading") return;
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled || state === "uploading") return;
    handleFiles(event.dataTransfer.files);
  };

  const isInteractive = !disabled && state !== "uploading";
  const uploadStatus =
    state === "uploading" && selectedFile
      ? resolveUploadDisplayStatus({
          fileName: selectedFile.name,
          progress,
          phase: isFinalizing || progress >= 100 ? "finalizing" : "uploading",
        })
      : state === "success" && selectedFile
        ? resolveUploadDisplayStatus({
            fileName: selectedFile.name,
            progress: 100,
            phase: "complete",
          })
        : null;
  const processingStatus = savedAsset
    ? resolveAssetDisplayStatus(savedAsset)
    : null;

  return (
    <div className={`w-full ${className}`}>
      <div
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        aria-disabled={!isInteractive}
        onClick={() => isInteractive && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (
            isInteractive &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300
          ${isDragOver ? "border-[#d4af37] bg-[#d4af37]/10 scale-[1.01]" : "border-white/10 bg-[#0a0a0f]/80"}
          ${isInteractive ? "cursor-pointer hover:border-[#d4af37]/60 hover:bg-[#121217]" : "cursor-not-allowed opacity-60"}
          ${state === "success" ? "border-emerald-500/40 bg-emerald-950/20" : ""}
          ${state === "error" ? "border-red-500/40 bg-red-950/10" : ""}
        `}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),_transparent_60%)]" />

        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-10 text-center">
          {state === "idle" && (
            <>
              <div
                className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors ${
                  isDragOver
                    ? "border-[#d4af37]/50 bg-[#d4af37]/15 text-[#d4af37]"
                    : "border-white/10 bg-[#121217] text-gray-400"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-semibold tracking-wide text-white">
                {isDragOver
                  ? "Drop your media here"
                  : "Drag & drop video or image"}
              </p>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-500">
                MP4, MOV, WebM, JPG, PNG, WebP and more. Max{" "}
                {formatBytes(maxSizeBytes)}.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                Browse files
              </span>
            </>
          )}

          {state === "uploading" && selectedFile && (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10">
                <svg
                  className="h-8 w-8 animate-spin text-[#d4af37]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">
                {uploadStatus?.label ?? "Uploading…"}
              </p>
              <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                {selectedFile.name} · {formatBytes(selectedFile.size)}
              </p>
              {uploadStatus?.showProgress && (
                <div className="mt-5 w-full max-w-md">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <span>Progress</span>
                    <span className="text-[#d4af37]">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8a701e] to-[#d4af37] transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {state === "success" && selectedFile && publicUrl && (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">
                {uploadStatus?.label ?? "Upload Complete"}
              </p>
              <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                {selectedFile.name}
              </p>
              {processingStatus && (
                <div className="pointer-events-auto mt-4 flex justify-center">
                  <AssetProcessingBadge status={processingStatus} />
                </div>
              )}
              <p className="mt-3 max-w-md truncate rounded-md border border-white/10 bg-black/30 px-3 py-2 font-mono text-[10px] text-emerald-300/90">
                {publicUrl}
              </p>
              <div className="pointer-events-auto mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    reset();
                  }}
                  className="rounded-md border border-white/10 bg-[#121217] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 transition-colors hover:border-[#d4af37]/40 hover:text-white"
                >
                  Upload another
                </button>
                {onFinished && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFinished();
                    }}
                    className="rounded-md border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37] transition-colors hover:bg-[#d4af37]/20"
                  >
                    Done
                  </button>
                )}
              </div>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">Failed</p>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-red-300/90">
                {error}
              </p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  reset();
                }}
                className="pointer-events-auto mt-5 rounded-md border border-red-500/30 bg-red-950/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-200 transition-colors hover:bg-red-900/40"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*"
        className="hidden"
        disabled={disabled || state === "uploading"}
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
