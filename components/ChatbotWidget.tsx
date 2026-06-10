"use client";

import React, { useState, useRef } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  image?: string | null;
  langUsed?: string; // কোন ভাষায় উত্তর এসেছে তা ট্র্যাক করার জন্য
}

export default function ChatbotWidget() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const userLanguage = useDashboardStore((state) => state.userLanguage);
  
  // ⚡ কোর চ্যাট স্টেটস
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); 
  
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "ai", text: "Hello! I am your Kachna AI assistant. How can I help you with your video review today?", langUsed: "en" }
  ]);
  
  React.useEffect(() => {
    setHasHydrated(true);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickEmojis = ["😀", "😂", "😍", "👍", "🔥", "🚀", "🎉", "❤️", "🙏", "✨"];
  
  const suggestions = [
    "💡 How to leave a timestamped comment?",
    "📁 Can I upload multiple video versions?",
    "🔒 Is my video private?",
  ];

  // 🔊 আপডেট করা হ্যান্ডলার: পজ বা স্টপ করার সুবিধাসহ
const handleSpeak = (text: string, langCode: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
  
    // যদি বর্তমানে অডিও বাজতে থাকে, তবে তা বন্ধ করো (Stop Logic)
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return; // এখানেই থেমে যাবে
    }
    
    // নতুন করে প্লে করার কোড
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voiceMap: Record<string, string> = {
      bn: "bn-BD", en: "en-US", es: "es-ES", ar: "ar-SA", 
      fr: "fr-FR", de: "de-DE", zh: "zh-CN", hi: "hi-IN", ja: "ja-JP"
    };
    
    utterance.lang = voiceMap[langCode] || "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend = inputText) => {
    if (!textToSend.trim() && !attachedImage) return;
    if (isLoading) return;

    const userText = textToSend;
    const userImg = attachedImage;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: userText,
      image: userImg,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText("");
    setAttachedImage(null);
    setIsLoading(true); 

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          selectedLanguage: userLanguage, 
        }),
      });

      const data = await response.json();

      if (response.ok && data.text) {
        setMessages((prev) => [
          ...prev,
          { 
            id: (Date.now() + 1).toString(), 
            sender: "ai", 
            text: data.text,
            langUsed: userLanguage // স্পিচ ল্যাঙ্গুয়েজ ট্র্যাকিং
          }
        ]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          sender: "ai", 
          text: "Sorry, I am having trouble connecting to the server. Please try again.",
          langUsed: "en"
        }
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
    if(confirm("Clear current conversation?")) {
      setMessages([{ id: "1", sender: "ai", text: "Hello! Fresh start. How can I help you now?", langUsed: "en" }]);
    }
  };

  const getWindowClassName = () => {
    if (isFullScreen) return "fixed inset-4 z-50 flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl transition-all duration-300";
    if (isMinimized) return "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-72 max-w-[288px] z-50 flex flex-col bg-zinc-950 border border-zinc-800 rounded-t-xl shadow-2xl transition-all duration-300";
    return "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[450px] max-w-[450px] h-[650px] max-h-[85vh] z-50 flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl transition-all duration-300";
  };

  if (!hasHydrated) return null;

  return (
    <>
      {/* 🔘 ১. ফ্লোটিং চ্যাট ট্রিগার বাটন */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-4 bg-zinc-900 border border-zinc-800 hover:border-[#d4af37]/50 text-[#d4af37] rounded-full shadow-lg hover:shadow-[#d4af37]/10 transition-all duration-300 group z-50"
        >
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-sm font-medium text-zinc-300 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
              Chat with AI
            </span>
          </div>
        </button>
      )}

      {/* 💻 ২. মেইন চ্যাট উইন্ডো */}
      {isOpen && (
        <div className={getWindowClassName()}>
          
          {/* 🔝 হেডার এরিয়া */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-900/40 rounded-t-xl">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]" />
              <span className="text-sm font-medium text-zinc-200">Kachna AI</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full uppercase">{userLanguage}</span>
            </div>

            {/* হেডার অ্যাকশন কন্ট্রোলস */}
            <div className="flex items-center space-x-2 text-zinc-500">
              {!isMinimized && (
                <button onClick={clearChat} className="hover:text-zinc-300 p-1 text-xs" title="Clear conversation">
                  🔄
                </button>
              )}
              <button onClick={() => setIsMinimized(!isMinimized)} className="hover:text-zinc-200 p-1">
                {isMinimized ? "🔳" : "➖"}
              </button>
              {!isMinimized && (
                <button onClick={() => setIsFullScreen(!isFullScreen)} className="hover:text-zinc-200 p-1 text-xs">
                  {isFullScreen ? "🗗" : "🗖"}
                </button>
              )}
              <button onClick={() => { setIsOpen(false); setIsFullScreen(false); setIsMinimized(false); }} className="hover:text-red-400 p-1 font-bold text-xs">
                ❌
              </button>
            </div>
          </div>

          {/* 💬 মেসেজ বডি */}
          {!isMinimized && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/20 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-end space-x-1`}>
                  
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm border relative group ${
                    msg.sender === "user" 
                      ? "bg-zinc-900 border-zinc-800 text-zinc-200 rounded-tr-none" 
                      : "bg-[#d4af37]/5 border-[#d4af37]/10 text-zinc-300 rounded-tl-none"
                  }`}>
                    {msg.image && (
                      <img src={msg.image} alt="Sent file" className="w-40 h-auto rounded-lg mb-2 border border-zinc-800" />
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* 🔊 স্পীকার বাটন (শুধু AI মেসেজের জন্য এবং হোভার করলে দেখা যাবে) */}
                    {msg.sender === "ai" && (
                      <button 
                        onClick={() => handleSpeak(msg.text, msg.langUsed || "en")}
                        className="absolute -bottom-6 left-1 text-xs text-zinc-500 hover:text-[#d4af37] transition-colors"
                        title="Listen Response"
                      >
                        🔊 Listen
                      </button>
                    )}
                  </div>

                </div>
              ))}

              {/* ✨ টাইপিং ডট অ্যানিমেশন */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-xl text-sm border bg-[#d4af37]/5 border-[#d4af37]/10 text-zinc-400 rounded-tl-none flex items-center space-x-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce [animation-delay:0.2s]">●</span>
                    <span className="animate-bounce [animation-delay:0.4s]">●</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🎙️ ইনপুট এবং অ্যাকশন প্যানেল */}
          {!isMinimized && (
            <div className="p-4 border-t border-zinc-900 bg-zinc-950 rounded-b-xl">
              
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(sug.substring(2))}
                      className="text-xs bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-[#d4af37] hover:border-[#d4af37]/30 px-3 py-1.5 rounded-full transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-24 left-4 bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl grid grid-cols-5 gap-1.5 z-50">
                  {quickEmojis.map((emoji) => (
                    <button key={emoji} onClick={() => { setInputText(prev => prev + emoji); setShowEmojiPicker(false); }} className="hover:bg-zinc-800 p-1 rounded text-lg transition-colors">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {attachedImage && (
                <div className="mb-3 relative inline-block">
                  <img src={attachedImage} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-zinc-800" />
                  <button onClick={() => setAttachedImage(null)} className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-zinc-400 hover:text-red-400 w-4 h-4 rounded-full text-[10px] border border-zinc-800 flex items-center justify-center">✕</button>
                </div>
              )}

              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

              <div className="flex items-end bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-[#d4af37]/40 transition-colors">
                
                <div className="flex items-center space-x-1 pb-1">
                  <button onClick={() => fileInputRef.current?.click()} className="text-zinc-500 hover:text-[#d4af37] p-1 transition-colors" title="Upload Image">
                    📁
                  </button>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-zinc-500 hover:text-[#d4af37] p-1 transition-colors" title="Choose Emoji">
                    😊
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
                  placeholder={isRecording ? "Listening active..." : "Ask kachna AI..."}
                  disabled={isRecording || isLoading}
                  rows={1}
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none px-2 resize-none max-h-32 py-1 scrollbar-none"
                />

                <button 
                  onClick={() => setIsRecording(!isRecording)} 
                  className={`p-1.5 rounded-full transition-all relative pb-1 ${
                    isRecording 
                      ? "text-red-500 bg-red-500/10 animate-pulse scale-110" 
                      : "text-zinc-500 hover:text-[#d4af37]"
                  }`} 
                  title={isRecording ? "Stop Recording" : "Record Audio"}
                >
                  {isRecording ? (
                    <div className="flex items-center justify-center w-5 h-5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                      🛑
                    </div>
                  ) : "🎤"}
                </button>

                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isLoading}
                  className={`p-1.5 transition-colors pb-1 ${isLoading ? "text-zinc-600 cursor-not-allowed" : "text-[#d4af37] hover:text-[#d4af37]/80"}`} 
                  title="Send Message"
                >
                  🚀
                </button>

              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}