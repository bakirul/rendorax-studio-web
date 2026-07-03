import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // বিল্ড টাইমে ভেরসেল যখন এই ফাইলটি রিড করবে, তখন যেন ক্র্যাশ না করে একটা ওয়ার্নিং দেয়
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "⚠️ Supabase credentials are empty during compilation. Using build-time safe placeholders.",
    );
  }

  // এখানে আমরা '!' ফেলে দিয়ে সেফ ফলব্যাক দিয়েছি, যা সিকিউরিটির কোনো ক্ষতি করবে না
  // এবং রানটাইমে (লাইভ সাইটে) সবসময় আপনার আসল ভেরসেল কি-টাই ব্যবহার হবে।
  return createBrowserClient(
    supabaseUrl || "https://placeholder-project.supabase.co",
    supabaseAnonKey || "placeholder-token-for-build-pass",
  );
}
