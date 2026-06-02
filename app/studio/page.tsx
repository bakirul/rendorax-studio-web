import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

export default function StudioPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* 1. STUDIO HERO SECTION */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6 animate-pulse">
          Inside Kachna Media
        </span>
        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] max-w-[800px] mb-8 text-white">
          The{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-[#fff]">
            Edit Bay
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-[600px] font-light text-text-gray leading-relaxed mb-10">
          More than just a post-production house. We are a collective of strict
          broadcast disciplines, cinematic storytelling, and advanced
          AI-automated workflows.
        </p>
      </header>

      {/* 2. THE LEGACY & LEADERSHIP (Founder's Background) */}
      <section className="w-full max-w-7xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Enhanced Image Placeholder */}
          <div className="w-full aspect-[4/5] bg-bg-panel border border-white/5 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gold-primary/10 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none"></div>

            {/* Note: Using standard <img> tag as provided, but Next.js <Image> is recommended for production */}
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
              alt="Studio Edit Bay"
              className="w-full h-full object-cover filter grayscale-[70%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-in-out"
            />

            <div className="absolute bottom-6 left-6 z-20">
              <span className="bg-black/90 backdrop-blur-md border border-white/10 text-white text-[10px] uppercase tracking-widest px-5 py-3 inline-block shadow-xl">
                H M Bakirul Islam{" "}
                <span className="text-gold-primary mx-2">|</span> Lead Editor
              </span>
            </div>
          </div>

          {/* Biography & Experience */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-display text-white mb-6 leading-tight">
              Shaped by the rigor of <br />{" "}
              <span className="text-gold-primary">Live Broadcast.</span>
            </h2>

            <p className="text-base leading-relaxed text-text-gray font-light">
              The foundation of Kachna Media is built upon over 16 years of
              relentless experience in the high-pressure broadcast television
              industry. Operating entirely as a self-educated professional
              without relying on institutional degrees, the focus has always
              been on raw skill, speed, and uncompromising broadcast standards.
            </p>

            <p className="text-base leading-relaxed text-text-gray font-light">
              From managing dynamic environments as a Live Action Co-ordinator
              at Nayantara Communications to overseeing complex cinematic
              documentary timelines, every project benefits from a deep-rooted
              understanding of editorial compliance, narrative pacing, and
              audience psychology.
            </p>

            <div className="pt-8 mt-8 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-gold-primary font-bold">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-primary"></span>
                  16+ Years Industry Experience
                </span>
                <span className="hidden md:inline-block w-px h-4 bg-white/20"></span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-primary"></span>
                  Self-Educated Precision
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TECHNICAL INFRASTRUCTURE (Studio Specs) */}
      <section className="w-full border-y border-white/5 bg-black/40 py-24 relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-5 z-0"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-4">
              Hardware & Pipeline
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-white">
              The Infrastructure
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Compute Power */}
            <div className="bg-bg-panel border border-white/5 p-10 hover:border-gold-primary/40 hover:-translate-y-2 transition-all duration-500 group">
              <div className="text-gold-primary mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                  <rect x="9" y="9" width="6" height="6"></rect>
                  <line x1="9" y1="1" x2="9" y2="4"></line>
                  <line x1="15" y1="1" x2="15" y2="4"></line>
                  <line x1="9" y1="20" x2="9" y2="23"></line>
                  <line x1="15" y1="20" x2="15" y2="23"></line>
                  <line x1="20" y1="9" x2="23" y2="9"></line>
                  <line x1="20" y1="14" x2="23" y2="14"></line>
                  <line x1="1" y1="9" x2="4" y2="9"></line>
                  <line x1="1" y1="14" x2="4" y2="14"></line>
                </svg>
              </div>
              <h3 className="text-lg text-white font-display uppercase tracking-widest mb-4">
                Compute Core
              </h3>
              <ul className="space-y-3 text-text-gray font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> Intel Core i9
                  (10th Gen)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> NVIDIA GeForce
                  RTX 3050
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> 32GB High-Speed
                  RAM
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> NVMe SSD Storage
                  Arrays
                </li>
              </ul>
            </div>

            {/* AI & Automation */}
            <div className="bg-bg-panel border border-white/5 p-10 hover:border-gold-primary/40 hover:-translate-y-2 transition-all duration-500 group">
              <div className="text-gold-primary mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <h3 className="text-lg text-white font-display uppercase tracking-widest mb-4">
                Automation & AI
              </h3>
              <ul className="space-y-3 text-text-gray font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> n8n Workflow
                  Automation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> ComfyUI Visual
                  Generation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> Docker
                  Containerization
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> Artistly /
                  CloneVoice.ai
                </li>
              </ul>
            </div>

            {/* Delivery & Security */}
            <div className="bg-bg-panel border border-white/5 p-10 hover:border-gold-primary/40 hover:-translate-y-2 transition-all duration-500 group">
              <div className="text-gold-primary mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="text-lg text-white font-display uppercase tracking-widest mb-4">
                Client Operations
              </h3>
              <ul className="space-y-3 text-text-gray font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> Secure Client
                  Vault Protocol
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> Encrypted Asset
                  Transfer
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> Real-time
                  Progress Dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-primary">▸</span> Broadcast-Safe
                  Mastering
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA SECTION */}
      <section className="w-full py-32 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-gold-primary blur-[150px] opacity-10 -z-10 rounded-full pointer-events-none"></div>
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-display text-white mb-10">
            Ready to utilize our infrastructure?
          </h2>
          <Link
            href="/contact"
            className="inline-block bg-transparent border border-gold-primary text-gold-primary px-10 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gold-primary hover:text-black transition-all duration-400 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
          >
            Book Studio Time
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
