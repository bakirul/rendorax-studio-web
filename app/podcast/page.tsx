import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

// Mock Data for Podcast Episodes
const episodes = [
  {
    id: 1,
    number: "003",
    title: "Scaling Post-Production: AI Workflows & Automation",
    date: "May 15, 2026",
    duration: "45 Min",
    description:
      "Discussing how to integrate modern AI automation tools like ComfyUI and n8n into a traditional broadcast-grade pipeline without losing the cinematic touch.",
    audioUrl: "#",
  },
  {
    id: 2,
    number: "002",
    title: "The Heroic Archives: Crafting 2-Hour Cinematic Docs",
    date: "April 28, 2026",
    duration: "1 Hr 12 Min",
    description:
      "A deep dive into the editorial discipline, pacing, and strict timeline architectures required to keep audiences engaged in long-form cinematic documentaries.",
    audioUrl: "#",
  },
  {
    id: 3,
    number: "001",
    title: "Broadcast Audio: Surviving the LUFS Standard",
    date: "April 10, 2026",
    duration: "38 Min",
    description:
      "Why your web-mix sounds terrible on TV. We break down broadcast-safe audio leveling, LUFS metering, and essential sound design protocols.",
    audioUrl: "#",
  },
];

export default function PodcastPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* 1. HERO SECTION */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
          Official Studio Podcast
        </span>
        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] max-w-[800px] mb-8 text-white">
          Voiced{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-[#fff]">
            Classics
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-[600px] font-light text-text-gray leading-relaxed mb-10">
          Conversations on the art, technical discipline, and business of
          high-end broadcast post-production. Listen to industry insights
          straight from the edit bay.
        </p>

        {/* Platform Links */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="#"
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 text-xs uppercase tracking-widest text-white hover:border-gold-primary hover:text-gold-primary transition-all"
          >
            <span>🎧</span> Spotify
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 text-xs uppercase tracking-widest text-white hover:border-gold-primary hover:text-gold-primary transition-all"
          >
            <span>🍎</span> Apple Podcasts
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 text-xs uppercase tracking-widest text-white hover:border-[#FF0000] hover:text-[#FF0000] transition-all"
          >
            <span>▶️</span> YouTube
          </Link>
        </div>
      </header>

      {/* 2. LATEST EPISODE HIGHLIGHT */}
      <section className="w-full max-w-5xl mx-auto px-6 mb-24">
        <div className="bg-bg-panel border border-white/5 p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-primary blur-[80px] opacity-20 pointer-events-none"></div>

          <span className="bg-gold-primary text-black text-[9px] font-bold uppercase tracking-widest px-3 py-1 inline-block mb-6">
            Latest Episode
          </span>

          <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
            {episodes[0].title}
          </h2>
          <p className="text-sm text-text-gray mb-8 max-w-2xl leading-relaxed">
            {episodes[0].description}
          </p>

          {/* Custom Audio Player UI (Visual Placeholder) */}
          <div className="flex items-center gap-6 bg-black border border-white/10 p-4">
            <button className="w-12 h-12 rounded-full bg-gold-primary text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <div className="flex-grow">
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-text-gray mb-2 font-mono">
                <span>00:00</span>
                <span>{episodes[0].duration}</span>
              </div>
              <div className="w-full h-1 bg-white/10 relative cursor-pointer">
                <div className="absolute top-0 left-0 h-full w-1/3 bg-gold-primary"></div>
                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EPISODE ARCHIVE */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-32">
        <h3 className="text-sm uppercase tracking-widest text-gold-primary mb-8 border-b border-white/10 pb-4">
          Episode Archive
        </h3>

        <div className="space-y-4">
          {episodes.slice(1).map((ep) => (
            <div
              key={ep.id}
              className="flex flex-col md:flex-row gap-6 p-6 border border-white/5 bg-bg-panel hover:border-gold-primary/30 transition-all cursor-pointer group"
            >
              <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-black border border-white/10 group-hover:border-gold-primary/50 transition-colors">
                <span className="text-[10px] text-text-gray uppercase tracking-widest">
                  EP
                </span>
                <span className="text-xl font-display text-white group-hover:text-gold-primary">
                  {ep.number}
                </span>
              </div>

              <div className="flex-grow flex flex-col justify-center">
                <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-text-gray mb-2 font-mono">
                  <span>{ep.date}</span>
                  <span className="text-gold-primary/50">•</span>
                  <span>{ep.duration}</span>
                </div>
                <h4 className="text-xl font-display text-white mb-2 group-hover:text-gold-primary transition-colors">
                  {ep.title}
                </h4>
                <p className="text-sm text-text-gray line-clamp-2">
                  {ep.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-center md:px-4 hidden sm:flex">
                <button className="w-10 h-10 rounded-full border border-white/20 text-white flex items-center justify-center group-hover:bg-gold-primary group-hover:text-black group-hover:border-gold-primary transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="text-[10px] uppercase tracking-widest text-text-gray border-b border-text-gray hover:text-white hover:border-white transition-colors pb-1">
            Load More Episodes
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
