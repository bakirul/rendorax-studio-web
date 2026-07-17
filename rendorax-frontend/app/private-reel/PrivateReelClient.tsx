"use client";

import { useState, useTransition } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordField from "@/components/PasswordField";
import { lockPrivateReel, verifyPrivateReelPasscode } from "./actions";

type PrivateReelClientProps = {
  initialUnlocked: boolean;
};

export default function PrivateReelClient({
  initialUnlocked,
}: PrivateReelClientProps) {
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    startTransition(async () => {
      const result = await verifyPrivateReelPasscode(passcode);

      if (result.success) {
        setIsUnlocked(true);
        setPasscode("");
        setError(false);
      } else {
        setError(true);
        setPasscode("");
      }
    });
  };

  const handleLock = () => {
    startTransition(async () => {
      await lockPrivateReel();
      setIsUnlocked(false);
      setPasscode("");
      setError(false);
    });
  };

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <div className="flex-grow flex flex-col items-center justify-center pt-32 pb-24 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        {!isUnlocked ? (
          <div className="w-full max-w-md bg-bg-panel border border-white/5 p-10 md:p-14 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-primary to-transparent opacity-50"></div>

            <div className="w-16 h-16 mx-auto border border-gold-primary/30 flex items-center justify-center mb-8 rounded-full bg-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d4af37"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <h1 className="text-2xl font-display text-white mb-2">
              Confidential Reel
            </h1>
            <p className="text-xs text-text-gray font-mono mb-8 uppercase tracking-widest">
              Restricted Access
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <PasswordField
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter Access Code"
                  disabled={isPending}
                  autoComplete="off"
                  className={`w-full bg-black border ${error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-gold-primary"} p-4 text-center text-sm text-white outline-none transition-colors tracking-[0.3em] font-mono disabled:opacity-50`}
                />
                {error && (
                  <p className="text-[10px] uppercase tracking-widest text-red-400 mt-3 font-mono">
                    Access Denied. Invalid Code.
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gold-primary text-black font-bold uppercase tracking-widest py-4 text-xs hover:bg-white transition-colors disabled:opacity-50"
              >
                {isPending ? "Verifying…" : "Authenticate"}
              </button>
            </form>

            <p className="text-[9px] text-text-gray/50 uppercase tracking-widest mt-8">
              Protected by Rendorax Security
            </p>
          </div>
        ) : (
          <div className="w-full max-w-5xl mx-auto animate-fade-in">
            <div className="text-center mb-10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-primary border border-gold-primary/30 px-3 py-1 inline-block mb-6">
                Access Granted
              </span>
              <h1 className="text-3xl md:text-5xl font-display text-white mb-4">
                Director&apos;s Cut 2026
              </h1>
              <p className="text-sm text-text-gray font-light max-w-2xl mx-auto">
                This material contains unreleased grading passes and
                confidential broadcast edits. Do not record or distribute.
              </p>
            </div>

            <div className="w-full aspect-video bg-black border border-white/10 relative group flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.05)]">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>

              <div className="relative z-10 w-20 h-20 rounded-full border border-white/20 flex items-center justify-center bg-black/50 backdrop-blur-md cursor-pointer group-hover:border-gold-primary group-hover:scale-110 transition-all duration-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="#d4af37"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>

              <div className="absolute bottom-6 right-6 z-10 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
                Rendorax Internal
              </div>
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={handleLock}
                disabled={isPending}
                className="text-[10px] uppercase tracking-widest text-text-gray border-b border-text-gray hover:text-white hover:border-white transition-colors pb-1 disabled:opacity-50"
              >
                Lock Vault & Exit
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
