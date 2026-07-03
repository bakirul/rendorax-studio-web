import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Manrope, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const ChatbotWidget = dynamic(() => import("@/components/ChatbotWidget"), {
  ssr: false,
});

const GlobalLiveWidget = dynamic(() => import("@/components/GlobalLiveWidget"), {
  ssr: false,
});

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

export const metadata: Metadata = {
  title: "Rendorax Studio | Broadcast Post-Production",
  description:
    "Enterprise-level broadcast post-production, live cinematic collaboration, and Vault management.",
  icons: {
    icon: "/assets/logo.svg",
  },
  openGraph: {
    title: "Rendorax Studio",
    description:
      "Enterprise-level broadcast post-production and live cinematic collaboration.",
    url: "https://rendorax.com",
    siteName: "Rendorax Studio",
    type: "website",
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

        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-8F29XVWGML"} />

        <ChatbotWidget />
        <GlobalLiveWidget />
      </body>
    </html>
  );
}
