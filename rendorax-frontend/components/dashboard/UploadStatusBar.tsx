"use client";

import React from "react";
import type { ClientUploadSession } from "@/utils/mediaUploadStatus";
import { resolveUploadDisplayStatus } from "@/utils/mediaUploadStatus";

interface UploadStatusBarProps {
  session: ClientUploadSession;
}

function StatusSpinner() {
  return (
    <svg
      className="h-4 w-4 shrink-0 animate-spin text-[#d4af37]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
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
  );
}

function StatusCheckmark() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-emerald-400"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function UploadStatusBar({ session }: UploadStatusBarProps) {
  const status = resolveUploadDisplayStatus(session);
  const isComplete = session.phase === "complete";
  const isProcessing = session.phase === "processing";

  return (
    <div className="border-b border-white/5 bg-[#0a0a0f]/95 px-4 py-2 shrink-0">
      <div className="mx-auto flex max-w-4xl flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {isComplete && <StatusCheckmark />}
            {!isComplete && !isProcessing && <StatusSpinner />}
            <div className="min-w-0">
              <p
                className={`truncate text-[10px] font-bold uppercase tracking-[0.2em] ${
                  isComplete
                    ? "text-emerald-400"
                    : status.tone === "error"
                      ? "text-red-300"
                      : "text-[#d4af37]"
                }`}
              >
                {status.label}
              </p>
              <p className="truncate text-xs text-gray-400">{session.fileName}</p>
            </div>
          </div>
          {status.showProgress && status.progress != null && (
            <span className="shrink-0 text-[10px] font-bold tabular-nums text-[#d4af37]">
              {status.progress}%
            </span>
          )}
          {session.phase === "failed" && session.errorMessage && (
            <span className="truncate text-xs text-red-300/90">
              {session.errorMessage}
            </span>
          )}
        </div>
        {status.showProgress && (
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8a701e] to-[#d4af37] transition-all duration-300 ease-out"
              style={{
                width: `${Math.max(0, Math.min(100, status.progress ?? 0))}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
