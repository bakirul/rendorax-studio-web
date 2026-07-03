export interface LiveChatTranslationResult {
  text: string;
  translated: boolean;
  translationFailed?: boolean;
}

export async function translateIncomingChatMessage(
  text: string,
  targetLanguage: string,
): Promise<LiveChatTranslationResult> {
  const trimmed = text.trim();
  if (!trimmed || !targetLanguage.trim()) {
    return { text, translated: false };
  }

  try {
    const res = await fetch("/api/translate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, targetLanguage }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      translatedText?: string;
      error?: string;
    };

    if (!res.ok || !data.translatedText?.trim()) {
      console.warn("[LiveChat] Translation API failed:", {
        status: res.status,
        error: data.error ?? "No translatedText in response",
        targetLanguage,
      });
      return {
        text: `${trimmed} (Translation Failed)`,
        translated: false,
        translationFailed: true,
      };
    }

    return {
      text: data.translatedText.trim(),
      translated: true,
    };
  } catch (error) {
    console.warn("[LiveChat] Translation request error:", error);
    return {
      text: `${trimmed} (Translation Failed)`,
      translated: false,
      translationFailed: true,
    };
  }
}
