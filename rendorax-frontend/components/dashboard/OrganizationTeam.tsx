"use client";

import { useCallback, useEffect, useState } from "react";
import OrgInviteForm from "@/components/dashboard/OrgInviteForm";
import {
  fetchClientOrganization,
  getOrgRoleLabel,
  INVITABLE_ROLES,
  removeOrgMember,
  resendOrgInvitation,
  revokeOrgInvitation,
  updateOrgMemberRole,
  type ClientOrganizationResponse,
  type ClientOrganizationRole,
} from "@/utils/clientOrganization";

export default function OrganizationTeam({ embedded = false }: { embedded?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<ClientOrganizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await fetchClientOrganization();
      setData(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const canManage = Boolean(data?.currentMember?.capabilities.manageMembers);

  return (
    <div
      className={
        embedded
          ? "border-b border-white/[0.04] py-1 last:border-b-0"
          : "relative z-10 shrink-0 border-b border-white/5 bg-[#0a0a0f]"
      }
    >
      <div
        className={`flex w-full items-center justify-between gap-4 ${embedded ? "px-0 py-1" : "px-6 py-2"}`}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 text-left hover:opacity-80 min-w-0"
        >
          <span className="text-[10px] uppercase tracking-widest text-[#d4af37] shrink-0">
            Organization Team
          </span>
          <span className="text-[10px] text-gray-500 truncate">
            {loading
              ? "Loading…"
              : data
                ? `${data.organization.name} · ${getOrgRoleLabel(data.currentMember?.role || "observer")}`
                : "—"}
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
      </div>

      {expanded ? (
        <div
          className={`w-full space-y-3 ${embedded ? "pb-2 pt-1" : "mx-auto max-w-5xl px-4 pb-4 sm:px-6"}`}
        >
          {error ? (
            <p className="text-[10px] text-red-400 border border-red-500/20 px-3 py-2">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-[10px] text-gold-primary border border-gold-primary/20 px-3 py-2">
              {message}
            </p>
          ) : null}
          {inviteUrl ? (
            <div className="border border-white/10 bg-[#121217] px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">
                Invite link
              </p>
              <p className="text-[11px] text-white break-all select-all">
                {inviteUrl}
              </p>
            </div>
          ) : null}

          {canManage ? (
            <OrgInviteForm
              onInvited={() => {
                void load();
              }}
            />
          ) : null}

          <div className="border border-white/5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-gray-500 border-b border-white/10">
                  <th className="py-2 px-3 font-normal">Member</th>
                  <th className="py-2 px-3 font-normal">Role</th>
                  <th className="py-2 px-3 font-normal">Status</th>
                  {canManage ? (
                    <th className="py-2 px-3 font-normal">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {(data?.members || []).map((m) => (
                  <tr key={m.id} className="border-b border-white/5">
                    <td className="py-2 px-3 text-white">
                      {m.displayName || m.email}
                      <span className="block text-[10px] text-gray-500">
                        {m.email}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-400">
                      {canManage &&
                      m.role !== "primary_contact" &&
                      m.status === "active" ? (
                        <select
                          value={m.role}
                          onChange={(e) => {
                            void updateOrgMemberRole(
                              m.id,
                              e.target.value as ClientOrganizationRole,
                            ).then(load);
                          }}
                          className="bg-[#0a0a0f] border border-white/10 text-[11px] text-white p-1"
                        >
                          {INVITABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {getOrgRoleLabel(r)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        getOrgRoleLabel(m.role)
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-500 uppercase text-[10px]">
                      {m.status}
                    </td>
                    {canManage ? (
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-2">
                          {m.status === "invited" ? (
                            <>
                              <button
                                type="button"
                                className="text-[9px] uppercase tracking-widest text-[#d4af37]"
                                onClick={() => {
                                  void resendOrgInvitation(
                                    data!.invitations.find(
                                      (i) => i.email === m.email,
                                    )?.id || "",
                                  )
                                    .then((r) => {
                                      setInviteUrl(r.inviteUrl);
                                      setMessage(
                                        r.emailSent
                                          ? "Invitation resent."
                                          : "New invite link ready — email not sent.",
                                      );
                                      return load();
                                    })
                                    .catch((err) =>
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Resend failed",
                                      ),
                                    );
                                }}
                              >
                                Resend
                              </button>
                              <button
                                type="button"
                                className="text-[9px] uppercase tracking-widest text-red-400"
                                onClick={() => {
                                  const inv = data!.invitations.find(
                                    (i) => i.email === m.email,
                                  );
                                  if (!inv) return;
                                  void revokeOrgInvitation(inv.id)
                                    .then(load)
                                    .catch((err) =>
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Revoke failed",
                                      ),
                                    );
                                }}
                              >
                                Revoke
                              </button>
                            </>
                          ) : null}
                          {m.status === "active" &&
                          m.role !== "primary_contact" ? (
                            <button
                              type="button"
                              className="text-[9px] uppercase tracking-widest text-red-400"
                              onClick={() => {
                                if (!window.confirm("Remove this member?"))
                                  return;
                                void removeOrgMember(m.id)
                                  .then(load)
                                  .catch((err) =>
                                    setMessage(
                                      err instanceof Error
                                        ? err.message
                                        : "Remove failed",
                                    ),
                                  );
                              }}
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
