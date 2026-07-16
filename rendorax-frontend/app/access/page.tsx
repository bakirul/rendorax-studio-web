"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

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
      const destination =
        data.user.app_metadata?.role === "admin" ? "/admin" : "/dashboard";
      setTimeout(() => {
        router.push(destination);
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col relative bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 relative">
        {/* Background Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <div className="w-full max-w-[450px] mx-auto bg-bg-panel p-8 md:p-12 border border-white/5 relative shadow-2xl">
        {/* Original Golden Top Border Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gold-primary/50"></div>

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

          {/* Hardware Accelerated Animation to prevent box shaking */}
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold-primary block mb-3 animate-pulse transform-gpu will-change-opacity">
            Secure Access Protocol
          </span>
          <h1 className="text-3xl md:text-4xl font-display text-white mb-2">
            Client Vault
          </h1>
        </div>

        {/* এরর বা সাকসেস মেসেজ */}
        {error && (
          <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono text-center relative z-10">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 border border-gold-primary/30 bg-gold-primary/10 text-gold-primary text-xs font-mono text-center relative z-10">
            {message}
          </div>
        )}

        <form
          onSubmit={handleLogin}
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
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-3 font-mono">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-4 text-white text-sm focus:border-gold-primary focus:bg-black focus:outline-none transition-colors"
              required
              disabled={loading}
              placeholder="••••••••"
            />
            <p className="mt-3 text-right">
              <Link
                href="/forgot-password"
                className="text-[10px] uppercase tracking-widest text-gold-primary hover:text-white"
              >
                Forgot Password?
              </Link>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-transparent border border-gold-primary text-gold-primary font-bold uppercase tracking-widest py-4 text-xs hover:bg-gold-primary hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
          >
            {loading ? (
              <>
                Authenticating{" "}
                <span className="animate-pulse transform-gpu">...</span>
              </>
            ) : (
              "Authenticate"
            )}
          </button>
        </form>
      </div>
      </div>
    </main>
  );
}
