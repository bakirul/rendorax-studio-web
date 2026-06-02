import type { Metadata } from "next";
import { Manrope, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google"; // Analytics Import
import "@/app/globals.css";
import ChatbotWidget from "@/components/ChatbotWidget"; // Chatbot Widget
import GlobalLiveWidget from "@/components/GlobalLiveWidget";

// 1. Font Configurations
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-main",
  weight: ["300", "400", "500", "600"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// 2. Global SEO & Metadata Configuration
export const metadata: Metadata = {
  title: "Kachna Media | Broadcast Post-Production Studio",
  description:
    "A premium broadcast post-production studio based in Dhaka, Bangladesh.",
  metadataBase: new URL("https://kachnamedia.com"),
  verification: {
    google: "uW6t6pYp1f9lFbxO92cq6s47acjHD8Zsor39tU-7hWU", // Google Site Verification Code
  },
};

// 3. Main Root Layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${manrope.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {/* আপনার ওয়েবসাইটের মূল কন্টেন্ট */}
        {children}

        {/* Google Analytics */}
        <GoogleAnalytics gaId="G-8F29XVWGML" />

        {/* 🔥 আমাদের গ্লোবাল প্রিমিয়াম AI চ্যাটবট */}
        <ChatbotWidget />
        <GlobalLiveWidget />
      </body>
    </html>
  );
}
