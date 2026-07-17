// Dotenv must load before any module reads process.env (see src/lib/loadEnv.ts).
import "./src/lib/loadEnv";

import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { createServer } from "http"; // 🚀 Node.js HTTP server
import { Server } from "socket.io"; // 🚀 Socket.io Server
import WebSocket from "ws"; // 🚀 OpenAI Realtime WS Client
import { GoogleGenerativeAI } from "@google/generative-ai";
import uploadRouter from "./src/routes/upload.routes";
import mediaRouter from "./src/routes/media.routes";
import storageRouter from "./src/routes/storage.routes";
import agencyRouter from "./src/routes/agency.routes";
import clientOrganizationInvitePublicRouter from "./src/routes/client-organization-invite-public.routes";
import { requireAuth } from "./src/middleware/requireAuth";
import { startMediaTranscodeWorker } from "./src/workers/mediaTranscodeWorker";

const connectionString = process.env.DATABASE_URL;

// PostgreSQL পুল এবং অ্যাডাপ্টার সেটআপ
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// নতুন নিয়মে PrismaClient তৈরি
const prisma = new PrismaClient({ adapter });
const app = express();
app.locals.prisma = prisma;
const PORT = process.env.PORT || 4000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
async function translateWithGemini(text: string, targetLang: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Translate the following text to ${targetLang}. Return ONLY the translated text, nothing else. Text: ${text}`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

const allowedOrigins = [
  "http://localhost:3000",
  "https://rendorax-media-web.vercel.app",
  "https://rendorax.com",
  "https://www.rendorax.com"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

// 🚀 HTTP সার্ভার তৈরি এবং Socket.io কনফিগারেশন
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

const clientLanguages: Record<string, string> = {};
const socketCallSessions: Record<string, { roomId: string; userId: string }> = {};
// Map: roomId -> targetLang -> WebSocket
const openAIConnections: Record<string, Record<string, WebSocket>> = {};

/**
 * Phase 1 review playback host state — ephemeral, single-process only.
 * Multi-instance deployments need sticky sessions or shared store (not Phase 1).
 */
type ReviewRoomMember = {
  userId?: string;
  role?: string;
};

type ReviewPlaybackSnapshot = {
  currentTime: number;
  paused: boolean;
  playbackRate?: number;
  seq: number;
  sentAt: number;
  assetId?: string;
};

type ReviewRoomState = {
  hostSocketId?: string;
  hostUserId?: string;
  members: Map<string, ReviewRoomMember>;
  lastPlaybackState?: ReviewPlaybackSnapshot;
};

const reviewRoomStates = new Map<string, ReviewRoomState>();

function isPlaybackHostCapable(role?: string): boolean {
  return role === "admin" || role === "editor";
}

function getReviewRoomState(roomId: string): ReviewRoomState {
  let state = reviewRoomStates.get(roomId);
  if (!state) {
    state = { members: new Map() };
    reviewRoomStates.set(roomId, state);
  }
  return state;
}

function emitPlaybackHostChanged(roomId: string, state: ReviewRoomState) {
  io.to(roomId).emit("playback-host-changed", {
    room: roomId,
    hostSocketId: state.hostSocketId ?? null,
  });
}

/** Keep current host if still present and capable; else first admin/editor by join order. */
function electPlaybackHost(roomId: string) {
  const state = reviewRoomStates.get(roomId);
  if (!state) return;

  if (state.hostSocketId && state.members.has(state.hostSocketId)) {
    const current = state.members.get(state.hostSocketId);
    if (isPlaybackHostCapable(current?.role)) {
      emitPlaybackHostChanged(roomId, state);
      return;
    }
  }

  for (const [socketId, member] of state.members) {
    if (isPlaybackHostCapable(member.role)) {
      state.hostSocketId = socketId;
      state.hostUserId = member.userId;
      emitPlaybackHostChanged(roomId, state);
      return;
    }
  }

  state.hostSocketId = undefined;
  state.hostUserId = undefined;
  emitPlaybackHostChanged(roomId, state);
}

function leaveReviewRoomMembership(socketId: string, roomId: string) {
  const state = reviewRoomStates.get(roomId);
  if (!state) return;

  state.members.delete(socketId);
  const wasHost = state.hostSocketId === socketId;
  if (wasHost) {
    state.hostSocketId = undefined;
    state.hostUserId = undefined;
  }

  if (state.members.size === 0) {
    reviewRoomStates.delete(roomId);
    return;
  }

  if (wasHost) {
    electPlaybackHost(roomId);
  }
}

function parseJoinVideoRoomPayload(
  payload: unknown,
): { room: string; userId?: string; role?: string } | null {
  if (typeof payload === "string" && payload.trim()) {
    return { room: payload.trim() };
  }
  if (payload && typeof payload === "object") {
    const data = payload as { room?: unknown; userId?: unknown; role?: unknown };
    const room = typeof data.room === "string" ? data.room.trim() : "";
    if (!room) return null;
    return {
      room,
      userId: typeof data.userId === "string" ? data.userId : undefined,
      role: typeof data.role === "string" ? data.role : undefined,
    };
  }
  return null;
}

function isHostTransportAllowed(roomId: string, socketId: string): boolean {
  const state = reviewRoomStates.get(roomId);
  return Boolean(state?.hostSocketId && state.hostSocketId === socketId);
}

function rememberPlaybackState(
  roomId: string,
  data: {
    currentTime?: unknown;
    paused?: unknown;
    playbackRate?: unknown;
    seq?: unknown;
    sentAt?: unknown;
    assetId?: unknown;
  },
) {
  const state = getReviewRoomState(roomId);
  const currentTime =
    typeof data.currentTime === "number" && Number.isFinite(data.currentTime)
      ? data.currentTime
      : 0;
  const seq =
    typeof data.seq === "number" && Number.isFinite(data.seq) ? data.seq : 0;
  const sentAt =
    typeof data.sentAt === "number" && Number.isFinite(data.sentAt)
      ? data.sentAt
      : Date.now();
  const paused = typeof data.paused === "boolean" ? data.paused : false;
  const playbackRate =
    typeof data.playbackRate === "number" && Number.isFinite(data.playbackRate)
      ? data.playbackRate
      : undefined;
  const assetId =
    typeof data.assetId === "string" && data.assetId.trim()
      ? data.assetId.trim()
      : undefined;

  state.lastPlaybackState = {
    currentTime,
    paused,
    ...(playbackRate !== undefined ? { playbackRate } : {}),
    seq,
    sentAt,
    ...(assetId ? { assetId } : {}),
  };
}

io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Review room join — elect host (admin/editor only; first capable wins)
  socket.on("join-video-room", (payload) => {
    const parsed = parseJoinVideoRoomPayload(payload);
    if (!parsed) return;

    const { room, userId, role } = parsed;
    socket.join(room);

    const state = getReviewRoomState(room);
    const existing = state.members.get(socket.id);
    state.members.set(socket.id, {
      userId: userId ?? existing?.userId,
      role: role ?? existing?.role,
    });

    if (!state.hostSocketId || !state.members.has(state.hostSocketId)) {
      electPlaybackHost(room);
    } else {
      socket.emit("playback-host-changed", {
        room,
        hostSocketId: state.hostSocketId ?? null,
      });
    }

    console.log(
      `Client joined video room: ${room} (role=${role ?? "unknown"}, host=${state.hostSocketId ?? "none"})`,
    );
  });

  socket.on("leave-video-room", (data: { room?: string }) => {
    const room = typeof data?.room === "string" ? data.room.trim() : "";
    if (!room) return;
    socket.leave(room);
    leaveReviewRoomMembership(socket.id, room);
    console.log(`Client left video room: ${room}`);
  });

  // গ্লোবাল লবিতে জয়েন করলে
  socket.on("join-lobby", (userId) => {
    socket.join("global-lobby");
  });

  // 🌐 Register preferred language for multiplexer
  socket.on("join-room-language", (lang: string) => {
    clientLanguages[socket.id] = lang;
    console.log(`🌐 Client ${socket.id} set language to ${lang}`);
  });

  // Host-only transport relay (Phase 1)
  socket.on("video-play", (data: { room?: string; paused?: boolean }) => {
    const room = typeof data?.room === "string" ? data.room.trim() : "";
    if (!room || !isHostTransportAllowed(room, socket.id)) return;
    rememberPlaybackState(room, { ...data, paused: false });
    console.log(`▶️ PLAY signal from host for room: ${room}`);
    socket.to(room).emit("video-play", data);
  });

  socket.on("video-pause", (data: { room?: string; paused?: boolean }) => {
    const room = typeof data?.room === "string" ? data.room.trim() : "";
    if (!room || !isHostTransportAllowed(room, socket.id)) return;
    rememberPlaybackState(room, { ...data, paused: true });
    socket.to(room).emit("video-pause", data);
  });

  socket.on("video-seek", (data: { room?: string; paused?: boolean }) => {
    const room = typeof data?.room === "string" ? data.room.trim() : "";
    if (!room || !isHostTransportAllowed(room, socket.id)) return;
    rememberPlaybackState(room, data);
    socket.to(room).emit("video-seek", data);
  });

  socket.on("request-playback-state", (data: { room?: string }) => {
    const room = typeof data?.room === "string" ? data.room.trim() : "";
    if (!room) return;
    const state = reviewRoomStates.get(room);
    if (!state?.hostSocketId) {
      // No host — followers stay paused; send last snapshot if any
      if (state?.lastPlaybackState) {
        socket.emit("playback-state", {
          room,
          ...state.lastPlaybackState,
          paused: true,
        });
      }
      return;
    }
    if (state.hostSocketId === socket.id) {
      if (state.lastPlaybackState) {
        socket.emit("playback-state", {
          room,
          ...state.lastPlaybackState,
        });
      }
      return;
    }
    io.to(state.hostSocketId).emit("request-playback-state", {
      room,
      requesterSocketId: socket.id,
    });
  });

  socket.on(
    "playback-state",
    (data: {
      room?: string;
      targetSocketId?: string;
      currentTime?: number;
      paused?: boolean;
      playbackRate?: number;
      seq?: number;
      sentAt?: number;
      assetId?: string;
    }) => {
      const room = typeof data?.room === "string" ? data.room.trim() : "";
      if (!room || !isHostTransportAllowed(room, socket.id)) return;
      rememberPlaybackState(room, data);

      const payload = {
        room,
        currentTime: data.currentTime ?? 0,
        paused: typeof data.paused === "boolean" ? data.paused : true,
        playbackRate: data.playbackRate,
        seq: data.seq ?? 0,
        sentAt: data.sentAt ?? Date.now(),
        assetId: data.assetId,
      };

      if (data.targetSocketId) {
        io.to(data.targetSocketId).emit("playback-state", payload);
      } else {
        socket.to(room).emit("playback-state", payload);
      }
    },
  );

  // 🔴 নতুন কমেন্ট ব্রডকাস্ট
  socket.on("new-comment", (data) => {
    socket.to(data.fileId).emit("comment-added", data);
  });

  socket.on("comment-updated", (data) => {
    if (data?.fileId) {
      socket.to(data.fileId).emit("comment-updated", data);
    }
  });

  // ==========================================
  // 🎥 WebRTC SIGNALING FOR VOICE/VIDEO CALLS (LiveSessionWidget)
  // ==========================================
  socket.on("join-call", (roomId: string, userId: string) => {
    socket.join(`call_${roomId}`);
    socketCallSessions[socket.id] = { roomId, userId };
    console.log(`📞 User ${userId} joined call room: call_${roomId}`);
    socket.to(`call_${roomId}`).emit("user-connected", userId, socket.id);
  });

  socket.on("leave-call", (roomId: string, userId: string) => {
    const callRoom = `call_${roomId}`;
    socket.to(callRoom).emit("user-disconnected", socket.id, userId);
    socket.leave(callRoom);
    delete socketCallSessions[socket.id];
    console.log(`📴 User ${userId} left call room: ${callRoom}`);
  });

  socket.on("webrtc-offer", (data: { targetSocketId: string; callerId: string; sdp: any }) => {
    socket.to(data.targetSocketId).emit("webrtc-offer", {
      callerSocketId: socket.id,
      callerId: data.callerId,
      sdp: data.sdp,
    });
  });

  socket.on("webrtc-answer", (data: { targetSocketId: string; sdp: any }) => {
    socket.to(data.targetSocketId).emit("webrtc-answer", {
      answererSocketId: socket.id,
      sdp: data.sdp,
    });
  });

  socket.on("webrtc-ice-candidate", (data: { targetSocketId: string; candidate: any }) => {
    socket.to(data.targetSocketId).emit("webrtc-ice-candidate", {
      senderSocketId: socket.id,
      candidate: data.candidate,
    });
  });

  // ==========================================
  // ORIGINAL STANDARD WebRTC SIGNALING (Restored)
  // ==========================================
  socket.on("peer-signal", (data) => {
    if (data.targetSocketId) {
      socket.to(data.targetSocketId).emit("peer-signal", {
        senderSocketId: socket.id,
        ...data,
      });
    } else if (data.userToSignal) {
      socket.to(data.userToSignal).emit("user-joined", { signal: data.signal, callerID: data.callerID });
    } else if (data.callerID) {
      socket.to(data.callerID).emit("receiving-returned-signal", { signal: data.signal, id: socket.id });
    } else {
      socket.broadcast.emit("peer-signal", data);
    }
  });

  socket.on("replaceTrack", (data) => {
    if (data.targetSocketId) {
      socket.to(data.targetSocketId).emit("replaceTrack", data);
    } else {
      socket.broadcast.emit("replaceTrack", data);
    }
  });

  // ==========================================
  // 💻 WebRTC SIGNALING FOR LIVE SCREEN SHARE (Live Editing)
  // ==========================================
  socket.on("admin-started-timeline-share", (data: { roomId: string; editorSocketId: string }) => {
    console.log(`🖥️ Admin forcefully started timeline share UI in room: ${data.roomId}`);
    socket.to(data.roomId).emit("admin-started-timeline-share", data);
  });

  socket.on("admin-stopped-timeline-share", (data: { roomId: string }) => {
    console.log(`🛑 Admin stopped timeline share UI in room: ${data.roomId}`);
    socket.to(data.roomId).emit("admin-stopped-timeline-share", data);
  });

  socket.on("timeline-client-ready", (data: { targetSocketId: string; roomId: string }) => {
    console.log(`👥 Client ${socket.id} is ready for editor stream in room: ${data.roomId}`);
    socket.to(data.targetSocketId).emit("timeline-client-ready", {
      clientSocketId: socket.id,
    });
  });

  socket.on("timeline-webrtc-offer", (data: { targetSocketId: string; sdp: any }) => {
    socket.to(data.targetSocketId).emit("timeline-webrtc-offer", {
      callerSocketId: socket.id,
      sdp: data.sdp,
    });
  });

  socket.on("timeline-webrtc-answer", (data: { targetSocketId: string; sdp: any }) => {
    socket.to(data.targetSocketId).emit("timeline-webrtc-answer", {
      answererSocketId: socket.id,
      sdp: data.sdp,
    });
  });

  // 💬 LIVE SESSION CHAT MESSAGE HANDLER
  socket.on("send-chat-message", (data: {
    fileId: string;
    id?: string;
    senderName: string;
    senderSocketId?: string;
    text: string;
    senderLanguage?: string;
    timestamp?: string;
  }) => {
    console.log(`💬 Chat from ${data.senderName} in room ${data.fileId}: ${data.text}`);
    // Only emit to the live call room — avoid duplicate delivery to join-lobby + join-call rooms.
    socket.to(`call_${data.fileId}`).emit("receive-chat-message", data);
  });

  // ==========================================
  // 🎙️ REAL-TIME AUDIO TRANSLATION MULTIPLEXER (OpenAI Realtime API)
  // ==========================================

  function getOrInitOpenAIConnection(roomId: string, targetLang: string) {
    if (!openAIConnections[roomId]) openAIConnections[roomId] = {};
    if (openAIConnections[roomId][targetLang] && openAIConnections[roomId][targetLang].readyState === WebSocket.OPEN) {
      return openAIConnections[roomId][targetLang];
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY in .env");
      return null;
    }

    const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
    const ws = new WebSocket(url, {
      headers: {
        "Authorization": "Bearer " + apiKey,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    ws.on("open", () => {
      console.log(`🟢 OpenAI WS connected for room ${roomId}, lang ${targetLang}`);
      const sessionUpdate = {
        type: "session.update",
        session: {
          modalities: ["audio", "text"],
          instructions: `You are a real-time interpreter. The user is speaking a source language. You MUST translate the audio into the following target language: ${targetLang}. Output the translated text and speak it clearly in ${targetLang}. Do NOT respond to questions, just translate continuously.`,
          voice: "alloy",
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          turn_detection: { type: "server_vad" }
        }
      };
      ws.send(JSON.stringify(sessionUpdate));
    });

    ws.on("message", (data) => {
      try {
        const eventObj = JSON.parse(data.toString());
        
        // 1. Audio Delta (TTS)
        if (eventObj.type === "response.audio.delta" && eventObj.delta) {
          const chunkBuf = Buffer.from(eventObj.delta, 'base64');
          const socketsInRoom = io.sockets.adapter.rooms.get(`call_${roomId}`);
          if (socketsInRoom) {
            for (const socketId of socketsInRoom) {
              if (clientLanguages[socketId] === targetLang) {
                io.sockets.sockets.get(socketId)?.emit("translated-audio-chunk", {
                  chunk: chunkBuf
                });
              }
            }
          }
        }
        
        // 2. Transcript Delta (Live Captions)
        if (eventObj.type === "response.audio_transcript.delta" && eventObj.delta) {
          const socketsInRoom = io.sockets.adapter.rooms.get(`call_${roomId}`);
          if (socketsInRoom) {
            for (const socketId of socketsInRoom) {
              if (clientLanguages[socketId] === targetLang) {
                io.sockets.sockets.get(socketId)?.emit("live-caption", {
                  text: eventObj.delta,
                  lang: targetLang
                });
              }
            }
          }
        }
      } catch(e) {}
    });

    ws.on("close", () => {
      console.log(`🔴 OpenAI WS closed for room ${roomId}, lang ${targetLang}`);
      if (openAIConnections[roomId] && openAIConnections[roomId][targetLang]) {
        delete openAIConnections[roomId][targetLang];
      }
    });

    openAIConnections[roomId][targetLang] = ws;
    return ws;
  }

  socket.on("audio-chunk", (data: { roomId: string; chunk: ArrayBuffer; senderId: string; senderLanguage: string }) => {
    const { roomId, chunk, senderLanguage } = data;
    
    // Find all distinct target languages needed in the room
    const targetLanguages = new Set<string>();
    const socketsInRoom = io.sockets.adapter.rooms.get(`call_${roomId}`);
    if (socketsInRoom) {
      for (const socketId of socketsInRoom) {
        const lang = clientLanguages[socketId];
        // If client language is different from sender, they need translation
        if (lang && lang !== senderLanguage) {
          targetLanguages.add(lang);
        }
      }
    }

    // Convert raw ArrayBuffer (PCM16) to Base64 for OpenAI
    const base64Audio = Buffer.from(chunk).toString('base64');

    // Fan-out audio to each language-specific OpenAI WS
    targetLanguages.forEach(targetLang => {
      const ws = getOrInitOpenAIConnection(roomId, targetLang);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio
        }));
      }
    });
  });

  socket.on("translate-speech", async ({ text, targetLang }) => {
    try {
      const translatedText = await translateWithGemini(text, targetLang); 
      io.emit("receive-translated-speech", { original: text, translated: translatedText });
    } catch (error) {
      console.error("Translation Error:", error);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})`);

    const session = socketCallSessions[socket.id];
    if (session) {
      io.to(`call_${session.roomId}`).emit(
        "user-disconnected",
        socket.id,
        session.userId,
      );
      delete socketCallSessions[socket.id];
    }

    delete clientLanguages[socket.id];

    for (const room of socket.rooms) {
      if (room === socket.id) continue;
      if (room.startsWith("call_")) {
        if (!session) {
          io.to(room).emit("user-disconnected", socket.id);
        }
        continue;
      }
      leaveReviewRoomMembership(socket.id, room);
      io.to(room).emit("timeline-user-disconnected", socket.id);
      io.to(room).emit("user-disconnected", socket.id);
    }

    // Rooms may already be cleared on disconnect; also scrub membership maps.
    for (const [roomId, state] of reviewRoomStates) {
      if (state.members.has(socket.id)) {
        leaveReviewRoomMembership(socket.id, roomId);
      }
    }
  });
});

app.use("/api/upload", uploadRouter);
app.use("/api/media", mediaRouter);
app.use("/api/storage", storageRouter);
app.use(
  "/api/agency/client-organization/invitations/accept",
  clientOrganizationInvitePublicRouter,
);
app.use("/api/agency", agencyRouter);

// Health Check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "Studio Backend is Running" });
});

// Get Projects (authenticated)
app.get("/api/projects", requireAuth, async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// 🚀 app.listen এর বদলে httpServer.listen হবে
const mediaTranscodeWorker = startMediaTranscodeWorker(prisma);
if (mediaTranscodeWorker) {
  console.log("📼 Media transcode worker started (Phase 4 — FFmpeg)");
}

httpServer.listen(PORT, () => {
  console.log(`🚀 Rendorax API & WebSocket running on http://localhost:${PORT}`);
});