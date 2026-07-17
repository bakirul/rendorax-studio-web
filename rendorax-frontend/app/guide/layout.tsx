import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GuideNav from "@/components/guide/GuideNav";

export const metadata: Metadata = {
  title: "Guide Center | Rendorax Studio",
  description:
    "User guide for Rendorax Studio — Client, Editor, and Admin workflows from Project to Delivery and Archive.",
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 sm:pb-20 flex-grow">
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[min(100vw,360px)] sm:w-[480px] h-[min(100vw,360px)] sm:h-[480px] bg-gold-primary blur-[140px] sm:blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 sm:gap-10 lg:gap-14 items-start">
          <aside className="lg:sticky lg:top-28 border border-white/5 bg-[#121418]/80 p-4 sm:p-5 lg:p-6 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white mb-6 font-display">
              Guide Center
            </p>
            <GuideNav />
          </aside>

          <div className="min-w-0 border border-white/5 bg-[#121418]/60 p-4 sm:p-6 md:p-10 overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
