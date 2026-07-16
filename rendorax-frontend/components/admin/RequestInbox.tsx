"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProposal,
  fetchProjectRequest,
  formatProjectRequestDate,
  formatProposalCurrency,
  getAdminStatusActions,
  getProjectRequestStatusClass,
  getProjectRequestStatusLabel,
  getProposalStatusClass,
  getProposalStatusLabel,
  listProjectRequests,
  listProposals,
  convertProjectRequest,
  sendProposal,
  updateProposalDraft,
  updateProjectRequestStatus,
  type ProjectProposal,
  type ProjectRequestDetail,
  type ProjectRequestStatus,
  type ProjectRequestSummary,
} from "@/utils/projectRequests";
import AdminOrganizationTeam from "@/components/admin/AdminOrganizationTeam";
import Link from "next/link";

const STATUS_COUNTS: ProjectRequestStatus[] = [
  "submitted",
  "under_review",
  "needs_clarification",
  "quoted",
  "approved",
  "converted_to_project",
  "rejected",
];

const emptyProposalForm = {
  estimatedCostUsd: "",
  currency: "USD",
  timelineText: "",
  deliverablesText: "",
  notes: "",
  termsText: "",
};

export default function RequestInbox() {
  const [requests, setRequests] = useState<ProjectRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProjectRequestStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [proposalForm, setProposalForm] = useState(emptyProposalForm);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listProjectRequests();
      setRequests(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const counts = useMemo(() => {
    const base: Record<ProjectRequestStatus, number> = {
      submitted: 0,
      under_review: 0,
      needs_clarification: 0,
      quoted: 0,
      approved: 0,
      rejected: 0,
      converted_to_project: 0,
    };
    for (const row of requests) {
      base[row.status] += 1;
    }
    return base;
  }, [requests]);

  const visibleRequests = useMemo(() => {
    if (!statusFilter) return requests;
    return requests.filter((row) => row.status === statusFilter);
  }, [requests, statusFilter]);

  const latestProposal = proposals[0] ?? null;
  const draftProposal = proposals.find((p) => p.status === "draft") ?? null;
  const canCreateProposal =
    detail &&
    detail.status !== "approved" &&
    detail.status !== "rejected" &&
    detail.status !== "converted_to_project" &&
    !draftProposal &&
    !proposals.some((p) => p.status === "approved");

  const loadProposals = async (requestId: string) => {
    const rows = await listProposals(requestId);
    setProposals(rows);
  };

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    setAdminNote("");
    setActionMessage(null);
    setConvertError(null);
    setProposalError(null);
    setShowProposalForm(false);
    setEditingProposalId(null);
    setProposalForm(emptyProposalForm);
    setProposals([]);
    setShowHistory(false);
    try {
      const row = await fetchProjectRequest(id);
      setDetail(row);
      setAdminNote(row.adminNote ?? "");
      await loadProposals(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!detail || detail.status !== "approved") return;
    if (
      !window.confirm(
        "Convert this approved request into a production Agency Project? This cannot be undone.",
      )
    ) {
      return;
    }

    setConvertLoading(true);
    setConvertError(null);
    setActionMessage(null);
    try {
      const result = await convertProjectRequest(detail.id);
      setDetail(result.request);
      setActionMessage(
        `Project created: ${result.project.title} (${result.project.status}).`,
      );
      await loadRequests();
    } catch (err) {
      setConvertError(
        err instanceof Error ? err.message : "Conversion failed",
      );
    } finally {
      setConvertLoading(false);
    }
  };

  const runStatusAction = async (
    next: ProjectRequestStatus,
    noteRequired: boolean,
  ) => {
    if (!detail) return;
    if (noteRequired && !adminNote.trim()) {
      setActionMessage("Admin note is required for this action.");
      return;
    }

    setActionLoading(next);
    setActionMessage(null);
    try {
      const updated = await updateProjectRequestStatus(detail.id, {
        status: next,
        adminNote: adminNote.trim() || undefined,
      });
      setDetail(updated);
      setActionMessage(
        `Status updated to ${getProjectRequestStatusLabel(next)}.`,
      );
      await loadRequests();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const openCreateForm = () => {
    setEditingProposalId(null);
    setProposalForm(emptyProposalForm);
    setProposalError(null);
    setShowProposalForm(true);
  };

  const openEditDraft = (proposal: ProjectProposal) => {
    setEditingProposalId(proposal.id);
    setProposalForm({
      estimatedCostUsd: (proposal.estimatedCostCents / 100).toString(),
      currency: proposal.currency || "USD",
      timelineText: proposal.timelineText,
      deliverablesText: proposal.deliverablesText,
      notes: proposal.notes ?? "",
      termsText: proposal.termsText ?? "",
    });
    setProposalError(null);
    setShowProposalForm(true);
  };

  const saveProposal = async () => {
    if (!detail) return;
    const usd = Number(proposalForm.estimatedCostUsd);
    if (!Number.isFinite(usd) || usd < 0) {
      setProposalError("Enter a valid estimated cost.");
      return;
    }
    if (!proposalForm.timelineText.trim() || !proposalForm.deliverablesText.trim()) {
      setProposalError("Timeline and deliverables are required.");
      return;
    }

    const cents = Math.round(usd * 100);
    const payload = {
      estimatedCostCents: cents,
      currency: proposalForm.currency.trim() || "USD",
      timelineText: proposalForm.timelineText.trim(),
      deliverablesText: proposalForm.deliverablesText.trim(),
      notes: proposalForm.notes.trim() || undefined,
      termsText: proposalForm.termsText.trim() || undefined,
    };

    setActionLoading("proposal_save");
    setProposalError(null);
    try {
      if (editingProposalId) {
        await updateProposalDraft(detail.id, editingProposalId, payload);
      } else {
        await createProposal(detail.id, payload);
      }
      setShowProposalForm(false);
      setEditingProposalId(null);
      setProposalForm(emptyProposalForm);
      setActionMessage(
        editingProposalId ? "Draft proposal updated." : "Draft proposal created.",
      );
      await loadProposals(detail.id);
    } catch (err) {
      setProposalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendProposal = async (proposalId: string) => {
    if (!detail) return;
    if (!window.confirm("Send this proposal to the client? Content becomes immutable.")) {
      return;
    }
    setActionLoading(`send_${proposalId}`);
    setActionMessage(null);
    try {
      const result = await sendProposal(detail.id, proposalId);
      setDetail(result.request);
      setActionMessage("Proposal sent. Request status is now Quoted.");
      await loadProposals(detail.id);
      await loadRequests();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Send failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <section id="admin-request-inbox">
      <div className="bg-bg-panel border border-white/5 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/10 pb-3 gap-3">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-3 text-left hover:opacity-80"
          >
            <h3 className="text-sm uppercase tracking-widest text-gold-primary">
              Request Inbox
            </h3>
            <span className="text-[10px] text-text-gray">
              {loading ? "…" : `${requests.length}`}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-text-gray transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => void loadRequests()}
            className="text-[10px] uppercase tracking-widest text-text-gray hover:text-gold-primary"
          >
            Refresh
          </button>
        </div>

        {expanded ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className={`text-[9px] uppercase tracking-widest px-2.5 py-1 border transition-colors ${
                  !statusFilter
                    ? "border-gold-primary/40 text-gold-primary bg-gold-primary/10"
                    : "border-white/10 text-text-gray hover:border-white/25"
                }`}
              >
                All
              </button>
              {STATUS_COUNTS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`text-[9px] uppercase tracking-widest px-2.5 py-1 border transition-colors ${
                    statusFilter === status
                      ? getProjectRequestStatusClass(status)
                      : "border-white/10 text-text-gray hover:border-white/25"
                  }`}
                >
                  {getProjectRequestStatusLabel(status)} ({counts[status]})
                </button>
              ))}
            </div>

            {error ? (
              <p className="text-[10px] text-red-400 mb-3 border border-red-500/20 bg-red-500/5 px-3 py-2">
                {error}
              </p>
            ) : null}

            {loading ? (
              <p className="text-center py-6 text-gold-primary text-xs uppercase tracking-widest">
                Loading requests…
              </p>
            ) : visibleRequests.length === 0 ? (
              <p className="text-center py-6 text-text-gray text-xs">
                No project requests{statusFilter ? " for this status" : ""}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-widest text-text-gray border-b border-white/10">
                      <th className="py-2 pr-3 font-normal">Request</th>
                      <th className="py-2 pr-3 font-normal">Client</th>
                      <th className="py-2 pr-3 font-normal">Type</th>
                      <th className="py-2 pr-3 font-normal">Submitted</th>
                      <th className="py-2 pr-3 font-normal">Deadline</th>
                      <th className="py-2 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRequests.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => void openDetail(row.id)}
                        className={`border-b border-white/5 cursor-pointer transition-colors ${
                          selectedId === row.id
                            ? "bg-gold-primary/5"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <td className="py-2.5 pr-3 text-white max-w-[180px] truncate">
                          {row.title}
                        </td>
                        <td className="py-2.5 pr-3 text-text-gray max-w-[140px] truncate">
                          {row.organization.name}
                        </td>
                        <td className="py-2.5 pr-3 text-text-gray">{row.projectType}</td>
                        <td className="py-2.5 pr-3 text-text-gray">
                          {formatProjectRequestDate(row.createdAt)}
                        </td>
                        <td className="py-2.5 pr-3 text-text-gray">
                          {formatProjectRequestDate(row.deadlineAt)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${getProjectRequestStatusClass(row.status)}`}
                          >
                            {getProjectRequestStatusLabel(row.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedId ? (
              <div className="mt-5 border border-white/10 bg-bg-body p-5">
                {detailLoading ? (
                  <p className="text-[10px] text-gold-primary uppercase tracking-widest">
                    Loading detail…
                  </p>
                ) : detail ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-white text-sm mb-1">{detail.title}</h4>
                        <p className="text-[10px] text-text-gray">
                          {detail.organization.name} ·{" "}
                          {detail.submittedBy.displayName ||
                            detail.submittedBy.email}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${getProjectRequestStatusClass(detail.status)}`}
                      >
                        {getProjectRequestStatusLabel(detail.status)}
                      </span>
                    </div>

                    <AdminOrganizationTeam
                      organizationId={detail.organizationId}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-gray">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest mb-1">Type</p>
                        <p className="text-white">{detail.projectType}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest mb-1">Deadline</p>
                        <p className="text-white">
                          {formatProjectRequestDate(detail.deadlineAt)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[9px] uppercase tracking-widest mb-1">Brief</p>
                        <p className="text-white whitespace-pre-wrap">
                          {detail.description}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[9px] uppercase tracking-widest mb-1">
                          Deliverables
                        </p>
                        <p className="text-white whitespace-pre-wrap">
                          {detail.deliverables}
                        </p>
                      </div>
                      {detail.referenceLinks ? (
                        <div className="md:col-span-2">
                          <p className="text-[9px] uppercase tracking-widest mb-1">
                            References
                          </p>
                          <p className="text-white whitespace-pre-wrap">
                            {detail.referenceLinks}
                          </p>
                        </div>
                      ) : null}
                      {detail.budgetRange ? (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest mb-1">
                            Budget range
                          </p>
                          <p className="text-white">{detail.budgetRange}</p>
                        </div>
                      ) : null}
                    </div>

                    {detail.status === "approved" ? (
                      <div className="space-y-2 border border-emerald-400/20 bg-emerald-400/5 px-3 py-3">
                        <p className="text-[11px] text-emerald-400/90">
                          Client approved the proposal. Convert to create the
                          production Agency Project.
                        </p>
                        {convertError ? (
                          <p className="text-[10px] text-red-400">
                            {convertError}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          disabled={convertLoading}
                          onClick={() => void handleConvert()}
                          className="bg-gold-primary text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 disabled:opacity-50"
                        >
                          {convertLoading
                            ? "Converting…"
                            : "Convert To Project"}
                        </button>
                      </div>
                    ) : detail.status === "converted_to_project" ? (
                      <div className="space-y-2 border border-emerald-400/30 bg-emerald-400/10 px-3 py-3">
                        <p className="text-[11px] text-emerald-300 font-medium">
                          ✓ Project Created
                        </p>
                        <p className="text-sm text-white">
                          {detail.convertedAgencyProject?.title || detail.title}
                        </p>
                        <p className="text-[10px] text-text-gray uppercase tracking-widest">
                          Current phase:{" "}
                          <span className="text-white normal-case tracking-normal">
                            {detail.convertedAgencyProject?.status || "—"}
                          </span>
                        </p>
                        {detail.convertedAgencyProjectId ? (
                          <Link
                            href="/admin"
                            className="inline-block text-[10px] uppercase tracking-widest text-gold-primary hover:text-white"
                          >
                            Open Project →
                          </Link>
                        ) : null}
                      </div>
                    ) : detail.status === "rejected" ? (
                      <p className="text-[11px] border border-white/10 px-3 py-2 text-text-gray">
                        Rejected requests are terminal.
                      </p>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-2">
                            Admin note (required for clarification / reject)
                          </label>
                          <textarea
                            rows={2}
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            className="w-full bg-bg-panel border border-white/10 p-2.5 text-sm text-white outline-none focus:border-gold-primary resize-y"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getAdminStatusActions(detail.status).map((action) => (
                            <button
                              key={action.status}
                              type="button"
                              disabled={actionLoading !== null}
                              onClick={() =>
                                void runStatusAction(
                                  action.status,
                                  action.noteRequired,
                                )
                              }
                              className={`text-[10px] uppercase tracking-widest px-3 py-2 border transition-colors disabled:opacity-50 ${
                                action.status === "rejected"
                                  ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                                  : action.status === "needs_clarification"
                                    ? "border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
                                    : "border-gold-primary/40 text-gold-primary hover:bg-gold-primary/10"
                              }`}
                            >
                              {actionLoading === action.status
                                ? "Saving…"
                                : action.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-text-gray">
                          Request approval comes from the Client accepting a
                          Proposal — there is no direct Approve action.
                        </p>
                      </>
                    )}

                    {/* Proposal section */}
                    <div className="border border-white/10 bg-bg-panel p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-[10px] uppercase tracking-widest text-gold-primary">
                          Proposal
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {proposals.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => setShowHistory((v) => !v)}
                              className="text-[9px] uppercase tracking-widest text-text-gray border border-white/10 px-2 py-1 hover:text-white"
                            >
                              {showHistory ? "Hide History" : "View History"}
                            </button>
                          ) : null}
                          {canCreateProposal ? (
                            <button
                              type="button"
                              onClick={openCreateForm}
                              className="text-[9px] uppercase tracking-widest text-gold-primary border border-gold-primary/30 px-2 py-1 hover:bg-gold-primary/10"
                            >
                              {proposals.some((p) => p.status === "changes_requested")
                                ? "Create Revision"
                                : "Create Proposal"}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {latestProposal ? (
                        <div className="space-y-2 text-sm text-text-gray">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-white">
                              Proposal V{latestProposal.version}
                            </span>
                            <span
                              className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${getProposalStatusClass(latestProposal.status)}`}
                            >
                              {getProposalStatusLabel(latestProposal.status)}
                            </span>
                            {latestProposal.sentAt ? (
                              <span className="text-[10px]">
                                Sent {formatProjectRequestDate(latestProposal.sentAt)}
                              </span>
                            ) : null}
                          </div>
                          <p>
                            <span className="text-[9px] uppercase tracking-widest block mb-0.5">
                              Estimated cost
                            </span>
                            <span className="text-white">
                              {formatProposalCurrency(
                                latestProposal.estimatedCostCents,
                                latestProposal.currency,
                              )}
                            </span>
                          </p>
                          <p>
                            <span className="text-[9px] uppercase tracking-widest block mb-0.5">
                              Timeline
                            </span>
                            <span className="text-white whitespace-pre-wrap">
                              {latestProposal.timelineText}
                            </span>
                          </p>
                          <p>
                            <span className="text-[9px] uppercase tracking-widest block mb-0.5">
                              Deliverables
                            </span>
                            <span className="text-white whitespace-pre-wrap">
                              {latestProposal.deliverablesText}
                            </span>
                          </p>
                          {latestProposal.notes ? (
                            <p>
                              <span className="text-[9px] uppercase tracking-widest block mb-0.5">
                                Notes
                              </span>
                              <span className="text-white whitespace-pre-wrap">
                                {latestProposal.notes}
                              </span>
                            </p>
                          ) : null}
                          {latestProposal.termsText ? (
                            <p>
                              <span className="text-[9px] uppercase tracking-widest block mb-0.5">
                                Terms
                              </span>
                              <span className="text-white whitespace-pre-wrap">
                                {latestProposal.termsText}
                              </span>
                            </p>
                          ) : null}

                          {latestProposal.status === "draft" ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => openEditDraft(latestProposal)}
                                disabled={actionLoading !== null}
                                className="text-[10px] uppercase tracking-widest px-3 py-2 border border-white/15 text-text-gray hover:text-white disabled:opacity-50"
                              >
                                Edit Draft
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleSendProposal(latestProposal.id)
                                }
                                disabled={actionLoading !== null}
                                className="text-[10px] uppercase tracking-widest px-3 py-2 border border-gold-primary/40 text-gold-primary hover:bg-gold-primary/10 disabled:opacity-50"
                              >
                                {actionLoading === `send_${latestProposal.id}`
                                  ? "Sending…"
                                  : "Send Proposal"}
                              </button>
                            </div>
                          ) : latestProposal.status === "sent" ? (
                            <p className="text-[10px] text-violet-300">
                              Sent and locked. Waiting for client response.
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-[11px] text-text-gray">
                          No proposal yet. Create one after reviewing the brief.
                        </p>
                      )}

                      {showHistory && proposals.length > 1 ? (
                        <ul className="border-t border-white/5 pt-3 space-y-2">
                          {proposals.map((p) => (
                            <li
                              key={p.id}
                              className="flex flex-wrap items-center gap-2 text-[11px] text-text-gray"
                            >
                              <span className="text-white">V{p.version}</span>
                              <span
                                className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 border ${getProposalStatusClass(p.status)}`}
                              >
                                {getProposalStatusLabel(p.status)}
                              </span>
                              <span>
                                {formatProposalCurrency(
                                  p.estimatedCostCents,
                                  p.currency,
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {showProposalForm ? (
                        <div className="border border-white/10 bg-bg-body p-4 space-y-3">
                          <p className="text-[10px] uppercase tracking-widest text-gold-primary">
                            {editingProposalId
                              ? "Edit Draft Proposal"
                              : "Create Proposal"}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1">
                                Estimated Cost (USD)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={proposalForm.estimatedCostUsd}
                                onChange={(e) =>
                                  setProposalForm({
                                    ...proposalForm,
                                    estimatedCostUsd: e.target.value,
                                  })
                                }
                                className="w-full bg-bg-panel border border-white/10 p-2 text-sm text-white outline-none focus:border-gold-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1">
                                Currency
                              </label>
                              <input
                                value={proposalForm.currency}
                                onChange={(e) =>
                                  setProposalForm({
                                    ...proposalForm,
                                    currency: e.target.value,
                                  })
                                }
                                className="w-full bg-bg-panel border border-white/10 p-2 text-sm text-white outline-none focus:border-gold-primary"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1">
                                Timeline
                              </label>
                              <textarea
                                rows={2}
                                value={proposalForm.timelineText}
                                onChange={(e) =>
                                  setProposalForm({
                                    ...proposalForm,
                                    timelineText: e.target.value,
                                  })
                                }
                                className="w-full bg-bg-panel border border-white/10 p-2 text-sm text-white outline-none focus:border-gold-primary resize-y"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1">
                                Deliverables
                              </label>
                              <textarea
                                rows={3}
                                value={proposalForm.deliverablesText}
                                onChange={(e) =>
                                  setProposalForm({
                                    ...proposalForm,
                                    deliverablesText: e.target.value,
                                  })
                                }
                                className="w-full bg-bg-panel border border-white/10 p-2 text-sm text-white outline-none focus:border-gold-primary resize-y"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1">
                                Notes
                              </label>
                              <textarea
                                rows={2}
                                value={proposalForm.notes}
                                onChange={(e) =>
                                  setProposalForm({
                                    ...proposalForm,
                                    notes: e.target.value,
                                  })
                                }
                                className="w-full bg-bg-panel border border-white/10 p-2 text-sm text-white outline-none focus:border-gold-primary resize-y"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1">
                                Terms
                              </label>
                              <textarea
                                rows={2}
                                value={proposalForm.termsText}
                                onChange={(e) =>
                                  setProposalForm({
                                    ...proposalForm,
                                    termsText: e.target.value,
                                  })
                                }
                                className="w-full bg-bg-panel border border-white/10 p-2 text-sm text-white outline-none focus:border-gold-primary resize-y"
                              />
                            </div>
                          </div>
                          {proposalError ? (
                            <p className="text-[10px] text-red-400">{proposalError}</p>
                          ) : null}
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setShowProposalForm(false);
                                setEditingProposalId(null);
                              }}
                              className="text-[10px] uppercase tracking-widest px-3 py-2 border border-white/10 text-text-gray"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === "proposal_save"}
                              onClick={() => void saveProposal()}
                              className="text-[10px] uppercase tracking-widest px-3 py-2 bg-gold-primary text-black font-bold disabled:opacity-50"
                            >
                              {actionLoading === "proposal_save"
                                ? "Saving…"
                                : "Save Draft"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {actionMessage ? (
                      <p className="text-[11px] text-gold-primary">{actionMessage}</p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(null);
                        setDetail(null);
                        setProposals([]);
                      }}
                      className="text-[9px] uppercase tracking-widest text-text-gray hover:text-white"
                    >
                      Close detail
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
