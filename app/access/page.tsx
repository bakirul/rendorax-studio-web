"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function AccessPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Supabase Auth এর মাধ্যমে লগইন চেক
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      setMessage("Authentication successful. Initializing vault...");
      // লগইন সফল হলে ড্যাশবোর্ডে রিডাইরেক্ট করবে
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative px-6">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold-primary blur-[150px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[450px] bg-bg-panel p-10 border border-white/5 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gold-primary/50"></div>

        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/assets/logo.png"
              alt="Kachna Media"
              width={120}
              height={60}
              className="h-[60px] w-auto mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-display text-text-white mb-2">
            The Client Vault
          </h1>
          <p className="text-[0.85rem] text-gold-primary uppercase tracking-[0.1em]">
            Secure Access Protocol
          </p>
        </div>

        {/* এরর বা সাকসেস মেসেজ দেখানোর জায়গা */}
        {error && (
          <div className="mb-6 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-3 border border-green-500/30 bg-green-500/10 text-green-400 text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[0.75rem] uppercase tracking-[0.1em] text-text-gray ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-bg-body border border-white/10 px-4 py-3 text-text-white focus:outline-none focus:border-gold-primary transition-colors"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[0.75rem] uppercase tracking-[0.1em] text-text-gray ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-bg-body border border-white/10 px-4 py-3 text-text-white focus:outline-none focus:border-gold-primary transition-colors"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-4 bg-transparent text-gold-primary px-6 py-4 text-[0.85rem] font-bold uppercase tracking-[0.15em] border border-gold-primary transition-all duration-400 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gold-primary hover:text-bg-body hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"}`}
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
        </form>
      </div>
    </main>
  );
}
