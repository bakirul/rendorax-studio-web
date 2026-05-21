"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("");

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [projectStatus, setProjectStatus] = useState("Awaiting Assets");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    isVideo: boolean;
  } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [hasBrief, setHasBrief] = useState(false);
  const [briefData, setBriefData] = useState({
    project_title: "",
    video_length: "",
    editing_style: "",
    reference_links: "",
    deadline: "",
    instructions: "",
  });

  // --- NEW: Client Invoice State ---
  const [invoices, setInvoices] = useState<any[]>([]);
  // ---------------------------------

  const statusSteps = [
    { name: "Awaiting Assets", desc: "Waiting for client upload" },
    { name: "Ingesting", desc: "HQ downloading & sorting" },
    { name: "Offline Edit", desc: "Structuring narrative & cut" },
    { name: "Color Grading", desc: "Visual enhancement" },
    { name: "Audio & Master", desc: "Sound design & mixing" },
    { name: "Ready for Review", desc: "Awaiting client approval" },
  ];

  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(
    async (userId: string, folderPath: string) => {
      const targetPath = folderPath ? `${userId}/${folderPath}` : userId;
      const { data } = await supabase.storage
        .from("client-vault")
        .list(targetPath, {
          sortBy: { column: "created_at", order: "desc" },
        });
      if (data) {
        setVaultItems(
          data.filter(
            (item) =>
              item.name !== ".keep" && item.name !== ".emptyFolderPlaceholder",
          ),
        );
      }
    },
    [supabase],
  );

  const fetchProjectStatus = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("project_status")
        .select("status, updated_at")
        .eq("user_id", userId)
        .single();
      if (data) {
        setProjectStatus(data.status);
        setLastUpdated(new Date(data.updated_at).toLocaleString());
      }
    },
    [supabase],
  );

  const fetchBrief = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("project_status_details")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        setHasBrief(true);
        setBriefData(data);
      }
    },
    [supabase],
  );

  // --- NEW: Fetch Invoices Logic ---
  const fetchInvoices = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("client_invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (data) setInvoices(data);
    },
    [supabase],
  );
  // ---------------------------------

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/access");
        return;
      }
      setUser(session.user);
      await fetchFiles(session.user.id, currentFolder);
      await fetchProjectStatus(session.user.id);
      await fetchBrief(session.user.id);
      await fetchInvoices(session.user.id); // Fetch Invoices on load
      setLoading(false);
    };

    checkUserAndFetchData();
    const interval = setInterval(async () => {
      if (user?.id) {
        await fetchProjectStatus(user.id);
        await fetchInvoices(user.id); // Real-time Invoice Status Update
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [
    router,
    supabase,
    user?.id,
    currentFolder,
    fetchFiles,
    fetchProjectStatus,
    fetchBrief,
    fetchInvoices,
  ]);

  const handleBriefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading("brief_submit");
    const { error } = await supabase
      .from("project_status_details")
      .upsert(
        {
          user_id: user.id,
          ...briefData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (!error) {
      setHasBrief(true);
      setMessage({
        type: "success",
        text: "Project Brief successfully transmitted to HQ.",
      });
      setBriefModalOpen(false);
      setTimeout(() => setMessage(null), 4000);
      if (projectStatus === "Awaiting Assets") {
        await supabase
          .from("project_status")
          .upsert(
            {
              user_id: user.id,
              status: "Ingesting",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        setProjectStatus("Ingesting");
      }
    }
    setActionLoading(null);
  };

  const handleCreateFolder = async () => {
    if (!user) return;
    const folderName = prompt("Enter new folder name:");
    if (!folderName || folderName.trim() === "") return;
    setActionLoading("creating_folder");
    const targetPath = currentFolder
      ? `${user.id}/${currentFolder}/${folderName.trim()}/.keep`
      : `${user.id}/${folderName.trim()}/.keep`;
    const { error } = await supabase.storage
      .from("client-vault")
      .upload(targetPath, new Blob([""]));
    if (!error) {
      fetchFiles(user.id, currentFolder);
    }
    setActionLoading(null);
  };
  const navigateToFolder = (folderName: string) =>
    setCurrentFolder((prev) => (prev ? `${prev}/${folderName}` : folderName));
  const navigateUp = () => {
    if (!currentFolder) return;
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/"));
  };

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
      const { error } = await supabase.storage
        .from("client-vault")
        .upload(filePath, file);
      if (error) break;
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
  const handleDeleteFile = async (fileName: string) => {
    if (!confirm("Delete asset?")) return;
    const { error } = await supabase.storage
      .from("client-vault")
      .remove([getFilePath(fileName)]);
    if (!error) fetchFiles(user.id, currentFolder);
  };
  const getSignedUrl = async (fileName: string) => {
    const { data } = await supabase.storage
      .from("client-vault")
      .createSignedUrl(getFilePath(fileName), 604800);
    return data?.signedUrl;
  };
  const handleDownload = async (fileName: string) => {
    const url = await getSignedUrl(fileName);
    if (url) window.open(url, "_blank");
  };
  const handleShare = async (fileName: string) => {
    const url = await getSignedUrl(fileName);
    if (url) {
      await navigator.clipboard.writeText(url);
      setMessage({ type: "success", text: "Link copied!" });
      setTimeout(() => setMessage(null), 3000);
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
  const handlePreview = async (fileName: string) => {
    const url = await getSignedUrl(fileName);
    if (url) {
      const isVideo = fileName.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
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
  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      handleUpload(e.dataTransfer.files);
  };

  // --- NEW: Print Invoice Function ---
  const handlePrintInvoice = (inv: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${inv.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; background: #fff; }
            .header { border-b: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; color: #111; }
            .meta { margin-top: 20px; line-height: 1.6; }
            .table { w: 100%; border-collapse: collapse; margin-top: 30px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #f5f5f5; }
            .total { font-size: 18px; font-weight: bold; margin-top: 30px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">KACHNA MEDIA LTD.</div>
            <p>Official Studio Invoice</p>
          </div>
          <div class="meta">
            <p><strong>Invoice Number:</strong> ${inv.invoice_number}</p>
            <p><strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(inv.due_date).toLocaleDateString()}</p>
            <p><strong>Client Account:</strong> ${user.email}</p>
          </div>
          <table class="table">
            <thead>
              <tr><th>Description / Particulars</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>${inv.description}</td><td>BDT ${inv.amount}</td></tr>
            </tbody>
          </table>
          <div class="total">Total Due: BDT ${inv.amount}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  // ------------------------------------

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gold-primary uppercase tracking-widest text-sm">
        Accessing Vault...
      </div>
    );

  const currentStepIndex = statusSteps.findIndex(
    (s) => s.name === projectStatus,
  );
  const progressPercentage =
    currentStepIndex === -1
      ? 0
      : (currentStepIndex / (statusSteps.length - 1)) * 100;

  return (
    <main className="min-h-screen p-6 md:p-10 relative flex justify-center items-start">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-primary blur-[200px] opacity-5 -z-10 pointer-events-none"></div>

      <div className="w-full max-w-6xl mt-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gold-line pb-6 mb-8 gap-4">
          <div>
            <span className="text-[10px] text-gold-primary uppercase tracking-[0.2em] mb-2 block">
              Secure Workspace
            </span>
            <h1 className="text-4xl font-display text-text-white">
              Client Vault
            </h1>
            <p className="text-text-gray text-sm mt-2">
              Active Session: <span className="text-white">{user?.email}</span>
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/access");
            }}
            className="border border-gold-primary/30 text-gold-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gold-primary hover:text-black transition-all"
          >
            End Session
          </button>
        </div>

        {/* Status Tracker */}
        <div className="bg-bg-panel border border-white/5 p-6 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-sm uppercase tracking-widest text-text-gray">
                Production Phase
              </h2>
              <p className="text-3xl font-display text-gold-primary mt-1">
                {projectStatus}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setBriefModalOpen(true)}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-all ${hasBrief ? "border border-green-500/30 text-green-400 hover:bg-green-500/10" : "bg-gold-primary text-black hover:bg-white"}`}
              >
                {hasBrief ? "View / Edit Brief" : "📝 Submit Project Brief"}
              </button>
            </div>
          </div>

          <div className="relative pt-2 pb-4">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2"></div>
            <div
              className="absolute top-1/2 left-0 h-1 bg-gold-primary -translate-y-1/2 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isActive = index === currentStepIndex;
                return (
                  <div
                    key={step.name}
                    className="flex flex-col items-center group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 bg-bg-panel z-10 transition-all duration-500 ${isActive ? "border-gold-primary shadow-[0_0_15px_rgba(212,175,55,0.8)] scale-125" : isCompleted ? "border-gold-primary" : "border-white/20"}`}
                    >
                      {isCompleted && !isActive && (
                        <div className="w-full h-full bg-gold-primary rounded-full scale-50"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- NEW: Client Billing Dashboard Section --- */}
        {invoices.length > 0 && (
          <div className="bg-bg-panel border border-white/5 p-6 mb-8">
            <h2 className="text-sm uppercase tracking-widest text-gold-primary mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
              <span>💳</span> Financial Statements / Invoices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className={`p-4 border flex justify-between items-center bg-bg-body ${inv.status === "Paid" ? "border-green-500/10" : "border-white/5"}`}
                >
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-white/5 px-2 py-0.5 text-text-gray">
                      {inv.invoice_number}
                    </span>
                    <h4 className="text-white text-sm mt-2 font-medium">
                      {inv.description}
                    </h4>
                    <p className="text-text-gray text-[11px] mt-1">
                      Due Date: {new Date(inv.due_date).toLocaleDateString()}
                    </p>
                    <p className="text-gold-primary text-base font-bold mt-2 font-mono">
                      ৳ {inv.amount}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`px-2 py-1 text-[9px] uppercase tracking-widest font-bold ${inv.status === "Paid" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                    >
                      {inv.status}
                    </span>
                    <button
                      onClick={() => handlePrintInvoice(inv)}
                      className="text-[10px] text-text-gray hover:text-white uppercase tracking-wider underline transition-colors"
                    >
                      📄 Print PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* --------------------------------------------- */}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Transfer Area */}
          <div className="lg:col-span-2 flex flex-col">
            <h2 className="text-xl font-display text-text-white mb-4">
              Transfer Assets
            </h2>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed transition-all duration-300 p-10 flex flex-col items-center justify-center text-center bg-bg-panel flex-grow min-h-[300px] ${dragActive ? "border-gold-primary bg-gold-primary/5" : "border-white/10 hover:border-gold-primary/50"}`}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
                disabled={uploading}
              />
              {uploading ? (
                <div className="flex flex-col items-center w-full max-w-[200px]">
                  <div className="text-gold-primary text-3xl font-display mb-2">
                    {uploadProgress}%
                  </div>
                  <p className="text-text-gray uppercase tracking-widest text-[10px]">
                    Encrypting...
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 mb-4 rounded-full bg-gold-primary/10 flex items-center justify-center">
                    <span className="text-gold-primary text-2xl">↓</span>
                  </div>
                  <p className="text-text-white text-lg mb-2">
                    Drag & Drop files
                  </p>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="bg-transparent text-gold-primary px-6 py-3 text-[0.75rem] font-bold uppercase tracking-[0.15em] border border-gold-primary hover:bg-gold-primary hover:text-black transition-all"
                  >
                    Browse Device
                  </button>
                </>
              )}
            </div>
            {message && (
              <div
                className={`mt-4 p-3 text-xs tracking-wider text-center border ${message.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* Vault History */}
          <div className="lg:col-span-3 bg-bg-panel border border-white/5 p-6 flex flex-col h-[500px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/5 pb-4 gap-4">
              <div className="flex items-center gap-3">
                {currentFolder && (
                  <button
                    onClick={navigateUp}
                    className="text-text-gray hover:text-gold-primary transition-colors text-xs uppercase border border-white/10 px-2 py-1"
                  >
                    ← Back
                  </button>
                )}
                <h2 className="text-lg font-display text-text-white">
                  {currentFolder
                    ? `/${currentFolder.split("/").pop()}`
                    : "Root Directory"}
                </h2>
              </div>
              <button
                onClick={handleCreateFolder}
                className="text-gold-primary text-[10px] uppercase tracking-widest border border-gold-primary/30 px-3 py-1.5 hover:bg-gold-primary hover:text-black transition-colors"
              >
                + New Folder
              </button>
            </div>

            {vaultItems.length === 0 ? (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-text-gray text-sm italic">
                  This directory is empty.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                {vaultItems.map((item) => {
                  const isFolder = !item.metadata;
                  const originalName = isFolder
                    ? item.name
                    : item.name.substring(item.name.indexOf("_") + 1);
                  const isVideoFile =
                    !isFolder && item.name.match(/\.(mp4|webm|ogg|mov)$/i);
                  if (isFolder) {
                    return (
                      <li
                        key={item.name}
                        className="flex justify-between items-center p-3 border border-white/5 hover:border-gold-primary/50 bg-bg-body cursor-pointer"
                        onClick={() => navigateToFolder(item.name)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gold-primary text-xl">📁</span>
                          <span className="text-text-white text-sm font-mono">
                            {originalName}
                          </span>
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li
                      key={item.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-white/5 bg-bg-body gap-4"
                    >
                      <div className="overflow-hidden flex items-center gap-3">
                        <span>{isVideoFile ? "🎬" : "📄"}</span>
                        <div>
                          <p className="text-text-white text-sm truncate max-w-[200px]">
                            {originalName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(item.name)}
                          className="p-2 text-text-gray hover:text-gold-primary"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownload(item.name)}
                          className="p-2 text-text-gray hover:text-gold-primary"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShare(item.name)}
                          className="p-2 text-text-gray hover:text-blue-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteFile(item.name)}
                          className="p-2 text-text-gray hover:text-red-500"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Project Brief Modal */}
      {briefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-bg-panel border border-gold-primary/30 shadow-2xl relative">
            <div className="bg-bg-body p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-display text-gold-primary">
                Project Brief
              </h3>
              <button
                onClick={() => setBriefModalOpen(false)}
                className="text-text-gray hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={handleBriefSubmit}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar"
            >
              <div>
                <label className="block text-xs uppercase text-text-gray mb-2">
                  Project Title
                </label>
                <input
                  required
                  type="text"
                  value={briefData.project_title}
                  onChange={(e) =>
                    setBriefData({
                      ...briefData,
                      project_title: e.target.value,
                    })
                  }
                  className="w-full bg-bg-body border border-white/10 p-3 text-white focus:border-gold-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-text-gray mb-2">
                    Length
                  </label>
                  <select
                    required
                    value={briefData.video_length}
                    onChange={(e) =>
                      setBriefData({
                        ...briefData,
                        video_length: e.target.value,
                      })
                    }
                    className="w-full bg-bg-body border border-white/10 p-3 text-white outline-none"
                  >
                    <option value="Under 1 minute">Under 1 minute</option>
                    <option value="1 - 3 minutes">1 - 3 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase text-text-gray mb-2">
                    Style
                  </label>
                  <select
                    required
                    value={briefData.editing_style}
                    onChange={(e) =>
                      setBriefData({
                        ...briefData,
                        editing_style: e.target.value,
                      })
                    }
                    className="w-full bg-bg-body border border-white/10 p-3 text-white outline-none"
                  >
                    <option value="Cinematic / Documentary">
                      Cinematic / Documentary
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase text-text-gray mb-2">
                  Deadline
                </label>
                <input
                  required
                  type="date"
                  value={briefData.deadline}
                  onChange={(e) =>
                    setBriefData({ ...briefData, deadline: e.target.value })
                  }
                  className="w-full bg-bg-body border border-white/10 p-3 text-white outline-none color-scheme-dark"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-text-gray mb-2">
                  Instructions
                </label>
                <textarea
                  required
                  rows={4}
                  value={briefData.instructions}
                  onChange={(e) =>
                    setBriefData({ ...briefData, instructions: e.target.value })
                  }
                  className="w-full bg-bg-body border border-white/10 p-3 text-white outline-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-gold-primary text-black font-bold uppercase py-4 hover:bg-white transition-colors"
              >
                Submit Project Brief
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <button
            onClick={() => setPreviewFile(null)}
            className="absolute top-6 right-6 text-text-gray hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="w-full max-w-7xl h-[85vh] flex flex-col lg:flex-row border border-white/10 bg-bg-panel overflow-hidden">
            <div className="flex-grow bg-black flex flex-col justify-center relative">
              {previewFile.isVideo ? (
                <video
                  ref={videoRef}
                  src={previewFile.url}
                  controls
                  className="w-full max-h-full outline-none"
                />
              ) : (
                <img
                  src={previewFile.url}
                  alt="Preview"
                  className="max-h-[60vh] object-contain m-auto"
                />
              )}
            </div>
            {previewFile.isVideo && (
              <div className="w-full lg:w-[400px] flex flex-col bg-bg-body h-full">
                <div className="p-6 border-b border-white/5">
                  <h3 className="text-gold-primary uppercase tracking-widest text-sm">
                    Feedback & Revision
                  </h3>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="border border-white/5 p-3 bg-bg-panel"
                    >
                      <button
                        onClick={() => jumpToTime(c.time_stamp)}
                        className="bg-gold-primary/10 text-gold-primary px-2 py-0.5 text-[10px] font-mono"
                      >
                        {formatTime(c.time_stamp)}
                      </button>
                      <p className="text-sm text-text-white mt-1">
                        {c.comment_text}
                      </p>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={handleAddComment}
                  className="p-4 border-t border-white/5 bg-bg-panel"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add comment..."
                      className="flex-grow bg-bg-body border border-white/10 px-3 py-2 text-white outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-gold-primary text-black px-4 text-xs font-bold uppercase"
                    >
                      Post
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
