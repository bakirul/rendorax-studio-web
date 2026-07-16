"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchProjectRequest,
  formatProjectRequestDate,
  getAdminStatusActions,
  getProjectRequestStatusClass,
  getProjectRequestStatusLabel,
  listProjectRequests,
  updateProjectRequestStatus,
  type ProjectRequestDetail,
  type ProjectRequestStatus,
  type ProjectRequestSummary,
} from "@/utils/projectRequests";

const STATUS_COUNTS: ProjectRequestStatus[] = [
  "submitted",
  "under_review",
  "needs_clarification",
  "approved",
  "rejected",
];

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
      approved: 0,
      rejected: 0,
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

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    setAdminNote("");
    setActionMessage(null);
    try {
      const row = await fetchProjectRequest(id);
      setDetail(row);
      setAdminNote(row.adminNote ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load detail");
    } finally {
      setDetailLoading(false);
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
      if (next === "approved") {
        setActionMessage(
          "Approved request. Project conversion will be available in the next phase.",
        );
      } else {
        setActionMessage(`Status updated to ${getProjectRequestStatusLabel(next)}.`);
      }
      await loadRequests();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Update failed");
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
                          {detail.submittedBy.displayName || detail.submittedBy.email}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${getProjectRequestStatusClass(detail.status)}`}
                      >
                        {getProjectRequestStatusLabel(detail.status)}
                      </span>
                    </div>

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
                        <p className="text-white whitespace-pre-wrap">{detail.description}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[9px] uppercase tracking-widest mb-1">
                          Deliverables
                        </p>
                        <p className="text-white whitespace-pre-wrap">{detail.deliverables}</p>
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

                    {detail.status === "approved" || detail.status === "rejected" ? (
                      <p className="text-[11px] border border-white/10 px-3 py-2 text-text-gray">
                        {detail.status === "approved"
                          ? "Approved request. Project conversion will be available in the next phase."
                          : "Rejected requests are terminal in Phase 1."}
                      </p>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-2">
                            Admin note (required for clarification / reject)
                          </label>
                          <textarea
                            rows={3}
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
                                action.status === "approved"
                                  ? "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10"
                                  : action.status === "rejected"
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
                      </>
                    )}

                    {actionMessage ? (
                      <p className="text-[11px] text-gold-primary">{actionMessage}</p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(null);
                        setDetail(null);
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
