// components/GlobalLiveWidget.tsx
"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import LiveSessionWidget from "./LiveSessionWidget"; // আপনার মূল উইজেট

export default function GlobalLiveWidget() {
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
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
    );
    setSocket(newSocket);

    newSocket.on("connect", () => {
      // গ্লোবাল লবিতে জয়েন করবে
      newSocket.emit("join-lobby", user.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // পেজ লোড হওয়ার সময় কিছু দেখাবে না
  if (loading) return null;

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

  // 🚀 যদি ইউজার লগইন করা থাকে (Actual Widget)
  // (ড্যাশবোর্ড পেজে আমরা আলাদাভাবে ফাইলের জন্য উইজেট রেন্ডার করি, তাই গ্লোবালটা ড্যাশবোর্ডে হাইড রাখতে পারি, অথবা ড্যাশবোর্ড থেকে মুছে শুধু গ্লোবালটা ব্যবহার করতে পারি)
  if (pathname === "/dashboard") {
    return null; // ড্যাশবোর্ডে আমরা ভিডিও স্পেসিফিক উইজেট ব্যবহার করছি
  }

  return (
    <div className="fixed bottom-6 left-6 z-[100] [&>div]:!bottom-0 [&>div]:!left-0 [&>div]:!right-auto [&>div]:!items-start">
      {socket && (
        <LiveSessionWidget socket={socket} roomId="global-lobby" user={user} />
      )}
    </div>
  );
}
