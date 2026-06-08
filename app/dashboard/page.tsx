"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

// Hooks
import { useFrameAccurateVideo } from "@/hooks/useFrameAccurateVideo";
import { useLUFSMeter } from "@/hooks/useLUFSMeter";
import { useFileManager } from "@/hooks/useFileManager";
import { useLiveComments } from "@/hooks/useLiveComments";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

// Components
import Navbar from "@/components/Navbar"; // 🚀 FIX: Global Navbar imported
import VaultSidebar from "@/components/VaultSidebar";
import CommentsPanel from "@/components/CommentsPanel";
import LiveSessionWidget from "@/components/LiveSessionWidget";
import DashboardHeader from "@/components/DashboardHeader";

// Inline LUFS Meter Component
const LUFSMeter = ({ lufs }: { lufs: number }) => {
  const boundedLufs = Math.max(-60, Math.min(0, lufs));
  const heightPercentage = ((boundedLufs + 60) / 60) * 100;

  let barColor = "bg-green-500";
  if (boundedLufs > -14 && boundedLufs <= -9) barColor = "bg-yellow-400";
  else if (boundedLufs > -9) barColor = "bg-red-500";

  return (
    <div
      className="flex flex-col items-center gap-2 h-full justify-center w-12 shrink-0 bg-[#121217] rounded-xl border border-white/5 p-2 shadow-xl z-10"
      title={`Momentary LUFS: ${boundedLufs.toFixed(1)} dBFS`}
    >
      <div className="text-[9px] text-gray-500 font-mono font-bold">0</div>
      <div className="w-3.5 flex-1 min-h-[150px] bg-[#050505] rounded-full border border-white/10 overflow-hidden relative flex flex-col-reverse shadow-inner">
        <div
          className={`w-full transition-all duration-75 ease-linear ${barColor}`}
          style={{ height: `${heightPercentage}%` }}
        />
        <div
          className="absolute top-[23%] left-0 w-full border-b-2 border-yellow-500/50"
          title="-14 dBFS Target"
        />
        <div
          className="absolute top-[50%] left-0 w-full border-b border-white/20"
          title="-30 dBFS"
        />
      </div>
      <div className="text-[9px] text-gray-500 font-mono font-bold">-60</div>
      <div className="mt-1 text-[9px] text-[#d4af37] font-bold text-center w-full bg-[#1c1c24] py-1 rounded shadow border border-white/5 truncate">
        {boundedLufs === -60 ? "-∞" : boundedLufs.toFixed(0)}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNavbar, setShowNavbar] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch feature flags
  const { flags } = useFeatureFlags(user?.id);

  // Layout & Settings State
  const [viewSettings, setViewSettings] = useState({
    cardSize: "M",
    aspectRatio: "video",
    thumbnailScale: "Fit",
    showCardInfo: true,
  });
  const [leftPaneWidth, setLeftPaneWidth] = useState(35);
  const isResizingLeft = useRef(false);

  // Live Session Minimize State
  const [isLiveMinimized, setIsLiveMinimized] = useState(true);

  // File & Folder State
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    isVideo: boolean;
  } | null>(null);

  // Project Progress Logic
  const POST_PROD_STAGES = [
    "Ingest & Sync",
    "Rough Cut",
    "VFX & Color",
    "Sound Mix",
    "Picture Lock",
    "Final Master",
  ];
  const [projectStage, setProjectStage] = useState(POST_PROD_STAGES[1]);
  const currentStageIndex = POST_PROD_STAGES.indexOf(projectStage);
  const progressPercentage = Math.round(
    ((currentStageIndex + 1) / POST_PROD_STAGES.length) * 100,
  );

  const [isLocked, setIsLocked] = useState(false);
  const [integrityHash, setIntegrityHash] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareFile, setCompareFile] = useState<{
    name: string;
    url: string;
  } | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const compareVideoRef = useRef<HTMLVideoElement>(null);

  // File Manager Hook
  const {
    vaultItems,
    fileUrls,
    uploading,
    handleUpload,
    getSignedUrl,
    handleDeleteFile,
    handleRenameFile,
    handleCreateFolder,
    handleDeleteFolder,
  } = useFileManager(user, currentFolder);

  // Live Comments Hook
  const {
    comments,
    setComments,
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
    jumpToTime,
  } = useLiveComments(user, previewFile, videoRef);

  const { smpteTimecode, stepForward, stepBackward } = useFrameAccurateVideo(
    videoRef,
    24,
  );
  const { lufs } = useLUFSMeter(videoRef, previewFile?.url);

  // Sidebar default state based on window size
  useEffect(() => {
    setIsSidebarOpen(window.innerWidth >= 768);
  }, []);

  // User Auth Initializer
  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (isMounted && currentUser) {
        setUser(currentUser);
        setLoading(false);
      }
    };
    loadUser();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Sync main and compare video elements
  const handleTogglePlay = () => {
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
  };

  useEffect(() => {
    const main = videoRef.current;
    const comp = compareVideoRef.current;
    if (!main || !comp || !isCompareMode || !flags?.enable_compare_mode) return;

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

    main.addEventListener("play", syncPlay);
    main.addEventListener("pause", syncPause);
    main.addEventListener("seeked", syncSeek);
    main.addEventListener("ratechange", syncRate);

    return () => {
      main.removeEventListener("play", syncPlay);
      main.removeEventListener("pause", syncPause);
      main.removeEventListener("seeked", syncSeek);
      main.removeEventListener("ratechange", syncRate);
    };
  }, [isCompareMode, compareFile, previewFile, flags]);

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
  }, [previewFile, stepBackward, stepForward, isCompareMode, flags]);

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
  }, []);

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

  // Core actions
  const handlePreview = async (fileName: string) => {
    const url = await getSignedUrl(fileName);
    if (url) {
      const isVideo = fileName.match(/\.(mp4|webm|ogg|mov|mxf)$/i) !== null;
      setPreviewFile({ name: fileName, url, isVideo });
      setIsCompareMode(false);
      setCompareFile(null);

      if (isVideo) {
        const { data } = await supabase
          .from("video_comments")
          .select("*")
          .eq("file_name", fileName)
          .order("time_stamp", { ascending: true });
        if (data) setComments(data);

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
    }
  };

  const handleSelectCompare = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const fileName = e.target.value;
    if (!fileName) {
      setIsCompareMode(false);
      setCompareFile(null);
      return;
    }
    const url = await getSignedUrl(fileName);
    if (url) {
      setCompareFile({ name: fileName, url });
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

  const onDeleteFile = (fileName: string) =>
    handleDeleteFile(fileName, () => {
      if (previewFile?.name === fileName) setPreviewFile(null);
    });
  const onRenameFile = (oldName: string) =>
    handleRenameFile(oldName, () => {
      if (previewFile?.name === oldName) setPreviewFile(null);
    });

  const folders = vaultItems.filter((item) => !item.metadata);
  const files = vaultItems.filter((item) => item.metadata);
  const filteredFiles = files.filter((item) => {
    const originalName = item.name
      .substring(item.name.indexOf("_") + 1)
      .toLowerCase();
    return originalName.includes(searchQuery.toLowerCase());
  });
  const allVideoFiles = files.filter(
    (f) => f.name.match(/\.(mp4|webm|ogg|mov|mxf)$/i) !== null,
  );

  // Aspect ratio and player size calculation
  const aspectClass =
    viewSettings.aspectRatio === "video"
      ? "aspect-video"
      : viewSettings.aspectRatio === "square"
        ? "aspect-square"
        : "aspect-[9/16]";

  const playerSizeClass =
    viewSettings.aspectRatio === "video"
      ? "w-full h-auto max-h-full"
      : "h-full w-auto max-w-full";

  const objectFitClass =
    viewSettings.thumbnailScale === "Fill" ? "object-cover" : "object-contain";

  const gridColumnSize =
    viewSettings.cardSize === "S"
      ? 120
      : viewSettings.cardSize === "L"
        ? 320
        : 200;

  return (
    // 🚀 FIX: Changed w-screen to w-full to prevent horizontal scrolling bugs
    <main className="h-screen w-full bg-[#050505] text-gray-300 font-sans flex flex-col overflow-hidden relative">
      {/* Navbar Hover Trigger Zone */}
      <div
        className="fixed top-0 left-0 right-0 h-2 z-[55]"
        onMouseEnter={() => setShowNavbar(true)}
      />

      {/* Slide-down Global Navbar container */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out transform ${
          showNavbar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        } bg-[#050505] border-b border-white/5`}
        onMouseLeave={() => setShowNavbar(false)}
      >
        <Navbar />
      </div>

      <DashboardHeader
        viewSettings={viewSettings}
        setViewSettings={setViewSettings}
        handleUpload={handleUpload}
        uploading={uploading}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* FIXED LIVE SESSION CONTAINER (Bottom Left) */}
      {flags?.enable_live_session && user && socket && (
        <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start transition-all duration-300">
          {isLiveMinimized && (
            <button
              onClick={() => setIsLiveMinimized(false)}
              className="bg-[#121217] hover:bg-[#1c1c24] border border-[#d4af37]/40 text-[#d4af37] font-bold text-xs px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span>START LIVE SESSION</span>
            </button>
          )}

          {!isLiveMinimized && (
            <div className="relative w-[350px] shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0f]">
              <button
                onClick={() => setIsLiveMinimized(true)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-white/20 text-white rounded p-1.5 transition-colors z-[70] backdrop-blur-md border border-white/10 flex items-center justify-center w-7 h-7"
                title="Minimize Live Session"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>

              <div className="[&>*]:!relative [&>*]:!inset-auto [&>*]:!bottom-auto [&>*]:!left-auto [&>*]:!right-auto [&>*]:!top-auto [&>*]:!m-0">
                <LiveSessionWidget
                  socket={socket}
                  roomId={previewFile?.name || currentFolder || "global-lobby"}
                  user={user}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Workspace Container */}
      <div
        id="main-workspace-container"
        className="flex flex-1 overflow-hidden relative min-h-0"
      >
        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Collapsible & responsive sidebar wrapper */}
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-40 md:z-20
            h-full shrink-0 bg-[#0a0a0f] border-r border-white/5
            transition-all duration-300 ease-in-out
            ${isSidebarOpen 
              ? "w-60 translate-x-0 opacity-100" 
              : "w-60 md:w-0 -translate-x-full md:translate-x-0 md:opacity-0 overflow-hidden md:border-r-0 pointer-events-none"
            }
          `}
        >
          <VaultSidebar
            currentFolder={currentFolder}
            folders={folders}
            onFolderClick={setCurrentFolder}
            onRootClick={() => setCurrentFolder("")}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>

        <div
          id="grid-preview-container"
          className="flex flex-1 overflow-hidden relative"
        >
          <section
            className={`flex flex-col bg-[#050505] shrink-0 h-full relative transition-none custom-scrollbar ${previewFile ? "hidden lg:flex" : "flex"}`}
            style={{ width: previewFile ? `${leftPaneWidth}%` : "100%" }}
          >
            <div className="h-14 flex flex-col md:flex-row items-center justify-between px-6 border-b border-white/5 bg-[#121217] shrink-0 z-20 relative">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-gray-200">
                  {currentFolder
                    ? currentFolder.split("/").pop()
                    : "All Assets"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#050505] border border-white/10 rounded-md px-3 py-1.5 text-xs text-white w-full max-w-[200px]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(${gridColumnSize}px, 1fr))`,
                }}
              >
                {filteredFiles.map((item) => {
                  const originalName = item.name.substring(
                    item.name.indexOf("_") + 1,
                  );
                  const isVideoFile = item.name.match(
                    /\.(mp4|webm|ogg|mov|mxf)$/i,
                  );
                  const isImage = item.name.match(
                    /\.(jpg|jpeg|png|gif|webp)$/i,
                  );
                  const isSelected = previewFile?.name === item.name;
                  const fileUrl = fileUrls[item.name];

                  return (
                    <div
                      key={item.id}
                      className={`bg-[#121217] rounded-lg border overflow-hidden relative group cursor-pointer ${isSelected ? "border-[#d4af37]" : "border-white/5"}`}
                      onClick={() => handlePreview(item.name)}
                    >
                      <div
                        className={`w-full bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden ${aspectClass}`}
                      >
                        {fileUrl ? (
                          isVideoFile ? (
                            <video
                              crossOrigin="anonymous"
                              src={`${fileUrl}#t=0.5`}
                              className={`w-full h-full ${objectFitClass}`}
                              preload="metadata"
                            />
                          ) : isImage ? (
                            <img
                              src={fileUrl}
                              className={`w-full h-full ${objectFitClass}`}
                            />
                          ) : (
                            <div className="text-xs text-gray-500">File</div>
                          )
                        ) : (
                          <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>

                      {viewSettings.showCardInfo && (
                        <div className="p-3 border-t border-white/5 relative group/card">
                          <p className="text-xs truncate pr-12">
                            {originalName}
                          </p>
                          <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity bg-[#121217] pl-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRenameFile(item.name);
                              }}
                              className="p-1 text-gray-400 hover:text-[#d4af37] transition-colors"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFile(item.name);
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {previewFile && (
            <div
              onMouseDown={startResizingLeft}
              className="w-[3px] bg-white/5 hover:bg-[#d4af37] cursor-col-resize z-50 shrink-0 hidden lg:block"
            />
          )}

          {/* 🚀 PREVIEW AREA (Responsive Fix Applied Here) */}
          {previewFile && (
            <div className="flex flex-1 flex-col h-full bg-[#0a0a0f] overflow-hidden relative min-w-0">
              {previewFile.isVideo && (
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
                        <select
                          onChange={handleSelectCompare}
                          defaultValue=""
                          className="bg-[#121217] text-[#d4af37] text-[10px] px-2 py-1 rounded border border-white/10 outline-none cursor-pointer max-w-[100px] sm:max-w-[120px] truncate shrink-0"
                        >
                          <option value="">Compare...</option>
                          {allVideoFiles
                            .filter((f) => f.name !== previewFile.name)
                            .map((f) => (
                              <option key={f.id} value={f.name}>
                                {f.name.substring(f.name.indexOf("_") + 1)}
                              </option>
                            ))}
                        </select>
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
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              ></rect>
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
                      onClick={handleCompileAndSend}
                      disabled={isNotifying}
                      className="text-[9px] uppercase font-bold tracking-widest bg-[#d4af37] hover:bg-[#b8952b] text-black px-2 py-1.5 rounded transition-colors shadow-md shrink-0"
                    >
                      {isNotifying ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              )}

              <section className="flex-1 w-full flex flex-col lg:flex-row relative overflow-y-auto lg:overflow-hidden custom-scrollbar min-h-0">
                <div className="flex-1 flex flex-row min-w-0 lg:overflow-hidden min-h-[40vh] lg:min-h-0 shrink-0">
                  <div className="flex-1 flex flex-col p-2 lg:p-4 overflow-hidden relative min-w-0">
                    {previewFile.isVideo ? (
                      <>
                        <div
                          className={`flex flex-1 w-full h-full justify-center items-center ${flags?.enable_compare_mode && isCompareMode ? "flex-col sm:flex-row gap-4" : "flex-col"} min-h-0 min-w-0 pb-4`}
                        >
                          <div
                            className={`relative flex flex-col items-center justify-center min-h-0 min-w-0 overflow-hidden ${playerSizeClass} ${aspectClass}`}
                          >
                            {flags?.enable_compare_mode && isCompareMode && (
                              <span className="absolute top-2 left-2 bg-black/80 text-[#d4af37] text-[10px] px-2 py-1 rounded backdrop-blur border border-white/10 z-10 font-bold tracking-widest shadow-lg">
                                V2 (Current)
                              </span>
                            )}
                            <video
                              ref={videoRef}
                              src={previewFile.url}
                              crossOrigin="anonymous"
                              controls={
                                !(flags?.enable_compare_mode && isCompareMode)
                              }
                              className={`w-full h-full bg-[#050505] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg border border-white/10 ${objectFitClass}`}
                            />
                          </div>

                          {flags?.enable_compare_mode &&
                            isCompareMode &&
                            compareFile && (
                              <div
                                className={`relative flex flex-col items-center justify-center min-h-0 min-w-0 overflow-hidden ${playerSizeClass} ${aspectClass}`}
                              >
                                <span className="absolute top-2 left-2 bg-black/80 text-gray-300 text-[10px] px-2 py-1 rounded backdrop-blur border border-white/10 z-10 font-bold tracking-widest shadow-lg">
                                  V1 (Reference)
                                </span>
                                <video
                                  ref={compareVideoRef}
                                  src={compareFile.url}
                                  crossOrigin="anonymous"
                                  muted
                                  controls={false}
                                  className={`w-full h-full bg-[#050505] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg border border-white/10 ${objectFitClass}`}
                                />
                              </div>
                            )}
                        </div>

                        <div className="shrink-0 mx-auto flex flex-wrap justify-center items-center gap-2 sm:gap-4 bg-[#121217] border border-white/10 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-2xl text-xs select-none relative z-20 w-full max-w-2xl">
                          <div className="hidden sm:flex items-center gap-2">
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
                              className="bg-[#050505] border border-white/10 rounded px-2 py-0.5 text-white text-[11px] outline-none cursor-pointer"
                            >
                              <option value="0.5">0.5x</option>
                              <option value="1">1.0x</option>
                              <option value="2">2.0x</option>
                            </select>
                          </div>
                          <div className="hidden sm:block w-px h-4 bg-white/10"></div>

                          <div className="flex items-center gap-1 sm:gap-2">
                            <button
                              onClick={stepBackward}
                              className="px-2 py-1 bg-[#050505] hover:bg-[#d4af37]/20 border border-white/5 hover:border-[#d4af37]/30 text-gray-300 hover:text-[#d4af37] rounded"
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
                              {smpteTimecode}
                            </div>
                            <button
                              onClick={stepForward}
                              className="px-2 py-1 bg-[#050505] hover:bg-[#d4af37]/20 border border-white/5 hover:border-[#d4af37]/30 text-gray-300 hover:text-[#d4af37] rounded"
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

                          <div className="w-px h-4 bg-white/10"></div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                if (videoRef.current)
                                  videoRef.current.currentTime = Math.max(
                                    0,
                                    videoRef.current.currentTime - 5,
                                  );
                              }}
                              className="px-1 sm:px-2 py-1 bg-[#050505] border border-white/5 hover:text-white rounded text-[9px] sm:text-[10px] font-mono"
                            >
                              -5s
                            </button>
                            <button
                              onClick={() => {
                                if (videoRef.current)
                                  videoRef.current.currentTime = Math.min(
                                    videoRef.current.duration,
                                    videoRef.current.currentTime + 5,
                                  );
                              }}
                              className="px-1 sm:px-2 py-1 bg-[#050505] border border-white/5 hover:text-white rounded text-[9px] sm:text-[10px] font-mono"
                            >
                              +5s
                            </button>
                          </div>

                          <div className="w-px h-4 bg-white/10"></div>

                          <button
                            onClick={handleTogglePlay}
                            className="px-3 sm:px-4 py-1.5 bg-[#d4af37] text-black font-bold text-[9px] sm:text-[10px] uppercase rounded-full tracking-widest hover:scale-105 transition-transform shadow-md truncate"
                          >
                            Play / Pause
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex justify-center items-center pb-4 min-h-0 min-w-0">
                        <img
                          src={previewFile.url}
                          className={`bg-black rounded shadow-2xl border border-white/5 ${playerSizeClass} ${aspectClass} ${objectFitClass}`}
                        />
                      </div>
                    )}
                  </div>

                  {previewFile.isVideo && (
                    <div className="shrink-0 w-16 h-full hidden md:flex flex-col justify-center border-l border-white/5 bg-[#0a0a0f] p-2 z-20">
                      <LUFSMeter lufs={lufs} />
                    </div>
                  )}
                </div>

                {/* 🚀 Comments Panel Area (Responsive Fix) */}
                {previewFile.isVideo && (
                  <div className="w-full lg:w-[320px] shrink-0 bg-[#121217] border-t lg:border-t-0 lg:border-l border-white/5 z-40 flex flex-col min-h-[500px] lg:min-h-0 lg:h-full">
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                      <CommentsPanel
                        isLive={isLive}
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
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
