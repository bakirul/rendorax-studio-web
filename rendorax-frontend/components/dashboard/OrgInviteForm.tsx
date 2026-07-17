"use client";

import { useState } from "react";
import {
  getOrgRoleLabel,
  inviteOrgMember,
  INVITABLE_ROLES,
  type ClientOrganizationRole,
} from "@/utils/clientOrganization";

type OrgInviteFormProps = {
  disabled?: boolean;
  compact?: boolean;
  onInvited?: (result: {
    inviteUrl: string;
    emailSent: boolean;
    emailDeliveryNote?: string;
  }) => void;
};

export default function OrgInviteForm({
  disabled = false,
  compact = false,
  onInvited,
}: OrgInviteFormProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<ClientOrganizationRole>("reviewer");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setBusy(true);
    setMessage(null);
    setInviteUrl(null);
    try {
      const result = await inviteOrgMember({
        email,
        displayName: displayName.trim() || undefined,
        role,
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
      onInvited?.({
        inviteUrl: result.inviteUrl,
        emailSent: result.emailSent,
        emailDeliveryNote: result.emailDeliveryNote,
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <form
        onSubmit={handleInvite}
        className={
          compact
            ? "grid grid-cols-1 gap-2"
            : "grid grid-cols-1 gap-2 border border-white/10 bg-[#121217] p-3 md:grid-cols-4"
        }
      >
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy || disabled}
          className="bg-[#0a0a0f] border border-white/10 p-2 text-sm text-white outline-none focus:border-[#d4af37]/50 disabled:opacity-50"
        />
        <input
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={busy || disabled}
          className="bg-[#0a0a0f] border border-white/10 p-2 text-sm text-white outline-none focus:border-[#d4af37]/50 disabled:opacity-50"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as ClientOrganizationRole)}
          disabled={busy || disabled}
          className="bg-[#0a0a0f] border border-white/10 p-2 text-sm text-white outline-none focus:border-[#d4af37]/50 disabled:opacity-50"
        >
          {INVITABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {getOrgRoleLabel(r)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy || disabled}
          className="bg-[#d4af37] text-black text-[10px] font-bold uppercase tracking-widest py-2 disabled:opacity-50"
        >
          {busy ? "…" : "Send Invitation"}
        </button>
      </form>

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
    </div>
  );
}
