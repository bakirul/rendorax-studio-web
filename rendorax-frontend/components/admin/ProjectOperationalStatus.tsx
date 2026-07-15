"use client";

import type {
  AssignedTeamSummary,
  ProjectOperationalStatusKind,
  ProjectOperationalStatusResult,
} from "@/utils/projectOperationalStatus";

interface ProjectOperationalStatusProps {
  result: ProjectOperationalStatusResult | null;
  assignment?: AssignedTeamSummary | null;
  loading?: boolean;
}

function badgeClass(status: ProjectOperationalStatusKind): string {
  switch (status) {
    case "blocked":
      return "text-red-400/90";
    case "overdue":
      return "text-amber-400";
    case "waiting_on_editor":
      return "text-gold-primary";
    case "waiting_on_client":
      return "text-sky-300/90";
    case "waiting_on_delivery":
      return "text-sky-300/90";
    case "delivered":
      return "text-emerald-400";
    case "healthy":
      return "text-emerald-400/90";
    default:
      return "text-text-gray";
  }
}

export default function ProjectOperationalStatus({
  result,
  assignment,
  loading = false,
}: ProjectOperationalStatusProps) {
  if (loading && !result) {
    return (
      <div className="border-t border-white/5 px-4 py-2 bg-black/5">
        <p className="text-[10px] uppercase tracking-widest text-text-gray/70">
          Resolving status…
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="border-t border-white/5 px-4 py-2 bg-black/5 min-w-0">
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${badgeClass(result.status)}`}
      >
        {result.label}
      </p>
      <p
        className="mt-0.5 text-[11px] text-text-gray truncate"
        title={result.reason}
      >
        {result.reason}
      </p>
      {assignment ? (
        <p
          className="mt-0.5 text-[10px] text-text-gray/80 truncate"
          title={assignment.label}
        >
          {assignment.label}
        </p>
      ) : null}
    </div>
  );
}
