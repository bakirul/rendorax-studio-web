"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import Peer from "simple-peer";

// Hooks
import { useFrameAccurateVideo } from "@/hooks/useFrameAccurateVideo";
import { useLUFSMeter } from "@/hooks/useLUFSMeter";
import { useFileManager } from "@/hooks/useFileManager";
import { useMediaProcessingPoll } from "@/hooks/useMediaProcessingPoll";
import { useLiveComments } from "@/hooks/useLiveComments";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useGlobalStore } from "@/store/useGlobalStore";

// Components
import Navbar from "@/components/Navbar";
import VaultSidebar from "@/components/VaultSidebar";
import CommentsPanel from "@/components/CommentsPanel";
import DashboardHeader from "@/components/DashboardHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import FileGrid from "@/components/dashboard/FileGrid";
import LUFSMeter from "@/components/LUFSMeter";
import VideoTimelineScrubber from "@/components/dashboard/VideoTimelineScrubber";
import VideoCaptionTracks from "@/components/dashboard/VideoCaptionTracks";
import StreamingVideoPlayer from "@/components/dashboard/StreamingVideoPlayer";
import MediaPreviewPanel from "@/components/dashboard/MediaPreviewPanel";
import TimelineShareWidget from "@/components/TimelineShareWidget";
import RenameModal from "@/components/modals/RenameModal";
import DeleteModal from "@/components/modals/DeleteModal";
import MoveModal from "@/components/modals/MoveModal";
import { saveMediaAsset, fetchMediaAssets, buildMediaAssetFetchParams, mediaFolderForSave, getMediaPlaybackUrl, isMediaAssetProcessing, deleteMediaAsset, updateMediaAsset, type MediaAssetRecord } from "@/utils/mediaAssets";
import { sanitizeAbsoluteMediaUrl } from "@/utils/mediaAssets";
import CloudAssetGallery from "@/components/dashboard/CloudAssetGallery";
import GalleryBulkActionBar from "@/components/dashboard/GalleryBulkActionBar";
import ToastHost from "@/components/ToastHost";
import { useGalleryViewStyles } from "@/hooks/useGalleryViewStyles";
import { getPreviewAssetKey, buildPreviewPlayerKey } from "@/utils/previewAssetKey";
import { getMediaFileCategory } from "@/utils/mediaFileCategory";
import { buildPeerOptions } from "@/utils/webrtcConfig";
import { loadPersistedViewSettings } from "@/utils/viewSettingsPersistence";
import {
  COMMENTS_SIDEBAR_DEFAULT_PX,
  clampCommentsSidebarWidth,
  loadPersistedCommentsSidebarWidth,
  persistCommentsSidebarWidth,
} from "@/utils/commentsSidebarPersistence";
import { emitJoinReviewRoom, getReviewRoomId } from "@/utils/reviewRoom";

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

type EditorTaskStatus = "todo" | "in_progress" | "in_review" | "done";

type EditorTask = {
  id: string;
  title: string;
  description: string | null;
  status: EditorTaskStatus;
  dueDate: string | null;
  assignee: {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
  } | null;
  project: {
    id: string;
    title: string;
    status: string;
    client: {
      id: string;
      displayName: string | null;
      email: string;
    } | null;
  } | null;
};

const TASK_NEXT_STATUS: Record<EditorTaskStatus, EditorTaskStatus | null> = {
  todo: "in_progress",
  in_progress: "in_review",
  in_review: "done",
  done: null,
};

const TASK_STATUS_ACTION_LABELS: Record<
  Exclude<EditorTaskStatus, "done">,
  string
> = {
  todo: "Start Work",
  in_progress: "Send to Review",
  in_review: "Mark Complete",
};

export default function DashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNavbar, setShowNavbar] = useState(false);

  const {
    leftPaneWidth,
    setLeftPaneWidth,
    sidebarWidth,
    setSidebarWidth,
    viewMode,
    setViewMode,
    isSidebarOpen,
    setIsSidebarOpen,
    activeBin,
    setActiveBin,
    currentFolder,
    setCurrentFolder,
    searchQuery,
    setSearchQuery,
    previewFile,
    setPreviewFile,
    subtitleTracksByAssetKey,
    compareFile,
    setCompareFile,
    isCompareMode,
    setIsCompareMode,
    isEditor,
    setIsEditor,
    isLiveStreaming,
    setIsLiveStreaming,
    isScreenSharing,
    setIsScreenSharing,
    projectStage,
    setProjectStage,
    setViewSettings,
  } = useDashboardStore();

  const setActiveReviewRoomId = useGlobalStore((state) => state.setActiveReviewRoomId);

  // Keep the shared live session (voice/video call) aligned with whatever room
  // comments, playback sync, and timeline sharing are already using for the
  // asset currently being reviewed. Overwriting (not clearing-then-setting) on
  // every change avoids a null flash that would otherwise force an active
  // call to rejoin. Only reset to null (→ "global-lobby") on unmount.
  useEffect(() => {
    setActiveReviewRoomId(getReviewRoomId(previewFile, currentFolder));
  }, [previewFile, currentFolder, setActiveReviewRoomId]);

  useEffect(() => {
    return () => setActiveReviewRoomId(null);
  }, [setActiveReviewRoomId]);

  const [commentsSidebarWidth, setCommentsSidebarWidth] = useState(
    COMMENTS_SIDEBAR_DEFAULT_PX,
  );

  useEffect(() => {
    const persisted = loadPersistedViewSettings();
    if (persisted) {
      setViewSettings(persisted);
    }
    const persistedCommentsWidth = loadPersistedCommentsSidebarWidth();
    if (persistedCommentsWidth != null) {
      setCommentsSidebarWidth(persistedCommentsWidth);
    }
  }, [setViewSettings]);

  const previewPlayerKey = useMemo(
    () => buildPreviewPlayerKey(previewFile),
    [previewFile],
  );

  const comparePlayerKey = useMemo(
    () =>
      compareFile ? `compare-${compareFile.name}-${compareFile.url}` : "",
    [compareFile],
  );

  const resetCompareVideoElement = useCallback(() => {
    const comp = compareVideoRef.current;
    if (!comp) return;
    comp.pause();
    comp.removeAttribute("src");
    comp.load();
  }, []);

  const previewPlaybackUrl = useMemo(
    () =>
      previewFile
        ? sanitizeAbsoluteMediaUrl(
            (previewFile.url ?? previewFile.publicUrl ?? "").trim(),
          )
        : "",
    [previewFile],
  );

  const activeSubtitleTracks = previewFile
    ? subtitleTracksByAssetKey[getPreviewAssetKey(previewFile)] ?? []
    : [];

  const isResizingLeft = useRef(false);
  const isResizingSidebar = useRef(false);
  const isResizingCommentsSidebar = useRef(false);
  const commentsSidebarWidthRef = useRef(commentsSidebarWidth);
  commentsSidebarWidthRef.current = commentsSidebarWidth;

  // Sidebar Resize Handlers
  const handleMouseMoveSidebar = useCallback((e: MouseEvent) => {
    if (!isResizingSidebar.current) return;
    let newWidth = e.clientX;
    if (newWidth < 200) newWidth = 200;
    if (newWidth > 600) newWidth = 600;
    setSidebarWidth(newWidth);
  }, [setSidebarWidth]);

  const stopResizingSidebar = useCallback(() => {
    isResizingSidebar.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleMouseMoveSidebar);
    document.removeEventListener("mouseup", stopResizingSidebar);
  }, [handleMouseMoveSidebar]);

  const startResizingSidebar = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingSidebar.current = true;
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", handleMouseMoveSidebar);
      document.addEventListener("mouseup", stopResizingSidebar);
    },
    [handleMouseMoveSidebar, stopResizingSidebar],
  );

  const handleMouseMoveCommentsSidebar = useCallback((e: MouseEvent) => {
    if (!isResizingCommentsSidebar.current) return;
    setCommentsSidebarWidth(
      clampCommentsSidebarWidth(window.innerWidth - e.clientX),
    );
  }, []);

  const stopResizingCommentsSidebar = useCallback(() => {
    isResizingCommentsSidebar.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleMouseMoveCommentsSidebar);
    document.removeEventListener("mouseup", stopResizingCommentsSidebar);
    persistCommentsSidebarWidth(commentsSidebarWidthRef.current);
  }, [handleMouseMoveCommentsSidebar]);

  const startResizingCommentsSidebar = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingCommentsSidebar.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMoveCommentsSidebar);
      document.addEventListener("mouseup", stopResizingCommentsSidebar);
    },
    [handleMouseMoveCommentsSidebar, stopResizingCommentsSidebar],
  );

  // Fetch feature flags
  const { flags } = useFeatureFlags(user?.id);

  // Project Progress Logic
  const POST_PROD_STAGES = [
    "Ingest & Sync",
    "Rough Cut",
    "VFX & Color",
    "Sound Mix",
    "Picture Lock",
    "Final Master",
  ];
  const currentStageIndex = POST_PROD_STAGES.indexOf(projectStage);
  const progressPercentage = Math.round(
    ((currentStageIndex + 1) / POST_PROD_STAGES.length) * 100,
  );

  const [isLocked, setIsLocked] = useState(false);
  const [integrityHash, setIntegrityHash] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  // Assigned Tasks (Operations Core — Step 4)
  const [editorTasks, setEditorTasks] = useState<EditorTask[]>([]);
  const [editorTasksLoading, setEditorTasksLoading] = useState(false);
  const [editorTasksFetchError, setEditorTasksFetchError] = useState<string | null>(null);
  const [taskUpdateError, setTaskUpdateError] = useState<string | null>(null);
  const [isTaskPanelExpanded, setIsTaskPanelExpanded] = useState(false);
  const [taskStatusUpdating, setTaskStatusUpdating] = useState<string | null>(null);
  const taskStatusLabels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    done: "Done",
  };

  // Active Project selector (Operations Core — Step 5: link uploads to a project)
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const availableProjects = useMemo(() => {
    const seen = new Map<string, { id: string; title: string }>();
    for (const task of editorTasks) {
      if (task.project?.id && !seen.has(task.project.id)) {
        seen.set(task.project.id, { id: task.project.id, title: task.project.title });
      }
    }
    return Array.from(seen.values());
  }, [editorTasks]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const compareVideoRef = useRef<HTMLVideoElement>(null);

  // File Manager Hook
  const {
    vaultItems,
    fileUrls,
    thumbnailUrls,
    vaultAssetsByName,
    uploading,
    uploadSession,
    allFolders,
    handleUpload,
    getSignedUrl,
    getVaultAssetRecord,
    handleDeleteFile,
    handleRenameFile,
    handleMoveFile,
    handleCreateFolder,
    handleDeleteFolder,
    fetchAllFolders,
    fetchFiles,
  } = useFileManager(user, currentFolder);

  const vaultAssetsList = useMemo(
    () => Object.values(vaultAssetsByName),
    [vaultAssetsByName],
  );

  const [renameModalState, setRenameModalState] = useState<{
    isOpen: boolean;
    itemName: string;
    isFolder: boolean;
    source?: "vault" | "cloud";
    assetId?: string;
  }>({ isOpen: false, itemName: "", isFolder: false });
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    itemName: string;
    isFolder: boolean;
    source?: "vault" | "cloud";
    assetId?: string;
  }>({ isOpen: false, itemName: "", isFolder: false });
  const [moveModalState, setMoveModalState] = useState<{ isOpen: boolean; itemName: string }>({ isOpen: false, itemName: "" });
  const [cloudAssets, setCloudAssets] = useState<MediaAssetRecord[]>([]);
  const [cloudAssetsLoading, setCloudAssetsLoading] = useState(false);
  const cloudAssetsLoadGenRef = useRef(0);

  // Live Comments Hook
  const {
    comments,
    newComment,
    setNewComment,
    socket,
    isLive,
    isNotifying,
    notificationSent,
    handleAddComment,
    handleDeleteComment,
    handleEditComment,
    handleNotifyTeam,
    handleCompileAndSend,
    handleDownloadReport,
    handleExportMarkers,
    jumpToTime,
  } = useLiveComments(user, previewFile, videoRef, currentFolder);

  // Over-the-Shoulder (OTS) Screen Share Refs
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenPeersRef = useRef<{ [socketId: string]: any }>({});
  const clientScreenPeerRef = useRef<any>(null);
  const cinemaVideoRef = useRef<HTMLVideoElement>(null);
  const clientAudioStreamRef = useRef<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false, // Set to false to avoid hardware stream locks with LiveSessionWidget's getUserMedia
      });

      // Constraints optimized for zero-latency voice talkback
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      let audioStream;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      } catch (err) {
        console.warn("Could not get admin audio:", err);
      }

      const tracks = [...displayStream.getVideoTracks()];
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks());
      }
      const stream = new MediaStream(tracks);

      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      setIsLiveStreaming(true);

      setTimeout(() => {
        if (cinemaVideoRef.current) {
          cinemaVideoRef.current.srcObject = stream;
        }
      }, 100);

      const reviewRoomId = getReviewRoomId(previewFile, currentFolder);
      if (socket) {
        emitJoinReviewRoom(socket, reviewRoomId);
        socket.emit("admin-started-timeline-share", {
          roomId: reviewRoomId,
          editorSocketId: socket.id,
        });
      } else {
        console.warn(
          "Timeline share started locally but socket is unavailable — viewers will not receive cinema mode.",
        );
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Failed to start screen share:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    Object.values(screenPeersRef.current).forEach((peer: any) => peer.destroy());
    screenPeersRef.current = {};

    setIsScreenSharing(false);
    setIsLiveStreaming(false);

    const reviewRoomId = getReviewRoomId(previewFile, currentFolder);
    if (socket) {
      emitJoinReviewRoom(socket, reviewRoomId);
      socket.emit("admin-stopped-timeline-share", { roomId: reviewRoomId });
    }
  };

  // Screen Share WebRTC Signaling Effect
  useEffect(() => {
    if (!socket) return;

    const handleAdminStartedShare = (data: { roomId: string; editorSocketId: string }) => {
      if (data.editorSocketId === socket.id) return;
      const activeRoomId = getReviewRoomId(previewFile, currentFolder);
      if (data.roomId !== activeRoomId) return;
      setIsLiveStreaming(true);
      emitJoinReviewRoom(socket, data.roomId);
      socket.emit("timeline-client-ready", {
        targetSocketId: data.editorSocketId,
        roomId: data.roomId,
      });
    };

    const handleAdminStoppedShare = () => {
      setIsLiveStreaming(false);
      if (clientScreenPeerRef.current) {
        clientScreenPeerRef.current.destroy();
        clientScreenPeerRef.current = null;
      }
      if (cinemaVideoRef.current) {
        cinemaVideoRef.current.srcObject = null;
      }
      if (clientAudioStreamRef.current) {
        clientAudioStreamRef.current.getTracks().forEach(track => track.stop());
        clientAudioStreamRef.current = null;
      }
    };

    const handleClientReady = (data: { clientSocketId: string }) => {
      if (!screenStreamRef.current) return;

      const peer = new Peer(
        buildPeerOptions({ initiator: true, stream: screenStreamRef.current }),
      );

      peer.on("signal", (signal: any) => {
        if (signal.type === "offer" || signal.type === "answer") {
          signal.sdp = setMediaBitrate(signal.sdp, 2500);
        }
        socket.emit("timeline-webrtc-offer", {
          targetSocketId: data.clientSocketId,
          sdp: signal,
        });
      });

      peer.on("stream", (remoteStream) => {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play().catch(e => console.error("Admin audio play error:", e));
      });

      peer.on("close", () => {
        peer.destroy();
        delete screenPeersRef.current[data.clientSocketId];
      });

      peer.on("error", (err) => {
        console.error("Sender screen peer error:", err);
      });

      screenPeersRef.current[data.clientSocketId] = peer;
    };

    const handleScreenOffer = async (data: { callerSocketId: string; sdp: any }) => {
      let localAudioStream = clientAudioStreamRef.current;
      if (!localAudioStream) {
        try {
          // Constraints optimized for zero-latency voice talkback
          const audioConstraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          };
          localAudioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
          clientAudioStreamRef.current = localAudioStream;
        } catch (err) {
          console.warn("Could not get client audio:", err);
        }
      }

      const peerOptions = buildPeerOptions({
        initiator: false,
        stream: localAudioStream ?? undefined,
      });
      const peer = new Peer(peerOptions);

      peer.on("signal", (signal: any) => {
        if (signal.type === "offer" || signal.type === "answer") {
          signal.sdp = setMediaBitrate(signal.sdp, 2500);
        }
        socket.emit("timeline-webrtc-answer", {
          targetSocketId: data.callerSocketId,
          sdp: signal,
        });
      });

      peer.on("stream", (remoteStream) => {
        const attachStream = () => {
          if (cinemaVideoRef.current) {
            cinemaVideoRef.current.srcObject = remoteStream;
            cinemaVideoRef.current.play().catch(err => console.error("Client stream play error:", err));
          } else {
            setTimeout(attachStream, 100);
          }
        };
        attachStream();
      });

      peer.on("close", () => {
        peer.destroy();
        if (clientScreenPeerRef.current === peer) {
          clientScreenPeerRef.current = null;
          // UI state is handled by admin-stopped-timeline-share, NOT here.
        }
      });

      peer.on("error", (err) => {
        console.error("Receiver screen peer error:", err);
      });

      peer.signal(data.sdp);
      clientScreenPeerRef.current = peer;
    };

    const handleScreenAnswer = (data: { answererSocketId: string; sdp: any }) => {
      const peer = screenPeersRef.current[data.answererSocketId];
      if (peer) {
        peer.signal(data.sdp);
      }
    };

    const handleUserDisconnected = (socketId: string) => {
      const peer = screenPeersRef.current[socketId];
      if (peer) {
        peer.destroy();
        delete screenPeersRef.current[socketId];
      }
    };

    socket.on("admin-started-timeline-share", handleAdminStartedShare);
    socket.on("admin-stopped-timeline-share", handleAdminStoppedShare);
    socket.on("timeline-client-ready", handleClientReady);
    socket.on("timeline-webrtc-offer", handleScreenOffer);
    socket.on("timeline-webrtc-answer", handleScreenAnswer);
    socket.on("timeline-user-disconnected", handleUserDisconnected);

    return () => {
      socket.off("admin-started-timeline-share", handleAdminStartedShare);
      socket.off("admin-stopped-timeline-share", handleAdminStoppedShare);
      socket.off("timeline-client-ready", handleClientReady);
      socket.off("timeline-webrtc-offer", handleScreenOffer);
      socket.off("timeline-webrtc-answer", handleScreenAnswer);
      socket.off("timeline-user-disconnected", handleUserDisconnected);
    };
  }, [socket, previewFile?.assetId, previewFile?.name, currentFolder]);

  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (clientAudioStreamRef.current) {
        clientAudioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(screenPeersRef.current).forEach((peer: any) => peer.destroy());
      if (clientScreenPeerRef.current) {
        clientScreenPeerRef.current.destroy();
      }
    };
  }, []);

  const { smpteTimecode, stepForward, stepBackward } = useFrameAccurateVideo(
    videoRef,
    24,
  );
  const { lufs } = useLUFSMeter(
    videoRef,
    previewFile?.isVideo && previewPlaybackUrl ? previewPlaybackUrl : undefined,
    previewFile?.isVideo ? previewPlayerKey : undefined,
  );

  useEffect(() => {
    setIsSidebarOpen(window.innerWidth >= 768);
  }, [setIsSidebarOpen]);

  const loadEditorTasks = useCallback(async () => {
    setEditorTasksFetchError(null);
    setEditorTasksLoading(true);
    try {
      const res = await fetch("/api/agency/tasks");
      const data = await res.json();
      if (!res.ok) {
        setEditorTasksFetchError(data.error || "Failed to load assigned tasks");
        return;
      }
      if (Array.isArray(data.tasks)) {
        setEditorTasks(data.tasks);
      }
    } catch {
      setEditorTasksFetchError("Failed to load assigned tasks");
      console.error("Failed to load assigned tasks");
    } finally {
      setEditorTasksLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: EditorTaskStatus) => {
    setTaskUpdateError(null);
    setTaskStatusUpdating(taskId);
    try {
      const res = await fetch("/api/agency/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status }),
      });
      const updated = await res.json();
      if (!res.ok) {
        setTaskUpdateError(updated.error || "Failed to update task status");
        return;
      }
      setEditorTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)),
      );
    } catch {
      setTaskUpdateError("Failed to update task status");
      console.error("Failed to update task status");
    } finally {
      setTaskStatusUpdating(null);
    }
  }, []);

  const advanceTaskStatus = useCallback(
    (task: EditorTask) => {
      const nextStatus = TASK_NEXT_STATUS[task.status];
      if (!nextStatus) return;
      void updateTaskStatus(task.id, nextStatus);
    },
    [updateTaskStatus],
  );

  // User Auth Initializer & Strict RBAC
  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (isMounted) {
        if (session?.user) {
          setUser(session.user);
          const editorCheck =
            session.user.app_metadata?.role === "admin" ||
            session.user.app_metadata?.role === "editor";
          setIsEditor(editorCheck);
          fetch("/api/agency/me").catch(() => {});
          if (editorCheck) {
            void loadEditorTasks();
          }
        }
        setLoading(false);
      }
    };
    loadUser();
    return () => {
      isMounted = false;
    };
  }, [supabase, setIsEditor, loadEditorTasks]);

  // Sync main and compare video elements
  const handleTogglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .catch((e) => console.error("Main Video Play Error:", e));
      if (
        flags?.enable_compare_mode &&
        isCompareMode &&
        compareVideoRef.current
      ) {
        compareVideoRef.current
          .play()
          .catch((e) => console.error("Compare Video Play Error:", e));
      }
    } else {
      videoRef.current.pause();
      if (
        flags?.enable_compare_mode &&
        isCompareMode &&
        compareVideoRef.current
      ) {
        compareVideoRef.current.pause();
      }
    }
  }, [flags, isCompareMode]);

  const lastAutoplayedPreviewKeyRef = useRef("");

  useEffect(() => {
    if (!previewFile?.isVideo || !previewPlayerKey) {
      if (!previewPlayerKey) {
        lastAutoplayedPreviewKeyRef.current = "";
      }
      return;
    }

    if (lastAutoplayedPreviewKeyRef.current === previewPlayerKey) {
      return;
    }
    lastAutoplayedPreviewKeyRef.current = previewPlayerKey;

    let cancelled = false;
    let removeListener: (() => void) | undefined;
    let attempts = 0;

    const bindAutoplay = (video: HTMLVideoElement) => {
      const playWhenReady = () => {
        if (cancelled) return;
        void video.play().catch(() => {
          // Autoplay may be blocked until user gesture.
        });
      };

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        playWhenReady();
        return;
      }

      video.addEventListener("canplay", playWhenReady, { once: true });
      removeListener = () => video.removeEventListener("canplay", playWhenReady);
    };

    const tryBind = () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (video) {
        bindAutoplay(video);
        return;
      }
      if (attempts < 12) {
        attempts += 1;
        requestAnimationFrame(tryBind);
      }
    };

    tryBind();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [previewPlayerKey, previewFile?.isVideo]);

  useEffect(() => {
    if (!isCompareMode || !flags?.enable_compare_mode || !compareFile) return;

    let cancelled = false;
    let removeListeners: (() => void) | undefined;
    let removeMetadataListener: (() => void) | undefined;
    let attempts = 0;

    const bindCompareSync = () => {
      if (cancelled) return;

      const main = videoRef.current;
      const comp = compareVideoRef.current;
      if (!main || !comp) {
        if (attempts < 12) {
          attempts += 1;
          requestAnimationFrame(bindCompareSync);
        }
        return;
      }

      const syncPlay = () => {
        if (comp.paused) comp.play().catch((e) => console.error(e));
      };
      const syncPause = () => {
        if (!comp.paused) comp.pause();
      };
      const syncSeek = () => {
        comp.currentTime = main.currentTime;
      };
      const syncRate = () => {
        comp.playbackRate = main.playbackRate;
      };

      const applyInitialSync = () => {
        if (cancelled) return;
        syncRate();
        if (Number.isFinite(main.currentTime)) {
          comp.currentTime = main.currentTime;
        }
        if (!main.paused) {
          void comp.play().catch((e) => console.error(e));
        }
      };

      applyInitialSync();
      if (comp.readyState < HTMLMediaElement.HAVE_METADATA) {
        const onMetadata = () => applyInitialSync();
        comp.addEventListener("loadedmetadata", onMetadata, { once: true });
        removeMetadataListener = () =>
          comp.removeEventListener("loadedmetadata", onMetadata);
      }

      main.addEventListener("play", syncPlay);
      main.addEventListener("pause", syncPause);
      main.addEventListener("seeked", syncSeek);
      main.addEventListener("ratechange", syncRate);

      removeListeners = () => {
        main.removeEventListener("play", syncPlay);
        main.removeEventListener("pause", syncPause);
        main.removeEventListener("seeked", syncSeek);
        main.removeEventListener("ratechange", syncRate);
      };
    };

    bindCompareSync();

    return () => {
      cancelled = true;
      removeListeners?.();
      removeMetadataListener?.();
    };
  }, [isCompareMode, compareFile, comparePlayerKey, flags]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current || !previewFile?.isVideo) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;
      if (e.key === ",") {
        e.preventDefault();
        stepBackward();
      } else if (e.key === ".") {
        e.preventDefault();
        stepForward();
      } else if (e.key === " ") {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewFile, stepBackward, stepForward, isCompareMode, flags, handleTogglePlay]);

  // Resize handlers
  const handleMouseMoveLeft = useCallback((e: MouseEvent) => {
    if (!isResizingLeft.current) return;
    const container = document.getElementById("grid-preview-container");
    if (container) {
      const rect = container.getBoundingClientRect();
      let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth < 20) newWidth = 20;
      if (newWidth > 70) newWidth = 70;
      setLeftPaneWidth(newWidth);
    }
  }, [setLeftPaneWidth]);

  const stopResizingLeft = useCallback(() => {
    isResizingLeft.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleMouseMoveLeft);
    document.removeEventListener("mouseup", stopResizingLeft);
  }, [handleMouseMoveLeft]);

  const startResizingLeft = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingLeft.current = true;
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", handleMouseMoveLeft);
      document.addEventListener("mouseup", stopResizingLeft);
    },
    [handleMouseMoveLeft, stopResizingLeft],
  );

  const handlePreview = async (fileName: string) => {
    const asset = getVaultAssetRecord(fileName);
    const displayName = fileName.substring(fileName.indexOf("_") + 1);
    const isVideo = getMediaFileCategory(displayName) === "video";
    const previewKey = asset?.id ?? fileName;

    if (
      isVideo &&
      previewFile &&
      (previewFile.previewKey === previewKey ||
        previewFile.assetId === asset?.id ||
        previewFile.name === displayName)
    ) {
      handleTogglePlay();
      return;
    }

    const url = await getSignedUrl(fileName);
    if (!url) {
      console.error("Vault asset missing playback URL:", fileName);
      return;
    }

    setPreviewFile({
      name: displayName,
      url,
      publicUrl: url,
      isVideo,
      isCdn: activeBin === "cloud",
      assetId: asset?.id,
      previewKey: asset?.id ?? fileName,
    });
    setIsCompareMode(false);
    setCompareFile(null);

    if (isVideo) {
      const { data: lockData } = await supabase
        .from("video_metadata")
        .select("*")
        .eq("file_name", fileName)
        .single();
      if (lockData && lockData.is_locked) {
        setIsLocked(true);
        setIntegrityHash(lockData.integrity_hash);
      } else {
        setIsLocked(false);
        setIntegrityHash(null);
      }
    }
  };

  const handleSelectCompare = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    if (!value) {
      resetCompareVideoElement();
      setIsCompareMode(false);
      setCompareFile(null);
      return;
    }

    const colonIndex = value.indexOf(":");
    if (colonIndex === -1) return;

    const source = value.slice(0, colonIndex);
    const key = value.slice(colonIndex + 1);
    let compareName = key;
    let url = "";

    if (source === "cloud") {
      const asset = cloudAssets.find((item) => item.id === key);
      if (!asset) return;
      compareName = asset.fileName;
      url = getMediaPlaybackUrl(asset);
    } else if (source === "vault") {
      const resolved = await getSignedUrl(key);
      if (!resolved) return;
      compareName = key;
      url = resolved;
    } else {
      return;
    }

    if (url) {
      resetCompareVideoElement();
      setCompareFile({ name: compareName, url });
      setIsCompareMode(true);
    }
  };

  const handlePictureLock = async () => {
    if (!previewFile || !user || !videoRef.current) return;
    if (
      window.confirm(
        "WARNING: Applying Picture Lock will generate an immutable SHA-256 hash. No further frame changes will be accepted. Proceed?",
      )
    ) {
      setIsLocking(true);
      try {
        const res = await fetch("/api/picture-lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: previewFile.name,
            userId: user.id,
            duration: videoRef.current.duration,
            frameRate: 24,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsLocked(true);
          setIntegrityHash(result.hash);
          alert("PICTURE LOCK SECURED.\nIntegrity Hash: " + result.hash);
        } else {
          alert("Lock Failed: " + result.error);
        }
      } catch (err) {
        console.error("Lock error:", err);
      } finally {
        setIsLocking(false);
      }
    }
  };

  const onDeleteFile = (fileName: string) => setDeleteModalState({ isOpen: true, itemName: fileName, isFolder: false });
  const onRenameFile = (fileName: string) => setRenameModalState({ isOpen: true, itemName: fileName, isFolder: false });
  const onMoveFile = (fileName: string) => setMoveModalState({ isOpen: true, itemName: fileName });
  const onDeleteFolderUI = (folderName: string) => setDeleteModalState({ isOpen: true, itemName: folderName, isFolder: true });

  const onDeleteCloudAsset = (asset: MediaAssetRecord) =>
    setDeleteModalState({
      isOpen: true,
      itemName: asset.fileName,
      isFolder: false,
      source: "cloud",
      assetId: asset.id,
    });

  const onRenameCloudAsset = (asset: MediaAssetRecord) =>
    setRenameModalState({
      isOpen: true,
      itemName: asset.fileName,
      isFolder: false,
      source: "cloud",
      assetId: asset.id,
    });

  const fetchAndSetCloudAssets = useCallback(async () => {
    if (!user?.id) {
      cloudAssetsLoadGenRef.current += 1;
      setCloudAssets([]);
      return;
    }

    const gen = ++cloudAssetsLoadGenRef.current;
    const params = buildMediaAssetFetchParams(currentFolder, user.id);
    const data = await fetchMediaAssets(params);
    if (gen === cloudAssetsLoadGenRef.current) {
      setCloudAssets(data);
    }
  }, [user?.id, currentFolder]);

  const handleR2UploadSuccess = useCallback(
    async (result: import("@/utils/r2Upload").R2UploadResult, file: File) => {
      if (!user?.id) {
        throw new Error("You must be signed in to save cloud uploads.");
      }

      const savedAsset = await saveMediaAsset({
        fileName: file.name,
        publicUrl: result.publicUrl,
        objectKey: result.objectKey,
        mimeType: file.type || "application/octet-stream",
        userId: user.id,
        folder: mediaFolderForSave(currentFolder),
        fileSize: file.size,
        agencyProjectId: isEditor && activeProjectId ? activeProjectId : undefined,
      });

      setActiveBin("cloud");

      await fetchAndSetCloudAssets();
      await fetchAllFolders();

      return savedAsset;
    },
    [
      user,
      currentFolder,
      setActiveBin,
      fetchAllFolders,
      fetchAndSetCloudAssets,
      isEditor,
      activeProjectId,
    ],
  );

  const handleHeaderUpload = useCallback(
    async (files: FileList | null) => {
      await handleUpload(files);
      if (user?.id && activeBin === "cloud") {
        await fetchAndSetCloudAssets();
      }
    },
    [handleUpload, user?.id, activeBin, fetchAndSetCloudAssets],
  );

  const handleCloudAssetPreview = useCallback(
    (asset: MediaAssetRecord) => {
      const isVideo = getMediaFileCategory(asset.fileName) === "video";

      if (isVideo && previewFile?.assetId === asset.id) {
        handleTogglePlay();
        return;
      }

      const playbackUrl = getMediaPlaybackUrl(asset);
      const isProcessing = isMediaAssetProcessing(asset);
      if (!playbackUrl && !isProcessing) {
        console.error("Cloud asset is missing a playback URL:", asset);
        return;
      }

      setPreviewFile({
        name: asset.fileName,
        url: playbackUrl,
        publicUrl: playbackUrl,
        isVideo,
        isCdn: true,
        assetId: asset.id,
        previewKey: asset.id,
      });
      setIsCompareMode(false);
      setCompareFile(null);
    },
    [previewFile, handleTogglePlay, setPreviewFile, setIsCompareMode, setCompareFile],
  );

  const loadCloudAssets = useCallback(async () => {
    if (!user?.id) {
      cloudAssetsLoadGenRef.current += 1;
      setCloudAssets([]);
      return;
    }

    const gen = ++cloudAssetsLoadGenRef.current;
    setCloudAssetsLoading(true);
    try {
      const params = buildMediaAssetFetchParams(currentFolder, user.id);
      const data = await fetchMediaAssets(params);
      if (gen === cloudAssetsLoadGenRef.current) {
        setCloudAssets(data);
      }
    } catch (error) {
      console.error("Failed to load cloud assets:", error);
      if (gen === cloudAssetsLoadGenRef.current) {
        setCloudAssets([]);
      }
    } finally {
      if (gen === cloudAssetsLoadGenRef.current) {
        setCloudAssetsLoading(false);
      }
    }
  }, [user?.id, currentFolder]);

  useEffect(() => {
    if (!loading && user && activeBin === "cloud") {
      loadCloudAssets();
    }
  }, [loading, user, activeBin, loadCloudAssets]);

  const monitoredAssets = useMemo(
    () => (activeBin === "cloud" ? cloudAssets : vaultAssetsList),
    [activeBin, cloudAssets, vaultAssetsList],
  );

  const refreshMonitoredAssets = useCallback(() => {
    if (!user?.id) return;
    if (activeBin === "cloud") {
      void loadCloudAssets();
      return;
    }
    void fetchFiles(user.id, currentFolder);
  }, [user?.id, activeBin, currentFolder, loadCloudAssets, fetchFiles]);

  useMediaProcessingPoll({
    assets: monitoredAssets,
    enabled: !loading && Boolean(user),
    onRefresh: refreshMonitoredAssets,
  });

  const prevActiveBinRef = useRef(activeBin);

  useEffect(() => {
    if (prevActiveBinRef.current !== activeBin) {
      setPreviewFile(null);
      setCompareFile(null);
      setIsCompareMode(false);
      prevActiveBinRef.current = activeBin;
    }
  }, [activeBin, setPreviewFile, setCompareFile, setIsCompareMode]);

  useEffect(() => {
    if (!previewFile?.assetId || activeBin === "cloud") return;

    const vaultFile = vaultItems.find((item) => item.id === previewFile.assetId);
    if (!vaultFile?.name) return;

    const resolvedUrl = fileUrls[vaultFile.name];
    if (!resolvedUrl) return;

    const currentUrl = (previewFile.publicUrl ?? previewFile.url ?? "").trim();
    if (currentUrl === resolvedUrl) return;

    setPreviewFile({
      ...previewFile,
      url: resolvedUrl,
      publicUrl: resolvedUrl,
    });
  }, [vaultItems, fileUrls, previewFile, activeBin, setPreviewFile]);

  const isClientVaultRootSelected = activeBin === "root";

  const galleryTitle = (() => {
    if (isClientVaultRootSelected) {
      return "Client Vault";
    }

    const folderLabel = currentFolder
      ? currentFolder.replace(/\/+$/, "").split("/").pop()
      : null;

    if (activeBin === "cloud") {
      return folderLabel ? `CDN / ${folderLabel}` : "All CDN Assets";
    }
    return folderLabel ? `Vault / ${folderLabel}` : "All Local Assets";
  })();

  const playerControlsDisabled = !previewFile?.isVideo;
  const meterLufs = playerControlsDisabled ? -60 : lufs;

  const handleClientVaultRoot = useCallback(() => {
    setActiveBin("root");
    setCurrentFolder("");
  }, [setActiveBin, setCurrentFolder]);

  const folders = (vaultItems || []).filter((item) => !item?.metadata);
  const files = (vaultItems || []).filter((item) => item?.metadata);
  const filteredFiles = (files || []).filter((item) => {
    if (!item?.name) return false;
    const originalName = item.name
      .substring(item.name.indexOf("_") + 1)
      .toLowerCase();
    return originalName.includes((searchQuery || "").toLowerCase());
  });
  const allVideoFiles = (files || []).filter(
    (f) => f?.name?.match(/\.(mp4|webm|ogg|mov|mxf)$/i) !== null,
  );

  const compareVideoOptions = useMemo(() => {
    const cloudOptions = cloudAssets
      .filter((asset) => getMediaFileCategory(asset.fileName) === "video")
      .filter((asset) => asset.id !== previewFile?.assetId)
      .map((asset) => ({
        value: `cloud:${asset.id}`,
        label: asset.fileName,
      }));

    const vaultOptions = allVideoFiles
      .filter((file) => file.id !== previewFile?.assetId)
      .map((file) => ({
        value: `vault:${file.name}`,
        label: file.name.substring(file.name.indexOf("_") + 1),
      }));

    return [...cloudOptions, ...vaultOptions];
  }, [cloudAssets, allVideoFiles, previewFile?.assetId]);

  const renderCompareSelect = () => (
    <select
      onChange={handleSelectCompare}
      defaultValue=""
      className="bg-[#121217] text-[#d4af37] text-[10px] px-2 py-1 rounded border border-white/10 outline-none cursor-pointer max-w-[100px] sm:max-w-[120px] truncate shrink-0"
    >
      <option value="">Compare...</option>
      {compareVideoOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const {
    viewSettings,
    aspectClass,
    objectFitClass,
    playerSizeClass,
  } = useGalleryViewStyles();

  return (
    <main className="h-screen w-full bg-[#050505] text-gray-300 font-sans flex flex-col overflow-hidden relative">
      <div
        className="fixed top-0 left-0 right-0 h-2 z-[55]"
        onMouseEnter={() => setShowNavbar(true)}
      />

      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out transform ${
          showNavbar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        } bg-[#050505] border-b border-white/5`}
        onMouseLeave={() => setShowNavbar(false)}
      >
        <Navbar />
      </div>

      <DashboardHeader
        handleUpload={handleHeaderUpload}
        uploading={uploading}
        uploadSession={uploadSession}
        onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        onR2UploadSuccess={handleR2UploadSuccess}
      />

      <div className="shrink-0 bg-[#0a0a0f] border-b border-white/5 px-6 py-2 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-white tracking-wide">
          {isEditor ? "Production Workspace" : "Review Workspace"}
        </span>
        <span
          className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border shrink-0 ${
            isEditor
              ? "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]"
              : "border-blue-400/40 bg-blue-400/10 text-blue-300"
          }`}
        >
          {isEditor ? "Editor / Team" : "Client"}
        </span>
        <span className="text-[10px] text-gray-500 hidden sm:inline truncate">
          {isEditor
            ? "Assigned tasks, active project, live editing, uploads, review tools"
            : "Preview assets, give feedback, join live review, approve or request revision"}
        </span>
      </div>

      {isEditor && (
        <div className="shrink-0 bg-[#0a0a0f] border-b border-white/5 relative z-10">
          <div className="w-full flex items-center justify-between px-6 py-2 gap-4">
            <button
              onClick={() => setIsTaskPanelExpanded((prev) => !prev)}
              className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity min-w-0"
            >
              <span className="text-[10px] uppercase tracking-widest text-[#d4af37] shrink-0">
                My Tasks
              </span>
              <span className="text-[10px] text-gray-500 shrink-0">
                {editorTasksLoading
                  ? "Loading..."
                  : `${editorTasks.length} assigned`}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-gray-500 transition-transform shrink-0 ${isTaskPanelExpanded ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {availableProjects.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] uppercase tracking-widest text-gray-500 hidden sm:inline">
                  Active Project
                </span>
                <select
                  value={activeProjectId}
                  onChange={(e) => setActiveProjectId(e.target.value)}
                  className="bg-[#121217] text-[#d4af37] text-[10px] px-2 py-1 border border-white/10 outline-none cursor-pointer max-w-[160px] truncate"
                  title="Uploads will be linked to this project"
                >
                  <option value="">No project (unlinked)</option>
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isTaskPanelExpanded && (
            <div className="px-6 pb-4 max-h-[240px] overflow-y-auto custom-scrollbar">
              {editorTasksFetchError ? (
                <p className="py-2 text-[10px] text-red-400 border border-red-500/20 bg-red-500/5 px-3">
                  {editorTasksFetchError}
                </p>
              ) : null}
              {taskUpdateError ? (
                <p className="py-2 mb-2 text-[10px] text-red-400 border border-red-500/20 bg-red-500/5 px-3">
                  {taskUpdateError}
                </p>
              ) : null}
              {editorTasksLoading ? (
                <p className="text-center py-4 text-[#d4af37] text-[10px] uppercase tracking-widest">
                  Loading tasks...
                </p>
              ) : editorTasks.length === 0 ? (
                <p className="text-center py-4 text-gray-500 text-xs italic">
                  No tasks assigned to you yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {editorTasks.map((task) => {
                    const nextStatus = TASK_NEXT_STATUS[task.status];
                    const statusBadgeClass =
                      task.status === "done"
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : task.status === "in_review"
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                          : task.status === "in_progress"
                            ? "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]"
                            : "border-white/10 bg-white/5 text-gray-400";
                    const clientLabel =
                      task.project?.client?.displayName ||
                      task.project?.client?.email ||
                      null;

                    return (
                      <li
                        key={task.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-white/5 bg-[#121217] gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-200 text-xs font-medium truncate">
                            {task.title}
                          </p>
                          {task.description ? (
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            {task.project ? (
                              <span className="text-[9px] uppercase tracking-widest text-gray-500">
                                {task.project.title}
                              </span>
                            ) : null}
                            {clientLabel ? (
                              <span className="text-[9px] uppercase tracking-widest text-gray-500">
                                {clientLabel}
                              </span>
                            ) : null}
                            {task.dueDate ? (
                              <span className="text-[9px] uppercase tracking-widest text-gray-500">
                                Due {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[9px] uppercase tracking-widest px-2 py-1 border font-bold ${statusBadgeClass}`}
                          >
                            {taskStatusLabels[task.status] || task.status}
                          </span>
                          {nextStatus ? (
                            <button
                              type="button"
                              disabled={taskStatusUpdating === task.id}
                              onClick={() => advanceTaskStatus(task)}
                              className="text-[9px] uppercase tracking-widest px-2 py-1 border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20 transition-colors disabled:opacity-50"
                            >
                              {TASK_STATUS_ACTION_LABELS[task.status]}
                            </button>
                          ) : (
                            <span className="text-[9px] uppercase tracking-widest text-green-400">
                              Completed
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <div
        id="main-workspace-container"
        className="flex flex-col md:flex-row flex-1 overflow-hidden relative min-h-0 w-full"
      >
        {isLiveStreaming ? (
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative w-full min-h-0">
            <TimelineShareWidget cinemaVideoRef={cinemaVideoRef} socket={socket} isEditor={isEditor} />

            <div
              className="relative flex max-md:min-h-[300px] md:min-h-[500px] flex-shrink-0 flex-col border-t border-white/5 bg-[#121217] w-full lg:h-full lg:min-h-0 lg:w-[var(--comments-sidebar-w)] lg:border-l lg:border-t-0 z-40"
              style={{
                ["--comments-sidebar-w" as string]: `${commentsSidebarWidth}px`,
                flexShrink: 0,
              }}
            >
              <div
                onMouseDown={startResizingCommentsSidebar}
                className="absolute left-0 top-0 bottom-0 z-50 hidden w-1 cursor-col-resize hover:bg-[#d4af37]/40 lg:block"
              />
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                <CommentsPanel
                  disabled={false}
                  isLive={isLive}
                  playbackUrl={previewPlaybackUrl}
                  comments={comments}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  handleAddComment={handleAddComment}
                  handleEditComment={handleEditComment}
                  handleDeleteComment={handleDeleteComment}
                  handleNotifyTeam={handleNotifyTeam}
                  isNotifying={isNotifying}
                  notificationSent={notificationSent}
                  jumpToTime={jumpToTime}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            <div
              className={`
                fixed md:relative inset-y-0 left-0 z-40 md:z-20
                h-full shrink-0 bg-[#0a0a0f] border-r border-white/5
                ${isSidebarOpen && !isResizingSidebar.current ? "transition-all duration-300 ease-in-out" : ""}
                ${isSidebarOpen 
                  ? "translate-x-0 opacity-100" 
                  : "md:w-0 -translate-x-full md:translate-x-0 md:opacity-0 overflow-hidden md:border-r-0 pointer-events-none"
                }
              `}
              style={{ width: isSidebarOpen ? (typeof window !== "undefined" && window.innerWidth >= 768 ? sidebarWidth + "px" : "240px") : "0px" }}
            >
              <VaultSidebar
                currentFolder={currentFolder}
                activeBin={activeBin}
                allFolders={allFolders}
                onFolderClick={setCurrentFolder}
                onClientVaultRootClick={handleClientVaultRoot}
                onBinChange={setActiveBin}
                onCreateFolder={handleCreateFolder}
                onDeleteFolder={onDeleteFolderUI}
              />
              <div
                onMouseDown={startResizingSidebar}
                className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-[#d4af37]/50 active:bg-[#d4af37] z-50 hidden md:block transition-colors"
              />
            </div>

            <div
              id="grid-preview-container"
              className="flex flex-col lg:flex-row flex-1 overflow-hidden relative w-full min-w-0 min-h-0"
            >
              <section
                className={`flex flex-col bg-[#050505] shrink-0 w-full max-lg:!w-full lg:shrink-0 h-auto lg:h-full min-h-0 relative transition-none custom-scrollbar ${previewFile ? "hidden lg:flex" : "flex"}`}
                style={{ width: `${leftPaneWidth}%` }}
              >
                <div className="w-full h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#121217] shrink-0 z-20 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-gray-200 whitespace-nowrap">
                      {galleryTitle}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {activeBin !== "root" && (
                      <>
                    <div className="flex items-center bg-[#050505] border border-white/10 rounded-md p-0.5 shadow-inner">
                      <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white/10 text-[#d4af37] shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title="List View">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                      </button>
                      <button onClick={() => setViewMode('grid-sm')} className={`p-1.5 rounded transition-all ${viewMode === 'grid-sm' ? 'bg-white/10 text-[#d4af37] shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title="Small Grid">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                      </button>
                      <button onClick={() => setViewMode('grid-lg')} className={`p-1.5 rounded transition-all ${viewMode === 'grid-lg' ? 'bg-white/10 text-[#d4af37] shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title="Large Grid">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="21"></line></svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#050505] border border-white/10 rounded-md px-3 py-1.5 text-xs text-white w-full max-w-[200px]"
                    />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {isClientVaultRootSelected ? (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-white/5 bg-[#0a0a0f]/40 px-6 py-16 text-center">
                      <span className="mb-4 text-3xl opacity-30">📂</span>
                      <p className="text-xs font-medium uppercase tracking-[0.25em] text-gray-500">
                        Select a folder from the sidebar
                      </p>
                      <p className="mt-2 max-w-xs text-[11px] leading-relaxed text-gray-600">
                        Open Cloud Delivery or Vault inside Client Vault to browse assets.
                      </p>
                    </div>
                  ) : (
                  <div key={activeBin} className="transition-opacity duration-200 ease-in-out">
                    {activeBin === "cloud" ? (
                      <section>
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                              Cloud Delivery
                            </p>
                            <h3 className="mt-1 text-sm font-medium text-gray-200">
                              CDN Assets
                            </h3>
                          </div>
                          <span className="rounded-full border border-white/10 bg-[#121217] px-2.5 py-1 text-[10px] text-gray-500">
                            {cloudAssets.length} file
                            {cloudAssets.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <GalleryBulkActionBar label="cloud" />
                        <CloudAssetGallery
                          assets={cloudAssets}
                          loading={cloudAssetsLoading}
                          searchQuery={searchQuery}
                          onPreviewAsset={handleCloudAssetPreview}
                          onDeleteAsset={onDeleteCloudAsset}
                          onRenameAsset={onRenameCloudAsset}
                        />
                      </section>
                    ) : (
                      <section>
                        <div className="mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                            Vault
                          </p>
                          <h3 className="mt-1 text-sm font-medium text-gray-200">
                            Local Storage
                          </h3>
                        </div>
                        <GalleryBulkActionBar label="vault" />
                        <FileGrid
                          filteredFiles={filteredFiles}
                          currentFolder={currentFolder}
                          fileUrls={fileUrls}
                          thumbnailUrls={thumbnailUrls}
                          vaultAssetsByName={vaultAssetsByName}
                          onPreview={handlePreview}
                          onRenameFile={onRenameFile}
                          onDeleteFile={onDeleteFile}
                          onMoveFile={onMoveFile}
                        />
                      </section>
                    )}
                  </div>
                  )}
                </div>
              </section>

              <div
                onMouseDown={startResizingLeft}
                className="w-[3px] bg-white/5 hover:bg-[#d4af37] cursor-col-resize z-50 shrink-0 hidden lg:block"
              />

              <div className="flex flex-1 flex-col h-full min-h-0 bg-[#0a0a0f] overflow-hidden relative min-w-0 w-full">
                {previewFile && (
                  <button
                    type="button"
                    onClick={() => setPreviewFile(null)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-[#121217] border-b border-white/5 text-[#d4af37] text-xs font-bold uppercase tracking-widest shrink-0 z-30"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Grid
                  </button>
                )}
                {previewFile && (
                  <>
                    {previewFile.isVideo && previewFile.isCdn && (
                      <div className="w-full bg-[#1c1c24] border-b border-[#d4af37]/20 px-4 py-3 flex items-center justify-between z-30 shrink-0 shadow-md">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => setPreviewFile(null)}
                            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 text-white transition-colors border border-white/10"
                            title="Close Preview"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                              CDN Preview
                            </p>
                            <p className="truncate text-sm text-white">{previewFile.name}</p>
                          </div>
                        </div>
                        {flags?.enable_compare_mode && (
                          <div className="flex items-center gap-2 shrink-0">
                            {renderCompareSelect()}
                          </div>
                        )}
                      </div>
                    )}

                    {previewFile.isVideo && !previewFile.isCdn && (
                      <div className="w-full bg-[#1c1c24] border-b border-[#d4af37]/20 p-2 lg:p-3 flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between z-30 shrink-0 shadow-md gap-3">
                      <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                        <button
                          onClick={() => setPreviewFile(null)}
                          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 text-white transition-colors border border-white/10"
                          title="Close Preview"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                        <div className="w-px h-5 bg-white/10 shrink-0"></div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest hidden md:inline">
                            Phase:
                          </span>
                          <select
                            value={projectStage}
                            onChange={(e) => setProjectStage(e.target.value)}
                            className="bg-[#121217] text-[#d4af37] text-[10px] font-bold px-2 py-1 rounded border border-white/10 outline-none cursor-pointer"
                          >
                            {POST_PROD_STAGES.map((stage) => (
                              <option key={stage} value={stage}>
                                {stage}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest hidden sm:inline">
                            Project Progress:
                          </span>
                          <div
                            className="w-20 sm:w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden flex"
                            title={`${projectStage} (${progressPercentage}%)`}
                          >
                            <div
                              className="h-full bg-[#d4af37] transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] text-[#d4af37] font-bold ml-1">
                            {progressPercentage}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0 shrink-0">
                        {flags?.enable_compare_mode && (
                          <>
                            {renderCompareSelect()}
                            <div className="w-px h-5 bg-white/10 mx-1 shrink-0"></div>
                          </>
                        )}

                        {flags?.enable_picture_lock && (
                          <>
                            {isLocked ? (
                              <div
                                className="flex items-center gap-1 text-green-400 bg-green-900/20 border border-green-500/30 px-2 py-1 rounded shrink-0"
                                title={`SHA-256: ${integrityHash}`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M19 11h-1V7a6 6 0 0 0-12 0v4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V13a2 2 0 0 0-2-2zm-7 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-8H9V7a3 3 0 0 1 6 0v4z" />
                                </svg>
                                <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">
                                  Locked
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={handlePictureLock}
                                disabled={isLocking}
                                className="flex items-center gap-1 text-red-400 hover:text-white transition-colors bg-red-900/20 hover:bg-red-800/40 border border-red-500/30 px-2 py-1 rounded shrink-0"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">
                                  {isLocking ? "Locking..." : "Lock"}
                                </span>
                              </button>
                            )}
                            <div className="w-px h-5 bg-white/10 mx-1 shrink-0"></div>
                          </>
                        )}

                        <button
                          onClick={handleDownloadReport}
                          className="text-[9px] uppercase font-bold tracking-widest bg-[#121217] border border-white/10 hover:border-[#d4af37] text-white px-2 py-1.5 rounded transition-colors shrink-0"
                        >
                          Report
                        </button>
                        <button
                          onClick={() => handleExportMarkers()}
                          className="text-[9px] uppercase font-bold tracking-widest bg-[#121217] border border-white/10 hover:border-[#d4af37] text-white px-2 py-1.5 rounded transition-colors shrink-0"
                          title="Download timestamped markers as CSV, JSON, and Premiere XML"
                        >
                          Export Markers
                        </button>
                        <button
                          onClick={handleCompileAndSend}
                          disabled={isNotifying}
                          className="text-[9px] uppercase font-bold tracking-widest bg-[#d4af37] hover:bg-[#b8952b] text-black px-2 py-1.5 rounded transition-colors shadow-md shrink-0"
                        >
                          {isNotifying ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                )}

                <section className="flex flex-1 w-full min-h-0 flex-col overflow-hidden lg:flex-row">
                    <div className="flex min-h-[40vh] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
                      <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
                      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden p-2 lg:p-4">
                        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                          {!previewFile ? (
                            <div className="flex flex-1 flex-col items-center justify-center w-full h-full text-gray-500 bg-[#0a0a0f] relative overflow-hidden rounded-lg border border-white/5">
                              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                              <span className="text-6xl mb-6 opacity-20 drop-shadow-2xl">🎞️</span>
                              <p className="text-xs font-bold tracking-widest uppercase text-gray-500/50">
                                Select an asset to preview
                              </p>
                            </div>
                          ) : (
                            <MediaPreviewPanel
                              fileName={previewFile.name}
                              previewPlaybackUrl={previewPlaybackUrl}
                              imageClassName={`bg-black rounded shadow-2xl border border-white/5 ${playerSizeClass} ${aspectClass} ${objectFitClass}`}
                              videoPreview={
                            <div
                              className={`flex flex-1 w-full h-full justify-center items-center ${flags?.enable_compare_mode && isCompareMode ? "flex-col sm:flex-row gap-4" : "flex-col"} min-h-0 min-w-0`}
                            >
                              <div
                                className={`relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden ${playerSizeClass} ${aspectClass}`}
                              >
                                {flags?.enable_compare_mode && isCompareMode && (
                                    <span className="absolute top-2 left-2 bg-black/80 text-[#d4af37] text-[10px] px-2 py-1 rounded backdrop-blur border border-white/10 z-10 font-bold tracking-widest shadow-lg">
                                      V2 (Current)
                                    </span>
                                  )}
                                <StreamingVideoPlayer
                                  key={previewPlayerKey}
                                  playbackKey={previewPlayerKey}
                                  ref={videoRef}
                                  src={previewPlaybackUrl}
                                  aspectRatio={viewSettings.aspectRatio}
                                  crossOrigin="anonymous"
                                  controls={false}
                                  videoClassName={`shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg border border-white/10 ${objectFitClass}`}
                                  className={`w-full h-full ${objectFitClass}`}
                                >
                                  <VideoCaptionTracks tracks={activeSubtitleTracks} />
                                </StreamingVideoPlayer>
                              </div>

                              {flags?.enable_compare_mode &&
                                isCompareMode &&
                                compareFile && (
                                  <div
                                    className={`relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden ${playerSizeClass} ${aspectClass}`}
                                  >
                                    <span className="absolute top-2 left-2 bg-black/80 text-gray-300 text-[10px] px-2 py-1 rounded backdrop-blur border border-white/10 z-10 font-bold tracking-widest shadow-lg">
                                      V1 (Reference)
                                    </span>
                                    <StreamingVideoPlayer
                                      key={comparePlayerKey}
                                      playbackKey={comparePlayerKey}
                                      ref={compareVideoRef}
                                      src={compareFile.url}
                                      aspectRatio={viewSettings.aspectRatio}
                                      crossOrigin="anonymous"
                                      muted
                                      controls={false}
                                      videoClassName={`shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg border border-white/10 ${objectFitClass}`}
                                    />
                                  </div>
                                )}
                            </div>
                              }
                            />
                          )}
                        </div>

                        <div className="shrink-0 mx-auto mt-3 w-full max-w-2xl min-w-0 flex flex-col gap-2 z-20">
                          <VideoTimelineScrubber
                            videoRef={videoRef}
                            disabled={playerControlsDisabled}
                            mediaKey={
                              previewFile?.publicUrl ??
                              previewFile?.url ??
                              ""
                            }
                            comments={comments}
                            onMarkerClick={jumpToTime}
                          />
                        <fieldset
                          disabled={playerControlsDisabled}
                          className={`flex flex-wrap justify-center items-center gap-2 sm:gap-4 bg-[#121217] border border-white/10 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-2xl text-xs select-none relative w-full min-w-0 ${playerControlsDisabled ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-[10px] uppercase font-semibold">
                              Speed:
                            </span>
                            <select
                              onChange={(e) => {
                                if (videoRef.current)
                                  videoRef.current.playbackRate = parseFloat(
                                    e.target.value,
                                  );
                              }}
                              defaultValue="1"
                              className="bg-[#050505] border border-white/10 rounded px-2 py-0.5 text-white text-[11px] outline-none cursor-pointer disabled:cursor-not-allowed"
                            >
                              <option value="0.5">0.5x</option>
                              <option value="1">1.0x</option>
                              <option value="2">2.0x</option>
                            </select>
                          </div>
                          <div className="w-px h-4 bg-white/10" />

                          <div className="flex items-center gap-1 sm:gap-2">
                            <button
                              type="button"
                              onClick={stepBackward}
                              className="px-2 py-1 bg-[#050505] hover:bg-[#d4af37]/20 border border-white/5 hover:border-[#d4af37]/30 text-gray-300 hover:text-[#d4af37] rounded disabled:hover:bg-[#050505] disabled:hover:text-gray-300"
                            >
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <div className="font-mono text-[10px] sm:text-[11px] text-[#d4af37] font-medium tracking-widest px-2 py-1 bg-[#050505] rounded border border-white/10">
                              {playerControlsDisabled ? "00:00:00:00" : smpteTimecode}
                            </div>
                            <button
                              type="button"
                              onClick={stepForward}
                              className="px-2 py-1 bg-[#050505] hover:bg-[#d4af37]/20 border border-white/5 hover:border-[#d4af37]/30 text-gray-300 hover:text-[#d4af37] rounded disabled:hover:bg-[#050505] disabled:hover:text-gray-300"
                            >
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="w-px h-4 bg-white/10" />

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (videoRef.current)
                                  videoRef.current.currentTime = Math.max(
                                    0,
                                    videoRef.current.currentTime - 5,
                                  );
                              }}
                              className="px-1 sm:px-2 py-1 bg-[#050505] border border-white/5 hover:text-white rounded text-[9px] sm:text-[10px] font-mono disabled:hover:text-gray-300"
                            >
                              -5s
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (videoRef.current)
                                  videoRef.current.currentTime = Math.min(
                                    videoRef.current.duration,
                                    videoRef.current.currentTime + 5,
                                  );
                              }}
                              className="px-1 sm:px-2 py-1 bg-[#050505] border border-white/5 hover:text-white rounded text-[9px] sm:text-[10px] font-mono disabled:hover:text-gray-300"
                            >
                              +5s
                            </button>
                          </div>

                          <div className="w-px h-4 bg-white/10" />

                          <button
                            type="button"
                            onClick={handleTogglePlay}
                            className="px-3 sm:px-4 py-1.5 bg-[#d4af37] text-black font-bold text-[9px] sm:text-[10px] uppercase rounded-full tracking-widest hover:scale-105 transition-transform shadow-md truncate disabled:opacity-60 disabled:hover:scale-100"
                          >
                            Play / Pause
                          </button>
                        </fieldset>
                        </div>
                      </div>

                      <div className="shrink-0 w-16 h-full hidden md:flex flex-col justify-center border-l border-white/5 bg-[#0a0a0f] p-2 z-20">
                        <LUFSMeter lufs={meterLufs} />
                      </div>
                      </div>
                    </div>

                    <div
                      className="relative flex max-md:min-h-[300px] md:min-h-[500px] flex-shrink-0 flex-col border-t border-white/5 bg-[#121217] w-full lg:h-full lg:min-h-0 lg:w-[var(--comments-sidebar-w)] lg:border-l lg:border-t-0 z-40"
                      style={{
                        ["--comments-sidebar-w" as string]: `${commentsSidebarWidth}px`,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        onMouseDown={startResizingCommentsSidebar}
                        className="absolute left-0 top-0 bottom-0 z-50 hidden w-1 cursor-col-resize hover:bg-[#d4af37]/40 lg:block"
                      />
                      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                        <CommentsPanel
                          disabled={playerControlsDisabled}
                          isLive={isLive}
                          playbackUrl={previewPlaybackUrl}
                          comments={comments}
                          newComment={newComment}
                          setNewComment={setNewComment}
                          handleAddComment={handleAddComment}
                          handleEditComment={handleEditComment}
                          handleDeleteComment={handleDeleteComment}
                          handleNotifyTeam={handleNotifyTeam}
                          isNotifying={isNotifying}
                          notificationSent={notificationSent}
                          jumpToTime={jumpToTime}
                        />
                      </div>
                    </div>
                    </section>
              </div>
            </div>
          </>
        )}
      </div>
    <RenameModal
        isOpen={renameModalState.isOpen}
        onClose={() => setRenameModalState({ isOpen: false, itemName: "", isFolder: false })}
        onConfirm={async (newName) => {
          if (renameModalState.source === "cloud" && renameModalState.assetId) {
            const name = renameModalState.itemName;
            const dotIdx = name.lastIndexOf(".");
            const ext = dotIdx !== -1 ? name.substring(dotIdx) : "";
            try {
              await updateMediaAsset(renameModalState.assetId, {
                fileName: `${newName.trim()}${ext}`,
              });
              if (previewFile?.assetId === renameModalState.assetId) {
                setPreviewFile(null);
              }
              await loadCloudAssets();
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Failed to rename cloud asset.",
              );
            }
          } else {
            handleRenameFile(renameModalState.itemName, newName, () => {
              if (previewFile?.name === renameModalState.itemName) setPreviewFile(null);
            });
          }
          setRenameModalState({ isOpen: false, itemName: "", isFolder: false });
        }}
        currentName={(() => {
          const name = renameModalState.itemName;
          if (renameModalState.source === "cloud") {
            const dotIdx = name.lastIndexOf(".");
            return dotIdx !== -1 ? name.substring(0, dotIdx) : name;
          }
          const underscoreIdx = name.indexOf("_");
          const actualNameWithExt = underscoreIdx !== -1 ? name.substring(underscoreIdx + 1) : name;
          const dotIdx = actualNameWithExt.lastIndexOf(".");
          return dotIdx !== -1 ? actualNameWithExt.substring(0, dotIdx) : actualNameWithExt;
        })()}
      />
      
      <DeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, itemName: "", isFolder: false })}
        onConfirm={async () => {
          if (deleteModalState.isFolder) {
            await handleDeleteFolder(deleteModalState.itemName);
            await loadCloudAssets();
          } else if (deleteModalState.source === "cloud" && deleteModalState.assetId) {
            try {
              await deleteMediaAsset(deleteModalState.assetId);
              if (previewFile?.assetId === deleteModalState.assetId) {
                setPreviewFile(null);
              }
              await loadCloudAssets();
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Failed to delete cloud asset.",
              );
            }
          } else {
            handleDeleteFile(deleteModalState.itemName, () => {
              if (previewFile?.name === deleteModalState.itemName) setPreviewFile(null);
            });
          }
          setDeleteModalState({ isOpen: false, itemName: "", isFolder: false });
        }}
        assetName={(() => {
          const name = deleteModalState.itemName;
          if (deleteModalState.isFolder || deleteModalState.source === "cloud") return name;
          const underscoreIdx = name.indexOf("_");
          return underscoreIdx !== -1 ? name.substring(underscoreIdx + 1) : name;
        })()}
        isFolder={deleteModalState.isFolder}
      />

      <MoveModal
        isOpen={moveModalState.isOpen}
        onClose={() => setMoveModalState({ isOpen: false, itemName: "" })}
        onConfirm={(dest) => {
          handleMoveFile(moveModalState.itemName, dest, () => {
            if (previewFile?.name === moveModalState.itemName) setPreviewFile(null);
          });
          setMoveModalState({ isOpen: false, itemName: "" });
        }}
        currentPath={currentFolder}
        folders={allFolders}
      />

      <ToastHost />
    </main>
  );
}
