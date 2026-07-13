"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import StreamingVideoPlayer from "@/components/dashboard/StreamingVideoPlayer";
import MediaPreviewPanel from "@/components/dashboard/MediaPreviewPanel";
import {
  fetchMediaAssets,
  fetchMediaClients,
  deleteMediaAsset,
  getMediaOriginalUrl,
  getMediaPlaybackUrl,
  isMediaAssetProcessing,
  sanitizeAbsoluteMediaUrl,
  updateMediaAsset,
  type MediaAssetRecord,
  type MediaClientRecord,
} from "@/utils/mediaAssets";
import { buildPreviewPlayerKey } from "@/utils/previewAssetKey";
import { getMediaFileCategory } from "@/utils/mediaFileCategory";
import GlobalLiveWidget from "@/components/GlobalLiveWidget";
import ChatbotWidget from "@/components/ChatbotWidget";
import { Eye, EyeOff } from "lucide-react";

const CLIENT_DISCOVERY_TIMEOUT_MS = 10_000;

type SidebarClientRow = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  assetCount?: number;
};

function buildMergedClientList(
  agencyUsers: Array<{
    id: string;
    email?: string;
    displayName?: string | null;
    role?: string;
  }>,
  assetClients: MediaClientRecord[],
): SidebarClientRow[] {
  const byId = new Map<string, SidebarClientRow>();

  for (const user of agencyUsers) {
    if (user.role !== "client") continue;
    byId.set(user.id, {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
    });
  }

  for (const assetClient of assetClients) {
    const existing = byId.get(assetClient.userId);
    if (existing) {
      existing.assetCount = assetClient.assetCount;
    } else {
      byId.set(assetClient.userId, {
        id: assetClient.userId,
        assetCount: assetClient.assetCount,
      });
    }
  }

  return Array.from(byId.values()).sort(compareSidebarClients);
}

function getClientSortTier(client: SidebarClientRow): number {
  if (client.displayName?.trim()) return 0;
  if (client.email?.trim()) return 1;
  return 2;
}

function compareSidebarClients(a: SidebarClientRow, b: SidebarClientRow): number {
  const tierDiff = getClientSortTier(a) - getClientSortTier(b);
  if (tierDiff !== 0) return tierDiff;

  return getClientPrimaryLabel(a).localeCompare(getClientPrimaryLabel(b), undefined, {
    sensitivity: "base",
  });
}

function isActiveClient(client: SidebarClientRow): boolean {
  return Boolean(client.displayName?.trim() || client.email?.trim());
}

function isLegacyClient(client: SidebarClientRow): boolean {
  return !isActiveClient(client);
}

function matchesClientSearch(client: SidebarClientRow, query: string): boolean {
  const primary = getClientPrimaryLabel(client).toLowerCase();
  const secondary = getClientSecondaryLabel(client)?.toLowerCase() ?? "";
  const id = client.id.toLowerCase();
  return (
    primary.includes(query) ||
    secondary.includes(query) ||
    id.includes(query)
  );
}

function getClientPrimaryLabel(client: SidebarClientRow): string {
  const displayName = client.displayName?.trim();
  if (displayName) return displayName;

  const email = client.email?.trim();
  if (email) return email;

  return `${client.id.substring(0, 8)}...`;
}

function getClientSecondaryLabel(client: SidebarClientRow): string | null {
  const displayName = client.displayName?.trim();
  const email = client.email?.trim();
  if (displayName && email) return email;
  return null;
}

export default function AdminPortal() {
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clients, setClients] = useState<MediaClientRecord[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientAssets, setClientAssets] = useState<MediaAssetRecord[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [currentStatus, setCurrentStatus] = useState("Awaiting Assets");
  const [phaseProjectId, setPhaseProjectId] = useState<string | null>(null);
  const [phaseUpdateError, setPhaseUpdateError] = useState<string | null>(null);
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
    publicUrl: string;
    isVideo: boolean;
    assetId?: string;
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

  // --- Projects & Users (Prisma AgencyProject) ---
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [agencyUsers, setAgencyUsers] = useState<any[]>([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<"all" | "active" | "legacy">("all");
  const [newClient, setNewClient] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    clientId: "",
  });
  // -----------------------------------------------

  // --- Tasks (Prisma Task, assigned under AgencyProject) ---
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showTaskFormForProject, setShowTaskFormForProject] = useState<
    string | null
  >(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigneeId: "",
    dueDate: "",
    status: "todo",
  });
  const taskStatusOptions = ["todo", "in_progress", "in_review", "done"];
  const taskStatusLabels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    done: "Done",
  };
  // -----------------------------------------------------------

  const supabase = createClient();
  const clientDiscoveryCancelledRef = useRef(false);

  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/agency/projects");
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch {
      console.error("Failed to load projects");
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/agency/users");
      const data = await res.json();
      if (data.users) setAgencyUsers(data.users);
    } catch {
      console.error("Failed to load users");
    }
  };

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await fetch("/api/agency/tasks");
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch {
      console.error("Failed to load tasks");
    } finally {
      setTasksLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newClient.displayName.trim() ||
      !newClient.email.trim() ||
      !newClient.password
    ) {
      return;
    }
    setActionLoading("create_client");

    try {
      const res = await fetch("/api/agency/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: newClient.displayName.trim(),
          email: newClient.email.trim(),
          password: newClient.password,
        }),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Client created successfully.",
        });
        setShowClientForm(false);
        setShowPassword(false);
        setNewClient({ displayName: "", email: "", password: "" });
        await loadUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: err.error || "Failed to create client.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to create client." });
    }

    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    setActionLoading("create_project");

    try {
      const res = await fetch("/api/agency/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProject.title.trim(),
          description: newProject.description.trim() || undefined,
          clientId: newProject.clientId || undefined,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Project created." });
        setShowProjectForm(false);
        setNewProject({ title: "", description: "", clientId: "" });
        await loadProjects();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: err.error || "Failed to create project." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to create project." });
    }

    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateTask = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.assigneeId) return;
    setActionLoading(`create_task_${projectId}`);

    try {
      const res = await fetch("/api/agency/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: newTask.title.trim(),
          description: newTask.description.trim() || undefined,
          assigneeId: newTask.assigneeId,
          dueDate: newTask.dueDate || undefined,
          status: newTask.status,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Task assigned." });
        setShowTaskFormForProject(null);
        setNewTask({
          title: "",
          description: "",
          assigneeId: "",
          dueDate: "",
          status: "todo",
        });
        await loadTasks();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: err.error || "Failed to create task." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to create task." });
    }

    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    clientDiscoveryCancelledRef.current = false;
    fetch("/api/agency/me").catch(() => {});
    void fetchClientFolders();
    void loadProjects();
    void loadUsers();
    void loadTasks();

    return () => {
      clientDiscoveryCancelledRef.current = true;
    };
  }, []);

  const fetchClientFolders = async () => {
    setClientsLoading(true);
    try {
      const rows = await Promise.race([
        fetchMediaClients(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Client discovery timed out")),
            CLIENT_DISCOVERY_TIMEOUT_MS,
          ),
        ),
      ]);
      if (clientDiscoveryCancelledRef.current) return;
      setClients(rows);
    } catch (error) {
      console.error("Failed to load media clients:", error);
      if (!clientDiscoveryCancelledRef.current) setClients([]);
    } finally {
      if (!clientDiscoveryCancelledRef.current) setClientsLoading(false);
    }
  };

  const fetchClientData = async (clientId: string) => {
    setFilesLoading(true);
    setSelectedClient(clientId);
    setClientBrief(null);
    setShowInvoiceForm(false);
    setPhaseUpdateError(null);

    // Load vault assets from the media API (R2 + Prisma), scoped to the client userId.
    try {
      const assets = await fetchMediaAssets({ userId: clientId });
      setClientAssets(assets);
    } catch (error) {
      console.error("Failed to load client media assets:", error);
      setClientAssets([]);
    }

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
    if (!selectedClient || !phaseProjectId) return;
    setActionLoading("status_update");
    setPhaseUpdateError(null);

    try {
      const res = await fetch("/api/agency/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: phaseProjectId, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPhaseUpdateError(
          (data as { error?: string }).error || "Failed to update project phase",
        );
        return;
      }

      setCurrentStatus(newStatus);
      setProjects((prev) =>
        prev.map((project) =>
          project.id === phaseProjectId ? { ...project, ...data } : project,
        ),
      );
      setMessage({
        type: "success",
        text: `HQ Override: Status changed to "${newStatus}"`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setPhaseUpdateError("Failed to update project phase");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = (asset: MediaAssetRecord) => {
    const url = getMediaOriginalUrl(asset);
    if (url) window.open(url, "_blank");
  };

  const handleShare = async (asset: MediaAssetRecord) => {
    const url = getMediaOriginalUrl(asset);
    if (url) {
      await navigator.clipboard.writeText(url);
      setMessage({ type: "success", text: "Asset link copied!" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (asset: MediaAssetRecord) => {
    if (!selectedClient || !confirm("PURGE ASSET: Are you sure?")) return;
    try {
      await deleteMediaAsset(asset.id);
      await fetchClientData(selectedClient);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete asset.";
      setMessage({ type: "error", text: message });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleLinkAssetToProject = async (
    assetId: string,
    projectId: string,
  ) => {
    try {
      const updated = await updateMediaAsset(assetId, {
        agencyProjectId: projectId || null,
      });
      setClientAssets((prev) =>
        prev.map((a) => (a.id === assetId ? { ...a, ...updated } : a)),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to link asset to project.";
      setMessage({ type: "error", text: message });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handlePreview = async (asset: MediaAssetRecord) => {
    setActionLoading(`preview_${asset.id}`);
    const url = getMediaPlaybackUrl(asset);
    const isProcessing = isMediaAssetProcessing(asset);
    if (url || isProcessing) {
      const isVideo = getMediaFileCategory(asset.fileName) === "video";
      setPreviewFile({
        name: asset.fileName,
        url: url ?? "",
        publicUrl: url ?? "",
        isVideo,
        assetId: asset.id,
      });
      if (isVideo && selectedClient) {
        const { data } = await supabase
          .from("video_comments")
          .select("*")
          .eq("file_name", asset.fileName)
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

  const clientUsers = agencyUsers.filter((u: any) => u.role === "client");
  const editorUsers = agencyUsers.filter((u: any) => u.role === "editor" || u.role === "admin");
  const mergedClients = useMemo(
    () => buildMergedClientList(agencyUsers, clients),
    [agencyUsers, clients],
  );
  const sidebarClientGroups = useMemo(() => {
    const query = clientSearchQuery.trim().toLowerCase();

    let scoped = mergedClients;
    if (clientFilter === "active") {
      scoped = scoped.filter(isActiveClient);
    } else if (clientFilter === "legacy") {
      scoped = scoped.filter(isLegacyClient);
    }

    const searched = query
      ? scoped.filter((client) => matchesClientSearch(client, query))
      : scoped;

    const active = searched.filter(isActiveClient);
    const legacy = searched.filter(isLegacyClient);

    return {
      active,
      legacy,
      total: searched.length,
      showLegacyDivider:
        clientFilter === "all" && active.length > 0 && legacy.length > 0,
      entries: [
        ...active.map((client) => ({ type: "client" as const, client })),
        ...(clientFilter === "all" && active.length > 0 && legacy.length > 0
          ? [{ type: "divider" as const }]
          : []),
        ...legacy.map((client) => ({ type: "client" as const, client })),
      ],
    };
  }, [mergedClients, clientSearchQuery, clientFilter]);
  const openTasksCount = useMemo(
    () => tasks.filter((task: any) => task.status !== "done").length,
    [tasks],
  );
  const clientProjectsForSelected = useMemo(() => {
    if (!selectedClient) return [];
    return projects.filter(
      (project: any) =>
        project.clientId === selectedClient ||
        project.client?.id === selectedClient,
    );
  }, [projects, selectedClient]);

  useEffect(() => {
    if (!selectedClient) {
      setPhaseProjectId(null);
      return;
    }

    if (clientProjectsForSelected.length === 0) {
      setPhaseProjectId(null);
      setCurrentStatus("Awaiting Assets");
      return;
    }

    setPhaseProjectId((prev) => {
      const stillValid =
        prev && clientProjectsForSelected.some((project: any) => project.id === prev);
      return stillValid ? prev : clientProjectsForSelected[0].id;
    });
  }, [selectedClient, clientProjectsForSelected]);

  useEffect(() => {
    if (!phaseProjectId) return;

    const project = clientProjectsForSelected.find(
      (entry: any) => entry.id === phaseProjectId,
    );
    if (!project) return;

    const nextStatus =
      typeof project.status === "string" &&
      statusOptions.includes(project.status)
        ? project.status
        : "Awaiting Assets";
    setCurrentStatus(nextStatus);
  }, [phaseProjectId, clientProjectsForSelected]);

  const unassignedAssetCount = useMemo(
    () => clientAssets.filter((asset) => !asset.agencyProjectId).length,
    [clientAssets],
  );
  const selectedClientRow = mergedClients.find((c) => c.id === selectedClient) ?? null;
  const selectedClientOverview = useMemo(() => {
    if (!selectedClient) return null;

    const clientProjects = projects.filter(
      (project: any) =>
        project.clientId === selectedClient || project.client?.id === selectedClient,
    );
    const clientProjectIds = new Set(clientProjects.map((project: any) => project.id));
    const clientTasks = tasks.filter(
      (task: any) =>
        clientProjectIds.has(task.projectId) ||
        clientProjectIds.has(task.project?.id),
    );

    const openTasks = clientTasks.filter((task: any) => task.status !== "done").length;
    const completedTasks = clientTasks.filter((task: any) => task.status === "done").length;

    const unpaidInvoices = filesLoading
      ? []
      : clientInvoices.filter((invoice: any) => invoice.status === "Unpaid");
    const unpaidTotal = unpaidInvoices.reduce(
      (sum: number, invoice: any) => sum + Number(invoice.amount || 0),
      0,
    );

    const activityCandidates: Array<{ at: number; label: string }> = [];

    for (const project of clientProjects) {
      for (const value of [project.updatedAt, project.createdAt]) {
        const at = value ? new Date(value).getTime() : NaN;
        if (!Number.isNaN(at)) {
          activityCandidates.push({ at, label: "project update" });
        }
      }
    }

    for (const task of clientTasks) {
      for (const value of [task.updatedAt, task.createdAt]) {
        const at = value ? new Date(value).getTime() : NaN;
        if (!Number.isNaN(at)) {
          activityCandidates.push({ at, label: "task update" });
        }
      }
    }

    if (!filesLoading) {
      for (const asset of clientAssets) {
        for (const value of [asset.updatedAt, asset.createdAt]) {
          const at = value ? new Date(value).getTime() : NaN;
          if (!Number.isNaN(at)) {
            activityCandidates.push({ at, label: "vault activity" });
          }
        }
      }

      for (const invoice of clientInvoices) {
        const at = invoice.created_at
          ? new Date(invoice.created_at).getTime()
          : NaN;
        if (!Number.isNaN(at)) {
          activityCandidates.push({ at, label: "billing activity" });
        }
      }

      if (clientBrief?.updated_at) {
        const at = new Date(clientBrief.updated_at).getTime();
        if (!Number.isNaN(at)) {
          activityCandidates.push({ at, label: "brief update" });
        }
      }
    }

    const lastActivityCandidate =
      activityCandidates.length > 0
        ? activityCandidates.reduce((latest, candidate) =>
            candidate.at >= latest.at ? candidate : latest,
          )
        : null;
    const lastActivity = lastActivityCandidate
      ? {
          date: new Date(lastActivityCandidate.at),
          label: lastActivityCandidate.label,
        }
      : null;

    return {
      projectCount: clientProjects.length,
      openTasks,
      completedTasks,
      assetCount: filesLoading ? null : clientAssets.length,
      invoiceCount: filesLoading ? null : clientInvoices.length,
      unpaidInvoiceCount: filesLoading ? null : unpaidInvoices.length,
      unpaidTotal: filesLoading ? null : unpaidTotal,
      currentPhase: currentStatus,
      lastActivity,
      isLegacy: selectedClientRow ? isLegacyClient(selectedClientRow) : false,
      primaryLabel: selectedClientRow
        ? getClientPrimaryLabel(selectedClientRow)
        : `${selectedClient.substring(0, 8)}...`,
      secondaryLabel: selectedClientRow
        ? getClientSecondaryLabel(selectedClientRow)
        : null,
    };
  }, [
    selectedClient,
    selectedClientRow,
    projects,
    tasks,
    clientAssets,
    clientInvoices,
    clientBrief,
    currentStatus,
    filesLoading,
  ]);

  return (
    <main className="min-h-screen bg-bg-body text-text-gray font-main p-6 md:p-10 relative flex justify-center items-start">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold-primary blur-[250px] opacity-5 -z-10 pointer-events-none"></div>

      <div className="w-full max-w-7xl mt-10">
        {/* ── Page Header ── */}
        <div className="border-b border-gold-line pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-[10px] text-gold-primary uppercase tracking-[0.2em] mb-2 block">
              Operations HQ
            </span>
            <h1 className="text-4xl font-display text-text-white tracking-wide">
              Rendorax Studio
            </h1>
            <p className="text-xs text-text-gray mt-2">
              Manage clients, projects, assignments, billing, and delivery.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <ChatbotWidget isEmbedded />
          </div>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-panel border border-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-text-gray mb-1">Projects</p>
            <p className="text-2xl font-display text-text-white">{projectsLoading ? "—" : projects.length}</p>
          </div>
          <div className="bg-bg-panel border border-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-text-gray mb-1">Clients</p>
            <p className="text-2xl font-display text-text-white">
              {clientsLoading && mergedClients.length === 0
                ? "—"
                : mergedClients.length}
            </p>
          </div>
          <div className="bg-bg-panel border border-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-text-gray mb-1">Team Members</p>
            <p className="text-2xl font-display text-text-white">{editorUsers.length || "—"}</p>
          </div>
          <div className="bg-bg-panel border border-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-text-gray mb-1">Open Tasks</p>
            <p className="text-2xl font-display text-text-white">
              {tasksLoading ? "—" : openTasksCount}
            </p>
          </div>
        </div>

        {/* ── Message Banner ── */}
        {message && (
          <div
            className={`mb-6 p-3 text-xs tracking-wider text-center border ${message.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Client List */}
            <div className="bg-bg-panel border border-white/5 p-6">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3 gap-2">
                <h2 className="text-sm uppercase tracking-widest text-gold-primary">
                  Clients
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    if (showClientForm) setShowPassword(false);
                    setShowClientForm(!showClientForm);
                  }}
                  className="text-[10px] bg-gold-primary/10 text-gold-primary border border-gold-primary/30 px-2.5 py-1 uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors shrink-0"
                >
                  {showClientForm ? "Cancel" : "+ Add Client"}
                </button>
              </div>

              {showClientForm && (
                <form
                  onSubmit={handleCreateClient}
                  autoComplete="off"
                  className="mb-4 bg-bg-body p-4 border border-white/5"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                        Full Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Client full name"
                        value={newClient.displayName}
                        onChange={(e) =>
                          setNewClient({ ...newClient, displayName: e.target.value })
                        }
                        className="w-full bg-bg-panel border border-white/10 p-2.5 text-sm text-white focus:border-gold-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                        Email *
                      </label>
                      <input
                        required
                        type="email"
                        autoComplete="new-password"
                        placeholder="client@company.com"
                        value={newClient.email}
                        onChange={(e) =>
                          setNewClient({ ...newClient, email: e.target.value })
                        }
                        className="w-full bg-bg-panel border border-white/10 p-2.5 text-sm text-white focus:border-gold-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          required
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={6}
                          placeholder="Temporary client password"
                          value={newClient.password}
                          onChange={(e) =>
                            setNewClient({ ...newClient, password: e.target.value })
                          }
                          className="w-full bg-bg-panel border border-white/10 p-2.5 pr-10 text-sm text-white focus:border-gold-primary outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-gray hover:text-gold-primary transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff size={16} aria-hidden="true" />
                          ) : (
                            <Eye size={16} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading === "create_client"}
                    className="w-full mt-4 bg-gold-primary text-black text-xs font-bold uppercase tracking-widest py-2.5 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    Create Client
                  </button>
                </form>
              )}

              {mergedClients.length > 0 && (
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="sr-only" htmlFor="client-filter">
                      Filter clients
                    </label>
                    <select
                      id="client-filter"
                      value={clientFilter}
                      onChange={(e) =>
                        setClientFilter(e.target.value as "all" | "active" | "legacy")
                      }
                      className="w-full bg-bg-body border border-white/10 p-2.5 text-sm text-white focus:border-gold-primary outline-none"
                    >
                      <option value="all">All Clients</option>
                      <option value="active">Active Clients</option>
                      <option value="legacy">Legacy Clients</option>
                    </select>
                  </div>
                  <div className="relative">
                    <label className="sr-only" htmlFor="client-search">
                      Search clients
                    </label>
                    <input
                      id="client-search"
                      type="search"
                      placeholder="Search by name, email, or ID..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="w-full bg-bg-body border border-white/10 p-2.5 pr-9 text-sm text-white placeholder:text-text-gray/60 focus:border-gold-primary outline-none"
                    />
                    {clientSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => setClientSearchQuery("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 text-text-gray hover:text-gold-primary transition-colors text-sm"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {clientsLoading && mergedClients.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gold-primary text-xs uppercase tracking-widest">
                    Loading clients...
                  </p>
                </div>
              ) : mergedClients.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-text-gray text-xs">No clients yet.</p>
                  <p className="text-text-gray/50 text-[10px] mt-2 mb-4">
                    Add a client to start managing operations.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowClientForm(true)}
                    className="text-[10px] bg-gold-primary/10 text-gold-primary border border-gold-primary/30 px-3 py-1.5 uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors"
                  >
                    + Add Client
                  </button>
                </div>
              ) : sidebarClientGroups.total === 0 ? (
                <div className="text-center py-6">
                  {clientSearchQuery.trim() ? (
                    <>
                      <p className="text-text-gray text-xs">
                        No clients match &ldquo;{clientSearchQuery.trim()}&rdquo;
                      </p>
                      <p className="text-text-gray/50 text-[10px] mt-2 mb-4">
                        Try another name, email, or client ID.
                      </p>
                      <button
                        type="button"
                        onClick={() => setClientSearchQuery("")}
                        className="text-[10px] text-gold-primary border border-gold-primary/30 px-3 py-1.5 uppercase tracking-widest hover:bg-gold-primary/10 transition-colors"
                      >
                        Clear search
                      </button>
                    </>
                  ) : clientFilter === "active" ? (
                    <>
                      <p className="text-text-gray text-xs">No active clients yet.</p>
                      <p className="text-text-gray/50 text-[10px] mt-2 mb-4">
                        Provision a client with a name or email to see them here.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowClientForm(true)}
                        className="text-[10px] bg-gold-primary/10 text-gold-primary border border-gold-primary/30 px-3 py-1.5 uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors"
                      >
                        + Add Client
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-text-gray text-xs">No legacy clients found.</p>
                      <p className="text-text-gray/50 text-[10px] mt-2 mb-4">
                        Legacy clients are asset-only records without a name or email.
                      </p>
                      <button
                        type="button"
                        onClick={() => setClientFilter("all")}
                        className="text-[10px] text-gold-primary border border-gold-primary/30 px-3 py-1.5 uppercase tracking-widest hover:bg-gold-primary/10 transition-colors"
                      >
                        Show all clients
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto pr-1">
                  <ul className="space-y-2">
                    {sidebarClientGroups.entries.map((entry) => {
                      if (entry.type === "divider") {
                        return (
                          <li key="legacy-divider" className="py-1">
                            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-text-gray/60">
                              <span className="flex-1 border-t border-white/10" />
                              <span>Legacy Clients</span>
                              <span className="flex-1 border-t border-white/10" />
                            </div>
                          </li>
                        );
                      }

                      const client = entry.client;
                      const primaryLabel = getClientPrimaryLabel(client);
                      const secondaryLabel = getClientSecondaryLabel(client);
                      const isLegacy = isLegacyClient(client);

                      return (
                        <li key={client.id}>
                          <button
                            type="button"
                            onClick={() => fetchClientData(client.id)}
                            className={`w-full text-left p-3 text-xs transition-all border ${selectedClient === client.id ? "bg-gold-primary/10 border-gold-primary text-gold-primary" : "bg-bg-body border-white/5 text-text-gray hover:border-white/20"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <span
                                  className={`block truncate ${isLegacy ? "font-mono text-text-gray" : "text-white font-medium"}`}
                                >
                                  {primaryLabel}
                                </span>
                                {secondaryLabel ? (
                                  <span className="block truncate text-[10px] text-text-gray/80 mt-1">
                                    {secondaryLabel}
                                  </span>
                                ) : isLegacy ? (
                                  <span className="block truncate text-[10px] text-text-gray/50 mt-1 font-mono">
                                    {client.id}
                                  </span>
                                ) : null}
                              </div>
                              {typeof client.assetCount === "number" ? (
                                <span
                                  className={`shrink-0 text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                                    selectedClient === client.id
                                      ? "border-gold-primary/40 bg-gold-primary/10 text-gold-primary"
                                      : "border-white/10 bg-black/20 text-text-gray"
                                  }`}
                                >
                                  {client.assetCount} asset
                                  {client.assetCount === 1 ? "" : "s"}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* HQ Communications */}
            <div className="bg-bg-panel border border-white/5 p-6">
              <h2 className="text-sm uppercase tracking-widest text-gold-primary mb-4 border-b border-white/5 pb-3">
                Communications
              </h2>
              <GlobalLiveWidget isEmbedded={true} />
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="lg:col-span-3 flex flex-col gap-8">

            {/* ═══════ SECTION: Projects ═══════ */}
            <section>
              <div className="bg-bg-panel border border-white/5 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-white/10 pb-3 gap-4">
                  <h3 className="text-sm uppercase tracking-widest text-gold-primary">
                    Projects
                  </h3>
                  <button
                    onClick={() => setShowProjectForm(!showProjectForm)}
                    className="text-[10px] bg-gold-primary/10 text-gold-primary border border-gold-primary/30 px-3 py-1.5 uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors"
                  >
                    {showProjectForm ? "Cancel" : "+ New Project"}
                  </button>
                </div>

                {showProjectForm && (
                  <form onSubmit={handleCreateProject} className="mb-6 bg-bg-body p-5 border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                          Project Title *
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Summer Campaign TVC"
                          value={newProject.title}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                          className="w-full bg-bg-panel border border-white/10 p-2.5 text-sm text-white focus:border-gold-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                          Assign Client
                        </label>
                        <select
                          value={newProject.clientId}
                          onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                          className="w-full bg-bg-panel border border-white/10 p-2.5 text-sm text-white focus:border-gold-primary outline-none"
                        >
                          <option value="">No client assigned</option>
                          {clientUsers.map((u: any) => (
                            <option key={u.id} value={u.id}>
                              {u.displayName || u.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          placeholder="Optional project description"
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          className="w-full bg-bg-panel border border-white/10 p-2.5 text-sm text-white focus:border-gold-primary outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading === "create_project"}
                      className="w-full bg-gold-primary text-black text-xs font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-50"
                    >
                      Create Project
                    </button>
                  </form>
                )}

                {projectsLoading ? (
                  <p className="text-center py-6 text-gold-primary text-xs uppercase tracking-widest">
                    Loading projects...
                  </p>
                ) : projects.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-text-gray text-xs">No projects yet.</p>
                    <p className="text-text-gray/50 text-[10px] mt-2 mb-4">
                      Create your first project to start managing production.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowProjectForm(true)}
                      className="text-[10px] bg-gold-primary/10 text-gold-primary border border-gold-primary/30 px-3 py-1.5 uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors"
                    >
                      + New Project
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((proj: any) => {
                      const projectTasks = tasks.filter(
                        (t: any) => t.projectId === proj.id || t.project?.id === proj.id,
                      );
                      const isTaskFormOpen = showTaskFormForProject === proj.id;
                      const linkedVaultAssets = clientAssets.filter(
                        (asset) => asset.agencyProjectId === proj.id,
                      );
                      const LINKED_ASSET_DISPLAY_LIMIT = 5;

                      return (
                        <div
                          key={proj.id}
                          className="border border-white/5 bg-bg-body hover:border-gold-primary/20 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-3">
                            <div className="min-w-0">
                              <p className="text-text-white text-sm font-medium truncate">
                                {proj.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                <span className="text-[10px] uppercase tracking-widest text-text-gray">
                                  Status: <span className="text-gold-primary">{proj.status}</span>
                                </span>
                                {proj.client && (
                                  <span className="text-[10px] uppercase tracking-widest text-text-gray">
                                    Client: <span className="text-white">{proj.client.displayName || proj.client.email}</span>
                                  </span>
                                )}
                                {proj._count && (
                                  <span className="text-[10px] uppercase tracking-widest text-text-gray">
                                    {proj._count.tasks} task{proj._count.tasks === 1 ? "" : "s"} · {proj._count.assets} asset{proj._count.assets === 1 ? "" : "s"}
                                  </span>
                                )}
                              </div>
                              {proj.description && (
                                <p className="text-[11px] text-text-gray mt-1 truncate max-w-md">
                                  {proj.description}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-text-gray uppercase tracking-widest shrink-0">
                              {new Date(proj.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Tasks under this project */}
                          <div className="border-t border-white/5 p-4 bg-black/10">
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-[10px] uppercase tracking-widest text-text-gray">
                                Tasks
                              </p>
                              <button
                                onClick={() =>
                                  setShowTaskFormForProject(
                                    isTaskFormOpen ? null : proj.id,
                                  )
                                }
                                className="text-[10px] bg-gold-primary/10 text-gold-primary border border-gold-primary/30 px-2.5 py-1 uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors"
                              >
                                {isTaskFormOpen ? "Cancel" : "+ Add Task"}
                              </button>
                            </div>

                            {isTaskFormOpen && (
                              <form
                                onSubmit={(e) => handleCreateTask(e, proj.id)}
                                className="mb-4 bg-bg-panel p-4 border border-white/5"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-1.5">
                                      Task Title *
                                    </label>
                                    <input
                                      required
                                      type="text"
                                      placeholder="e.g. Rough Cut V1"
                                      value={newTask.title}
                                      onChange={(e) =>
                                        setNewTask({ ...newTask, title: e.target.value })
                                      }
                                      className="w-full bg-bg-body border border-white/10 p-2 text-sm text-white focus:border-gold-primary outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-1.5">
                                      Assign To *
                                    </label>
                                    <select
                                      required
                                      value={newTask.assigneeId}
                                      onChange={(e) =>
                                        setNewTask({ ...newTask, assigneeId: e.target.value })
                                      }
                                      className="w-full bg-bg-body border border-white/10 p-2 text-sm text-white focus:border-gold-primary outline-none"
                                    >
                                      <option value="">Select team member</option>
                                      {editorUsers.map((u: any) => (
                                        <option key={u.id} value={u.id}>
                                          {u.displayName || u.email}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-1.5">
                                      Due Date
                                    </label>
                                    <input
                                      type="date"
                                      value={newTask.dueDate}
                                      onChange={(e) =>
                                        setNewTask({ ...newTask, dueDate: e.target.value })
                                      }
                                      className="w-full bg-bg-body border border-white/10 p-2 text-sm text-white focus:border-gold-primary outline-none color-scheme-dark"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-1.5">
                                      Status
                                    </label>
                                    <select
                                      value={newTask.status}
                                      onChange={(e) =>
                                        setNewTask({ ...newTask, status: e.target.value })
                                      }
                                      className="w-full bg-bg-body border border-white/10 p-2 text-sm text-white focus:border-gold-primary outline-none"
                                    >
                                      {taskStatusOptions.map((s) => (
                                        <option key={s} value={s}>
                                          {taskStatusLabels[s]}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-1.5">
                                      Description
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Optional task description"
                                      value={newTask.description}
                                      onChange={(e) =>
                                        setNewTask({ ...newTask, description: e.target.value })
                                      }
                                      className="w-full bg-bg-body border border-white/10 p-2 text-sm text-white focus:border-gold-primary outline-none"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="submit"
                                  disabled={actionLoading === `create_task_${proj.id}`}
                                  className="w-full bg-gold-primary text-black text-xs font-bold uppercase tracking-widest py-2.5 hover:bg-white transition-colors disabled:opacity-50"
                                >
                                  Assign Task
                                </button>
                              </form>
                            )}

                            {tasksLoading ? (
                              <p className="text-center py-3 text-gold-primary text-[10px] uppercase tracking-widest">
                                Loading tasks...
                              </p>
                            ) : projectTasks.length === 0 ? (
                              <p className="text-text-gray/60 text-[11px] italic text-center py-3">
                                No tasks assigned yet.
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {projectTasks.map((task: any) => (
                                  <li
                                    key={task.id}
                                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-white/5 bg-bg-panel gap-2"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-text-white text-xs font-medium truncate">
                                        {task.title}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                        <span className="text-[9px] uppercase tracking-widest text-text-gray">
                                          {task.assignee
                                            ? task.assignee.displayName || task.assignee.email
                                            : "Unassigned"}
                                        </span>
                                        {task.dueDate && (
                                          <span className="text-[9px] uppercase tracking-widest text-text-gray">
                                            Due {new Date(task.dueDate).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span
                                      className={`text-[9px] uppercase tracking-widest px-2 py-1 border shrink-0 ${
                                        task.status === "done"
                                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                                          : task.status === "in_review"
                                            ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                            : task.status === "in_progress"
                                              ? "border-gold-primary/30 bg-gold-primary/10 text-gold-primary"
                                              : "border-white/10 bg-white/5 text-text-gray"
                                      }`}
                                    >
                                      {taskStatusLabels[task.status] || task.status}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="border-t border-white/5 p-4 bg-black/5">
                            <p className="text-[10px] uppercase tracking-widest text-text-gray mb-2">
                              Linked Vault Assets ({linkedVaultAssets.length})
                            </p>
                            {linkedVaultAssets.length === 0 ? (
                              <p className="text-[11px] text-text-gray/60 italic">
                                No vault assets linked yet.
                              </p>
                            ) : (
                              <ul className="space-y-1">
                                {linkedVaultAssets
                                  .slice(0, LINKED_ASSET_DISPLAY_LIMIT)
                                  .map((asset) => (
                                    <li
                                      key={asset.id}
                                      className="text-[11px] text-text-white/80 font-mono truncate"
                                    >
                                      {asset.fileName}
                                    </li>
                                  ))}
                                {linkedVaultAssets.length > LINKED_ASSET_DISPLAY_LIMIT ? (
                                  <li className="text-[10px] text-text-gray">
                                    +{linkedVaultAssets.length - LINKED_ASSET_DISPLAY_LIMIT}{" "}
                                    more
                                  </li>
                                ) : null}
                              </ul>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ═══════ SECTION: Client Operations ═══════ */}
            <section>
              {!selectedClient ? (
                <div className="bg-bg-panel border border-white/5 p-10 text-center">
                  <p className="text-text-gray text-xs uppercase tracking-widest">
                    Select a client from the sidebar
                  </p>
                  <p className="text-text-gray/50 text-[10px] mt-2">
                    Choose a client to manage phase control, billing, brief, and vault assets.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Section Header */}
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm uppercase tracking-widest text-gold-primary">
                      Client:{" "}
                      {selectedClientRow
                        ? getClientPrimaryLabel(selectedClientRow)
                        : `${selectedClient?.substring(0, 8)}...`}
                    </h3>
                  </div>

                  {/* Client Overview */}
                  {selectedClientOverview && (
                    <div className="bg-bg-panel border border-white/5 p-6">
                      <h3 className="text-sm uppercase tracking-widest text-gold-primary mb-4 border-b border-white/10 pb-3">
                        Client Overview
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                        <div className="min-w-0">
                          <p className="text-white text-lg font-medium truncate">
                            {selectedClientOverview.primaryLabel}
                          </p>
                          {selectedClientOverview.secondaryLabel ? (
                            <p className="text-text-gray text-sm mt-1 truncate">
                              {selectedClientOverview.secondaryLabel}
                            </p>
                          ) : selectedClientRow?.email ? (
                            <p className="text-text-gray text-sm mt-1 truncate">
                              {selectedClientRow.email}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`shrink-0 self-start text-[9px] uppercase tracking-widest px-2.5 py-1 border ${
                            selectedClientOverview.isLegacy
                              ? "border-white/10 bg-black/20 text-text-gray"
                              : "border-gold-primary/30 bg-gold-primary/10 text-gold-primary"
                          }`}
                        >
                          {selectedClientOverview.isLegacy
                            ? "Legacy Client"
                            : "Active Client"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                        <div className="bg-bg-body border border-white/5 p-3">
                          <p className="text-[9px] uppercase tracking-widest text-text-gray mb-1">
                            Projects
                          </p>
                          <p className="text-lg font-display text-text-white">
                            {selectedClientOverview.projectCount}
                          </p>
                        </div>
                        <div className="bg-bg-body border border-white/5 p-3">
                          <p className="text-[9px] uppercase tracking-widest text-text-gray mb-1">
                            Open Tasks
                          </p>
                          <p className="text-lg font-display text-text-white">
                            {selectedClientOverview.openTasks}
                          </p>
                        </div>
                        <div className="bg-bg-body border border-white/5 p-3">
                          <p className="text-[9px] uppercase tracking-widest text-text-gray mb-1">
                            Completed Tasks
                          </p>
                          <p className="text-lg font-display text-text-white">
                            {selectedClientOverview.completedTasks}
                          </p>
                        </div>
                        <div className="bg-bg-body border border-white/5 p-3">
                          <p className="text-[9px] uppercase tracking-widest text-text-gray mb-1">
                            Assets
                          </p>
                          <p className="text-lg font-display text-text-white">
                            {selectedClientOverview.assetCount ?? "—"}
                          </p>
                        </div>
                        <div className="bg-bg-body border border-white/5 p-3">
                          <p className="text-[9px] uppercase tracking-widest text-text-gray mb-1">
                            Invoices
                          </p>
                          <p className="text-lg font-display text-text-white">
                            {selectedClientOverview.invoiceCount ?? "—"}
                          </p>
                        </div>
                        <div className="bg-bg-body border border-white/5 p-3">
                          <p className="text-[9px] uppercase tracking-widest text-text-gray mb-1">
                            Unpaid
                          </p>
                          <p className="text-lg font-display text-gold-primary">
                            {selectedClientOverview.unpaidInvoiceCount === null
                              ? "—"
                              : `$ ${selectedClientOverview.unpaidTotal?.toLocaleString()}`}
                          </p>
                          {selectedClientOverview.unpaidInvoiceCount !== null &&
                          selectedClientOverview.unpaidInvoiceCount > 0 ? (
                            <p className="text-[9px] text-text-gray mt-1">
                              {selectedClientOverview.unpaidInvoiceCount} invoice
                              {selectedClientOverview.unpaidInvoiceCount === 1
                                ? ""
                                : "s"}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-text-gray mb-1">
                            Current Phase
                          </p>
                          <p className="text-white font-medium">
                            {selectedClientOverview.currentPhase}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-text-gray mb-1">
                            Last Activity
                          </p>
                          <p className="text-white font-medium">
                            {filesLoading
                              ? "Loading..."
                              : selectedClientOverview.lastActivity
                                ? `${selectedClientOverview.lastActivity.date.toLocaleDateString()} — ${selectedClientOverview.lastActivity.label}`
                                : "No activity yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase Control */}
                  <div className="bg-bg-panel border border-white/5 p-6">
                    <p className="text-text-gray text-[10px] uppercase tracking-widest mb-3">
                      Project Phase Control
                    </p>
                    {clientProjectsForSelected.length === 0 ? (
                      <p className="text-[10px] text-text-gray italic mb-3">
                        No agency projects for this client yet.
                      </p>
                    ) : null}
                    {clientProjectsForSelected.length > 1 ? (
                      <div className="mb-3">
                        <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1.5">
                          Target Project
                        </label>
                        <select
                          value={phaseProjectId || ""}
                          onChange={(e) => {
                            setPhaseProjectId(e.target.value);
                            setPhaseUpdateError(null);
                          }}
                          className="w-full max-w-md bg-bg-body border border-white/10 p-2 text-[11px] text-white focus:border-gold-primary outline-none"
                        >
                          {clientProjectsForSelected.map((project: any) => (
                            <option key={project.id} value={project.id}>
                              {project.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {phaseUpdateError ? (
                      <p className="text-[10px] text-red-400 mb-3 border border-red-500/20 bg-red-500/5 px-2 py-1.5">
                        {phaseUpdateError}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(s)}
                          disabled={
                            !phaseProjectId || actionLoading === "status_update"
                          }
                          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${currentStatus === s ? "bg-gold-primary text-black border-gold-primary font-bold" : "bg-transparent text-text-gray border-white/10 hover:border-gold-primary/50"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {actionLoading === "status_update" ? (
                      <p className="text-[9px] text-text-gray mt-2 uppercase tracking-widest">
                        Updating phase...
                      </p>
                    ) : null}
                  </div>

                  {/* Billing & Finances */}
                  <div className="bg-bg-panel border border-white/5 p-6 relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-white/10 pb-3 gap-4">
                      <h3 className="text-sm uppercase tracking-widest text-gold-primary">
                        Billing & Finances
                      </h3>
                      <button
                        onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                        className="text-[10px] bg-gold-primary/10 text-gold-primary border border-gold-primary/30 px-3 py-1.5 uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors"
                      >
                        {showInvoiceForm ? "Cancel" : "+ Generate Invoice"}
                      </button>
                    </div>

                    {showInvoiceForm && (
                      <form
                        onSubmit={handleCreateInvoice}
                        className="mb-6 bg-bg-body p-5 border border-white/5"
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
                              className="w-full bg-black border border-white/5 p-2.5 text-sm text-text-gray/50 outline-none cursor-not-allowed font-mono"
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
                              className="w-full bg-bg-panel border border-white/10 p-2.5 text-sm text-white focus:border-gold-primary outline-none color-scheme-dark"
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
                              className="w-full bg-bg-panel border border-white/10 p-2.5 text-sm text-white focus:border-gold-primary outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                              Total Amount (USD)
                            </label>
                            <input
                              required
                              type="number"
                              placeholder="e.g. 1500"
                              value={newInvoice.amount}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  amount: e.target.value,
                                })
                              }
                              className="w-full bg-bg-panel border border-white/10 p-2.5 text-sm text-white focus:border-gold-primary outline-none font-mono"
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
                                  $ {Number(inv.amount).toLocaleString()}
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Brief Display */}
                  {clientBrief && (
                    <div className="bg-bg-panel border border-white/5 p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-gold-primary text-black text-[9px] uppercase font-bold tracking-widest px-4 py-1.5">
                        Brief Received
                      </div>
                      <h3 className="text-sm uppercase tracking-widest text-gold-primary mb-6 border-b border-white/10 pb-3">
                        Project Requirements
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6">
                        <div>
                          <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">Project Title</span>
                          <span className="text-white font-medium">{clientBrief.project_title}</span>
                        </div>
                        <div>
                          <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">Target Deadline</span>
                          <span className="text-white font-medium">{new Date(clientBrief.deadline).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">Video Length</span>
                          <span className="text-white">{clientBrief.video_length}</span>
                        </div>
                        <div>
                          <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">Editing Style</span>
                          <span className="text-white">{clientBrief.editing_style}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-2">Instructions</span>
                        <p className="text-white/90 text-sm bg-bg-body p-4 border border-white/5 whitespace-pre-wrap">{clientBrief.instructions}</p>
                      </div>
                      {clientBrief.reference_links && (
                        <div className="mt-5">
                          <span className="text-text-gray block text-[10px] uppercase tracking-wider mb-1">Reference</span>
                          <a href={clientBrief.reference_links} target="_blank" className="text-blue-400 text-xs hover:underline">{clientBrief.reference_links}</a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vault Assets */}
                  <div className="bg-bg-panel border border-white/5 p-6">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-white/10 pb-3">
                      <h3 className="text-sm uppercase tracking-widest text-gold-primary">
                        Vault Assets
                      </h3>
                      {!filesLoading && unassignedAssetCount > 0 ? (
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 border border-white/10 bg-black/20 text-text-gray">
                          {unassignedAssetCount} unlinked
                        </span>
                      ) : null}
                    </div>
                    {filesLoading ? (
                      <p className="text-center py-8 text-gold-primary text-xs uppercase tracking-widest">
                        Scanning...
                      </p>
                    ) : clientAssets.length === 0 ? (
                      <p className="text-center py-8 text-text-gray italic text-xs">
                        No assets found for this client.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {clientAssets.map((asset) => {
                          const isVideo = getMediaFileCategory(asset.fileName) === "video";
                          return (
                            <li
                              key={asset.id}
                              className="flex justify-between items-center p-4 border border-white/5 bg-bg-body hover:border-gold-primary/20 transition-all gap-4"
                            >
                              <div className="overflow-hidden">
                                <p className="text-text-white text-sm font-mono truncate max-w-[250px]">
                                  {asset.fileName}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <p className="text-text-gray text-[10px] uppercase tracking-wider">
                                    {asset.fileSize
                                      ? `${(asset.fileSize / (1024 * 1024)).toFixed(2)} MB`
                                      : "—"}
                                  </p>
                                  {!asset.agencyProjectId ? (
                                    <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 border border-white/10 bg-white/5 text-text-gray">
                                      Unlinked
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={(asset as any).agencyProjectId || ""}
                                  onChange={(e) =>
                                    handleLinkAssetToProject(asset.id, e.target.value)
                                  }
                                  title="Link to project"
                                  className="bg-bg-panel text-gold-primary text-[9px] px-2 py-1.5 border border-white/10 outline-none cursor-pointer max-w-[120px] truncate"
                                >
                                  <option value="">Unlinked</option>
                                  {clientProjectsForSelected.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                      {p.title}
                                    </option>
                                  ))}
                                </select>
                                <button onClick={() => handlePreview(asset)} className={`p-2 transition-colors ${isVideo ? "text-gold-primary hover:text-white" : "text-text-gray hover:text-white"}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                </button>
                                <button onClick={() => handleDownload(asset)} className="p-2 text-text-gray hover:text-gold-primary">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                </button>
                                <button onClick={() => handleShare(asset)} className="p-2 text-text-gray hover:text-blue-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                </button>
                                <button onClick={() => handleDelete(asset)} className="p-2 text-text-gray hover:text-red-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </section>

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
          <div className="w-full max-w-7xl lg:h-[85vh] max-h-[95vh] lg:max-h-none flex flex-col lg:flex-row gap-0 border border-white/10 bg-bg-panel shadow-2xl overflow-y-auto lg:overflow-hidden">
            <div className="flex-grow bg-black flex flex-col justify-center relative min-h-[50vh]">
              <MediaPreviewPanel
                fileName={previewFile.name}
                previewPlaybackUrl={sanitizeAbsoluteMediaUrl(
                  (previewFile.publicUrl ?? previewFile.url ?? "").trim(),
                )}
                imageClassName="max-h-[80vh] object-contain m-auto"
                videoPreview={
                  <StreamingVideoPlayer
                    key={buildPreviewPlayerKey({
                      ...previewFile,
                      isCdn: true,
                    })}
                    playbackKey={buildPreviewPlayerKey({
                      ...previewFile,
                      isCdn: true,
                    })}
                    ref={videoRef}
                    src={previewFile.publicUrl ?? previewFile.url}
                    autoPlay
                    controls
                    className="w-full max-h-full outline-none"
                    videoClassName="object-contain"
                  />
                }
              />
            </div>
            {previewFile.isVideo && (
              <div className="w-full lg:w-[400px] flex flex-col bg-bg-body shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 h-[400px] lg:h-full">
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
