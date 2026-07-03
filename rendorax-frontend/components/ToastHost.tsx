"use client";

import React from "react";
import { useToastStore } from "@/store/useToastStore";

const typeStyles: Record<string, string> = {
  success: "border-[#d4af37]/40 bg-[#121217] text-gray-100",
  error: "border-red-500/40 bg-red-950/40 text-red-100",
  warning: "border-amber-500/40 bg-amber-950/30 text-amber-100",
};

export default function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 text-xs shadow-2xl backdrop-blur-md ${typeStyles[toast.type]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="leading-relaxed">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-gray-400 transition-colors hover:text-white"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
