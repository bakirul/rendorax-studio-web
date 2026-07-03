"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { resolveChatLanguage } from "@/utils/languageCodes";

interface AiMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  image?: string | null;
  langUsed?: string;
}

const AI_WELCOME_MESSAGE: AiMessage = {
  id: "welcome",
  sender: "ai",
  text: "Hello! I am your Rendorax AI assistant. How can I help you with your video review today?",
  langUsed: "en",
};

export default function ChatbotWidget() {
  const { selectedLanguage } = useGlobalStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [aiMessages, setAiMessages] = useState<AiMessage[]>([AI_WELCOME_MESSAGE]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const quickEmojis = ["😀", "😂", "😍", "👍", "🔥", "🚀", "🎉", "❤️", "🙏", "✨"];

  const suggestions = [
    "💡 Leave timestamped comment",
    "📁 Upload video version",
    "🔒 Check video privacy",
  ];

  const anchorClass = "bottom-6 right-6";

  const handleSpeak = (text: string, langCode: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceMap: Record<string, string> = {
      bn: "bn-BD",
      en: "en-US",
      es: "es-ES",
      ar: "ar-SA",
      fr: "fr-FR",
      de: "de-DE",
      zh: "zh-CN",
      hi: "hi-IN",
      ja: "ja-JP",
    };
    utterance.lang = voiceMap[langCode] || "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend = inputText) => {
    if (!textToSend.trim() && !attachedImage) return;
    if (isLoading) return;

    const userText = textToSend;
    const userImg = attachedImage;
    const chatLanguage = resolveChatLanguage(selectedLanguage);

    const newUserMessage: AiMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userText,
      image: userImg,
    };

    setAiMessages((prev) => [...prev, newUserMessage]);
    setInputText("");
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          selectedLanguage: chatLanguage,
        }),
      });

      const data = await response.json();
      const aiResponseText = data.text || data.message || data.reply || data.response;

      if (response.ok && aiResponseText) {
        setAiMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: aiResponseText,
            langUsed: chatLanguage,
          },
        ]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("AI chat API error:", error);
      setAiMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text:
            error instanceof Error
              ? `I couldn't reach the AI service: ${error.message}`
              : "I couldn't reach the AI service. Please try again.",
          langUsed: "en",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearChat = () => {
    if (confirm("Clear current conversation?")) {
      setAiMessages([{ ...AI_WELCOME_MESSAGE, id: Date.now().toString() }]);
    }
  };

  const getWindowClassName = () => {
    const base =
      "fixed z-50 flex flex-col bg-black/80 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-300 font-sans";

    if (isFullScreen) {
      return `${base} inset-4 rounded-2xl`;
    }

    if (isMinimized) {
      return `${base} ${anchorClass} w-[calc(100vw-2rem)] sm:w-72 max-w-[288px] rounded-t-2xl`;
    }

    return `${base} ${anchorClass} w-[calc(100vw-2rem)] sm:w-[450px] max-w-[450px] h-[650px] max-h-[85vh] rounded-2xl`;
  };

  if (!hasHydrated) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${anchorClass} z-50 p-4 bg-black/60 backdrop-blur-md border border-[#d4af37]/30 hover:border-[#d4af37]/60 text-white rounded-full shadow-2xl hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-300 group`}
          aria-label="Open Rendorax AI assistant"
        >
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#d4af37]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="text-sm font-medium text-white/90 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
              Rendorax AI
            </span>
          </div>
        </button>
      )}

      {isOpen && (
        <div className={getWindowClassName()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
              <span className="text-sm font-semibold text-white tracking-wide">
                Rendorax AI
              </span>
            </div>

            <div className="flex items-center space-x-2 text-white/50">
              {!isMinimized && (
                <button
                  onClick={clearChat}
                  className="hover:text-white transition-colors p-1 text-sm"
                  title="Clear"
                >
                  🔄
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:text-white transition-colors p-1"
              >
                {isMinimized ? "🔳" : "➖"}
              </button>
              {!isMinimized && (
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="hover:text-white transition-colors p-1 text-sm"
                >
                  {isFullScreen ? "🗗" : "🗖"}
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsFullScreen(false);
                  setIsMinimized(false);
                }}
                className="hover:text-red-400 transition-colors p-1 text-sm ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 custom-scrollbar">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-end space-x-2`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm relative group backdrop-blur-sm ${
                      msg.sender === "user"
                        ? "bg-white/10 border border-white/10 text-white rounded-br-sm"
                        : "bg-black/40 border border-white/5 text-white/90 rounded-bl-sm"
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Sent"
                        className="w-48 h-auto rounded-xl mb-3 border border-white/10"
                      />
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.sender === "ai" && (
                      <button
                        onClick={() => handleSpeak(msg.text, msg.langUsed || "en")}
                        className="absolute -bottom-6 left-2 text-[10px] uppercase font-medium tracking-wide text-white/40 hover:text-white transition-colors"
                      >
                        🔊 Play
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-2xl text-sm border bg-black/40 border-white/5 text-white/50 rounded-bl-none flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isMinimized && (
            <div className="p-5 border-t border-white/10 bg-black/40 rounded-b-2xl">
              {aiMessages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleSendMessage(sug.substring(3))}
                      className="text-[11px] font-medium bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 px-3.5 py-2 rounded-full transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-28 left-5 bg-black/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl grid grid-cols-5 gap-2 z-50">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputText((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:bg-white/10 p-2 rounded-xl text-xl transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {attachedImage && (
                <div className="mb-4 relative inline-block">
                  <img
                    src={attachedImage}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-white/20 shadow-lg"
                  />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-2 -right-2 bg-black text-white/70 hover:text-white w-5 h-5 rounded-full text-[10px] border border-white/20 flex items-center justify-center shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-end bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl px-4 py-3 transition-colors shadow-inner">
                <div className="flex items-center space-x-2 pb-0.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white/50 hover:text-white p-1.5 transition-colors rounded-lg hover:bg-white/10"
                    title="Attach"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-white/50 hover:text-white p-1.5 transition-colors rounded-lg hover:bg-white/10"
                    title="Emoji"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isRecording ? "Listening..." : "Ask Rendorax AI..."}
                  disabled={isRecording || isLoading}
                  rows={1}
                  className="w-full bg-transparent text-[13px] text-white placeholder-white/40 focus:outline-none px-3 resize-none max-h-32 py-1.5 scrollbar-none"
                />

                <div className="flex items-center space-x-1 pb-0.5 ml-2">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`p-2 rounded-xl transition-all relative ${
                      isRecording
                        ? "text-red-400 bg-red-400/10 animate-pulse"
                        : "text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                    title="Voice input is available in Live Session mic translation"
                    disabled
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 opacity-40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || (!inputText.trim() && !attachedImage)}
                    className={`p-2 rounded-xl transition-all ${
                      isLoading || (!inputText.trim() && !attachedImage)
                        ? "text-white/20 cursor-not-allowed"
                        : "text-white bg-white/10 hover:bg-white/20 shadow-sm"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
