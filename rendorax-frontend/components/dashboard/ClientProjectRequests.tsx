"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchProjectRequest,
  formatProjectRequestDate,
  getProjectRequestStatusClass,
  getProjectRequestStatusLabel,
  listProjectRequests,
  PROJECT_REQUEST_TYPES,
  submitProjectRequest,
  type ProjectRequestDetail,
  type ProjectRequestSummary,
} from "@/utils/projectRequests";

const emptyForm = {
  title: "",
  projectType: "Commercial",
  description: "",
  deliverables: "",
  deadlineAt: "",
  referenceLinks: "",
  budgetRange: "",
};

const fieldClass =
  "w-full bg-[#0a0a0f] border border-white/10 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20 disabled:opacity-50";

const labelClass =
  "block text-[9px] uppercase tracking-widest text-gray-500 mb-1";

const helperClass = "mt-1 text-[10px] text-gray-600 leading-snug";

export default function ClientProjectRequests() {
  const [requests, setRequests] = useState<ProjectRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listProjectRequests();
      setRequests(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const closeForm = () => {
    setShowForm(false);
    setFormError(null);
  };

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const row = await fetchProjectRequest(id);
      setDetail(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!form.title.trim() || !form.description.trim() || !form.deliverables.trim()) {
      setFormError("Title, description, and deliverables are required.");
      return;
    }

    setSubmitting(true);
    try {
      await submitProjectRequest({
        title: form.title.trim(),
        projectType: form.projectType,
        description: form.description.trim(),
        deliverables: form.deliverables.trim(),
        referenceLinks: form.referenceLinks.trim() || undefined,
        deadlineAt: form.deadlineAt.trim()
          ? new Date(form.deadlineAt).toISOString()
          : undefined,
        budgetRange: form.budgetRange.trim() || undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      setSuccessMessage("Project request submitted.");
      await loadRequests();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shrink-0 bg-[#0a0a0f] border-b border-white/5 relative z-10">
      <div className="w-full flex items-center justify-between px-6 py-2 gap-4">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity min-w-0"
        >
          <span className="text-[10px] uppercase tracking-widest text-[#d4af37] shrink-0">
            Project Requests
          </span>
          <span className="text-[10px] text-gray-500 shrink-0">
            {loading
              ? "Loading..."
              : `${requests.length} request${requests.length === 1 ? "" : "s"}`}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-gray-500 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {!showForm ? (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setFormError(null);
              setSuccessMessage(null);
              setExpanded(true);
            }}
            className="text-[9px] uppercase tracking-widest text-[#d4af37] border border-[#d4af37]/30 px-2.5 py-1 hover:bg-[#d4af37]/10 transition-colors shrink-0"
          >
            New Project Request
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="px-4 sm:px-6 pb-4 space-y-3">
          {successMessage ? (
            <p className="max-w-5xl mx-auto text-[10px] text-emerald-400 border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
              {successMessage}
            </p>
          ) : null}
          {error ? (
            <div className="max-w-5xl mx-auto flex items-center gap-2">
              <p className="text-[10px] text-red-400 border border-red-500/20 bg-red-500/5 px-3 py-2">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadRequests()}
                className="text-[9px] uppercase tracking-widest text-[#d4af37]"
              >
                Retry
              </button>
            </div>
          ) : null}

          {showForm ? (
            <form
              onSubmit={handleSubmit}
              className="max-w-5xl mx-auto w-full border border-white/10 bg-[#121217] relative"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[#d4af37]/50" />

              <div className="flex items-start justify-between gap-4 px-4 sm:px-5 pt-4 pb-3 border-b border-white/5">
                <div className="min-w-0">
                  <h3 className="text-sm text-white font-medium tracking-wide">
                    New Project Request
                  </h3>
                  <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed max-w-2xl">
                    Share your brief, expected deliverables, references and
                    deadline. Rendorax will review the request before a
                    production project is created.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 px-2.5 py-1 hover:text-white hover:border-white/25 transition-colors shrink-0 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <div className="px-4 sm:px-5 py-4">
                <p className="mb-4 text-[10px] text-gray-500 border border-white/5 bg-[#0a0a0f] px-3 py-2 leading-relaxed">
                  Submitting this brief does not create a production project.
                  Rendorax will review it and update the request status.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label htmlFor="pr-title" className={labelClass}>
                      Project Title *
                    </label>
                    <input
                      id="pr-title"
                      required
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      disabled={submitting}
                      className={fieldClass}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label htmlFor="pr-type" className={labelClass}>
                      Project Type *
                    </label>
                    <select
                      id="pr-type"
                      value={form.projectType}
                      onChange={(e) =>
                        setForm({ ...form, projectType: e.target.value })
                      }
                      disabled={submitting}
                      className={fieldClass}
                    >
                      {PROJECT_REQUEST_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="pr-description" className={labelClass}>
                      Description / Brief *
                    </label>
                    <textarea
                      id="pr-description"
                      required
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      disabled={submitting}
                      className={`${fieldClass} resize-y min-h-[5.5rem] max-h-48`}
                    />
                    <p className={helperClass}>
                      Goals, audience, scope and requirements
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="pr-deliverables" className={labelClass}>
                      Deliverables *
                    </label>
                    <textarea
                      id="pr-deliverables"
                      required
                      rows={3}
                      value={form.deliverables}
                      onChange={(e) =>
                        setForm({ ...form, deliverables: e.target.value })
                      }
                      disabled={submitting}
                      className={`${fieldClass} resize-y min-h-[4.5rem] max-h-40`}
                    />
                    <p className={helperClass}>
                      Expected outputs, duration, format or quantity
                    </p>
                  </div>

                  <div>
                    <label htmlFor="pr-deadline" className={labelClass}>
                      Deadline
                    </label>
                    <input
                      id="pr-deadline"
                      type="date"
                      value={form.deadlineAt}
                      onChange={(e) =>
                        setForm({ ...form, deadlineAt: e.target.value })
                      }
                      disabled={submitting}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="pr-budget" className={labelClass}>
                      Budget Range (Optional)
                    </label>
                    <input
                      id="pr-budget"
                      value={form.budgetRange}
                      onChange={(e) =>
                        setForm({ ...form, budgetRange: e.target.value })
                      }
                      disabled={submitting}
                      placeholder="e.g. $5k–$10k"
                      className={fieldClass}
                      autoComplete="off"
                    />
                    <p className={helperClass}>
                      Indicative range; final quote comes later
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="pr-references" className={labelClass}>
                      Reference Links (Optional)
                    </label>
                    <textarea
                      id="pr-references"
                      rows={2}
                      value={form.referenceLinks}
                      onChange={(e) =>
                        setForm({ ...form, referenceLinks: e.target.value })
                      }
                      disabled={submitting}
                      className={`${fieldClass} resize-y min-h-[3.5rem] max-h-32`}
                    />
                    <p className={helperClass}>
                      One URL per line or comma-separated
                    </p>
                  </div>
                </div>

                {formError ? (
                  <p
                    role="alert"
                    className="mt-3 text-[10px] text-red-400 border border-red-500/20 bg-red-500/5 px-3 py-2"
                  >
                    {formError}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-4 sm:px-5 py-3 border-t border-white/5 bg-[#0a0a0f]/60">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="text-[10px] uppercase tracking-widest text-gray-400 border border-white/10 px-4 py-2.5 hover:text-white hover:border-white/25 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#d4af37] text-black text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 hover:bg-white transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          ) : null}

          {loading ? (
            <p className="max-w-5xl mx-auto text-[10px] text-gray-500 uppercase tracking-widest py-1">
              Loading requests…
            </p>
          ) : requests.length === 0 ? (
            !showForm ? (
              <div className="max-w-5xl mx-auto border border-dashed border-white/10 px-4 py-3 text-center">
                <p className="text-[12px] text-gray-400 mb-0.5">
                  No project requests yet.
                </p>
                <p className="text-[10px] text-gray-500">
                  Submit a request with your brief, deliverables, deadline, and
                  references.
                </p>
              </div>
            ) : null
          ) : (
            <ul className="max-w-5xl mx-auto space-y-2">
              {requests.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => void openDetail(row.id)}
                    className={`w-full text-left border px-3 py-2.5 transition-colors ${
                      selectedId === row.id
                        ? "border-[#d4af37]/40 bg-[#d4af37]/5"
                        : "border-white/5 bg-[#121217] hover:border-white/15"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-white truncate">
                        {row.title}
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${getProjectRequestStatusClass(row.status)}`}
                      >
                        {getProjectRequestStatusLabel(row.status)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500">
                      <span>{row.projectType}</span>
                      <span>
                        Submitted {formatProjectRequestDate(row.createdAt)}
                      </span>
                      <span>
                        Deadline {formatProjectRequestDate(row.deadlineAt)}
                      </span>
                      <span>
                        Updated {formatProjectRequestDate(row.updatedAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedId ? (
            <div className="max-w-5xl mx-auto border border-white/10 bg-[#121217] p-4">
              {detailLoading ? (
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  Loading detail…
                </p>
              ) : detail ? (
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-white font-medium">{detail.title}</h3>
                    <span
                      className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${getProjectRequestStatusClass(detail.status)}`}
                    >
                      {getProjectRequestStatusLabel(detail.status)}
                    </span>
                  </div>
                  {detail.status === "needs_clarification" && detail.adminNote ? (
                    <div className="border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                      <p className="text-[9px] uppercase tracking-widest text-amber-300 mb-1">
                        Admin note — clarification needed
                      </p>
                      <p className="text-amber-100/90 whitespace-pre-wrap">
                        {detail.adminNote}
                      </p>
                    </div>
                  ) : null}
                  {detail.status === "approved" ? (
                    <p className="text-[11px] text-emerald-400/90 border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
                      Approved request. Project conversion will be available in
                      the next phase.
                    </p>
                  ) : null}
                  <p>
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">
                      Type
                    </span>
                    {detail.projectType}
                  </p>
                  <p>
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">
                      Brief
                    </span>
                    <span className="whitespace-pre-wrap">
                      {detail.description}
                    </span>
                  </p>
                  <p>
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">
                      Deliverables
                    </span>
                    <span className="whitespace-pre-wrap">
                      {detail.deliverables}
                    </span>
                  </p>
                  {detail.referenceLinks ? (
                    <p>
                      <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">
                        References
                      </span>
                      <span className="whitespace-pre-wrap">
                        {detail.referenceLinks}
                      </span>
                    </p>
                  ) : null}
                  {detail.budgetRange ? (
                    <p>
                      <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">
                        Budget range
                      </span>
                      {detail.budgetRange}
                    </p>
                  ) : null}
                  {detail.adminNote &&
                  detail.status !== "needs_clarification" ? (
                    <p>
                      <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">
                        Admin note
                      </span>
                      <span className="whitespace-pre-wrap">
                        {detail.adminNote}
                      </span>
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      setDetail(null);
                    }}
                    className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-white"
                  >
                    Close detail
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
