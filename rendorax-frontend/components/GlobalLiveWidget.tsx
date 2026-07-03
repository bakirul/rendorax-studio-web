"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import LiveSessionWidget from "./LiveSessionWidget";
import LiveSessionToolbar from "./dashboard/LiveSessionToolbar";

export default function GlobalLiveWidget({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // ইউজারের বর্তমান পেজ ট্র্যাক করার জন্য

  useEffect(() => {
    const supabase = createClient();

    // ইউজার চেক করা
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    // অথেন্টিকেশন স্ট্যাটাস চেঞ্জ লিসেনার
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return; // লগইন না থাকলে সকেট কানেক্ট হবে না

    const newSocket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
    );
    setSocket(newSocket);

    newSocket.on("connect", () => {
      // গ্লোবাল লবিতে জয়েন করবে
      newSocket.emit("join-lobby", user.id);
    });

    newSocket.on("connect_error", (err) => {
      console.warn("⚠️ [GlobalLiveWidget] Socket connection failed. Ensure NEXT_PUBLIC_BACKEND_URL is set in production:", err.message);
      // We don't throw here to avoid crashing the React tree
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // পেজ লোড হওয়ার সময় কিছু দেখাবে না
  if (loading) return null;

  const isDashboard = pathname === "/dashboard";

  // 🚀 যদি ইউজার লগইন করা না থাকে (Fake/Global Button)
  if (!user) {
    return (
      <div className="fixed bottom-6 left-6 z-[100]">
        <button
          onClick={() => {
            alert("Please log in to start a Live Session or Chat with AI.");
            router.push("/access"); // লগইন পেজে পাঠিয়ে দেবে
          }}
          className="flex items-center gap-2 px-5 py-3 bg-[#d4af37] hover:bg-[#b8952b] text-black font-bold text-xs uppercase rounded-full tracking-widest shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Start Live Session
        </button>
      </div>
    );
  }

  // Removed dashboard conditional rendering to allow global Live Session across entire app

  const containerClass = isEmbedded
    ? isDashboard
      ? "flex flex-col gap-2 w-full mt-auto max-md:hidden"
      : "flex flex-col gap-2 w-full mt-auto"
    : isDashboard
      ? "fixed bottom-6 left-6 z-[100] [&>div]:!bottom-0 [&>div]:!left-0 [&>div]:!right-auto [&>div]:!items-start flex flex-col gap-2 md:hidden"
      : "fixed bottom-6 left-6 z-[100] [&>div]:!bottom-0 [&>div]:!left-0 [&>div]:!right-auto [&>div]:!items-start flex flex-col gap-2";

  return (
    <div className={containerClass}>
      {!isEmbedded && !isDashboard && <LiveSessionToolbar />}
      {socket && (
        <LiveSessionWidget socket={socket} roomId="global-lobby" user={user} />
      )}
    </div>
  );
}
