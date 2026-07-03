"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { useGlobalStore } from "@/store/useGlobalStore";
import { resolveSpeechLanguage } from "@/utils/languageCodes";

interface UseLiveMicTranslationOptions {
  socket: Socket | null;
  user: { app_metadata?: { role?: string } } | null;
  enabled: boolean;
  speakTranslations?: boolean;
}

export function useLiveMicTranslation({
  socket,
  user,
  enabled,
  speakTranslations = false,
}: UseLiveMicTranslationOptions) {
  const selectedLanguage = useGlobalStore((state) => state.selectedLanguage);
  const recognitionRef = useRef<any>(null);
  const speechLanguage = resolveSpeechLanguage(selectedLanguage);
  const speechLanguageRef = useRef(speechLanguage);

  const isEditor =
    user?.app_metadata?.role === "admin" ||
    user?.app_metadata?.role === "editor";

  useEffect(() => {
    speechLanguageRef.current = speechLanguage;
  }, [speechLanguage]);

  useEffect(() => {
    if (isEditor || typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = speechLanguage.sttCode;

    recognition.onresult = (event: any) => {
      const transcript =
        event.results[event.results.length - 1]?.[0]?.transcript?.trim();
      if (!transcript || !socket) return;

      socket.emit("translate-speech", {
        text: transcript,
        targetLang: speechLanguageRef.current.geminiName,
      });
    };

    recognition.onerror = (event: any) => {
      console.warn("[LiveMicTranslation] Speech recognition error:", event?.error);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore stop errors during teardown
      }
      recognitionRef.current = null;
    };
  }, [isEditor, socket, speechLanguage.sttCode]);

  useEffect(() => {
    if (isEditor || !enabled) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLanguage.sttCode;
    }

    try {
      recognitionRef.current?.start();
    } catch {
      // ignore duplicate start attempts
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, [enabled, isEditor, speechLanguage.sttCode]);

  useEffect(() => {
    if (!socket || isEditor || !speakTranslations) return;

    const handleTranslatedSpeech = (data: { translated?: string }) => {
      if (!data.translated || typeof window === "undefined") return;
      if (!window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data.translated);
      utterance.lang = speechLanguageRef.current.sttCode;
      window.speechSynthesis.speak(utterance);
    };

    socket.on("receive-translated-speech", handleTranslatedSpeech);

    return () => {
      socket.off("receive-translated-speech", handleTranslatedSpeech);
    };
  }, [socket, isEditor, speakTranslations]);
}
