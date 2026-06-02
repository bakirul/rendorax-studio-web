// app/portfolio/[slug]/page.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image"; // Next.js Image Component ইমপোর্ট করা হলো
import { notFound } from "next/navigation";

// Real Data - Kachna Media Portfolio Projects
const projectsDetail = [
  {
    slug: "heroic-archives",
    title: "The Heroic Archives",
    client: "Internal / YouTube Original",
    role: "Lead Editor & Archival Mastering",
    duration: "Ongoing Series",
    year: "2025",
    heroImage:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop",
    challenge:
      "Producing cinematic, long-form (2-hour+) historical documentaries required an intensive local AI workflow to restore archival footage and maintain consistent visual fidelity across lengthy timelines without overwhelming the rendering pipeline.",
    solution:
      "Architected a custom ComfyUI production pipeline on a high-performance local RTX setup, integrating frame-by-frame upscaling and strict LUFS-compliant audio mastering for premium, broadcast-grade YouTube delivery.",
    videoUrl: "",
  },
  {
    slug: "voiced-classics",
    title: "Voiced Classics",
    client: "Internal / YouTube Original",
    role: "AI Dubbing & Motion Graphics",
    duration: "Ongoing Series",
    year: "2025",
    heroImage:
      "https://images.unsplash.com/photo-1516280440502-a7f4579c8789?q=80&w=2070&auto=format&fit=crop",
    challenge:
      "Bringing classic narratives to life demanded precise dialogue synchronization, character lip-matching, and generating custom cinematic branding assets that align with high-end audio-visual storytelling.",
    solution:
      "Deployed an advanced AI toolkit including Artistly.ai and CloneVoice.ai to generate pristine audio tracks and visuals. Seamlessly integrated these assets using strict timeline protocols for engaging viewer retention.",
  },
  {
    slug: "aurastream",
    title: "AuraStream",
    client: "Investor Demo",
    role: "Project Architecture & UI Presentation",
    duration: "Development Phase",
    year: "2026",
    heroImage:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop",
    challenge:
      "An upcoming movie streaming platform required a high-fidelity prototype and demo presentation to secure investor funding, demonstrating seamless video delivery architectures and intuitive content navigation.",
    solution:
      "Spearheaded the development phase utilizing modern deployment structures via Vercel and organized web project layouts under the Kachna Legacy team. Showcased the platform's potential with a visually stunning, user-centric demo.",
  },
  {
    slug: "kachnafit",
    title: "KachnaFit Platform",
    client: "KachnaFit",
    role: "Web & Revenue Integration",
    duration: "Continuous",
    year: "2025",
    heroImage:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop",
    challenge:
      "Establishing a robust digital presence that seamlessly integrates monetization systems and content management without disrupting the premium user experience.",
    solution:
      "Integrated Google Reader Revenue Manager into a secure WordPress framework, utilizing Wordfence and robust infrastructure management across multiple domains for highly scalable business operations.",
  },
  {
    slug: "pawprints-in-silence",
    title: "PawPrints In Silence",
    client: "Digital Property",
    role: "Video Editing & Content Pipeline",
    duration: "Continuous",
    year: "2025",
    heroImage:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=2069&auto=format&fit=crop",
    challenge:
      "Developing a consistent, high-quality video content pipeline for specialized dog training tutorials while seamlessly integrating affiliate marketing structures.",
    solution:
      "Created a streamlined video editing workflow for social and web delivery, paired with an optimized Amazon Associates integration to drive passive revenue while maintaining content authority.",
  },
];

// params এর টাইপ নির্ধারণ করে দেওয়া হলো (TypeScript Safety)
interface PageProps {
  params: {
    slug: string;
  };
}

export default function CaseStudyPage({ params }: PageProps) {
  // URL-এর slug অনুযায়ী নির্দিষ্ট প্রজেক্ট খুঁজে বের করা
  const project = projectsDetail.find((p) => p.slug === params.slug);

  // যদি প্রজেক্ট না পাওয়া যায়, তাহলে 404 Not Found পেজে পাঠিয়ে দেবে
  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-white font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* 1. HERO & METADATA SECTION */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-16">
        <div className="mb-10">
          <Link
            href="/portfolio"
            className="text-[10px] uppercase tracking-widest text-text-gray hover:text-white transition-colors flex items-center gap-2 w-max group"
          >
            <span className="text-gold-primary animate-pulse group-hover:animate-none">
              ←
            </span>
            Back to Selected Works
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

          {/* Next.js Image Component দিয়ে রেন্ডারিং আরও ফাস্ট করা হলো */}
          <Image
            src={project.heroImage}
            alt={project.title}
            fill
            priority
            className="w-full h-full object-cover filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
            sizes="(max-width: 1280px) 100vw, 1200px"
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
