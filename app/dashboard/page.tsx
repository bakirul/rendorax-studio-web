"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// --- APPEARANCE MENU COMPONENT (Kachna Media Theme) ---
const AppearanceMenu = ({
  settings,
  onSettingsChange,
}: {
  settings: any;
  onSettingsChange: (k: string, v: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[11px] uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-[#d4af37]/10 transition-colors text-white flex items-center gap-2 bg-[#1c1c24] rounded-md shadow-sm"
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
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span>Appearance</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#1c1c24] border border-[#d4af37]/30 p-4 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.7)] rounded-lg text-sm select-none">
          <div className="flex items-center gap-2 text-[#d4af37] mb-4 pb-3 border-b border-white/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
                  height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span className="text-xs">Visible to only you</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Card Size</span>
              <div className="flex bg-[#121217] rounded-md border border-white/5 p-1">
                {["S", "M", "L"].map((size) => (
                  <button
                    key={size}
                    onClick={() => onSettingsChange("cardSize", size)}
                    className={`w-8 py-1 text-xs rounded transition-all ${settings.cardSize === size ? "bg-[#d4af37] text-black font-bold" : "text-gray-500 hover:text-white"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-300">Aspect Ratio</span>
              <div className="flex bg-[#121217] rounded-md border border-white/5 p-1 gap-1">
                <button
                  onClick={() => onSettingsChange("aspectRatio", "video")}
                  className={`w-8 h-6 flex items-center justify-center rounded transition-all ${settings.aspectRatio === "video" ? "bg-[#d4af37] text-black" : "text-gray-500 hover:text-white"}`}
                  title="16:9"
                >
                  <div className="w-5 h-3 border-2 border-current rounded-sm"></div>
                </button>
                <button
                  onClick={() => onSettingsChange("aspectRatio", "square")}
                  className={`w-8 h-6 flex items-center justify-center rounded transition-all ${settings.aspectRatio === "square" ? "bg-[#d4af37] text-black" : "text-gray-500 hover:text-white"}`}
                  title="1:1"
                >
                  <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
                </button>
                <button
                  onClick={() => onSettingsChange("aspectRatio", "portrait")}
                  className={`w-8 h-6 flex items-center justify-center rounded transition-all ${settings.aspectRatio === "portrait" ? "bg-[#d4af37] text-black" : "text-gray-500 hover:text-white"}`}
                  title="9:16"
                >
                  <div className="w-3 h-5 border-2 border-current rounded-sm"></div>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-300">Thumbnail Scale</span>
              <div className="flex bg-[#121217] rounded-md border border-white/5 p-1">
                {["Fit", "Fill"].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => onSettingsChange("thumbnailScale", scale)}
                    className={`px-4 py-1 text-xs rounded transition-all ${settings.thumbnailScale === scale ? "bg-[#d4af37] text-black font-bold" : "text-gray-500 hover:text-white"}`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-300">Show Card Info</span>
              <button
                onClick={() =>
                  onSettingsChange("showCardInfo", !settings.showCardInfo)
                }
                className={`w-9 h-5 rounded-full relative transition-colors ${settings.showCardInfo ? "bg-[#d4af37]" : "bg-gray-600"}`}
              >
                <div
                  className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.showCardInfo ? "translate-x-4.5 left-0.5" : "translate-x-1"}`}
                ></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ------------------------------------

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [viewSettings, setViewSettings] = useState({
    cardSize: "M",
    aspectRatio: "video",
    thumbnailScale: "Fit",
    showCardInfo: true,
  });

  const [leftPaneWidth, setLeftPaneWidth] = useState(35);
  const isResizingLeft = useRef(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [currentFolder, setCurrentFolder] = useState<string>("");

  // FILTER & SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    isVideo: boolean;
  } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  // --- FETCH FILES LOGIC ---
  const fetchFiles = useCallback(
    async (userId: string, folderPath: string) => {
      const targetPath = folderPath ? `${userId}/${folderPath}` : userId;
      const { data } = await supabase.storage
        .from("client-vault")
        .list(targetPath, { sortBy: { column: "created_at", order: "desc" } });

      if (data) {
        const filteredFiles = data.filter(
          (item) =>
            item.name !== ".keep" && item.name !== ".emptyFolderPlaceholder",
        );
        setVaultItems(filteredFiles);

        const filesOnly = filteredFiles.filter((item) => item.id);
        if (filesOnly.length > 0) {
          const pathsToSign = filesOnly.map((file) =>
            folderPath
              ? `${userId}/${folderPath}/${file.name}`
              : `${userId}/${file.name}`,
          );
          const { data: signedUrls } = await supabase.storage
            .from("client-vault")
            .createSignedUrls(pathsToSign, 43200);

          if (signedUrls) {
            const urlMap: Record<string, string> = {};
            signedUrls.forEach((item, idx) => {
              if (item.signedUrl) {
                urlMap[filesOnly[idx].name] = item.signedUrl;
              }
            });
            setFileUrls(urlMap);
          }
        }
      }
    },
    [supabase],
  );

  // Session gate and observer
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        router.push("/access");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    if (user) {
      fetchFiles(user.id, currentFolder);
    }
  }, [user, currentFolder, fetchFiles]);

  // 🛠️ KEYBOARD SHORTCUTS FOR ADVANCED VIDEO REVIEWS (Frame.io Style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current || !previewFile?.isVideo) return;

      // Ignore shortcuts if the user is typing inside inputs or textareas
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === ",") {
        // Less than sign / comma key: Backward 1 frame (~0.04s at 24fps)
        e.preventDefault();
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 0.04);
      } else if (e.key === ".") {
        // Greater than sign / period key: Forward 1 frame (~0.04s at 24fps)
        e.preventDefault();
        videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 0.04);
      } else if (e.key === " ") {
        // Spacebar: Toggle Play/Pause
        e.preventDefault();
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewFile]);
  // ------------------------------------------------

  // --- RESIZER LOGIC ---
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

  // --- ACTIONS LOGIC ---
  const handleCreateFolder = async () => {
    if (!user) return;
    const folderName = prompt("Enter new folder name:");
    if (!folderName || folderName.trim() === "") return;
    const targetPath = currentFolder
      ? `${user.id}/${currentFolder}/${folderName.trim()}/.keep`
      : `${user.id}/${folderName.trim()}/.keep`;
    await supabase.storage
      .from("client-vault")
      .upload(targetPath, new Blob([""]));
    fetchFiles(user.id, currentFolder);
  };

  const navigateToFolder = (folderName: string) =>
    setCurrentFolder((prev) => (prev ? `${prev}/${folderName}` : folderName));

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    setUploadProgress(10);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const targetPath = currentFolder
        ? `${user.id}/${currentFolder}`
        : user.id;
      const filePath = `${targetPath}/${Date.now()}_${file.name}`;
      await supabase.storage.from("client-vault").upload(filePath, file);
    }
    setUploadProgress(100);
    fetchFiles(user.id, currentFolder);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 2000);
  };

  const getFilePath = (fileName: string) =>
    currentFolder
      ? `${user.id}/${currentFolder}/${fileName}`
      : `${user.id}/${fileName}`;

  const getSignedUrl = async (fileName: string) => {
    const { data } = await supabase.storage
      .from("client-vault")
      .createSignedUrl(getFilePath(fileName), 43200);
    return data?.signedUrl;
  };

  const handlePreview = async (fileName: string) => {
    const url = await getSignedUrl(fileName);
    if (url) {
      const isVideo = fileName.match(/\.(mp4|webm|ogg|mov|mxf)$/i) !== null;
      setPreviewFile({ name: fileName, url, isVideo });
      if (isVideo) {
        const { data } = await supabase
          .from("video_comments")
          .select("*")
          .eq("file_name", fileName)
          .order("time_stamp", { ascending: true });
        if (data) setComments(data);
      }
    }
  };

  // ASSET MANAGEMENT CRUD FUNCTIONS (Delete & Rename)
  const handleDeleteFile = async (fileName: string) => {
    if (!window.confirm("Are you sure you want to delete this file permanently?")) return;
    const filePath = getFilePath(fileName);
    const { error } = await supabase.storage.from("client-vault").remove([filePath]);
    if (!error) {
      if (previewFile?.name === fileName) setPreviewFile(null);
      fetchFiles(user.id, currentFolder);
    } else {
      alert("Error deleting file: " + error.message);
    }
  };

  const handleRenameFile = async (oldName: string) => {
    const underscoreIdx = oldName.indexOf("_");
    const prefix = underscoreIdx !== -1 ? oldName.substring(0, underscoreIdx + 1) : "";
    const actualNameWithExt = underscoreIdx !== -1 ? oldName.substring(underscoreIdx + 1) : oldName;
    const dotIdx = actualNameWithExt.lastIndexOf('.');
    const actualNameOnly = dotIdx !== -1 ? actualNameWithExt.substring(0, dotIdx) : actualNameWithExt;
    const ext = dotIdx !== -1 ? actualNameWithExt.substring(dotIdx) : "";

    const newCleanName = prompt("Enter new name for this file:", actualNameOnly);
    if (!newCleanName || newCleanName.trim() === "") return;

    const newName = `${prefix}${newCleanName.trim()}${ext}`;
    const oldPath = getFilePath(oldName);
    const newPath = currentFolder ? `${user.id}/${currentFolder}/${newName}` : `${user.id}/${newName}`;

    const { error } = await supabase.storage.from("client-vault").move(oldPath, newPath);
    if (!error) {
      if (previewFile?.name === oldName) setPreviewFile(null);
      fetchFiles(user.id, currentFolder);
    } else {
      alert("Error renaming file: " + error.message);
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    if (!window.confirm(`Are you sure you want to delete the folder "${folderName}"? (Make sure it is empty)`)) return;
    const folderPath = currentFolder ? `${user.id}/${currentFolder}/${folderName}` : `${user.id}/${folderName}`;
    const { error } = await supabase.storage.from("client-vault").remove([`${folderPath}/.keep`]);
    if (!error) {
      fetchFiles(user.id, currentFolder);
    } else {
      alert("Could not delete folder. Ensure no other files remain inside.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !previewFile || !videoRef.current || !user)
      return;
    const currentTime = videoRef.current.currentTime;
    videoRef.current.pause();
    const { data, error } = await supabase
      .from("video_comments")
      .insert([
        {
          file_name: previewFile.name,
          user_id: user.id,
          time_stamp: currentTime,
          comment_text: newComment.trim(),
        },
      ])
      .select();
    if (!error && data) {
      setComments((prev) =>
        [...prev, data[0]].sort((a, b) => a.time_stamp - b.time_stamp),
      );
      setNewComment("");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  // --- Visuals & Variables ---
  const folders = vaultItems.filter((item) => !item.metadata);
  const files = vaultItems.filter((item) => item.metadata);
  const pathParts = currentFolder ? currentFolder.split("/") : [];

  // FILTER AND SEARCH MATHEMATICS
  const filteredFiles = files.filter((item) => {
    const originalName = item.name.substring(item.name.indexOf("_") + 1).toLowerCase();
    const matchesSearch = originalName.includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "video") {
      return matchesSearch && item.name.match(/\.(mp4|webm|ogg|mov|mxf)$/i) !== null;
    }
    if (activeTab === "image") {
      return matchesSearch && item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
    }
    return matchesSearch;
  });

  const aspectClass =
    viewSettings.aspectRatio === "video"
      ? "aspect-video"
      : viewSettings.aspectRatio === "square"
        ? "aspect-square"
        : "aspect-[9/16]";
  const objectFitClass =
    viewSettings.thumbnailScale === "Fill" ? "object-cover" : "object-contain";
  const gridColumnSize =
    viewSettings.cardSize === "S"
      ? 120
      : viewSettings.cardSize === "L"
        ? 320
        : 200;

  return (
    <main className="h-screen w-screen bg-[#050505] text-gray-300 font-sans flex flex-col overflow-hidden">
      {/* 🌟 TOP NAVIGATION BAR 🌟 */}
      <header className="h-14 bg-[#121217] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-30 relative">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-black font-bold text-xs shadow-lg">
            K
          </div>
          <h1 className="text-sm font-semibold text-white tracking-wide">
            Kachna Studio
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="hidden md:flex items-center bg-[#0a0a0f] border border-white/5 rounded-full px-3 py-1.5 gap-3 mr-4 shadow-inner"
            title="Active Users"
          >
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-[#121217] flex items-center justify-center text-[9px] font-bold text-white z-20">
                C
              </div>
              <div className="w-6 h-6 rounded-full bg-[#d4af37] border-2 border-[#121217] flex items-center justify-center text-[9px] font-bold text-black z-10">
                E
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white font-semibold leading-none">
                2 Active
              </span>
              <span className="text-[8px] text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                Previewing
              </span>
            </div>
          </div>

          <AppearanceMenu
            settings={viewSettings}
            onSettingsChange={(k, v) =>
              setViewSettings((prev) => ({ ...prev, [k]: v }))
            }
          />

          <button
            onClick={() => inputRef.current?.click()}
            className="text-[11px] uppercase tracking-widest bg-[#d4af37] hover:bg-[#b8952b] text-black px-5 py-2.5 font-bold rounded-md transition-colors shadow-md"
          >
            Upload File
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />

          <div className="w-px h-6 bg-white/10 mx-2"></div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/access");
            }}
            className="text-xs text-[#d4af37] hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* 🌟 MAIN WORKSPACE 🌟 */}
      <div id="main-workspace-container" className="flex flex-1 overflow-hidden relative">
        {/* 🌟 DIRECTORY SIDEBAR 🌟 */}
        <aside className="w-60 bg-[#0a0a0f] border-r border-white/5 flex flex-col shrink-0 z-20">
          <div className="h-14 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Directories
            </h3>
            <button
              onClick={handleCreateFolder}
              className="text-[#d4af37] hover:text-white transition-colors"
              title="New Folder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <button
              onClick={() => setCurrentFolder("")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${currentFolder === "" ? "bg-[#d4af37]/10 text-[#d4af37]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
            >
              <span className="text-lg">🏠</span> Root Vault
            </button>

            {pathParts.map((part, idx) => {
              const path = pathParts.slice(0, idx + 1).join("/");
              return (
                <div key={path} className="pl-4 mt-1">
                  <button
                    onClick={() => setCurrentFolder(path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${currentFolder === path ? "bg-[#d4af37]/10 text-[#d4af37]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                  >
                    <span className="text-lg">📂</span> {part}
                  </button>
                </div>
              );
            })}

            {folders.length > 0 && (
              <div className={`pt-3 ${currentFolder ? "pl-8" : "pl-4"}`}>
                <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2 px-3">
                  Subfolders
                </p>
                {folders.map((f) => (
                  <div key={f.name} className="group/folder flex items-center justify-between rounded-md text-xs font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors pr-2">
                    <button
                      onClick={() => navigateToFolder(f.name)}
                      className="flex-1 flex items-center gap-3 px-3 py-2 text-left truncate"
                    >
                      <span className="text-lg">📁</span> <span className="truncate">{f.name}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.name); }}
                      className="opacity-0 group-hover/folder:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                      title="Delete Folder"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 🌟 WRAPPER FOR GRID AND PREVIEW 🌟 */}
        <div id="grid-preview-container" className="flex flex-1 overflow-hidden relative">
          {/* PANE 2: ASSET GRID (FILES) */}
          <section
            className="flex flex-col bg-[#050505] shrink-0 h-full relative transition-none"
            style={{ width: previewFile ? `${leftPaneWidth}%` : "100%" }}
          >
            {/* ADVANCED FILTERING HEADER BAR */}
            <div className="h-14 flex flex-col md:flex-row items-start md:items-center justify-between px-6 border-b border-white/5 bg-[#121217] shrink-0 gap-4 md:gap-0 py-2 md:py-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-gray-200">
                  {currentFolder ? currentFolder.split("/").pop() : "All Assets"}
                </h2>
                <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                  {filteredFiles.length} of {files.length} items
                </span>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Search Bar Input */}
                <div className="relative flex-1 md:flex-initial">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-44 bg-[#050505] border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>

                {/* Filter Grid Tabs */}
                <div className="flex bg-[#050505] border border-white/10 rounded-md p-0.5 shrink-0">
                  {[
                    { id: "all", label: "All" },
                    { id: "video", label: "Videos" },
                    { id: "image", label: "Images" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1 text-[11px] font-medium rounded transition-all ${activeTab === tab.id ? "bg-[#d4af37] text-black font-bold shadow-sm" : "text-gray-400 hover:text-white"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {uploading && (
              <div className="w-full bg-[#1c1c24] h-1 shrink-0">
                <div className="bg-[#d4af37] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {filteredFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <p className="text-sm">No files found matching criteria</p>
                </div>
              ) : (
                <div
                  className="grid gap-6 transition-all duration-300 ease-in-out"
                  style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${gridColumnSize}px, 1fr))` }}
                >
                  {filteredFiles.map((item) => {
                    const originalName = item.name.substring(item.name.indexOf("_") + 1);
                    const isVideoFile = item.name.match(/\.(mp4|webm|ogg|mov|mxf)$/i);
                    const isImage = item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const isSelected = previewFile?.name === item.name;
                    const fileUrl = fileUrls[item.name];

                    return (
                      <div
                        key={item.id}
                        className={`bg-[#121217] rounded-lg border overflow-hidden group relative flex flex-col transition-all shadow-sm hover:shadow-md ${isSelected ? "border-[#d4af37] ring-1 ring-[#d4af37]" : "border-white/5 hover:border-white/20"}`}
                      >
                        <div className={`w-full bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden transition-all duration-300 ${aspectClass}`}>
                          {fileUrl ? (
                            isVideoFile ? (
                              <video src={`${fileUrl}#t=0.5`} className={`w-full h-full ${objectFitClass}`} preload="metadata" />
                            ) : isImage ? (
                              <img src={fileUrl} className={`w-full h-full ${objectFitClass}`} alt={originalName} />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                              </svg>
                            )
                          ) : (
                            <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
                          )}

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                            <button
                              onClick={() => handlePreview(item.name)}
                              className="w-10 h-10 bg-[#d4af37] rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {viewSettings.showCardInfo && (
                          <div className="p-3 bg-[#121217] flex flex-col justify-center shrink-0 border-t border-white/5 relative group/card">
                            <p className="text-xs text-gray-200 truncate font-medium pr-12">
                              {originalName}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                            
                            {/* CRUD ACTIONS OVERLAY BUTTONS */}
                            <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity bg-[#121217] pl-2">
                              <button
                                onClick={() => handleRenameFile(item.name)}
                                className="p-1 text-gray-400 hover:text-[#d4af37] transition-colors"
                                title="Rename File"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                              <button
                                onClick={() => handleDeleteFile(item.name)}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete File"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 🌟 DRAGGABLE RESIZER BORDER 🌟 */}
          {previewFile && (
            <div
              onMouseDown={startResizingLeft}
              className="w-[3px] bg-white/5 hover:bg-[#d4af37] cursor-col-resize z-50 transition-colors shrink-0"
              title="Drag to resize panels"
            />
          )}

          {/* 🌟 PANE 3: VIDEO PLAYER AND COMMENTS 🌟 */}
          {previewFile && (
            <div className="flex flex-1 h-full bg-[#0a0a0f] overflow-hidden relative min-w-[30%]">
              <section className="flex-1 relative flex flex-col h-full overflow-hidden">
                <div className="absolute top-4 left-4 z-20">
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 hover:bg-[#d4af37] text-white hover:text-black backdrop-blur-md transition-colors border border-white/10 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="flex-1 w-full h-full flex items-center justify-center p-4 lg:p-10 overflow-hidden">
                  {previewFile.isVideo ? (
                    <div className="flex flex-col items-center gap-4 max-w-full max-h-full">
                      {/* 🛠️ UPGRADED: WRAPPER FOR VIDEO AND ADVANCED PLAYER CONTROLS */}
                      <video
                        ref={videoRef}
                        src={previewFile.url}
                        controls
                        className={`max-w-full bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded border border-white/5 transition-all duration-500 ease-in-out ${aspectClass} ${objectFitClass}`}
                      />
                      
                      {/* ADVANCED MEDIA CONTROL BAR */}
                      <div className="flex items-center gap-4 bg-[#121217] border border-white/10 px-4 py-2 rounded-full shadow-xl text-xs select-none">
                        {/* Playback Speed Controller */}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Speed:</span>
                          <select
                            onChange={(e) => {
                              if (videoRef.current) videoRef.current.playbackRate = parseFloat(e.target.value);
                            }}
                            defaultValue="1"
                            className="bg-[#050505] border border-white/10 rounded px-2 py-0.5 text-white text-[11px] outline-none focus:border-[#d4af37] cursor-pointer"
                          >
                            <option value="0.25">0.25x</option>
                            <option value="0.5">0.5x</option>
                            <option value="1">1.0x (Normal)</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2.0x</option>
                          </select>
                        </div>

                        <div className="w-px h-4 bg-white/10"></div>

                        {/* Frame-by-Frame Seek Controls */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mr-1">Frame:</span>
                          <button
                            onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 0.04); }}
                            className="px-2 py-1 bg-[#050505] hover:bg-[#d4af37]/20 border border-white/5 hover:border-[#d4af37]/30 text-gray-300 hover:text-[#d4af37] rounded transition-colors text-[10px] font-medium"
                            title="Backward 1 Frame (Shortcut: ,)"
                          >
                            ◀ Prev
                          </button>
                          <button
                            onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 0.04); }}
                            className="px-2 py-1 bg-[#050505] hover:bg-[#d4af37]/20 border border-white/5 hover:border-[#d4af37]/30 text-gray-300 hover:text-[#d4af37] rounded transition-colors text-[10px] font-medium"
                            title="Forward 1 Frame (Shortcut: .)"
                          >
                            Next ▶
                          </button>
                        </div>

                        <div className="w-px h-4 bg-white/10"></div>

                        {/* Quick Seek Jumps */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5); }}
                            className="px-2 py-1 bg-[#050505] hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded text-[10px] font-mono"
                            title="Rewind 5 Seconds"
                          >
                            -5s
                          </button>
                          <button
                            onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5); }}
                            className="px-2 py-1 bg-[#050505] hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded text-[10px] font-mono"
                            title="Forward 5 Seconds"
                          >
                            +5s
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={previewFile.url}
                      alt="Preview"
                      className={`max-w-full max-h-full bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded border border-white/5 transition-all duration-500 ease-in-out ${aspectClass} ${objectFitClass}`}
                    />
                  )}
                </div>
              </section>

              {previewFile.isVideo && (
                <aside className="w-[320px] bg-[#121217] flex flex-col h-full border-l border-white/5 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10">
                  <div className="h-14 flex items-center px-4 border-b border-white/5 shrink-0 bg-[#121217]">
                    <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-widest">
                      Comments
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {comments.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                        No feedback yet.
                      </div>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="bg-[#1c1c24] rounded-lg p-3 shadow-sm border border-white/5">
                          <button
                            onClick={() => jumpToTime(c.time_stamp)}
                            className="bg-[#d4af37]/20 text-[#d4af37] px-2 py-1 rounded text-[10px] font-mono hover:bg-[#d4af37]/30 transition-colors font-medium"
                          >
                            {formatTime(c.time_stamp)}
                          </button>
                          <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                            {c.comment_text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="p-4 bg-[#121217] border-t border-white/5 shrink-0">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Leave a comment..."
                      rows={2}
                      className="w-full bg-[#050505] border border-white/10 rounded-md p-3 text-xs text-white outline-none focus:border-[#d4af37] resize-none mb-3 placeholder-gray-600"
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#d4af37] hover:bg-[#b8952b] text-black py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors shadow-md"
                    >
                      Post Comment
                    </button>
                  </form>
                </aside>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}