"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

// Mock Data for Portfolio Projects
const projects = [
  {
    id: 1,
    title: "Apex - The Summer Edge",
    category: "Commercial",
    service: "Color Grading & VFX",
    image:
      "https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=2071&auto=format&fit=crop",
    slug: "apex-summer-edge",
  },
  {
    id: 2,
    title: "Unseen Horizons",
    category: "Documentary",
    service: "Offline Edit & Mastering",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop",
    slug: "unseen-horizons",
  },
  {
    id: 3,
    title: "Channel X - News Intro",
    category: "Broadcast",
    service: "Motion Graphics",
    image:
      "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=2056&auto=format&fit=crop",
    slug: "channel-x-news",
  },
  {
    id: 4,
    title: "Urban Legends Vol. 2",
    category: "Animation",
    service: "Animation & Dubbing",
    image:
      "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop",
    slug: "urban-legends-2",
  },
  {
    id: 5,
    title: "Midnight Drive",
    category: "Commercial",
    service: "Full Post-Production",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2183&auto=format&fit=crop",
    slug: "midnight-drive",
  },
  {
    id: 6,
    title: "The Final Ascent",
    category: "Documentary",
    service: "Restoration & Color",
    image:
      "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1974&auto=format&fit=crop",
    slug: "final-ascent",
  },
];

const categories = [
  "All",
  "Commercial",
  "Documentary",
  "Broadcast",
  "Animation",
];

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((project) => project.category === activeCategory);

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      {/* Navigation */}
      <Navbar />

      {/* 1. PORTFOLIO HERO SECTION */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
          Selected Works
        </span>
        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] max-w-[800px] mb-8 text-white">
          Our{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-[#fff]">
            Masterpieces
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-[600px] font-light text-text-gray leading-relaxed">
          A curated selection of our finest broadcast edits, cinematic color
          grading, and dynamic motion sequences. Precision engineered for the
          big screen.
        </p>
      </header>

      {/* 2. FILTER SECTION */}
      <div className="w-full max-w-7xl mx-auto px-6 mb-16">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 border-y border-white/5 py-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 ${
                activeCategory === category
                  ? "text-gold-primary border-b border-gold-primary pb-1"
                  : "text-text-gray hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 3. PORTFOLIO GRID */}
      <section className="w-full max-w-7xl mx-auto px-6 pb-32 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {filteredProjects.map((project) => (
            <div key={project.id} className="group relative cursor-pointer">
              {/* Image Container with Cinematic Overlay */}
              <div className="relative w-full aspect-video overflow-hidden bg-bg-panel border border-white/5 mb-6">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-500 z-10"></div>

                {/* Fallback pattern if image fails to load, but using unsplash for demo */}
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover filter grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                />

                {/* Hover Badge */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="bg-gold-primary text-black text-[9px] font-bold uppercase tracking-widest px-3 py-1">
                    View Case Study
                  </span>
                </div>
              </div>

              {/* Text Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-display text-white mb-2 group-hover:text-gold-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-gray font-mono">
                    {project.service}
                  </p>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-text-gray/50 border border-white/10 px-2 py-1">
                  {project.category}
                </div>
              </div>

              {/* Hidden Link Area (Wrapped over the entire card) */}
              <Link
                href={`/portfolio/${project.slug}`}
                className="absolute inset-0 z-30"
              >
                <span className="sr-only">View {project.title}</span>
              </Link>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20 text-text-gray text-sm uppercase tracking-widest">
            No projects found in this category.
          </div>
        )}
      </section>

      {/* 4. CTA SECTION */}
      <section className="w-full py-24 text-center border-t border-white/5 bg-black/50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display text-white mb-6">
            Ready to craft your next visual story?
          </h2>
          <Link
            href="/contact"
            className="inline-block bg-gold-primary text-black px-10 py-4 text-[0.8rem] font-bold uppercase tracking-[0.15em] hover:bg-white transition-all duration-400"
          >
            Request a Quote
          </Link>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </main>
  );
}
