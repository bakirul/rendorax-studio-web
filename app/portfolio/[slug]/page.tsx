import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";

// Mock Data - (বাস্তবে এটি Supabase থেকে আসবে)
const projectsDetail = [
  {
    slug: "apex-summer-edge",
    title: "Apex - The Summer Edge",
    client: "Apex Footwear Ltd.",
    role: "Color Grading & VFX",
    duration: "4 Weeks",
    year: "2025",
    heroImage:
      "https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=2071&auto=format&fit=crop",
    challenge:
      "The client wanted a vibrant, high-contrast summer look that maintained natural skin tones while making the product colors pop aggressively on broadcast television.",
    solution:
      "We utilized a node-based ACES workflow in DaVinci Resolve, isolating specific color vectors for the products and applying a custom film emulation LUT to tie the cinematic summer vibe together seamlessly.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
  },
  {
    slug: "unseen-horizons",
    title: "Unseen Horizons",
    client: "National Geographic TV",
    role: "Offline Edit & Mastering",
    duration: "3 Months",
    year: "2025",
    heroImage:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop",
    challenge:
      "Over 50 hours of raw wildlife footage needed to be condensed into a gripping 45-minute narrative, maintaining strict pacing and compliance with broadcast loudness standards (-23 LUFS).",
    solution:
      "Implemented a structured bin-organization protocol and paper edit. Handled rigorous audio mapping and delivered final masters in ProRes 422 HQ with discrete multichannel audio stems.",
  },
  // অন্যান্য প্রজেক্টগুলো এখানে যোগ করা যাবে...
];

export default function CaseStudyPage({
  params,
}: {
  params: { slug: string };
}) {
  // URL-এর slug অনুযায়ী নির্দিষ্ট প্রজেক্ট খুঁজে বের করা
  const project = projectsDetail.find((p) => p.slug === params.slug);

  // যদি প্রজেক্ট না পাওয়া যায়, তাহলে 404 Not Found পেজে পাঠিয়ে দেবে
  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-white font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* 1. HERO & METADATA SECTION */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-16">
        <div className="mb-10">
          <Link
            href="/portfolio"
            className="text-[10px] uppercase tracking-widest text-text-gray hover:text-gold-primary transition-colors flex items-center gap-2"
          >
            <span>←</span> Back to Selected Works
          </Link>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display leading-[1.1] mb-12">
          {project.title}
        </h1>

        {/* Project Meta Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-b border-white/10 py-8">
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-text-gray mb-1">
              Client
            </span>
            <span className="font-mono text-sm">{project.client}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-text-gray mb-1">
              Studio Role
            </span>
            <span className="font-mono text-sm text-gold-primary">
              {project.role}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-text-gray mb-1">
              Timeline
            </span>
            <span className="font-mono text-sm">{project.duration}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-text-gray mb-1">
              Release Year
            </span>
            <span className="font-mono text-sm">{project.year}</span>
          </div>
        </div>
      </header>

      {/* 2. CINEMATIC HERO IMAGE / VIDEO PLACEHOLDER */}
      <section className="w-full max-w-7xl mx-auto px-6 mb-24">
        <div className="w-full aspect-video bg-bg-panel border border-white/5 relative overflow-hidden group">
          {project.videoUrl ? (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 group-hover:bg-black/30 transition-all cursor-pointer">
              <div className="w-20 h-20 rounded-full border border-gold-primary/50 flex items-center justify-center bg-black/50 backdrop-blur-sm group-hover:scale-110 group-hover:border-gold-primary transition-all">
                <span className="text-gold-primary text-2xl ml-1">▶</span>
              </div>
            </div>
          ) : null}
          <img
            src={project.heroImage}
            alt={project.title}
            className="w-full h-full object-cover filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
          />
        </div>
      </section>

      {/* 3. CASE STUDY BRIEF (CHALLENGE VS SOLUTION) */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {/* The Challenge */}
          <div className="relative">
            <span className="text-[100px] font-display text-white/5 absolute -top-12 -left-6 pointer-events-none select-none">
              01
            </span>
            <h3 className="text-xl font-display text-gold-primary mb-6 uppercase tracking-widest relative z-10">
              The Challenge
            </h3>
            <p className="text-text-gray text-sm md:text-base leading-relaxed font-light">
              {project.challenge}
            </p>
          </div>

          {/* The Approach / Solution */}
          <div className="relative">
            <span className="text-[100px] font-display text-white/5 absolute -top-12 -left-6 pointer-events-none select-none">
              02
            </span>
            <h3 className="text-xl font-display text-gold-primary mb-6 uppercase tracking-widest relative z-10">
              Our Approach
            </h3>
            <p className="text-text-gray text-sm md:text-base leading-relaxed font-light">
              {project.solution}
            </p>
          </div>
        </div>
      </section>

      {/* 4. NEXT PROJECT / CTA */}
      <section className="w-full py-20 border-t border-white/5 text-center bg-black/40">
        <span className="text-[10px] uppercase tracking-widest text-text-gray block mb-4">
          Require Similar Results?
        </span>
        <h2 className="text-3xl md:text-5xl font-display mb-8">
          Let's discuss your next production.
        </h2>
        <Link
          href="/contact"
          className="inline-block bg-transparent text-gold-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] border border-gold-primary hover:bg-gold-primary hover:text-black transition-all"
        >
          Book Studio Time
        </Link>
      </section>

      <Footer />
    </main>
  );
}
