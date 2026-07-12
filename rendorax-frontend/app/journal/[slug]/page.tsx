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
    metaDescription:
      "Broadcast audio must meet strict LUFS and true peak limits. Learn -23 LUFS targets, dialogue isolation, gating, and mastering rules for TV delivery.",
    content: (
      <>
        <p className="text-base md:text-lg text-text-gray font-light leading-relaxed mb-6">
          In the world of television broadcasting, audio leveling is not merely
          a creative choice; it is a strict legal compliance. When cinematic
          videos are delivered from web platforms directly to satellite
          channels, the audio mix often falls apart. This is primarily due to
          the unregulated freedom of the web versus the stringent{" "}
          <strong className="text-white">
            LUFS (Loudness Units Full Scale)
          </strong>{" "}
          standards of broadcasting.
        </p>

        <h3 className="text-2xl font-display text-white mt-10 mb-4">
          The Global Standard: -23 LUFS vs -14 LUFS
        </h3>
        <p className="text-sm md:text-base text-text-gray font-light leading-relaxed mb-6">
          OTT and web platforms like YouTube or Spotify typically maintain a
          loudness level of -14 to -15 LUFS, with a peak level of -1 dBTP.
          However, when generating a master file for a television network, the
          global standard (such as EBU R128 or ATSC A/85) strictly dictates a
          target of{" "}
          <strong className="text-white">-23 LUFS (or -24 LKFS)</strong>, with a
          maximum true peak level restricted to -2.0 dBTP.
        </p>

        <div className="bg-bg-panel border-l-2 border-gold-primary p-6 my-8 font-mono text-xs uppercase tracking-wider text-gold-primary/90 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
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
            <strong className="text-white">Dialogue Isolation:</strong> Before
            mixing background scores and VFX sounds, dialogue is isolated and
            locked precisely at -24 LUFS.
          </li>
          <li>
            <strong className="text-white">Gating Protocol:</strong> To prevent
            silent sections from providing false readings on the loudness meter,
            a gating radar is implemented.
          </li>
          <li>
            <strong className="text-white">True Peak Limiting:</strong> The
            ceiling of the final master limiter is permanently fixed at -2.0
            dBTP.
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
    bgGlow: "from-blue-500/10",
    metaDescription:
      "Master export formats after Picture Lock: ProRes 422 HQ, DNxHR HQX, textless masters, and multi-channel stems for broadcast and OTT delivery.",
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
          standard protocol requires{" "}
          <strong className="text-white">Apple ProRes 422 HQ</strong> or{" "}
          <strong className="text-white">DNxHR HQX</strong> (10-bit color
          depth). This ensures 100% preservation of visual information and
          grading data. However, for theatrical distribution or OTT platform
          submissions, textless masters and discrete multi-channel audio stems
          must be meticulously rendered on separate tracks.
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
    author: "Rendorax Dev Core",
    bgGlow: "from-purple-500/10",
    metaDescription:
      "Automate post-production with ComfyUI node workflows, n8n orchestration, Dockerized local GPU compute, and secure routing of assets to client vaults.",
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
  {
    slug: "archival-restoration",
    title: "Archival Restoration: Rescuing Legacy Footage",
    category: "Restoration",
    date: "April 18, 2026",
    readTime: "5 Min Read",
    author: "H M Bakirul Islam",
    bgGlow: "from-green-500/10",
    metaDescription:
      "Rescue legacy tape and film with digitization, noise reduction, and AI upscaling—preserving authentic grain while clearing scanlines and chroma artifacts.",
    content: (
      <>
        <p className="text-base md:text-lg text-text-gray font-light leading-relaxed mb-6">
          History is often trapped on degrading magnetic tape. Rescuing legacy
          footage is not just a technical process—it is a preservation of our
          visual heritage. Our studio specializes in the meticulous restoration
          of aged media, bringing clarity to material that was once thought lost
          to time.
        </p>
        <h3 className="text-2xl font-display text-white mt-10 mb-4">
          Protocols for Preservation
        </h3>
        <p className="text-sm md:text-base text-text-gray font-light leading-relaxed mb-6">
          The restoration workflow involves three critical stages:{" "}
          <strong>digitization</strong>,<strong>noise reduction</strong>, and{" "}
          <strong>AI-enhanced upscaling</strong>. By utilizing adaptive
          filtering and frame-interpolation, we remove tape artifacts (like
          scanlines and chroma noise) while preserving the original film grain
          to maintain an authentic cinematic feel.
        </p>
      </>
    ),
  },
];

export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = articlesData.find((a) => a.slug === params.slug);

  if (!article) {
    notFound();
  }

  return {
    title: `${article.title} | Rendorax Journal`,
    description: article.metaDescription,
    alternates: {
      canonical: `/journal/${params.slug}`,
    },
  };
}

export default function BlogArticlePage({ params }) {
  const article = articlesData.find((a) => a.slug === params.slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <header className="relative w-full max-w-4xl mx-auto px-6 pt-32 pb-12">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-b ${article.bgGlow} to-transparent blur-[150px] -z-10 rounded-full pointer-events-none`}
        ></div>

        <div className="mb-8">
          <Link
            href="/journal"
            className="text-[10px] uppercase tracking-widest text-text-gray/60 hover:text-gold-primary transition-colors flex items-center gap-2 w-max group"
          >
            <span className="transform transition-transform duration-300 group-hover:-translate-x-1 animate-pulse group-hover:animate-none">
              ←
            </span>
            Back to Journal
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
          <div className="w-8 h-8 rounded-full bg-gold-primary/10 border border-gold-primary/30 flex items-center justify-center text-[10px] text-gold-primary font-bold" aria-hidden="true">
            R
          </div>
          <span className="text-xs uppercase tracking-wider text-text-white font-medium">
            By {article.author}
          </span>
        </div>
      </header>

      <section className="w-full max-w-3xl mx-auto px-6 pb-24 flex-grow">
        <article className="prose prose-invert prose-p:font-light prose-headings:font-display max-w-none">
          {article.content}
        </article>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-xs text-text-gray/50 font-mono uppercase tracking-widest">
            Compliance HQ © 2026
          </div>
          <Link
            href="/contact"
            className="text-[10px] uppercase tracking-widest text-gold-primary border border-gold-primary/20 px-6 py-3 hover:bg-gold-primary hover:text-black transition-all font-bold shadow-[0_0_10px_rgba(212,175,55,0.05)]"
          >
            Consult our Team
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
