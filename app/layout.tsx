import type { Metadata } from "next";
import { Manrope, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google"; // Analytics import
import "./globals.css"; // নিশ্চিত করুন এই ফাইলটি app ফোল্ডারে আছে

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
export const metadata = {
  title: "Kachna Media | Broadcast Post-Production Studio",
  description:
    "A premium broadcast post-production studio based in Dhaka, Bangladesh.",
  metadataBase: new URL("https://kachnamedia.com"),
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
        {/* Google Analytics - আইডিটি বসান */}
        <GoogleAnalytics gaId="G-8F29XVWGML" />
      </body>
    </html>
  );
}
