"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import PasswordField from "@/components/PasswordField";
import { createClient } from "@/utils/supabase/client";
import {
  acceptInvite,
  getOrgRoleLabel,
  validateInviteToken,
  type ClientOrganizationRole,
} from "@/utils/clientOrganization";

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ClientOrganizationRole | "">("");
  const [accountExists, setAccountExists] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) {
        setError("Missing invitation token.");
        setStatus("invalid");
        setLoading(false);
        return;
      }
      const result = await validateInviteToken(token);
      if (cancelled) return;
      setStatus(result.status);
      if (result.error || result.status !== "valid") {
        setError(result.error || "Invalid invitation");
      } else {
        setOrgName(result.organizationName || "");
        setEmail(result.email || "");
        setRole((result.role as ClientOrganizationRole) || "");
        setDisplayName(result.displayName || "");
        setAccountExists(Boolean(result.accountExists));
      }
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvite({
        token,
        password,
        displayName: displayName.trim() || undefined,
      });
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setSuccess(true);
        setError(null);
        setTimeout(() => router.push("/access"), 1500);
        return;
      }
      setSuccess(true);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col relative bg-bg-body text-text-gray font-main overflow-x-hidden">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 py-12">
        <div className="w-full max-w-[480px] bg-bg-panel border border-white/5 p-8 relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gold-primary/50" />
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/assets/logo.svg"
                alt="Rendorax"
                width={120}
                height={60}
                className="h-[48px] w-auto mx-auto"
              />
            </Link>
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold-primary block mb-2">
              Organization invitation
            </span>
            <h1 className="text-2xl font-display text-white">Accept invite</h1>
          </div>

          {loading ? (
            <p className="text-center text-xs uppercase tracking-widest text-gold-primary">
              Validating…
            </p>
          ) : status !== "valid" ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <Link
                href="/access"
                className="text-[10px] uppercase tracking-widest text-gold-primary"
              >
                Go to sign in →
              </Link>
            </div>
          ) : success ? (
            <p className="text-sm text-emerald-400 text-center">
              Invitation accepted. Redirecting…
            </p>
          ) : (
            <form onSubmit={handleAccept} className="space-y-4">
              <div className="border border-white/5 bg-[#0a0a0f] px-3 py-3 text-sm">
                <p className="text-white">{orgName}</p>
                <p className="text-[11px] text-text-gray mt-1">
                  {email} · {role ? getOrgRoleLabel(role) : ""}
                </p>
                {accountExists ? (
                  <p className="text-[10px] text-amber-300 mt-2">
                    An account already exists for this email. Enter that password
                    to join the organization.
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1">
                  Display name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-[#0a0a0f] border border-white/10 p-2.5 text-sm text-white outline-none focus:border-gold-primary"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1">
                  Password *
                </label>
                  <PasswordField
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete={
                    accountExists ? "current-password" : "new-password"
                  }
                  className="w-full bg-[#0a0a0f] border border-white/10 p-2.5 text-sm text-white outline-none focus:border-gold-primary"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-text-gray mb-1">
                  Confirm password *
                </label>
                <PasswordField
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete={
                    accountExists ? "current-password" : "new-password"
                  }
                  className="w-full bg-[#0a0a0f] border border-white/10 p-2.5 text-sm text-white outline-none focus:border-gold-primary"
                />
              </div>
              {error ? (
                <p className="text-[11px] text-red-400" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gold-primary text-black text-[10px] font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-50"
              >
                {submitting ? "Accepting…" : "Accept invitation"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
