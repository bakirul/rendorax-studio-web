const LANGUAGE_PROFILES: Record<
  string,
  { geminiName: string; sttCode: string; chatCode: string }
> = {
  en: { geminiName: "English", sttCode: "en-US", chatCode: "en" },
  bn: { geminiName: "Bengali", sttCode: "bn-BD", chatCode: "bn" },
  hi: { geminiName: "Hindi", sttCode: "hi-IN", chatCode: "hi" },
  es: { geminiName: "Spanish", sttCode: "es-ES", chatCode: "es" },
  ar: { geminiName: "Arabic", sttCode: "ar-SA", chatCode: "ar" },
  fr: { geminiName: "French", sttCode: "fr-FR", chatCode: "fr" },
  de: { geminiName: "German", sttCode: "de-DE", chatCode: "de" },
  zh: { geminiName: "Mandarin Chinese", sttCode: "zh-CN", chatCode: "zh" },
  ja: { geminiName: "Japanese", sttCode: "ja-JP", chatCode: "ja" },
  ru: { geminiName: "Russian", sttCode: "ru-RU", chatCode: "ru" },
  pt: { geminiName: "Portuguese", sttCode: "pt-BR", chatCode: "pt" },
  it: { geminiName: "Italian", sttCode: "it-IT", chatCode: "it" },
  ko: { geminiName: "Korean", sttCode: "ko-KR", chatCode: "ko" },
  tr: { geminiName: "Turkish", sttCode: "tr-TR", chatCode: "tr" },
  nl: { geminiName: "Dutch", sttCode: "nl-NL", chatCode: "nl" },
  pl: { geminiName: "Polish", sttCode: "pl-PL", chatCode: "pl" },
  vi: { geminiName: "Vietnamese", sttCode: "vi-VN", chatCode: "vi" },
  th: { geminiName: "Thai", sttCode: "th-TH", chatCode: "th" },
  id: { geminiName: "Indonesian", sttCode: "id-ID", chatCode: "id" },
  sv: { geminiName: "Swedish", sttCode: "sv-SE", chatCode: "sv" },
};

export function normalizeLanguageKey(language: string): string {
  const trimmed = language.trim();
  if (!trimmed) return "en";
  const short = trimmed.split("-")[0]?.toLowerCase();
  return short || "en";
}

export function resolveSpeechLanguage(language: string) {
  const key = normalizeLanguageKey(language);
  return LANGUAGE_PROFILES[key] ?? LANGUAGE_PROFILES.en;
}

export function resolveChatLanguage(language: string): string {
  return resolveSpeechLanguage(language).chatCode;
}

export function getLanguageLabel(language: string): string {
  const key = normalizeLanguageKey(language);
  const profile = LANGUAGE_PROFILES[key];
  if (!profile) return language.toUpperCase();
  return profile.geminiName;
}
