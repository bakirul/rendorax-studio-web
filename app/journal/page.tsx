"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

// Mock Data: Blog Posts (From your HTML files)
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
  const [activeCategory, setActiveCategory] = useState("All Articles");

  const filteredArticles =
    activeCategory === "All Articles"
      ? articles
      : articles.filter((article) => article.category === activeCategory);

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* 1. HERO SECTION */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
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

      {/* 2. HIGHLIGHTED PODCAST BANNER */}
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
            className="relative z-10 shrink-0 bg-transparent text-gold-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] border border-gold-primary hover:bg-gold-primary hover:text-black transition-all flex items-center gap-3"
          >
            <span>▶</span> Listen to Episodes
          </Link>
        </div>
      </section>

      {/* 3. BLOG FILTERS */}
      <div className="w-full max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-wrap items-center gap-4 md:gap-8 border-b border-white/5 pb-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 pb-2 border-b-2 ${
                activeCategory === category
                  ? "text-gold-primary border-gold-primary font-bold"
                  : "text-text-gray border-transparent hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 4. ARTICLES LIST */}
      <section className="w-full max-w-7xl mx-auto px-6 pb-32 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="group cursor-pointer flex flex-col"
            >
              <Link href={`/journal/${article.slug}`}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-gold-primary border border-gold-primary/30 px-2 py-1">
                    {article.category}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-text-gray/50 font-mono">
                    {article.readTime}
                  </span>
                </div>

                <h3 className="text-2xl md:text-3xl font-display text-white mb-4 group-hover:text-gold-primary transition-colors leading-snug">
                  {article.title}
                </h3>

                <p className="text-sm text-text-gray leading-relaxed mb-6 flex-grow">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                  <span className="text-[10px] uppercase tracking-widest text-text-gray/50 font-mono">
                    {article.date}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-white group-hover:text-gold-primary transition-colors flex items-center gap-2">
                    Read Article{" "}
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-20 text-text-gray text-sm uppercase tracking-widest">
            No articles found in this category.
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
