"use client";
import React, { useEffect, useState, useRef } from "react";
import Peer from "simple-peer";
import { Socket } from "socket.io-client";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useGlobalStore } from "@/store/useGlobalStore";
import { useLiveMicTranslation } from "@/hooks/useLiveMicTranslation";
import { resolveSpeechLanguage } from "@/utils/languageCodes";
import { buildPeerOptions } from "@/utils/webrtcConfig";
import { showToast } from "@/store/useToastStore";
import { translateIncomingChatMessage } from "@/utils/translateLiveChatMessage";

interface LiveSessionProps {
  socket: Socket | null;
  roomId: string;
  user: any;
}

const setMediaBitrate = (sdp: string, bitrate: number) => {
  let lines = sdp.split('\r\n');
  let mLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('m=video')) {
      mLineIndex = i;
      break;
    }
  }
  if (mLineIndex === -1) return sdp;
  let insertIndex = mLineIndex;
  for (let i = mLineIndex; i < lines.length; i++) {
    if (lines[i].startsWith('c=')) {
      insertIndex = i;
      break;
    }
    if (lines[i].startsWith('m=') && i !== mLineIndex) {
      break;
    }
  }
  lines.splice(insertIndex + 1, 0, `b=AS:${bitrate}`);
  return lines.join('\r\n');
};

function isMissingMediaDeviceError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "NotFoundError" ||
    error.name === "NotReadableError" ||
    error.name === "DevicesNotFoundError"
  );
}

const VideoPeer = ({ peer, isMuted }: { peer: Peer.Instance; isMuted?: boolean }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const onStream = (stream: MediaStream) => {
      if (ref.current) ref.current.srcObject = stream;
    };
    peer.on("stream", onStream);
    return () => {
      peer.off("stream", onStream);
      if (ref.current) ref.current.srcObject = null;
    };
  }, [peer]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={isMuted}
      className="w-10 h-10 object-cover rounded-full border border-[#d4af37] shadow-md bg-black shrink-0"
    />
  );
};

export default function LiveSessionWidget({
  socket,
  roomId,
  user,
}: LiveSessionProps) {
  const { isLiveMinimized, setIsLiveMinimized } = useDashboardStore();
  const {
    isLiveSessionActive: hasJoined,
    setIsLiveSessionActive: setHasJoined,
    isMicActive,
    setIsMicActive,
    selectedLanguage,
  } = useGlobalStore();
  const speechProfile = resolveSpeechLanguage(selectedLanguage);
  const liveLanguage = speechProfile.sttCode;
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isTextOnlyMode, setIsTextOnlyMode] = useState(false);

  const [peers, setPeers] = useState<{ peerID: string; peer: Peer.Instance }[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [liveMessages, setLiveMessages] = useState<
    {
      id: string;
      senderName: string;
      text: string;
      timestamp: string;
      translated?: boolean;
      translationFailed?: boolean;
    }[]
  >([]);
  const [newMsg, setNewMsg] = useState("");
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Translation State
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const isTranslationEnabledRef = useRef(false);
  const [liveCaption, setLiveCaption] = useState("");
  
  const captionTimeout = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const syntheticDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const myVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [socketId: string]: Peer.Instance }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveLanguageRef = useRef(liveLanguage);
  const translationTargetRef = useRef(speechProfile.geminiName);
  const localSenderName = user?.email?.split("@")[0] || "User";

  const appendLiveMessage = (
    message: {
      id: string;
      senderName: string;
      text: string;
      timestamp: string;
      translated?: boolean;
      translationFailed?: boolean;
    },
  ) => {
    setLiveMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  useLiveMicTranslation({
    socket,
    user,
    enabled: hasJoined && isMicActive,
    speakTranslations: hasJoined,
  });

  useEffect(() => {
    liveLanguageRef.current = liveLanguage;
    translationTargetRef.current = speechProfile.geminiName;
    if (socket && hasJoined) {
      socket.emit("join-room-language", liveLanguage);
    }
  }, [liveLanguage, speechProfile.geminiName, socket, hasJoined]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (hasJoined && !isLiveMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveMessages, isLiveMinimized, hasJoined]);

  useEffect(() => {
    if (!socket || !roomId || !hasJoined) return;

    let cancelled = false;
    const handlers: Record<string, (...args: any[]) => void> = {};

    const detachSocketHandlers = () => {
      if (handlers.userConnected) socket.off("user-connected", handlers.userConnected);
      if (handlers.webrtcOffer) socket.off("webrtc-offer", handlers.webrtcOffer);
      if (handlers.webrtcAnswer) socket.off("webrtc-answer", handlers.webrtcAnswer);
      if (handlers.userDisconnected) socket.off("user-disconnected", handlers.userDisconnected);
      if (handlers.receiveChatMessage) socket.off("receive-chat-message", handlers.receiveChatMessage);
      if (handlers.liveCaption) socket.off("live-caption", handlers.liveCaption);
      if (handlers.translatedAudioChunk) socket.off("translated-audio-chunk", handlers.translatedAudioChunk);
    };

    const cleanupMediaAndPeers = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (captionTimeout.current) clearTimeout(captionTimeout.current);

      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};
      setPeers([]);
      setStream(null);
      if (myVideo.current) myVideo.current.srcObject = null;
    };

    const registerSocketHandlers = (mediaStream: MediaStream | null) => {
      if (mediaStream) {
        handlers.userConnected = (userId: string, socketId: string) => {
          const peer = new Peer(
            buildPeerOptions({ initiator: true, stream: mediaStream }),
          );

          peer.on("signal", (signal: any) => {
            if (signal.type === "offer" || signal.type === "answer") {
              signal.sdp = setMediaBitrate(signal.sdp, 2500);
            }
            socket.emit("webrtc-offer", {
              targetSocketId: socketId,
              callerId: user?.id,
              sdp: signal,
            });
          });

          peer.on("error", (err) => {
            console.error("Live session peer error (outgoing):", err);
          });

          peersRef.current[socketId] = peer;
          setPeers((prev) => [...prev, { peerID: socketId, peer }]);
        };
        socket.on("user-connected", handlers.userConnected);

        handlers.webrtcOffer = (data: any) => {
          const peer = new Peer(
            buildPeerOptions({ initiator: false, stream: mediaStream }),
          );

          peer.on("signal", (signal: any) => {
            if (signal.type === "offer" || signal.type === "answer") {
              signal.sdp = setMediaBitrate(signal.sdp, 2500);
            }
            socket.emit("webrtc-answer", {
              targetSocketId: data.callerSocketId,
              sdp: signal,
            });
          });

          peer.on("error", (err) => {
            console.error("Live session peer error (incoming):", err);
          });

          peer.signal(data.sdp);
          peersRef.current[data.callerSocketId] = peer;
          setPeers((prev) => [...prev, { peerID: data.callerSocketId, peer }]);
        };
        socket.on("webrtc-offer", handlers.webrtcOffer);

        handlers.webrtcAnswer = (data: any) => {
          const peer = peersRef.current[data.answererSocketId];
          if (peer) peer.signal(data.sdp);
        };
        socket.on("webrtc-answer", handlers.webrtcAnswer);

        handlers.userDisconnected = (socketId: string) => {
          if (peersRef.current[socketId]) {
            peersRef.current[socketId].destroy();
            delete peersRef.current[socketId];
          }
          setPeers((prev) => prev.filter((p) => p.peerID !== socketId));
        };
        socket.on("user-disconnected", handlers.userDisconnected);
      }

      handlers.receiveChatMessage = async (msg: any) => {
        const incomingId =
          msg.id ??
          `${msg.timestamp ?? ""}:${msg.senderSocketId ?? msg.senderName}:${msg.text}`;

        if (msg.senderSocketId && msg.senderSocketId === socket.id) {
          return;
        }

        const incoming = {
          id: incomingId,
          senderName: msg.senderName ?? "User",
          text: String(msg.text ?? "").trim(),
          timestamp: msg.timestamp ?? new Date().toISOString(),
          senderLanguage: msg.senderLanguage,
        };

        if (!incoming.text) return;

        if (incoming.senderName === localSenderName) {
          return;
        }

        const targetLanguage = translationTargetRef.current;
        const translation = await translateIncomingChatMessage(
          incoming.text,
          targetLanguage,
        );

        appendLiveMessage({
          ...incoming,
          text: translation.text,
          translated: translation.translated,
          translationFailed: translation.translationFailed,
        });
      };
      socket.off("receive-chat-message");
      socket.on("receive-chat-message", handlers.receiveChatMessage);

      if (mediaStream) {
        handlers.liveCaption = (data: any) => {
          setLiveCaption((prev) => prev + data.text);
          if (captionTimeout.current) clearTimeout(captionTimeout.current);
          captionTimeout.current = setTimeout(() => setLiveCaption(""), 3000);
        };
        socket.on("live-caption", handlers.liveCaption);

        handlers.translatedAudioChunk = async (data: any) => {
          if (!audioContextRef.current || !syntheticDestRef.current) return;
          try {
            const audioBuffer = await audioContextRef.current.decodeAudioData(data.chunk);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(syntheticDestRef.current);
            source.start();
          } catch {
            // ignore decode errors for partial chunks
          }
        };
        socket.on("translated-audio-chunk", handlers.translatedAudioChunk);
      }
    };

    const joinTextChatRoom = () => {
      socket.emit("join-call", roomId, user?.email || "Team Member");
      socket.emit("join-room-language", liveLanguageRef.current);
      registerSocketHandlers(null);
    };

    const acquireMediaAndJoin = async () => {
      setMediaError(null);
      setIsTextOnlyMode(false);

      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      let mediaStream: MediaStream | null = null;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: audioConstraints,
        });
      } catch (primaryError) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: audioConstraints,
          });
          showToast("Camera blocked — joined with microphone only", "error");
        } catch (secondaryError) {
          if (
            isMissingMediaDeviceError(primaryError) ||
            isMissingMediaDeviceError(secondaryError)
          ) {
            setIsTextOnlyMode(true);
            showToast(
              "No camera or microphone detected. Joining in Text-Chat only mode.",
            );
            if (cancelled) return;
            joinTextChatRoom();
            return;
          }

          const message =
            primaryError instanceof DOMException
              ? primaryError.name === "NotAllowedError"
                ? "Camera/microphone permission denied. Allow access in browser settings."
                : primaryError.message
              : "Could not access camera or microphone.";
          setMediaError(message);
          showToast(message, "error");
          setHasJoined(false);
          return;
        }
      }

      if (cancelled) {
        mediaStream?.getTracks().forEach((track) => track.stop());
        return;
      }

      localStreamRef.current = mediaStream;
      setStream(mediaStream);
      if (myVideo.current) myVideo.current.srcObject = mediaStream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      syntheticDestRef.current = audioContextRef.current.createMediaStreamDestination();

      try {
        const source = audioContextRef.current.createMediaStreamSource(mediaStream);
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        audioProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContextRef.current.destination);

        processor.onaudioprocess = (e) => {
          if (isTranslationEnabledRef.current) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            socket.emit("audio-chunk", {
              roomId,
              chunk: pcm16.buffer,
              senderId: user?.id,
              senderLanguage: liveLanguageRef.current,
            });
          }
        };
      } catch (e) {
        console.error("AudioProcessor setup failed", e);
      }

      if (cancelled) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      socket.emit("join-call", roomId, user?.email || "Team Member");
      socket.emit("join-room-language", liveLanguageRef.current);
      registerSocketHandlers(mediaStream);
    };

    acquireMediaAndJoin();

    return () => {
      cancelled = true;
      setIsTextOnlyMode(false);
      socket.emit("leave-call", roomId, user?.email || "Team Member");
      detachSocketHandlers();
      cleanupMediaAndPeers();
    };
  }, [socket, roomId, hasJoined, user, liveLanguage, setHasJoined]);

  const toggleTranslation = () => {
    const newState = !isTranslationEnabled;
    setIsTranslationEnabled(newState);
    isTranslationEnabledRef.current = newState;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !socket) return;

    const msgData = {
      id: crypto.randomUUID(),
      fileId: roomId,
      senderName: localSenderName,
      senderSocketId: socket.id,
      text: newMsg.trim(),
      senderLanguage: liveLanguageRef.current,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send-chat-message", msgData);
    appendLiveMessage({
      id: msgData.id,
      senderName: msgData.senderName,
      text: msgData.text,
      timestamp: msgData.timestamp,
    });
    setNewMsg("");
  };

  const handleLeaveSession = () => {
    if (window.confirm("Are you sure you want to leave the live session?")) {
      setIsMicActive(false);
      setHasJoined(false);
      setIsLiveMinimized(true);
      setIsTextOnlyMode(false);
      setLiveMessages([]);
    }
  };

  if (!hasHydrated) return null;

  return (
    <div className="flex flex-col items-start transition-all duration-300 w-full">
      {!hasJoined && (
        <button
          onClick={() => {
            setMediaError(null);
            setHasJoined(true);
            setIsLiveMinimized(false);
          }}
          className="bg-[#121217] hover:bg-[#1c1c24] border border-[#d4af37]/40 text-[#d4af37] font-bold text-xs px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span>START LIVE SESSION</span>
        </button>
      )}

      {mediaError && !hasJoined && (
        <p className="mt-2 max-w-xs text-[10px] text-red-400">{mediaError}</p>
      )}

      {hasJoined && isLiveMinimized && (
        <div className="bg-[#121217]/95 border border-green-500/40 backdrop-blur-xl rounded-full p-2 px-4 shadow-2xl flex items-center gap-3 animate-bounce-short w-full max-w-full md:max-w-none">
          <div
            onClick={() => setIsLiveMinimized(false)}
            className="flex items-center gap-2 cursor-pointer group"
            title="Maximize Live Session"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-white group-hover:text-[#d4af37] transition-colors">
              {isTextOnlyMode ? "Text Chat" : "Live Active"} ({peers.length + 1})
            </span>
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <button
            onClick={handleLeaveSession}
            className="text-red-400 hover:text-red-500 text-[11px] font-bold transition-colors"
            title="Leave Session"
          >
            Leave
          </button>
        </div>
      )}

      {hasJoined && !isLiveMinimized && (
        <div className="w-full max-w-full md:w-[350px] md:max-w-[calc(100vw-2rem)] bg-[#121217]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in pointer-events-auto">
          <div className="h-12 bg-black/40 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-white">
              {isTextOnlyMode ? "Text Chat" : "Live Session"} ({peers.length + 1})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isTextOnlyMode && (
              <span className="rounded-md bg-amber-500/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-300">
                No A/V
              </span>
            )}
              <button
                onClick={toggleTranslation}
                className={`transition-colors p-1.5 rounded-md flex items-center gap-1 text-[10px] font-bold ${
                  isTranslationEnabled 
                    ? "bg-[#d4af37] text-black" 
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                title="Toggle Real-Time Translation (bn -> en)"
              >
                {isTranslationEnabled ? "🌐 Translating" : "🌐 Translate"}
              </button>
              <button
                onClick={() => setIsLiveMinimized(true)}
                className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-md"
                title="Minimize Panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button
                onClick={handleLeaveSession}
                className="text-red-400 hover:text-red-200 transition-colors bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded-md"
                title="Leave Session"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-3 pt-3 shrink-0 relative min-h-[2.5rem]">
            {isTextOnlyMode && !stream && peers.length === 0 && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5 text-[9px] font-bold uppercase tracking-wide text-gray-400">
                Chat
              </div>
            )}
            {liveCaption && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1.5 rounded-lg text-[#d4af37] text-[10px] font-bold text-center z-50 whitespace-pre-wrap max-w-[90%] shadow-lg border border-[#d4af37]/30">
                {liveCaption}
              </div>
            )}
            {stream && (
              <div className="relative group shrink-0">
                <video
                  ref={myVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-10 h-10 object-cover rounded-full border border-green-500 shadow-xl bg-black transform scale-x-[-1]"
                />
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-white font-semibold">
                  You
                </div>
              </div>
            )}
            {peers.map((peerObj) => (
              <VideoPeer key={peerObj.peerID} peer={peerObj.peer} isMuted={isTranslationEnabled} />
            ))}
          </div>

          <div className="p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 h-[250px]">
            {liveMessages.length === 0 ? (
              <div className="m-auto text-[10px] text-gray-500 text-center">
                Start the conversation...
              </div>
            ) : (
              liveMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.senderName === localSenderName ? "items-end" : "items-start"}`}
                >
                  <span className="text-[9px] text-gray-500 mb-0.5">
                    {msg.senderName}
                  </span>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] ${msg.senderName === localSenderName ? "bg-[#d4af37] text-black rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm"}`}
                  >
                    {msg.text}
                    {msg.translated && (
                      <span className="text-[8px] opacity-60 ml-1">(Translated)</span>
                    )}
                    {msg.translationFailed && (
                      <span className="text-[8px] opacity-60 ml-1 text-amber-300">
                        (Translation Failed)
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-white/5 bg-black/40 shrink-0"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-[#050505] border border-white/10 rounded-full pl-4 pr-10 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              <button
                type="submit"
                disabled={!newMsg.trim()}
                className="absolute right-2 p-1.5 bg-[#d4af37] text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
