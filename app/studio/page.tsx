import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function StudioPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* 1. STUDIO HERO SECTION */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
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
          {/* Image Placeholder */}
          <div className="w-full aspect-[4/5] bg-bg-panel border border-white/5 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gold-primary/5 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
            {/* Replace with your actual studio or profile image */}
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
              alt="Studio Edit Bay"
              className="w-full h-full object-cover filter grayscale-[50%] group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute bottom-6 left-6 z-20">
              <span className="bg-black/80 backdrop-blur-sm border border-white/10 text-white text-[10px] uppercase tracking-widest px-4 py-2">
                H M Bakirul Islam - Lead Editor
              </span>
            </div>
          </div>

          {/* Biography & Experience */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-display text-white mb-6">
              Shaped by the rigor of Live Broadcast.
            </h2>

            <p className="text-sm leading-relaxed text-text-gray font-light">
              The foundation of Kachna Media is built upon over 16 years of
              relentless experience in the high-pressure broadcast television
              industry. Operating entirely as a self-educated professional
              without relying on institutional degrees, the focus has always
              been on raw skill, speed, and uncompromising broadcast standards.
            </p>

            <p className="text-sm leading-relaxed text-text-gray font-light">
              From managing dynamic environments as a Live Action Co-ordinator
              at Nayantara Communications to overseeing complex cinematic
              documentary timelines, every project benefits from a deep-rooted
              understanding of editorial compliance, narrative pacing, and
              audience psychology.
            </p>

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-gold-primary font-bold">
                <span>16+ Years Industry Experience</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                <span>Self-Educated Precision</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TECHNICAL INFRASTRUCTURE (Studio Specs) */}
      <section className="w-full border-y border-white/5 bg-black/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
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
            <div className="bg-bg-panel border border-white/5 p-10 hover:border-gold-primary/30 transition-colors">
              <div className="text-gold-primary mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
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
              <h3 className="text-lg text-white uppercase tracking-widest mb-3">
                Compute Core
              </h3>
              <ul className="space-y-2 text-sm text-text-gray font-mono text-[11px] uppercase tracking-wider">
                <li>Intel Core i9 (10th Generation)</li>
                <li>NVIDIA GeForce RTX 3050 GPU</li>
                <li>32GB High-Speed RAM</li>
                <li>NVMe SSD Storage Arrays</li>
              </ul>
            </div>

            {/* AI & Automation */}
            <div className="bg-bg-panel border border-white/5 p-10 hover:border-gold-primary/30 transition-colors">
              <div className="text-gold-primary mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <h3 className="text-lg text-white uppercase tracking-widest mb-3">
                Automation & AI
              </h3>
              <ul className="space-y-2 text-sm text-text-gray font-mono text-[11px] uppercase tracking-wider">
                <li>n8n Workflow Automation</li>
                <li>ComfyUI Visual Generation</li>
                <li>Docker Containerization</li>
                <li>Artistly.ai / CloneVoice.ai</li>
              </ul>
            </div>

            {/* Delivery & Security */}
            <div className="bg-bg-panel border border-white/5 p-10 hover:border-gold-primary/30 transition-colors">
              <div className="text-gold-primary mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="text-lg text-white uppercase tracking-widest mb-3">
                Client Operations
              </h3>
              <ul className="space-y-2 text-sm text-text-gray font-mono text-[11px] uppercase tracking-wider">
                <li>Secure Client Vault Protocol</li>
                <li>Encrypted Asset Transfer</li>
                <li>Real-time Progress Dashboard</li>
                <li>Broadcast-Safe Mastering</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA SECTION */}
      <section className="w-full py-32 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-display text-white mb-6">
            Ready to utilize our infrastructure?
          </h2>
          <Link
            href="/contact"
            className="inline-block bg-gold-primary text-black px-10 py-4 text-[0.8rem] font-bold uppercase tracking-[0.15em] hover:bg-white transition-all duration-400"
          >
            Book Studio Time
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
