import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";

// Mock Database: Professional English Content for Technical Articles
const articlesData = [
  {
    slug: "broadcast-loudness-standard",
    title: "Broadcast Audio: Surviving the LUFS Standard",
    category: "Audio Engineering",
    date: "May 10, 2026",
    readTime: "6 Min Read",
    author: "H M Bakirul Islam",
    bgGlow: "from-gold-primary/10",
    content: (
      <>
        <p className="text-base md:text-lg text-text-gray font-light leading-relaxed mb-6">
          In the world of television broadcasting, audio leveling is not merely
          a creative choice; it is a strict legal compliance. When cinematic
          videos are delivered from web platforms directly to satellite
          channels, the audio mix often falls apart. This is primarily due to
          the unregulated freedom of the web versus the stringent{" "}
          <strong>LUFS (Loudness Units Full Scale)</strong> standards of
          broadcasting.
        </p>

        <h3 className="text-2xl font-display text-white mt-10 mb-4">
          The Global Standard: -23 LUFS vs -14 LUFS
        </h3>
        <p className="text-sm md:text-base text-text-gray font-light leading-relaxed mb-6">
          OTT and web platforms like YouTube or Spotify typically maintain a
          loudness level of -14 to -15 LUFS, with a peak level of -1 dBTP.
          However, when generating a master file for a television network, the
          global standard (such as EBU R128 or ATSC A/85) strictly dictates a
          target of <strong>-23 LUFS (or -24 LKFS)</strong>, with a maximum true
          peak level restricted to -2.0 dBTP.
        </p>

        <div className="bg-bg-panel border-l-2 border-gold-primary p-6 my-8 font-mono text-xs uppercase tracking-wider text-gold-primary/90">
          ⚠️ CRITICAL PROTOCOL: If the True Peak exceeds -2.0 dBTP in even a
          single frame, automated broadcast servers will instantly reject your
          content.
        </div>

        <h3 className="text-2xl font-display text-white mt-10 mb-4">
          Our Studio's Mastering Rules
        </h3>
        <p className="text-sm md:text-base text-text-gray font-light leading-relaxed mb-4">
          To ensure a broadcast-safe mix, we rigorously apply the following
          three protocols to every timeline:
        </p>
        <ul className="list-decimal pl-5 space-y-3 text-sm md:text-base text-text-gray font-light mb-8">
          <li>
            <strong>Dialogue Isolation:</strong> Before mixing background scores
            and VFX sounds, dialogue is isolated and locked precisely at -24
            LUFS.
          </li>
          <li>
            <strong>Gating Protocol:</strong> To prevent silent sections from
            providing false readings on the loudness meter, a gating radar is
            implemented.
          </li>
          <li>
            <strong>True Peak Limiting:</strong> The ceiling of the final master
            limiter is permanently fixed at -2.0 dBTP.
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "master-export-guide",
    title: "Master Export: Delivery Formats Explained",
    category: "Post-Production",
    date: "May 02, 2026",
    readTime: "8 Min Read",
    author: "H M Bakirul Islam",
    bgGlow: "from-blue-500/5",
    content: (
      <>
        <p className="text-base md:text-lg text-text-gray font-light leading-relaxed mb-6">
          Following the Picture Lock phase, a senior editor's most critical
          responsibility is generating the master export in the exact required
          format. Incorrect export configurations can permanently destroy a
          production's color space, dynamic range, and overall integrity.
        </p>
        <h3 className="text-2xl font-display text-white mt-10 mb-4">
          ProRes 422 HQ vs. OTT Deliverables
        </h3>
        <p className="text-sm md:text-base text-text-gray font-light leading-relaxed mb-6">
          For broadcast master files and cinematic archiving, our studio's
          standard protocol requires <strong>Apple ProRes 422 HQ</strong> or{" "}
          <strong>DNxHR HQX</strong> (10-bit color depth). This ensures 100%
          preservation of visual information and grading data. However, for
          theatrical distribution or OTT platform submissions, textless masters
          and discrete multi-channel audio stems must be meticulously rendered
          on separate tracks.
        </p>
      </>
    ),
  },
  {
    slug: "automation-comfyui-n8n",
    title: "Building Automated Pipelines with n8n & ComfyUI",
    category: "AI & Automation",
    date: "April 25, 2026",
    readTime: "12 Min Read",
    author: "Kachna Dev Core",
    bgGlow: "from-purple-500/5",
    content: (
      <>
        <p className="text-base md:text-lg text-text-gray font-light leading-relaxed mb-6">
          To aggressively scale digital production, we have engineered advanced
          AI workflows integrated directly into our local infrastructure. We
          utilize ComfyUI for node-based visual generation and the n8n
          automation platform to govern backend logic and asset distribution.
        </p>
        <h3 className="text-2xl font-display text-white mt-10 mb-4">
          Docker & Local Compute Power
        </h3>
        <p className="text-sm md:text-base text-text-gray font-light leading-relaxed mb-6">
          The entire pipeline is encapsulated within Docker containers, ensuring
          the backend system can utilize 100% of our local GPU (RTX 3050) and
          CPU compute resources without facing dependency conflicts.
          Consequently, generated production assets are processed by AI models
          and seamlessly routed to our secure client vaults automatically.
        </p>
      </>
    ),
  },
];

export default function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = articlesData.find((a) => a.slug === params.slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* 1. ARTICLE HERO SECTION */}
      <header className="relative w-full max-w-4xl mx-auto px-6 pt-32 pb-12">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-b ${article.bgGlow} to-transparent blur-[150px] -z-10 rounded-full pointer-events-none`}
        ></div>

        <div className="mb-8">
          <Link
            href="/journal"
            className="text-[10px] uppercase tracking-widest text-text-gray/60 hover:text-gold-primary transition-colors flex items-center gap-2"
          >
            <span>←</span> Back to Journal
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-4 text-[10px] uppercase tracking-widest font-mono">
          <span className="text-gold-primary border border-gold-primary/30 px-2 py-0.5">
            {article.category}
          </span>
          <span className="text-text-gray/40">•</span>
          <span>{article.date}</span>
          <span className="text-text-gray/40">•</span>
          <span>{article.readTime}</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-display text-white leading-tight mb-6">
          {article.title}
        </h1>

        <div className="flex items-center gap-3 border-b border-white/5 pb-8">
          <div className="w-6 h-6 rounded-full bg-gold-primary/20 border border-gold-primary/40 flex items-center justify-center text-[10px] text-gold-primary font-bold">
            K
          </div>
          <span className="text-xs uppercase tracking-wider text-text-white font-medium">
            By {article.author}
          </span>
        </div>
      </header>

      {/* 2. MAIN ARTICLE BODY */}
      <section className="w-full max-w-3xl mx-auto px-6 pb-24 flex-grow">
        <article className="prose prose-invert max-w-none">
          {article.content}
        </article>

        {/* Article Footer Info */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-xs text-text-gray/50">
            Published officially by{" "}
            <span className="text-white">Kachna Media Compliance HQ</span>.
          </div>
          <Link
            href="/contact"
            className="text-[10px] uppercase tracking-widest text-gold-primary border border-gold-primary/20 px-4 py-2 hover:bg-gold-primary hover:text-black transition-all font-bold"
          >
            Consult our Team
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
