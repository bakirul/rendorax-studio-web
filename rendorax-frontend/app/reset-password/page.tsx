"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import Navbar from "@/components/Navbar";
import PasswordField from "@/components/PasswordField";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    const establishRecoverySession = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (!cancelled) {
              setSessionError(exchangeError.message);
              setReady(true);
            }
            return;
          }
          window.history.replaceState({}, document.title, "/reset-password");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled) {
          if (!session) {
            setSessionError(
              "This reset link is invalid or has expired. Request a new link.",
            );
          }
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setSessionError("Unable to verify reset session.");
          setReady(true);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionError(null);
        setReady(true);
      }
    });

    void establishRecoverySession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    await supabase.auth.signOut();
  };

  return (
    <main className="min-h-screen flex flex-col relative bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none" />

        <div className="w-full max-w-[450px] mx-auto bg-bg-panel p-8 md:p-12 border border-white/5 relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gold-primary/50" />

          <div className="text-center mb-10 relative z-10">
            <Link href="/" className="inline-block mb-8">
              <Image
                src="/assets/logo.svg"
                alt="Rendorax"
                width={120}
                height={60}
                className="h-[60px] w-auto mx-auto"
              />
            </Link>
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold-primary block mb-3">
              Account Recovery
            </span>
            <h1 className="text-3xl md:text-4xl font-display text-white mb-2">
              {success ? "Password Updated" : "Reset Password"}
            </h1>
          </div>

          {!ready ? (
            <p className="text-center text-xs text-text-gray relative z-10">
              Verifying reset link…
            </p>
          ) : success ? (
            <div className="relative z-10 text-center space-y-6">
              <p className="text-sm text-emerald-400">
                Your password has been updated. Sign in with your new password.
              </p>
              <Link
                href="/access"
                className="inline-block w-full bg-transparent border border-gold-primary text-gold-primary font-bold uppercase tracking-widest py-4 text-xs hover:bg-gold-primary hover:text-black transition-colors"
              >
                Go To Login
              </Link>
            </div>
          ) : sessionError ? (
            <div className="relative z-10 space-y-6">
              <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono text-center">
                {sessionError}
              </div>
              <Link
                href="/forgot-password"
                className="block text-center text-[10px] uppercase tracking-widest text-gold-primary hover:text-white"
              >
                Request a new reset link
              </Link>
            </div>
          ) : (
            <>
              {error ? (
                <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono text-center relative z-10">
                  {error}
                </div>
              ) : null}

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-6 relative z-10"
              >
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-3 font-mono">
                    New Password *
                  </label>
                  <PasswordField
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-white text-sm focus:border-gold-primary focus:bg-black focus:outline-none transition-colors"
                    required
                    disabled={loading}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-3 font-mono">
                    Confirm Password *
                  </label>
                  <PasswordField
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 p-4 text-white text-sm focus:border-gold-primary focus:bg-black focus:outline-none transition-colors"
                    required
                    disabled={loading}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-transparent border border-gold-primary text-gold-primary font-bold uppercase tracking-widest py-4 text-xs hover:bg-gold-primary hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? "Updating…" : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
