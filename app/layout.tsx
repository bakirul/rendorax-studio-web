import type { Metadata } from "next";
import { Manrope, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
    "A premium broadcast post-production studio based in Dhaka, Bangladesh. Specializing in cinematic editing, strict LUFS-compliant audio mastering, color grading, and AI automated workflows.",
  keywords: [
    "Broadcast Post-Production",
    "Video Editing Studio Dhaka",
    "Cinematic Documentary Editing",
    "Audio Mastering LUFS",
    "Kachna Media",
    "H M Bakirul Islam",
    "Commercial Video Editing",
    "Post-Production Agency Bangladesh",
  ],
  authors: [{ name: "Kachna Media Limited" }],
  creator: "Kachna Media",
  publisher: "Kachna Media",
  metadataBase: new URL("https://kachnamedia.com"), // আপনার অরিজিনাল ডোমেইন এখানে বসাবেন

  // Open Graph (For LinkedIn, Facebook, WhatsApp Preview)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kachnamedia.com",
    title: "Kachna Media | Broadcast Post-Production",
    description:
      "Premium post-production facility ensuring broadcast compliance, strict editorial pacing, and master delivery.",
    siteName: "Kachna Media",
    images: [
      {
        url: "/og-image.jpg", // public ফোল্ডারে এই নামের একটি 1200x630 সাইজের ছবি রাখতে হবে
        width: 1200,
        height: 630,
        alt: "Kachna Media Studio Setup",
      },
    ],
  },

  // Twitter / X Card
  twitter: {
    card: "summary_large_image",
    title: "Kachna Media | Post-Production Studio",
    description: "Broadcast-grade editorial and finishing studio.",
    images: ["/og-image.jpg"],
  },
};

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
        {children}
      </body>
    </html>
  );
}
