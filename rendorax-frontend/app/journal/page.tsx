import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import JournalFilterArticles from "@/components/journal/JournalFilterArticles";

export const metadata: Metadata = {
  title: "Journal | Rendorax Studio",
  description:
    "Technical articles on broadcast audio, delivery formats, AI automation, and archival restoration from the Rendorax edit bay.",
};

const articles = [
  {
    id: 1,
    title: "Broadcast Audio: Surviving the LUFS Standard",
    category: "Audio Engineering",
    readTime: "6 Min Read",
    date: "May 10, 2026",
    excerpt:
      "Why your web-mix sounds terrible on TV. A deep dive into broadcast-safe audio leveling and LUFS metering protocols.",
    slug: "broadcast-loudness-standard",
  },
  {
    id: 2,
    title: "Master Export: Delivery Formats Explained",
    category: "Post-Production",
    readTime: "8 Min Read",
    date: "May 02, 2026",
    excerpt:
      "Understanding the difference between ProRes 422 HQ, DNxHR, and H.264 deliverables for different streaming platforms.",
    slug: "master-export-guide",
  },
  {
    id: 3,
    title: "Building Automated Pipelines with n8n & ComfyUI",
    category: "AI & Automation",
    readTime: "12 Min Read",
    date: "April 25, 2026",
    excerpt:
      "How we scale digital production and visual creation using local AI nodes and serverless automation.",
    slug: "automation-comfyui-n8n",
  },
  {
    id: 4,
    title: "Archival Restoration: Rescuing Legacy Footage",
    category: "Restoration",
    readTime: "5 Min Read",
    date: "April 18, 2026",
    excerpt:
      "Tape denoise, artifact removal, and AI upscaling techniques to preserve historical broadcast footage.",
    slug: "archival-restoration",
  },
];

const categories = [
  "All Articles",
  "Audio Engineering",
  "Post-Production",
  "AI & Automation",
  "Restoration",
];

export default function JournalPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6 animate-pulse">
          Knowledge Hub
        </span>
        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] max-w-[800px] mb-8 text-white">
          The Studio{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-[#fff]">
            Journal
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-[600px] font-light text-text-gray leading-relaxed">
          Technical breakdowns, broadcast standards, and industry insights
          straight from our senior edit bay.
        </p>
      </header>

      <section className="w-full max-w-7xl mx-auto px-6 mb-20">
        <div className="w-full bg-bg-panel border border-gold-primary/30 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-primary blur-[100px] opacity-10 pointer-events-none"></div>

          <div className="relative z-10 max-w-xl">
            <span className="bg-gold-primary text-black text-[9px] font-bold uppercase tracking-widest px-3 py-1 inline-block mb-4">
              🎙️ Now Streaming
            </span>
            <h2 className="text-2xl md:text-3xl font-display text-white mb-3">
              Voiced Classics Podcast
            </h2>
            <p className="text-sm text-text-gray">
              Prefer listening? Tune into our official podcast where we discuss
              the business and art of cinematic post-production.
            </p>
          </div>

          <Link
            href="/podcast"
            className="relative z-10 shrink-0 bg-transparent text-gold-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] border border-gold-primary hover:bg-gold-primary hover:text-black transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
          >
            <span>▶</span> Listen to Episodes
          </Link>
        </div>
      </section>

      <JournalFilterArticles articles={articles} categories={categories} />

      <Footer />
    </main>
  );
}
