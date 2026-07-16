"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import Navbar from "@/components/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      },
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage(
        "If an account exists for that email, a reset link has been sent. Check your inbox.",
      );
    }
    setLoading(false);
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
              Forgot Password
            </h1>
            <p className="text-xs text-text-gray mt-2">
              Enter your email and we will send a reset link.
            </p>
          </div>

          {error ? (
            <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono text-center relative z-10">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="mb-6 p-4 border border-gold-primary/30 bg-gold-primary/10 text-gold-primary text-xs font-mono text-center relative z-10">
              {message}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 relative z-10"
          >
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-3 font-mono">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-4 text-white text-sm focus:border-gold-primary focus:bg-black focus:outline-none transition-colors"
                required
                disabled={loading}
                placeholder="hello@brand.com"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-transparent border border-gold-primary text-gold-primary font-bold uppercase tracking-widest py-4 text-xs hover:bg-gold-primary hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs relative z-10">
            <Link
              href="/access"
              className="text-gold-primary hover:text-white uppercase tracking-widest text-[10px]"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
