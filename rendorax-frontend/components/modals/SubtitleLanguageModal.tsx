"use client";

import React, { useEffect, useState } from "react";
import { normalizeLanguageKey, getLanguageLabel } from "@/utils/languageCodes";

const QUICK_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "ja", label: "Japanese" },
];

interface SubtitleLanguageModalProps {
  isOpen: boolean;
  fileName: string;
  defaultLanguage?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (languageCode: string) => void;
}

export default function SubtitleLanguageModal({
  isOpen,
  fileName,
  defaultLanguage = "en",
  isSubmitting = false,
  onClose,
  onConfirm,
}: SubtitleLanguageModalProps) {
  const [languageCode, setLanguageCode] = useState(defaultLanguage);

  useEffect(() => {
    if (isOpen) {
      setLanguageCode(normalizeLanguageKey(defaultLanguage));
    }
  }, [defaultLanguage, isOpen]);

  if (!isOpen) return null;

  const normalized = normalizeLanguageKey(languageCode);
  const isValid = Boolean(normalized);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 font-sans">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#121217] p-6 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
          Closed Captions
        </p>
        <h3 className="mt-1 text-lg font-semibold text-white">
          Generate Subtitles
        </h3>
        <p className="mt-2 text-xs text-gray-400">
          Choose the transcription language for{" "}
          <span className="text-gray-200">{fileName}</span>.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              disabled={isSubmitting}
              onClick={() => setLanguageCode(lang.code)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                normalized === lang.code
                  ? "border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37]"
                  : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <label className="mt-5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Language code
        </label>
        <input
          type="text"
          value={languageCode}
          disabled={isSubmitting}
          onChange={(event) => setLanguageCode(event.target.value)}
          placeholder="e.g. en, bn, es"
          className="mt-2 w-full rounded-md border border-white/10 bg-black/50 p-3 text-sm text-white transition-colors focus:border-[#d4af37] focus:outline-none"
        />
        <p className="mt-2 text-[11px] text-gray-500">
          Preview label: {getLanguageLabel(normalized)}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={() => onConfirm(normalized)}
            className={`rounded-md px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              isValid && !isSubmitting
                ? "bg-[#d4af37] text-black hover:bg-[#b8952b] shadow-lg"
                : "cursor-not-allowed bg-white/5 text-gray-500"
            }`}
          >
            {isSubmitting ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
