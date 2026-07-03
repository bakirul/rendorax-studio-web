// hooks/useFeatureFlags.ts
import { useState, useEffect } from "react";

// আমাদের প্রোজেক্টের গ্লোবাল ফিচার ফ্ল্যাগ ইন্টারফেস
export interface FeatureFlags {
  enable_live_session: boolean;
  enable_picture_lock: boolean;
  enable_compare_mode: boolean;
}

// সেফ ফলব্যাক ডিফল্ট (যদি কোনো কারণে Redis ডাউন থাকে)
const defaultFlags: FeatureFlags = {
  enable_live_session: true,
  enable_picture_lock: true,
  enable_compare_mode: true,
};

export const useFeatureFlags = (userId?: string) => {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [isLoadingFlags, setIsLoadingFlags] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoadingFlags(false);
      return;
    }

    const fetchFlags = async () => {
      try {
        // 🚀 PROD: In production, this will hit your Upstash Redis edge function
        // const res = await fetch(`/api/features?userId=${userId}`);
        // const data = await res.json();
        // setFlags(data.flags);

        // 🧪 DEV: Simulating Ultra-low latency Redis response (10ms)
        setTimeout(() => {
          setFlags({
            enable_live_session: true, // টেস্টিংয়ের জন্য এটিকে false করে দেখতে পারেন
            enable_picture_lock: true,
            enable_compare_mode: true,
          });
          setIsLoadingFlags(false);
        }, 10);
      } catch (error) {
        console.error("Failed to fetch feature flags from Redis:", error);
        setFlags(defaultFlags); // Fallback to safe defaults
        setIsLoadingFlags(false);
      }
    };

    fetchFlags();
  }, [userId]);

  return { flags, isLoadingFlags };
};
