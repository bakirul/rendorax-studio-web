"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rendorax-workspace-context-expanded";

type WorkspaceContextProps = {
  children: React.ReactNode;
};

export default function WorkspaceContext({ children }: WorkspaceContextProps) {
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setExpanded(true);
    } catch {
      /* ignore storage errors */
    }
    setHydrated(true);
  }, []);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  return (
    <div className="relative z-10 shrink-0 border-b border-white/5 bg-[#0a0a0f]">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/[0.03] sm:px-6"
        aria-expanded={expanded}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-200">
          Workspace Context
        </span>
        <span
          className="text-[10px] text-gray-500 transition-transform"
          aria-hidden
        >
          {expanded ? "▾" : "▸"}
        </span>
        {!expanded && hydrated ? (
          <span className="ml-auto truncate text-[10px] text-gray-600">
            Organization · Requests · Summary
          </span>
        ) : null}
      </button>

      {expanded ? (
        <div className="space-y-0 border-t border-white/5 px-4 pb-3 pt-1 sm:px-6">
          {children}
        </div>
      ) : null}
    </div>
  );
}
