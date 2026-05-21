"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminPortal() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [currentStatus, setCurrentStatus] = useState("Awaiting Assets");
  const statusOptions = [
    "Awaiting Assets",
    "Ingesting",
    "Offline Edit",
    "Color Grading",
    "Audio & Master",
    "Ready for Review",
  ];

  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    isVideo: boolean;
  } | null>(null);
  const [clientComments, setClientComments] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clientBrief, setClientBrief] = useState<any>(null);

  // --- NEW: Invoice & Billing States ---
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    description: "",
    amount: "",
    due_date: "",
  });
  // -----------------------------------

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdminSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/access");
        return;
      }
      await fetchClientFolders();
      setLoading(false);
    };
    checkAdminSession();
  }, [router, supabase]);

  const fetchClientFolders = async () => {
    const { data } = await supabase.storage.from("client-vault").list();
    if (data) setClients(data.filter((item) => !item.metadata));
  };

  const fetchClientData = async (clientId: string) => {
    setFilesLoading(true);
    setSelectedClient(clientId);
    setClientBrief(null);
    setShowInvoiceForm(false);

    // Load Files
    const { data: files } = await supabase.storage
      .from("client-vault")
      .list(clientId + "/", {
        sortBy: { column: "created_at", order: "desc" },
      });
    if (files)
      setClientFiles(
        files.filter((file) => file.name !== ".emptyFolderPlaceholder"),
      );

    // Load Status
    const { data: statusData } = await supabase
      .from("project_status")
      .select("status")
      .eq("user_id", clientId)
      .single();
    setCurrentStatus(statusData?.status || "Awaiting Assets");

    // Load Brief
    const { data: briefData } = await supabase
      .from("project_status_details")
      .select("*")
      .eq("user_id", clientId)
      .single();
    setClientBrief(briefData || null);

    // Load Invoices (NEW)
    const { data: invoiceData } = await supabase
      .from("client_invoices")
      .select("*")
      .eq("user_id", clientId)
      .order("created_at", { ascending: false });
    setClientInvoices(invoiceData || []);

    setFilesLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedClient) return;
    setActionLoading("status_update");
    const { error } = await supabase
      .from("project_status")
      .upsert(
        {
          user_id: selectedClient,
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (!error) {
      setCurrentStatus(newStatus);
      setMessage({
        type: "success",
        text: `HQ Override: Status changed to "${newStatus}"`,
      });
      setTimeout(() => setMessage(null), 3000);
    }
    setActionLoading(null);
  };

  const getSignedUrl = async (fileName: string) => {
    if (!selectedClient) return null;
    const { data } = await supabase.storage
      .from("client-vault")
      .createSignedUrl(`${selectedClient}/${fileName}`, 604800);
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
      setMessage({ type: "success", text: "Asset link copied!" });
      setTimeout(() => setMessage(null), 3000);
    }
  };
  const handleDelete = async (fileName: string) => {
    if (!selectedClient || !confirm("PURGE ASSET: Are you sure?")) return;
    const { error } = await supabase.storage
      .from("client-vault")
      .remove([`${selectedClient}/${fileName}`]);
    if (!error) fetchClientData(selectedClient);
  };

  const handlePreview = async (fileName: string) => {
    setActionLoading(`preview_${fileName}`);
    const url = await getSignedUrl(fileName);
    if (url) {
      const isVideo = fileName.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
      setPreviewFile({ name: fileName, url, isVideo });
      if (isVideo && selectedClient) {
        const { data } = await supabase
          .from("video_comments")
          .select("*")
          .eq("file_name", fileName)
          .eq("user_id", selectedClient)
          .order("time_stamp", { ascending: true });
        if (data) setClientComments(data);
      }
    }
    setActionLoading(null);
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
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

  // --- NEW: Invoice Functions ---
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setActionLoading("create_invoice");

    const { data, error } = await supabase
      .from("client_invoices")
      .insert([
        {
          user_id: selectedClient,
          invoice_number: newInvoice.invoice_number,
          description: newInvoice.description,
          amount: parseFloat(newInvoice.amount),
          due_date: newInvoice.due_date,
          status: "Unpaid",
        },
      ])
      .select();

    if (!error && data) {
      setClientInvoices([data[0], ...clientInvoices]);
      setMessage({
        type: "success",
        text: "Invoice deployed to Client Vault.",
      });
      setShowInvoiceForm(false);
      setNewInvoice({
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        description: "",
        amount: "",
        due_date: "",
      });
    } else {
      setMessage({ type: "error", text: "Invoice generation failed." });
    }
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    const { error } = await supabase
      .from("client_invoices")
      .update({ status })
      .eq("id", invoiceId);
    if (!error)
      setClientInvoices(
        clientInvoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status } : inv,
        ),
      );
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Delete this invoice permanently?")) return;
    const { error } = await supabase
      .from("client_invoices")
      .delete()
      .eq("id", invoiceId);
    if (!error)
      setClientInvoices(clientInvoices.filter((inv) => inv.id !== invoiceId));
  };
  // ------------------------------

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gold-primary uppercase tracking-widest text-sm">
        Initializing HQ Command...
      </div>
    );

  return (
    <main className="min-h-screen p-6 md:p-10 relative flex justify-center items-start">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold-primary blur-[250px] opacity-5 -z-10 pointer-events-none"></div>

      <div className="w-full max-w-7xl mt-10">
        <div className="border-b border-gold-line pb-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-[10px] text-gold-primary uppercase tracking-[0.2em] mb-2 block">
              Central Control Room
            </span>
            <h1 className="text-4xl font-display text-text-white tracking-wide">
              Kachna HQ{" "}
              <span className="text-sm font-main font-light text-text-gray">
                v1.3
              </span>
            </h1>
          </div>
          <p className="text-text-gray text-xs uppercase tracking-widest">
            PostgreSQL Node: <span className="text-green-400">Synced</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Client List */}
          <div className="lg:col-span-1 bg-bg-panel border border-white/5 p-6 h-fit">
            <h2 className="text-sm uppercase tracking-widest text-gold-primary mb-6 border-b border-white/5 pb-3">
              Vault Directories
            </h2>
            <ul className="space-y-2">
              {clients.map((client) => (
                <li key={client.name}>
                  <button
                    onClick={() => fetchClientData(client.name)}
                    className={`w-full text-left p-3 text-xs font-mono transition-all border ${selectedClient === client.name ? "bg-gold-primary/10 border-gold-primary text-gold-primary" : "bg-bg-body border-white/5 text-text-gray hover:border-white/20"}`}
                  >
                    📁 Client_{client.name.substring(0, 8)}...
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 min-h-[400px] flex flex-col gap-6">
            {message && (
              <div
                className={`p-3 text-xs tracking-wider text-center border ${message.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}
              >
                {message.text}
              </div>
            )}

            {selectedClient && (
              <div className="bg-bg-panel border border-white/5 p-6">
                <p className="text-text-gray text-[10px] uppercase tracking-widest mb-3">
                  Project Phase Control
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(s)}
                      className={`px-3 py-1.5 text-[10px] uppercase tracking-widest border transition-all ${currentStatus === s ? "bg-gold-primary text-black border-gold-primary font-bold" : "bg-transparent text-text-gray border-white/10 hover:border-gold-primary/50"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* --- NEW: Invoice & Billing Panel --- */}
            {selectedClient && (
              <div className="bg-bg-panel border border-white/5 p-6 relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-white/10 pb-3 gap-4">
                  <h3 className="text-sm uppercase tracking-widest text-gold-primary flex items-center gap-2">
                    <span>💳</span> Billing & Finances
                  </h3>
                  <button
                    onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                    className="text-[10px] bg-gold-primary/10 text-gold-primary border border-gold-primary/30 px-3 py-1.5 uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors"
                  >
                    {showInvoiceForm ? "Cancel Creation" : "+ Generate Invoice"}
                  </button>
                </div>

                {showInvoiceForm && (
                  <form
                    onSubmit={handleCreateInvoice}
                    className="mb-6 bg-bg-body p-6 border border-white/5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                          Invoice Number
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={newInvoice.invoice_number}
                          className="w-full bg-black border border-white/5 p-2 text-sm text-text-gray/50 outline-none cursor-not-allowed font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                          Due Date
                        </label>
                        <input
                          required
                          type="date"
                          value={newInvoice.due_date}
                          onChange={(e) =>
                            setNewInvoice({
                              ...newInvoice,
                              due_date: e.target.value,
                            })
                          }
                          className="w-full bg-bg-panel border border-white/10 p-2 text-sm text-white focus:border-gold-primary outline-none color-scheme-dark"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                          Description / Particulars
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. 50% Advance for Summer Campaign Video Edit"
                          value={newInvoice.description}
                          onChange={(e) =>
                            setNewInvoice({
                              ...newInvoice,
                              description: e.target.value,
                            })
                          }
                          className="w-full bg-bg-panel border border-white/10 p-2 text-sm text-white focus:border-gold-primary outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                          Total Amount (BDT)
                        </label>
                        <input
                          required
                          type="number"
                          placeholder="e.g. 15000"
                          value={newInvoice.amount}
                          onChange={(e) =>
                            setNewInvoice({
                              ...newInvoice,
                              amount: e.target.value,
                            })
                          }
                          className="w-full bg-bg-panel border border-white/10 p-2 text-sm text-white focus:border-gold-primary outline-none font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading === "create_invoice"}
                      className="w-full bg-gold-primary text-black text-xs font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-50"
                    >
                      Deploy Invoice to Client
                    </button>
                  </form>
                )}

                {clientInvoices.length === 0 ? (
                  <p className="text-text-gray text-xs italic text-center py-4">
                    No financial records found for this client.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {clientInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border transition-all ${inv.status === "Paid" ? "border-green-500/20 bg-green-500/5" : "border-white/5 bg-bg-body"}`}
                      >
                        <div>
                          <p className="text-white text-sm font-mono">
                            {inv.invoice_number}{" "}
                            <span className="text-text-gray text-xs font-sans ml-2">
                              - {inv.description}
                            </span>
                          </p>
                          <p className="text-[10px] text-text-gray uppercase tracking-widest mt-2">
                            Due: {new Date(inv.due_date).toLocaleDateString()} •
                            Amount:{" "}
                            <span className="text-gold-primary font-bold text-sm ml-1">
                              ৳ {inv.amount}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-3 sm:mt-0">
                          <select
                            value={inv.status}
                            onChange={(e) =>
                              updateInvoiceStatus(inv.id, e.target.value)
                            }
                            className={`text-[10px] uppercase tracking-widest px-3 py-1.5 border outline-none font-bold cursor-pointer ${inv.status === "Paid" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                          </select>
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-2 text-text-gray hover:text-red-500 transition-colors"
                            title="Delete Invoice"
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
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" x2="10" y1="11" y2="17" />
                              <line x1="14" x2="14" y1="11" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* ------------------------------------- */}

            {/* Brief Display */}
            {clientBrief && (
              <div className="bg-bg-panel border border-white/5 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gold-primary text-black text-[9px] uppercase font-bold tracking-widest px-4 py-1.5">
                  Brief Received
                </div>
                <h3 className="text-sm uppercase tracking-widest text-gold-primary mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
                  <span>📝</span> Project Requirements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6">
                  <div>
                    <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">
                      Project Title
                    </span>
                    <span className="text-white font-medium">
                      {clientBrief.project_title}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">
                      Target Deadline
                    </span>
                    <span className="text-white font-medium">
                      {new Date(clientBrief.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">
                      Video Length
                    </span>
                    <span className="text-white">
                      {clientBrief.video_length}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">
                      Editing Style
                    </span>
                    <span className="text-white">
                      {clientBrief.editing_style}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-2">
                    Instructions
                  </span>
                  <p className="text-white/90 text-sm bg-bg-body p-4 border border-white/5 whitespace-pre-wrap">
                    {clientBrief.instructions}
                  </p>
                </div>
                {clientBrief.reference_links && (
                  <div className="mt-5">
                    <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">
                      Reference
                    </span>
                    <a
                      href={clientBrief.reference_links}
                      target="_blank"
                      className="text-blue-400 text-xs hover:underline"
                    >
                      {clientBrief.reference_links}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="bg-bg-panel border border-white/5 p-6 flex-grow">
              <h2 className="text-lg font-display text-text-white mb-4 border-b border-white/5 pb-4">
                Vault Assets
              </h2>
              {filesLoading ? (
                <div className="text-center py-10 text-gold-primary text-xs uppercase tracking-widest">
                  Scanning...
                </div>
              ) : clientFiles.length === 0 ? (
                <p className="text-center py-10 text-text-gray italic">
                  No assets to display.
                </p>
              ) : (
                <ul className="space-y-3">
                  {clientFiles.map((file) => {
                    const originalName = file.name.substring(
                      file.name.indexOf("_") + 1,
                    );
                    const isVideo = file.name.match(/\.(mp4|webm|ogg|mov)$/i);
                    return (
                      <li
                        key={file.id}
                        className="flex justify-between items-center p-4 border border-white/5 bg-bg-body hover:border-gold-primary/20 transition-all gap-4"
                      >
                        <div className="overflow-hidden">
                          <p className="text-text-white text-sm font-mono truncate max-w-[250px]">
                            {originalName}
                          </p>
                          <p className="text-text-gray text-[10px] uppercase tracking-wider mt-1">
                            {(file.metadata.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePreview(file.name)}
                            className={`p-2 transition-colors ${isVideo ? "text-gold-primary hover:text-white" : "text-text-gray hover:text-white"}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDownload(file.name)}
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
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" x2="12" y1="15" y2="3" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleShare(file.name)}
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
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(file.name)}
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
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" x2="10" y1="11" y2="17" />
                              <line x1="14" x2="14" y1="11" y2="17" />
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
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 backdrop-blur-sm p-4 md:p-10">
          <button
            onClick={() => setPreviewFile(null)}
            className="absolute top-6 right-6 text-text-gray hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="w-full max-w-7xl h-[85vh] flex flex-col lg:flex-row gap-0 border border-white/10 bg-bg-panel shadow-2xl overflow-hidden">
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
                  className="max-h-[80vh] object-contain m-auto"
                />
              )}
            </div>
            {previewFile.isVideo && (
              <div className="w-full lg:w-[400px] flex flex-col bg-bg-body shrink-0 border-l border-white/5 h-full">
                <div className="p-6 border-b border-white/5 bg-bg-panel">
                  <h3 className="text-gold-primary uppercase tracking-widest text-sm font-bold">
                    Client Review Notes
                  </h3>
                  <p className="text-[10px] text-text-gray mt-1 uppercase tracking-wider">
                    Inspect time-stamped feedback
                  </p>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {clientComments.length === 0 ? (
                    <p className="text-center text-text-gray text-xs italic mt-10">
                      No client feedback yet.
                    </p>
                  ) : (
                    clientComments.map((c) => (
                      <div
                        key={c.id}
                        className="border border-white/5 p-4 bg-bg-panel hover:border-gold-primary/20 transition-all cursor-pointer"
                        onClick={() => jumpToTime(c.time_stamp)}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-gold-primary text-black px-2 py-0.5 text-[10px] font-bold font-mono">
                            {formatTime(c.time_stamp)}
                          </span>
                        </div>
                        <p className="text-sm text-text-white leading-relaxed">
                          {c.comment_text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
