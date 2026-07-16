"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchClientOrganization,
  getOrgRoleLabel,
  inviteOrgMember,
  INVITABLE_ROLES,
  removeOrgMember,
  resendOrgInvitation,
  revokeOrgInvitation,
  updateOrgMemberRole,
  type ClientOrganizationResponse,
  type ClientOrganizationRole,
} from "@/utils/clientOrganization";

type Props = {
  organizationId: string;
};

/**
 * Compact Admin HQ support surface for client organization membership.
 * Reuses the same agency client-organization APIs (Admin may manage).
 */
export default function AdminOrganizationTeam({ organizationId }: Props) {
  const [data, setData] = useState<ClientOrganizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<ClientOrganizationRole>("reviewer");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const row = await fetchClientOrganization(organizationId);
      setData(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setInviteUrl(null);
    try {
      const result = await inviteOrgMember({
        email,
        displayName: displayName.trim() || undefined,
        role,
        organizationId,
      });
      setInviteUrl(result.inviteUrl);
      setMessage(
        result.emailSent
          ? "Invitation sent."
          : result.emailDeliveryNote ||
              "Invite created. Copy the link — email was not sent.",
      );
      setEmail("");
      setDisplayName("");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  const primary = data?.members.find((m) => m.role === "primary_contact");
  const approvers = (data?.members || []).filter(
    (m) => m.role === "approver" && m.status === "active",
  );

  return (
    <div className="border border-white/10 bg-bg-body">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-[9px] uppercase tracking-widest text-gold-primary">
          Organization Team
        </span>
        <span className="text-[10px] text-text-gray">
          {loading
            ? "…"
            : `${(data?.members || []).filter((m) => m.status !== "removed").length} members`}
          {open ? " ▾" : " ▸"}
        </span>
      </button>

      {open ? (
        <div className="px-3 pb-3 space-y-2 border-t border-white/5">
          {error ? (
            <p className="text-[10px] text-red-400">{error}</p>
          ) : null}
          {message ? (
            <p className="text-[10px] text-gold-primary">{message}</p>
          ) : null}
          {inviteUrl ? (
            <p className="text-[10px] text-white break-all select-all border border-white/10 p-2">
              {inviteUrl}
            </p>
          ) : null}

          <p className="text-[10px] text-text-gray">
            Primary:{" "}
            <span className="text-white">
              {primary?.displayName || primary?.email || "—"}
            </span>
            {approvers.length > 0 ? (
              <>
                {" "}
                · Approver
                {approvers.length > 1 ? "s" : ""}:{" "}
                <span className="text-white">
                  {approvers
                    .map((a) => a.displayName || a.email)
                    .join(", ")}
                </span>
              </>
            ) : null}
          </p>

          <form
            onSubmit={handleInvite}
            className="grid grid-cols-1 md:grid-cols-4 gap-2"
          >
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className="bg-bg-panel border border-white/10 p-2 text-xs text-white outline-none focus:border-gold-primary"
            />
            <input
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={busy}
              className="bg-bg-panel border border-white/10 p-2 text-xs text-white outline-none focus:border-gold-primary"
            />
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as ClientOrganizationRole)
              }
              disabled={busy}
              className="bg-bg-panel border border-white/10 p-2 text-xs text-white outline-none focus:border-gold-primary"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {getOrgRoleLabel(r)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy}
              className="bg-gold-primary text-black text-[9px] font-bold uppercase tracking-widest py-2 disabled:opacity-50"
            >
              Invite
            </button>
          </form>

          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {(data?.members || [])
              .filter((m) => m.status !== "removed")
              .map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-[10px] border border-white/5 px-2 py-1.5"
                >
                  <span className="text-white min-w-0 truncate">
                    {m.displayName || m.email}{" "}
                    <span className="text-text-gray">
                      · {getOrgRoleLabel(m.role)} · {m.status}
                    </span>
                  </span>
                  <span className="flex gap-2 shrink-0">
                    {m.status === "invited" ? (
                      <>
                        <button
                          type="button"
                          className="text-gold-primary uppercase tracking-widest"
                          onClick={() => {
                            const inv = data!.invitations.find(
                              (i) => i.email === m.email,
                            );
                            if (!inv) return;
                            void resendOrgInvitation(inv.id)
                              .then((r) => {
                                setInviteUrl(r.inviteUrl);
                                setMessage(
                                  r.emailSent
                                    ? "Resent."
                                    : "New link ready — email not sent.",
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
                          className="text-red-400 uppercase tracking-widest"
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
                      <>
                        <select
                          value={m.role}
                          onChange={(e) => {
                            void updateOrgMemberRole(
                              m.id,
                              e.target.value as ClientOrganizationRole,
                            ).then(load);
                          }}
                          className="bg-bg-panel border border-white/10 text-[10px] text-white p-0.5"
                        >
                          {INVITABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {getOrgRoleLabel(r)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="text-red-400 uppercase tracking-widest"
                          onClick={() => {
                            if (!window.confirm("Remove this member?")) return;
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
                      </>
                    ) : null}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
