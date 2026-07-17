"use client";

import { useCallback, useEffect, useState } from "react";
import OrgInviteForm from "@/components/dashboard/OrgInviteForm";
import { fetchClientOrganization } from "@/utils/clientOrganization";

export type LiveTeamMemberRole = "editor" | "client" | "reviewer" | "approver";

export type LiveTeamMemberStatus = "viewing" | "presenting" | "in_call";

export type LiveTeamMember = {
  id: string;
  displayName: string;
  role: LiveTeamMemberRole;
  status: LiveTeamMemberStatus;
};

type LiveTeamMembersProps = {
  members?: LiveTeamMember[];
  isLive?: boolean;
  /** When false, skips org capability fetch (e.g. editor workspace). */
  enableInvite?: boolean;
};

const ROLE_LABELS: Record<LiveTeamMemberRole, string> = {
  editor: "Editor",
  client: "Client",
  reviewer: "Reviewer",
  approver: "Approver",
};

const STATUS_LABELS: Record<LiveTeamMemberStatus, string> = {
  viewing: "Viewing",
  presenting: "Presenting",
  in_call: "In Call",
};

function roleBadgeClass(role: LiveTeamMemberRole): string {
  switch (role) {
    case "editor":
      return "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]";
    case "client":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "reviewer":
      return "border-sky-400/30 bg-sky-400/10 text-sky-300";
    case "approver":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }
}

function statusBadgeClass(status: LiveTeamMemberStatus): string {
  switch (status) {
    case "presenting":
      return "text-amber-300";
    case "in_call":
      return "text-emerald-300";
    default:
      return "text-zinc-400";
  }
}

export default function LiveTeamMembers({
  members = [],
  isLive = false,
  enableInvite = true,
}: LiveTeamMembersProps) {
  const [canInvite, setCanInvite] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const loadCapabilities = useCallback(async () => {
    if (!enableInvite) {
      setCanInvite(false);
      return;
    }
    try {
      const org = await fetchClientOrganization();
      setCanInvite(Boolean(org.currentMember?.capabilities.manageMembers));
    } catch {
      setCanInvite(false);
    }
  }, [enableInvite]);

  useEffect(() => {
    void loadCapabilities();
  }, [loadCapabilities]);

  const inviteButton = canInvite ? (
    <button
      type="button"
      onClick={() => setInviteOpen((open) => !open)}
      className="rounded border border-[#d4af37]/35 bg-[#d4af37]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#d4af37] transition-colors hover:bg-[#d4af37]/20"
    >
      {inviteOpen ? "Close Invite" : "Invite Team Member"}
    </button>
  ) : null;

  return (
    <section className="shrink-0 border-b border-white/5 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-300">
          Live Team Members
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-gray-500">
            {isLive ? "Session active" : "Awaiting session"}
          </span>
          {/* Desktop / default: header action */}
          <div className="hidden sm:block">{inviteButton}</div>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="text-[11px] leading-relaxed text-gray-500">
          Participant presence will appear here when realtime room data is
          available. No users are shown until connected.
        </p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-white/5 bg-[#0c0c12] px-2.5 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-xs text-gray-200">
                {member.displayName}
              </span>
              <span
                className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${roleBadgeClass(member.role)}`}
              >
                {ROLE_LABELS[member.role]}
              </span>
              <span
                className={`text-[9px] uppercase tracking-wider ${statusBadgeClass(member.status)}`}
              >
                {STATUS_LABELS[member.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Mobile: full-width secondary action below list */}
      {canInvite ? (
        <div className="mt-3 sm:hidden">
          <button
            type="button"
            onClick={() => setInviteOpen((open) => !open)}
            className="w-full rounded border border-[#d4af37]/35 bg-[#d4af37]/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#d4af37] transition-colors hover:bg-[#d4af37]/20"
          >
            {inviteOpen ? "Close Invite" : "Invite Team Member"}
          </button>
        </div>
      ) : null}

      {inviteOpen && canInvite ? (
        <div className="mt-3 rounded-md border border-white/10 bg-[#0c0c12] p-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-gray-500">
            Organization invitation
          </p>
          <OrgInviteForm
            compact
            onInvited={() => {
              void loadCapabilities();
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
