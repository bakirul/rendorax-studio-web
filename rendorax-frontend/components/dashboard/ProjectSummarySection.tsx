"use client";

type ClientProjectOption = {
  id: string;
  title: string;
  status?: string | null;
};

type ProjectSummarySectionProps = {
  isEditor: boolean;
  clientProjectsLoading?: boolean;
  clientProjectsError?: string | null;
  clientProjects?: ClientProjectOption[];
  activeProjectId?: string;
  onActiveProjectChange?: (projectId: string) => void;
  onRetryClientProjects?: () => void;
  availableProjects?: ClientProjectOption[];
  assetViewScope?: "all" | "active";
  onAssetViewScopeChange?: (scope: "all" | "active") => void;
};

export default function ProjectSummarySection({
  isEditor,
  clientProjectsLoading = false,
  clientProjectsError = null,
  clientProjects = [],
  activeProjectId = "",
  onActiveProjectChange,
  onRetryClientProjects,
  availableProjects = [],
  assetViewScope = "all",
  onAssetViewScopeChange,
}: ProjectSummarySectionProps) {
  return (
    <section className="border-b border-white/[0.04] py-2 last:border-b-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d4af37]">
          Project Summary
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
            isEditor
              ? "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]"
              : "border-blue-400/40 bg-blue-400/10 text-blue-300"
          }`}
        >
          {isEditor ? "Production" : "Review"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-gray-400">
        <span className="text-gray-500">
          {isEditor
            ? "Assigned tasks, uploads, and review tools for the active project."
            : "Preview assets, leave feedback, and approve or request revision."}
        </span>

        {!isEditor ? (
          <div className="flex flex-wrap items-center gap-2">
            {clientProjectsLoading ? (
              <span className="uppercase tracking-widest text-gray-500">
                Loading projects…
              </span>
            ) : clientProjectsError ? (
              <>
                <span className="border border-red-500/20 bg-red-500/5 px-2 py-1 text-red-400">
                  {clientProjectsError}
                </span>
                {onRetryClientProjects ? (
                  <button
                    type="button"
                    onClick={() => void onRetryClientProjects()}
                    className="uppercase tracking-widest text-blue-300 hover:text-blue-200"
                  >
                    Retry
                  </button>
                ) : null}
              </>
            ) : clientProjects.length === 0 ? (
              <span className="max-w-md italic text-gray-500">
                Upload materials in Client Vault. Your team links them to a
                project later.
              </span>
            ) : clientProjects.length === 1 ? (
              <>
                <span className="uppercase tracking-widest text-gray-500">
                  Project
                </span>
                <span className="font-medium text-blue-300">
                  {clientProjects[0].title}
                </span>
                {clientProjects[0].status ? (
                  <span className="uppercase tracking-widest text-gray-500">
                    {clientProjects[0].status}
                  </span>
                ) : null}
              </>
            ) : (
              <>
                <span className="uppercase tracking-widest text-gray-500">
                  Project
                </span>
                <select
                  value={activeProjectId}
                  onChange={(e) => onActiveProjectChange?.(e.target.value)}
                  className="max-w-[200px] cursor-pointer truncate border border-white/10 bg-[#121217] px-2 py-1 text-blue-300 outline-none"
                  title="Select a project to review"
                >
                  <option value="">Select project…</option>
                  {clientProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                      {p.status ? ` (${p.status})` : ""}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {availableProjects.length > 0 ? (
              <>
                <span className="uppercase tracking-widest text-gray-500">
                  Active Project
                </span>
                <select
                  value={activeProjectId}
                  onChange={(e) => onActiveProjectChange?.(e.target.value)}
                  className="max-w-[200px] cursor-pointer truncate border border-white/10 bg-[#121217] px-2 py-1 text-[#d4af37] outline-none"
                  title="Uploads link to this project"
                >
                  <option value="">No project (unlinked)</option>
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <div className="flex border border-white/10">
                  <button
                    type="button"
                    onClick={() => onAssetViewScopeChange?.("all")}
                    className={`px-2 py-1 uppercase tracking-widest transition-colors ${
                      assetViewScope === "all"
                        ? "bg-[#d4af37]/20 text-[#d4af37]"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    My Uploads
                  </button>
                  <button
                    type="button"
                    onClick={() => onAssetViewScopeChange?.("active")}
                    disabled={!activeProjectId}
                    className={`px-2 py-1 uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      assetViewScope === "active"
                        ? "bg-[#d4af37]/20 text-[#d4af37]"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Project Assets
                  </button>
                </div>
              </>
            ) : (
              <span className="text-gray-500">No assigned projects yet.</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
